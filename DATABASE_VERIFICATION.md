# SQL Verification Queries for Multi-Tenant Setup

## 1. Verify all org_id columns are UUID type
```sql
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE column_name = 'org_id'
ORDER BY table_name;
```
**Expected:** All 20 tables should show `data_type = uuid`

---

## 2. Verify foreign key constraints
```sql
SELECT
    tc.table_name, 
    tc.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
    ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND kcu.column_name = 'org_id'
ORDER BY tc.table_name;
```
**Expected:** 20 foreign keys with `delete_rule = CASCADE`

---

## 3. Verify indexes on org_id
```sql
SELECT
    t.relname AS table_name,
    i.relname AS index_name,
    a.attname AS column_name
FROM pg_class t
JOIN pg_index ix ON t.oid = ix.indrelid
JOIN pg_class i ON i.oid = ix.indexrelid
JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = ANY(ix.indkey)
WHERE a.attname = 'org_id'
ORDER BY t.relname;
```
**Expected:** 20+ indexes (one per table with org_id)

---

## 4. Verify organizations table structure
```sql
\d organizations
```
**Expected:**
- `id` column type: `uuid`
- 30+ columns including: name, slug, display_name, plan_type, max_trucks, max_drivers, status, etc.

---

## 5. Check default organization
```sql
SELECT 
    id, 
    name, 
    slug, 
    plan_type, 
    max_trucks, 
    max_drivers, 
    status,
    is_active
FROM organizations;
```
**Expected:**
- 1 row with ID: `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`
- name: `Default Organization`
- plan_type: `enterprise`
- max_trucks: `999`
- max_drivers: `999`
- status: `active`

---

## 6. Verify users table has super admin columns
```sql
\d users
```
**Expected columns:**
- `org_id` type: `uuid`
- `is_super_admin` type: `boolean` default: `false`
- `org_role` type: `character varying(50)` default: `'user'`

---

## 7. Count records by organization (should all be in default org)
```sql
SELECT 
    (SELECT COUNT(*) FROM customers WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS customers,
    (SELECT COUNT(*) FROM sites WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS sites,
    (SELECT COUNT(*) FROM drivers WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS drivers,
    (SELECT COUNT(*) FROM trucks WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS trucks,
    (SELECT COUNT(*) FROM materials WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS materials,
    (SELECT COUNT(*) FROM jobs WHERE org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') AS jobs;
```
**Expected:** All counts should match total counts (all data in default org)

---

## 8. Verify NO records without org_id (should be empty)
```sql
SELECT 'customers' AS table_name, COUNT(*) AS orphaned_records FROM customers WHERE org_id IS NULL
UNION ALL
SELECT 'sites', COUNT(*) FROM sites WHERE org_id IS NULL
UNION ALL
SELECT 'drivers', COUNT(*) FROM drivers WHERE org_id IS NULL
UNION ALL
SELECT 'trucks', COUNT(*) FROM trucks WHERE org_id IS NULL
UNION ALL
SELECT 'materials', COUNT(*) FROM materials WHERE org_id IS NULL
UNION ALL
SELECT 'jobs', COUNT(*) FROM jobs WHERE org_id IS NULL
UNION ALL
SELECT 'users', COUNT(*) FROM users WHERE org_id IS NULL;
```
**Expected:** All counts = 0 (no orphaned records)

---

## Running all checks at once:
```bash
docker exec fleet_db psql -U fleet_user -d fleet_management -f /path/to/verification_queries.sql
```

OR run verify_multi_tenant.py:
```bash
docker exec fleet_backend python verify_multi_tenant.py
```
