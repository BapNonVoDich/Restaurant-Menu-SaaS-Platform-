# Identity Service

Handles user authentication, authorization, and Role-Based Access Control (RBAC) for the entire platform. Manages user accounts, JWT token generation, and role/permission assignments.

## 🎯 Overview

The Identity service is responsible for:
- User registration and authentication
- JWT token generation and validation
- Role-Based Access Control (RBAC)
- User session management (via Redis)
- Permission management

## ✨ Features

- **User Registration**: Create new user accounts with validation
- **JWT Authentication**: Stateless token-based authentication
- **RBAC System**: Flexible role and permission management
- **Session Management**: Redis-backed session storage
- **Password Security**: BCrypt password hashing
- **Role Templates**: Pre-configured roles (SUPER_ADMIN, STORE_OWNER, WAITER)

## 🗄️ Database Schema

### Tables

- **`users`**: User accounts
  - `id`, `username`, `email`, `password_hash`, `created_at`, `updated_at`

- **`roles`**: Role definitions
  - `id`, `name`, `description`, `is_global`, `store_id` (nullable)

- **`permissions`**: Permission codes
  - `id`, `code`, `description`

- **`user_roles`**: Many-to-many relationship
  - `user_id`, `role_id`

- **`role_permissions`**: Many-to-many relationship
  - `role_id`, `permission_id`

## 🔑 Default Roles

### SUPER_ADMIN
- Full system access
- Can manage all stores and users

### STORE_OWNER
- Default role for new registrations
- Can manage their own store
- Full access to their store's data

### WAITER
- Can view and update orders
- Limited access to store management

## 📡 API Endpoints

All endpoints are accessible via Gateway at `http://localhost:8080/api/identity/`

### Authentication

**Register New User**
```bash
POST /api/identity/auth/register
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Login**
```bash
POST /api/identity/auth/login
Content-Type: application/json

{
  "username": "newuser",
  "password": "securepassword"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "username": "newuser",
    "email": "user@example.com"
  }
}
```

**Validate Token**
```bash
GET /api/identity/auth/validate
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "valid": true,
  "userId": "uuid",
  "username": "newuser"
}
```

### User Management

**Get Current User**
```bash
GET /api/identity/users/me
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "id": "uuid",
  "username": "newuser",
  "email": "user@example.com",
  "roles": ["STORE_OWNER"]
}
```

## 🔐 Security

### Password Hashing
- Passwords are hashed using BCrypt
- Salt rounds: 10 (configurable)

### JWT Configuration
- Algorithm: HS256
- Token expiration: Configurable (default: 24 hours)
- Claims: `userId`, `username`, `roles`

### Session Management
- Sessions stored in Redis
- Automatic expiration
- Supports distributed systems

## 🚀 Running the Service

### Prerequisites
- PostgreSQL (running on port 5432 or via Docker)
- Redis (running on port 6379 or via Docker)

### With Docker

```bash
# From project root
docker-compose up -d identity
```

### Local Development

```bash
# Start dependencies
docker-compose up -d postgres-identity redis

# Run the service
./mvnw spring-boot:run
```

The service will start on http://localhost:8081

## ⚙️ Configuration

### Environment Variables

```yaml
# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/identity_db
SPRING_DATASOURCE_USERNAME: restaurant_saas
SPRING_DATASOURCE_PASSWORD: restaurant_saas_pass

# Redis
SPRING_DATA_REDIS_HOST: localhost
SPRING_DATA_REDIS_PORT: 6379

# JWT
JWT_SECRET: your-secret-key (change in production!)
JWT_EXPIRATION: 86400000 # 24 hours in milliseconds
```

### Application Configuration

See `src/main/resources/application.yml` for:
- Database connection settings
- Redis configuration
- JWT settings
- Security configuration

## 🗄️ Database Migrations

Liquibase migrations are located in:
```
src/main/resources/db/changelog/
```

Migrations include:
- Initial schema creation
- Default roles and permissions
- Index creation

## 🧪 Testing

### Manual Testing

**1. Register a user:**
```bash
curl -X POST http://localhost:8080/api/identity/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

**2. Login:**
```bash
curl -X POST http://localhost:8080/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

**3. Validate token:**
```bash
curl http://localhost:8080/api/identity/auth/validate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres-identity
   ```

2. Check connection string in `application.yml`

3. Verify database exists:
   ```bash
   docker-compose exec postgres-identity psql -U restaurant_saas -d identity_db
   ```

### Redis Connection Issues

1. Verify Redis is running:
   ```bash
   docker-compose ps redis
   ```

2. Test Redis connection:
   ```bash
   docker-compose exec redis redis-cli ping
   ```

### JWT Issues

- Verify `JWT_SECRET` is set correctly
- Check token expiration settings
- Ensure token is included in Authorization header

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8081/actuator/health
```

### Logs

```bash
# Docker
docker-compose logs -f identity

# Local
tail -f logs/spring.log
```

## 🔐 Production Considerations

1. **Change JWT Secret**: Use a strong, randomly generated secret
2. **HTTPS Only**: Always use HTTPS in production
3. **Token Expiration**: Set appropriate expiration times
4. **Rate Limiting**: Implement rate limiting for auth endpoints
5. **Password Policy**: Enforce strong password requirements
6. **Email Verification**: Add email verification for new registrations

---

**Part of the Restaurant Menu SaaS Platform**
