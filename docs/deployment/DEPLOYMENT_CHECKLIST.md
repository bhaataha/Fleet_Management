# 📋 TruckFlow - Deployment Checklist

## לפני ההעלאה (Pre-Deployment)

### שרת
- [ ] Ubuntu 22.04 / Debian 12 / CentOS 8+
- [ ] 2+ CPU cores
- [ ] 4GB+ RAM
- [ ] 20GB+ disk space
- [ ] חיבור אינטרנט יציב

### תוכנה
- [ ] Docker 24.0+ מותקן
- [ ] Docker Compose 2.20+ מותקן
- [ ] Git מותקן
- [ ] curl מותקן

### פורטים
- [ ] Port 3010 פנוי (Frontend)
- [ ] Port 8001 פנוי (Backend)
- [ ] Port 5433 פנוי (Database)
- [ ] Port 9100 פנוי (MinIO API)
- [ ] Port 9101 פנוי (MinIO Console)

### קבצים
- [ ] `.env.production` קיים
- [ ] `POSTGRES_PASSWORD` מוגדר
- [ ] `JWT_SECRET_KEY` מוגדר (64 תווים)
- [ ] `NEXT_PUBLIC_API_URL` מוגדר
- [ ] `MINIO_ROOT_PASSWORD` מוגדר

---

## תהליך ההעלאה (Deployment)

### אוטומטי
- [ ] הרץ: `chmod +x deploy-production.sh`
- [ ] הרץ: `./deploy-production.sh`
- [ ] המתן עד סיום (כ-5 דקות)

### בדיקות במהלך
- [ ] ✓ Prerequisites passed
- [ ] ✓ Backup created
- [ ] ✓ Containers stopped
- [ ] ✓ Images built
- [ ] ✓ Database initialized
- [ ] ✓ Migrations applied
- [ ] ✓ Super Admin created
- [ ] ✓ Default data seeded
- [ ] ✓ All containers started
- [ ] ✓ Health checks passed

---

## אחרי ההעלאה (Post-Deployment)

### אימות תקינות
- [ ] `docker compose ps` - כל הקונטיינרים Up
- [ ] `curl http://localhost:8001/health` - מחזיר 200
- [ ] `curl http://localhost:3010` - מחזיר HTML
- [ ] נגיש ל-http://localhost:3010 בדפדפן
- [ ] נגיש ל-http://localhost:8001/docs בדפדפן

### התחברות ראשונה
- [ ] פתח: http://localhost:3010/login
- [ ] Email: `admin@system.local`
- [ ] Password: `changeme123`
- [ ] ✓ התחברות מוצלחת
- [ ] **שנה סיסמה מיד!**

### יצירת ארגון ראשון
- [ ] Super Admin → Organizations
- [ ] Create New Organization
- [ ] מלא פרטים: Name, Slug, Contact Email
- [ ] Create Admin User for Organization
- [ ] ✓ ארגון נוצר

### בדיקת פונקציונליות
- [ ] צור לקוח חדש (Customers)
- [ ] צור אתר (Sites)
- [ ] צור משאית (Trucks)
- [ ] צור נהג (Driver)
- [ ] צור נסיעה (Job)
- [ ] העלה תמונה
- [ ] ✓ כל הפונקציות עובדות

---

## אבטחה (Security)

### חובה
- [ ] שנה סיסמת Super Admin
- [ ] שנה `POSTGRES_PASSWORD`
- [ ] שנה `JWT_SECRET_KEY`
- [ ] שנה `MINIO_ROOT_PASSWORD`
- [ ] הגדר Firewall (UFW/iptables)
- [ ] אפשר רק פורטים נחוצים

### מומלץ
- [ ] הגדר SSL/HTTPS (Let's Encrypt)
- [ ] הגדר domain name
- [ ] הגדר reverse proxy (Traefik/Nginx)
- [ ] הגדר rate limiting
- [ ] הגדר backup אוטומטי יומי

---

## גיבויים (Backups)

### הגדרה
- [ ] `chmod +x backup.sh`
- [ ] בדיקה: `./backup.sh`
- [ ] ✓ קובץ נוצר ב-`./backups/`

### Cron Job
- [ ] `crontab -e`
- [ ] הוסף: `0 2 * * * /opt/Fleet_Management/backup.sh`
- [ ] שמור וצא
- [ ] ✓ גיבוי יומי מוגדר ב-2 בלילה

### בדיקת Restore
- [ ] שמור backup ידני
- [ ] צור נתונים חדשים
- [ ] Restore מהגיבוי
- [ ] ✓ Restore עובד

---

## ניטור (Monitoring)

### Logs
- [ ] `docker compose logs -f` עובד
- [ ] logs נשמרים ב-`deployment_*.log`
- [ ] Backend logs נגישים

### בדיקות יומיות
- [ ] `docker compose ps` - סטטוס
- [ ] `docker stats` - שימוש משאבים
- [ ] `df -h` - שטח דיסק
- [ ] `docker compose logs --tail 50` - errors

---

## תחזוקה (Maintenance)

### שבועי
- [ ] בדוק גיבויים
- [ ] בדוק logs לשגיאות
- [ ] בדוק שטח דיסק
- [ ] נקה old containers: `docker system prune`

### חודשי
- [ ] עדכן מערכת: `apt update && apt upgrade`
- [ ] עדכן Docker: `curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh`
- [ ] נקה גיבויים ישנים: `find backups/ -mtime +30 -delete`

### לפני עדכון קוד
- [ ] יצירת backup
- [ ] `git pull origin main`
- [ ] `./deploy-production.sh`
- [ ] בדיקת תקינות
- [ ] אם נכשל - rollback

---

## פתרון בעיות (Troubleshooting)

### Backend לא עולה
- [ ] `docker compose logs backend`
- [ ] בדוק `DATABASE_URL` ב-.env
- [ ] בדוק חיבור לDB: `docker compose exec db pg_isready`

### Frontend לא עולה
- [ ] `docker compose logs frontend`
- [ ] Rebuild: `docker compose build --no-cache frontend`
- [ ] בדוק `NEXT_PUBLIC_API_URL`

### Database לא מגיב
- [ ] `docker compose restart db`
- [ ] `docker compose exec db psql -U fleet_user -l`
- [ ] בדוק volumes: `docker volume ls`

### Port תפוס
- [ ] `sudo lsof -i :8001`
- [ ] `sudo kill -9 <PID>`
- [ ] או שנה port ב-.env

---

## קונטקט ותמיכה

### Logs למשלוח תמיכה
```bash
# Export all logs
docker compose logs > full_logs.txt

# Container status
docker compose ps > container_status.txt

# System info
docker version > system_info.txt
docker compose version >> system_info.txt
df -h >> system_info.txt
free -h >> system_info.txt
```

### Quick Commands
```bash
# Restart all
docker compose restart

# View logs
docker compose logs -f

# Stop all
docker compose down

# Start all
docker compose up -d

# Database console
docker compose exec db psql -U fleet_user -d fleet_management
```

---

## סיכום

✅ **אם כל הצ'קבוקסים מסומנים - המערכת מוכנה לשימוש!**

### URLs חשובים:
- Frontend: http://localhost:3010
- Backend API: http://localhost:8001
- API Docs: http://localhost:8001/docs
- MinIO Console: http://localhost:9101

### Login ברירת מחדל:
- Email: `admin@system.local`
- Password: `changeme123`

⚠️ **חשוב: שנה סיסמה מיד!**

---

**תאריך:** 27 ינואר 2026  
**גרסה:** 1.0.0
