#!/bin/bash

# TruckFlow - Traefik SSL Setup Script
# נינגה תקשורת והנדסה - 054-774-8823

set -e

echo "🚛 TruckFlow - התקנת Traefik עם SSL"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
   echo -e "${RED}נא להריץ כ-root (sudo)${NC}"
   exit 1
fi

echo -e "${YELLOW}1. בדיקת דרישות...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker לא מותקן!${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose לא מותקן!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker מותקן${NC}"

# Create .env file if not exists
if [ ! -f .env ]; then
    echo ""
    echo -e "${YELLOW}2. יצירת קובץ הגדרות...${NC}"
    cat > .env << EOF
JWT_SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=production
S3_BUCKET=fleet-uploads
EOF
    echo -e "${GREEN}✓ קובץ .env נוצר${NC}"
else
    echo -e "${GREEN}✓ קובץ .env קיים${NC}"
fi

# Ensure traefik directory and acme.json exist
echo ""
echo -e "${YELLOW}3. הכנת תיקיות Traefik...${NC}"
mkdir -p traefik
touch traefik/acme.json
chmod 600 traefik/acme.json
echo -e "${GREEN}✓ תיקיות הוכנו${NC}"

# Stop old containers
echo ""
echo -e "${YELLOW}4. עצירת קונטיינרים קיימים...${NC}"
docker compose down 2>/dev/null || true
echo -e "${GREEN}✓ קונטיינרים נעצרו${NC}"

# Start with Traefik
echo ""
echo -e "${YELLOW}5. הפעלת מערכת עם Traefik ו-SSL...${NC}"
echo -e "${BLUE}   זה עשוי לקחת מספר דקות...${NC}"

docker compose -f docker-compose.prod.yml up -d

echo ""
echo -e "${GREEN}✓ המערכת רצה!${NC}"

# Wait for containers
echo ""
echo -e "${YELLOW}6. המתנה לאתחול שירותים...${NC}"
sleep 15

# Check containers
echo ""
echo -e "${YELLOW}7. בדיקת סטטוס...${NC}"
if docker ps | grep -q fleet_traefik; then
    echo -e "${GREEN}✓ Traefik פועל${NC}"
else
    echo -e "${RED}✗ Traefik לא פועל${NC}"
fi

if docker ps | grep -q fleet_backend; then
    echo -e "${GREEN}✓ Backend פועל${NC}"
else
    echo -e "${RED}✗ Backend לא פועל${NC}"
fi

if docker ps | grep -q fleet_frontend; then
    echo -e "${GREEN}✓ Frontend פועל${NC}"
else
    echo -e "${RED}✗ Frontend לא פועל${NC}"
fi

echo ""
echo -e "${GREEN}======================================"
echo "✅ ההתקנה הושלמה!"
echo "======================================"
echo ""
echo -e "${BLUE}🌐 האתר זמין בכתובות:${NC}"
echo "   https://truckflow.site"
echo "   https://www.truckflow.site"
echo ""
echo -e "${BLUE}📊 API Backend:${NC}"
echo "   https://truckflow.site/api"
echo ""
echo -e "${BLUE}⏳ תעודות SSL:${NC}"
echo "   יווצרו אוטומטית תוך 1-2 דקות"
echo ""
echo -e "${YELLOW}📝 פקודות שימושיות:${NC}"
echo "   • לוגים: docker compose -f docker-compose.prod.yml logs -f"
echo "   • סטטוס: docker compose -f docker-compose.prod.yml ps"
echo "   • הפעלה מחדש: docker compose -f docker-compose.prod.yml restart"
echo ""
echo -e "${GREEN}פותח ונבנה על ידי נינגה תקשורת והנדסה${NC}"
echo "📞 054-774-8823"
echo "======================================${NC}"
