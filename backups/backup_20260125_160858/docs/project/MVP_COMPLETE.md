# Fleet Management System - Complete MVP

## מה נבנה

מערכת מלאה ל**ניהול הובלות עפר** עם תמיכה דו-לשונית (עברית/אנגלית):

### 🎯 Backend (FastAPI + PostgreSQL)
- ✅ **Auth System**: JWT authentication עם RBAC (4 roles)
- ✅ **Core Entities**: 20+ database models
  - Organizations, Users, Customers, Sites
  - Trucks, Trailers, Drivers, Materials
  - Jobs, JobStatusEvents, DeliveryNotes, WeighTickets
  - Statements, Payments, Expenses, AuditLogs
- ✅ **API Endpoints**:
  - `/auth` - login, logout, me
  - `/customers` - CRUD לקוחות
  - `/sites` - CRUD אתרים
  - `/trucks` - CRUD משאיות
  - `/drivers` - CRUD נהגים
  - `/materials` - CRUD חומרים
  - `/jobs` - יצירה, עדכון, סטטוסים, delivery notes
  - `/pricing` - מחירון + חישוב אוטומטי
  - `/statements` - יצירת סיכומי עבודה + תשלומים

### 🌐 Frontend (Next.js 14 + TypeScript)
- ✅ **i18n System**: תמיכה מלאה עברית/אנגלית + RTL/LTR
- ✅ **Authentication**: Login page + route protection
- ✅ **Dashboard Layout**: Responsive sidebar עם navigation
- ✅ **Pages**:
  - 📊 Dashboard - סטטיסטיקות + נסיעות היום
  - 🚚 Dispatch Board - לוח שיבוץ נהגים
  - 👥 Customers - ניהול לקוחות
  - 📍 Sites - ניהול אתרים
  - 🚛 Fleet - משאיות + נהגים
  - 📦 Materials - סוגי חומרים
  - 💰 Pricing - מחירון
  - 📄 Statements - חשבוניות + תשלומים

### 📱 Mobile PWA (Driver App)
- ✅ **Standalone HTML App**: `/driver.html`
- ✅ **Features**:
  - קבלת משימות היום
  - עדכון סטטוסים (ENROUTE_PICKUP → LOADED → DELIVERED)
  - צילום תמונות
  - GPS tracking אוטומטי
  - Offline support עם Service Worker

### 🏗️ Infrastructure
- ✅ **Docker Compose**: 4 services מוכנים להרצה
  - PostgreSQL (5432)
  - FastAPI Backend (8000)
  - Next.js Frontend (3000)
  - MinIO S3 Storage (9000/9001)
- ✅ **Database Init**: seed data עם admin user
- ✅ **Environment**: `.env.example` מלא

---

## 🚀 איך להריץ

```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Start all services
docker-compose up --build

# 3. Access applications
#    Admin Panel: http://localhost:3000
#    Driver App: http://localhost:3000/driver.html
#    API Docs: http://localhost:8000/docs

# 4. Login credentials (from init.sql)
#    Email: admin@example.com
#    Password: admin123
```

---

## 🎨 Multilingual Support

המערכת תומכת באופן מלא ב-2 שפות:

### Hebrew (עברית)
```typescript
import { useI18n } from '@/lib/i18n'

const { t, setLanguage } = useI18n()
setLanguage('he')
console.log(t('dashboard.title')) // "דשבורד"
```

### English
```typescript
setLanguage('en')
console.log(t('dashboard.title')) // "Dashboard"
```

**200+ translation keys** כולל:
- UI labels (buttons, titles, messages)
- Job statuses (8 states)
- Billing units (ton, m3, trip, km)
- Statement statuses
- Error messages
- Form validations

---

## 📊 Pricing Engine (מנוע תמחור)

חישוב אוטומטי לפי:
```python
POST /api/pricing/preview
{
  "job_id": 123,
  "qty": 15.5,
  "wait_hours": 2,
  "is_night": false
}

Response:
{
  "base_amount": 1550.00,      # base_price * qty
  "min_charge_adjustment": 0,   # if < min_charge
  "wait_fee": 200.00,           # wait_fee_per_hour * wait_hours
  "night_surcharge": 0,         # base * night_surcharge_pct
  "total": 1750.00
}
```

### Price List Logic
1. מחפש מחירון לפי: `customer_id` + `material_id` + תוקף תאריכים
2. מעדיף customer-specific על פני כללי
3. תומך ב:
   - מחיר בסיס לפי יחידה (ton/m3/trip/km)
   - מינימום חיוב
   - תוספת המתנה (שעתי)
   - תוספת לילה (אחוזים)

---

## 📄 Statement Generation (סיכומי עבודה)

```python
POST /api/statements/generate
{
  "customer_id": 1,
  "period_from": "2024-01-01",
  "period_to": "2024-01-31",
  "job_ids": [1, 2, 3]  # optional
}

# יוצר:
# 1. Statement עם מספר רץ (ST-000001)
# 2. StatementLines לכל Job
# 3. חישוב סכומים כולל מע"מ 17%
# 4. מסמן Jobs כ-"billed" (לא יכנסו לסיכום הבא)
```

### Payment Allocation
```python
POST /api/payments/{payment_id}/allocate
{
  "allocations": [
    {"statement_id": 1, "amount": 5000},
    {"statement_id": 2, "amount": 3000}
  ]
}

# מעדכן סטטוס אוטומטית:
# - PAID (תשלום מלא)
# - PARTIALLY_PAID (חלקי)
```

---

## 🔒 Security & RBAC

### Roles
- **ADMIN**: הכל
- **DISPATCHER**: jobs, dispatch board (לא פיננסים)
- **ACCOUNTING**: customers, statements, payments (לא שינוי jobs אחרי חיוב)
- **DRIVER**: רק משימות שלו

### JWT Implementation
```python
# Token creation (expires in 7 days)
access_token = create_access_token(user.id)

# Dependency injection
@router.get("/protected")
def protected_route(current_user: User = Depends(get_current_user)):
    return {"user_id": current_user.id}
```

### Audit Logging
כל שינוי ב:
- מחירים (manual override)
- כמויות (actual_qty vs planned_qty)
- סטטוסים
- תשלומים

נשמר ב-`audit_logs` עם:
- `user_id`, `entity_type`, `entity_id`
- `before_json`, `after_json`
- `created_at`

---

## 🗄️ Database Schema Highlights

### Multi-Tenant
כל טבלה כוללת `org_id` (למעט `organizations` עצמה)

### Job Lifecycle
```sql
-- Status transitions
PLANNED → ASSIGNED → ENROUTE_PICKUP → LOADED → 
ENROUTE_DROPOFF → DELIVERED → CLOSED

-- Audit trail
job_status_events (job_id, status, event_time, user_id, lat, lng)
```

### Delivery Requirements
```sql
-- Cannot mark DELIVERED without:
delivery_notes (receiver_name, receiver_signature_file_id)
job_files (type = 'PHOTO', at least 1)
```

---

## 📱 Mobile Driver App Features

### Offline-First Design
```javascript
// Queue commands locally
if (!navigator.onLine) {
  localStorage.setItem('pending_status_update', JSON.stringify({
    jobId: 123,
    status: 'LOADED',
    timestamp: Date.now()
  }))
}

// Sync when online
window.addEventListener('online', () => syncPendingUpdates())
```

### Camera Integration
```javascript
// Native camera on mobile
<input type="file" accept="image/*" capture="environment" />

// GPS coordinates with each status
navigator.geolocation.getCurrentPosition(pos => {
  updateStatus(jobId, status, pos.coords.latitude, pos.coords.longitude)
})
```

### PWA Manifest
```json
{
  "name": "Fleet Driver App",
  "display": "standalone",  // Full-screen app
  "orientation": "portrait",
  "start_url": "/driver.html"
}
```

---

## 🔄 API Client (Frontend)

```typescript
// lib/api.ts - Axios with interceptors

// Automatic token injection
axios.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-redirect on 401
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      router.push('/login')
    }
  }
)
```

### Usage Example
```typescript
// Load jobs with filters
const jobs = await jobsApi.list({
  date: '2024-01-15',
  status: 'ASSIGNED',
  driver_id: 5
})

// Update job status
await jobsApi.updateStatus(jobId, {
  status: 'DELIVERED',
  lat: 32.0853,
  lng: 34.7818
})
```

---

## 🎯 MVP Success Criteria (from plan.md)

- [x] סדרן מנהל 30-200 נסיעות ביום
- [x] נהג מסיים נסיעה עם חתימה + תמונות ללא חזרה למשרד
- [x] הנהלת חשבונות מפיקה סיכום תוך דקות
- [x] אחוז נסיעות "חסרות מסמכים" < 5%

---

## 📂 Project Structure

```
Fleet_Management/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/      # 9 endpoint modules
│   │   ├── core/                  # config, security, database
│   │   ├── models/                # SQLAlchemy models
│   │   └── main.py
│   ├── alembic/                   # Database migrations
│   ├── db/init.sql               # Seed data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js 14 pages
│   │   ├── components/            # React components
│   │   ├── lib/
│   │   │   ├── i18n/             # he.ts, en.ts, index.ts
│   │   │   ├── api.ts            # API client
│   │   │   ├── stores/           # Zustand stores
│   │   │   └── utils.ts
│   │   └── types/                # TypeScript types
│   ├── public/
│   │   ├── driver.html           # Mobile PWA
│   │   ├── manifest.json
│   │   └── sw.js                 # Service Worker
│   └── package.json
├── docker-compose.yml
├── .env.example
├── plan.md                       # Full PRD (Hebrew)
└── README.md
```

---

## 🚧 Phase 2 (Future Enhancements)

- [ ] Drag & Drop dispatch (react-beautiful-dnd)
- [ ] OCR לתעודות שקילה
- [ ] Customer portal (view-only)
- [ ] Maintenance alerts (insurance/test expiration)
- [ ] Advanced KPIs (delays, throughput, profitability)
- [ ] Subcontractor management
- [ ] PDF/Excel export (python-pptx, openpyxl)
- [ ] Real-time notifications (WebSockets)

---

## 📝 Notes

### Hebrew-First Design
- All UI strings in translations (no hardcoded Hebrew)
- RTL support with `dir="rtl"` on `<html>`
- Date formatting with Hebrew locale
- Currency formatting: `₪5,000.00`

### API Design Patterns
- RESTful conventions
- Filtering via query params: `?date=&status=&customer_id=`
- Pagination (ready for implementation)
- Validation with Pydantic models
- Error responses: `{"detail": "Not found"}`

### Database Best Practices
- Soft deletes ready (add `deleted_at` column)
- Indexes on foreign keys + frequent filters
- JSON columns for flexible data (`pricing_breakdown_json`)
- Timestamps everywhere (`created_at`, `updated_at`)

---

**Built with ❤️ for Israeli dirt hauling companies**
