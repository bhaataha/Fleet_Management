# 🚛 TruckFlow - Fleet Management System
## מערכת ניהול צי משאיות מקצועית

[![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)]()
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

---

## 📋 תוכן עניינים

1. [סקירה כללית](#סקירה-כללית)
2. [תכונות עיקריות](#תכונות-עיקריות)
3. [התקנה מהירה](#התקנה-מהירה)
4. [העלאה לשרת](#העלאה-לשרת)
5. [מבנה פרויקט](#מבנה-פרויקט)
6. [טכנולוגיות](#טכנולוגיות)
7. [תיעוד](#תיעוד)
8. [תמיכה](#תמיכה)

---

## 🎯 סקירה כללית

**TruckFlow** היא מערכת SaaS רב-ארגונית (Multi-Tenant) לניהול מלא של חברות הובלות עפר וחצץ. המערכת כוללת:

- 💼 **ניהול תפעולי מלא** - לקוחות, אתרים, נהגים, משאיות
- 📱 **אפליקציית נהגים** - PWA מקצועית למובייל
- 💰 **ניהול כספי** - מחירון, חשבוניות, גבייה, הוצאות
- 📊 **דוחות מתקדמים** - רווחיות, תפוקה, KPIs
- 👨‍💼 **Super Admin** - ניהול ארגונים מרובים
- 🔒 **אבטחה** - JWT, RBAC, Multi-tenant isolation

---

## ✨ תכונות עיקריות

### 🎯 תפעול
- ✅ לוח תכנון יומי (Dispatch Board)
- ✅ ניהול נסיעות עם סטטוסים בזמן אמת
- ✅ תעודות משלוח + חתימה דיגיטלית
- ✅ תעודות שקילה + OCR
- ✅ העלאת תמונות/מסמכים
- ✅ מעקב GPS (בפיתוח)

### 💰 כספים
- ✅ מחירון גמיש (טון/קוב/נסיעה/ק״מ)
- ✅ חישוב מחיר אוטומטי + תוספות
- ✅ חשבוניות/סיכומים + PDF
- ✅ מעקב גבייה + יתרות
- ✅ הוצאות לפי משאית/נהג

### 📱 Mobile (PWA)
- ✅ התקנה כאפליקציה
- ✅ עבודה Offline
- ✅ עדכוני סטטוס בלחיצה
- ✅ צילום מצלמה + העלאה
- ✅ חתימה דיגיטלית
- ✅ התראות Push

### 🏢 Multi-Tenant
- ✅ ארגונים מרובים במערכת אחת
- ✅ הפרדת נתונים מוחלטת (org_id)
- ✅ Super Admin לניהול כולל
- ✅ תוכניות מנוי (Trial/Basic/Pro)
- ✅ הגבלות משאבים לפי תוכנית

---

## 🚀 התקנה מהירה

### דרישות מקדימות

- **Docker** 24.0+
- **Docker Compose** 2.20+
- **4GB RAM** מינימום
- **20GB** שטח דיסק

### התקנה ב-3 שלבים

```bash
# 1. שכפול הריפוזיטורי
git clone <repository-url>
cd Fleet_Management

# 2. הגדרת משתני סביבה
cp .env.production.template .env.production
nano .env.production  # ערוך סיסמאות

# 3. הרצת המערכת
docker compose up -d
```

### גישה למערכת

```
🌐 Frontend:  http://localhost:3010
🔧 Backend:   http://localhost:8001
📖 API Docs:  http://localhost:8001/docs
```

**Login ברירת מחדל:**
- Email: `admin@system.local`
- Password: `changeme123`

---

## 🚀 העלאה לשרת

### העלאה אוטומטית (מומלץ)

```bash
# הרשאות הרצה
chmod +x deploy-production.sh

# הרצת העלאה מלאה
./deploy-production.sh
```

**הסקריפט מבצע:**
1. ✓ בדיקת דרישות מקדימות
2. ✓ גיבוי אוטומטי
3. ✓ בניית קונטיינרים
4. ✓ אתחול מסד נתונים
5. ✓ Migrations
6. ✓ יצירת Super Admin
7. ✓ Seed נתונים ברירת מחדל
8. ✓ בדיקות תקינות

### תיעוד מפורט

📚 **מדריכים מלאים:**
- [DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md) - מדריך העלאה מפורט
- [DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md) - רשימת בדיקות

---

## 📁 מבנה פרויקט

```
Fleet_Management/
├── 🔧 backend/                   # FastAPI + PostgreSQL
│   ├── app/
│   │   ├── api/                  # REST API endpoints
│   │   ├── models/               # Database models
│   │   ├── middleware/           # Tenant middleware
│   │   ├── services/             # Business logic
│   │   └── core/                 # Config, DB, Security
│   ├── alembic/                  # DB migrations
│   └── setup/                    # Setup scripts
│
├── 🎨 frontend/                  # Next.js + React
│   ├── src/
│   │   ├── app/                  # Pages (App Router)
│   │   │   ├── mobile/           # Mobile UI (PWA)
│   │   │   └── super-admin/      # Super Admin UI
│   │   ├── components/           # React components
│   │   ├── hooks/                # Custom hooks
│   │   └── lib/                  # API client, stores
│   └── public/
│       ├── sw.js                 # Service Worker
│       └── manifest.json         # PWA manifest
│
├── 📚 docs/                      # Documentation
│   ├── deployment/               # Deployment guides ✨
│   ├── architecture/             # System design
│   └── api/                      # API documentation
│
└── 🚀 Scripts
    ├── deploy-production.sh      # Full deployment ✨
    ├── backup.sh                 # Database backup
    └── setup-wizard.sh           # Interactive setup
```

---

## 🛠️ טכנולוגיות

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL 15** - Relational database
- **SQLAlchemy** - ORM
- **Alembic** - Database migrations
- **JWT** - Authentication
- **MinIO** - S3-compatible storage

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Sonner** - Toast notifications

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Traefik** - Reverse proxy (optional)
- **GitHub Actions** - CI/CD (optional)

---

## 📚 תיעוד

### מדריכים עיקריים
1. [DEPLOYMENT_GUIDE.md](docs/deployment/DEPLOYMENT_GUIDE.md) - העלאה לשרת ✨
2. [DEPLOYMENT_CHECKLIST.md](docs/deployment/DEPLOYMENT_CHECKLIST.md) - רשימת בדיקות ✨
3. [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) - מבנה הפרויקט
4. [RESPONSIVE_PWA_GUIDE.md](frontend/RESPONSIVE_PWA_GUIDE.md) - PWA Implementation

### איפיון ותכנון
- [docs/architecture/plan.md](docs/architecture/plan.md) - איפיון מערכת מלא (עברית)
- [docs/architecture/MULTI_TENANT_SPEC.md](docs/architecture/MULTI_TENANT_SPEC.md) - Multi-tenant architecture
- [docs/setup/SETUP_WIZARD_README.md](docs/setup/SETUP_WIZARD_README.md) - Setup wizard guide

### API
- Live API Docs: http://localhost:8001/docs (Swagger UI)
- ReDoc: http://localhost:8001/redoc

---

## 💻 Development

### Local Development

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# Database console
docker compose exec db psql -U fleet_user -d fleet_management

# Run migrations
docker compose exec backend alembic upgrade head

# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"
```

### Hot Reload

- **Backend**: FastAPI auto-reloads on file changes
- **Frontend**: Next.js Fast Refresh enabled

---

## 🔧 תחזוקה

### Backup

```bash
# Manual backup
./backup.sh

# Automated daily backup (cron)
crontab -e
# Add: 0 2 * * * /path/to/Fleet_Management/backup.sh
```

### Updates

```bash
# Pull latest code
git pull origin main

# Backup first!
./backup.sh

# Rebuild and deploy
./deploy-production.sh
```

### Monitoring

```bash
# Container status
docker compose ps

# Resource usage
docker stats

# Logs
docker compose logs -f

# Health check
curl http://localhost:8001/health
```

---

## 🐛 Troubleshooting

### Backend לא עולה
```bash
docker compose logs backend
docker compose restart backend
```

### Frontend לא עולה
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

### Database issues
```bash
docker compose exec db pg_isready -U fleet_user
docker compose restart db
```

### Port בשימוש
```bash
sudo lsof -i :8001
sudo lsof -i :3010
```

---

## 📊 Status

### ✅ מוכן לשימוש
- [x] Backend API מלא
- [x] Frontend Admin UI
- [x] Mobile PWA
- [x] Multi-Tenant
- [x] Super Admin
- [x] Authentication & RBAC
- [x] Database migrations
- [x] Deployment scripts
- [x] Documentation

### 🔄 בפיתוח
- [ ] GPS Tracking
- [ ] Push Notifications
- [ ] OCR for weigh tickets
- [ ] Customer Portal
- [ ] Mobile Native App (React Native)

---

## 📞 תמיכה

### דיווח בעיות
- 📧 Email: support@truckflow.com
- 🐛 GitHub Issues: [Issues](https://github.com/your-org/fleet-management/issues)

### Logs
```bash
# Deployment log
cat deployment_*.log

# Docker logs
docker compose logs > full_logs.txt

# System info
docker compose ps > status.txt
```

---

## 📄 License

MIT License - ראה [LICENSE](LICENSE) למידע נוסף

---

## 👥 Contributing

מעוניין לתרום? קרא את [CONTRIBUTING.md](CONTRIBUTING.md)

---

## 🙏 Credits

Built with ❤️ by TruckFlow Team

**Technologies:**
- FastAPI
- Next.js
- PostgreSQL
- Docker
- TailwindCSS

---

## 📈 Stats

- **Lines of Code**: 23,000+
- **Files**: 150+
- **Models**: 25+
- **API Endpoints**: 80+
- **Components**: 40+

---

**Version**: 1.0.0  
**Last Updated**: 27 ינואר 2026  
**Status**: ✅ Production Ready

---

## 🚀 Quick Commands

```bash
# Start
docker compose up -d

# Stop
docker compose down

# Logs
docker compose logs -f

# Backup
./backup.sh

# Deploy
./deploy-production.sh

# Update
git pull && ./deploy-production.sh
```

---

**Ready to start? Run `./deploy-production.sh` and you're good to go! 🎉**
