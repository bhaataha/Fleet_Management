#!/bin/bash
################################################################################
# 🚀 Remote Production Deployment Script
# 
# Usage: 
#   ./deploy-remote.sh <server-ip> <ssh-user>
#   Example: ./deploy-remote.sh 192.168.1.100 root
################################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check arguments
if [ $# -lt 2 ]; then
    echo -e "${RED}Usage: $0 <server-ip> <ssh-user>${NC}"
    echo "Example: $0 192.168.1.100 root"
    exit 1
fi

SERVER_IP=$1
SSH_USER=$2
PROJECT_DIR="/opt/Fleet_Management"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       🚀 Remote Production Deployment - TruckFlow         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${YELLOW}Target Server:${NC} $SSH_USER@$SERVER_IP"
echo -e "${YELLOW}Project Dir:${NC} $PROJECT_DIR"
echo ""

# Step 1: Test SSH connection
echo -e "${BLUE}[1/6]${NC} Testing SSH connection..."
if ! ssh -o ConnectTimeout=10 $SSH_USER@$SERVER_IP "echo 'Connection OK'"; then
    echo -e "${RED}❌ SSH connection failed!${NC}"
    exit 1
fi
echo -e "${GREEN}✓ SSH connection successful${NC}"
echo ""

# Step 2: Pull latest changes
echo -e "${BLUE}[2/6]${NC} Pulling latest changes from GitHub..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/Fleet_Management || exit 1
echo "Current branch:"
git branch
echo ""
echo "Pulling changes..."
git pull origin main
echo ""
echo "Latest commit:"
git log --oneline -1
EOF
echo -e "${GREEN}✓ Git pull completed${NC}"
echo ""

# Step 3: Backup database (optional but recommended)
echo -e "${BLUE}[3/6]${NC} Creating database backup..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/Fleet_Management
mkdir -p backups
docker exec fleet_db pg_dump -U fleet_user fleet_management > backups/backup_$(date +%Y%m%d_%H%M%S).sql
echo "Backup created"
ls -lh backups/ | tail -1
EOF
echo -e "${GREEN}✓ Backup completed${NC}"
echo ""

# Step 4: Rebuild containers
echo -e "${BLUE}[4/6]${NC} Rebuilding Docker containers..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/Fleet_Management
echo "Building containers (this may take a few minutes)..."
docker-compose build --no-cache
EOF
echo -e "${GREEN}✓ Build completed${NC}"
echo ""

# Step 5: Restart services
echo -e "${BLUE}[5/6]${NC} Restarting services..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/Fleet_Management
echo "Stopping containers..."
docker-compose down
echo ""
echo "Starting containers..."
docker-compose up -d
echo ""
echo "Waiting for services to start..."
sleep 10
EOF
echo -e "${GREEN}✓ Services restarted${NC}"
echo ""

# Step 6: Health check
echo -e "${BLUE}[6/6]${NC} Running health checks..."
ssh $SSH_USER@$SERVER_IP << 'EOF'
cd /opt/Fleet_Management
echo "Container status:"
docker-compose ps
echo ""
echo "Backend health:"
curl -s http://localhost:8001/health | jq '.' || echo "Health check failed"
echo ""
echo "Frontend status:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:3010
EOF
echo ""

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                  ✅ Deployment Complete!                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${YELLOW}Access your application:${NC}"
echo "  Frontend: http://$SERVER_IP:3010"
echo "  Backend:  http://$SERVER_IP:8001"
echo "  API Docs: http://$SERVER_IP:8001/docs"
echo ""
echo -e "${YELLOW}Check logs:${NC}"
echo "  ssh $SSH_USER@$SERVER_IP"
echo "  cd $PROJECT_DIR"
echo "  docker-compose logs -f"
echo ""
