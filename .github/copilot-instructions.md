# Fleet Management System - AI Coding Agent Instructions

## Project Overview
This is a **planning-stage** Fleet Management System for dirt hauling operations ("הובלות עפר"). The project contains a comprehensive PRD in Hebrew ([plan.md](../docs/architecture/plan.md)) covering the full system architecture, but **no implementation code exists yet**.

**Primary Language**: Hebrew (documentation) + English (code when implemented)
**Target Market**: Small-to-medium Israeli trucking companies specializing in dirt/aggregate hauling
**Current Status**: Pre-development - complete specification, no code

## Core Domain Model

### Key Entities (from plan.md sections 3 & 8)
- **Jobs/Trips**: Individual hauling tasks with status lifecycle (`PLANNED` → `ASSIGNED` → `ENROUTE_PICKUP` → `LOADED` → `ENROUTE_DROPOFF` → `DELIVERED` → `CLOSED`)
- **Customers & Sites**: Projects/construction sites with pricing per route and material
- **Fleet**: Trucks, trailers, drivers with availability tracking
- **Materials**: Dirt types (עפר, חצץ, מצע, etc.) with billing units (ton/m³/trip/km)
- **Delivery Notes**: Digital signatures + photos required for `DELIVERED` status
- **Weigh Tickets**: Optional scale receipts (gross/tare/net weights)
- **Statements/Invoices**: Periodic billing aggregations with automatic price calculation
- **Expenses**: Fuel, repairs, subcontractors tied to trucks/drivers/jobs

### Business Rules (Section 10)
1. **Cannot mark job `DELIVERED` without**: receiver signature + name + at least one photo/document
2. **Jobs enter billing only if**: status is `DELIVERED`, all required docs present, not already billed
3. **Price overrides**: Require Accounting/Admin role + mandatory reason field + audit log
4. **Quantity handling**: `planned_qty` always set; `actual_qty` can come from driver/weigh ticket/office

## Planned Architecture (Section 10)

**Tech Stack** (when implementation starts):
- **Web Admin**: Next.js (dispatchers, accounting, management)
- **Backend**: FastAPI or NestJS (REST API)
- **Database**: PostgreSQL with audit tables
- **Mobile Driver**: PWA (MVP) or Flutter/React Native
- **Storage**: S3-compatible for photos/PDFs
- **Auth**: RBAC + JWT (4 roles: Admin, Dispatcher, Accounting, Driver)

**Key Design Decisions**:
- Offline-first mobile: Drivers work without connectivity, queue syncs later
- Pricing Engine: Automatic calculation based on material + route + customer price lists (ton/km rates, minimum charges, waiting time fees, night surcharges)
- Audit-heavy: Log all changes to prices, quantities, statuses with user + timestamp

## Workflows (Section 6)

### Dispatch Flow
1. Dispatcher creates job → assigns truck + driver
2. Driver receives assignment in mobile app
3. Driver updates status at each stage (pickup → loaded → dropoff → delivered)
4. Signature + photos captured on-site
5. Office reviews → marks billable → generates statement

### Billing Flow (Section 6.3)
1. Filter `DELIVERED` jobs by customer + date range
2. Validate required documents (signature, weigh ticket if applicable)
3. Apply pricing rules from price lists (base price + adjustments)
4. Generate statement with line items
5. Export PDF/Excel → send to customer
6. Record payments → update statement status (unpaid/partial/paid)

## User Roles & Permissions (Section 2)

- **Owner/Admin**: Full access
- **Dispatcher**: Create/assign jobs, view operational reports (no financial data editing)
- **Accounting**: Customers, invoices, payments, expenses, financial reports (cannot modify jobs after invoice sent without Admin)
- **Driver**: View only assigned jobs, update status, upload docs, signature (no access to customer/financial data)

## MVP Scope (Section 9)

**Phase 1 (current target)**:
- Customers, sites, fleet management
- Daily dispatch board with job assignment
- Mobile app: receive tasks, status updates, signature + photo upload
- Basic price lists with automatic calculation
- Statement generation + PDF/Excel export
- Payment tracking + AR aging

**Phase 2** (future):
- Subcontractor management
- OCR for weigh tickets
- Customer portal
- Maintenance alerts (insurance/test expiration)
- Advanced KPIs (delays, wait times, throughput)

## Critical Data Relationships

```
Customer 1:N Sites
Job N:1 Customer, N:1 FromSite, N:1 ToSite, N:1 Material
Job N:1 Driver, N:1 Truck, N:0..1 Trailer
Job 1:N JobStatusEvents (audit trail with timestamps + GPS)
Job 1:0..1 DeliveryNote (signature required)
Job 1:0..N WeighTickets
Job 1:N JobFiles (photos, PDFs)
Statement N:1 Customer, 1:N StatementLines (each links to a Job)
Payment 1:N PaymentAllocations (can partially pay multiple statements)
```

## When Implementing

### Naming Conventions
- **Database**: snake_case (`job_status_events`, `price_lists`)
- **API Routes**: RESTful kebab-case (`/api/jobs/{id}/delivery-note`)
- **Code Comments**: English (implementation) + Hebrew for domain terms when clearer

### Required Validations
- Job status transitions: Enforce valid state machine (cannot skip from `ASSIGNED` to `DELIVERED`)
- Signature requirement: Block `DELIVERED` status without signature + receiver name
- Billing lock: Prevent editing job quantities/prices after statement sent (require Admin override with reason)
- Concurrent updates: Handle multiple dispatchers modifying schedules simultaneously

### API Design Patterns (Section 9)
- Jobs list: Support filters `?date=YYYY-MM-DD&status=&customer_id=&driver_id=`
- File uploads: Use presigned URLs for direct S3 upload from mobile
- Pricing preview: `POST /api/jobs/{id}/pricing/preview` returns breakdown before saving
- Export endpoints: Separate `/export/pdf` and `/export/xlsx` for statements

### Offline Mobile Strategy
- Driver app must queue status changes + file uploads locally
- Sync when connectivity restored with conflict resolution (server timestamp wins)
- Visual indicator in UI for "pending sync" items

## Key Files Reference

- **[plan.md](../plan.md)**: Complete PRD - consult for all domain logic, data model (section 8), API specs (section 9), user stories (section 7)
  - Lines 1-100: Business overview, user roles
  - Lines 101-300: Data entities (Customer, Site, Job, Material, etc.)
  - Lines 301-600: Workflows, pricing engine, required reports
  - Lines 601-900: User stories with acceptance criteria, database schema
  - Lines 901-1200: API endpoints, business rules, NFRs, wireframes, MVP success criteria

## Common Pitfalls to Avoid

1. **Don't simplify the pricing engine**: Multiple dimensions (material, route, customer, date validity) + adjustments (wait time, night, minimum charge) - refer to section 6 for complete logic
2. **Don't skip audit logging**: Price/quantity overrides and status changes are legally significant
3. **Don't assume connectivity**: Mobile app must work offline; test sync edge cases
4. **Don't expose financial data to drivers**: Strict RBAC - drivers see only their assignments
5. **Hebrew-English context switching**: Domain discussions happen in Hebrew; keep Hebrew terms in comments where they clarify business logic

## Questions to Resolve with Stakeholder

- **Measurement units**: Does the pricing engine need to auto-convert between tons and cubic meters? (density factors per material)
- **Subcontractor integration**: MVP explicitly defers this - confirm timeline expectations
- **Customer portal**: Phase 2 feature - will customers accept emailed PDFs initially?
- **GPS tracking**: Should driver status updates capture GPS coordinates automatically or is this optional/Phase 2?
- **Multi-organization**: Schema includes `org_id` everywhere - is multi-tenancy required from MVP or future-proofing?

---

**When in doubt**: Reference specific sections in [plan.md](../docs/architecture/plan.md) - it's the authoritative source. All technical decisions (DB schema, API routes, validation rules) are documented there with rationale.
