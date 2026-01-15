# Restaurant Menu SaaS Platform

A comprehensive multi-tenant SaaS platform that enables restaurants to create, customize, and manage digital menus with a powerful WYSIWYG editor. Store owners can manage their menus, subscriptions, and orders through an intuitive dashboard, while customers access menus via QR codes to place real-time orders.

## 🎯 Key Features

- **WYSIWYG Menu Editor**: Drag-and-drop interface for creating and customizing digital menus with real-time preview
- **Multi-tenant Architecture**: Complete data isolation per restaurant/store
- **Subscription Management**: Trial periods, subscription lifecycle, and payment processing
- **Real-time Order Tracking**: Server-Sent Events (SSE) for live order status updates
- **QR Code Integration**: Customers scan QR codes to access restaurant menus
- **Payment Integration**: VNPay gateway for subscription and order payments
- **Template System**: Save and reuse menu templates for quick setup
- **Role-Based Access Control**: Secure authentication and authorization with JWT

## 🏗️ Architecture Overview

This project follows a **microservices architecture** with a **database-per-service** pattern using Spring Cloud Gateway as the API gateway.

### Core Services

| Service | Port | Technology | Responsibilities |
|---------|------|-----------|------------------|
| **Gateway** | 8080 | Spring Cloud Gateway | API routing, SSL termination, rate limiting, request aggregation |
| **Identity** | 8081 | Spring Boot + Redis | User authentication, JWT generation, RBAC, session management |
| **Catalog** | 8082 | Spring Boot + PostgreSQL | Store management, menu/category/product CRUD, HTML menu generation |
| **Order** | 8083 | Spring Boot + PostgreSQL | Order lifecycle management, SSE streams, revenue calculation |
| **Payment** | 8084 | Spring Boot + PostgreSQL | Subscription management, VNPay integration, transaction tracking |

### Technology Stack

**Backend:**
- Java 21
- Spring Boot 3.3
- Spring Cloud Gateway
- PostgreSQL 16 (database-per-service)
- Redis 7 (session management)
- Liquibase (database migrations)
- HikariCP (connection pooling)

**Frontend:**
- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- React 18
- dnd-kit (drag-and-drop)
- React Hot Toast (notifications)

**Infrastructure:**
- Docker & Docker Compose
- Maven (build tool)

**External Integrations:**
- VNPay (payment gateway)
- Cloudinary (image hosting - optional)

## 📁 Project Structure

```
.
├── services/
│   ├── gateway/          # API Gateway service
│   ├── identity/         # Authentication & authorization service
│   ├── catalog/          # Menu & product management service
│   ├── order/            # Order management service
│   └── payment/          # Payment & subscription service
├── frontend/             # Next.js frontend application
├── docker-compose.yml    # Docker orchestration
├── README.md            # This file
└── QUICK_START.md       # Quick start guide
```

## 🚀 Quick Start

### Prerequisites

- **Docker & Docker Compose** (recommended for full stack)
- **OR** Java 21, Maven 3.8+, Node.js 20+ (for local development)

### Option 1: Docker (Recommended)

Start all services with one command:

```bash
docker-compose up -d --build
```

This starts:
- ✅ 5 Spring Boot microservices
- ✅ 4 PostgreSQL databases (one per service)
- ✅ 1 Redis instance

**Access Points:**
- Frontend: http://localhost:3000 (run separately: `cd frontend && npm run dev`)
- Gateway API: http://localhost:8080/api
- Individual services: http://localhost:8081-8084

**View logs:**
```bash
docker-compose logs -f
```

**Stop all services:**
```bash
docker-compose down
```

See [QUICK_START.md](QUICK_START.md) for detailed instructions.

### Option 2: Local Development

1. **Start infrastructure only:**
   ```bash
   docker-compose up -d postgres-identity postgres-catalog postgres-order postgres-payment redis
   ```

2. **Start backend services** (in separate terminals):
   ```bash
   cd services/gateway && ./mvnw spring-boot:run
   cd services/identity && ./mvnw spring-boot:run
   cd services/catalog && ./mvnw spring-boot:run
   cd services/order && ./mvnw spring-boot:run
   cd services/payment && ./mvnw spring-boot:run
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 👥 User Flows

### Store Owner Journey

1. **Registration** → User creates account (default role: `STORE_OWNER`)
2. **Login** → JWT token issued and stored
3. **Store Setup** → Create store profile (slug, name, description)
4. **Subscription** → 7-day trial period, then subscription required
5. **Menu Creation** → Use WYSIWYG editor to build custom menus
6. **Publish** → Generate QR code and share menu link
7. **Order Management** → View and manage incoming orders via dashboard

### Customer Journey

1. **Scan QR Code** → Access menu at `/menu/{store-slug}`
2. **Browse Menu** → View categories and products
3. **Add to Cart** → Select items and quantities
4. **Checkout** → Choose payment method (Cash or VNPay)
5. **Order Tracking** → Real-time status updates via SSE
6. **Order Completion** → Receive order confirmation

## 🔒 Security Features

- **JWT Authentication**: Stateless token-based authentication
- **RBAC**: Role-Based Access Control with granular permissions
- **Scope Filtering**: All requests validate user's store ownership
- **Multi-tenant Isolation**: Complete data separation per store
- **Rate Limiting**: Global rate limiting via API Gateway
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries via JPA

## 📚 API Documentation

### Gateway Endpoints (via http://localhost:8080/api)

**Identity Service:**
- `POST /identity/auth/register` - Register new user
- `POST /identity/auth/login` - Login and receive JWT
- `GET /identity/auth/validate` - Validate JWT token
- `GET /identity/users/me` - Get current user info

**Catalog Service:**
- `GET /catalog/stores/my-store` - Get current user's store
- `POST /catalog/stores` - Create new store
- `GET /catalog/stores/{slug}` - Get store by slug (public)
- `GET /catalog/stores/{storeId}/menu` - Get menu data (public)
- `POST /catalog/stores/{storeId}/categories` - Create category
- `POST /catalog/stores/{storeId}/products` - Create product
- `PUT /catalog/stores/{storeId}/menu-html` - Save menu HTML

**Order Service:**
- `POST /order/orders` - Create new order
- `GET /order/orders/{orderId}` - Get order details
- `GET /order/stores/{storeId}/orders` - Get store orders
- `PUT /order/orders/{orderId}/status` - Update order status
- `GET /order/stores/{storeId}/orders/stream` - SSE stream

**Payment Service:**
- `POST /payment/subscriptions/pay` - Create subscription payment
- `GET /payment/vnpay/callback` - VNPay callback handler
- `POST /payment/orders/{orderId}/pay` - Process order payment

## 🛠️ Development

### Service-Specific Documentation

Each service has its own README with detailed setup instructions:

- [Gateway Service](services/gateway/README.md)
- [Identity Service](services/identity/README.md)
- [Catalog Service](services/catalog/README.md)
- [Order Service](services/order/README.md)
- [Payment Service](services/payment/README.md)
- [Frontend Application](frontend/README.md)

### Database Migrations

All services use Liquibase for database migrations. Migrations are located in:
```
services/{service}/src/main/resources/db/changelog/
```

### Environment Variables

**Backend Services:**
- `SPRING_DATASOURCE_URL` - PostgreSQL connection string
- `SPRING_DATASOURCE_USERNAME` - Database username
- `SPRING_DATASOURCE_PASSWORD` - Database password
- `SPRING_DATA_REDIS_HOST` - Redis host (for Identity service)
- `VNPAY_TMN_CODE` - VNPay merchant code (for Payment service)
- `VNPAY_HASH_SECRET` - VNPay hash secret

**Frontend:**
- `NEXT_PUBLIC_API_URL` - Backend API URL (default: http://localhost:8080/api)

## 🧪 Testing

### Manual Testing

1. **Register a new user:**
   ```bash
   curl -X POST http://localhost:8080/api/identity/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@example.com","password":"password123"}'
   ```

2. **Login:**
   ```bash
   curl -X POST http://localhost:8080/api/identity/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","password":"password123"}'
   ```

3. **Create a store** (use JWT from login):
   ```bash
   curl -X POST http://localhost:8080/api/catalog/stores \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"name":"My Restaurant","slug":"my-restaurant","description":"A great place to eat"}'
   ```

## 📝 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainer.

## 📞 Support

For technical support or questions:
- Check individual service READMEs for service-specific issues
- Review [QUICK_START.md](QUICK_START.md) for common setup problems
- Check Docker logs: `docker-compose logs -f [service-name]`

---

**Built with ❤️ using Spring Boot, Next.js, and modern microservices architecture**
