# Order Service

Manages the complete order lifecycle, real-time order tracking via Server-Sent Events (SSE), and revenue calculation. Handles order creation, status updates, and provides real-time updates for kitchen and waitstaff.

## 🎯 Overview

The Order service is responsible for:
- Order creation and management
- Order status lifecycle management
- Real-time order updates via SSE
- Order item price snapshots
- Revenue calculation and reporting

## ✨ Features

- **Order Lifecycle Management**: Complete order status workflow
- **Real-time Updates**: Server-Sent Events (SSE) for live order tracking
- **Price Snapshots**: Order items store product name and price at time of order
- **Revenue Calculation**: Track revenue per store, per day, per period
- **Order History**: Complete order history with status changes
- **Multi-tenant Support**: Orders isolated by store

## 🗄️ Database Schema

### Tables

- **`orders`**: Order headers
  - `id`, `store_id`, `customer_name`, `customer_phone`, `status`, `payment_method`, `payment_status`, `total_amount`, `created_at`, `updated_at`

- **`order_items`**: Order line items
  - `id`, `order_id`, `product_id`, `product_name`, `price_at_time`, `quantity`, `subtotal`, `created_at`

## 📊 Order Status Flow

```
PENDING → CONFIRMED → PREPARING → READY → SERVING → DONE
                              ↓
                          CANCELLED
```

### Status Descriptions

| Status | Description |
|--------|-------------|
| **PENDING** | Order created, awaiting confirmation by staff |
| **CONFIRMED** | Order confirmed by restaurant staff |
| **PREPARING** | Kitchen is preparing the order |
| **READY** | Order is ready for serving |
| **SERVING** | Order is being served to customer |
| **DONE** | Order completed successfully |
| **CANCELLED** | Order cancelled (can occur at any stage) |

## 📡 API Endpoints

All endpoints are accessible via Gateway at `http://localhost:8080/api/order/`

### Order Management

**Create Order**
```bash
POST /api/order/orders?storeId={storeId}
Content-Type: application/json

{
  "customerName": "John Doe",
  "customerPhone": "+84123456789",
  "items": [
    {
      "productId": "product-uuid",
      "productName": "Spring Rolls",
      "priceAtTime": 50000,
      "quantity": 2
    }
  ],
  "paymentMethod": "CASH"
}

Response:
{
  "id": "order-uuid",
  "storeId": "store-uuid",
  "status": "PENDING",
  "totalAmount": 100000,
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Get Order Details**
```bash
GET /api/order/orders/{orderId}

Response:
{
  "id": "order-uuid",
  "storeId": "store-uuid",
  "customerName": "John Doe",
  "status": "CONFIRMED",
  "totalAmount": 100000,
  "items": [
    {
      "id": "item-uuid",
      "productName": "Spring Rolls",
      "priceAtTime": 50000,
      "quantity": 2,
      "subtotal": 100000
    }
  ],
  "createdAt": "2024-01-01T10:00:00Z"
}
```

**Get Store Orders**
```bash
GET /api/order/stores/{storeId}/orders

Response:
[
  {
    "id": "order-uuid",
    "status": "CONFIRMED",
    "totalAmount": 100000,
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

**Get Orders by Status**
```bash
GET /api/order/stores/{storeId}/orders/status/{status}

# Example: Get all pending orders
GET /api/order/stores/{storeId}/orders/status/PENDING
```

**Update Order Status**
```bash
PUT /api/order/orders/{orderId}/status?status=CONFIRMED

Response:
{
  "id": "order-uuid",
  "status": "CONFIRMED",
  "updatedAt": "2024-01-01T10:05:00Z"
}
```

### Real-time Updates

**SSE Stream for Order Updates**
```bash
GET /api/order/stores/{storeId}/orders/stream

# This endpoint returns Server-Sent Events
# Connect using EventSource in JavaScript:

const eventSource = new EventSource(
  `http://localhost:8080/api/order/stores/${storeId}/orders/stream`
);

eventSource.onmessage = (event) => {
  const order = JSON.parse(event.data);
  console.log('Order update:', order);
};
```

## 🔄 Order Lifecycle Example

1. **Customer places order** → Status: `PENDING`
2. **Staff confirms order** → Status: `CONFIRMED` (SSE event sent)
3. **Kitchen starts preparing** → Status: `PREPARING` (SSE event sent)
4. **Order ready** → Status: `READY` (SSE event sent)
5. **Serving customer** → Status: `SERVING` (SSE event sent)
6. **Order completed** → Status: `DONE` (SSE event sent)

## 💰 Revenue Calculation

The service tracks:
- Total revenue per store
- Revenue by date range
- Revenue by order status
- Average order value

## 🔒 Security

### Multi-tenant Isolation

- All queries filter by `store_id`
- Orders are isolated per store
- No cross-store data access

### Public Endpoints

- Order creation is public (for customer orders)
- Order status updates can be public or require authentication (configurable)
- SSE streams are public (consider adding authentication in production)

## 🚀 Running the Service

### Prerequisites
- PostgreSQL (running on port 5432 or via Docker)

### With Docker

```bash
# From project root
docker-compose up -d order
```

### Local Development

```bash
# Start PostgreSQL
docker-compose up -d postgres-order

# Run the service
./mvnw spring-boot:run
```

The service will start on http://localhost:8083

## ⚙️ Configuration

### Environment Variables

```yaml
# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/order_db
SPRING_DATASOURCE_USERNAME: restaurant_saas
SPRING_DATASOURCE_PASSWORD: restaurant_saas_pass
```

### Application Configuration

See `src/main/resources/application.yml` for:
- Database connection settings
- HikariCP connection pooling
- JPA/Hibernate settings
- SSE configuration

## 🗄️ Database Migrations

Liquibase migrations are located in:
```
src/main/resources/db/changelog/
```

Migrations include:
- Initial schema creation
- Index creation for performance
- Foreign key constraints

## 🧪 Testing

### Manual Testing

**1. Create an order:**
```bash
curl -X POST "http://localhost:8080/api/order/orders?storeId={storeId}" \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "John Doe",
    "customerPhone": "+84123456789",
    "items": [
      {
        "productId": "product-uuid",
        "productName": "Spring Rolls",
        "priceAtTime": 50000,
        "quantity": 2
      }
    ],
    "paymentMethod": "CASH"
  }'
```

**2. Update order status:**
```bash
curl -X PUT "http://localhost:8080/api/order/orders/{orderId}/status?status=CONFIRMED"
```

**3. Get store orders:**
```bash
curl http://localhost:8080/api/order/stores/{storeId}/orders
```

**4. Test SSE stream (in browser console):**
```javascript
const eventSource = new EventSource(
  'http://localhost:8080/api/order/stores/{storeId}/orders/stream'
);

eventSource.onmessage = (event) => {
  console.log('Order update:', JSON.parse(event.data));
};
```

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres-order
   ```

2. Check connection string in `application.yml`

3. Verify database exists:
   ```bash
   docker-compose exec postgres-order psql -U restaurant_saas -d order_db
   ```

### SSE Issues

- Verify SSE endpoint is accessible
- Check browser console for connection errors
- Ensure proper CORS configuration
- Test with EventSource or curl

### Order Status Updates

- Verify status transitions are valid
- Check order exists before updating
- Ensure proper error handling

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8083/actuator/health
```

### Logs

```bash
# Docker
docker-compose logs -f order

# Local
tail -f logs/spring.log
```

## 🚀 Performance Considerations

1. **Database Indexing**: Ensure indexes on `store_id`, `status`, `created_at`
2. **SSE Connections**: Monitor active SSE connections
3. **Connection Pooling**: HikariCP configured for optimal performance
4. **Order History**: Consider archiving old orders

## 🔐 Production Considerations

1. **SSE Authentication**: Add authentication for SSE streams
2. **Rate Limiting**: Implement rate limiting for order creation
3. **Order Validation**: Validate order data before creation
4. **Price Snapshots**: Ensure prices are captured correctly
5. **Error Handling**: Comprehensive error handling and logging

---

**Part of the Restaurant Menu SaaS Platform**
