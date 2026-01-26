# Deploy to Production Server
# Usage: .\deploy.ps1 [backend|frontend|all]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("backend","frontend","all","migrations")]
    [string]$Target = "all"
)

$SERVER = "root@64.176.173.36"
$REMOTE_PATH = "/opt/Fleet_Management"

Write-Host "🚀 Deploying to Production Server..." -ForegroundColor Cyan
Write-Host "Target: $Target" -ForegroundColor Yellow

function Deploy-Backend {
    Write-Host "`n📦 Deploying Backend..." -ForegroundColor Green
    
    # Upload models
    Write-Host "Uploading models..."
    scp backend\app\models\__init__.py ${SERVER}:${REMOTE_PATH}/backend/app/models/
    
    # Restart backend
    Write-Host "Restarting backend container..."
    ssh $SERVER "cd $REMOTE_PATH && docker compose restart backend"
    
    Write-Host "✅ Backend deployed!" -ForegroundColor Green
}

function Deploy-Frontend {
    Write-Host "`n📦 Deploying Frontend..." -ForegroundColor Green
    
    # Upload specific pages (example - add more as needed)
    Write-Host "Uploading frontend files..."
    # scp -r frontend\src\app\subcontractors ${SERVER}:${REMOTE_PATH}/frontend/src/app/
    
    Write-Host "⚠️  Frontend deployment requires building - use 'docker compose restart frontend' on server" -ForegroundColor Yellow
    
    Write-Host "✅ Frontend files uploaded!" -ForegroundColor Green
}

function Deploy-Migrations {
    Write-Host "`n📊 Deploying Database Migrations..." -ForegroundColor Green
    
    # Upload migrations
    Write-Host "Uploading migration files..."
    ssh $SERVER "mkdir -p $REMOTE_PATH/backend/db/migrations"
    scp backend\db\migrations\*.sql ${SERVER}:${REMOTE_PATH}/backend/db/migrations/
    
    # Run migrations
    Write-Host "Running migrations on production database..."
    ssh $SERVER "cd $REMOTE_PATH && cat backend/db/migrations/002_phase2_improvements.sql | docker compose exec -T postgres psql -U fleet_user -d fleet_management"
    
    Write-Host "✅ Migrations deployed!" -ForegroundColor Green
}

# Main execution
switch ($Target) {
    "backend" {
        Deploy-Backend
    }
    "frontend" {
        Deploy-Frontend
    }
    "migrations" {
        Deploy-Migrations
    }
    "all" {
        Deploy-Migrations
        Deploy-Backend
        Deploy-Frontend
    }
}

Write-Host "`n✨ Deployment completed!" -ForegroundColor Cyan
Write-Host "Check logs: ssh $SERVER 'cd $REMOTE_PATH && docker compose logs -f --tail=50'" -ForegroundColor Gray
