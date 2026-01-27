# Phone-Based Authentication & Permissions System

## Overview
מערכת התחברות לפי מספר טלפון עם ניהול הרשאות מתקדם:
- כל משתמש נכנס רק עם מספר טלפון (ללא סיסמה)
- אדמין מגדיר לכל משתמש אילו הרשאות יש לו במערכת
- תמיכה ב-OTP (One Time Password) via SMS

## Database Changes

### 1. User Model Updates
```sql
-- הוספת שדות חדשים לטבלת users
ALTER TABLE users ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN last_otp VARCHAR(6);
ALTER TABLE users ADD COLUMN otp_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMP;
```

### 2. New Permissions Table
```sql
CREATE TABLE user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    permission_name VARCHAR(100) NOT NULL,
    granted BOOLEAN DEFAULT TRUE,
    granted_by INTEGER REFERENCES users(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    UNIQUE(user_id, permission_name)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX idx_user_permissions_org ON user_permissions(org_id);
```

## Permission Names
```python
PERMISSIONS = {
    # Dashboard & Reports
    'dashboard.view': 'צפייה בדשבורד',
    'reports.view': 'צפייה בדוחות',
    'reports.financial': 'דוחות כספיים',
    
    # Jobs & Dispatch
    'jobs.view': 'צפייה בנסיעות',
    'jobs.create': 'יצירת נסיעות',
    'jobs.edit': 'עריכת נסיעות',
    'jobs.assign': 'שיבוץ נסיעות',
    'jobs.delete': 'מחיקת נסיעות',
    'jobs.pricing': 'עריכת מחירים',
    
    # Customers & Sites
    'customers.view': 'צפייה בלקוחות',
    'customers.create': 'הוספת לקוחות',
    'customers.edit': 'עריכת לקוחות',
    'sites.view': 'צפייה באתרים',
    'sites.create': 'הוספת אתרים',
    
    # Fleet Management
    'fleet.view': 'צפייה בצי',
    'trucks.create': 'הוספת משאיות',
    'trucks.edit': 'עריכת משאיות',
    'drivers.view': 'צפייה בנהגים',
    'drivers.create': 'הוספת נהגים',
    
    # Financial
    'statements.view': 'צפייה בחשבוניות',
    'statements.create': 'יצירת חשבוניות',
    'payments.view': 'צפייה בתשלומים',
    'payments.create': 'רישום תשלומים',
    'expenses.view': 'צפייה בהוצאות',
    'expenses.create': 'רישום הוצאות',
    
    # Alerts
    'alerts.view': 'צפייה בהתראות',
    'alerts.manage': 'ניהול התראות',
    
    # User Management (Admin only)
    'users.view': 'צפייה במשתמשים',
    'users.create': 'הוספת משתמשים',
    'users.permissions': 'ניהול הרשאות',
    
    # Mobile Driver Features
    'mobile.job_status': 'עדכון סטטוס נסיעות',
    'mobile.upload_files': 'העלאת קבצים',
    'mobile.signature': 'חתימה דיגיטלית',
}
```

## API Endpoints

### Authentication
- `POST /api/auth/phone-login` - כניסה עם מספר טלפון
- `POST /api/auth/verify-otp` - אימות קוד SMS
- `POST /api/auth/resend-otp` - שליחה חוזרת של קוד

### Permissions Management (Admin Only)
- `GET /api/permissions/users/{user_id}` - הרשאות משתמש
- `POST /api/permissions/grant` - מתן הרשאה
- `DELETE /api/permissions/revoke` - ביטול הרשאה
- `GET /api/permissions/available` - רשימת כל ההרשאות

## Implementation Plan

### Phase 1: Backend Infrastructure
1. ✅ Database migration
2. ✅ UserPermission model
3. ✅ Permission service
4. ✅ Phone login API
5. ✅ OTP service (SMS integration)

### Phase 2: Admin Interface
1. ✅ Users management page
2. ✅ Permissions assignment UI
3. ✅ Phone verification interface

### Phase 3: Mobile Authentication
1. ✅ Phone login screen
2. ✅ OTP verification screen
3. ✅ Permission-based UI rendering

## Security Features

1. **Rate Limiting**: מגבלת ניסיונות כניסה
2. **OTP Expiration**: קוד תקף ל-5 דקות בלבד
3. **Account Locking**: נעילת חשבון אחרי 5 ניסיונות כושלים
4. **Permission Expiry**: הרשאות עם תאריך תפוגה
5. **Audit Log**: לוג של כל שינויי הרשאות