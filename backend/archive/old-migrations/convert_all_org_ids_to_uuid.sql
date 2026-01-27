-- Convert all remaining org_id columns from INTEGER to UUID

-- List of tables that need conversion:
-- audit_logs, customers, drivers, expenses, files, jobs, materials, payments, price_lists, sites, statements, trailers, trucks, user_roles

-- 1. audit_logs
DROP INDEX IF EXISTS idx_audit_logs_org_id;
ALTER TABLE audit_logs DROP CONSTRAINT IF EXISTS audit_logs_org_id_fkey;
ALTER TABLE audit_logs ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE audit_logs ADD CONSTRAINT audit_logs_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);

-- 2. customers
DROP INDEX IF EXISTS idx_customers_org_id;
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_org_id_fkey;
ALTER TABLE customers ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE customers ADD CONSTRAINT customers_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_customers_org_id ON customers(org_id);

-- 3. drivers
DROP INDEX IF EXISTS idx_drivers_org_id;
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_org_id_fkey;
ALTER TABLE drivers ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE drivers ADD CONSTRAINT drivers_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_drivers_org_id ON drivers(org_id);

-- 4. expenses
DROP INDEX IF EXISTS idx_expenses_org_id;
ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_org_id_fkey;
ALTER TABLE expenses ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE expenses ADD CONSTRAINT expenses_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_expenses_org_id ON expenses(org_id);

-- 5. files
DROP INDEX IF EXISTS idx_files_org_id;
ALTER TABLE files DROP CONSTRAINT IF EXISTS files_org_id_fkey;
ALTER TABLE files ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE files ADD CONSTRAINT files_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_files_org_id ON files(org_id);

-- 6. jobs
DROP INDEX IF EXISTS idx_jobs_org_id;
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_org_id_fkey;
ALTER TABLE jobs ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE jobs ADD CONSTRAINT jobs_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_jobs_org_id ON jobs(org_id);

-- 7. materials
DROP INDEX IF EXISTS idx_materials_org_id;
ALTER TABLE materials DROP CONSTRAINT IF EXISTS materials_org_id_fkey;
ALTER TABLE materials ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE materials ADD CONSTRAINT materials_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_materials_org_id ON materials(org_id);

-- 8. payments
DROP INDEX IF EXISTS idx_payments_org_id;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_org_id_fkey;
ALTER TABLE payments ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE payments ADD CONSTRAINT payments_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_payments_org_id ON payments(org_id);

-- 9. price_lists
DROP INDEX IF EXISTS idx_price_lists_org_id;
ALTER TABLE price_lists DROP CONSTRAINT IF EXISTS price_lists_org_id_fkey;
ALTER TABLE price_lists ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE price_lists ADD CONSTRAINT price_lists_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_price_lists_org_id ON price_lists(org_id);

-- 10. sites
DROP INDEX IF EXISTS idx_sites_org_id;
ALTER TABLE sites DROP CONSTRAINT IF EXISTS sites_org_id_fkey;
ALTER TABLE sites ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE sites ADD CONSTRAINT sites_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_sites_org_id ON sites(org_id);

-- 11. statements
DROP INDEX IF EXISTS idx_statements_org_id;
ALTER TABLE statements DROP CONSTRAINT IF EXISTS statements_org_id_fkey;
ALTER TABLE statements ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE statements ADD CONSTRAINT statements_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_statements_org_id ON statements(org_id);

-- 12. trailers
DROP INDEX IF EXISTS idx_trailers_org_id;
ALTER TABLE trailers DROP CONSTRAINT IF EXISTS trailers_org_id_fkey;
ALTER TABLE trailers ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE trailers ADD CONSTRAINT trailers_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_trailers_org_id ON trailers(org_id);

-- 13. trucks
DROP INDEX IF EXISTS idx_trucks_org_id;
ALTER TABLE trucks DROP CONSTRAINT IF EXISTS trucks_org_id_fkey;
ALTER TABLE trucks ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE trucks ADD CONSTRAINT trucks_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_trucks_org_id ON trucks(org_id);

-- 14. user_roles
DROP INDEX IF EXISTS idx_user_roles_org_id;
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_org_id_fkey;
ALTER TABLE user_roles ALTER COLUMN org_id TYPE UUID USING org_id::text::uuid;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_org_id_fkey 
    FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX idx_user_roles_org_id ON user_roles(org_id);

SELECT 'All org_id columns converted to UUID successfully!' as result;
