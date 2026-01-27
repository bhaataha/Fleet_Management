-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    
    -- Contact
    contact_name VARCHAR(200),
    contact_email VARCHAR(255) UNIQUE NOT NULL,
    contact_phone VARCHAR(20),
    vat_id VARCHAR(50),
    
    -- Address
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(3) DEFAULT 'ISR',
    
    -- Subscription
    plan_type VARCHAR(50) DEFAULT 'trial' NOT NULL,
    plan_start_date DATE,
    plan_end_date DATE,
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    
    -- Limits
    max_trucks INTEGER DEFAULT 5,
    max_drivers INTEGER DEFAULT 10,
    max_storage_gb INTEGER DEFAULT 10,
    features_json JSONB DEFAULT '{}',
    
    -- Billing
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    billing_email VARCHAR(255),
    last_payment_date DATE,
    next_billing_date DATE,
    total_paid DECIMAL(10, 2) DEFAULT 0,
    
    -- Settings
    timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
    locale VARCHAR(10) DEFAULT 'he',
    currency VARCHAR(3) DEFAULT 'ILS',
    settings_json JSONB DEFAULT '{}',
    
    -- Branding
    logo_url TEXT,
    primary_color VARCHAR(7),
    custom_domain VARCHAR(255),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    suspended_reason TEXT,
    
    -- Stats
    total_trucks INTEGER DEFAULT 0,
    total_drivers INTEGER DEFAULT 0,
    total_jobs_completed INTEGER DEFAULT 0,
    storage_used_gb DECIMAL(10, 2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
CREATE INDEX IF NOT EXISTS idx_organizations_plan_type ON organizations(plan_type);
CREATE INDEX IF NOT EXISTS idx_organizations_contact_email ON organizations(contact_email);

-- Insert default organization
INSERT INTO organizations (
    id,
    name,
    slug,
    display_name,
    contact_email,
    plan_type,
    status,
    max_trucks,
    max_drivers,
    max_storage_gb,
    created_at
) VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid,
    'Default Organization',
    'default-org',
    'TruckFlow Main',
    'admin@truckflow.com',
    'enterprise',
    'active',
    999,
    999,
    1000,
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- Add org_id to all tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE trailers ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE job_status_events ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE weigh_tickets ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE files ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE statements ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE statement_lines ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE payment_allocations ADD COLUMN IF NOT EXISTS org_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS org_id UUID;

-- Populate org_id with default organization
UPDATE users SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE customers SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE sites SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE drivers SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE trucks SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE trailers SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE materials SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE price_lists SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE jobs SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE job_status_events SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE delivery_notes SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE weigh_tickets SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE files SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE statements SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE statement_lines SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE payments SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE payment_allocations SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;
UPDATE expenses SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid WHERE org_id IS NULL;

-- Make org_id NOT NULL
ALTER TABLE users ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE sites ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE drivers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE trucks ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE trailers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE materials ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE price_lists ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE job_status_events ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE delivery_notes ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE weigh_tickets ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE files ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE statements ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE statement_lines ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE payments ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE payment_allocations ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE expenses ALTER COLUMN org_id SET NOT NULL;

-- Add foreign keys (drop first if exists to avoid errors)
DO $$ 
BEGIN
    ALTER TABLE users ADD CONSTRAINT fk_users_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN ALTER TABLE customers ADD CONSTRAINT fk_customers_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE sites ADD CONSTRAINT fk_sites_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE drivers ADD CONSTRAINT fk_drivers_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE trucks ADD CONSTRAINT fk_trucks_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE trailers ADD CONSTRAINT fk_trailers_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE materials ADD CONSTRAINT fk_materials_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE price_lists ADD CONSTRAINT fk_price_lists_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE jobs ADD CONSTRAINT fk_jobs_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE job_status_events ADD CONSTRAINT fk_job_status_events_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE delivery_notes ADD CONSTRAINT fk_delivery_notes_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE weigh_tickets ADD CONSTRAINT fk_weigh_tickets_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE files ADD CONSTRAINT fk_files_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE statements ADD CONSTRAINT fk_statements_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE statement_lines ADD CONSTRAINT fk_statement_lines_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payments ADD CONSTRAINT fk_payments_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE payment_allocations ADD CONSTRAINT fk_payment_allocations_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE expenses ADD CONSTRAINT fk_expenses_org FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Create indexes for org_id
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_customers_org_id ON customers(org_id);
CREATE INDEX IF NOT EXISTS idx_sites_org_id ON sites(org_id);
CREATE INDEX IF NOT EXISTS idx_drivers_org_id ON drivers(org_id);
CREATE INDEX IF NOT EXISTS idx_trucks_org_id ON trucks(org_id);
CREATE INDEX IF NOT EXISTS idx_trailers_org_id ON trailers(org_id);
CREATE INDEX IF NOT EXISTS idx_materials_org_id ON materials(org_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_org_id ON price_lists(org_id);
CREATE INDEX IF NOT EXISTS idx_jobs_org_id ON jobs(org_id);
CREATE INDEX IF NOT EXISTS idx_job_status_events_org_id ON job_status_events(org_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_org_id ON delivery_notes(org_id);
CREATE INDEX IF NOT EXISTS idx_weigh_tickets_org_id ON weigh_tickets(org_id);
CREATE INDEX IF NOT EXISTS idx_files_org_id ON files(org_id);
CREATE INDEX IF NOT EXISTS idx_statements_org_id ON statements(org_id);
CREATE INDEX IF NOT EXISTS idx_statement_lines_org_id ON statement_lines(org_id);
CREATE INDEX IF NOT EXISTS idx_payments_org_id ON payments(org_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_org_id ON payment_allocations(org_id);
CREATE INDEX IF NOT EXISTS idx_expenses_org_id ON expenses(org_id);

-- Add super admin fields to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS org_role VARCHAR(50) DEFAULT 'user';

SELECT 'Multi-tenant setup completed successfully!' AS result;
