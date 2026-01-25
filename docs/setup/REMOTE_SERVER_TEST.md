# Quick Test on Remote Server - 64.176.173.36

## 🚀 Step-by-Step Testing Guide

### 1. Connect to Server
```bash
ssh root@64.176.173.36
```

### 2. Install Prerequisites (if needed)

#### Check if Docker is installed:
```bash
docker --version
docker compose version
```

#### If Docker NOT installed, install it:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Start Docker
systemctl start docker
systemctl enable docker

# Verify
docker --version
```

#### Install git (if needed):
```bash
apt install git -y
```

### 3. Clone Repository
```bash
# Create directory
mkdir -p /opt
cd /opt

# Clone (replace with your repo URL)
git clone https://github.com/bhaataha/Fleet_Management.git
cd Fleet_Management
```

### 4. Make Setup Wizard Executable
```bash
chmod +x setup-wizard.sh
chmod +x backup.sh
chmod +x backend/setup/create_super_admin.py
```

### 5. Run Setup Wizard
```bash
./setup-wizard.sh
```

### 6. Answer Prompts

**The wizard will ask:**

1. **Server IP/Domain**: `64.176.173.36`
2. **Generate passwords?**: `y` (recommended)
3. **Super Admin Email**: `admin@yourcompany.com` (your choice)
4. **Super Admin Password**: Create a strong password (12+ chars)
5. **Confirm Password**: Same password
6. **Organization Name**: `Demo Transport` (your choice)

**Wait 5-10 minutes for:**
- Docker images to build
- Containers to start
- Database migrations
- Super Admin creation

### 7. Expected Output

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                    Setup Complete! ✓                      ║
╚═══════════════════════════════════════════════════════════╝

Access your Fleet Management System:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  URL:      http://64.176.173.36:3010
  Email:    admin@yourcompany.com
  Password: <YOUR_PASSWORD>
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 8. Test Access

#### From another terminal (your local machine):
```bash
# Test Backend API
curl http://64.176.173.36:8001/health

# Test Frontend (in browser)
# Open: http://64.176.173.36:3010
```

### 9. Login Test

1. Open browser: `http://64.176.173.36:3010`
2. Enter email and password
3. Should see Dashboard

### 10. Verify Containers

```bash
# On the server
docker compose ps

# Should show 4 containers running:
# - fleet_backend
# - fleet_frontend  
# - fleet_db
# - fleet_minio
```

### 11. Check Logs (if issues)

```bash
# All logs
docker compose logs -f

# Specific service
docker compose logs -f fleet_backend
docker compose logs -f fleet_db

# Setup log
cat /var/log/fleet-setup.log
# Or if no permission:
cat ./fleet-setup.log
```

---

## 🐛 Troubleshooting

### Issue: Port already in use
```bash
# Find what's using the port
lsof -i :8001
lsof -i :3010

# Kill the process
kill -9 <PID>

# Or change port in .env.production
```

### Issue: Docker not found
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### Issue: Permission denied
```bash
# Add user to docker group
usermod -aG docker $USER

# Or run with sudo
sudo ./setup-wizard.sh
```

### Issue: Can't access from browser
```bash
# Check firewall
ufw status

# Allow ports
ufw allow 8001/tcp
ufw allow 3010/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# Or disable firewall temporarily (for testing only!)
ufw disable
```

### Issue: Containers won't start
```bash
# Check container status
docker ps -a

# View specific container logs
docker logs fleet_backend
docker logs fleet_db

# Restart containers
docker compose restart

# Complete reset (WARNING: deletes data!)
docker compose down -v
docker system prune -a
./setup-wizard.sh  # Run again
```

---

## ✅ Success Checklist

- [ ] Docker installed and running
- [ ] Repository cloned to `/opt/Fleet_Management`
- [ ] Setup wizard completed without errors
- [ ] 4 containers running (`docker compose ps`)
- [ ] Backend API responds: `curl http://64.176.173.36:8001/health`
- [ ] Frontend loads in browser: `http://64.176.173.36:3010`
- [ ] Can login with Super Admin credentials
- [ ] Dashboard displays correctly

---

## 📊 Quick Commands Reference

```bash
# Start system
cd /opt/Fleet_Management
docker compose up -d

# Stop system
docker compose down

# Restart
docker compose restart

# View logs
docker compose logs -f

# Backup
./backup.sh

# Check status
docker compose ps
docker stats
```

---

## 🔐 Security Notes (For Production)

After successful test, configure:

1. **SSL/TLS**:
```bash
apt install certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

2. **Firewall**:
```bash
ufw enable
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
```

3. **Change default passwords** (if used auto-generated ones)

4. **Backup .env.production** file securely

---

**Ready to test! Connect to the server and run the wizard.** 🚀

If you encounter any issues, check the logs and troubleshooting section above.
