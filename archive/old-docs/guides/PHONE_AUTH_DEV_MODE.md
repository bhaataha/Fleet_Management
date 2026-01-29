# 🔐 התחברות עם טלפון - מצב פיתוח (Dev Mode)

## 📝 סיכום

הוספנו **אפשרות התחברות ישירה עם סיסמה** במקום OTP לצרכי פיתוח ובדיקות.

---

## 🎯 שיטות התחברות זמינות

### 1️⃣ התחברות עם OTP (Production Mode)

**שלב א' - שליחת OTP:**
```bash
POST /api/phone-auth/send-otp
{
  "phone": "0501234567"
}
```

**שלב ב' - אימות OTP:**
```bash
POST /api/phone-auth/verify-otp
{
  "phone": "0501234567",
  "otp_code": "123456"
}
```

---

### 2️⃣ התחברות ישירה עם סיסמה (Dev Mode) ⭐

**התחברות ישירה בשלב אחד:**
```bash
POST /api/phone-auth/login-with-password
{
  "phone": "0501234567",
  "password": "demo123"
}
```

**תגובה מוצלחת:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "name": "מנהל מערכת",
    "phone": "050-123-4567",
    "email": "manager@demo.com",
    "org_id": "...",
    "org_role": "admin"
  },
  "permissions": []
}
```

---

### 3️⃣ אימות OTP עם סיסמה (Hybrid Mode)

אפשר גם לשלוח סיסמה בשלב האימות במקום OTP:

```bash
POST /api/phone-auth/verify-otp
{
  "phone": "0501234567",
  "password": "demo123"
}
```

---

## 👥 משתמשי דמו

| שם | טלפון (UI) | טלפון (API) | סיסמה | תפקיד |
|---|---|---|---|---|
| מנהל מערכת | 050-123-4567 | 0501234567 | demo123 | admin |
| סדרן | 050-123-4568 | 0501234568 | demo123 | user |
| הנהלת חשבונות | 050-123-4569 | 0501234569 | demo123 | user |

---

## 🧪 דוגמאות שימוש

### cURL
```bash
# התחברות ישירה
curl -X POST http://localhost:8001/api/phone-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "0501234567",
    "password": "demo123"
  }'
```

### JavaScript/TypeScript
```typescript
// התחברות ישירה (ללא OTP)
const response = await fetch('http://localhost:8001/api/phone-auth/login-with-password', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    phone: '0501234567',
    password: 'demo123'
  })
});

const { access_token, user } = await response.json();
localStorage.setItem('access_token', access_token);
```

### Python
```python
import requests

# התחברות ישירה
response = requests.post(
    'http://localhost:8001/api/phone-auth/login-with-password',
    json={
        'phone': '0501234567',
        'password': 'demo123'
    }
)

data = response.json()
token = data['access_token']
```

---

## ⚙️ הגדרות

### Endpoints ציבוריים (ללא Token)
הוספנו את הנתיבים הבאים לרשימת ה-public endpoints:
- `/api/phone-auth/send-otp`
- `/api/phone-auth/verify-otp`
- `/api/phone-auth/resend-otp`
- `/api/phone-auth/login-with-password` ⭐

### סיסמה ברירת מחדל
כל משתמשי הדמו: `demo123`

---

## 🔒 Security Notes

⚠️ **חשוב:**
- `login-with-password` מיועד **לפיתוח ובדיקות בלבד**
- בייצור (Production) מומלץ להשתמש רק ב-OTP
- ניתן להוסיף environment variable כדי להפעיל/לכבות את ה-endpoint

### המלצה לייצור
```python
# בקובץ הגדרות
ENABLE_PASSWORD_LOGIN = os.getenv("ENABLE_PASSWORD_LOGIN", "false").lower() == "true"

# ב-endpoint
if not ENABLE_PASSWORD_LOGIN:
    raise HTTPException(status_code=404, detail="Password login disabled")
```

---

## 📊 Summary

✅ **הוסף**: `/api/phone-auth/login-with-password` - התחברות ישירה  
✅ **עדכן**: `/api/phone-auth/verify-otp` - תמיכה בסיסמה במקום OTP  
✅ **יצר**: 3 משתמשי דמו עם סיסמה `demo123`  
✅ **הוסף**: טבלאות `user_permissions` ו-`permissions`  

---

## 🚀 Quick Start

```bash
# התחבר מיד
curl -X POST http://localhost:8001/api/phone-auth/login-with-password \
  -H "Content-Type: application/json" \
  -d '{"phone":"0501234567","password":"demo123"}' \
  | jq -r '.access_token'
```

זהו! עכשיו אפשר להתחבר בלי לחכות ל-OTP! 🎉
