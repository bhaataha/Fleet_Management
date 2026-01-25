# Production Installation Guide

## Quick Start

### Prerequisites

- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / CentOS 8
- **Docker**: Version 24.0+
- **Docker Compose**: Version 2.20+
- **Minimum Hardware**: 2 CPU cores, 4GB RAM, 20GB disk
- **Network**: Static IP or domain name

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/yourusername/Fleet_Management.git
cd Fleet_Management
```

2. **Make setup wizard executable:**
```bash
chmod +x setup-wizard.sh
```

3. **Run the setup wizard:**
```bash
sudo ./setup-wizard.sh
```

4. **Follow the interactive prompts:**
   - Enter server IP/domain
   - Choose password generation (recommended: yes)
   - Enter Super Admin email and password
   - Enter organization name

5. **Wait for installation to complete** (5-10 minutes)

6. **Access your system:**
   - Open browser: `http://YOUR_SERVER_IP:3010`
   - Login with Super Admin credentials

---

## Manual Installation (Advanced)

If you prefer manual setup or the wizard fails:

### 1. Create Environment File

```bash
cp .env.production.template .env.production
nano .env.production
```

Fill in all required values:
- Database passwords
- JWT secrets
- Server IP/domain
- Super Admin credentials
- Organization name

### 2. Build and Start Containers

```bash
docker compose -f docker-compose.production.yml --env-file .env.production up -d --build
```

### 3. Wait for Services to Start

```bash
docker compose logs -f
# Wait until you see "Application startup complete"
# Press Ctrl+C to exit logs
```

### 4. Run Database Migrations

```bash
docker exec fleet_backend_prod alembic upgrade head
```

### 5. Create Super Admin

```bash
docker exec fleet_backend_prod python3 backend/setup/create_super_admin.py
```

### 6. Verify Installation

```bash
curl http://localhost:8001/health
curl http://localhost:3010
```

---

## Post-Installation Configuration

### 1. SSL/TLS Setup (Recommended)

See [docs/setup/SSL_SETUP.md](./SSL_SETUP.md) for detailed instructions.

Quick setup with Let's Encrypt:
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### 2. Firewall Configuration

```bash
# Allow HTTP, HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow API (if needed externally)
sudo ufw allow 8001/tcp

# Allow Frontend (if not using reverse proxy)
sudo ufw allow 3010/tcp

# Enable firewall
sudo ufw enable
```

### 3. Automated Backups

See [docs/setup/BACKUP_GUIDE.md](./BACKUP_GUIDE.md)

Quick backup script:
```bash
# Create backup directory
mkdir -p /backups/fleet

# Add to crontab (daily at 2 AM)
echo "0 2 * * * /opt/Fleet_Management/backup.sh" | sudo crontab -
```

### 4. Email Notifications (Optional)

Edit `.env.production`:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@yourcompany.com
SMTP_TLS=true
```

Restart backend:
```bash
docker compose restart fleet_backend
```

---

## System Management

### Start/Stop Services

```bash
# Start all services
docker compose -f docker-compose.production.yml up -d

# Stop all services
docker compose -f docker-compose.production.yml down

# Restart a specific service
docker compose restart fleet_backend

# View logs
docker compose logs -f fleet_backend
```

### Database Management

```bash
# Backup database
docker exec fleet_db_prod pg_dump -U fleet_user fleet_management > backup_$(date +%Y%m%d).sql

# Restore database
cat backup_20260125.sql | docker exec -i fleet_db_prod psql -U fleet_user -d fleet_management

# Access database console
docker exec -it fleet_db_prod psql -U fleet_user -d fleet_management
```

### Update Application

```bash
# Pull latest code
git pull origin main

# Backup database first!
./backup.sh

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build

# Run migrations
docker exec fleet_backend_prod alembic upgrade head
```

### Monitor System

```bash
# Check container status
docker compose ps

# Check resource usage
docker stats

# Check disk usage
df -h
docker system df

# View application logs
docker compose logs -f --tail 100
```

---

## Troubleshooting

### Services Won't Start

**Check logs:**
```bash
docker compose logs fleet_backend
docker compose logs fleet_db
```

**Common issues:**
- Port already in use: Change port in `.env.production`
- Database connection failed: Check DATABASE_URL
- Permission denied: Run with sudo or add user to docker group

### Can't Login

**Verify Super Admin exists:**
```bash
docker exec -it fleet_db_prod psql -U fleet_user -d fleet_management -c "SELECT id, email, is_super_admin FROM users WHERE is_super_admin = true;"
```

**Reset Super Admin password:**
```bash
# Set new password in environment
export SUPER_ADMIN_EMAIL=admin@example.com
export SUPER_ADMIN_PASSWORD=NewPassword123!

# Run password reset
docker exec fleet_backend_prod python3 -c "
from passlib.context import CryptContext
import os
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')
print(pwd_context.hash(os.getenv('SUPER_ADMIN_PASSWORD')))
"
# Copy the hash and update in database
```

### API Not Responding

**Check backend health:**
```bash
curl http://localhost:8001/health
docker logs fleet_backend_prod --tail 50
```

**Restart backend:**
```bash
docker compose restart fleet_backend
```

### Database Issues

**Check connection:**
```bash
docker exec fleet_db_prod pg_isready -U fleet_user
```

**Reset database (WARNING: Data loss!):**
```bash
docker compose down
docker volume rm fleet_postgres_prod
docker compose up -d
# Run migrations and create super admin again
```

---

## Security Best Practices

1. **Change default passwords** immediately after installation
2. **Use strong passwords** (12+ characters, mixed case, numbers, symbols)
3. **Enable SSL/TLS** for production use
4. **Restrict database access** to localhost only
5. **Regular backups** (automated daily)
6. **Keep system updated** (Docker, OS, application)
7. **Monitor logs** for suspicious activity
8. **Use firewall** (ufw/iptables)
9. **Limit SSH access** (key-based auth, non-standard port)
10. **Regular security audits**

---

## Performance Tuning

### Database Optimization

Edit `docker-compose.production.yml`:
```yaml
fleet_db:
  environment:
    POSTGRES_SHARED_BUFFERS: 256MB
    POSTGRES_EFFECTIVE_CACHE_SIZE: 1GB
    POSTGRES_MAX_CONNECTIONS: 100
```

### Backend Scaling

For high traffic, add multiple backend instances:
```yaml
fleet_backend:
  deploy:
    replicas: 3
```

### Caching

Add Redis for session/cache management (future enhancement).

---

## Support

- **Documentation**: [docs/](../architecture/plan.md)
- **Issues**: GitHub Issues
- **Email**: support@yourcompany.com

---

## License

See [LICENSE](../../LICENSE) file.

---

**Last Updated**: 2026-01-25
