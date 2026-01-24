#!/usr/bin/env python3
import psycopg2

conn = psycopg2.connect('postgresql://fleet_user:fleet_password@localhost:5432/fleet_management')
cur = conn.cursor()

# Add missing columns to jobs
columns_to_add = [
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trailer_id INTEGER",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manual_override_total DECIMAL(10, 2)",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manual_override_reason TEXT",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT",
    "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE",
]

for sql in columns_to_add:
    cur.execute(sql)
    print(f"✓ {sql.split('ADD COLUMN IF NOT EXISTS')[1].split()[0]}")

# Add updated_at to all tables
tables = ['customers', 'sites', 'drivers', 'trucks', 'materials', 'price_lists', 'statements', 'expenses', 'organizations']
for table in tables:
    cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE")
    print(f"✓ {table}.updated_at")

conn.commit()
conn.close()

print("\n✅ All columns added successfully!")
