#!/bin/bash
# Rebuild and restart frontend container

echo "🔄 Restarting frontend container..."
docker restart fleet_frontend_prod

sleep 5

echo "📦 Cleaning old build..."
docker exec fleet_frontend_prod rm -rf /app/.next

echo "🔨 Building new version..."
docker exec fleet_frontend_prod npm run build

echo "✅ Build complete! Restarting container..."
docker restart fleet_frontend_prod

sleep 3

echo "🎯 Checking status..."
docker ps | grep fleet_frontend_prod

echo "✨ Done!"
