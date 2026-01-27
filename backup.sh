#!/bin/bash

################################################################################
# Fleet Management System - Backup Script
# Creates backup of database, uploads, and configuration
################################################################################

set -e

# Configuration
BACKUP_DIR="/backups/fleet"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="fleet_backup_${TIMESTAMP}"
RETENTION_DAYS=30

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Fleet Management System - Backup${NC}"
echo "=================================="
echo "Timestamp: ${TIMESTAMP}"
echo ""

# Create backup directory
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

# Backup database
echo -ne "Backing up database... "
docker exec fleet_db_prod pg_dump -U fleet_user fleet_management > "${BACKUP_DIR}/${BACKUP_NAME}/database.sql"
echo -e "${GREEN}✓${NC}"

# Backup uploads
echo -ne "Backing up uploads... "
if [ -d "./backend/uploads" ]; then
    tar -czf "${BACKUP_DIR}/${BACKUP_NAME}/uploads.tar.gz" -C ./backend uploads/
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ No uploads directory${NC}"
fi

# Backup configuration (encrypted)
echo -ne "Backing up configuration... "
if [ -f ".env.production" ]; then
    # Copy with restricted permissions
    cp .env.production "${BACKUP_DIR}/${BACKUP_NAME}/.env.production"
    chmod 600 "${BACKUP_DIR}/${BACKUP_NAME}/.env.production"
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${YELLOW}⚠ No .env.production file${NC}"
fi

# Create backup info file
cat > "${BACKUP_DIR}/${BACKUP_NAME}/backup_info.txt" <<EOF
Fleet Management System Backup
==============================
Date: $(date)
Timestamp: ${TIMESTAMP}
Database: Included
Uploads: $([ -f "${BACKUP_DIR}/${BACKUP_NAME}/uploads.tar.gz" ] && echo "Included" || echo "Not found")
Configuration: $([ -f "${BACKUP_DIR}/${BACKUP_NAME}/.env.production" ] && echo "Included" || echo "Not found")

To restore this backup:
1. Stop the application: docker compose down
2. Restore database: cat database.sql | docker exec -i fleet_db_prod psql -U fleet_user -d fleet_management
3. Restore uploads: tar -xzf uploads.tar.gz -C ./backend/
4. Restore config: cp .env.production /path/to/Fleet_Management/
5. Start application: docker compose up -d
EOF

# Compress entire backup
echo -ne "Compressing backup... "
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" -C "${BACKUP_DIR}" "${BACKUP_NAME}"
rm -rf "${BACKUP_DIR}/${BACKUP_NAME}"
echo -e "${GREEN}✓${NC}"

# Calculate size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
echo ""
echo -e "${GREEN}Backup completed successfully!${NC}"
echo "Location: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "Size: ${BACKUP_SIZE}"

# Cleanup old backups
echo ""
echo "Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
OLD_BACKUPS=$(find "${BACKUP_DIR}" -name "fleet_backup_*.tar.gz" -mtime +${RETENTION_DAYS})
if [ -n "$OLD_BACKUPS" ]; then
    echo "$OLD_BACKUPS" | while read backup; do
        echo "  Removing: $backup"
        rm "$backup"
    done
    echo -e "${GREEN}✓ Cleanup completed${NC}"
else
    echo "  No old backups to remove"
fi

echo ""
echo "=================================="
echo -e "${GREEN}All done!${NC}"
