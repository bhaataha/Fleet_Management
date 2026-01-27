-- Add missing columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS slug VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS display_name VARCHAR(200);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country VARCHAR(3) DEFAULT 'ISR';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_type VARCHAR(50) DEFAULT 'trial';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_start_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS plan_end_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_trucks INTEGER DEFAULT 5;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_drivers INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS max_storage_gb INTEGER DEFAULT 10;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS features_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS billing_email VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS last_payment_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_paid NUMERIC(10,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS locale VARCHAR(10) DEFAULT 'he';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'ILS';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS primary_color VARCHAR(7);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS custom_domain VARCHAR(255);
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_trucks INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_drivers INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS total_jobs_completed INTEGER DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS storage_used_gb NUMERIC(10,2) DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by INTEGER;

-- Update existing organization with required values
UPDATE organizations SET slug = 'truckflow' WHERE id = 1 AND slug IS NULL;
UPDATE organizations SET contact_email = 'admin@itninja.co.il' WHERE id = 1 AND contact_email IS NULL;
