# Gateway Service

Spring Cloud Gateway service that acts as the API gateway for all microservices. Handles request routing, rate limiting, and provides a single entry point for the frontend.

## 🎯 Overview

The Gateway service is the central entry point for all API requests. It routes requests to the appropriate microservices and provides cross-cutting concerns like rate limiting and request aggregation.

## 🔧 Configuration

### Port
- **8080** (Main entry point for all API requests)

### Service Routes

All routes are prefixed with `/api`:

| Route Pattern | Target Service | Port | Description |
|--------------|----------------|------|-------------|
| `/api/identity/**` | Identity Service | 8081 | Authentication & user management |
| `/api/catalog/**` | Catalog Service | 8082 | Store, menu, product management |
| `/api/order/**` | Order Service | 8083 | Order lifecycle management |
| `/api/payment/**` | Payment Service | 8084 | Payment & subscription management |

### Rate Limiting

- **Global Rate Limit**: 10 requests/second per IP address
- **Burst Capacity**: 20 requests
- **Rate Limit Headers**: Included in responses

## 🚀 Running the Service

### With Docker (Recommended)

```bash
# From project root
docker-compose up -d gateway
```

### Local Development

```bash
# Make sure Redis is running (for rate limiting)
docker-compose up -d redis

# Run the service
./mvnw spring-boot:run
```

The service will start on http://localhost:8080

## 📡 API Endpoints

All endpoints are accessible via the gateway at `http://localhost:8080/api/{service-path}`

### Example Requests

**Identity Service:**
```bash
curl http://localhost:8080/api/identity/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"user","password":"pass"}'
```

**Catalog Service:**
```bash
curl http://localhost:8080/api/catalog/stores/my-store \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Security

- **CORS**: Configured for frontend origin
- **Rate Limiting**: Prevents abuse and DDoS
- **Request Forwarding**: JWT tokens are forwarded to downstream services
- **Health Checks**: Available at `/actuator/health`

## 🛠️ Development

### Dependencies

- Spring Cloud Gateway
- Spring Boot Actuator (for health checks)
- Redis (for rate limiting - optional)

### Configuration Files

- `src/main/resources/application.yml` - Main configuration
  - Route definitions
  - Rate limiting configuration
  - Service discovery settings

### Testing

```bash
# Health check
curl http://localhost:8080/actuator/health

# Test routing
curl http://localhost:8080/api/identity/auth/validate
```

## 📊 Monitoring

### Health Endpoint

```bash
curl http://localhost:8080/actuator/health
```

### Logs

View logs:
```bash
# Docker
docker-compose logs -f gateway

# Local
tail -f logs/spring.log
```

## 🔧 Troubleshooting

### Service Not Starting

1. Check if port 8080 is available:
   ```bash
   netstat -ano | findstr :8080  # Windows
   lsof -i :8080                 # Linux/Mac
   ```

2. Verify Redis is running (if using rate limiting):
   ```bash
   docker-compose ps redis
   ```

### Routing Issues

1. Check route configuration in `application.yml`
2. Verify target services are running
3. Check gateway logs for routing errors

### Rate Limiting Issues

- Rate limit headers are included in responses
- Check `X-RateLimit-*` headers
- Adjust limits in `application.yml` if needed

## 📝 Notes

- Gateway acts as a reverse proxy
- All authentication is handled by downstream services
- Gateway does not store any business logic
- Rate limiting is per-IP by default

---

**Part of the Restaurant Menu SaaS Platform**
