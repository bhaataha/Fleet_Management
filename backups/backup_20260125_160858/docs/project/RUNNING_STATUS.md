# Fleet Management System - מצב הרצה

## ✅ המערכת פועלת!

כל השירותים רצים בהצלחה:

### 🌐 גישה למערכת

- **Frontend (Web Admin)**: http://localhost:3010
- **Backend API Documentation**: http://localhost:8001/docs
- **Backend API Base**: http://localhost:8001/api
- **MinIO Console (Storage)**: http://localhost:9101
  - Username: `minioadmin`
  - Password: `minioadmin`

### 👤 משתמש Admin

- **Email**: `admin@fleet.com`
- **Password**: `admin123`
- **Role**: ADMIN
- **Organization**: Fleet Management Co.

### 🐳 Docker Containers

כל ה-containers רצים:

```bash
✅ fleet_db (PostgreSQL) - Port 5434:5432
✅ fleet_backend (FastAPI) - Port 8001:8000
✅ fleet_frontend (Next.js) - Port 3010:3000
✅ fleet_minio (MinIO S3) - Ports 9100:9000, 9101:9001
```

### 📊 Database

- PostgreSQL 15
- Database: `fleet_management`
- User: `fleet_user`
- Password: `fleet_password`
- Migrations: ✅ רצו בהצלחה (`alembic upgrade head`)

### 🔧 פקודות שימושיות

#### עצירה והפעלה
```bash
# עצור את כל השירותים
docker-compose down

# הפעל את כל השירותים
docker-compose up -d

# הפעל מחדש שירות ספציפי
docker-compose restart backend
docker-compose restart frontend
```

#### Logs
```bash
# ראה logs של backend
docker-compose logs -f backend

# ראה logs של frontend
docker-compose logs -f frontend

# ראה logs של כל השירותים
docker-compose logs -f
```

#### Database
```bash
# התחבר ל-database
docker exec -it fleet_db psql -U fleet_user -d fleet_management

# הרץ migrations
docker exec fleet_backend alembic upgrade head

# צור migration חדש
docker exec fleet_backend alembic revision --autogenerate -m "description"
```

#### יצירת משתמש admin נוסף
```powershell
docker exec fleet_backend python -c "import sys; sys.path.insert(0, '/app'); from app.core.database import SessionLocal; from app.core.security import get_password_hash; from app.models import User, UserRoleModel, Organization, UserRole; db = SessionLocal(); org = db.query(Organization).first(); user = User(org_id=org.id, name='New Admin', email='newadmin@fleet.com', password_hash=get_password_hash('password123'), is_active=True); db.add(user); db.flush(); role = UserRoleModel(org_id=org.id, user_id=user.id, role=UserRole.ADMIN); db.add(role); db.commit(); print('✅ Admin created')"
```

### 🧪 בדיקת API

```powershell
# התחברות
$body = @{email="admin@fleet.com"; password="admin123"} | ConvertTo-Json
$response = Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.access_token

# קבלת רשימת לקוחות (עם token)
$headers = @{Authorization = "Bearer $token"}
Invoke-RestMethod -Uri "http://localhost:8001/api/customers" -Headers $headers
```

### 📁 מבנה הפרויקט

```
Fleet_Management/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/     # API endpoints
│   │   ├── core/    # Auth, config, database
│   │   ├── models/  # SQLAlchemy models
│   └── alembic/     # Database migrations
├── frontend/        # Next.js web admin
│   ├── src/
│   │   ├── app/    # Pages (App Router)
│   │   ├── components/
│   │   └── lib/    # API client, i18n
└── docker-compose.yml
```

### 🎯 הצעדים הבאים

1. **התחבר למערכת** דרך http://localhost:3010
2. **התנסה ב-API** דרך http://localhost:8001/docs
3. **צור לקוחות, משאיות, נהגים** דרך הממשק
4. **תכנן נסיעות** בלוח התכנון היומי
5. **נסה כניסה כנהג** דרך http://localhost:3010/driver.html

### 📋 שיפורים נדרשים

המערכת פועלת אבל יש פיצ'רים שדורשים השלמה:

- ⚠️ **העלאת תמונות** - הכפתור קיים באפליקציית הנהג אבל אין backend
- ⚠️ **חתימה דיגיטלית** - הטבלה קיימת ב-DB אבל אין UI
- ⚠️ **מפת מעקב GPS** - המיקומים נשמרים אבל אין תצוגת מפה
- ⚠️ **PDF דוחות** - צריך להוסיף יצוא PDF של תעודות משלוח

**לפרטים מלאים**: ראה [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md)

### ⚠️ הערות חשובות

- הפורטים שונו מהברירת מחדל:
  - Frontend: 3010 (במקום 3000)
  - Backend: 8001 (במקום 8000)
  - PostgreSQL: 5434 (במקום 5432)
  - MinIO: 9100/9101 (במקום 9000/9001)
  
- זאת סביבת פיתוח - אל תשתמש בה בפרודקשן בלי שינויים ביטחוניים

### 🐛 פתרון בעיות

אם יש בעיות:

```bash
# נקה הכל והתחל מחדש
docker-compose down -v
docker-compose up -d --build

# הרץ שוב את המיגרציות
docker exec fleet_backend alembic upgrade head

# צור שוב משתמש admin
# (השתמש בפקודה מלמעלה)
```

---

**תאריך יצירה**: 25 ינואר 2026
**גרסה**: MVP v1.0
**סטטוס**: ✅ פעיל ומוכן לשימוש
