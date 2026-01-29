#!/bin/bash
# Rebuild frontend properly - wait for build to complete before restart

echo "📦 Cleaning old build..."
docker exec fleet_frontend_prod rm -rf /app/.next

echo "🔨 Building new version (this takes ~2 minutes)..."
docker exec fleet_frontend_prod npm run build

echo "⏳ Waiting for build to complete..."
sleep 10

# Check if build succeeded
if docker exec fleet_frontend_prod test -f /app/.next/BUILD_ID; then
    echo "✅ Build succeeded! Restarting container..."
    docker restart fleet_frontend_prod
    sleep 5
    echo "🎯 Container restarted successfully!"
    docker ps | grep fleet_frontend_prod
else
    echo "❌ Build failed or incomplete. Checking logs..."
    docker logs --tail 50 fleet_frontend_prod 2>&1 | tail -20
fi
