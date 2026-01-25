# 📱 עדכון: התחברות נהגים עם מספר טלפון

## ✅ השינוי בוצע בהצלחה!

### מה שונה?

נהגים עכשיו נכנסים לאפליקציה **עם מספר הטלפון שלהם** במקום אימייל.

---

## 🔐 שיטות התחברות

### נהגים (Drivers)
- **מזהה**: מספר טלפון (לדוגמה: `050-1111111`)
- **סיסמה**: `driver123`
- **אפליקציה**: http://localhost:3010/driver.html

### מנהלים/משרד (Admin/Accounting/Dispatch)
- **מזהה**: אימייל (לדוגמה: `admin@fleet.com`)
- **סיסמה**: סיסמה אישית
- **אפליקציה**: http://localhost:3010

---

## 👨‍✈️ נהגים - פרטי כניסה

| שם נהג | מספר טלפון | סיסמה |
|--------|-----------|-------|
| משה כהן | `050-1111111` | `driver123` |
| דוד לוי | `052-2222222` | `driver123` |
| יוסי אברהם | `053-3333333` | `driver123` |
| אבי שמש | `054-4444444` | `driver123` |
| רוני ברק | `055-5555555` | `driver123` |

---

## 🧪 בדיקת המערכת

### בדיקה 1: כניסה כנהג
```
1. פתח בדפדפן: http://localhost:3010/driver.html
2. כשמתבקש "מספר טלפון", הקלד: 050-1111111
3. כשמתבקש "סיסמה", הקלד: driver123
4. ✅ אמור להיכנס בהצלחה ולראות את המשימות של משה כהן
```

### בדיקה 2: כניסה כנהג אחר
```
1. פתח טאב חדש (או נקה localStorage)
2. כניסה עם: 052-2222222 / driver123
3. ✅ אמור להיכנס בהצלחה ולראות את המשימות של דוד לוי
```

### בדיקה 3: כניסה כאדמין (Web Admin)
```
1. פתח: http://localhost:3010
2. כניסה עם: admin@fleet.com / admin123
3. ✅ אמור להיכנס בהצלחה למערכת הניהול
```

---

## 🔧 שינויים טכניים שבוצעו

### Backend (API)
**קובץ**: `backend/app/api/v1/endpoints/auth.py`

1. ✅ עדכון מודל `LoginRequest` לתמוך ב-`phone` (אופציונלי)
2. ✅ לוגיקת התחברות משודרגת:
   - אם יש `email` → חיפוש לפי אימייל
   - אם יש `phone` → חיפוש נהג לפי טלפון, ואז משתמש
3. ✅ תמיכה במקביל: נהגים עם טלפון + מנהלים עם אימייל

### Frontend (Driver App)
**קובץ**: `frontend/public/driver.html`

1. ✅ שינוי prompt מ-"אימייל" ל-"מספר טלפון"
2. ✅ שליחת `phone` במקום `email` ל-API
3. ✅ טיפול משופר בשגיאות התחברות

### Documentation
1. ✅ עדכון `DEMO_DATA.md` - כל הפרטים עם מספרי טלפון
2. ✅ יצירת `DRIVER_PHONE_LOGIN.md` - מדריך השינוי

---

## 🎯 יתרונות השינוי

1. **נוח לנהגים**: לא צריך לזכור אימייל, רק טלפון
2. **טבעי יותר**: נהגים זוכרים את מספר הטלפון שלהם
3. **פשוט**: פחות סיכוי לטעות בהקלדה
4. **גמיש**: המערכת תומכת גם באימייל (למנהלים)

---

## 📝 הערות חשובות

- ✅ Admin ומשתמשי משרד ממשיכים להתחבר עם אימייל
- ✅ רק נהגים יכולים להתחבר עם מספר טלפון
- ✅ מספר הטלפון חייב להיות **בדיוק** כמו ב-DB (כולל מקפים)
- ⚠️ אם נהג לא מצליח להיכנס - בדוק שמספר הטלפון שלו ב-DB תואם

---

## 🔄 API Examples

### התחברות עם טלפון (נהג)
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "050-1111111", "password": "driver123"}'
```

### התחברות עם אימייל (אדמין)
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@fleet.com", "password": "admin123"}'
```

### PowerShell
```powershell
# נהג
$body = @{phone="050-1111111"; password="driver123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" -Method POST -ContentType "application/json" -Body $body

# אדמין
$body = @{email="admin@fleet.com"; password="admin123"} | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8001/api/auth/login" -Method POST -ContentType "application/json" -Body $body
```

---

## ✅ סטטוס

- **Backend**: ✅ מעודכן ופועל
- **Frontend**: ✅ מעודכן
- **Database**: ✅ תואם (אין צורך במיגרציה)
- **Documentation**: ✅ מעודכן

**תאריך**: 25 ינואר 2026  
**גרסה**: v1.1  
**נבדק**: ✅ פועל בהצלחה
