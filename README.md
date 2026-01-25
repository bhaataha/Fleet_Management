# Fleet Management System - הובלות עפר

מערכת לניהול תפעול וכספים של חברת הובלות עפר (dirt hauling operations).

## 📚 Documentation

**👉 Start here: [docs/README.md](docs/README.md)** - Complete documentation index

### Quick Links
- 🚀 [Quick Start Guide](docs/setup/QUICK_START.md) - Get running in 5 minutes
- 👤 [Demo Data & Credentials](docs/setup/DEMO_DATA.md) - Login info & test data
- 📋 [TODO & Improvements](docs/project/TODO_IMPROVEMENTS.md) - Roadmap & missing features ⭐
- ✅ [Running Status](docs/project/RUNNING_STATUS.md) - Current system status
- 📖 [Full PRD (Hebrew)](docs/architecture/plan.md) - Complete specification
- 📱 [Mobile Apps Update](docs/features/MOBILE_APPS_LANDING_UPDATE.md) - Landing page promotion
- 🏢 [Multi-Tenant Specification](docs/architecture/MULTI_TENANT_SPEC.md) - Multi-tenant architecture ✨ NEW

### Recent Updates
- **2026-01-25 (Latest)**: ✅ **Multi-Tenant Migration Phase 1 COMPLETE** - Database + Models updated with UUID-based org_id! 🎉
- **2026-01-25**: Documentation reorganized into `docs/` folder with clear categories
- **2026-01-25**: Multi-tenant architecture specification created
- **2026-01-25**: Landing page upgraded with mobile apps promotion (iOS/Android coming Q2 2026)

### 🆕 Multi-Tenant Implementation (Phase 1 ✅)
- **Status**: Database migration complete, backend models updated
- **What's Done**: Organizations table, org_id in all 20 tables, UUID-based, foreign keys, indexes
- **Next**: Middleware + API security (Phase 2)
- **Docs**: 
  - 📖 [Phase 1 Complete Summary](PHASE_1_COMPLETE.md)
  - 🚀 [Next Steps Guide](NEXT_STEPS.md) - Complete implementation guide for Phase 2
  - ✅ [Status Tracker](MULTI_TENANT_STATUS.md)
  - 🔍 [Database Verification](DATABASE_VERIFICATION.md)
  - 📘 [Multi-Tenant README](MULTI_TENANT_README.md)

## Architecture

- **Backend**: FastAPI (Python) - REST API
- **Frontend**: Next.js (React + TypeScript) - Web Admin
- **Mobile**: PWA (Progressive Web App) - Driver App (Native apps coming Q2 2026 📱)
- **Database**: PostgreSQL
- **Storage**: S3-compatible (MinIO for dev)
- **Auth**: JWT + RBAC

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### Development Setup

1. **Clone and setup environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the applications**
- Web Admin: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- MinIO Console: http://localhost:9001

### Database Migrations

```bash
# Run migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"
```

## Project Structure

```
Fleet_Management/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/         # API endpoints
│   │   ├── core/        # Auth, config, security
│   │   ├── models/      # SQLAlchemy models
│   │   ├── schemas/     # Pydantic schemas
│   │   └── services/    # Business logic
│   ├── db/              # Database scripts
│   └── tests/
├── frontend/            # Next.js web admin
│   ├── src/
│   │   ├── app/        # App router pages
│   │   ├── components/ # React components
│   │   ├── lib/        # Utilities
│   │   └── types/      # TypeScript types
│   └── public/
├── mobile/              # PWA driver app (future)
└── docs/                # Documentation
```

## Current Status

### ✅ Implemented Features
- [x] User authentication (JWT + RBAC)
- [x] Customer & Site management
- [x] Fleet management (Trucks, Drivers, Trailers)
- [x] Materials & Price lists
- [x] Job/Trip creation & assignment
- [x] Driver mobile app (PWA)
- [x] Job status tracking workflow
- [x] **Driver login with phone number**
- [x] Demo data with 5 drivers, 4 customers, 8 sites
- [x] GPS location capture on status updates

### ⚠️ Partially Implemented
- [ ] **Photo upload** - UI exists, backend pending (see [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md))
- [ ] **Digital signature** - DB ready, UI pending
- [ ] **GPS tracking map** - Data collected, map view pending
- [ ] **PDF export** - Basic structure, needs implementation

### 📋 Planned Features
See [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) for detailed roadmap.

## Development Workflow

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Running Tests
```bash
# Backend tests
docker-compose exec backend pytest

# Frontend tests
cd frontend && npm test
```

## Key Features (MVP Phase 1)

- ✅ Customer & Site Management
- ✅ Fleet Management (Trucks, Trailers, Drivers)
- ✅ Daily Dispatch Board
- ✅ Job/Trip Management with Status Tracking
- ✅ Mobile Driver App (PWA)
  - Job assignments
  - Status updates
  - Signature capture
  - Photo upload
- ✅ Pricing Engine with Automatic Calculation
- ✅ Statement/Invoice Generation (PDF/Excel)
- ✅ Payment Tracking & AR Aging
- ✅ Basic Reports

## User Roles

- **Admin**: Full system access
- **Dispatcher**: Create/assign jobs, operational reports
- **Accounting**: Financial operations, billing, payments
- **Driver**: Mobile app access, job updates only

## API Documentation

Full API documentation available at: http://localhost:8000/docs (Swagger UI)

Key endpoints:
- `POST /api/auth/login` - Authentication
- `GET /api/jobs` - List jobs
- `POST /api/jobs/{id}/status` - Update job status
- `POST /api/jobs/{id}/delivery-note` - Submit delivery note with signature
- `POST /api/statements/generate` - Generate billing statement

## Environment Variables

See `.env.example` for all required variables.

Critical variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT tokens
- `S3_*` - S3/MinIO credentials for file storage

## Business Rules

1. **Job Status Lifecycle**: `PLANNED` → `ASSIGNED` → `ENROUTE_PICKUP` → `LOADED` → `ENROUTE_DROPOFF` → `DELIVERED` → `CLOSED`
2. **Delivery Requirements**: Cannot mark `DELIVERED` without signature + receiver name + at least one photo
3. **Billing Lock**: Jobs cannot be modified after being included in a sent statement (Admin override only)
4. **Price Override**: Requires Accounting/Admin role + mandatory reason field + audit log

## Support

For detailed specifications, see [plan.md](plan.md) (Hebrew)

For AI agent instructions, see [.github/copilot-instructions.md](.github/copilot-instructions.md)

## License

Proprietary - All rights reserved
