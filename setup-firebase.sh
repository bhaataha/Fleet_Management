#!/bin/bash
# 🔥 Firebase Setup Script - Quick Installation
# Run this on the production server after creating Firebase project

set -e

echo "🔥 Firebase OTP Setup - TruckFlow"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're on the server
if [ ! -d "/opt/Fleet_Management" ]; then
    echo -e "${RED}❌ Error: Not on production server!${NC}"
    echo "This script should run on: root@64.176.173.36"
    exit 1
fi

cd /opt/Fleet_Management

echo -e "${YELLOW}📋 Step 1: Checking Firebase Service Account Key...${NC}"
if [ -f "backend/firebase-service-account.json" ]; then
    echo -e "${GREEN}✅ firebase-service-account.json found${NC}"
else
    echo -e "${RED}❌ firebase-service-account.json NOT found!${NC}"
    echo ""
    echo "Please download it from Firebase Console:"
    echo "1. Go to: https://console.firebase.google.com"
    echo "2. Project Settings → Service accounts"
    echo "3. Generate new private key"
    echo "4. Upload to server:"
    echo "   scp firebase-service-account.json root@64.176.173.36:/opt/Fleet_Management/backend/"
    echo ""
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 2: Checking .env.production file...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ .env.production exists${NC}"
    
    # Check if Firebase vars are set
    if grep -q "FIREBASE_API_KEY=AIza" .env.production; then
        echo -e "${GREEN}✅ Firebase API Key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Firebase API Key not configured${NC}"
        echo "Run: nano .env.production"
        echo "Add the Firebase variables from .env.example"
    fi
else
    echo -e "${YELLOW}⚠️  .env.production not found${NC}"
    echo "Creating from template..."
    cp .env.example .env.production
    echo -e "${GREEN}✅ Created .env.production${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env.production and set your passwords!${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Step 3: Pulling latest code from Git...${NC}"
git pull origin main
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Git pull successful${NC}"
else
    echo -e "${RED}❌ Git pull failed${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 4: Installing Backend dependencies...${NC}"
docker exec fleet_backend_prod pip install firebase-admin==6.4.0
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ firebase-admin installed${NC}"
else
    echo -e "${RED}❌ Failed to install firebase-admin${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 5: Installing Frontend dependencies...${NC}"
docker exec fleet_frontend_prod npm install firebase@10.7.2
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ firebase installed${NC}"
else
    echo -e "${RED}❌ Failed to install firebase${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 6: Restarting Backend container...${NC}"
docker compose -f docker-compose.production.yml restart fleet_backend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend restarted${NC}"
else
    echo -e "${RED}❌ Failed to restart backend${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 7: Restarting Frontend container...${NC}"
docker compose -f docker-compose.production.yml restart fleet_frontend
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend restarted${NC}"
else
    echo -e "${RED}❌ Failed to restart frontend${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}📋 Step 8: Testing Firebase initialization...${NC}"
sleep 3  # Wait for backend to start

# Test backend Firebase
FIREBASE_TEST=$(docker exec fleet_backend_prod python3 -c "from app.services.firebase_service import firebase_service; print('OK' if firebase_service._initialized else 'FAIL')" 2>&1)

if echo "$FIREBASE_TEST" | grep -q "OK"; then
    echo -e "${GREEN}✅ Backend Firebase initialized successfully!${NC}"
elif echo "$FIREBASE_TEST" | grep -q "FAIL"; then
    echo -e "${RED}❌ Backend Firebase NOT initialized${NC}"
    echo "Check logs: docker logs fleet_backend_prod | grep -i firebase"
elif echo "$FIREBASE_TEST" | grep -q "FileNotFoundError"; then
    echo -e "${RED}❌ firebase-service-account.json not found in container${NC}"
    echo "Copy it: docker cp backend/firebase-service-account.json fleet_backend_prod:/app/"
else
    echo -e "${YELLOW}⚠️  Cannot verify Firebase status${NC}"
    echo "Output: $FIREBASE_TEST"
fi

echo ""
echo -e "${YELLOW}📋 Step 9: Testing Frontend environment variables...${NC}"
FRONTEND_ENV=$(docker exec fleet_frontend_prod env | grep FIREBASE || echo "NOT_FOUND")

if echo "$FRONTEND_ENV" | grep -q "NEXT_PUBLIC_FIREBASE_API_KEY"; then
    echo -e "${GREEN}✅ Frontend Firebase env vars loaded${NC}"
else
    echo -e "${RED}❌ Frontend Firebase env vars NOT loaded${NC}"
    echo "You may need to rebuild:"
    echo "docker compose -f docker-compose.production.yml up -d --build fleet_frontend"
fi

echo ""
echo "================================"
echo -e "${GREEN}✅ Firebase Setup Complete!${NC}"
echo "================================"
echo ""
echo "📝 Next Steps:"
echo "1. Test Backend API:"
echo "   curl -X POST https://app.truckflow.site/api/phone-auth/verify-firebase-token \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"firebase_token\":\"test\"}'"
echo ""
echo "2. Test Frontend:"
echo "   Open https://app.truckflow.site"
echo "   Open Console (F12) and check: PhoneAuthService.getConfig()"
echo ""
echo "3. Create Login UI (optional):"
echo "   See NEXT_STEPS.md for component code"
echo ""
echo "🔥 Firebase is ready to use!"
