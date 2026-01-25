# 🚀 Quick Start Guide - Fleet Management

## התחלה מהירה למפתח

### 📥 הורדה והרצה ראשונית

```bash
# 1. Clone the repo
git clone https://github.com/bhaataha/Fleet_Management.git
cd Fleet_Management

# 2. הפעל את המערכת
docker-compose up -d

# 3. הרץ migrations
docker exec fleet_backend alembic upgrade head

# 4. צור admin + נתוני demo
docker exec fleet_backend python -c "import sys; sys.path.insert(0, '/app'); from app.core.database import SessionLocal; from app.core.security import get_password_hash; from app.models import User, UserRoleModel, Organization, UserRole; db = SessionLocal(); org = Organization(name='Fleet Management Co.', timezone='Asia/Jerusalem'); db.add(org); db.flush(); user = User(org_id=org.id, name='Admin User', email='admin@fleet.com', password_hash=get_password_hash('admin123'), is_active=True); db.add(user); db.flush(); role = UserRoleModel(org_id=org.id, user_id=user.id, role=UserRole.ADMIN); db.add(role); db.commit(); print('✅ Admin created')"

docker exec fleet_backend python /app/scripts/add_demo_data.py

# 5. גש לדפדפן
# Admin: http://localhost:3010
# Driver: http://localhost:3010/driver.html
# API: http://localhost:8001/docs
```

---

## 👤 Login Credentials

### Admin
- URL: http://localhost:3010
- Email: `admin@fleet.com`
- Password: `admin123`

### Drivers
- URL: http://localhost:3010/driver.html
- Phone: `050-1111111` (משה כהן)
- Password: `driver123`

**All drivers**: Password is `driver123`  
**Phone numbers**: 050-1111111, 052-2222222, 053-3333333, 054-4444444, 055-5555555

---

## 🛠️ Development Commands

### Docker
```bash
# Start all services
docker-compose up -d

# Stop all
docker-compose down

# Restart backend (after code changes)
docker-compose restart backend

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Shell access
docker exec -it fleet_backend bash
docker exec -it fleet_db psql -U fleet_user -d fleet_management
```

### Database
```bash
# Create migration
docker exec fleet_backend alembic revision --autogenerate -m "description"

# Run migrations
docker exec fleet_backend alembic upgrade head

# Rollback
docker exec fleet_backend alembic downgrade -1

# Reset DB (delete all data)
docker-compose down -v
docker-compose up -d
docker exec fleet_backend alembic upgrade head
```

### Backend (Local Development)
```bash
cd backend

# Create venv
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install deps
pip install -r requirements.txt

# Run locally (without Docker)
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
black app/
isort app/
```

### Frontend (Local Development)
```bash
cd frontend

# Install
npm install

# Dev server
npm run dev

# Build
npm run build

# Lint
npm run lint
```

---

## 📂 Project Structure

```
Fleet_Management/
├── backend/               # FastAPI backend
│   ├── app/
│   │   ├── api/v1/endpoints/  # API routes
│   │   ├── core/              # Config, auth, db
│   │   ├── models/            # SQLAlchemy models
│   │   └── main.py
│   ├── alembic/           # DB migrations
│   └── scripts/           # Utility scripts
│
├── frontend/              # Next.js admin
│   ├── src/app/          # Pages (App Router)
│   ├── src/components/   # React components
│   ├── src/lib/          # Utils, API client
│   └── public/
│       └── driver.html   # PWA for drivers
│
├── docker-compose.yml
├── DEMO_DATA.md          # Demo credentials
├── TODO_IMPROVEMENTS.md  # Roadmap
└── README.md
```

---

## 🔌 API Quick Reference

### Authentication
```bash
# Login
POST /api/auth/login
Body: {"email": "admin@fleet.com", "password": "admin123"}
# OR for drivers:
Body: {"phone": "050-1111111", "password": "driver123"}

# Get current user
GET /api/auth/me
Headers: Authorization: Bearer {token}
```

### Jobs
```bash
# List jobs
GET /api/jobs?date=2026-01-25&status=ASSIGNED

# Create job
POST /api/jobs
Body: {
  "customer_id": 1,
  "from_site_id": 7,
  "to_site_id": 1,
  "material_id": 1,
  "planned_qty": 25,
  "unit": "TON",
  "scheduled_date": "2026-01-25",
  "driver_id": 1,
  "truck_id": 1
}

# Update status
POST /api/jobs/{id}/status
Body: {
  "status": "ENROUTE_PICKUP",
  "lat": 32.0853,
  "lng": 34.7818
}
```

### CRUD Endpoints
- `GET/POST /api/customers`
- `GET/POST /api/sites`
- `GET/POST /api/trucks`
- `GET/POST /api/drivers`
- `GET/POST /api/materials`
- `GET/POST /api/price-lists`

---

## 🧪 Testing Scenarios

### Scenario 1: Complete Job Flow
```
1. Admin creates job → assigns to driver
2. Driver sees job in app
3. Driver: "יצאתי לטעינה" → ENROUTE_PICKUP
4. Driver: "נטענתי" → LOADED
5. Driver: "יצאתי לפריקה" → ENROUTE_DROPOFF
6. Driver: Takes photo + signature → DELIVERED
7. Admin sees completed job
```

### Scenario 2: API Testing
```powershell
# 1. Login
$auth = @{email="admin@fleet.com"; password="admin123"} | ConvertTo-Json
$res = Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" -Method POST -ContentType "application/json" -Body $auth
$token = $res.access_token

# 2. Get jobs
$headers = @{Authorization = "Bearer $token"}
$jobs = Invoke-RestMethod -Uri "http://localhost:8001/api/jobs" -Headers $headers
$jobs | ConvertTo-Json

# 3. Create customer
$customer = @{
  name = "לקוח חדש"
  vat_id = "515999999"
  contact_name = "יוסי"
  phone = "050-9999999"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/customers" -Method POST -Headers $headers -ContentType "application/json" -Body $customer
```

---

## 🐛 Common Issues

### Port already in use
```bash
# Check what's using port 3010
netstat -ano | findstr :3010

# Kill process (Windows)
taskkill /PID <PID> /F

# Or change ports in docker-compose.yml
```

### Database connection error
```bash
# Wait for PostgreSQL to be ready
docker-compose up -d
sleep 10
docker exec fleet_backend alembic upgrade head
```

### Frontend not loading
```bash
# Rebuild frontend
docker-compose down
docker-compose up -d --build frontend

# Or clear cache
docker-compose exec frontend npm cache clean --force
docker-compose restart frontend
```

### Can't login
```bash
# Recreate admin user
docker exec fleet_backend python -c "..."  # (see initial setup)
```

---

## 📊 Database Schema Quick Ref

### Key Tables
- `organizations` - Multi-tenant support
- `users` - All system users
- `user_roles` - RBAC (ADMIN, DRIVER, DISPATCH, ACCOUNTING)
- `customers` - Clients
- `sites` - Project locations
- `materials` - Dirt, gravel, etc.
- `trucks` - Fleet vehicles
- `drivers` - Driver profiles (linked to users)
- `jobs` - Trips/deliveries
- `job_status_events` - Status history + GPS
- `price_lists` - Pricing rules
- `files` - S3 file metadata
- `job_files` - Photos/docs per job

---

## 🔗 Useful Links

- **Admin UI**: http://localhost:3010
- **Driver App**: http://localhost:3010/driver.html
- **API Docs**: http://localhost:8001/docs
- **MinIO Console**: http://localhost:9101 (minioadmin/minioadmin)
- **Database**: localhost:5434 (fleet_user/fleet_password)

---

## 📚 Documentation Files

- [DEMO_DATA.md](DEMO_DATA.md) - Test data & credentials
- [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) - Roadmap & missing features
- [RUNNING_STATUS.md](RUNNING_STATUS.md) - Current system status
- [DRIVER_PHONE_LOGIN.md](DRIVER_PHONE_LOGIN.md) - Phone auth implementation
- [plan.md](plan.md) - Full PRD (Hebrew)

---

**Last Updated**: 25 January 2026  
**Version**: MVP v1.1  
**Status**: ✅ Running with demo data
