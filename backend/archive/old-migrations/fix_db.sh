#!/bin/bash
cd /home/bhaa/workspace/Fleet_Management/backend

# Add missing columns to jobs
./venv/bin/python3 << 'EOPY'
import psycopg2

conn = psycopg2.connect('postgresql://fleet_user:fleet_password@localhost:5432/fleet_management')
cur = conn.cursor()

# Add missing columns to jobs
cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS trailer_id INTEGER")
cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manual_override_total DECIMAL(10, 2)")
cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS manual_override_reason TEXT")
cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes TEXT")
cur.execute("ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE")

# Add updated_at to all tables that need it
tables = ['customers', 'sites', 'drivers', 'trucks', 'materials', 'price_lists', 'statements', 'expenses', 'organizations']
for table in tables:
    cur.execute(f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE")

conn.commit()
print('✅ All columns added successfully')
conn.close()
EOPY

# Restart backend
pkill -9 -f "uvicorn.*8001"
sleep 2
nohup ./venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8001 > /tmp/backend.log 2>&1 &
sleep 3

echo ""
echo "🎉 Database fixed and Backend restarted!"
echo "Testing API..."
sleep 2
curl -s http://localhost:8001/api/jobs?date=2026-01-25 | head -50
