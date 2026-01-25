-- Seed Data for Fleet Management System
-- Run this after create_tables.sql and init.sql

-- Additional customers (we already have one from init.sql)
INSERT INTO customers (org_id, name, vat_id, contact_name, phone, email, payment_terms, is_active, created_at, updated_at)
VALUES 
    (1, 'חברת בניין תל אביב בע״מ', '987654321', 'משה כהן', '053-1234567', 'moshe@tlv-building.co.il', 'Net 30', true, NOW(), NOW()),
    (1, 'פרויקט הרצליה פיתוח', '555666777', 'דני לוי', '054-9876543', 'danny@herzliya-project.co.il', 'Net 45', true, NOW(), NOW()),
    (1, 'קבוצת עזריאלי', '111222333', 'רון אבידן', '052-1112233', 'ron@azrieli.com', 'Net 60', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Additional sites
INSERT INTO sites (org_id, customer_id, name, address, opening_hours, is_active, created_at, updated_at)
VALUES 
    -- For customer 2 (חברת בניין תל אביב)
    (1, 2, 'אתר בנייה דיזנגוף', 'דיזנגוף 100, תל אביב', '07:00-17:00', true, NOW(), NOW()),
    (1, 2, 'מחצבת נשר', 'כביש 6, נשר', '06:00-18:00', true, NOW(), NOW()),
    -- For customer 3 (פרויקט הרצליה)
    (1, 3, 'פרויקט מרינה הרצליה', 'מרינה הרצליה', '07:00-17:00', true, NOW(), NOW()),
    (1, 3, 'מחצבת קיסריה', 'קיסריה', '06:00-18:00', true, NOW(), NOW()),
    -- For customer 4 (עזריאלי)
    (1, 4, 'מגדל עזריאלי תל אביב', 'מגדל עזריאלי, תל אביב', '00:00-24:00', true, NOW(), NOW()),
    (1, 4, 'מחסן חולון', 'אזור תעשייה חולון', '07:00-16:00', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Additional materials (we already have 5 from init.sql)
INSERT INTO materials (org_id, name, name_hebrew, billing_unit, is_active, created_at, updated_at)
VALUES 
    (1, 'Red Sand', 'חול אדום', 'M3', true, NOW(), NOW()),
    (1, 'White Gravel', 'חצץ לבן', 'TON', true, NOW(), NOW()),
    (1, 'Asphalt', 'אספלט', 'TON', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Additional trucks
INSERT INTO trucks (org_id, plate_number, model, truck_type, capacity_ton, capacity_m3, is_active, created_at, updated_at)
VALUES 
    (1, '23-456-78', 'Scania R500', 'פול טריילר', 35, 25, true, NOW(), NOW()),
    (1, '34-567-89', 'Mercedes Actros', 'סמי טריילר', 28, 18, true, NOW(), NOW()),
    (1, '45-678-90', 'Volvo FM', 'פול טריילר', 32, 22, true, NOW(), NOW()),
    (1, '56-789-01', 'MAN TGX', 'סמי טריילר', 30, 20, true, NOW(), NOW())
ON CONFLICT (plate_number) DO NOTHING;

-- Additional drivers
INSERT INTO drivers (org_id, name, phone, license_type, is_active, created_at, updated_at)
VALUES 
    (1, 'יוסי כהן', '050-1111111', 'C+E', true, NOW(), NOW()),
    (1, 'משה לוי', '050-2222222', 'C+E', true, NOW(), NOW()),
    (1, 'דוד אברהם', '050-3333333', 'C', true, NOW(), NOW()),
    (1, 'רון ישראלי', '050-4444444', 'C+E', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Price lists (examples)
INSERT INTO price_lists (org_id, customer_id, material_id, from_site_id, to_site_id, unit, base_price, min_charge, wait_fee_per_hour, night_surcharge_pct, valid_from, valid_to, created_at, updated_at)
VALUES 
    -- Dirt prices for customer 2
    (1, 2, 1, 3, 2, 'TON', 80.00, 500.00, 150.00, 25.00, '2024-01-01', '2024-12-31', NOW(), NOW()),
    -- Gravel prices for customer 3
    (1, 3, 2, 5, 4, 'M3', 120.00, 800.00, 180.00, 30.00, '2024-01-01', '2024-12-31', NOW(), NOW()),
    -- Aggregate prices for customer 4
    (1, 4, 3, 7, 6, 'TON', 90.00, 600.00, 150.00, 25.00, '2024-01-01', '2024-12-31', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Sample jobs for today
INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, 
                  scheduled_date, planned_qty, unit, status, priority,
                  driver_id, truck_id, notes,
                  created_by, created_at, updated_at)
VALUES 
    -- Job 1: Planned
    (1, 2, 3, 2, 1, CURRENT_DATE, 15.5, 'TON', 'PLANNED', 'NORMAL', 
     NULL, NULL, 'נסיעה רגילה',
     1, NOW(), NOW()),
    
    -- Job 2: Assigned
    (1, 2, 3, 2, 1, CURRENT_DATE, 20.0, 'TON', 'ASSIGNED', 'NORMAL', 
     1, 1, 'נסיעה משובצת',
     1, NOW(), NOW()),
    
    -- Job 3: In Progress
    (1, 3, 5, 4, 2, CURRENT_DATE, 18.0, 'M3', 'LOADED', 'HIGH', 
     2, 2, 'נסיעה דחופה',
     1, NOW(), NOW()),
    
    -- Job 4: Delivered
    (1, 4, 7, 6, 3, CURRENT_DATE, 25.0, 'TON', 'DELIVERED', 'NORMAL', 
     3, 3, 'הושלם בהצלחה',
     1, NOW(), NOW()),
    
    -- Job 5: Planned for tomorrow
    (1, 2, 3, 2, 1, CURRENT_DATE + INTERVAL '1 day', 30.0, 'TON', 'PLANNED', 'LOW', 
     NULL, NULL, 'נסיעה למחר',
     1, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Job status events for job 3 (LOADED)
INSERT INTO job_status_events (job_id, status, event_time, user_id, note)
VALUES 
    (3, 'PLANNED', NOW() - INTERVAL '2 hours', 1, 'נסיעה נוצרה'),
    (3, 'ASSIGNED', NOW() - INTERVAL '1.5 hours', 1, 'שובץ נהג ומשאית'),
    (3, 'ENROUTE_PICKUP', NOW() - INTERVAL '1 hour', 1, 'יצא לטעינה'),
    (3, 'LOADED', NOW() - INTERVAL '30 minutes', 1, 'נטען בהצלחה')
ON CONFLICT DO NOTHING;

-- Job status events for job 4 (DELIVERED)
INSERT INTO job_status_events (job_id, status, event_time, user_id, note)
VALUES 
    (4, 'PLANNED', NOW() - INTERVAL '4 hours', 1, 'נסיעה נוצרה'),
    (4, 'ASSIGNED', NOW() - INTERVAL '3.5 hours', 1, 'שובץ'),
    (4, 'ENROUTE_PICKUP', NOW() - INTERVAL '3 hours', 1, 'יצא'),
    (4, 'LOADED', NOW() - INTERVAL '2 hours', 1, 'נטען'),
    (4, 'ENROUTE_DROPOFF', NOW() - INTERVAL '1 hour', 1, 'בדרך לפריקה'),
    (4, 'DELIVERED', NOW() - INTERVAL '15 minutes', 1, 'נמסר')
ON CONFLICT DO NOTHING;

-- Update actual quantities for delivered job
UPDATE jobs SET actual_qty = 24.5 WHERE id = 4;

COMMIT;
