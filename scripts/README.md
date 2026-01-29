# Scripts Directory

This directory contains deployment, setup, and utility scripts for the Fleet Management System.

## Deployment Scripts

- **setup-wizard.sh** - Interactive setup wizard for production deployment
- **deploy-production.sh** - Production deployment script
- **deploy.ps1** - PowerShell deployment script for Windows
- **install-traefik.sh** - Traefik reverse proxy installation

## Database Scripts

- **create_tables.sh** - Create database tables
- **backup.sh** - Database backup script

## Utility Scripts

- **gen_hash.py** / **gen_hash.sh** - Generate password hashes
- **quick-test.sh** - Quick system test
- **wait_for_build.sh** - Wait for Docker build completion

## Backend Scripts

Backend-specific scripts are located in `backend/scripts/`:
- User management (create_admin.py, fix_admin_password.py, etc.)
- Demo data generation (add_demo_data.py, create_full_demo_data.py)
- Permission initialization (init_permissions.py)
- Testing scripts (test_alerts.py)

## Usage

Most scripts should be run from the project root directory:

```bash
cd /path/to/Fleet_Management
./scripts/setup-wizard.sh
```

For backend scripts:

```bash
cd /path/to/Fleet_Management/backend
python scripts/create_admin.py
```
