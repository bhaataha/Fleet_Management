# 🚀 מדריך העלאה לשרת - TruckFlow System

## תוכן עניינים

1. [דרישות מקדימות](#דרישות-מקדימות)
2. [הכנת השרת](#הכנת-השרת)
3. [העלאה אוטומטית](#העלאה-אוטומטית)
4. [העלאה ידנית](#העלאה-ידנית)
5. [אימות התקנה](#אימות-התקנה)
6. [בעיות נפוצות](#בעיות-נפוצות)
7. [תחזוקה שוטפת](#תחזוקה-שוטפת)

---

## דרישות מקדימות

### חומרה מינימלית
- **CPU**: 2 ליבות
- **RAM**: 4GB
- **דיסק**: 20GB פנויים
- **רשת**: חיבור אינטרנט יציב

### תוכנה נדרשת
- **מערכת הפעלה**: Ubuntu 22.04 LTS / Debian 12 / CentOS 8+
- **Docker**: גרסה 24.0 ומעלה
- **Docker Compose**: גרסה 2.20 ומעלה
- **Git**: לקבלת הקוד

### פורטים נדרשים
```bash
3010  # Frontend (Next.js)
8001  # Backend (FastAPI)
5433  # PostgreSQL
9100  # MinIO API
9101  # MinIO Console
```

---

## הכנת השרת

### 1. התקנת Docker ו-Docker Compose

```bash
# עדכון מערכת
sudo apt update && sudo apt upgrade -y

# התקנת תלויות
sudo apt install -y curl git lsof

# התקנת Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# הוספת משתמש ל-Docker group
sudo usermod -aG docker $USER

# התקנת Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# אימות התקנה
docker --version
docker compose version
```

### 2. הורדת הקוד

```bash
# מיקום מומלץ
cd /opt

# שכפול הריפוזיטורי
sudo git clone <repository-url> Fleet_Management
cd Fleet_Management

# הרשאות
sudo chown -R $USER:$USER .
```

### 3. הגדרת משתני סביבה

```bash
# העתקת תבנית
cp .env.production.template .env.production

# עריכת קובץ
nano .env.production
```

**הגדרות חובה לשנות:**

```bash
# Database
POSTGRES_PASSWORD=<סיסמה-חזקה-כאן>

# Backend
JWT_SECRET_KEY=<מפתח-אקראי-64-תווים>
DATABASE_URL=postgresql://fleet_user:<סיסמה>@db:5432/fleet_management

# Frontend
NEXT_PUBLIC_API_URL=http://<IP-שרת>:8001/api

# MinIO
MINIO_ROOT_USER=admin
MINIO_ROOT_PASSWORD=<סיסמה-חזקה>
```

**ליצירת מפתח JWT אקראי:**
```bash
openssl rand -hex 32
```

---

## העלאה אוטומטית

### שימוש בסקריפט Deployment

```bash
# הרשאות הרצה
chmod +x deploy-production.sh

# הרצת ההעלאה
sudo ./deploy-production.sh
```

### תהליך ההעלאה האוטומטית כולל:

1. ✅ **בדיקת דרישות מקדימות**
   - Docker installed
   - Docker Compose installed
   - Disk space (10GB+)
   - Ports availability
   - .env.production exists

2. 💾 **גיבוי אוטומטי**
   - Database backup (if exists)
   - Saved to `./backups/pre_deploy_YYYYMMDD_HHMMSS.sql`

3. 🛑 **עצירת קונטיינרים קיימים**
   - `docker compose down`

4. 🏗️ **בניית תמונות Docker**
   - Backend (FastAPI + Python)
   - Frontend (Next.js)
   - Fresh build without cache

5. 🗄️ **אתחול מסד נתונים**
   - Start PostgreSQL
   - Wait for ready
   - Run Alembic migrations (`alembic upgrade head`)
   - Create all tables

6. 👤 **יצירת Super Admin**
   - Check if exists
   - Create if missing
   - Email: admin@system.local
   - Password: changeme123 (יש לשנות!)

7. 📊 **Seed נתונים ברירת מחדל**
   - Default organization
   - Default materials (עפר, חצץ, מצע, וכו')
   - Vehicle types

8. 🚀 **הפעלת כל השירותים**
   - Database (PostgreSQL)
   - Backend (FastAPI)
   - Frontend (Next.js)
   - MinIO (S3 storage)

9. 🏥 **בדיקות תקינות**
   - Backend health: `http://localhost:8001/health`
   - Frontend accessible: `http://localhost:3010`
   - Database responding
   - Container status

10. 📋 **סיכום והצגת פרטים**
    - Access URLs
    - Next steps
    - Log file location

---

## העלאה ידנית (שלב אחר שלב)

אם אתה מעדיף שליטה מלאה:

### שלב 1: גיבוי (אם קיים)

```bash
mkdir -p backups
docker compose exec db pg_dump -U fleet_user fleet_management > backups/backup_$(date +%Y%m%d_%H%M%S).sql
```

### שלב 2: עצירה וניקוי

```bash
docker compose down
docker system prune -f
```

### שלב 3: בניית תמונות

```bash
# Backend
docker compose build --no-cache backend

# Frontend
docker compose build --no-cache frontend
```

### שלב 4: הפעלת Database

```bash
docker compose up -d db

# המתנה לתקינות
sleep 10
docker compose exec db pg_isready -U fleet_user
```

### שלב 5: Migrations

```bash
docker compose exec backend alembic upgrade head
```

### שלב 6: יצירת Super Admin

```bash
docker compose exec backend python backend/setup/create_super_admin.py
```

### שלב 7: הפעלת כל השירותים

```bash
docker compose up -d
```

### שלב 8: בדיקת תקינות

```bash
# Container status
docker compose ps

# Backend health
curl http://localhost:8001/health

# Frontend
curl http://localhost:3010

# Logs
docker compose logs -f
```

---

## אימות התקנה

### 1. בדיקת Containers

```bash
docker compose ps
```

**פלט מצופה:**
```
NAME                IMAGE                      STATUS
fleet_backend       fleet_management-backend   Up (healthy)
fleet_frontend      fleet_management-frontend  Up
fleet_db            postgres:15-alpine         Up (healthy)
fleet_minio         minio/minio:latest         Up
```

### 2. בדיקת Logs

```bash
# כל השירותים
docker compose logs --tail 50

# Backend בלבד
docker compose logs backend --tail 50 -f

# Frontend בלבד
docker compose logs frontend --tail 50 -f
```

### 3. בדיקת Backend API

```bash
# Health check
curl http://localhost:8001/health

# API Documentation
curl http://localhost:8001/docs

# Test login
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@system.local","password":"changeme123"}'
```

### 4. בדיקת Frontend

```bash
# Homepage
curl http://localhost:3010

# Mobile PWA
curl http://localhost:3010/mobile/home
```

### 5. בדיקת Database

```bash
# Connect to DB
docker compose exec db psql -U fleet_user -d fleet_management

# List tables
\dt

# Count organizations
SELECT COUNT(*) FROM organizations;

# Exit
\q
```

---

## בעיות נפוצות

### 🔴 Backend לא עולה

**תסמינים:**
```
fleet_backend exited with code 1
```

**פתרונות:**

1. בדוק logs:
```bash
docker compose logs backend
```

2. בדוק משתני סביבה:
```bash
docker compose exec backend env | grep DATABASE_URL
```

3. בדוק חיבור ל-DB:
```bash
docker compose exec backend python -c "from app.core.database import engine; print(engine)"
```

### 🔴 Frontend לא עולה

**תסמינים:**
```
Module not found errors
```

**פתרונות:**

1. Rebuild עם cache נקי:
```bash
docker compose build --no-cache frontend
docker compose up -d frontend
```

2. בדוק package.json:
```bash
docker compose exec frontend npm list
```

### 🔴 Database לא מגיב

**תסמינים:**
```
connection refused
```

**פתרונות:**

1. בדוק סטטוס:
```bash
docker compose exec db pg_isready -U fleet_user
```

2. הפעל מחדש:
```bash
docker compose restart db
```

3. בדוק volumes:
```bash
docker volume ls | grep fleet
```

### 🔴 Migrations נכשלות

**תסמינים:**
```
alembic.util.exc.CommandError
```

**פתרונות:**

1. בדוק אם DB ריק:
```bash
docker compose exec db psql -U fleet_user -d fleet_management -c "\dt"
```

2. Reset migrations:
```bash
docker compose exec backend alembic downgrade base
docker compose exec backend alembic upgrade head
```

### 🔴 Port כבר בשימוש

**תסמינים:**
```
bind: address already in use
```

**פתרונות:**

1. מצא תהליך:
```bash
sudo lsof -i :8001
sudo lsof -i :3010
```

2. הרוג תהליך:
```bash
sudo kill -9 <PID>
```

3. שנה port ב-.env.production

---

## תחזוקה שוטפת

### גיבוי יומי

**הגדרת Cron:**
```bash
chmod +x backup.sh

# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /opt/Fleet_Management/backup.sh
```

### מעקב Logs

```bash
# Real-time logs
docker compose logs -f

# Last 100 lines
docker compose logs --tail 100

# Specific service
docker compose logs backend -f
```

### עדכון מערכת

```bash
# Pull latest code
git pull origin main

# Backup first!
./backup.sh

# Rebuild and deploy
./deploy-production.sh
```

### ניקוי ישן

```bash
# Remove old containers
docker system prune -a

# Remove old volumes (זהירות!)
docker volume prune

# Remove old backups (older than 30 days)
find backups/ -name "*.sql" -mtime +30 -delete
```

### מעקב ביצועים

```bash
# Container stats
docker stats

# Disk usage
df -h

# Database size
docker compose exec db psql -U fleet_user -d fleet_management \
  -c "SELECT pg_size_pretty(pg_database_size('fleet_management'));"
```

---

## SSL/HTTPS (Production)

### עם Traefik (מומלץ)

1. התקן Traefik:
```bash
./install-traefik.sh
```

2. הגדר domain ב-docker-compose.yml:
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.frontend.rule=Host(`yourdomain.com`)"
  - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
```

### עם Nginx (חלופה)

```bash
sudo apt install nginx certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/truckflow
```

---

## Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# iptables (alternative)
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

---

## מעקב ובדיקות

### Healthcheck Script

צור `healthcheck.sh`:

```bash
#!/bin/bash

check_service() {
    SERVICE=$1
    URL=$2
    
    if curl -f $URL > /dev/null 2>&1; then
        echo "✓ $SERVICE is healthy"
    else
        echo "✗ $SERVICE is down"
        return 1
    fi
}

check_service "Backend" "http://localhost:8001/health"
check_service "Frontend" "http://localhost:3010"
```

### Monitoring עם Prometheus (אופציונלי)

1. הוסף ל-docker-compose.yml:
```yaml
prometheus:
  image: prom/prometheus
  volumes:
    - ./prometheus.yml:/etc/prometheus/prometheus.yml
  ports:
    - "9090:9090"

grafana:
  image: grafana/grafana
  ports:
    - "3000:3000"
```

---

## תמיכה ועזרה

### Logs
- Deployment log: `deployment_YYYYMMDD_HHMMSS.log`
- Docker logs: `docker compose logs`
- Backend logs: `backend/logs/`

### Commands Quick Reference

```bash
# Start all
docker compose up -d

# Stop all
docker compose down

# Restart service
docker compose restart backend

# View logs
docker compose logs -f

# Database console
docker compose exec db psql -U fleet_user -d fleet_management

# Backend shell
docker compose exec backend bash

# Frontend shell
docker compose exec frontend sh

# Rebuild
docker compose build --no-cache
```

---

## סיכום

✅ **Deployment מוכן לשימוש**

1. הכן שרת עם Docker
2. הגדר `.env.production`
3. הרץ `./deploy-production.sh`
4. גש ל-`http://server-ip:3010`
5. התחבר עם Super Admin
6. התחל להשתמש!

**Login ראשוני:**
- Email: `admin@system.local`
- Password: `changeme123`

⚠️ **חשוב:** שנה סיסמת Super Admin מיד לאחר התחברות ראשונה!

---

**גרסה:** 1.0.0  
**עדכון אחרון:** 27 ינואר 2026  
**מחבר:** TruckFlow Team
