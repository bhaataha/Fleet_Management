# 📱 מדריך התחברות עם מספר טלפון - Fleet Management System

## ✅ המערכת כבר תומכת במלואה בהתחברות עם מספר טלפון!

---

## 🎯 3 שיטות התחברות נתמכות

### 1️⃣ התחברות עם טלפון + סיסמה (מומלץ לפיתוח)
**Endpoint**: `POST /api/phone-auth/login-with-password`

```bash
curl -X POST http://64.176.173.36:8001/api/phone-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0507771111",
    "password": "demo123",
    "org_slug": "default"
  }'
```

**תשובה**:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 3,
    "name": "נהג דמו",
    "phone": "0507771111",
    "email": null,
    "org_id": "1",
    "org_name": "Default Organization",
    "org_slug": "default",
    "org_role": "driver",
    "is_super_admin": false,
    "driver_id": 1
  },
  "permissions": [
    "view_jobs",
    "update_job_status",
    "upload_files"
  ]
}
```

---

### 2️⃣ התחברות עם טלפון + OTP (ייצור)
**שלב א'**: שליחת קוד OTP
```bash
curl -X POST http://64.176.173.36:8001/api/phone-auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0507771111",
    "org_slug": "default"
  }'
```

**תשובה**:
```json
{
  "success": true,
  "message": "קוד אימות נשלח ל-0507771111",
  "otp_sent": true,
  "expires_in_minutes": 5
}
```

**שלב ב'**: אימות קוד OTP
```bash
curl -X POST http://64.176.173.36:8001/api/phone-auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0507771111",
    "otp_code": "123456",
    "org_slug": "default"
  }'
```

---

### 3️⃣ התחברות עם אימייל + סיסמה (למנהלים)
**Endpoint**: `POST /api/auth/login`

```bash
curl -X POST http://64.176.173.36:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@truckflow.com",
    "password": "changeme123"
  }'
```

---

## 🖥️ ממשק המשתמש (Frontend)

### מסך ההתחברות תומך ב-2 מצבים:

#### מצב 1: טלפון + סיסמה 🔑
1. משתמש מזין מספר טלפון (לדוגמה: 0507771111)
2. משתמש מזין סיסמה
3. לחיצה על "התחבר" → נכנס מיידית

#### מצב 2: טלפון + SMS 📱
1. משתמש מזין מספר טלפון
2. לחיצה על "שלח קוד" → קוד נשלח ב-SMS
3. משתמש מזין את הקוד שהתקבל
4. לחיצה על "אמת קוד" → נכנס למערכת

**החלפה בין מצבים**: לחצן toggle בראש הטופס

---

## 🔧 הגדרות בקוד

### Backend - Model של User
```python
# backend/app/models/__init__.py
class User(Base):
    id = Column(Integer, primary_key=True)
    org_id = Column(UUID, ForeignKey("organizations.id"))
    email = Column(String(255), nullable=True)  # ✅ אופציונלי!
    phone = Column(String(20), index=True)      # ✅ חובה לנהגים
    name = Column(String(255), nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    org_role = Column(String(50), default='user')
```

### Backend - Logic של התחברות
```python
# backend/app/api/v1/endpoints/auth.py
@router.post("/login")
async def login(credentials: LoginRequest, db: Session):
    user = None
    
    # התחברות עם אימייל או טלפון
    if credentials.email:
        user = db.query(User).filter(User.email == credentials.email).first()
    elif credentials.phone:
        # חיפוש נהג לפי טלפון
        driver = db.query(Driver).filter(Driver.phone == credentials.phone).first()
        if driver and driver.user_id:
            user = db.query(User).filter(User.id == driver.user_id).first()
    
    # בדיקת סיסמה
    if not verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Incorrect credentials")
    
    # יצירת JWT token
    access_token = create_access_token_for_user(user)
    return {"access_token": access_token, "user": {...}}
```

---

## 📋 תרחישים נפוצים

### תרחיש 1: נהג מתחבר בפעם הראשונה
1. **נהג נוצר ע"י מנהל**:
   ```sql
   -- Create user
   INSERT INTO users (org_id, name, phone, password_hash, org_role)
   VALUES (1, 'יוסי כהן', '0507771111', '$2b$12$...', 'driver');
   
   -- Create driver profile
   INSERT INTO drivers (org_id, user_id, name, phone)
   VALUES (1, 10, 'יוסי כהן', '0507771111');
   ```

2. **נהג מתחבר**:
   - טלפון: 0507771111
   - סיסמה: demo123 (או קוד SMS)
   - ✅ נכנס למערכת!

---

### תרחיש 2: מנהל מתחבר
1. **יצירת מנהל** (בשלב Setup):
   ```sql
   INSERT INTO users (org_id, name, email, phone, password_hash, org_role)
   VALUES (1, 'מנהל מערכת', 'admin@company.com', '0501234567', 
           '$2b$12$...', 'admin');
   ```

2. **מנהל יכול להתחבר עם**:
   - אימייל + סיסמה ✅
   - טלפון + סיסמה ✅
   - טלפון + SMS ✅

---

### תרחיש 3: התחברות עם OTP (Production)
```javascript
// Frontend - send OTP
const response = await phoneAuthApi.sendOTP({ 
  phone: '0507771111',
  org_slug: 'demo' 
});

// User receives SMS with code: 123456

// Frontend - verify OTP
const loginResponse = await phoneAuthApi.verifyOTP({ 
  phone: '0507771111',
  otp_code: '123456',
  org_slug: 'demo' 
});

// Save token
localStorage.setItem('access_token', loginResponse.data.access_token);
```

---

## 🧪 בדיקות

### בדיקה 1: התחברות נהג בשרת הייצור
```bash
# התחברות עם טלפון + סיסמה
curl -X POST http://64.176.173.36:8001/api/phone-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0507771111",
    "password": "demo123",
    "org_slug": "default"
  }' | jq
```

### בדיקה 2: התחברות מנהל
```bash
curl -X POST http://64.176.173.36:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@truckflow.com",
    "password": "changeme123"
  }' | jq
```

### בדיקה 3: בדיקת Token
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://64.176.173.36:8001/api/auth/me \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🔐 אבטחה

### 1. סיסמאות
- **Hash**: bcrypt עם 12 rounds
- **אחסון**: רק hash (לא סיסמה גלויה)
- **אימות**: `verify_password()` בכל login

### 2. JWT Tokens
- **Algorithm**: HS256
- **Expiry**: 30 ימים (ניתן לשינוי ב-`settings.py`)
- **Payload**:
  ```json
  {
    "sub": "2",
    "email": "admin@truckflow.com",
    "org_id": "1",
    "is_super_admin": true,
    "org_role": "owner",
    "exp": 1770145005
  }
  ```

### 3. OTP Security
- **Expiry**: 5 דקות
- **Attempts**: מוגבל ל-3 ניסיונות
- **Delivery**: SMS (דרך ספק חיצוני)
- **Storage**: `phone_otp` table עם timestamps

---

## 📱 ממשק נהגים (Mobile PWA)

### דף התחברות לנהגים
**URL**: http://64.176.173.36:3010/login

**תכונות**:
- ✅ ממשק מותאם למובייל
- ✅ כפתור toggle בין סיסמה/SMS
- ✅ אוטומטי לשמירת token
- ✅ ניתוב אוטומטי ל-dashboard
- ✅ תמיכה ב-RTL (עברית)
- ✅ תמיכה ב-3 שפות (עברית, אנגלית, ערבית)

---

## 🆕 יצירת נהג חדש

### דרך Super Admin Panel
1. היכנס ל-http://64.176.173.36:3010/super-admin
2. בחר ארגון → Users
3. לחץ "Add User"
4. מלא פרטים:
   - **Name**: שם הנהג
   - **Phone**: מספר טלפון (חובה!)
   - **Email**: אופציונלי
   - **Password**: סיסמה זמנית
   - **Role**: DRIVER
5. שמור → משתמש + נהג נוצרים אוטומטית

### דרך API
```bash
curl -X POST http://64.176.173.36:8001/api/drivers \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "דני לוי",
    "phone": "0509998888",
    "license_type": "C",
    "password": "driver123"
  }'
```

---

## 🔄 Flow מלא של התחברות

```
┌─────────────────────────────────────────────────────────┐
│  1. נהג פותח: http://64.176.173.36:3010/login          │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│  2. בוחר מצב: טלפון + סיסמה / טלפון + SMS             │
└────────────────────────┬────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │ מצב סיסמה    │          │ מצב SMS      │
    └──────┬───────┘          └──────┬───────┘
           │                           │
           ▼                           ▼
    ┌──────────────┐          ┌──────────────┐
    │ POST /phone- │          │ POST /phone- │
    │ auth/login-  │          │ auth/send-   │
    │ with-password│          │ otp          │
    └──────┬───────┘          └──────┬───────┘
           │                           │
           │                           ▼
           │                  ┌──────────────┐
           │                  │ קוד נשלח ב-  │
           │                  │ SMS          │
           │                  └──────┬───────┘
           │                           │
           │                           ▼
           │                  ┌──────────────┐
           │                  │ משתמש מזין   │
           │                  │ קוד          │
           │                  └──────┬───────┘
           │                           │
           │                           ▼
           │                  ┌──────────────┐
           │                  │ POST /phone- │
           │                  │ auth/verify- │
           │                  │ otp          │
           │                  └──────┬───────┘
           │                           │
           └───────────────┬───────────┘
                           │
                           ▼
           ┌───────────────────────────┐
           │  JWT Token מוחזר          │
           └───────────┬───────────────┘
                       │
                       ▼
           ┌───────────────────────────┐
           │  שמירה ב-localStorage     │
           │  + Zustand store          │
           └───────────┬───────────────┘
                       │
                       ▼
           ┌───────────────────────────┐
           │  ניתוב ל-/dashboard       │
           └───────────────────────────┘
```

---

## ⚙️ הגדרות

### Backend Settings
```python
# backend/app/core/config.py
class Settings(BaseSettings):
    JWT_SECRET_KEY: str = "your-secret-key"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200  # 30 days
    
    # OTP Settings
    OTP_EXPIRE_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 3
    
    # SMS Provider (Twilio / etc.)
    SMS_PROVIDER: str = "twilio"
    TWILIO_ACCOUNT_SID: str = "..."
    TWILIO_AUTH_TOKEN: str = "..."
    TWILIO_PHONE_NUMBER: str = "+972..."
```

### Frontend API Configuration
```typescript
// frontend/src/lib/api.ts
export const phoneAuthApi = {
  sendOTP: (data: { phone: string; org_slug?: string }) =>
    api.post<PhoneAuthResponse>('/phone-auth/send-otp', data),
    
  verifyOTP: (data: { phone: string; otp_code: string; org_slug?: string }) =>
    api.post<PhoneAuthResponse>('/phone-auth/verify-otp', data),
    
  resendOTP: (data: { phone: string; org_slug?: string }) =>
    api.post<PhoneAuthResponse>('/phone-auth/resend-otp', data),
    
  loginWithPassword: (data: { phone: string; password: string; org_slug?: string }) =>
    api.post<LoginResponse>('/phone-auth/login-with-password', data),
}
```

---

## 📊 סטטיסטיקות

### משתמשים במערכת
```sql
-- כמות משתמשים לפי סוג התחברות
SELECT 
  CASE 
    WHEN email IS NOT NULL AND phone IS NOT NULL THEN 'Both'
    WHEN email IS NOT NULL THEN 'Email Only'
    WHEN phone IS NOT NULL THEN 'Phone Only'
  END as login_type,
  COUNT(*) as count
FROM users
WHERE org_id = 1
GROUP BY login_type;

-- תוצאה לדוגמה:
-- login_type  | count
-- ------------|------
-- Both        | 5
-- Email Only  | 2
-- Phone Only  | 15    ← רוב הנהגים
```

---

## 🐛 Troubleshooting

### בעיה: "User not found with this phone number"
**פתרון**:
```sql
-- בדוק אם המשתמש קיים
SELECT u.id, u.name, u.phone, d.id as driver_id
FROM users u
LEFT JOIN drivers d ON d.user_id = u.id
WHERE u.phone = '0507771111';

-- אם לא קיים, צור:
INSERT INTO users (org_id, name, phone, password_hash, org_role)
VALUES (1, 'נהג חדש', '0507771111', 
        '$2b$12$...', 'driver');
```

### בעיה: "Invalid password"
**פתרון**:
```bash
# Reset password דרך Python
docker exec -it fleet_backend_prod python -c "
from app.core.security import get_password_hash
print(get_password_hash('newpassword123'))
"

# Update בDB:
docker exec fleet_db_prod psql -U fleet_user -d fleet_management -c \
  "UPDATE users SET password_hash = '$2b$12$...' WHERE phone = '0507771111';"
```

### בעיה: Token expired
**פתרון**: התחבר מחדש. Token תקף ל-30 יום (ניתן לשינוי).

---

## 📚 קבצים רלוונטיים

### Backend
- `backend/app/api/v1/endpoints/auth.py` - התחברות אימייל/טלפון
- `backend/app/api/v1/endpoints/phone_auth.py` - OTP + סיסמה לטלפון
- `backend/app/models/__init__.py` - User model
- `backend/app/core/security.py` - Password hashing + JWT
- `backend/app/services/permission_service.py` - OTP logic

### Frontend
- `frontend/src/app/login/page.tsx` - דף התחברות
- `frontend/src/lib/api.ts` - API client
- `frontend/src/lib/stores/auth.ts` - Auth state management

---

## ✅ סיכום

**המערכת תומכת במלואה בהתחברות עם מספר טלפון!**

✅ נהגים יכולים להתחבר עם טלפון + סיסמה  
✅ נהגים יכולים להתחבר עם טלפון + SMS  
✅ מנהלים יכולים להתחבר עם אימייל או טלפון  
✅ ממשק נוח ומותאם למובייל  
✅ תמיכה בעברית/אנגלית/ערבית  
✅ אבטחה מלאה (JWT + bcrypt + OTP)  

**הכל מוכן ועובד בשרת הייצור!** 🚀

---

**לבדיקה מהירה**:
```bash
# התחברות בדמו
curl -X POST http://64.176.173.36:8001/api/phone-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"0507771111","password":"demo123","org_slug":"default"}'
```

**או גש לדפדפן**: http://64.176.173.36:3010/login

---

*עודכן לאחרונה: 2026-01-28*
