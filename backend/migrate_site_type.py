#!/usr/bin/env python3
"""
Add site_type column to sites table
"""
from app.core.database import engine
import sqlalchemy as sa

def run_migration():
    with engine.connect() as conn:
        # Read and execute migration SQL
        with open('/app/db/add_site_type.sql', 'r') as f:
            sql = f.read()
        
        conn.execute(sa.text(sql))
        conn.commit()
        print("✅ Migration completed successfully!")

if __name__ == "__main__":
    run_migration()
