-- עדכון נהגים לשמות אמיתיים
UPDATE drivers SET name = 'משה כהן' WHERE org_id = 3 AND name = 'Demo Driver 1';
UPDATE drivers SET name = 'יוסי לוי' WHERE org_id = 3 AND name = 'Demo Driver 2';
UPDATE drivers SET name = 'דוד אברהם' WHERE org_id = 3 AND name = 'Demo Driver 3';
UPDATE drivers SET name = 'אבי מזרחי' WHERE org_id = 3 AND name = 'Demo Driver 4';
UPDATE drivers SET name = 'רוני ביטון' WHERE org_id = 3 AND name = 'Demo Driver 5';
UPDATE drivers SET name = 'עמי שלום' WHERE org_id = 3 AND name = 'Demo Driver 6';
UPDATE drivers SET name = 'אלי חיים' WHERE org_id = 3 AND name = 'Demo Driver 7';
UPDATE drivers SET name = 'שמעון דהן' WHERE org_id = 3 AND name = 'Demo Driver 8';
UPDATE drivers SET name = 'יגאל פרץ' WHERE org_id = 3 AND name = 'Demo Driver 9';
UPDATE drivers SET name = 'אורן אוחנה' WHERE org_id = 3 AND name = 'Demo Driver 10';

-- עדכון מספרי משאיות לאמיתיים
UPDATE trucks SET plate_number = '7654321' WHERE org_id = 3 AND plate_number = '11-222-33';
UPDATE trucks SET plate_number = '8765432' WHERE org_id = 3 AND plate_number = '55-123-45';
UPDATE trucks SET plate_number = '9876543' WHERE org_id = 3 AND plate_number = '77-888-99';
UPDATE trucks SET plate_number = '2345678' WHERE org_id = 3 AND plate_number = '99-101-77';
UPDATE trucks SET plate_number = '3456789' WHERE org_id = 3 AND plate_number = '99-102-77';
UPDATE trucks SET plate_number = '4567890' WHERE org_id = 3 AND plate_number = '99-103-77';
UPDATE trucks SET plate_number = '5678901' WHERE org_id = 3 AND plate_number = '99-104-77';
UPDATE trucks SET plate_number = '6789012' WHERE org_id = 3 AND plate_number = '99-105-77';
UPDATE trucks SET plate_number = '7890123' WHERE org_id = 3 AND plate_number = '99-106-77';
UPDATE trucks SET plate_number = '8901234' WHERE org_id = 3 AND plate_number = '99-107-77';
UPDATE trucks SET plate_number = '9012345' WHERE org_id = 3 AND plate_number = '99-108-77';
UPDATE trucks SET plate_number = '1234567' WHERE org_id = 3 AND plate_number = '99-109-77';
UPDATE trucks SET plate_number = '2468135' WHERE org_id = 3 AND plate_number = '99-110-77';

-- עדכון לקוח Demo Customer
UPDATE customers SET name = 'שיכון ובינוי בע"מ' WHERE org_id = 3 AND name = 'Demo Customer';

-- הוספת אתרים אמיתיים
INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מחצבת נשר - רמלה', 'רמלה, ישראל', 31.9293, 34.8721, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
ON CONFLICT DO NOTHING;

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'פרויקט מגדלי תל אביב - גבעתיים', 'גבעתיים, ישראל', 32.0715, 34.8096, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
ON CONFLICT DO NOTHING;

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'תחנת מעבר - חולון', 'חולון, ישראל', 32.0104, 34.7694, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
ON CONFLICT DO NOTHING;

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'מחצבת חרמון - צפון', 'קרית שמונה, ישראל', 33.2074, 35.5691, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'נתיבי בניה'
ON CONFLICT DO NOTHING;

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'פרויקט כביש 6 - קטע מרכז', 'מודיעין, ישראל', 31.8969, 35.0095, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'נתיבי בניה'
ON CONFLICT DO NOTHING;

INSERT INTO sites (org_id, customer_id, name, address, lat, lng, is_active, created_at)
SELECT 3, c.id, 'תחנת כוח - אשדוד', 'אשדוד, ישראל', 31.8044, 34.6553, true, NOW()
FROM customers c WHERE c.org_id = 3 AND c.name = 'אפקה תשתיות'
ON CONFLICT DO NOTHING;

-- הוספת נסיעות להיום (29.01.2026)
INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-29 07:00:00+02',
    18.0,
    'TON',
    d.id,
    t.id,
    'ASSIGNED',
    1,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט מגדלי תל אביב - גבעתיים'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'משה כהן'
AND t.org_id = 3 AND t.plate_number = '7654321'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-29 08:00:00+02',
    22.0,
    'TON',
    d.id,
    t.id,
    'ASSIGNED',
    1,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי בניה'
AND s1.org_id = 3 AND s1.name = 'מחצבת חרמון - צפון'
AND s2.org_id = 3 AND s2.name = 'פרויקט כביש 6 - קטע מרכז'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'יוסי לוי'
AND t.org_id = 3 AND t.plate_number = '8765432'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-29 09:30:00+02',
    20.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    0,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'אפקה תשתיות'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת כוח - אשדוד'
AND m.org_id = 3 AND m.name = 'מצע'
AND d.org_id = 3 AND d.name = 'דוד אברהם'
AND t.org_id = 3 AND t.plate_number = '9876543'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-29 11:00:00+02',
    25.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    0,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת מעבר - חולון'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'אבי מזרחי'
AND t.org_id = 3 AND t.plate_number = '2345678'
LIMIT 1;

-- הוספת נסיעות למחר (30.01.2026)
INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-30 06:30:00+02',
    20.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    1,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי בניה'
AND s1.org_id = 3 AND s1.name = 'מחצבת חרמון - צפון'
AND s2.org_id = 3 AND s2.name = 'פרויקט כביש 6 - קטע מרכז'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'רוני ביטון'
AND t.org_id = 3 AND t.plate_number = '3456789'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-30 07:30:00+02',
    23.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    1,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'פרויקט מגדלי תל אביב - גבעתיים'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'עמי שלום'
AND t.org_id = 3 AND t.plate_number = '4567890'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-30 09:00:00+02',
    19.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    0,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'אפקה תשתיות'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת כוח - אשדוד'
AND m.org_id = 3 AND m.name = 'מצע'
AND d.org_id = 3 AND d.name = 'אלי חיים'
AND t.org_id = 3 AND t.plate_number = '5678901'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-30 10:30:00+02',
    24.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    0,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'נתיבי בניה'
AND s1.org_id = 3 AND s1.name = 'מחצבת חרמון - צפון'
AND s2.org_id = 3 AND s2.name = 'פרויקט כביש 6 - קטע מרכז'
AND m.org_id = 3 AND m.name = 'חצץ'
AND d.org_id = 3 AND d.name = 'שמעון דהן'
AND t.org_id = 3 AND t.plate_number = '6789012'
LIMIT 1;

INSERT INTO jobs (org_id, customer_id, from_site_id, to_site_id, material_id, scheduled_date, planned_qty, unit, driver_id, truck_id, status, priority, created_at)
SELECT 
    3,
    c.id,
    s1.id,
    s2.id,
    m.id,
    '2026-01-30 12:00:00+02',
    21.0,
    'TON',
    d.id,
    t.id,
    'PLANNED',
    0,
    NOW()
FROM customers c
CROSS JOIN sites s1
CROSS JOIN sites s2
CROSS JOIN materials m
CROSS JOIN drivers d
CROSS JOIN trucks t
WHERE c.org_id = 3 AND c.name = 'שיכון ובינוי בע"מ'
AND s1.org_id = 3 AND s1.name = 'מחצבת נשר - רמלה'
AND s2.org_id = 3 AND s2.name = 'תחנת מעבר - חולון'
AND m.org_id = 3 AND m.name = 'עפר'
AND d.org_id = 3 AND d.name = 'יגאל פרץ'
AND t.org_id = 3 AND t.plate_number = '7890123'
LIMIT 1;
