# Payment Service

Handles subscription payments and order payments via VNPay integration. Manages subscription lifecycle, payment transactions, and provides payment gateway callbacks.

## 🎯 Overview

The Payment service is responsible for:
- Subscription management (TRIAL, ACTIVE, EXPIRED, CANCELLED)
- VNPay payment gateway integration
- Payment transaction tracking
- Subscription and order payment processing
- Payment callback handling

## ✨ Features

- **Subscription Management**: Complete subscription lifecycle
- **VNPay Integration**: Payment gateway for subscriptions and orders
- **Payment Tracking**: All payment transactions logged
- **Trial Periods**: Automatic 7-day trial for new stores
- **Subscription Renewal**: Handle subscription renewals
- **Order Payments**: Process payments for individual orders
- **Payment Callbacks**: Handle VNPay payment callbacks

## 🗄️ Database Schema

### Tables

- **`subscriptions`**: Store subscription information
  - `id`, `store_id`, `status`, `plan_type`, `start_date`, `end_date`, `trial_end_date`, `created_at`, `updated_at`

- **`payment_transactions`**: All payment transactions
  - `id`, `store_id`, `subscription_id` (nullable), `order_id` (nullable), `transaction_type`, `amount`, `currency`, `payment_method`, `status`, `vnpay_transaction_id`, `created_at`, `updated_at`

## 📊 Subscription Status

| Status | Description |
|--------|-------------|
| **TRIAL** | 7-day trial period active |
| **ACTIVE** | Paid subscription active |
| **EXPIRED** | Subscription expired, payment required |
| **CANCELLED** | Subscription cancelled |

## 💳 Payment Methods

- **CASH**: Cash payment (for orders)
- **VNPAY**: Online payment via VNPay gateway (for subscriptions and orders)

## 📡 API Endpoints

All endpoints are accessible via Gateway at `http://localhost:8080/api/payment/`

### Subscription Management

**Create Subscription Payment Request**
```bash
POST /api/payment/subscriptions/pay?storeId={storeId}
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "planType": "MONTHLY",
  "amount": 500000
}

Response:
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "transactionId": "transaction-uuid"
}
```

**Process Subscription Payment**
```bash
POST /api/payment/subscriptions/{subscriptionId}/pay
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "paymentMethod": "VNPAY",
  "amount": 500000
}
```

**Get Subscription Status**
```bash
GET /api/payment/subscriptions?storeId={storeId}
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "id": "subscription-uuid",
  "storeId": "store-uuid",
  "status": "ACTIVE",
  "planType": "MONTHLY",
  "startDate": "2024-01-01",
  "endDate": "2024-02-01"
}
```

### Order Payments

**Process Order Payment**
```bash
POST /api/payment/orders/{orderId}/pay
Content-Type: application/json

{
  "paymentMethod": "VNPAY",
  "amount": 100000
}

Response:
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "transactionId": "transaction-uuid"
}
```

### VNPay Callback

**VNPay Payment Callback (Public)**
```bash
GET /api/payment/vnpay/callback?vnp_Amount=10000000&vnp_BankCode=NCB&vnp_ResponseCode=00&...

# This endpoint is called by VNPay after payment
# Response redirects to success/failure page
```

### Transaction History

**Get Payment Transactions**
```bash
GET /api/payment/transactions?storeId={storeId}
Authorization: Bearer YOUR_JWT_TOKEN

Response:
[
  {
    "id": "transaction-uuid",
    "transactionType": "SUBSCRIPTION",
    "amount": 500000,
    "status": "SUCCESS",
    "createdAt": "2024-01-01T10:00:00Z"
  }
]
```

## 🔄 Payment Flow

### Subscription Payment Flow

1. **User initiates subscription** → Create payment request
2. **Generate VNPay URL** → Redirect user to VNPay
3. **User completes payment** → VNPay processes payment
4. **VNPay callback** → Service receives callback
5. **Verify payment** → Validate payment signature
6. **Update subscription** → Set status to ACTIVE
7. **Create transaction record** → Log payment transaction

### Order Payment Flow

1. **Customer places order** → Order created in Order service
2. **Customer chooses VNPay** → Create payment request
3. **Redirect to VNPay** → Customer completes payment
4. **VNPay callback** → Service receives callback
5. **Update order payment status** → Mark order as paid
6. **Create transaction record** → Log payment transaction

## 🔐 VNPay Integration

### Configuration

Set these environment variables:

```yaml
VNPAY_TMN_CODE: your-merchant-code
VNPAY_HASH_SECRET: your-hash-secret
VNPAY_URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL: http://localhost:3000/payment/callback
VNPAY_API_URL: https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

### Payment URL Generation

The service generates secure payment URLs with:
- Merchant code
- Transaction amount
- Transaction reference
- Secure hash (HMAC SHA512)

### Callback Verification

All callbacks are verified using:
- HMAC SHA512 signature verification
- Transaction reference validation
- Amount validation

## 🚀 Running the Service

### Prerequisites
- PostgreSQL (running on port 5432 or via Docker)
- VNPay credentials (for production)

### With Docker

```bash
# From project root
docker-compose up -d payment
```

### Local Development

```bash
# Start PostgreSQL
docker-compose up -d postgres-payment

# Run the service
./mvnw spring-boot:run
```

The service will start on http://localhost:8084

## ⚙️ Configuration

### Environment Variables

```yaml
# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/payment_db
SPRING_DATASOURCE_USERNAME: restaurant_saas
SPRING_DATASOURCE_PASSWORD: restaurant_saas_pass

# VNPay
VNPAY_TMN_CODE: your-merchant-code
VNPAY_HASH_SECRET: your-hash-secret
VNPAY_URL: https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL: http://localhost:3000/payment/callback
VNPAY_API_URL: https://sandbox.vnpayment.vn/merchant_webapi/api/transaction
```

### Application Configuration

See `src/main/resources/application.yml` for:
- Database connection settings
- HikariCP connection pooling
- VNPay configuration
- JPA/Hibernate settings

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

**1. Create subscription payment:**
```bash
curl -X POST "http://localhost:8080/api/payment/subscriptions/pay?storeId={storeId}" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "planType": "MONTHLY",
    "amount": 500000
  }'
```

**2. Process order payment:**
```bash
curl -X POST http://localhost:8080/api/payment/orders/{orderId}/pay \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "VNPAY",
    "amount": 100000
  }'
```

**3. Get transactions:**
```bash
curl http://localhost:8080/api/payment/transactions?storeId={storeId} \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### VNPay Sandbox Testing

1. Use VNPay sandbox credentials
2. Test payment flow end-to-end
3. Verify callback handling
4. Check transaction records

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres-payment
   ```

2. Check connection string in `application.yml`

3. Verify database exists:
   ```bash
   docker-compose exec postgres-payment psql -U restaurant_saas -d payment_db
   ```

### VNPay Integration Issues

- Verify VNPay credentials are correct
- Check hash secret matches VNPay configuration
- Verify return URL is accessible
- Check VNPay sandbox/test environment

### Payment Callback Issues

- Verify callback URL is publicly accessible
- Check signature verification logic
- Ensure proper error handling
- Log all callback requests for debugging

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8084/actuator/health
```

### Logs

```bash
# Docker
docker-compose logs -f payment

# Local
tail -f logs/spring.log
```

## 🔐 Security Considerations

1. **Hash Secret**: Keep VNPay hash secret secure
2. **Signature Verification**: Always verify payment signatures
3. **HTTPS**: Use HTTPS for all payment endpoints
4. **Transaction Validation**: Validate all transaction data
5. **Idempotency**: Handle duplicate payment callbacks

## 🚀 Production Considerations

1. **VNPay Production Credentials**: Use production VNPay account
2. **SSL/TLS**: Ensure all payment endpoints use HTTPS
3. **Webhook Security**: Verify webhook signatures
4. **Transaction Logging**: Comprehensive transaction logging
5. **Error Handling**: Robust error handling and retry logic
6. **Payment Reconciliation**: Regular reconciliation with VNPay

## 💡 VNPay Documentation

- [VNPay Integration Guide](https://sandbox.vnpayment.vn/apis/)
- [VNPay Sandbox](https://sandbox.vnpayment.vn/)
- [VNPay API Reference](https://sandbox.vnpayment.vn/apis/docs/)

---

**Part of the Restaurant Menu SaaS Platform**
