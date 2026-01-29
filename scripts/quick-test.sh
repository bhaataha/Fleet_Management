#!/bin/bash
# Quick Test Script for Remote Server
# Copy-paste these commands one by one

echo "=== Fleet Management System - Quick Test ==="

# 1. Update system
echo "Step 1: Updating system..."
apt update && apt upgrade -y

# 2. Install Docker (if not installed)
echo "Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl start docker
    systemctl enable docker
else
    echo "Docker already installed"
fi

# 3. Install git
echo "Step 3: Installing git..."
apt install git -y

# 4. Clone repository
echo "Step 4: Cloning repository..."
mkdir -p /opt
cd /opt
if [ -d "Fleet_Management" ]; then
    echo "Repository already exists, pulling latest..."
    cd Fleet_Management
    git pull
else
    git clone https://github.com/bhaataha/Fleet_Management.git
    cd Fleet_Management
fi

# 5. Set permissions
echo "Step 5: Setting permissions..."
chmod +x setup-wizard.sh
chmod +x backup.sh
chmod +x backend/setup/create_super_admin.py

# 6. Show server IP
echo ""
echo "=== Server Information ==="
echo "IP Address: $(curl -s ifconfig.me)"
echo "Hostname: $(hostname)"
echo ""

echo "=== Ready to run setup wizard! ==="
echo "Run: ./setup-wizard.sh"
echo ""
echo "You will be asked:"
echo "  1. Server IP: Use $(curl -s ifconfig.me)"
echo "  2. Generate passwords: y"
echo "  3. Super Admin Email: your-email@example.com"
echo "  4. Password: (create strong password)"
echo "  5. Organization Name: Your Company"
echo ""
echo "Press Enter to continue with setup wizard..."
read

# 7. Run setup wizard
./setup-wizard.sh
