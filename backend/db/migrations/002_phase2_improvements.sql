-- Phase 2 Improvements Migration
-- Date: 2026-01-26
-- Description: Adding subcontractors, truck-centric structure, and enhanced features

-- ============================================================================
-- 1. Subcontractors Management
-- ============================================================================

CREATE TABLE IF NOT EXISTS subcontractors (
  id SERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- פרטי קבלן
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  vat_id VARCHAR(50),
  contact_person VARCHAR(200),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  
  -- תנאי תשלום
  payment_terms VARCHAR(100) DEFAULT 'monthly',
  payment_method VARCHAR(50),
  bank_details TEXT,
  
  -- מטא
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_subcontractors_org ON subcontractors(org_id);
CREATE INDEX idx_subcontractors_active ON subcontractors(org_id, is_active);

COMMENT ON TABLE subcontractors IS 'קבלני משנה - ספקי שירותי הובלה חיצוניים';
COMMENT ON COLUMN subcontractors.payment_terms IS 'weekly/monthly/per_trip';

-- ============================================================================
-- 2. Subcontractor Price Lists
-- ============================================================================

CREATE TABLE IF NOT EXISTS subcontractor_price_lists (
  id SERIAL PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subcontractor_id INTEGER NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  truck_id INTEGER REFERENCES trucks(id) ON DELETE SET NULL,
  
  -- הגדרת מסלול/חומר
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  material_id INTEGER REFERENCES materials(id) ON DELETE SET NULL,
  from_site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  to_site_id INTEGER REFERENCES sites(id) ON DELETE SET NULL,
  
  -- מחירים (מספיק שאחד יהיה מלא)
  price_per_trip DECIMAL(10,2),
  price_per_ton DECIMAL(10,2),
  price_per_m3 DECIMAL(10,2),
  price_per_km DECIMAL(10,2),
  
  -- מינימום חיוב
  min_charge DECIMAL(10,2),
  
  -- תוקף
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- מטא
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_subcontractor_prices_org ON subcontractor_price_lists(org_id);
CREATE INDEX idx_subcontractor_prices_sub ON subcontractor_price_lists(subcontractor_id);
CREATE INDEX idx_subcontractor_prices_truck ON subcontractor_price_lists(truck_id);
CREATE INDEX idx_subcontractor_prices_customer ON subcontractor_price_lists(customer_id);

COMMENT ON TABLE subcontractor_price_lists IS 'מחירונים לקבלני משנה';

-- ============================================================================
-- 3. Trucks Enhancements - Add ownership type
-- ============================================================================

ALTER TABLE trucks ADD COLUMN IF NOT EXISTS owner_type VARCHAR(20) DEFAULT 'COMPANY';
ALTER TABLE trucks ADD COLUMN IF NOT EXISTS subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE SET NULL;

COMMENT ON COLUMN trucks.owner_type IS 'COMPANY or SUBCONTRACTOR';
COMMENT ON COLUMN trucks.subcontractor_id IS 'אם owner_type=SUBCONTRACTOR, מכיל FK לקבלן';

CREATE INDEX IF NOT EXISTS idx_trucks_owner ON trucks(org_id, owner_type);
CREATE INDEX IF NOT EXISTS idx_trucks_subcontractor ON trucks(subcontractor_id);

-- ============================================================================
-- 4. Drivers Enhancement - Default Truck Assignment
-- ============================================================================

ALTER TABLE drivers ADD COLUMN IF NOT EXISTS default_truck_id INTEGER REFERENCES trucks(id) ON DELETE SET NULL;

COMMENT ON COLUMN drivers.default_truck_id IS 'משאית ברירת מחדל לנהג';

CREATE INDEX IF NOT EXISTS idx_drivers_truck ON drivers(default_truck_id);

-- ============================================================================
-- 5. Jobs Enhancements - Subcontractor Support
-- ============================================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_subcontractor BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subcontractor_id INTEGER REFERENCES subcontractors(id) ON DELETE SET NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subcontractor_price_total DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subcontractor_price_breakdown_json JSON;

COMMENT ON COLUMN jobs.is_subcontractor IS 'האם הנסיעה בוצעה ע"י קבלן משנה';
COMMENT ON COLUMN jobs.subcontractor_price_breakdown_json IS 'פירוט חישוב מחיר לקבלן';

CREATE INDEX IF NOT EXISTS idx_jobs_subcontractor ON jobs(subcontractor_id);
CREATE INDEX IF NOT EXISTS idx_jobs_is_subcontractor ON jobs(org_id, is_subcontractor);

-- ============================================================================
-- 6. Sites Enhancement - Generic Sites (not tied to customer)
-- ============================================================================

ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_generic BOOLEAN DEFAULT false;

-- אפשר customer_id להיות NULL אם is_generic=true
-- (אם יש constraint, נסיר אותו)
ALTER TABLE sites ALTER COLUMN customer_id DROP NOT NULL;

COMMENT ON COLUMN sites.is_generic IS 'אתר כללי (מחצבה, תחנת דלק) - לא משויך ללקוח ספציפי';

CREATE INDEX IF NOT EXISTS idx_sites_generic ON sites(org_id, is_generic);

-- ============================================================================
-- 7. Update existing data - set default values
-- ============================================================================

-- כל המשאיות הקיימות הן של החברה
UPDATE trucks SET owner_type = 'COMPANY' WHERE owner_type IS NULL;

-- כל האתרים הקיימים אינם כלליים
UPDATE sites SET is_generic = false WHERE is_generic IS NULL;

-- כל ה-Jobs הקיימים אינם של קבלן
UPDATE jobs SET is_subcontractor = false WHERE is_subcontractor IS NULL;

-- ============================================================================
-- 8. Add audit triggers for new tables
-- ============================================================================

-- Trigger לעדכון updated_at אוטומטי
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to subcontractors
DROP TRIGGER IF EXISTS update_subcontractors_modtime ON subcontractors;
CREATE TRIGGER update_subcontractors_modtime
    BEFORE UPDATE ON subcontractors
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- Apply to subcontractor_price_lists
DROP TRIGGER IF EXISTS update_subcontractor_prices_modtime ON subcontractor_price_lists;
CREATE TRIGGER update_subcontractor_prices_modtime
    BEFORE UPDATE ON subcontractor_price_lists
    FOR EACH ROW
    EXECUTE FUNCTION update_modified_column();

-- ============================================================================
-- 9. Constraints and Validation
-- ============================================================================

-- וידוא שמשאית של קבלן חייבת לפחות מחירון אחד
-- (לא נכפה ב-DB, רק ב-business logic)

-- וידוא תוקף תאריכי מחירון
ALTER TABLE subcontractor_price_lists 
  ADD CONSTRAINT check_valid_dates 
  CHECK (valid_to IS NULL OR valid_from IS NULL OR valid_to >= valid_from);

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- רישום ה-migration
INSERT INTO schema_versions (version, description, applied_at)
VALUES ('002_phase2_improvements', 'Phase 2: Subcontractors, truck-centric, generic sites', NOW())
ON CONFLICT (version) DO NOTHING;

-- סיום
SELECT 'Migration 002_phase2_improvements completed successfully' AS status;
