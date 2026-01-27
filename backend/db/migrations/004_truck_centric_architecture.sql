-- Migration: Truck-Centric Architecture
-- Date: 2026-01-26
-- Description: Change from driver-centric to truck-centric assignment
-- Trucks become the primary entity, drivers are assigned to trucks

BEGIN;

-- 1. Add driver assignment columns to trucks table
ALTER TABLE trucks 
ADD COLUMN primary_driver_id INTEGER REFERENCES drivers(id),
ADD COLUMN secondary_driver_ids JSONB DEFAULT '[]';

-- 2. Migrate existing data: Find which driver uses each truck as default
-- Copy driver's default truck relationship to truck's primary driver
UPDATE trucks t
SET primary_driver_id = d.id
FROM drivers d
WHERE d.default_truck_id = t.id
AND d.is_active = true;

-- 3. Create indexes for performance
CREATE INDEX idx_trucks_primary_driver ON trucks(primary_driver_id);
CREATE INDEX idx_trucks_secondary_drivers ON trucks USING GIN (secondary_driver_ids);

-- 4. Remove default_truck_id from drivers (breaking change!)
-- This enforces the new truck-centric model
ALTER TABLE drivers DROP COLUMN IF EXISTS default_truck_id;

-- 5. Make sites.customer_id nullable for generic sites
ALTER TABLE sites ALTER COLUMN customer_id DROP NOT NULL;

-- 6. Add is_generic flag to sites
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_generic BOOLEAN DEFAULT FALSE;

-- 7. Create index for generic sites
CREATE INDEX idx_sites_generic ON sites(is_generic) WHERE is_generic = true;

-- 8. Add comments for documentation
COMMENT ON COLUMN trucks.primary_driver_id IS 'Primary driver assigned to this truck';
COMMENT ON COLUMN trucks.secondary_driver_ids IS 'Array of secondary driver IDs assigned to this truck';
COMMENT ON COLUMN sites.is_generic IS 'Generic site not tied to specific customer (quarry, fuel station, etc)';

COMMIT;
