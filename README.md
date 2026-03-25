# Restaurant SaaS (Menus)

Multi-tenant **digital menu** platform for restaurants: owners manage stores, menus, and products; customers browse public menus and place orders. The system uses **Spring Boot microservices** behind an **API gateway** and a **Next.js** dashboard and public site.

## Architecture

| Layer | Technology |
|--------|------------|
| API Gateway | Spring Cloud Gateway (`:8080`, prefix `/api`) |
| Identity | Spring Boot + JWT (`:8081`) |
| Catalog | Spring Boot — stores, menus, categories, products (`:8082`) |
| Order | Spring Boot — orders & bills (`:8083`) |
| Payment | Spring Boot — subscriptions, VNPay (`:8084`) |
| Data | PostgreSQL (one DB per service), Redis (gateway) |
| Frontend | Next.js 15, TypeScript, Tailwind CSS (`:3000`) |

Service-specific details live in each module under `services/<name>/README.md`.

## Features (high level)

- JWT authentication and role-aware dashboard (owner / staff)
- Drag-and-drop **menu editor** with templates and styling
- Public menu by store slug (QR-friendly)
- Order management and billing workflow
- VNPay integration for payments / subscription flows
- Optional **custom domain** for public menus — see [docs/CUSTOM_DOMAIN.md](docs/CUSTOM_DOMAIN.md)
- Table ordering toggle and analytics-oriented views in the dashboard

## Prerequisites

- **Docker** & Docker Compose
- **JDK 17** and **Maven** (for local service builds without Docker, if needed)
- **Node.js 20+** and npm (for the frontend)

## Quick start (Docker + frontend)

1. **Start backend stack** (Postgres ×4, Redis, gateway, identity, catalog, order, payment):

   ```bash
   docker compose up -d --build
   ```

   Wait until Postgres healthchecks pass and services are up. API base URL: **http://localhost:8080/api**

2. **Configure environment** (optional). Copy the example and adjust secrets for production:

   ```bash
   cp .env.example .env
   ```

   Docker Compose reads variables from `.env` in the project root. See [.env.example](.env.example) for supported keys.

3. **Run the frontend**:

   ```bash
   cd frontend
   npm install
   ```

   Create `frontend/.env.local`:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080/api
   ```

   For custom domains locally, also set `NEXT_PUBLIC_PLATFORM_HOSTS` and `NEXT_PUBLIC_APP_DOMAIN` as described in [docs/CUSTOM_DOMAIN.md](docs/CUSTOM_DOMAIN.md).

   ```bash
   npm run dev
   ```

   Open **http://localhost:3000**.

## Project layout

```
├── docker-compose.yml    # Full stack orchestration
├── services/
│   ├── gateway/
│   ├── identity/
│   ├── catalog/
│   ├── order/
│   └── payment/
├── frontend/             # Next.js app
└── docs/                 # Extra documentation
```

## Development notes

- Database migrations: **Liquibase** changelogs per service (`src/main/resources/db/changelog`).
- After changing `.gitignore`, if `.env` was previously committed, stop tracking it with:  
  `git rm --cached .env`  
  (keep a local copy; do not commit real secrets.)

## License

Specify your license here (e.g. MIT, proprietary).
