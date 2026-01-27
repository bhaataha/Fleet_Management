-- Migration: Add truck_plate_number to subcontractors
-- Date: 2026-01-26
-- Description: Add unique truck plate number for each subcontractor for reporting

BEGIN;

-- Add truck_plate_number column to subcontractors table
ALTER TABLE subcontractors 
ADD COLUMN truck_plate_number VARCHAR(20);

-- Create index for faster lookups
CREATE INDEX idx_subcontractors_truck_plate ON subcontractors(truck_plate_number);

-- Add comment
COMMENT ON COLUMN subcontractors.truck_plate_number IS 'Unique truck plate number for this subcontractor - used for reports and tracking';

COMMIT;
