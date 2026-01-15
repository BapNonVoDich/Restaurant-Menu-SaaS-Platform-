# Catalog Service

Manages stores, menus, categories, and products for the multi-tenant platform. Handles menu HTML generation, product management, and provides public menu endpoints for customers.

## 🎯 Overview

The Catalog service is responsible for:
- Store management and subscription status tracking
- Category and product CRUD operations
- Menu HTML generation from structured data
- Multi-tenant data isolation
- Public menu endpoints for customer access

## ✨ Features

- **Store Management**: Create and manage restaurant/store profiles
- **Category Management**: Organize products into categories
- **Product Management**: Full CRUD for menu items
- **Menu HTML Generation**: Convert structured data to HTML
- **Multi-tenant Isolation**: Complete data separation per store
- **Subscription Status**: Track store subscription status (TRIAL, ACTIVE, EXPIRED, SUSPENDED)
- **Image Support**: Cloudinary integration for product images (optional)
- **Slug-based URLs**: SEO-friendly store URLs

## 🗄️ Database Schema

### Tables

- **`stores`**: Restaurant/store information
  - `id`, `user_id`, `name`, `slug`, `description`, `subscription_status`, `created_at`, `updated_at`

- **`categories`**: Menu categories
  - `id`, `store_id`, `name`, `sort_order`, `created_at`, `updated_at`

- **`products`**: Menu items/products
  - `id`, `store_id`, `name`, `description`, `price`, `image_url`, `is_available`, `sort_order`, `created_at`, `updated_at`

- **`product_categories`**: Many-to-many relationship
  - `product_id`, `category_id`

- **`menu_html`**: Generated menu HTML (optional)
  - `store_id`, `html_content`, `version`, `updated_at`

## 📊 Subscription Status

| Status | Description |
|--------|-------------|
| **TRIAL** | New store, 7-day trial period |
| **ACTIVE** | Paid subscription active, menu is public |
| **EXPIRED** | Subscription expired, menu is private |
| **SUSPENDED** | Suspended by admin, menu is private |

## 📡 API Endpoints

All endpoints are accessible via Gateway at `http://localhost:8080/api/catalog/`

### Store Management

**Get Current User's Store**
```bash
GET /api/catalog/stores/my-store
Authorization: Bearer YOUR_JWT_TOKEN

Response:
{
  "id": "uuid",
  "name": "My Restaurant",
  "slug": "my-restaurant",
  "description": "A great place to eat",
  "subscriptionStatus": "ACTIVE"
}
```

**Create Store**
```bash
POST /api/catalog/stores
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "My Restaurant",
  "slug": "my-restaurant",
  "description": "A great place to eat"
}
```

**Get Store by Slug (Public)**
```bash
GET /api/catalog/stores/{slug}

Response:
{
  "id": "uuid",
  "name": "My Restaurant",
  "slug": "my-restaurant",
  "description": "A great place to eat",
  "subscriptionStatus": "ACTIVE"
}
```

### Menu Management

**Get Menu Data (Public)**
```bash
GET /api/catalog/stores/{storeId}/menu

Response:
{
  "store": { ... },
  "categories": [
    {
      "id": "uuid",
      "name": "Appetizers",
      "products": [
        {
          "id": "uuid",
          "name": "Spring Rolls",
          "price": 50000,
          "description": "Fresh spring rolls",
          "imageUrl": "https://...",
          "isAvailable": true
        }
      ]
    }
  ]
}
```

**Save Menu HTML**
```bash
PUT /api/catalog/stores/{storeId}/menu-html
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "menuHtml": "<html>...</html>"
}
```

### Category Management

**Create Category**
```bash
POST /api/catalog/stores/{storeId}/categories
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Appetizers",
  "sortOrder": 0
}
```

**Get Categories**
```bash
GET /api/catalog/stores/{storeId}/categories
```

### Product Management

**Create Product**
```bash
POST /api/catalog/stores/{storeId}/products
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "name": "Spring Rolls",
  "description": "Fresh spring rolls with vegetables",
  "price": 50000,
  "imageUrl": "https://cloudinary.com/...",
  "isAvailable": true,
  "categoryIds": ["category-uuid"],
  "sortOrder": 0
}
```

**Get Products**
```bash
GET /api/catalog/stores/{storeId}/products
```

## 🔒 Security

### Multi-tenant Isolation

- All queries filter by `store_id`
- User ownership validated via JWT `userId`
- Scope filtering ensures users can only access their own stores

### Public vs Private Endpoints

- **Public**: Menu endpoints (only if store status is ACTIVE)
- **Private**: All management endpoints require JWT authentication

## 🚀 Running the Service

### Prerequisites
- PostgreSQL (running on port 5432 or via Docker)

### With Docker

```bash
# From project root
docker-compose up -d catalog
```

### Local Development

```bash
# Start PostgreSQL
docker-compose up -d postgres-catalog

# Run the service
./mvnw spring-boot:run
```

The service will start on http://localhost:8082

## ⚙️ Configuration

### Environment Variables

```yaml
# Database
SPRING_DATASOURCE_URL: jdbc:postgresql://localhost:5432/catalog_db
SPRING_DATASOURCE_USERNAME: restaurant_saas
SPRING_DATASOURCE_PASSWORD: restaurant_saas_pass

# Cloudinary (optional)
CLOUDINARY_CLOUD_NAME: your-cloud-name
CLOUDINARY_API_KEY: your-api-key
CLOUDINARY_API_SECRET: your-api-secret
```

### Application Configuration

See `src/main/resources/application.yml` for:
- Database connection settings
- HikariCP connection pooling
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

**1. Create a store:**
```bash
curl -X POST http://localhost:8080/api/catalog/stores \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Restaurant",
    "slug": "test-restaurant",
    "description": "A test restaurant"
  }'
```

**2. Create a category:**
```bash
curl -X POST http://localhost:8080/api/catalog/stores/{storeId}/categories \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Appetizers",
    "sortOrder": 0
  }'
```

**3. Create a product:**
```bash
curl -X POST http://localhost:8080/api/catalog/stores/{storeId}/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Spring Rolls",
    "price": 50000,
    "description": "Fresh spring rolls",
    "categoryIds": ["category-uuid"],
    "isAvailable": true
  }'
```

**4. Get menu (public):**
```bash
curl http://localhost:8080/api/catalog/stores/{storeId}/menu
```

## 🔧 Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose ps postgres-catalog
   ```

2. Check connection string in `application.yml`

3. Verify database exists:
   ```bash
   docker-compose exec postgres-catalog psql -U restaurant_saas -d catalog_db
   ```

### Multi-tenant Issues

- Verify JWT contains correct `userId`
- Check that `store_id` is properly set in queries
- Ensure scope filtering is working

### Menu HTML Generation

- Check that menu data structure is valid
- Verify HTML generation logic
- Check for errors in service logs

## 📊 Monitoring

### Health Check

```bash
curl http://localhost:8082/actuator/health
```

### Logs

```bash
# Docker
docker-compose logs -f catalog

# Local
tail -f logs/spring.log
```

## 🚀 Performance Considerations

1. **Database Indexing**: Ensure proper indexes on `store_id`, `slug`
2. **Connection Pooling**: HikariCP configured for optimal performance
3. **Caching**: Consider Redis caching for frequently accessed menus
4. **Image Optimization**: Use Cloudinary for image optimization

## 🔐 Production Considerations

1. **Slug Uniqueness**: Ensure slug validation and uniqueness
2. **Image Storage**: Use CDN for product images
3. **Menu Caching**: Cache generated menu HTML
4. **Rate Limiting**: Implement rate limiting for public endpoints
5. **Data Backup**: Regular database backups

---

**Part of the Restaurant Menu SaaS Platform**
