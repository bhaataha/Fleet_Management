# Fleet Management System - AI Coding Agent Instructions

## Project Status: **IMPLEMENTED & DEPLOYED**

This is a **production Multi-Tenant SaaS** for dirt hauling operations ("הובלות עפר"). The system is **fully implemented** with backend (FastAPI), frontend (Next.js), and deployed via Docker.

**Primary Language**: Hebrew (documentation) + English (code)  
**Target Market**: Israeli trucking companies specializing in dirt/aggregate hauling  
**Architecture**: Multi-tenant with org_id-based data isolation + Super Admin interface

---

## Tech Stack (Implemented)

- **Backend**: FastAPI (Python 3.11+), PostgreSQL 15, SQLAlchemy ORM, Alembic migrations
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Zustand (state), TanStack Query (server state)
- **Auth**: JWT tokens with org_id claim + role-based access control (RBAC)
- **Deployment**: Docker Compose, Traefik reverse proxy, production-ready with setup wizard
- **Storage**: Local `/uploads` directory (MVP) - S3 planned for Phase 2

---

## Critical Multi-Tenant Architecture

### How Tenant Isolation Works
Every API request extracts `org_id` from JWT token via middleware ([backend/app/middleware/tenant.py](../backend/app/middleware/tenant.py)):

```python
# Middleware injects into request.state:
request.state.org_id       # UUID - tenant identifier  
request.state.user_id      # int - current user
request.state.is_super_admin  # bool - Super Admin flag
```

**All database models inherit org_id filtering**. Example from [backend/app/api/v1/endpoints/jobs.py](../backend/app/api/v1/endpoints/jobs.py#L99):
```python
org_id = get_current_org_id(request)  # From tenant helper
query = db.query(Job).filter(Job.org_id == org_id)
```

### Super Admin Impersonation
Super Admins can view any organization by sending `X-Org-Id` header (detected in middleware). Frontend stores `impersonated_org_id` in localStorage and adds header via axios interceptor ([frontend/src/lib/api.ts](../frontend/src/lib/api.ts#L36-L39)).

---

## Database Schema Essentials

**Every table has `org_id` (UUID)** except:
- `organizations` (the tenants themselves)
- `users` (links to org via `org_id` column)

Key models in [backend/app/models/](../backend/app/models/):
- `Organization`: Tenant with plan limits (max_trucks, max_drivers, trial_ends_at, status)
- `Job`: Core entity with status lifecycle (PLANNED → ASSIGNED → ENROUTE_PICKUP → LOADED → ENROUTE_DROPOFF → DELIVERED → CLOSED)
- `Customer`, `Site`, `Truck`, `Driver`, `Material`: Standard entities with org_id
- `PriceList`: Material + route-based pricing with date validity
- `Statement`: Billing aggregation with line items linking to jobs
- `DeliveryNote`: Signature + photos (required for DELIVERED status)
- `ShareUrl`: Public PDF sharing with token auth (bypasses tenant middleware)

**Status transitions are tracked** in `job_status_events` with timestamps + GPS coordinates ([backend/app/models/__init__.py](../backend/app/models/__init__.py)).

---

## Developer Workflows

### Running Locally
```bash
# Start all services (Postgres + Backend + Frontend)
docker-compose up --build

# Access:
# - Frontend: http://localhost:3010
# - Backend API: http://localhost:8001
# - API Docs: http://localhost:8001/docs
# - Postgres: localhost:5434
```

### Database Migrations
```bash
# Create migration after model changes
cd backend
docker-compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker-compose exec backend alembic upgrade head

# Rollback
docker-compose exec backend alembic downgrade -1
```

### Creating Super Admin
```bash
# Use setup wizard (interactive)
sudo ./setup-wizard.sh

# Or manual script
cd backend && python setup/create_super_admin.py
# Default: admin@system.local / changeme123
```

### Quick Commands Reference
See [QUICK_COMMANDS.txt](../QUICK_COMMANDS.txt) for copy-paste remote server setup commands.

---

## API Patterns & Conventions

### Authentication Flow
1. **Login**: `POST /api/auth/login` with `{email, password}` → Returns JWT with `org_id` claim
2. **Driver Login**: `POST /api/auth/driver-login` with `{phone, password}` (links Driver → User)
3. **All requests**: Send `Authorization: Bearer <token>` header
4. **Super Admin impersonation**: Add `X-Org-Id: <uuid>` header

### Tenant-Scoped Endpoints (Example)
```python
@router.get("")
async def list_customers(
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_current_org_id(request)  # Extracted from JWT
    customers = db.query(Customer).filter(Customer.org_id == org_id).all()
    return customers
```

**Never hardcode `org_id=1`** - always use `get_current_org_id(request)` from [backend/app/core/tenant.py](../backend/app/core/tenant.py).

### Public Endpoints (Skip Middleware)
- `/health`, `/docs`, `/api/auth/login`
- `/api/share/{token}` - Public PDF sharing (bypasses auth via token query param)

Configured in [backend/app/middleware/tenant.py](../backend/app/middleware/tenant.py#L35-L62).

---

## Business Logic Constraints

### Job Status Lifecycle (Strict State Machine)
Cannot skip states - enforce transitions in [backend/app/api/v1/endpoints/jobs.py](../backend/app/api/v1/endpoints/jobs.py):
```
PLANNED → ASSIGNED → ENROUTE_PICKUP → LOADED → 
ENROUTE_DROPOFF → DELIVERED → CLOSED
```

**DELIVERED Requirements** (validate before status update):
- Delivery note with signature (receiver_name + signature image)
- At least one photo/document attached
- Actual quantity recorded

### Pricing Engine
Automatic calculation in [backend/app/services/pricing.py](../backend/app/services/pricing.py) (if exists):
- Base price from `price_lists` (material + from_site + to_site + date validity)
- Adjustments: minimum charge, wait time fees, night surcharge
- Manual overrides require `reason` field + audit log

### RBAC Rules
- **Drivers**: See only assigned jobs (`Job.driver_id == user.driver.id`)
- **Dispatcher**: Cannot edit financial data after statement sent
- **Accounting**: Cannot modify jobs after billing without Admin role
- **Super Admin**: Bypass all tenant filters when impersonating

---

## Frontend Architecture

### Key Patterns
- **State**: Zustand stores in [frontend/src/lib/stores/](../frontend/src/lib/stores/) (auth, impersonation)
- **API Client**: Centralized axios instance in [frontend/src/lib/api.ts](../frontend/src/lib/api.ts) with token injection
- **Routing**: App Router with nested layouts per feature (`/jobs`, `/customers`, `/super-admin`)
- **i18n**: Helper in [frontend/src/lib/i18n.ts](../frontend/src/lib/i18n.ts) for Hebrew/English text

### Super Admin UI
Located in [frontend/src/app/super-admin/](../frontend/src/app/super-admin/):
- Organization CRUD + stats dashboard
- Impersonation switcher (stores `impersonated_org_id` → adds X-Org-Id header)
- Plan management (trial, suspended, active)

### Mobile Driver App
**Current Status**: PWA planned but not fully implemented. Driver features exist in admin panel but need mobile-optimized UI with:
- Offline queue for status updates (localStorage-based)
- Camera access for photos
- Signature canvas (react-signature-canvas already in package.json)

---

## Deployment & Production Setup

### Automated Installation
```bash
# Clone and run setup wizard (handles everything)
git clone <repo-url>
cd Fleet_Management
chmod +x setup-wizard.sh
sudo ./setup-wizard.sh
```

Wizard creates:
- Production `.env` with secure passwords
- Super Admin account
- First organization + admin user
- SSL certificates (if using Traefik)
- Backup cron job

Docs: [docs/setup/SETUP_WIZARD_README.md](../docs/setup/SETUP_WIZARD_README.md)

### Manual Production Deploy
```bash
# 1. Copy and edit environment
cp .env.production.template .env.production
nano .env.production

# 2. Start containers
docker-compose -f docker-compose.production.yml up -d

# 3. Apply migrations
docker-compose exec backend alembic upgrade head

# 4. Create Super Admin
docker-compose exec backend python setup/create_super_admin.py
```

### Backup Script
```bash
./backup.sh  # Creates timestamped backup in /backups
```

---

## Key Files Reference

- **PRD**: [docs/architecture/plan.md](../docs/architecture/plan.md) - Original specification (Hebrew)
- **Multi-Tenant Guide**: [docs/architecture/MULTI_TENANT_IMPLEMENTATION_GUIDE.md](../docs/architecture/MULTI_TENANT_IMPLEMENTATION_GUIDE.md)
- **Setup Wizard**: [docs/setup/SETUP_WIZARD_README.md](../docs/setup/SETUP_WIZARD_README.md)
- **Tenant Middleware**: [backend/app/middleware/tenant.py](../backend/app/middleware/tenant.py) - JWT extraction + org_id injection
- **Tenant Helpers**: [backend/app/core/tenant.py](../backend/app/core/tenant.py) - `get_current_org_id()`, `require_super_admin()`
- **Super Admin API**: [backend/app/api/v1/endpoints/super_admin.py](../backend/app/api/v1/endpoints/super_admin.py)
- **Organization Model**: [backend/app/models/organization.py](../backend/app/models/organization.py)

---

## Common Pitfalls to Avoid

1. **Hardcoding org_id**: Always extract from JWT via `get_current_org_id(request)` - never assume org_id=1
2. **Skipping tenant filters**: Every query must filter by `org_id` (except Super Admin impersonation)
3. **Missing Alembic migrations**: After model changes, always generate migration before committing
4. **Public endpoints**: Add new public routes to middleware whitelist ([backend/app/middleware/tenant.py](../backend/app/middleware/tenant.py#L35-L62))
5. **Frontend impersonation**: Check if `impersonated_org_id` exists before API calls to Super Admin endpoints
6. **Status transitions**: Validate allowed state changes before updating job status

---

## When Extending the System

### Adding New Entity
1. Create model in `backend/app/models/` with `org_id = Column(UUID, nullable=False)`
2. Add tenant filter in endpoints: `query.filter(Entity.org_id == get_current_org_id(request))`
3. Generate migration: `alembic revision --autogenerate -m "add_entity"`
4. Create TypeScript types in `frontend/src/types/`
5. Add API methods to `frontend/src/lib/api.ts`

### New Business Rule
- **Backend**: Add validation in service layer or endpoint before DB commit
- **Audit**: Log to `audit_logs` table if rule involves pricing/status/financial data
- **Frontend**: Show validation errors via toast/alert (existing pattern in form submissions)

---

**Questions? Check [docs/](../docs/) or PRD [plan.md](../docs/architecture/plan.md) for domain logic. All architecture decisions are documented in [docs/architecture/](../docs/architecture/).**
