# Fleet Management System - הובלות עפר 🚛

<div dir="rtl">

## סקירה כללית

מערכת מקצה-לקצה לניהול חברת הובלות עפר, בנויה עם **FastAPI + Next.js 14 + PostgreSQL**.

### תכונות עיקריות ✨

- 🌐 **תמיכה דו-לשונית מלאה** (עברית + English) עם RTL/LTR
- 🚀 **Web Admin Panel** - ניהול, שיבוץ, חיוב, דוחות
- 📱 **Mobile PWA** - אפליקציית נהג עם Offline Support
- 💰 **Pricing Engine** - חישוב מחיר אוטומטי עם תוספות
- 📄 **Statement Generation** - סיכומי עבודה ומעקב תשלומים
- 🔐 **RBAC** - 4 רמות הרשאה (Admin, Dispatcher, Accounting, Driver)
- 📊 **Real-time Dashboard** - סטטיסטיקות ונסיעות חיות
- 🏗️ **Multi-tenant Ready** - תמיכה במספר ארגונים

</div>

---

## Quick Start 🚀

```bash
# 1. Clone and configure
git clone <repository>
cd Fleet_Management
cp .env.example .env

# 2. Start all services (Docker Compose)
docker-compose up --build

# 3. Access applications
# 👨‍💼 Admin Panel: http://localhost:3000
# 🚗 Driver App: http://localhost:3000/driver.html
# 📚 API Docs: http://localhost:8000/docs

# 4. Login (default credentials)
# Email: admin@example.com
# Password: admin123
```

**ברגע שהשירותים עלו, המערכת מוכנה לשימוש!**

---

## Architecture 🏗️

```
┌─────────────────┐         ┌──────────────────┐
│   Next.js 14   │◄───────►│   FastAPI API    │
│   Frontend     │         │   (Port 8000)    │
│  (Port 3000)   │         └────────┬─────────┘
└────────┬────────┘                  │
         │                           │
         │         ┌─────────────────▼──────┐
         └────────►│   PostgreSQL 15        │
                   │   (Port 5432)          │
                   └─────────────────────────┘
                              │
                   ┌──────────▼──────────┐
                   │   MinIO S3          │
                   │   Files & Photos    │
                   │   (Port 9000/9001)  │
                   └─────────────────────┘
```

---

## Project Structure 📂

```
Fleet_Management/
├── backend/                    # FastAPI Application
│   ├── app/
│   │   ├── api/v1/endpoints/  # 9 API modules
│   │   │   ├── auth.py
│   │   │   ├── customers.py
│   │   │   ├── sites.py
│   │   │   ├── trucks.py
│   │   │   ├── drivers.py
│   │   │   ├── materials.py
│   │   │   ├── jobs.py
│   │   │   ├── pricing.py
│   │   │   └── statements.py
│   │   ├── core/
│   │   │   ├── config.py      # Environment settings
│   │   │   ├── security.py    # JWT + password hashing
│   │   │   └── database.py    # SQLAlchemy setup
│   │   ├── models/            # 20+ DB models
│   │   └── main.py
│   ├── alembic/               # Database migrations
│   ├── db/init.sql            # Seed data
│   └── requirements.txt
│
├── frontend/                   # Next.js 14 Application
│   ├── src/
│   │   ├── app/               # App Router pages
│   │   │   ├── login/
│   │   │   ├── dashboard/
│   │   │   ├── dispatch/
│   │   │   ├── customers/
│   │   │   ├── sites/
│   │   │   ├── fleet/
│   │   │   ├── materials/
│   │   │   ├── pricing/
│   │   │   └── statements/
│   │   ├── components/
│   │   │   ├── auth/          # AuthProvider
│   │   │   └── layout/        # DashboardLayout
│   │   ├── lib/
│   │   │   ├── i18n/          # he.ts + en.ts
│   │   │   ├── stores/        # Zustand state
│   │   │   ├── api.ts         # API client
│   │   │   └── utils.ts       # Helpers
│   │   └── types/             # TypeScript types
│   ├── public/
│   │   ├── driver.html        # Mobile PWA
│   │   ├── manifest.json
│   │   └── sw.js              # Service Worker
│   └── package.json
│
├── docker-compose.yml          # 4 services orchestration
├── .env.example
├── plan.md                     # Full PRD (Hebrew)
├── MVP_COMPLETE.md             # Technical documentation
└── README.md
```

---

## Key Features Breakdown 🎯

### 1. Authentication & Authorization 🔐
- JWT tokens (7-day expiry)
- 4 user roles: **Admin**, **Dispatcher**, **Accounting**, **Driver**
- Protected routes on frontend
- Role-based API access

### 2. Dispatch Management 📋
- Daily job board with drag-drop (ready to implement)
- Assign driver + truck to jobs
- Real-time status tracking (8 states)
- GPS coordinates logged with each status change

### 3. Mobile Driver App 📱
**Standalone PWA at `/driver.html`**
- ✅ View assigned jobs for today
- ✅ Update status buttons (ENROUTE → LOADED → DELIVERED)
- ✅ Camera integration for photos
- ✅ Signature capture
- ✅ GPS tracking automatic
- ✅ Offline queue + sync

### 4. Pricing Engine 💰
**Automatic calculation based on:**
- Base price per unit (ton/m3/trip/km)
- Minimum charge
- Wait time fee (hourly)
- Night surcharge (%)
- Manual override with reason (Audit logged)

```python
POST /api/pricing/preview
{
  "job_id": 123,
  "qty": 15.5,
  "wait_hours": 2,
  "is_night": false
}
# Returns: base_amount, adjustments, total
```

### 5. Statement Generation 📄
- Generate invoices for delivered jobs by period
- Automatic line items from jobs
- VAT calculation (17%)
- Payment tracking with allocations
- Export to PDF/Excel (Phase 2)

```python
POST /api/statements/generate
{
  "customer_id": 1,
  "period_from": "2024-01-01",
  "period_to": "2024-01-31"
}
# Creates statement with lines + totals
```

### 6. Multilingual (i18n) 🌐
**200+ translation keys:**
- UI labels (buttons, titles, placeholders)
- Job statuses (PLANNED, ASSIGNED, DELIVERED, etc.)
- Billing units (ton, m3, trip, km)
- Error messages
- Form validations

```typescript
import { useI18n } from '@/lib/i18n'

const { t, setLanguage } = useI18n()
setLanguage('he')  // עברית + RTL
setLanguage('en')  // English + LTR
```

---

## Database Schema 🗄️

### Core Entities (20+ tables)

| Entity | Description |
|--------|-------------|
| `organizations` | Multi-tenant support |
| `users` | System users |
| `user_roles` | RBAC mapping |
| `customers` | Clients |
| `sites` | Work sites/projects |
| `trucks` | Fleet vehicles |
| `trailers` | Trailers |
| `drivers` | Drivers |
| `materials` | Material types (dirt, gravel, etc.) |
| `price_lists` | Pricing rules |
| `jobs` | Individual hauling trips |
| `job_status_events` | Audit trail with GPS |
| `delivery_notes` | Signature + receiver |
| `weigh_tickets` | Scale receipts |
| `files` | S3 storage metadata |
| `job_files` | Photos/documents per job |
| `statements` | Customer invoices |
| `statement_lines` | Invoice line items |
| `payments` | Received payments |
| `payment_allocations` | Payment → Statement |
| `expenses` | Operational costs |
| `audit_logs` | Change tracking |

---

## API Endpoints 📡

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Invalidate token
- `GET /api/auth/me` - Get current user

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create customer
- `PATCH /api/customers/{id}` - Update
- `DELETE /api/customers/{id}` - Delete

### Jobs (Core workflow)
- `GET /api/jobs?date=&status=&driver_id=` - List with filters
- `POST /api/jobs` - Create job
- `PATCH /api/jobs/{id}` - Update job
- `POST /api/jobs/{id}/status` - Change status (creates event)
- `POST /api/jobs/{id}/delivery-note` - Add signature
- `POST /api/jobs/{id}/files` - Upload photo/document

### Pricing
- `GET /api/pricing/price-lists` - List price lists
- `POST /api/pricing/price-lists` - Create price list
- `POST /api/pricing/preview` - Calculate job pricing

### Statements
- `POST /api/statements/generate` - Generate invoice
- `GET /api/statements?customer_id=&status=` - List statements
- `PATCH /api/statements/{id}/status` - Update status
- `POST /api/payments` - Record payment
- `POST /api/payments/{id}/allocate` - Allocate to statements

**Full API documentation:** http://localhost:8000/docs

---

## Environment Variables 🔧

```env
# Backend
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/fleet_db
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_DAYS=7
BACKEND_CORS_ORIGINS=["http://localhost:3000"]

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000/api

# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=fleet_db

# MinIO (S3-compatible storage)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
```

---

## Development Workflow 👨‍💻

### Backend Development
```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start dev server (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend

# Install dependencies
npm install

# Start dev server (with hot reload)
npm run dev
# Open http://localhost:3000
```

### Database Migrations
```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "Add new table"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## Testing 🧪

### Manual Testing Checklist

1. **Login**
   - [ ] Login with admin@example.com / admin123
   - [ ] Check token stored in localStorage
   - [ ] Redirect to /dashboard

2. **Create Job**
   - [ ] Dashboard → New Job
   - [ ] Fill: customer, sites, material, qty
   - [ ] Assign driver + truck
   - [ ] Check status = ASSIGNED

3. **Driver App**
   - [ ] Open /driver.html
   - [ ] Login as driver
   - [ ] See today's jobs
   - [ ] Update status → ENROUTE_PICKUP
   - [ ] Update → LOADED
   - [ ] Update → DELIVERED (requires photo + signature)

4. **Generate Statement**
   - [ ] Navigate to Statements
   - [ ] Click "Generate"
   - [ ] Select customer + date range
   - [ ] Preview lines
   - [ ] Confirm → Statement created with number

5. **Record Payment**
   - [ ] Statements → Select unpaid statement
   - [ ] Click "Payment"
   - [ ] Enter amount + date
   - [ ] Allocate to statement
   - [ ] Check status → PAID

---

## Deployment 🚢

### Production Docker Compose

```bash
# 1. Update .env with production values
cp .env.example .env
nano .env  # Change SECRET_KEY, passwords, etc.

# 2. Build and start
docker-compose -f docker-compose.prod.yml up -d

# 3. Run migrations
docker-compose exec backend alembic upgrade head

# 4. Create first admin user
docker-compose exec backend python -c "
from app.core.database import SessionLocal
from app.core.security import get_password_hash
from app.models import User, UserRoleModel, Organization
db = SessionLocal()
org = Organization(name='Your Company', timezone='Asia/Jerusalem')
db.add(org)
db.flush()
user = User(
    org_id=org.id,
    name='Admin',
    email='your@email.com',
    password_hash=get_password_hash('your-secure-password')
)
db.add(user)
db.flush()
role = UserRoleModel(org_id=org.id, user_id=user.id, role='ADMIN')
db.add(role)
db.commit()
print(f'Created admin user: {user.email}')
"
```

### Security Checklist ✅
- [ ] Change `SECRET_KEY` to random 32+ characters
- [ ] Update all default passwords
- [ ] Enable HTTPS (Nginx reverse proxy)
- [ ] Configure firewall (only 80/443 public)
- [ ] Set up database backups
- [ ] Configure CORS for production domain
- [ ] Enable rate limiting
- [ ] Set up monitoring (logs, errors)

---

## Troubleshooting 🔧

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Common issue: Database not ready
# Solution: Wait 10s, backend auto-reconnects

# Database connection refused
docker-compose ps  # Check postgres is running
docker-compose restart backend
```

### Frontend build errors
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run dev
```

### Database errors
```bash
# Reset database (⚠️ DELETES ALL DATA)
docker-compose down -v
docker-compose up -d postgres
# Wait 10s for init.sql to run
docker-compose up backend frontend
```

### Mobile app not loading jobs
```bash
# Check CORS settings
# Backend allows http://localhost:3000 by default
# If accessing from mobile device IP:
# Update BACKEND_CORS_ORIGINS in .env to include device IP
```

---

## Contributing 🤝

### Code Style
- **Backend**: PEP 8, type hints, docstrings
- **Frontend**: ESLint + Prettier
- **Commits**: Conventional Commits (feat/fix/docs)

### Adding New Features

1. **Backend API Endpoint**
```python
# backend/app/api/v1/endpoints/new_feature.py
from fastapi import APIRouter, Depends
from app.core.security import get_current_user

router = APIRouter()

@router.get("/new-endpoint")
def new_endpoint(current_user = Depends(get_current_user)):
    return {"message": "Hello"}
```

2. **Frontend Page**
```typescript
// frontend/src/app/new-page/page.tsx
'use client'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function NewPage() {
  return (
    <DashboardLayout>
      <h1>New Feature</h1>
    </DashboardLayout>
  )
}
```

3. **Add to Navigation**
```typescript
// components/layout/DashboardLayout.tsx
const navItems = [
  // ...existing items
  { name: t('nav.newFeature'), href: '/new-page', icon: Icon }
]
```

---

## Roadmap 🗺️

### ✅ Phase 1 - MVP (COMPLETED)
- [x] Authentication + RBAC
- [x] Core entities CRUD (customers, sites, fleet, materials)
- [x] Job management + status workflow
- [x] Mobile driver app with offline support
- [x] Pricing engine with automatic calculation
- [x] Statement generation + payment tracking
- [x] Multilingual (Hebrew + English)
- [x] Docker deployment

### 🚧 Phase 2 - Enhancements
- [ ] Drag & drop dispatch board (react-beautiful-dnd)
- [ ] PDF/Excel export (python-pptx, openpyxl)
- [ ] OCR for weigh tickets (Tesseract)
- [ ] Customer portal (view-only access)
- [ ] Maintenance alerts (insurance/test expiry)
- [ ] Advanced KPIs dashboard
- [ ] Subcontractor management
- [ ] Real-time notifications (WebSockets)

### 🔮 Phase 3 - Scale
- [ ] Mobile native apps (React Native)
- [ ] Route optimization (Google Maps API)
- [ ] Fuel tracking integration
- [ ] Automated dispatch rules
- [ ] Business intelligence dashboards
- [ ] Multi-currency support
- [ ] API for third-party integrations

---

## License 📄

Proprietary - All rights reserved

---

## Support & Contact 💬

<div dir="rtl">

### תמיכה טכנית
- 📧 Email: support@fleetmanagement.com
- 📞 Phone: +972-XX-XXXXXXX
- 💬 WhatsApp: +972-XX-XXXXXXX

### מסמכי עזרה
- [תיעוד מלא](./MVP_COMPLETE.md)
- [מסמך איפיון](./plan.md)
- [API Documentation](http://localhost:8000/docs)

</div>

---

**Built with ❤️ for Israeli dirt hauling companies** 🇮🇱

<div dir="rtl">
מערכת ניהול הובלות - פשוט, מהיר, יעיל! 🚀
</div>
