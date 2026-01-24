# Fleet Management System - הובלות עפר

מערכת לניהול תפעול וכספים של חברת הובלות עפר (dirt hauling operations).

## Architecture

- **Backend**: FastAPI (Python) - REST API
- **Frontend**: Next.js (React + TypeScript) - Web Admin
- **Mobile**: PWA (Progressive Web App) - Driver App
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
