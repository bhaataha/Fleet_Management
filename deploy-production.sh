#!/bin/bash
################################################################################
# 🚀 TruckFlow Production Deployment Script
# 
# This script handles complete deployment including:
# - Pre-deployment checks
# - Database initialization and migrations
# - Container build and deployment
# - Health checks and verification
# - Rollback capability
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="TruckFlow"
BACKUP_DIR="./backups"
DEPLOYMENT_LOG="./deployment_$(date +%Y%m%d_%H%M%S).log"

# Start logging
exec > >(tee -a "$DEPLOYMENT_LOG")
exec 2>&1

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         🚀 TruckFlow Production Deployment Script         ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

################################################################################
# Function Definitions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    log_success "Docker installed: $(docker --version)"
    
    # Check Docker Compose
    if ! command -v docker compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    log_success "Docker Compose installed: $(docker compose version)"
    
    # Check disk space (need at least 10GB)
    available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [ "$available_space" -lt 10 ]; then
        log_error "Insufficient disk space: ${available_space}GB (need at least 10GB)"
        exit 1
    fi
    log_success "Disk space available: ${available_space}GB"
    
    # Check ports
    for port in 8001 3010 5433 9100 9101; do
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            log_warning "Port $port is already in use (will be handled by Docker)"
        fi
    done
    log_success "Port check completed"
    
    # Check if .env.production exists
    if [ ! -f .env.production ]; then
        log_error ".env.production file not found"
        log_info "Please create .env.production or run setup-wizard.sh first"
        exit 1
    fi
    log_success ".env.production found"
}

create_backup() {
    log_info "Creating backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if running
    if docker compose ps | grep -q "fleet_db.*Up"; then
        BACKUP_FILE="$BACKUP_DIR/pre_deploy_$(date +%Y%m%d_%H%M%S).sql"
        docker compose exec -T db pg_dump -U fleet_user -d fleet_management > "$BACKUP_FILE" 2>/dev/null || true
        
        if [ -f "$BACKUP_FILE" ]; then
            log_success "Database backup created: $BACKUP_FILE"
        else
            log_warning "Could not create database backup (DB might not be running)"
        fi
    else
        log_warning "Database not running, skipping backup"
    fi
}

stop_containers() {
    log_info "Stopping existing containers..."
    docker compose down
    log_success "Containers stopped"
}

build_containers() {
    log_info "Building Docker containers..."
    
    # Build all services
    docker compose -f docker-compose.yml build --no-cache
    
    log_success "Containers built successfully"
}

init_database() {
    log_info "Initializing database..."
    
    # Start database container first
    docker compose up -d db
    
    # Wait for database to be ready
    log_info "Waiting for database to be ready..."
    for i in {1..30}; do
        if docker compose exec -T db pg_isready -U fleet_user > /dev/null 2>&1; then
            log_success "Database is ready"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # Check if database is empty (first time deployment)
    TABLE_COUNT=$(docker compose exec -T db psql -U fleet_user -d fleet_management -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$TABLE_COUNT" = "0" ]; then
        log_info "Database is empty, initializing schema..."
        
        # Run Alembic migrations
        docker compose exec -T backend alembic upgrade head
        
        log_success "Database schema created"
    else
        log_info "Database already exists with $TABLE_COUNT tables"
        
        # Run migrations to ensure latest schema
        log_info "Running migrations..."
        docker compose exec -T backend alembic upgrade head
        
        log_success "Migrations applied"
    fi
}

create_super_admin() {
    log_info "Checking for Super Admin user..."
    
    SUPER_ADMIN_COUNT=$(docker compose exec -T db psql -U fleet_user -d fleet_management -t -c "SELECT COUNT(*) FROM users WHERE is_super_admin = true;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$SUPER_ADMIN_COUNT" = "0" ]; then
        log_warning "No Super Admin found"
        log_info "Creating Super Admin user..."
        
        docker compose exec -T backend python backend/setup/create_super_admin.py
        
        log_success "Super Admin created"
    else
        log_success "Super Admin already exists"
    fi
}

seed_default_data() {
    log_info "Seeding default data..."
    
    # Check if default organization exists
    ORG_COUNT=$(docker compose exec -T db psql -U fleet_user -d fleet_management -t -c "SELECT COUNT(*) FROM organizations;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$ORG_COUNT" = "0" ]; then
        log_info "No organizations found, creating default organization..."
        
        # This will be handled by the Super Admin creation script
        log_success "Default organization will be created with first admin user"
    else
        log_success "Organizations already exist: $ORG_COUNT"
    fi
    
    # Seed materials if table is empty
    MATERIALS_COUNT=$(docker compose exec -T db psql -U fleet_user -d fleet_management -t -c "SELECT COUNT(*) FROM materials;" 2>/dev/null | tr -d ' ' || echo "0")
    
    if [ "$MATERIALS_COUNT" = "0" ]; then
        log_info "Seeding default materials..."
        docker compose exec -T backend python -c "
from app.core.database import SessionLocal
from app.api.v1.endpoints.materials import seed_default_materials
db = SessionLocal()
try:
    seed_default_materials(db, 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
    db.commit()
    print('Materials seeded')
except Exception as e:
    print(f'Error seeding materials: {e}')
finally:
    db.close()
" 2>/dev/null || log_warning "Could not seed materials automatically"
    fi
}

start_all_containers() {
    log_info "Starting all containers..."
    
    docker compose up -d
    
    log_success "All containers started"
}

health_check() {
    log_info "Performing health checks..."
    
    # Wait for services to be ready
    sleep 5
    
    # Check backend
    log_info "Checking backend health..."
    for i in {1..30}; do
        if curl -f http://localhost:8001/health > /dev/null 2>&1; then
            log_success "Backend is healthy"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # Check frontend
    log_info "Checking frontend..."
    for i in {1..30}; do
        if curl -f http://localhost:3010 > /dev/null 2>&1; then
            log_success "Frontend is accessible"
            break
        fi
        echo -n "."
        sleep 2
    done
    echo ""
    
    # Check database
    if docker compose exec -T db pg_isready -U fleet_user > /dev/null 2>&1; then
        log_success "Database is healthy"
    else
        log_error "Database is not responding"
    fi
    
    # Show container status
    echo ""
    log_info "Container status:"
    docker compose ps
}

show_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║              ✓ Deployment Complete! 🎉                   ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo "📊 Access Points:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  🌐 Frontend:  http://localhost:3010"
    echo "  🔧 Backend:   http://localhost:8001"
    echo "  📖 API Docs:  http://localhost:8001/docs"
    echo "  💾 Database:  localhost:5433"
    echo "  📦 MinIO:     http://localhost:9101"
    echo ""
    echo "📝 Next Steps:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  1. Test login at http://localhost:3010/login"
    echo "  2. Check logs: docker compose logs -f"
    echo "  3. Monitor: docker compose ps"
    echo "  4. Backup: ./backup.sh"
    echo ""
    echo "📄 Deployment log saved to: $DEPLOYMENT_LOG"
    echo ""
}

rollback() {
    log_error "Deployment failed!"
    log_info "Rolling back..."
    
    # Stop all containers
    docker compose down
    
    # Restore backup if exists
    LATEST_BACKUP=$(ls -t "$BACKUP_DIR"/pre_deploy_*.sql 2>/dev/null | head -1)
    if [ -f "$LATEST_BACKUP" ]; then
        log_info "Restoring database from: $LATEST_BACKUP"
        docker compose up -d db
        sleep 5
        cat "$LATEST_BACKUP" | docker compose exec -T db psql -U fleet_user -d fleet_management
        log_success "Database restored"
    fi
    
    log_error "Rollback complete. Please check logs for errors."
    exit 1
}

################################################################################
# Main Deployment Flow
################################################################################

main() {
    # Set trap for errors
    trap rollback ERR
    
    log_info "Starting deployment at $(date)"
    echo ""
    
    # Step 1: Prerequisites
    check_prerequisites
    echo ""
    
    # Step 2: Backup
    create_backup
    echo ""
    
    # Step 3: Stop containers
    stop_containers
    echo ""
    
    # Step 4: Build
    build_containers
    echo ""
    
    # Step 5: Initialize database
    init_database
    echo ""
    
    # Step 6: Create Super Admin
    create_super_admin
    echo ""
    
    # Step 7: Seed data
    seed_default_data
    echo ""
    
    # Step 8: Start all services
    start_all_containers
    echo ""
    
    # Step 9: Health checks
    health_check
    echo ""
    
    # Step 10: Summary
    show_summary
    
    log_info "Deployment completed at $(date)"
}

# Run main function
main
