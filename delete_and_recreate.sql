-- התחלת טרנזקציה
BEGIN;

-- מחיקה בסדר הנכון (מטבלאות תלויות לטבלאות עיקריות)
DELETE FROM job_status_events WHERE org_id = 3;
DELETE FROM jobs WHERE org_id = 3;
DELETE FROM sites WHERE org_id = 3;
DELETE FROM drivers WHERE org_id = 3;
-- מחיקת users של נהגים
DELETE FROM users WHERE org_id = 3 AND org_role = 'user' AND email LIKE '%@demo.com';
DELETE FROM trucks WHERE org_id = 3;
DELETE FROM customers WHERE org_id = 3;

-- הוספת לקוחות אמיתיים חדשים
INSERT INTO customers (org_id, name, vat_id, contact_name, phone, email, payment_terms, is_active, created_at) VALUES
(3, 'אלקטרה בנייה בע"מ', '515123456', 'דוד כהן', '052-3456789', 'david@electra.co.il', 'Net 30', true, NOW()),
(3, 'שיכון ובינוי מגורים', '516234567', 'משה לוי', '054-4567890', 'moshe@shikun.co.il', 'Net 45', true, NOW()),
(3, 'נתיבי ישראל - מחוז מרכז', '517345678', 'יוסי אברהם', '053-5678901', 'yossi@nativi.gov.il', 'Net 60', true, NOW()),
(3, 'סולל בונה תשתיות', '518456789', 'אבי מזרחי', '050-6789012', 'avi@solel.co.il', 'Net 30', true, NOW()),
(3, 'דניה סיבוס בע"מ', '519567890', 'רוני ביטון', '052-7890123', 'roni@danya.co.il', 'Net 45', true, NOW());

-- הוספת משאיות חדשות
INSERT INTO trucks (org_id, plate_number, model, truck_type, capacity_ton, capacity_m3, owner_type, is_active, created_at) VALUES
(3, '1234567', 'Volvo FMX 500', 'פול טריילר', 40.0, 24.0, 'COMPANY', true, NOW()),
(3, '2345678', 'Mercedes Arocs 3345', 'פול טריילר', 38.0, 22.0, 'COMPANY', true, NOW()),
(3, '3456789', 'Scania R500', 'פול טריילר', 42.0, 25.0, 'COMPANY', true, NOW()),
(3, '4567890', 'Volvo FMX 460', 'סמי', 28.0, 18.0, 'COMPANY', true, NOW()),
(3, '5678901', 'MAN TGX 26.480', 'פול טריילר', 39.0, 23.0, 'COMPANY', true, NOW()),
(3, '6789012', 'Mercedes Actros 2545', 'סמי', 26.0, 16.0, 'COMPANY', true, NOW()),
(3, '7890123', 'Iveco Stralis 480', 'פול טריילר', 37.0, 21.0, 'COMPANY', true, NOW()),
(3, '8901234', 'Volvo FH16 700', 'פול טריילר', 41.0, 24.0, 'COMPANY', true, NOW());

-- הוספת משתמשים חדשים עבור נהגים
INSERT INTO users (org_id, email, phone, name, password_hash, is_active, org_role, created_at) VALUES
(3, 'moshe.cohen@demo.com', '050-1234567', 'משה כהן', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'yossi.levi@demo.com', '052-2345678', 'יוסי לוי', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'david.abraham@demo.com', '053-3456789', 'דוד אברהם', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'avi.mizrahi@demo.com', '054-4567890', 'אבי מזרחי', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'roni.biton@demo.com', '050-5678901', 'רוני ביטון', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'ami.shalom@demo.com', '052-6789012', 'עמי שלום', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'eli.haim@demo.com', '053-7890123', 'אלי חיים', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW()),
(3, 'shimon.dahan@demo.com', '054-8901234', 'שמעון דהן', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5QK7TFlVvQ4uy', true, 'user', NOW());

-- הוספת נהגים חדשים
INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'משה כהן', '050-1234567', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'moshe.cohen@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'יוסי לוי', '052-2345678', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'yossi.levi@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'דוד אברהם', '053-3456789', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'david.abraham@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'אבי מזרחי', '054-4567890', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'avi.mizrahi@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'רוני ביטון', '050-5678901', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'roni.biton@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'עמי שלום', '052-6789012', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'ami.shalom@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'אלי חיים', '053-7890123', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'eli.haim@demo.com';

INSERT INTO drivers (org_id, user_id, name, phone, license_type, is_active, created_at)
SELECT 3, u.id, 'שמעון דהן', '054-8901234', 'C+E', true, NOW()
FROM users u WHERE u.org_id = 3 AND u.email = 'shimon.dahan@demo.com';

-- הוספת אתרים חדשים
INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מחצבת נשר - רמלה', 'אזור תעשייה רמלה, ישראל', 31.9293, 34.8721, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'אלקטרה בנייה בע"מ';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'פרויקט מגדלי הירקון - תל אביב', 'רחוב הירקון 1, תל אביב', 32.0853, 34.7818, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'אלקטרה בנייה בע"מ';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'פרויקט שכונת נאות אפקה - ראשון לציון', 'ראשון לציון, ישראל', 31.9730, 34.7925, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי מגורים';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מחצבת אלון - צפון', 'קרית שמונה, ישראל', 33.2074, 35.5691, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי מגורים';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'כביש 6 - מחלף גלילות', 'מחלף גלילות, ישראל', 32.2500, 34.9000, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'נתיבי ישראל - מחוז מרכז';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'כביש חוצה ישראל - קטע 9', 'מודיעין, ישראל', 31.8969, 35.0095, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'נתיבי ישראל - מחוז מרכז';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'תחנת כוח רידינג - אשדוד', 'אשדוד, ישראל', 31.8044, 34.6553, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'סולל בונה תשתיות';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מזבלה אזורית - חולון', 'חולון, ישראל', 32.0104, 34.7694, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'סולל בונה תשתיות';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'קו רכבת מהירה - תחנת הרצליה', 'הרצליה, ישראל', 32.1650, 34.8444, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'דניה סיבוס בע"מ';

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מתקן מיון - רמת השרון', 'רמת השרון, ישראל', 32.1465, 34.8395, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'דניה סיבוס בע"מ';

-- הוספת נסיעות להיום (29.01.2026)
INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 06:30:00+02', 22.0, 'TON', d.id, t.id, 'ASSIGNED', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'אלקטרה בנייה בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט מגדלי הירקון - תל אביב'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'משה כהן'
AND t.org_id = 3 AND t.plate_number = '1234567' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 07:00:00+02', 28.0, 'TON', d.id, t.id, 'ASSIGNED', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי מגורים'
AND s1.org_id = 3 AND s1.name = 'מחצבת אלון - צפון'
AND s2.org_id = 3 AND s2.name = 'פרויקט שכונת נאות אפקה - ראשון לציון'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'יוסי לוי'
AND t.org_id = 3 AND t.plate_number = '2345678' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 07:30:00+02', 25.0, 'TON', d.id, t.id, 'ENROUTE_PICKUP', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי ישראל - מחוז מרכז'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'כביש 6 - מחלף גלילות'
AND m.org_id = 3 AND m.name = 'מצע'
AND d.org_id = 3 AND d.name = 'דוד אברהם'
AND t.org_id = 3 AND t.plate_number = '3456789' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 08:00:00+02', 30.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'סולל בונה תשתיות'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת כוח רידינג - אשדוד'
AND m.org_id = 3 AND m.name = 'בטון'
AND d.org_id = 3 AND d.name = 'אבי מזרחי'
AND t.org_id = 3 AND t.plate_number = '4567890' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 09:00:00+02', 20.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'דניה סיבוס בע"מ'
AND s1.org_id = 3 AND s1.name = 'מזבלה אזורית - חולון'
AND s2.org_id = 3 AND s2.name = 'קו רכבת מהירה - תחנת הרצליה'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'רוני ביטון'
AND t.org_id = 3 AND t.plate_number = '5678901' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 10:30:00+02', 24.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'אלקטרה בנייה בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט מגדלי הירקון - תל אביב'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'עמי שלום'
AND t.org_id = 3 AND t.plate_number = '6789012' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 11:00:00+02', 26.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי ישראל - מחוז מרכז'
AND s1.org_id = 3 AND s1.name = 'מחצבת אלון - צפון'
AND s2.org_id = 3 AND s2.name = 'כביש חוצה ישראל - קטע 9'
AND m.org_id = 3 AND m.name = 'מצע'
AND d.org_id = 3 AND d.name = 'אלי חיים'
AND t.org_id = 3 AND t.plate_number = '7890123' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-29 13:00:00+02', 23.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי מגורים'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט שכונת נאות אפקה - ראשון לציון'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'שמעון דהן'
AND t.org_id = 3 AND t.plate_number = '8901234' LIMIT 1;

-- הוספת נסיעות למחר (30.01.2026)
INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 06:00:00+02', 27.0, 'TON', d.id, t.id, 'PLANNED', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'סולל בונה תשתיות'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'מזבלה אזורית - חולון'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'משה כהן'
AND t.org_id = 3 AND t.plate_number = '1234567' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 07:00:00+02', 21.0, 'TON', d.id, t.id, 'PLANNED', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'דניה סיבוס בע"מ'
AND s1.org_id = 3 AND s1.name = 'מתקן מיון - רמת השרון'
AND s2.org_id = 3 AND s2.name = 'קו רכבת מהירה - תחנת הרצליה'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'יוסי לוי'
AND t.org_id = 3 AND t.plate_number = '2345678' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 08:00:00+02', 29.0, 'TON', d.id, t.id, 'PLANNED', 1, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'אלקטרה בנייה בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט מגדלי הירקון - תל אביב'
AND m.org_id = 3 AND m.name = 'בטון'
AND d.org_id = 3 AND d.name = 'דוד אברהם'
AND t.org_id = 3 AND t.plate_number = '3456789' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 09:30:00+02', 25.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי ישראל - מחוז מרכז'
AND s1.org_id = 3 AND s1.name = 'מחצבת אלון - צפון'
AND s2.org_id = 3 AND s2.name = 'כביש 6 - מחלף גלילות'
AND m.org_id = 3 AND m.name = 'מצע'
AND d.org_id = 3 AND d.name = 'אבי מזרחי'
AND t.org_id = 3 AND t.plate_number = '4567890' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 10:00:00+02', 22.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי מגורים'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט שכונת נאות אפקה - ראשון לציון'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'רוני ביטון'
AND t.org_id = 3 AND t.plate_number = '5678901' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 11:30:00+02', 26.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'סולל בונה תשתיות'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת כוח רידינג - אשדוד'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'עמי שלום'
AND t.org_id = 3 AND t.plate_number = '6789012' LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 3, c.id, s1.id, s2.id, m.id, '2026-01-30 13:00:00+02', 24.0, 'TON', d.id, t.id, 'PLANNED', 0, NOW()
FROM customers c, sites s1, sites s2, materials m, drivers d, trucks t
WHERE c.org_id = 3 AND c.name = 'דניה סיבוס בע"מ'
AND s1.org_id = 3 AND s1.name = 'מזבלה אזורית - חולון'
AND s2.org_id = 3 AND s2.name = 'מתקן מיון - רמת השרון'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'אלי חיים'
AND t.org_id = 3 AND t.plate_number = '7890123' LIMIT 1;

-- סיום טרנזקציה
COMMIT;
