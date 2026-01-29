# 🚀 Remote Production Deployment Script (PowerShell)
# 
# Usage: 
#   .\deploy-remote.ps1 -ServerIP "192.168.1.100" -SSHUser "root"

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP,
    
    [Parameter(Mandatory=$true)]
    [string]$SSHUser,
    
    [string]$ProjectDir = "/opt/Fleet_Management"
)

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-Host ""
Write-ColorOutput Cyan "╔═══════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║       🚀 Remote Production Deployment - TruckFlow         ║"
Write-ColorOutput Cyan "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""
Write-ColorOutput Yellow "Target Server: $SSHUser@$ServerIP"
Write-ColorOutput Yellow "Project Dir: $ProjectDir"
Write-Host ""

# Step 1: Test SSH connection
Write-ColorOutput Blue "[1/6] Testing SSH connection..."
try {
    $result = ssh -o ConnectTimeout=10 "$SSHUser@$ServerIP" "echo 'Connection OK'"
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "✓ SSH connection successful"
    } else {
        throw "SSH connection failed"
    }
} catch {
    Write-ColorOutput Red "❌ SSH connection failed!"
    Write-Host "Error: $_"
    exit 1
}
Write-Host ""

# Step 2: Pull latest changes
Write-ColorOutput Blue "[2/6] Pulling latest changes from GitHub..."
ssh "$SSHUser@$ServerIP" @"
cd $ProjectDir || exit 1
echo 'Current branch:'
git branch
echo ''
echo 'Pulling changes...'
git pull origin main
echo ''
echo 'Latest commit:'
git log --oneline -1
"@
Write-ColorOutput Green "✓ Git pull completed"
Write-Host ""

# Step 3: Backup database
Write-ColorOutput Blue "[3/6] Creating database backup..."
ssh "$SSHUser@$ServerIP" @"
cd $ProjectDir
mkdir -p backups
docker exec fleet_db pg_dump -U fleet_user fleet_management > backups/backup_`$(date +%Y%m%d_%H%M%S).sql
echo 'Backup created'
ls -lh backups/ | tail -1
"@
Write-ColorOutput Green "✓ Backup completed"
Write-Host ""

# Step 4: Rebuild containers
Write-ColorOutput Blue "[4/6] Rebuilding Docker containers..."
Write-ColorOutput Yellow "This may take a few minutes..."
ssh "$SSHUser@$ServerIP" @"
cd $ProjectDir
echo 'Building containers...'
docker-compose build --no-cache
"@
Write-ColorOutput Green "✓ Build completed"
Write-Host ""

# Step 5: Restart services
Write-ColorOutput Blue "[5/6] Restarting services..."
ssh "$SSHUser@$ServerIP" @"
cd $ProjectDir
echo 'Stopping containers...'
docker-compose down
echo ''
echo 'Starting containers...'
docker-compose up -d
echo ''
echo 'Waiting for services to start...'
sleep 10
"@
Write-ColorOutput Green "✓ Services restarted"
Write-Host ""

# Step 6: Health check
Write-ColorOutput Blue "[6/6] Running health checks..."
ssh "$SSHUser@$ServerIP" @"
cd $ProjectDir
echo 'Container status:'
docker-compose ps
echo ''
echo 'Backend health:'
curl -s http://localhost:8001/health
echo ''
echo 'Frontend status:'
curl -s -o /dev/null -w 'HTTP Status: %{http_code}' http://localhost:3010
echo ''
"@
Write-Host ""

Write-ColorOutput Green "╔═══════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║                  ✅ Deployment Complete!                  ║"
Write-ColorOutput Green "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""
Write-ColorOutput Yellow "Access your application:"
Write-Host "  Frontend: http://$ServerIP:3010"
Write-Host "  Backend:  http://$ServerIP:8001"
Write-Host "  API Docs: http://$ServerIP:8001/docs"
Write-Host ""
Write-ColorOutput Yellow "Check logs:"
Write-Host "  ssh $SSHUser@$ServerIP"
Write-Host "  cd $ProjectDir"
Write-Host "  docker-compose logs -f"
Write-Host ""
