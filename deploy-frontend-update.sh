#!/bin/bash
# Quick script to deploy frontend changes to remote server

set -e

SERVER="root@64.176.173.36"
REMOTE_PATH="/opt/Fleet_Management"
CONTAINER="fleet_frontend_prod"

echo "🚀 Deploying frontend updates to $SERVER..."

# Files to deploy
FILES=(
    "frontend/src/app/drivers/new/page.tsx"
    "frontend/src/app/drivers/[id]/page.tsx"
    "frontend/src/types/index.ts"
)

# Copy files to server
echo "📦 Copying files to server..."
for file in "${FILES[@]}"; do
    echo "  - $file"
    scp "$file" "$SERVER:$REMOTE_PATH/$file"
done

# Copy files to container
echo "📋 Copying files to container..."
ssh $SERVER "docker cp '$REMOTE_PATH/frontend/src/app/drivers/new/page.tsx' $CONTAINER:/app/src/app/drivers/new/page.tsx"
ssh $SERVER "docker cp '$REMOTE_PATH/frontend/src/app/drivers/[id]/page.tsx' $CONTAINER:/app/src/app/drivers/[id]/page.tsx"
ssh $SERVER "docker cp '$REMOTE_PATH/frontend/src/types/index.ts' $CONTAINER:/app/src/types/index.ts"

# Rebuild frontend
echo "🔨 Building frontend..."
ssh $SERVER "docker exec $CONTAINER sh -c 'cd /app && rm -rf .next && npm run build' > /tmp/build.log 2>&1"

# Restart container
echo "🔄 Restarting frontend..."
ssh $SERVER "docker restart $CONTAINER"

echo "✅ Deployment complete!"
echo "🌐 Frontend available at: http://truckflow.site"
