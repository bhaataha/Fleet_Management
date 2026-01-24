-- Quick setup script to create all tables
-- This replaces alembic for fast development

CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'DISPATCHER', 'ACCOUNTING', 'DRIVER');

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    role user_role_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE billing_unit_enum AS ENUM ('TON', 'M3', 'TRIP', 'KM');

CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    name_hebrew VARCHAR(255),
    billing_unit billing_unit_enum NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    name VARCHAR(255) NOT NULL,
    vat_id VARCHAR(50),
    contact_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    payment_terms INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sites (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    opening_hours VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trucks (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    model VARCHAR(255),
    truck_type VARCHAR(100),
    capacity_ton DECIMAL(10, 2),
    capacity_m3 DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    license_type VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE job_status_enum AS ENUM ('PLANNED', 'ASSIGNED', 'ENROUTE_PICKUP', 'LOADED', 'ENROUTE_DROPOFF', 'DELIVERED', 'CLOSED', 'CANCELED');

CREATE TABLE IF NOT EXISTS jobs (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    from_site_id INTEGER REFERENCES sites(id),
    to_site_id INTEGER REFERENCES sites(id),
    material_id INTEGER REFERENCES materials(id),
    planned_qty DECIMAL(10, 2) NOT NULL,
    actual_qty DECIMAL(10, 2),
    unit billing_unit_enum NOT NULL,
    scheduled_date DATE NOT NULL,
    priority INTEGER DEFAULT 0,
    driver_id INTEGER REFERENCES drivers(id),
    truck_id INTEGER REFERENCES trucks(id),
    status job_status_enum DEFAULT 'PLANNED',
    pricing_total DECIMAL(10, 2),
    pricing_breakdown_json JSONB,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_status_events (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    status job_status_enum NOT NULL,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INTEGER REFERENCES users(id),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    note TEXT
);

CREATE TABLE IF NOT EXISTS files (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    storage_key VARCHAR(500) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    mime_type VARCHAR(100),
    size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS job_files (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id),
    file_id INTEGER REFERENCES files(id),
    type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS delivery_notes (
    id SERIAL PRIMARY KEY,
    job_id INTEGER REFERENCES jobs(id) UNIQUE,
    note_number VARCHAR(50),
    receiver_name VARCHAR(255) NOT NULL,
    receiver_signature_file_id INTEGER REFERENCES files(id),
    delivered_at TIMESTAMP
);

CREATE TYPE statement_status_enum AS ENUM ('DRAFT', 'SENT', 'PARTIALLY_PAID', 'PAID');

CREATE TABLE IF NOT EXISTS statements (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    number VARCHAR(50) UNIQUE NOT NULL,
    status statement_status_enum DEFAULT 'DRAFT',
    subtotal DECIMAL(10, 2) NOT NULL,
    tax DECIMAL(10, 2) NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS statement_lines (
    id SERIAL PRIMARY KEY,
    statement_id INTEGER REFERENCES statements(id),
    job_id INTEGER REFERENCES jobs(id),
    description TEXT,
    qty DECIMAL(10, 2),
    unit_price DECIMAL(10, 2),
    total DECIMAL(10, 2),
    breakdown_json JSONB
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    org_id INTEGER REFERENCES organizations(id),
    customer_id INTEGER REFERENCES customers(id),
    amount DECIMAL(10, 2) NOT NULL,
    paid_at DATE NOT NULL,
    method VARCHAR(100),
    reference VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_allocations (
    id SERIAL PRIMARY KEY,
    payment_id INTEGER REFERENCES payments(id),
    statement_id INTEGER REFERENCES statements(id),
    amount DECIMAL(10, 2) NOT NULL
);
