-- Fix users table org_id to UUID

-- Drop existing foreign key if exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_org_id_fkey') THEN
        ALTER TABLE users DROP CONSTRAINT users_org_id_fkey;
    END IF;
END $$;

-- Drop existing index
DROP INDEX IF EXISTS idx_users_org_id;

-- Change org_id to UUID
ALTER TABLE users ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;

-- Add foreign key
ALTER TABLE users ADD CONSTRAINT users_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

-- Recreate index
CREATE INDEX idx_users_org_id ON users(org_id);

SELECT 'Users org_id converted to UUID successfully!' as result;
