# Watch and Auto-Deploy Script
# Monitors file changes and automatically deploys to production

Write-Host "👀 Starting Auto-Deploy Watcher..." -ForegroundColor Cyan
Write-Host "Monitoring: backend\app\models, backend\db\migrations" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to stop`n" -ForegroundColor Gray

$SERVER = "root@64.176.173.36"
$REMOTE_PATH = "/opt/Fleet_Management"

# Track last deployment times
$lastDeploy = @{
    models = Get-Date
    migrations = Get-Date
}

while ($true) {
    # Check models
    $modelsFile = "backend\app\models\__init__.py"
    if (Test-Path $modelsFile) {
        $modelsModified = (Get-Item $modelsFile).LastWriteTime
        if ($modelsModified -gt $lastDeploy.models) {
            Write-Host "`n🔄 Detected change in models..." -ForegroundColor Yellow
            Write-Host "Uploading to production..."
            scp $modelsFile ${SERVER}:${REMOTE_PATH}/backend/app/models/
            ssh $SERVER "cd $REMOTE_PATH && docker compose restart backend"
            Write-Host "✅ Models deployed and backend restarted!" -ForegroundColor Green
            $lastDeploy.models = Get-Date
        }
    }
    
    # Check migrations
    $migrationsPath = "backend\db\migrations"
    if (Test-Path $migrationsPath) {
        $migrationFiles = Get-ChildItem $migrationsPath -Filter "*.sql"
        $latestMigration = $migrationFiles | Sort-Object LastWriteTime -Descending | Select-Object -First 1
        
        if ($latestMigration -and $latestMigration.LastWriteTime -gt $lastDeploy.migrations) {
            Write-Host "`n🔄 Detected new migration: $($latestMigration.Name)" -ForegroundColor Yellow
            Write-Host "Uploading and running migration..."
            ssh $SERVER "mkdir -p $REMOTE_PATH/backend/db/migrations"
            scp $latestMigration.FullName ${SERVER}:${REMOTE_PATH}/backend/db/migrations/
            ssh $SERVER "cd $REMOTE_PATH && cat backend/db/migrations/$($latestMigration.Name) | docker compose exec -T postgres psql -U fleet_user -d fleet_management"
            ssh $SERVER "cd $REMOTE_PATH && docker compose restart backend"
            Write-Host "✅ Migration deployed!" -ForegroundColor Green
            $lastDeploy.migrations = Get-Date
        }
    }
    
    Start-Sleep -Seconds 5
}
