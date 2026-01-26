-- Create share_urls table (missing in some environments)

CREATE TABLE IF NOT EXISTS share_urls (
    id SERIAL PRIMARY KEY,
    short_id VARCHAR(8) UNIQUE NOT NULL,
    job_id INTEGER NOT NULL,
    org_id UUID NOT NULL,
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE
);

DO $$ BEGIN
    ALTER TABLE share_urls
        ADD CONSTRAINT share_urls_job_id_fkey
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE share_urls
        ADD CONSTRAINT share_urls_org_id_fkey
        FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE share_urls
        ADD CONSTRAINT share_urls_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_share_urls_org_id ON share_urls(org_id);
CREATE INDEX IF NOT EXISTS idx_share_urls_job_id ON share_urls(job_id);
