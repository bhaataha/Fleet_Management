#!/bin/bash

echo "🔨 Docker Build מתקדם..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Wait for build process
BUILD_PID=3712490

while kill -0 $BUILD_PID 2>/dev/null; do
    sleep 10
    echo "⏳ עדיין בונה... ($(date +%H:%M:%S))"
    tail -3 /tmp/docker_build.log | grep -E "Step|#" | tail -1
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if build succeeded
if tail -20 /tmp/docker_build.log | grep -q "ERROR"; then
    echo "❌ הבנייה נכשלה!"
    echo ""
    echo "📝 שגיאות:"
    tail -50 /tmp/docker_build.log | grep -A 10 "ERROR"
    exit 1
else
    echo "✅ הבנייה הושלמה בהצלחה!"
    echo ""
    echo "📊 תוצאות:"
    tail -20 /tmp/docker_build.log | grep -E "Successfully|built|tagged" || tail -10 /tmp/docker_build.log
    echo ""
    echo "🚀 להפעלת המערכת:"
    echo "   docker compose up -d"
fi
