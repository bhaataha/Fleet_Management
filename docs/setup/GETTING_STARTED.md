# הוראות הרצה - Fleet Management System

## מה בנינו עד עכשיו

✅ **Backend (FastAPI)**
- מבנה פרויקט מלא עם FastAPI
- 7 API endpoints מרכזיים: Auth, Customers, Sites, Trucks, Drivers, Materials, Jobs
- מודל נתונים מלא ב-SQLAlchemy (20+ טבלאות)
- מערכת אימות JWT עם RBAC
- Alembic למיגרציות DB
- Docker configuration

✅ **Frontend (Next.js)**
- Next.js 14 עם App Router
- TypeScript + Tailwind CSS
- API client מובנה עם Axios
- Types מלאים matching Backend
- RTL support (עברית)
- דף בית עם ניווט

✅ **Infrastructure**
- Docker Compose עם PostgreSQL, MinIO, Backend, Frontend
- Environment configuration
- Git setup

## איך להריץ את המערכת

### שלב 1: הכנה
```bash
cd /home/bhaa/workspace/Fleet_Management

# העתק .env.example ל-.env
cp .env.example .env

# ודא ש-Docker מותקן ופועל
docker --version
docker-compose --version
```

### שלב 2: הרצת Services
```bash
# הרץ את כל ה-services (יורד images ובונה containers)
docker-compose up -d

# בדוק שהכל רץ
docker-compose ps
```

צריך לראות:
- `fleet_db` (PostgreSQL) - port 5432
- `fleet_backend` (FastAPI) - port 8000
- `fleet_frontend` (Next.js) - port 3000
- `fleet_minio` (S3 storage) - port 9000/9001

### שלב 3: Initialize Database
```bash
# צור migration ראשוני
docker-compose exec backend alembic revision --autogenerate -m "initial tables"

# הרץ migrations
docker-compose exec backend alembic upgrade head

# טען נתונים ראשוניים (admin user, sample data)
docker-compose exec postgres psql -U fleet_user -d fleet_management -f /docker-entrypoint-initdb.d/init.sql
```

### שלב 4: Install Frontend Dependencies
```bash
# נכנס לתיקיית frontend ומתקין packages
cd frontend
npm install
cd ..

# או בתוך Docker container:
docker-compose exec frontend npm install
```

### שלב 5: גישה למערכת
- **Frontend**: http://localhost:3000
- **Backend API Docs**: http://localhost:8000/docs
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

**משתמש ברירת מחדל**:
- Email: `admin@example.com`
- Password: `admin123`

## פקודות שימושיות

### Backend
```bash
# צפה ב-logs
docker-compose logs -f backend

# כנס ל-shell
docker-compose exec backend bash

# הרץ tests (כשנוסיף)
docker-compose exec backend pytest
```

### Frontend
```bash
# צפה ב-logs
docker-compose logs -f frontend

# Rebuild עם dependencies חדשים
docker-compose restart frontend
```

### Database
```bash
# גישה ל-PostgreSQL
docker-compose exec postgres psql -U fleet_user -d fleet_management

# Backup
docker-compose exec postgres pg_dump -U fleet_user fleet_management > backup.sql

# Restore
cat backup.sql | docker-compose exec -T postgres psql -U fleet_user -d fleet_management
```

### Stop/Clean
```bash
# עצור את כל ה-services
docker-compose down

# עצור ומחק volumes (מחיקת DB!)
docker-compose down -v
```

## מה חסר להמשך הפיתוח

### שלב הבא (Priority 1)
1. **Auth UI** - דף login, protected routes, state management
2. **Dispatch Board** - לוח יומי עם jobs, drag & drop assignment
3. **Job Details** - עמוד פרטי נסיעה עם timeline
4. **Customers/Sites Pages** - טפסים ליצירה/עריכה

### שלב 2
1. **Mobile Driver App** - PWA עם status updates, camera, signature
2. **Pricing Engine** - חישוב מחיר אוטומטי
3. **Statement Generation** - PDF/Excel export
4. **Payment Tracking** - AR aging, allocations

### שלב 3
1. **Reports** - דוחות תפעול וכספים
2. **File Upload** - S3 integration, image handling
3. **Audit Logs** - tracking changes
4. **Role-based UI** - hide/show features by role

## בעיות נפוצות

**Backend לא עולה:**
```bash
docker-compose logs backend
# בדוק שה-DATABASE_URL נכון ב-.env
```

**Frontend לא מתחבר ל-Backend:**
```bash
# וודא ש-NEXT_PUBLIC_API_URL נכון ב-.env
# וודא שה-CORS origins כוללים את http://localhost:3000
```

**Database connection error:**
```bash
# וודא שהקונטיינר של postgres בריא
docker-compose ps postgres
# אם לא, הרץ מחדש
docker-compose restart postgres
```

## מבנה הקבצים

```
Fleet_Management/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Config, security, database
│   │   └── models/         # SQLAlchemy models
│   ├── alembic/            # DB migrations
│   └── db/init.sql         # Initial seed data
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # Pages (App Router)
│   │   ├── lib/           # API client, utils
│   │   └── types/         # TypeScript types
│   └── public/
├── docker-compose.yml      # Services orchestration
├── .env.example           # Environment template
└── README.md              # Main documentation
```

## תיעוד נוסף

- **PRD מלא**: [plan.md](plan.md) - איפיון מלא בעברית
- **AI Instructions**: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- **API Docs**: http://localhost:8000/docs (Swagger UI)

## צור קשר

לשאלות ותמיכה, פנה למפתח הראשי.
