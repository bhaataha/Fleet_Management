#!/bin/bash

################################################################################
# Fleet Management System - Production Setup Wizard
# Version: 1.0.0
# Description: Interactive setup script for production deployment
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="/var/log/fleet-setup.log"
ENV_FILE=".env.production"
ENV_TEMPLATE=".env.production.template"

################################################################################
# Helper Functions
################################################################################

print_header() {
    echo -e "${CYAN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║     Fleet Management System - Production Setup Wizard     ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}━━━ Step $1/7: $2${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

generate_password() {
    local length=${1:-32}
    openssl rand -base64 $length | tr -d "=+/" | cut -c1-$length
}

check_command() {
    if command -v $1 &> /dev/null; then
        return 0
    else
        return 1
    fi
}

validate_email() {
    local email=$1
    if [[ $email =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        return 0
    else
        return 1
    fi
}

validate_password() {
    local password=$1
    local length=${#password}
    
    if [ $length -lt 12 ]; then
        echo "Password must be at least 12 characters"
        return 1
    fi
    
    if ! [[ $password =~ [A-Z] ]]; then
        echo "Password must contain at least one uppercase letter"
        return 1
    fi
    
    if ! [[ $password =~ [a-z] ]]; then
        echo "Password must contain at least one lowercase letter"
        return 1
    fi
    
    if ! [[ $password =~ [0-9] ]]; then
        echo "Password must contain at least one number"
        return 1
    fi
    
    return 0
}

################################################################################
# Step 1: Prerequisites Check
################################################################################

check_prerequisites() {
    print_step 1 "Checking prerequisites..."
    
    local errors=0
    
    # Check Docker
    if check_command docker; then
        local docker_version=$(docker --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker installed (version $docker_version)"
        log "Docker version: $docker_version"
    else
        print_error "Docker is not installed"
        errors=$((errors + 1))
    fi
    
    # Check Docker Compose
    if check_command docker-compose || docker compose version &> /dev/null; then
        local compose_version=$(docker compose version 2>/dev/null || docker-compose --version | grep -oP '\d+\.\d+\.\d+' | head -1)
        print_success "Docker Compose installed (version $compose_version)"
        log "Docker Compose version: $compose_version"
    else
        print_error "Docker Compose is not installed"
        errors=$((errors + 1))
    fi
    
    # Check required ports
    local ports=(8001 3010 5432 9000)
    for port in "${ports[@]}"; do
        if ! lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 && ! netstat -tuln 2>/dev/null | grep -q ":$port "; then
            print_success "Port $port available"
        else
            print_warning "Port $port is already in use"
            print_info "Please stop the service using this port or choose a different port"
        fi
    done
    
    # Check disk space (minimum 10GB)
    local available_space=$(df "$SCRIPT_DIR" | awk 'NR==2 {print $4}')
    local required_space=$((10 * 1024 * 1024))  # 10GB in KB
    
    if [ $available_space -gt $required_space ]; then
        print_success "Sufficient disk space available ($(($available_space / 1024 / 1024))GB)"
    else
        print_warning "Low disk space: $(($available_space / 1024 / 1024))GB available, 10GB+ recommended"
    fi
    
    # Check internet connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        print_success "Internet connectivity verified"
    else
        print_error "No internet connection"
        errors=$((errors + 1))
    fi
    
    if [ $errors -gt 0 ]; then
        echo ""
        print_error "Prerequisites check failed. Please install missing components."
        exit 1
    fi
    
    echo ""
}

################################################################################
# Step 2: Configuration
################################################################################

configure_system() {
    print_step 2 "System Configuration"
    
    # Get server IP/domain
    echo -n "Server IP or Domain (e.g., 192.168.1.100 or app.example.com): "
    read SERVER_HOST
    
    while [ -z "$SERVER_HOST" ]; do
        print_error "Server IP/Domain cannot be empty"
        echo -n "Server IP or Domain: "
        read SERVER_HOST
    done
    
    print_success "Server: $SERVER_HOST"
    log "Server configured: $SERVER_HOST"
    
    # Ask about password generation
    echo -n "Generate random passwords for database and services? (y/n): "
    read generate_passwords
    
    if [[ $generate_passwords =~ ^[Yy]$ ]]; then
        DB_PASSWORD=$(generate_password 32)
        JWT_SECRET=$(generate_password 64)
        MINIO_PASSWORD=$(generate_password 24)
        print_success "Secure passwords generated"
        log "Auto-generated passwords for DB, JWT, MinIO"
    else
        echo -n "Database Password: "
        read -s DB_PASSWORD
        echo ""
        echo -n "JWT Secret (press Enter for random): "
        read JWT_SECRET
        if [ -z "$JWT_SECRET" ]; then
            JWT_SECRET=$(generate_password 64)
        fi
        echo -n "MinIO Password (press Enter for random): "
        read MINIO_PASSWORD
        if [ -z "$MINIO_PASSWORD" ]; then
            MINIO_PASSWORD=$(generate_password 24)
        fi
    fi
    
    echo ""
}

################################################################################
# Step 3: Super Admin Setup
################################################################################

setup_super_admin() {
    print_step 3 "Super Admin Setup"
    
    # Get email
    while true; do
        echo -n "Super Admin Email: "
        read SUPER_ADMIN_EMAIL
        
        if validate_email "$SUPER_ADMIN_EMAIL"; then
            print_success "Email: $SUPER_ADMIN_EMAIL"
            break
        else
            print_error "Invalid email format"
        fi
    done
    
    # Get password
    while true; do
        echo -n "Super Admin Password: "
        read -s SUPER_ADMIN_PASSWORD
        echo ""
        
        validation_result=$(validate_password "$SUPER_ADMIN_PASSWORD")
        if [ $? -eq 0 ]; then
            echo -n "Confirm Password: "
            read -s CONFIRM_PASSWORD
            echo ""
            
            if [ "$SUPER_ADMIN_PASSWORD" = "$CONFIRM_PASSWORD" ]; then
                print_success "Password meets requirements"
                break
            else
                print_error "Passwords do not match"
            fi
        else
            print_error "$validation_result"
        fi
    done
    
    log "Super Admin email configured: $SUPER_ADMIN_EMAIL"
    echo ""
}

################################################################################
# Step 4: Organization Setup
################################################################################

setup_organization() {
    print_step 4 "First Organization Setup"
    
    echo -n "Organization Name (e.g., 'My Transport Company'): "
    read FIRST_ORG_NAME
    
    while [ -z "$FIRST_ORG_NAME" ]; do
        print_error "Organization name cannot be empty"
        echo -n "Organization Name: "
        read FIRST_ORG_NAME
    done
    
    print_success "Organization: $FIRST_ORG_NAME"
    log "First organization: $FIRST_ORG_NAME"
    
    echo ""
}

################################################################################
# Step 5: Build Containers
################################################################################

build_containers() {
    print_step 5 "Building Docker containers..."
    
    # Create .env.production file
    cat > "$ENV_FILE" <<EOF
# Database Configuration
POSTGRES_USER=fleet_user
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_DB=fleet_management
POSTGRES_PORT=5432

# Backend Configuration
DATABASE_URL=postgresql://fleet_user:$DB_PASSWORD@fleet_db:5432/fleet_management
SECRET_KEY=$JWT_SECRET
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200

# Frontend Configuration
NEXT_PUBLIC_API_URL=http://$SERVER_HOST:8001

# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD
MINIO_ENDPOINT=http://fleet_minio:9000
MINIO_BUCKET_NAME=fleet-uploads

# Super Admin (First Run)
SUPER_ADMIN_EMAIL=$SUPER_ADMIN_EMAIL
SUPER_ADMIN_PASSWORD=$SUPER_ADMIN_PASSWORD
FIRST_ORG_NAME=$FIRST_ORG_NAME

# Application Settings
ENVIRONMENT=production
DEBUG=false
ALLOWED_HOSTS=$SERVER_HOST,localhost
CORS_ORIGINS=http://$SERVER_HOST:3010,http://localhost:3010
EOF

    print_success ".env.production created"
    log "Environment file created"
    
    # Build and start containers
    print_info "Building images (this may take several minutes)..."
    
    if docker compose -f docker-compose.yml --env-file "$ENV_FILE" build --no-cache >> "$LOG_FILE" 2>&1; then
        print_success "Docker images built successfully"
    else
        print_error "Failed to build Docker images"
        print_info "Check log file: $LOG_FILE"
        exit 1
    fi
    
    print_info "Starting containers..."
    if docker compose -f docker-compose.yml --env-file "$ENV_FILE" up -d >> "$LOG_FILE" 2>&1; then
        print_success "Containers started successfully"
    else
        print_error "Failed to start containers"
        exit 1
    fi
    
    # Wait for services to be ready
    print_info "Waiting for services to initialize (30 seconds)..."
    sleep 30
    
    echo ""
}

################################################################################
# Step 6: Database Initialization
################################################################################

init_database() {
    print_step 6 "Database initialization..."
    
    # Run migrations
    print_info "Running database migrations..."
    if docker exec fleet_backend alembic upgrade head >> "$LOG_FILE" 2>&1; then
        print_success "Migrations completed"
    else
        print_error "Migration failed"
        print_info "Check log file: $LOG_FILE"
        exit 1
    fi
    
    # Create super admin
    print_info "Creating Super Admin user..."
    
    # Create Python script inside container
    docker exec fleet_backend python3 -c "
import os
import sys
from uuid import uuid4
from datetime import datetime
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')

# Database connection
db_url = os.getenv('DATABASE_URL')
engine = create_engine(db_url)
Session = sessionmaker(bind=engine)
session = Session()

try:
    # Create organization
    org_id = str(uuid4())
    session.execute(text('''
        INSERT INTO organizations (id, name, created_at, updated_at)
        VALUES (:id, :name, :created_at, :updated_at)
    '''), {
        'id': org_id,
        'name': os.getenv('FIRST_ORG_NAME'),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    })
    
    # Create super admin user
    user_id = session.execute(text('''
        INSERT INTO users (org_id, email, password_hash, is_active, is_super_admin, created_at, updated_at)
        VALUES (:org_id, :email, :password_hash, true, true, :created_at, :updated_at)
        RETURNING id
    '''), {
        'org_id': org_id,
        'email': os.getenv('SUPER_ADMIN_EMAIL'),
        'password_hash': pwd_context.hash(os.getenv('SUPER_ADMIN_PASSWORD')),
        'created_at': datetime.utcnow(),
        'updated_at': datetime.utcnow()
    }).scalar()
    
    session.commit()
    print(f'✓ Super Admin created: {os.getenv(\"SUPER_ADMIN_EMAIL\")}')
    print(f'✓ Organization created: {os.getenv(\"FIRST_ORG_NAME\")}')
    sys.exit(0)
except Exception as e:
    session.rollback()
    print(f'✗ Error: {str(e)}')
    sys.exit(1)
finally:
    session.close()
" 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        print_success "Super Admin and Organization created"
        log "Super Admin created successfully"
    else
        print_error "Failed to create Super Admin"
        exit 1
    fi
    
    echo ""
}

################################################################################
# Step 7: Verification
################################################################################

verify_installation() {
    print_step 7 "Verification..."
    
    # Check API health
    print_info "Checking API..."
    sleep 5
    if curl -f -s "http://localhost:8001/health" > /dev/null 2>&1; then
        print_success "API responding at http://$SERVER_HOST:8001"
    else
        print_warning "API health check failed (this may be normal during first startup)"
    fi
    
    # Check Frontend
    print_info "Checking Frontend..."
    if curl -f -s "http://localhost:3010" > /dev/null 2>&1; then
        print_success "Frontend accessible at http://$SERVER_HOST:3010"
    else
        print_warning "Frontend not responding yet"
    fi
    
    # Check containers
    print_info "Checking container status..."
    local containers=$(docker compose ps --format json 2>/dev/null | jq -r '.[].State' 2>/dev/null || echo "running")
    if [[ $containers == *"running"* ]]; then
        print_success "All containers running"
    else
        print_warning "Some containers may not be running properly"
    fi
    
    echo ""
}

################################################################################
# Final Summary
################################################################################

print_summary() {
    echo ""
    echo -e "${GREEN}"
    echo "╔═══════════════════════════════════════════════════════════╗"
    echo "║                    Setup Complete! ✓                      ║"
    echo "╚═══════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo ""
    echo -e "${CYAN}Access your Fleet Management System:${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${BLUE}URL:${NC}      http://$SERVER_HOST:3010"
    echo -e "  ${BLUE}Email:${NC}    $SUPER_ADMIN_EMAIL"
    echo -e "  ${BLUE}Password:${NC} <YOUR_PASSWORD>"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}⚠ IMPORTANT:${NC}"
    echo "  1. Configuration saved to: $ENV_FILE"
    echo "  2. ${RED}Backup your $ENV_FILE file securely!${NC}"
    echo "  3. Change default passwords if you used generated ones"
    echo ""
    echo -e "${CYAN}Next steps:${NC}"
    echo "  1. Configure SSL/TLS certificate (see docs/setup/SSL_SETUP.md)"
    echo "  2. Setup automated backups (see docs/setup/BACKUP_GUIDE.md)"
    echo "  3. Configure email notifications (see docs/setup/EMAIL_CONFIG.md)"
    echo ""
    echo -e "${CYAN}Useful commands:${NC}"
    echo "  View logs:       docker compose logs -f"
    echo "  Stop system:     docker compose down"
    echo "  Start system:    docker compose up -d"
    echo "  Restart:         docker compose restart"
    echo ""
    echo -e "${CYAN}For troubleshooting:${NC} docs/setup/TROUBLESHOOTING.md"
    echo -e "${CYAN}Setup log file:${NC} $LOG_FILE"
    echo ""
}

################################################################################
# Main Execution
################################################################################

main() {
    # Check if running as root
    if [ "$EUID" -ne 0 ]; then
        print_warning "This script should be run as root or with sudo"
        echo -n "Continue anyway? (y/n): "
        read continue_anyway
        if [[ ! $continue_anyway =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Create log file
    touch "$LOG_FILE" 2>/dev/null || LOG_FILE="./fleet-setup.log"
    
    clear
    print_header
    log "=== Setup started ==="
    
    check_prerequisites
    configure_system
    setup_super_admin
    setup_organization
    build_containers
    init_database
    verify_installation
    print_summary
    
    log "=== Setup completed successfully ==="
}

# Run main function
main "$@"
