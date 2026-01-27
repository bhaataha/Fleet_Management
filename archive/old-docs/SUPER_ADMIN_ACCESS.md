# Super Admin Access - סופר אדמין

## ✅ Super Admin Created Successfully!

### 🔑 Login Credentials

```
Email:    admin@fleetmanagement.com
Password: SuperAdmin123!
```

### 🌐 Access Points

**Local Development:**
- API Endpoint: `http://localhost:8001`
- API Documentation: `http://localhost:8001/docs`
- Frontend: `http://localhost:3010`

**Production (when deployed):**
- API: `https://truckflow.site/api`
- Frontend: `https://truckflow.site`

### 📋 API Login Request

```bash
curl -X POST "http://localhost:8001/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@fleetmanagement.com",
    "password": "SuperAdmin123!"
  }'
```

### 💾 Saved Token

Access token has been saved to: `super_admin_token.txt`

You can use it in subsequent requests:
```bash
# Read token
$token = Get-Content super_admin_token.txt

# Use in API call
curl -H "Authorization: Bearer $token" http://localhost:8001/api/customers
```

### 🔐 User Details

- **User ID**: 1
- **Organization ID**: aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa (default org)
- **Is Super Admin**: True
- **Role**: super_admin
- **Status**: Active

### 📝 Super Admin Permissions

As Super Admin, you have access to:

1. **Organization Management** (`/api/super-admin/organizations`)
   - Create/view/edit/delete organizations
   - Manage organization settings
   - View organization statistics

2. **User Management** (across all organizations)
   - Create/manage users in any organization
   - Assign roles and permissions
   - Reset passwords

3. **System Configuration**
   - Global settings
   - System monitoring
   - Audit logs

4. **All Regular Features**
   - Customers, Sites, Fleet, Jobs, etc.
   - Full CRUD on all entities

### 🧪 Testing Super Admin

Run the test script:
```powershell
.\test_super_admin_login.ps1
```

Or test manually:
```powershell
# 1. Login
$login = Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" `
  -Method POST `
  -Body '{"email":"admin@fleetmanagement.com","password":"SuperAdmin123!"}' `
  -ContentType "application/json"

# 2. Get token
$token = $login.access_token

# 3. Test API call (e.g., get organizations)
Invoke-RestMethod -Uri "http://localhost:8001/api/super-admin/organizations" `
  -Headers @{Authorization = "Bearer $token"}
```

---

## 🛠️ תקלה ידועה: 422 במחיקת ארגון (DELETE)

**סימפטום:**
```
XHR DELETE http://localhost:8001/api/super-admin/organizations/<UUID>?confirm=true
HTTP/1.1 422 Unprocessable Entity
```

**סיבה:**
- בסיס הנתונים משתמש ב‑UUID ל־`organizations.id` ול־`org_id`
- ה‑API הגדיר את `org_id` כ־`int` בנתיב, ולכן FastAPI חוסם את הבקשה לפני שהקוד רץ

**פתרון כללי (מתאים לפרודקשן):**
- ליישר את ה‑backend ל‑UUID:
  - מודלים: `Organization.id` וכל שדות `org_id` כ‑UUID
  - endpoints: `org_id` כ‑UUID בכל נתיבי Super Admin
  - middleware: פענוח `org_id` מה‑JWT ל‑UUID
- לוודא שה‑DB באמת ב‑UUID (אם צריך, להריץ `backend/upgrade_organizations.sql`)

**אחרי הפריסה:** לבצע rebuild/restart ל‑backend.

---

## 🛠️ תקלה ידועה: 500 במחיקת ארגון (Share URLs)

**סימפטום:**
```
DELETE /api/super-admin/organizations/<UUID>?confirm=true
HTTP/1.1 500 Internal Server Error
```

**סיבה:**
- טבלת `share_urls` חסרה בבסיס הנתונים
- בעת מחיקת ארגון, SQLAlchemy טוען יחסים שדורשים את הטבלה

**פתרון כללי (מתאים לפרודקשן):**
1. להריץ את הסקריפט:
   - `backend/upgrade_share_urls.sql`
2. לאתחל את ה‑backend לאחר המיגרציה.

**בדיקה מהירה:**
```
\\dt share_urls
```

### 📚 Next Steps

1. **Login to Frontend**: Go to `http://localhost:3010` and login with the credentials
2. **Create First Organization**: Use Super Admin to create your first organization
3. **Create Regular Users**: Add users with specific roles (Admin, Dispatcher, Accounting, Driver)
4. **Test Features**: Start creating customers, sites, trucks, etc.

### ⚙️ Change Password (Optional)

If you want to change the default password:

```bash
# Inside backend container
docker compose exec backend python -c "
from app.core.database import SessionLocal
from app.models import User
from app.core.security import get_password_hash

db = SessionLocal()
user = db.query(User).filter(User.email=='admin@fleetmanagement.com').first()
user.password_hash = get_password_hash('YourNewPassword123!')
db.commit()
print('✅ Password updated!')
"
```

---

**Created**: 2026-01-26  
**Status**: ✅ Active and Ready
