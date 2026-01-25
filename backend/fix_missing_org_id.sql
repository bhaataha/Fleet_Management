-- Add missing org_id columns to all tables that need it
-- Based on the models which expect org_id but tables don't have it

ALTER TABLE job_status_events ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE delivery_notes ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE weigh_tickets ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE files ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE job_files ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE price_lists ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE statements ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE statement_lines ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE payment_allocations ADD COLUMN IF NOT EXISTS org_id INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS org_id INTEGER;

-- Update org_id to match the organization (assuming all data is for org_id=1)
UPDATE job_status_events SET org_id = 1 WHERE org_id IS NULL;
UPDATE delivery_notes SET org_id = 1 WHERE org_id IS NULL;
UPDATE weigh_tickets SET org_id = 1 WHERE org_id IS NULL;
UPDATE files SET org_id = 1 WHERE org_id IS NULL;
UPDATE job_files SET org_id = 1 WHERE org_id IS NULL;
UPDATE price_lists SET org_id = 1 WHERE org_id IS NULL;
UPDATE statements SET org_id = 1 WHERE org_id IS NULL;
UPDATE statement_lines SET org_id = 1 WHERE org_id IS NULL;
UPDATE payments SET org_id = 1 WHERE org_id IS NULL;
UPDATE payment_allocations SET org_id = 1 WHERE org_id IS NULL;
UPDATE expenses SET org_id = 1 WHERE org_id IS NULL;

-- Make org_id NOT NULL after updating
ALTER TABLE job_status_events ALTER COLUMN org_id SET NOT NULL;
-- Note: Other tables might allow NULL org_id based on model, so we won't force NOT NULL for all
