-- Fix all missing columns in database tables
-- Based on models in backend/app/models/__init__.py

-- Sites table
ALTER TABLE sites ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255);
ALTER TABLE sites ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Check what columns exist in database
-- \d+ sites;
