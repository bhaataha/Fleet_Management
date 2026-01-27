-- Insert all available permissions
INSERT INTO permissions (name, display_name, description, category, is_active) VALUES
-- Dashboard & Reports
('dashboard.view', 'צפייה בדשבורד', 'גישה לדשבורד הראשי', 'dashboard', true),
('reports.view', 'צפייה בדוחות', 'גישה לדוחות בסיסיים', 'reports', true),
('reports.financial', 'דוחות פיננסיים', 'גישה לדוחות פיננסיים', 'reports', true),

-- Jobs & Dispatch  
('jobs.view', 'צפייה בנסיעות', 'צפייה ברשימת נסיעות', 'jobs', true),
('jobs.create', 'יצירת נסיעות', 'יכולת ליצור נסיעות חדשות', 'jobs', true),
('jobs.edit', 'עריכת נסיעות', 'יכולת לערוך נסיעות קיימות', 'jobs', true),
('jobs.assign', 'שיבוץ נהגים', 'יכולת לשבץ נהגים לנסיעות', 'jobs', true),
('jobs.delete', 'מחיקת נסיעות', 'יכולת למחוק נסיעות', 'jobs', true),
('jobs.pricing', 'עריכת מחירים', 'יכולת לערוך מחירים ידנית', 'jobs', true),

-- Customers & Sites
('customers.view', 'צפייה בלקוחות', 'צפייה ברשימת לקוחות', 'customers', true),
('customers.create', 'הוספת לקוחות', 'יכולת להוסיף לקוחות חדשים', 'customers', true),
('customers.edit', 'עריכת לקוחות', 'יכולת לערוך פרטי לקוחות', 'customers', true),
('sites.view', 'צפייה באתרים', 'צפייה ברשימת אתרים', 'sites', true),
('sites.create', 'הוספת אתרים', 'יכולת להוסיף אתרים חדשים', 'sites', true),

-- Fleet Management
('fleet.view', 'צפייה בצי', 'צפייה במשאיות ונהגים', 'fleet', true),
('fleet.trucks.create', 'הוספת משאיות', 'יכולת להוסיף משאיות חדשות', 'fleet', true),
('fleet.trucks.edit', 'עריכת משאיות', 'יכולת לערוך פרטי משאיות', 'fleet', true),
('fleet.drivers.create', 'הוספת נהגים', 'יכולת להוסיף נהגים חדשים', 'fleet', true),
('fleet.drivers.edit', 'עריכת נהגים', 'יכולת לערוך פרטי נהגים', 'fleet', true),

-- Billing & Finance
('billing.view', 'צפייה בחשבוניות', 'צפייה בחשבוניות וסיכומים', 'billing', true),
('billing.create', 'יצירת חשבוניות', 'יכולת ליצור חשבוניות חדשות', 'billing', true),
('billing.edit', 'עריכת חשבוניות', 'יכולת לערוך חשבוניות', 'billing', true),
('payments.view', 'צפייה בתשלומים', 'צפייה בתשלומים ויתרות', 'billing', true),
('payments.record', 'רישום תשלומים', 'יכולת לרשום תשלומים', 'billing', true),

-- Pricing
('pricing.view', 'צפייה במחירונים', 'צפייה במחירונים', 'pricing', true),
('pricing.edit', 'עריכת מחירונים', 'יכולת לערוך מחירונים', 'pricing', true),

-- System & Settings
('users.view', 'צפייה במשתמשים', 'צפייה ברשימת משתמשים', 'system', true),
('users.manage', 'ניהול משתמשים', 'יכולת לנהל משתמשים והרשאות', 'system', true),
('settings.view', 'צפייה בהגדרות', 'גישה להגדרות המערכת', 'system', true),
('settings.edit', 'עריכת הגדרות', 'יכולת לערוך הגדרות מערכת', 'system', true)
ON CONFLICT (name) DO NOTHING;
