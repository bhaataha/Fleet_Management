# 📁 Fleet Management System - Project Structure

**Last Updated:** January 29, 2026

## 🏗️ Root Structure

```
Fleet_Management/
├── 📄 Configuration Files
│   ├── .env                              # Environment variables (local)
│   ├── .env.example                      # Environment template
│   ├── .env.production.template          # Production env template
│   ├── .gitignore                        # Git ignore rules
│   └── Fleet_Management.code-workspace   # VS Code workspace
│
├── 🐳 Docker Compose Files
│   ├── docker-compose.yml                # Development setup
│   ├── docker-compose.production.yml     # Production setup
│   ├── docker-compose.traefik.yml        # Traefik reverse proxy
│   └── docker-compose.complete.yml       # Complete stack
│
├── 📖 README.md                          # Main documentation
│
└── 📂 Directories
    ├── .github/                          # GitHub configuration
    ├── archive/                          # Old/deprecated files
    ├── backend/                          # Python FastAPI backend
    ├── backups/                          # Database backups
    ├── docs/                             # Project documentation
    ├── frontend/                         # Next.js React frontend
    ├── scripts/                          # Deployment & utility scripts
    ├── super-admin/                      # Super Admin interface (experimental)
    ├── traefik/                          # Traefik configuration
    └── uploads/                          # File uploads storage
```

---

## 🔧 Backend Structure

```
backend/
├── 📄 Configuration
│   ├── Dockerfile                        # Docker image definition
│   ├── requirements.txt                  # Python dependencies
│   ├── alembic.ini                       # Database migrations config
│   └── package.json                      # Node.js tools (optional)
│
├── 📂 alembic/                          # Database Migrations
│   └── versions/                         # Migration scripts
│
├── 📂 app/                              # Main Application
│   ├── main.py                          # FastAPI entry point
│   ├── core/                            # Core functionality
│   │   ├── config.py                    # Configuration
│   │   ├── database.py                  # Database connection
│   │   ├── security.py                  # Authentication/JWT
│   │   └── tenant.py                    # Multi-tenant helpers
│   ├── middleware/                      # Request middleware
│   │   └── tenant.py                    # Tenant isolation
│   ├── models/                          # SQLAlchemy models
│   │   ├── __init__.py                  # All models
│   │   ├── organization.py              # Organization model
│   │   ├── alert.py                     # Alerts system
│   │   └── permissions.py               # Permissions/RBAC
│   ├── api/                             # API Routes
│   │   └── v1/
│   │       ├── api.py                   # Router aggregation
│   │       └── endpoints/               # API endpoints
│   │           ├── auth.py              # Authentication
│   │           ├── phone_auth.py        # Phone OTP login
│   │           ├── super_admin.py       # Super Admin API
│   │           ├── customers.py         # Customers management
│   │           ├── sites.py             # Sites/Projects
│   │           ├── drivers.py           # Drivers
│   │           ├── trucks.py            # Trucks/Fleet
│   │           ├── jobs.py              # Jobs/Trips
│   │           ├── materials.py         # Materials
│   │           ├── pricing.py           # Price lists
│   │           ├── statements.py        # Invoices/Statements
│   │           ├── expenses.py          # Expenses
│   │           ├── files.py             # File uploads
│   │           ├── alerts.py            # Alerts API
│   │           ├── reports.py           # Reports
│   │           └── share.py             # Public share links
│   ├── schemas/                         # Pydantic schemas
│   ├── services/                        # Business logic
│   │   ├── pdf_generator.py            # PDF generation
│   │   ├── email_service.py            # Email sending
│   │   └── alert_service.py            # Alert management
│   └── utils/                           # Utility functions
│
├── 📂 scripts/                          # Utility Scripts
│   ├── create_super_admin.py           # Create super admin user
│   ├── create_admin.py                 # Create org admin
│   ├── fix_admin_password.py           # Reset admin password
│   ├── add_demo_data.py                # Add demo data
│   ├── init_permissions.py             # Initialize permissions
│   └── test_alerts.py                  # Test alerts system
│
├── 📂 setup/                            # Setup utilities
└── 📂 uploads/                          # File uploads (dev)
```

---

## 🎨 Frontend Structure

```
frontend/
├── 📄 Configuration
│   ├── Dockerfile                       # Docker image
│   ├── next.config.js                   # Next.js config
│   ├── package.json                     # Dependencies
│   ├── tailwind.config.js               # Tailwind CSS config
│   └── tsconfig.json                    # TypeScript config
│
├── 📂 public/                           # Static assets
│   ├── images/                          # Images
│   ├── icons/                           # Icons
│   └── manifest.json                    # PWA manifest
│
└── 📂 src/                              # Source Code
    ├── app/                             # Next.js 14 App Router
    │   ├── layout.tsx                   # Root layout
    │   ├── page.tsx                     # Home page (redirects to login)
    │   ├── login/                       # Login pages
    │   ├── customers/                   # Customers pages
    │   ├── sites/                       # Sites pages
    │   ├── drivers/                     # Drivers pages
    │   ├── trucks/                      # Trucks pages
    │   ├── jobs/                        # Jobs/Dispatch pages
    │   ├── materials/                   # Materials pages
    │   ├── pricing/                     # Price lists pages
    │   ├── statements/                  # Invoices/Statements
    │   ├── expenses/                    # Expenses pages
    │   ├── reports/                     # Reports pages
    │   ├── settings/                    # Settings pages
    │   └── super-admin/                 # Super Admin interface
    ├── components/                      # React Components
    │   ├── ui/                          # UI primitives (shadcn)
    │   ├── layout/                      # Layout components
    │   ├── forms/                       # Form components
    │   └── common/                      # Common components
    ├── lib/                             # Utilities
    │   ├── api.ts                       # API client (axios)
    │   ├── stores/                      # Zustand stores
    │   │   └── auth.ts                  # Auth state
    │   └── utils.ts                     # Helper functions
    ├── types/                           # TypeScript types
    │   ├── index.ts                     # Shared types
    │   └── alert.ts                     # Alert types
    └── styles/                          # Global styles
        └── globals.css                  # Tailwind globals
```

---

## 📚 Documentation Structure

```
docs/
├── README.md                            # Docs index
├── INDEX.md                             # Documentation map
├── STRUCTURE.md                         # This file
│
├── 📂 architecture/                     # System Architecture
│   ├── plan.md                          # Original PRD (Hebrew)
│   ├── MULTI_TENANT_SPEC.md             # Multi-tenant specification
│   └── MULTI_TENANT_IMPLEMENTATION_GUIDE.md
│
├── 📂 setup/                            # Setup Guides
│   ├── SETUP_WIZARD_README.md           # Production setup wizard
│   └── PRODUCTION_INSTALL.md            # Manual installation
│
├── 📂 api/                              # API Documentation
├── 📂 features/                         # Feature Documentation
├── 📂 deployment/                       # Deployment Guides
└── 📂 troubleshooting/                  # Troubleshooting
```

---

## 🔧 Scripts Directory

```
scripts/
├── README.md                            # Scripts documentation
│
├── 🚀 Deployment
│   ├── setup-wizard.sh                  # Production setup wizard
│   ├── deploy-production.sh             # Production deployment
│   ├── deploy.ps1                       # Windows deployment
│   └── install-traefik.sh               # Traefik installation
│
├── 🗄️ Database
│   ├── create_tables.sh                 # Create tables
│   └── backup.sh                        # Backup script
│
└── 🛠️ Utilities
    ├── gen_hash.py                      # Generate password hash
    ├── gen_hash.sh                      # Bash version
    ├── quick-test.sh                    # Quick test
    └── wait_for_build.sh                # Wait for build
```

---

## 🗄️ Archive Directory

```
archive/
├── README.md                            # Archive documentation
│
├── old-docs/                            # Old documentation
│   ├── guides/                          # Feature guides
│   └── README_OLD.md                    # Old README
│
├── old-tests/                           # Old test files
│   └── root-tests/                      # Tests from root
│
├── old-deployment/                      # Old deployment files
└── old-sql-scripts/                     # Old SQL scripts
```

---

## 🔐 Key Configuration Files

### Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/fleet_management

# Security
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# API
API_V1_PREFIX=/api
CORS_ORIGINS=http://localhost:3010,https://yourdomain.com

# Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Docker Compose (docker-compose.yml)

- **backend** - FastAPI service (port 8001)
- **frontend** - Next.js service (port 3010)
- **db** - PostgreSQL 15 (port 5434)

---

## 🚀 Quick Commands

### Development

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production

```bash
# Run setup wizard
sudo ./scripts/setup-wizard.sh

# Manual deployment
docker-compose -f docker-compose.production.yml up -d

# Backup database
./scripts/backup.sh
```

### Backend

```bash
cd backend

# Create super admin
python scripts/create_super_admin.py

# Run migrations
alembic upgrade head

# Add demo data
python scripts/add_demo_data.py
```

---

## 📖 Documentation Links

- **Main README:** [/README.md](../README.md)
- **Architecture:** [/docs/architecture/plan.md](architecture/plan.md)
- **Setup Guide:** [/docs/setup/SETUP_WIZARD_README.md](setup/SETUP_WIZARD_README.md)
- **API Docs:** http://localhost:8001/docs (when running)

---

**Note:** This structure was reorganized on January 29, 2026 to improve organization and maintainability.
