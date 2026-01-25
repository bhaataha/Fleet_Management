#!/usr/bin/env python3
"""
Quick check: Verify all org_id columns are UUID type
"""

import psycopg2

def check_org_id_types():
    conn = psycopg2.connect(
        host="localhost",
        port=5434,
        database="fleet_management",
        user="fleet_user",
        password="fleet_password"
    )
    
    cur = conn.cursor()
    
    # Get all org_id column types
    cur.execute("""
        SELECT 
            table_name,
            column_name,
            data_type
        FROM information_schema.columns
        WHERE column_name = 'org_id'
        ORDER BY table_name;
    """)
    
    results = cur.fetchall()
    
    print("=" * 60)
    print("Checking org_id column types across all tables:")
    print("=" * 60)
    
    all_uuid = True
    for table, column, dtype in results:
        status = "✅" if dtype == "uuid" else "❌"
        print(f"{status} {table:25s} | {dtype}")
        if dtype != "uuid":
            all_uuid = False
    
    print("=" * 60)
    
    if all_uuid:
        print("✅ SUCCESS: All org_id columns are UUID!")
        print(f"   Total tables: {len(results)}")
    else:
        print("❌ ERROR: Some org_id columns are not UUID!")
    
    cur.close()
    conn.close()
    
    return all_uuid

if __name__ == "__main__":
    import sys
    success = check_org_id_types()
    sys.exit(0 if success else 1)
