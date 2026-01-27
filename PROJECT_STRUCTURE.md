# 📁 מבנה פרויקט Fleet Management

**עדכון אחרון:** 27/01/2026  
**גרסה:** 2.0

---

## 🗂️ מבנה תיקיות ראשי

```
Fleet_Management/
├── 📂 backend/              ← Backend (FastAPI + PostgreSQL)
├── 📂 frontend/             ← Frontend (Next.js + React)
├── 📂 docs/                 ← תיעוד מלא
├── 📂 backups/              ← גיבויים אוטומטיים
├── 📂 uploads/              ← קבצים מועלים
├── 📂 archive/              ← קבצים ישנים בארכיון
├── 📂 traefik/              ← Reverse proxy (production)
├── 📂 super-admin/          ← Super Admin UI
├── 📂 .github/              ← GitHub workflows
│
├── 📄 docker-compose.yml            ← Development
├── 📄 docker-compose.production.yml ← Production
├── 📄 README.md                     ← מדריך ראשי
├── 📄 setup-wizard.sh               ← התקנה אוטומטית
└── 📄 backup.sh                     ← גיבוי אוטומטי
```

---

## 📂 Backend

```
backend/
├── 📂 app/
│   ├── 📂 api/              ← API endpoints
│   │   └── v1/endpoints/    ← REST endpoints
│   ├── 📂 core/             ← Core functionality
│   │   ├── config.py        ← הגדרות
│   │   ├── database.py      ← חיבור DB
│   │   ├── security.py      ← אבטחה + JWT
│   │   └── tenant.py        ← Multi-tenant helpers
│   ├── 📂 middleware/       ← Middleware (tenant, CORS)
│   ├── 📂 models/           ← SQLAlchemy models
│   ├── 📂 schemas/          ← Pydantic schemas
│   ├── 📂 services/         ← Business logic
│   └── main.py              ← App entry point
│
├── 📂 alembic/              ← Database migrations
│   └── versions/            ← Migration files
│
├── 📂 scripts/              ← Utility scripts
│   ├── create_demo_org.py   ← יצירת ארגון demo
│   └── reset_demo_password.py
│
├── 📂 setup/                ← Setup scripts
│   └── create_super_admin.py
│
├── 📂 archive/              ← ארכיון קבצים ישנים
│   └── old-migrations/      ← SQL + Python ישנים
│
├── alembic.ini              ← Alembic config
├── Dockerfile               ← Docker image
└── requirements.txt         ← Python dependencies
```

---

## 📂 Frontend

```
frontend/
├── 📂 src/
│   ├── 📂 app/              ← Next.js App Router
│   │   ├── (auth)/          ← Auth pages
│   │   ├── (dashboard)/     ← Main app
│   │   ├── dispatch/        ← לוח סידור
│   │   ├── jobs/            ← נסיעות
│   │   ├── customers/       ← לקוחות
│   │   ├── trucks/          ← משאיות
│   │   ├── drivers/         ← נהגים
│   │   └── super-admin/     ← Super Admin UI
│   │
│   ├── 📂 components/       ← React components
│   │   ├── ui/              ← UI components
│   │   ├── forms/           ← Form components
│   │   └── layout/          ← Layout components
│   │
│   ├── 📂 lib/              ← Utilities
│   │   ├── api.ts           ← API client (axios)
│   │   ├── hooks/           ← Custom hooks
│   │   ├── stores/          ← Zustand stores
│   │   └── utils/           ← Helper functions
│   │
│   └── 📂 types/            ← TypeScript types
│
├── 📂 public/               ← Static assets
├── next.config.js           ← Next.js config
├── tailwind.config.ts       ← Tailwind CSS config
├── tsconfig.json            ← TypeScript config
└── package.json             ← Node dependencies
```

---

## 📂 Docs

```
docs/
├── 📂 api/                  ← API documentation
├── 📂 architecture/         ← ארכיטקטורה
│   ├── plan.md              ← PRD מלא (עברית)
│   └── MULTI_TENANT_*.md    ← Multi-tenant guides
│
├── 📂 features/             ← איפיוני פיצ'רים
│   ├── ALERTS_SYSTEM_SPEC.md       ← מערכת התראות
│   ├── ALERTS_MVP_PLAN.md          ← תכנית MVP
│   ├── MOBILE_APP_SPEC.md          ← אפליקציה
│   └── RBAC_PERMISSIONS_SPEC.md    ← הרשאות
│
├── 📂 setup/                ← מדריכי התקנה
│   ├── PRODUCTION_INSTALL.md
│   └── SETUP_WIZARD_README.md
│
├── 📂 troubleshooting/      ← פתרון בעיות
├── 📂 phases/               ← שלבי פיתוח
├── 📂 project/              ← ניהול פרויקט
└── 📂 archive/              ← תיעוד ישן
```

---

## 📂 Archive

```
archive/
├── 📂 old-docs/             ← תיעוד ישן (MD files)
├── 📂 old-tests/            ← בדיקות ישנות (HTML, PS1)
├── 📂 old-deployment/       ← Deployment ישן
└── README.md                ← תיעוד הארכיון
```

---

## 🔄 זרימת עבודה (Workflow)

### Development

```bash
# התחלה מקומית
docker-compose up --build

# Ports:
# - Frontend: http://localhost:3010
# - Backend: http://localhost:8001
# - DB: localhost:5434
```

### Production

```bash
# התקנה אוטומטית
./setup-wizard.sh

# או ידנית
docker-compose -f docker-compose.production.yml up -d
```

---

## 📦 Dependencies Management

### Backend
- **requirements.txt** - כל התלויות
- עדכון: `pip freeze > requirements.txt`

### Frontend
- **package.json** - כל התלויות
- עדכון: `npm update`

---

## 🗃️ Database

### Migrations

```bash
# יצירת migration חדש
cd backend
docker-compose exec backend alembic revision --autogenerate -m "description"

# הרצת migrations
docker-compose exec backend alembic upgrade head

# rollback
docker-compose exec backend alembic downgrade -1
```

### Backups

```bash
# גיבוי ידני
./backup.sh

# גיבויים אוטומטיים ב-cron
# מיקום: backups/
```

---

## 🔐 Security & Auth

### JWT Authentication
- **Middleware:** `backend/app/middleware/tenant.py`
- **Security:** `backend/app/core/security.py`
- **Multi-Tenant:** org_id מ-JWT token

### Roles
- **SUPER_ADMIN** - מנהל מערכת
- **OWNER** - בעלים (לכל ארגון)
- **ADMIN** - מנהל
- **DISPATCHER** - סדרן
- **ACCOUNTING** - הנה"ח
- **DRIVER** - נהג

---

## 📊 Monitoring & Logs

### Logs
```bash
# כל הלוגים
docker-compose logs -f

# Backend בלבד
docker-compose logs -f backend

# Frontend בלבד
docker-compose logs -f frontend
```

### Health Check
```bash
curl http://localhost:8001/health
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

---

## 📞 קבצים חשובים

| קובץ | תיאור |
|------|-------|
| `README.md` | מדריך ראשי |
| `QUICK_COMMANDS.txt` | פקודות מהירות |
| `setup-wizard.sh` | התקנה אוטומטית |
| `backup.sh` | גיבוי DB |
| `deploy.ps1` | Deploy ל-production |

---

## 🗑️ קבצים להתעלם

```gitignore
# בשימוש
.env
.env.local
__pycache__/
node_modules/
.next/
uploads/
backups/

# ארכיון
archive/
```

---

## 📖 תיעוד נוסף

- **API Docs:** http://localhost:8001/docs (Swagger)
- **PRD מלא:** [docs/architecture/plan.md](docs/architecture/plan.md)
- **Multi-Tenant:** [docs/architecture/MULTI_TENANT_*.md](docs/architecture/)
- **Features:** [docs/features/](docs/features/)

---

**נוצר:** 27/01/2026  
**מתוחזק על ידי:** Bhaa Taha
