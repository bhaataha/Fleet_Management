-- Database initialization script
-- Run this to create the database and initial data

-- Note: Tables are created by Alembic migrations
-- This script just creates initial seed data

-- Create default organization
INSERT INTO organizations (name, timezone, is_active) 
VALUES ('חברת הובלות דוגמה', 'Asia/Jerusalem', true)
ON CONFLICT DO NOTHING;

-- Create admin user (password: admin123)
INSERT INTO users (org_id, email, name, phone, password_hash, is_active)
VALUES (
    1,
    'admin@example.com',
    'מנהל מערכת',
    '050-1234567',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lZ7kOxgWpjfO',  -- admin123
    true
)
ON CONFLICT (email) DO NOTHING;

-- Assign admin role
INSERT INTO user_roles (org_id, user_id, role)
SELECT 1, id, 'ADMIN'
FROM users
WHERE email = 'admin@example.com'
ON CONFLICT DO NOTHING;

-- Sample materials (עפר, חצץ, מצע)
INSERT INTO materials (org_id, name, name_hebrew, billing_unit, is_active) 
VALUES 
    (1, 'Dirt', 'עפר', 'TON', true),
    (1, 'Gravel', 'חצץ', 'M3', true),
    (1, 'Aggregate', 'מצע', 'TON', true),
    (1, 'Sand', 'חול', 'M3', true),
    (1, 'Construction Waste', 'פסולת בניין', 'TRIP', true)
ON CONFLICT DO NOTHING;

-- Sample customer
INSERT INTO customers (org_id, name, vat_id, contact_name, phone, email, payment_terms, is_active)
VALUES (
    1,
    'חברת בניין בע״מ',
    '123456789',
    'יוסי כהן',
    '052-9876543',
    'yosi@building.co.il',
    'Net 30',
    true
)
ON CONFLICT DO NOTHING;

-- Sample site for customer
INSERT INTO sites (org_id, customer_id, name, address, opening_hours, is_active)
SELECT 
    1,
    id,
    'אתר בניין תל אביב',
    'רח׳ הרצל 123, תל אביב',
    '07:00-17:00',
    true
FROM customers
WHERE name = 'חברת בניין בע״מ'
ON CONFLICT DO NOTHING;

-- Sample truck
INSERT INTO trucks (org_id, plate_number, model, truck_type, capacity_ton, capacity_m3, is_active)
VALUES (
    1,
    '12-345-67',
    'Volvo FH16',
    'פול טריילר',
    30,
    20,
    true
)
ON CONFLICT (plate_number) DO NOTHING;

COMMIT;
