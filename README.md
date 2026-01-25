# Fleet Management System - מערכת ניהול הובלות עפר

## 📋 תוכן עניינים
- [סקירה כללית](#סקירה-כללית)
- [תכונות עיקריות](#תכונות-עיקריות)
- [התקנה מהירה](#התקנה-מהירה)
- [מבנה הפרויקט](#מבנה-הפרויקט)
- [תיעוד](#תיעוד)
- [Super Admin](#super-admin)
- [פתרון בעיות](#פתרון-בעיות)

---

## 🎯 סקירה כללית

מערכת לניהול מקצה לקצה של פעילות הובלות עפר - Multi-Tenant SaaS:

- **ניהול ארגונים** - מערכת Super Admin לניהול מרובה ארגונים
- **תפעול יומי** - Dispatch, שיבוץ נהגים, ניהול נסיעות
- **תעוד דיגיטלי** - תעודות משלוח, שקילה, חתימות דיגיטליות
- **חיוב אוטומטי** - מחירון, חישוב חיוב, חשבוניות
- **דוחות ואנליטיקה** - רווחיות, תפוקה, יעילות

---

## ⚡ תכונות עיקריות

### 🏢 Multi-Tenant Architecture
- **בידוד מלא** בין ארגונים (org_id בכל טבלה)
- **Super Admin Interface** - ניהול כל הארגונים ממקום אחד
- **Impersonation** - צפייה כארגון ספציפי לתמיכה
- **Tenant Middleware** - הפרדה אוטומטית ברמת API

### 👨‍💼 Super Admin
- יצירת ארגונים חדשים
- עריכת פרטי ארגון (שם, טלפון, ח.פ, מגבלות)
- השעיה/הפעלה של ארגונים
- מעקב סטטיסטיקות מערכתיות
- ניהול תוכניות ומגבלות

### 📱 אפליקציית נהג (PWA)
- קבלת משימות בזמן אמת
- עדכוני סטטוס (טעינה → פריקה → הושלם)
- העלאת תמונות ותעודות
- חתימה דיגיטלית
- עבודה Offline

### 💼 ממשק ניהול Web
- **Dashboard** - תצוגה כוללת של פעילות
- **Dispatch Board** - שיבוץ נהגים ומשאיות
- **ניהול לקוחות** - פרויקטים, אתרים, מחירונים
- **ניהול צי** - משאיות, נהגים, זמינות
- **חיוב וגבייה** - חשבוניות, תשלומים, יתרות
- **דוחות** - רווחיות, תפוקה, חובות

---

## 🚀 התקנה מהירה

### דרישות מקדימות
- Docker & Docker Compose
- Node.js 18+ (לפיתוח מחוץ לקונטיינר)
- PostgreSQL 15 (דרך Docker)

### הרצה מהירה

```bash
# 1. שכפול הפרויקט
git clone https://github.com/bhaataha/Fleet_Management.git
cd Fleet_Management

# 2. הרצת המערכת
docker-compose up -d

# 3. המתן לבניה (פעם ראשונה ~2-3 דקות)
# Frontend: http://localhost:3010
# Backend API: http://localhost:8001
# API Docs: http://localhost:8001/docs
```

### כניסה ראשונה

**Super Admin:**
- Email: `admin@fleetmanagement.com`
- Password: `SuperAdmin123!`
- URL: http://localhost:3010/super-admin

**ארגון ברירת מחדל:**
- Email: `admin@example.com`
- Password: `Admin123!`
- URL: http://localhost:3010/login

📚 **מדריך מפורט:** [docs/setup/GETTING_STARTED.md](docs/setup/GETTING_STARTED.md)

---

## 📁 מבנה הפרויקט

```
Fleet_Management/
├── backend/              # FastAPI + SQLAlchemy
│   ├── app/
│   │   ├── api/v1/      # Endpoints
│   │   ├── models/      # Database Models
│   │   ├── middleware/  # Tenant Isolation
│   │   └── core/        # Config, Auth
│   └── alembic/         # DB Migrations
│
├── frontend/            # Next.js 14 + TypeScript
│   ├── src/
│   │   ├── app/         # Pages (App Router)
│   │   ├── components/  # React Components
│   │   ├── lib/         # API, Utils, i18n
│   │   └── types/       # TypeScript Types
│   └── public/          # Static Files
│
├── docs/                # תיעוד מפורט
│   ├── architecture/    # תכנון מערכת
│   ├── features/        # תיעוד תכונות
│   ├── phases/          # שלבי פיתוח
│   ├── setup/           # התקנה ותצורה
│   └── troubleshooting/ # פתרון בעיות
│
├── uploads/             # קבצים שהועלו
└── docker-compose.yml   # הגדרות Docker
```

---

## 📖 תיעוד

### מדריכי התקנה
- [מדריך התחלה מהיר](docs/setup/QUICK_START.md)
- [התקנה מפורטת](docs/setup/GETTING_STARTED.md)
- [נתוני דוגמה](docs/setup/DEMO_DATA.md)
- [מדריך בדיקות](docs/setup/TESTING_GUIDE.md)

### אדריכלות ותכנון
- [PRD מלא](docs/architecture/plan.md) - תכנון מפורט של המערכת
- [מבנה מערכת](docs/STRUCTURE.md)

### תכונות
- [Super Admin UI](docs/features/SUPER_ADMIN_UI_GUIDE.md) - מדריך משתמש
- [Super Admin Technical](docs/features/SUPER_ADMIN_UI_COMPLETE.md) - תיעוד טכני
- [עריכת ארגונים](docs/features/EDIT_ORGANIZATION_FEATURE.md)
- [גישת Super Admin](docs/features/SUPER_ADMIN_ACCESS.md)

### שלבי פיתוח
- [Phase 1 - Multi-Tenant](docs/phases/PHASE_1_COMPLETE.md)
- [Multi-Tenant Status](docs/phases/MULTI_TENANT_STATUS.md)
- [Super Admin Complete](docs/features/SUPER_ADMIN_COMPLETE.md)

### פתרון בעיות
- [תיקון CORS Service Worker](docs/troubleshooting/SW_CORS_FIX.md)
- [אימות Database](docs/troubleshooting/DATABASE_VERIFICATION.md)

---

## 👑 Super Admin

### גישה
```
URL: http://localhost:3010/super-admin
Email: admin@fleetmanagement.com
Password: SuperAdmin123!
```

### תכונות
✅ יצירת ארגונים חדשים  
✅ עריכת פרטי ארגון (שם, טלפון, ח.פ, מגבלות)  
✅ השעיה/הפעלה של ארגונים  
✅ מחיקת ארגונים (עם אישור כפול)  
✅ Impersonation - צפייה כארגון ספציפי  
✅ סטטיסטיקות מערכת (ארגונים, משתמשים, משאיות)  

📚 **מדריך מלא:** [Super Admin UI Guide](docs/features/SUPER_ADMIN_UI_GUIDE.md)

---

## 🔧 פתרון בעיות

### שגיאות CORS מ-Service Worker
```
Access to fetch at 'http://localhost:8001/api/...' blocked by CORS
```
**פתרון:** גש ל-http://localhost:3010/clear-sw.html ולחץ "נקה Service Workers"

📚 [מדריך מלא](docs/troubleshooting/SW_CORS_FIX.md)

### שגיאות TypeScript
```
Cannot find module 'react' or JSX element implicitly has type 'any'
```
**פתרון:** 
1. Ctrl+Shift+P
2. הקלד: `TypeScript: Restart TS Server`
3. Enter

### Backend לא עולה
```bash
# בדוק לוגים
docker-compose logs backend

# הפעל מחדש
docker-compose restart backend
```

### Database Connection Error
```bash
# בדוק שהDB רץ
docker-compose ps db

# הפעל מחדש DB
docker-compose restart db
```

---

## 🛠️ פיתוח

### הרצה מקומית (ללא Docker)

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### מסד נתונים

```bash
# Migrations
cd backend
alembic upgrade head

# יצירת migration חדש
alembic revision --autogenerate -m "description"

# SQL ישיר
docker-compose exec db psql -U fleet_user -d fleet_management
```

---

## 🏗️ טכנולוגיות

### Backend
- **FastAPI** - Python web framework
- **SQLAlchemy** - ORM
- **PostgreSQL** - Database
- **Alembic** - Migrations
- **JWT** - Authentication
- **Pydantic** - Validation

### Frontend
- **Next.js 14** - React Framework (App Router)
- **TypeScript** - Type Safety
- **Tailwind CSS** - Styling
- **Axios** - HTTP Client
- **Zustand** - State Management
- **Lucide React** - Icons

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Orchestration

---

## 📊 סטטוס הפרויקט

### ✅ הושלם
- ✅ Multi-Tenant Architecture
- ✅ Super Admin Interface (CRUD ארגונים)
- ✅ עריכת ארגונים (שם, טלפון, מגבלות)
- ✅ Authentication & Authorization
- ✅ Tenant Middleware
- ✅ Impersonation
- ✅ Service Worker Fixes

### 🚧 בפיתוח
- Phase 3: Endpoint org_id Filtering (13 קבצים)
- User Management UI
- Driver Mobile App
- Jobs Dispatch Board

### 📅 עתידי
- Customer Portal
- Advanced Analytics
- Mobile Native Apps
- White Labeling

---

## 🤝 תרומה

הפרויקט נמצא בפיתוח פעיל. לשאלות או בעיות:
- פתח Issue ב-GitHub
- צור Pull Request עם תיאור מפורט

---

## 📝 רישיון

This project is private and proprietary.

---

## 📞 יצירת קשר

**Repository:** https://github.com/bhaataha/Fleet_Management  
**Issues:** https://github.com/bhaataha/Fleet_Management/issues

---

**עודכן לאחרונה:** 25 ינואר 2026  
**גרסה:** 1.0.0 (MVP)
