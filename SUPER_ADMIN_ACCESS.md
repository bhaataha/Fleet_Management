# 🔐 Super Admin Access Guide

## התחברות

### שלב 1: Login
```bash
POST http://localhost:8001/api/auth/login
Content-Type: application/json

{
  "email": "admin@fleetmanagement.com",
  "password": "SuperAdmin123!"
}
```

**תגובה:**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "Super Administrator",
    "email": "admin@fleetmanagement.com",
    "org_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "org_name": "Default Organization",
    "plan_type": "enterprise",
    "is_super_admin": true,
    "org_role": "super_admin"
  }
}
```

### שלב 2: שימוש ב-Token
בכל request הבא, הוסף header:
```
Authorization: Bearer {access_token}
```

---

## 📱 גישה דרך Swagger UI

1. **פתח דפדפן:**
   ```
   http://localhost:8001/docs
   ```

2. **התחבר:**
   - לחץ על כפתור 🔓 **"Authorize"** בראש הדף
   - הזן Token בפורמט: `Bearer {token}`
   - לחץ "Authorize"

3. **השתמש ב-API:**
   - גלול ל-section **"Super Admin"**
   - פתח endpoint
   - לחץ "Try it out"
   - מלא פרמטרים
   - לחץ "Execute"

---

## 💻 דוגמאות שימוש

### דוגמה 1: רשימת כל הארגונים
```bash
curl -X GET "http://localhost:8001/api/super-admin/organizations" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
}
Invoke-RestMethod -Uri "http://localhost:8001/api/super-admin/organizations" -Headers $headers
```

---

### דוגמה 2: יצירת ארגון חדש
```bash
curl -X POST "http://localhost:8001/api/super-admin/organizations" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "חברת הובלות חדשה",
    "slug": "new-transport",
    "contact_email": "admin@newtransport.com",
    "plan_type": "trial",
    "trial_days": 30,
    "max_trucks": 5,
    "max_drivers": 5
  }'
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}
$body = @{
    name = "חברת הובלות חדשה"
    slug = "new-transport"
    contact_email = "admin@newtransport.com"
    plan_type = "trial"
    trial_days = 30
    max_trucks = 5
    max_drivers = 5
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8001/api/super-admin/organizations" -Method POST -Headers $headers -Body $body
```

---

### דוגמה 3: סטטיסטיקות מערכת
```bash
curl -X GET "http://localhost:8001/api/super-admin/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**PowerShell:**
```powershell
$token = "YOUR_TOKEN"
Invoke-RestMethod -Uri "http://localhost:8001/api/super-admin/stats" -Headers @{Authorization="Bearer $token"}
```

---

### דוגמה 4: השעיית ארגון
```bash
curl -X POST "http://localhost:8001/api/super-admin/organizations/{org_id}/suspend" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "אי תשלום"
  }'
```

---

### דוגמה 5: החלפת ארגון (Impersonation)
```bash
# צפייה בנתונים של ארגון אחר
curl -X GET "http://localhost:8001/api/customers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Org-Id: {org_id_to_view}"
```

**שימוש:**
- Super Admin יכול לראות נתונים של כל ארגון
- הוסף header `X-Org-Id` עם ID של הארגון הרצוי
- כל ה-endpoints הרגילים יעבדו בהקשר של הארגון הנבחר

---

## 🧪 סקריפט בדיקה מהיר

הרץ את סקריפט הבדיקה המוכן:
```bash
python backend\test_super_admin_api.py
```

זה יריץ:
1. התחברות Super Admin
2. רשימת ארגונים
3. סטטיסטיקות מערכת
4. יצירת ארגון טסט
5. בדיקת impersonation

---

## 📋 Quick Reference Card

| פעולה | Endpoint | Method |
|-------|----------|--------|
| התחברות | `/api/auth/login` | POST |
| רשימת ארגונים | `/api/super-admin/organizations` | GET |
| יצירת ארגון | `/api/super-admin/organizations` | POST |
| פרטי ארגון | `/api/super-admin/organizations/{id}` | GET |
| עדכון ארגון | `/api/super-admin/organizations/{id}` | PATCH |
| מחיקת ארגון | `/api/super-admin/organizations/{id}?confirm=true` | DELETE |
| השעיה | `/api/super-admin/organizations/{id}/suspend` | POST |
| הפעלה | `/api/super-admin/organizations/{id}/activate` | POST |
| משתמשי ארגון | `/api/super-admin/organizations/{id}/users` | GET |
| סטטיסטיקות | `/api/super-admin/stats` | GET |

---

## 🎯 Frontend (עתידי)

**כרגע אין UI למשתמשי Super Admin**. 

בעתיד ניתן לבנות:
1. **דף ניהול ארגונים** - טבלה עם כל הארגונים + פעולות
2. **דשבורד Super Admin** - סטטיסטיקות ו-KPIs
3. **Organization Selector** - dropdown להחלפת ארגון
4. **User Management** - ניהול משתמשים לפי ארגון

**נמצא ב-Phase 3 של המימוש** (ראה NEXT_STEPS.md)

---

## 🔒 אבטחה

- ✅ רק משתמשים עם `is_super_admin=true` יכולים לגשת
- ✅ כל endpoint בודק `require_super_admin(request)`
- ✅ Token חייב להיות תקף ולכלול org_id
- ✅ Suspended orgs לא יכולים להתחבר
- ✅ Impersonation עובד רק עם Super Admin

---

**נוצר:** 2026-01-25  
**API Docs:** http://localhost:8001/docs  
**Test Script:** `python backend\test_super_admin_api.py`
