# Production Setup Wizard - Fleet Management System

## מטרה
סקריפט התקנה אוטומטי ואשף הגדרה (Setup Wizard) להתקנת המערכת על שרת production מרוחק.

## רכיבים

### 1. Setup Wizard CLI (שלב ראשון)
```
setup-wizard.sh - סקריפט bash אינטראקטיבי
```

**תהליך:**
1. בדיקת דרישות (Docker, Docker Compose, ports)
2. יצירת קבצי הגדרה (.env)
3. יצירת Super Admin (שם משתמש + סיסמה)
4. יצירת ארגון ראשון
5. הרצת Docker containers
6. אתחול Database
7. סיכום והצגת פרטי גישה

### 2. Setup Wizard Web UI (שלב שני - אופציונלי)
דף web חד-פעמי שרץ בפעם הראשונה ומאפשר הגדרה גרפית.

---

## תכנון מפורט

### Phase 1: CLI Setup Wizard

#### קובץ: `setup-wizard.sh`
**מה הוא עושה:**
- בודק התקנת Docker/Docker Compose
- יוצר `.env.production` מתוך template
- מבקש פרטי Super Admin:
  - Email
  - Password
  - Organization name
- מריץ migration + seed
- יוצר Super Admin ב-DB
- מדפיס URL + credentials

#### קובץ: `.env.production.template`
```bash
# Database
POSTGRES_USER=fleet_user
POSTGRES_PASSWORD=<GENERATED_OR_INPUT>
POSTGRES_DB=fleet_management
POSTGRES_PORT=5432

# Backend
DATABASE_URL=postgresql://fleet_user:<PASSWORD>@fleet_db:5432/fleet_management
SECRET_KEY=<GENERATED>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Frontend
NEXT_PUBLIC_API_URL=http://<SERVER_IP>:8001

# MinIO (S3)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=<GENERATED>

# Super Admin (first run)
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=<INPUT>
FIRST_ORG_NAME=<INPUT>
```

#### Python Script: `backend/setup/create_super_admin.py`
```python
import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Organization
from passlib.context import CryptContext

def create_super_admin():
    email = os.getenv('SUPER_ADMIN_EMAIL')
    password = os.getenv('SUPER_ADMIN_PASSWORD')
    org_name = os.getenv('FIRST_ORG_NAME')
    
    # Create organization
    # Create super admin user
    # Assign role
    pass
```

---

## שלבי הביצוע

### שלב 1: הכנת קבצים בסיסיים
- [x] תיעוד זה
- [ ] `setup-wizard.sh` - סקריפט bash ראשי
- [ ] `.env.production.template` - תבנית הגדרות
- [ ] `backend/setup/init_production.py` - סקריפט Python לאתחול
- [ ] `docker-compose.production.yml` - הגדרות Docker ל-production

### שלב 2: פונקציונליות Core
- [ ] בדיקת prerequisites (Docker, ports, disk space)
- [ ] יצירת סיסמאות אקראיות חזקות
- [ ] אינטראקציה עם משתמש (prompts)
- [ ] יצירת .env מתוך template
- [ ] בדיקת חיבור DB
- [ ] הרצת migrations

### שלב 3: יצירת Super Admin
- [ ] פונקציה ב-Python: create_super_admin()
- [ ] Hash password (bcrypt)
- [ ] יצירת Organization ראשון
- [ ] יצירת User עם role SUPER_ADMIN
- [ ] קישור User ל-Organization

### שלב 4: Verification
- [ ] בדיקת login עם Super Admin
- [ ] בדיקת API health
- [ ] בדיקת MinIO connectivity
- [ ] בדיקת Frontend accessibility

### שלב 5: Documentation
- [ ] README עם הוראות התקנה
- [ ] Troubleshooting guide
- [ ] Backup/Restore instructions
- [ ] Update procedure

---

## דוגמה לתהליך Setup

```bash
$ ./setup-wizard.sh

╔═══════════════════════════════════════════════════════════╗
║     Fleet Management System - Production Setup Wizard     ║
╚═══════════════════════════════════════════════════════════╝

Step 1/7: Checking prerequisites...
✓ Docker installed (version 24.0.7)
✓ Docker Compose installed (version 2.23.0)
✓ Port 8001 available
✓ Port 3010 available
✓ Port 5432 available

Step 2/7: Configuration
Server IP/Domain: 192.168.1.100
Generate random passwords? (y/n): y
✓ Database password generated
✓ JWT secret generated
✓ MinIO credentials generated

Step 3/7: Super Admin Setup
Email: admin@mycompany.com
Password: ********
Confirm Password: ********
✓ Password meets requirements

Step 4/7: First Organization
Organization Name: My Transport Company
✓ Organization will be created

Step 5/7: Building containers...
✓ Backend built successfully
✓ Frontend built successfully
✓ Database initialized
✓ MinIO configured

Step 6/7: Database initialization...
✓ Running migrations
✓ Creating super admin user
✓ Creating organization

Step 7/7: Verification...
✓ API responding at http://192.168.1.100:8001
✓ Frontend accessible at http://192.168.1.100:3010
✓ Super admin can login

╔═══════════════════════════════════════════════════════════╗
║                    Setup Complete! ✓                      ║
╚═══════════════════════════════════════════════════════════╝

Access your Fleet Management System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  URL:      http://192.168.1.100:3010
  Email:    admin@mycompany.com
  Password: <YOUR_PASSWORD>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Configuration saved to: .env.production
Backup your .env.production file securely!

Next steps:
1. Configure SSL/TLS certificate (see docs/SSL_SETUP.md)
2. Setup automated backups (see docs/BACKUP_GUIDE.md)
3. Configure email notifications (see docs/EMAIL_CONFIG.md)

For troubleshooting: docs/setup/TROUBLESHOOTING.md
```

---

## מבנה קבצים חדשים

```
Fleet_Management/
├── setup-wizard.sh                    # Main setup script
├── .env.production.template           # Environment template
├── docker-compose.production.yml      # Production Docker config
├── docs/
│   └── setup/
│       ├── PRODUCTION_SETUP_WIZARD.md # This file
│       ├── SSL_SETUP.md              # SSL/TLS configuration
│       ├── BACKUP_GUIDE.md           # Backup procedures
│       ├── EMAIL_CONFIG.md           # Email notifications
│       └── TROUBLESHOOTING.md        # Common issues
└── backend/
    └── setup/
        ├── init_production.py        # Production initialization
        └── create_super_admin.py     # Super admin creation

```

---

## אבטחה

### סיסמאות
- סיסמה לSuper Admin: מינימום 12 תווים, אותיות גדולות/קטנות, מספרים, תווים מיוחדים
- Database password: אקראי 32 תווים
- JWT Secret: אקראי 64 תווים
- MinIO credentials: אקראי 24 תווים

### Secrets Management
- `.env.production` לא נשמר ב-git (.gitignore)
- הצפנת קובץ .env עם `gpg` לbackup
- שמירת credentials ב-secrets manager (Vault/AWS Secrets Manager) - לעתיד

### Network Security
- Firewall rules (ufw/iptables)
- SSL/TLS עם Let's Encrypt
- הגבלת גישה ל-PostgreSQL (localhost only)
- הגבלת גישה ל-MinIO (internal network)

---

## Requirements לשרת Production

### Hardware
- CPU: 2 cores minimum, 4 cores recommended
- RAM: 4GB minimum, 8GB recommended
- Disk: 20GB minimum, 50GB+ recommended (depends on file uploads)

### Software
- OS: Ubuntu 22.04 LTS / Debian 12 / CentOS 8
- Docker: 24.0+
- Docker Compose: 2.20+
- curl, git

### Network
- Static IP או Domain name
- Ports: 80, 443, 8001 (API), 3010 (Frontend)
- Outbound internet (for Docker images)

---

## Roadmap

### MVP (Current Task)
- [x] תיעוד מפורט
- [ ] `setup-wizard.sh` בסיסי (CLI)
- [ ] `.env.production.template`
- [ ] `create_super_admin.py`
- [ ] `docker-compose.production.yml`
- [ ] בדיקת התקנה על Ubuntu 22.04 VM

### Phase 2
- [ ] Web-based Setup Wizard (UI במקום CLI)
- [ ] SSL/TLS אוטומטי (Let's Encrypt integration)
- [ ] Email verification לSuper Admin
- [ ] Backup אוטומטי מובנה

### Phase 3
- [ ] Multi-server deployment (load balancing)
- [ ] Kubernetes manifests
- [ ] CI/CD pipeline
- [ ] Monitoring (Prometheus/Grafana)

---

## Testing Checklist

### לפני Release
- [ ] התקנה נקייה על Ubuntu 22.04
- [ ] התקנה נקייה על Debian 12
- [ ] בדיקת upgrade מגרסה קודמת
- [ ] בדיקת rollback במקרה של כשלון
- [ ] בדיקת backup/restore
- [ ] בדיקת performance עם 1000+ jobs
- [ ] בדיקת security scan (OWASP ZAP)
- [ ] בדיקת accessibility מרשתות שונות

---

## Support & Maintenance

### Logging
- Setup wizard logs: `/var/log/fleet-setup.log`
- Application logs: `docker logs <container>`
- Nginx access logs: `/var/log/nginx/access.log`

### Monitoring Endpoints
- API Health: `http://<server>:8001/health`
- DB Status: `http://<server>:8001/api/system/db-status`
- Frontend Status: `http://<server>:3010/_next/healthz`

### Update Procedure
```bash
# Pull latest version
git pull origin main

# Backup database
./backup.sh

# Rebuild containers
docker-compose -f docker-compose.production.yml up -d --build

# Run migrations
docker exec fleet_backend alembic upgrade head
```

---

## תאריך עדכון אחרון
2026-01-25

## Contributors
- Setup Wizard Design: [Your Name]
- Implementation: [Team]
- Documentation: GitHub Copilot + Team
