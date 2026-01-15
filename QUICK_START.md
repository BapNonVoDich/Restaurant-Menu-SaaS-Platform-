# Quick Start Guide

Get the Restaurant Menu SaaS Platform up and running in minutes!

## 🚀 Fastest Way: Docker Compose

### One Command to Start Everything

```bash
docker-compose up -d --build
```

This single command will:
1. ✅ Build Docker images for all 5 Spring Boot services
2. ✅ Start all databases (4 PostgreSQL instances + 1 Redis)
3. ✅ Start all microservices
4. ✅ Set up networking between services
5. ✅ Configure health checks and dependencies

**Wait time**: ~1-2 minutes on first run (subsequent starts are faster)

### Verify Everything is Running

```bash
# Check status of all services
docker-compose ps

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f gateway
docker-compose logs -f identity
```

### Access Points

Once started, services are available at:

| Service | URL | Description |
|---------|-----|-------------|
| **Gateway** | http://localhost:8080 | Main API entry point |
| **Identity** | http://localhost:8081 | Authentication service |
| **Catalog** | http://localhost:8082 | Menu/product service |
| **Order** | http://localhost:8083 | Order management |
| **Payment** | http://localhost:8084 | Payment processing |
| **Frontend** | http://localhost:3000 | Run separately (see below) |

## 🎯 First Steps

### 1. Start the Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at http://localhost:3000

### 2. Test the API

```bash
# Health check
curl http://localhost:8080/actuator/health

# Should return: {"status":"UP"}
```

### 3. Register a User

```bash
curl -X POST http://localhost:8080/api/identity/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### 4. Login

```bash
curl -X POST http://localhost:8080/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

Save the JWT token from the response for subsequent requests.

## 🛠️ Common Commands

### Start Services

```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d gateway

# Start with rebuild
docker-compose up -d --build
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f gateway
docker-compose logs -f identity
docker-compose logs -f catalog

# Last 100 lines
docker-compose logs --tail=100 gateway
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart gateway
```

### Rebuild After Code Changes

```bash
# Rebuild specific service
docker-compose build gateway
docker-compose up -d gateway

# Rebuild all
docker-compose up -d --build
```

## 🔍 Troubleshooting

### Services Won't Start

**Check if ports are in use:**
```bash
# Windows
netstat -ano | findstr :8080

# Linux/Mac
lsof -i :8080
```

**Check service logs:**
```bash
docker-compose logs gateway
docker-compose logs identity
```

**Check service status:**
```bash
docker-compose ps
```

### Database Connection Errors

**Verify databases are running:**
```bash
docker-compose ps postgres-identity
docker-compose ps postgres-catalog
```

**Check database logs:**
```bash
docker-compose logs postgres-identity
```

**Test database connection:**
```bash
docker-compose exec postgres-identity psql -U restaurant_saas -d identity_db -c "SELECT 1;"
```

### Service Health Checks

**Check individual service health:**
```bash
curl http://localhost:8080/actuator/health  # Gateway
curl http://localhost:8081/actuator/health  # Identity
curl http://localhost:8082/actuator/health  # Catalog
curl http://localhost:8083/actuator/health  # Order
curl http://localhost:8084/actuator/health  # Payment
```

### Frontend Connection Issues

**Verify API URL:**
- Check `.env.local` in `frontend/` directory
- Should be: `NEXT_PUBLIC_API_URL=http://localhost:8080/api`

**Check CORS:**
- Verify Gateway service has CORS enabled
- Check browser console for CORS errors

### Clean Start

If things get messy, start fresh:

```bash
# Stop everything
docker-compose down -v

# Remove all containers and volumes
docker-compose down -v --remove-orphans

# Rebuild and start
docker-compose up -d --build
```

## 📋 Service Dependencies

Services start in this order:

1. **Databases** (PostgreSQL + Redis)
2. **Identity Service** (depends on PostgreSQL + Redis)
3. **Catalog Service** (depends on PostgreSQL)
4. **Order Service** (depends on PostgreSQL)
5. **Payment Service** (depends on PostgreSQL)
6. **Gateway Service** (depends on all above)

Docker Compose handles this automatically via `depends_on` and health checks.

## 🧪 Quick Test Flow

1. **Start services:**
   ```bash
   docker-compose up -d --build
   ```

2. **Wait for services to be ready** (~30 seconds):
   ```bash
   docker-compose logs -f gateway
   # Look for: "Started GatewayApplication"
   ```

3. **Register a user:**
   ```bash
   curl -X POST http://localhost:8080/api/identity/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username":"test","email":"test@test.com","password":"pass123"}'
   ```

4. **Login:**
   ```bash
   curl -X POST http://localhost:8080/api/identity/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username":"test","password":"pass123"}'
   ```

5. **Create a store** (use JWT from login):
   ```bash
   curl -X POST http://localhost:8080/api/catalog/stores \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{"name":"My Restaurant","slug":"my-restaurant"}'
   ```

6. **Start frontend and test:**
   ```bash
   cd frontend && npm run dev
   ```
   Visit http://localhost:3000 and login with your test user.

## 🎓 Next Steps

1. **Read the main README**: [README.md](README.md)
2. **Explore service READMEs**: Each service has detailed documentation
3. **Check API endpoints**: Test the API using curl or Postman
4. **Explore the frontend**: Use the WYSIWYG menu editor
5. **Review architecture**: Understand the microservices setup

## 💡 Tips

- **First run is slow**: Docker needs to build images and download dependencies
- **Subsequent starts are fast**: Images are cached
- **Use logs for debugging**: `docker-compose logs -f` is your friend
- **Check health endpoints**: Verify services are healthy before testing
- **Keep services running**: Don't stop Docker containers while developing frontend

## 🆘 Need Help?

- Check individual service READMEs for service-specific issues
- Review Docker logs: `docker-compose logs -f [service-name]`
- Verify environment variables are set correctly
- Ensure all prerequisites are installed

---

**Happy coding! 🚀**
