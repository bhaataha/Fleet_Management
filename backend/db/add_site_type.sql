-- Add site_type column to sites table
-- This allows sites to be either "general" (quarries, loading stations) or "customer_project" (customer-specific sites)

-- Add column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'sites' AND column_name = 'site_type'
    ) THEN
        ALTER TABLE sites 
        ADD COLUMN site_type VARCHAR(50) DEFAULT 'customer_project';
        
        -- Update existing sites without customer_id to be 'general'
        UPDATE sites 
        SET site_type = 'general' 
        WHERE customer_id IS NULL;
        
        RAISE NOTICE 'Added site_type column to sites table';
    ELSE
        RAISE NOTICE 'site_type column already exists';
    END IF;
END $$;

-- Make customer_id nullable if it isn't already
DO $$ 
BEGIN
    ALTER TABLE sites 
    ALTER COLUMN customer_id DROP NOT NULL;
    RAISE NOTICE 'Made customer_id nullable';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'customer_id is already nullable or error occurred: %', SQLERRM;
END $$;

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_sites_site_type ON sites(site_type);

COMMENT ON COLUMN sites.site_type IS 'Type of site: general (quarry, loading station) or customer_project (customer-specific construction site)';
