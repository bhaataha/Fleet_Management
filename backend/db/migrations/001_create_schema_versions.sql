-- Schema Versions Table
-- Tracks all migrations applied to the database

CREATE TABLE IF NOT EXISTS schema_versions (
  id SERIAL PRIMARY KEY,
  version VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  applied_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE schema_versions IS 'מעקב אחר migrations שהופעלו במערכת';

-- רישום ה-migration הראשון
INSERT INTO schema_versions (version, description, applied_at)
VALUES ('001_create_schema_versions', 'Initial schema versions tracking table', NOW())
ON CONFLICT (version) DO NOTHING;
