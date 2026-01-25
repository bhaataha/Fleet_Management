# מדריך בדיקות למערכת Fleet Management

## 🔐 התחברות

1. גש ל: http://localhost:3010/login
2. השתמש בפרטים:
   - **אימייל**: admin@example.com
   - **סיסמה**: admin123

## ✅ מה תוקן

### בעיה: התנתקות אחרי כל לחיצה
**גורם**: הבעיה הייתה שה-auth store לא התאתחל נכון מה-localStorage בטעינת הדף.

**תיקון**:
1. הסרנו את `zustand/persist` שגרם לבעיות SSR
2. הוספנו פונקציית `initialize()` שטוענת את ה-token וה-user מ-localStorage
3. `AuthProvider` קורא ל-`initialize()` בטעינת האפליקציה
4. מוסיף loader במהלך האתחול כדי למנוע redirect מיותר

### מה קורה עכשיו:
1. אתה מתחבר → Token נשמר ב-localStorage
2. כל רענון דף → `initialize()` טוען את ה-token
3. כל API request → Axios interceptor מוסיף את ה-token
4. אם 401 → ניקוי אוטומטי ו-redirect ל-login

## 🧪 בדיקות מומלצות

### 1️⃣ בדוק התחברות
```bash
# התחבר בדפדפן
http://localhost:3010/login

# אמור לראות redirect ל-/dashboard
```

### 2️⃣ בדוק persistence
```bash
# רענן את הדף (F5)
# אמור להישאר מחובר ולא לחזור ל-/login
```

### 3️⃣ בדוק navigation
```bash
# נווט בין דפים:
- /dashboard
- /jobs
- /jobs/new
- /customers
- /sites
- /fleet
- /trucks
- /drivers
- /materials
- /dispatch
- /reports

# בכל מעבר דף - אמור להישאר מחובר
```

### 4️⃣ בדוק API calls
```bash
# פתח DevTools (F12) → Network tab
# נווט לדף Jobs (/jobs)
# בדוק request ל-/api/jobs
# אמור לראות header:
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### 5️⃣ בדוק logout
```bash
# לחץ על כפתור יציאה (בתפריט העליון)
# אמור להתנתק ולחזור ל-/login
# localStorage אמור להתרוקן
```

## 🔍 איתור תקלות

### אם עדיין מתנתק:

**1. בדוק localStorage**
```javascript
// בקונסול של הדפדפן (F12):
localStorage.getItem('access_token')
localStorage.getItem('user')

// אמור להחזיר ערכים, לא null
```

**2. בדוק את ה-token בכל request**
```javascript
// Network tab → בחר request כלשהו
// Headers → Request Headers
// חפש: Authorization: Bearer ...
```

**3. בדוק errors בקונסול**
```javascript
// Console tab
// אמור להיות נקי מ-errors אדומים
```

**4. בדוק את הלוגים של Backend**
```bash
docker logs fleet_backend --tail 50

# אמור לראות:
# INFO:     ... GET /api/jobs
# INFO:     ... 200 OK
```

### שגיאות נפוצות:

**401 Unauthorized בכל request**
- Token לא נשלח → בדוק localStorage
- Token פג תוקף → התחבר מחדש
- Backend לא מאמת נכון → בדוק secret key

**Redirect loop (חוזר ל-login כל הזמן)**
- `isInitialized` לא true → בדוק AuthProvider
- `isAuthenticated` לא משתנה → בדוק setAuth

**"Cannot read properties of null"**
- הדף נטען לפני initialize → בדוק שיש loader

## 🎯 נתיבי הצלחה

✅ **התחברות עובדת**
- Login → Dashboard (redirect אוטומטי)
- Token נשמר ב-localStorage
- Network requests מכילים Authorization header

✅ **Persistence עובד**
- F5 → נשאר מחובר
- סגירת טאב ופתיחה מחדש → נשאר מחובר
- כל navigation → נשאר מחובר

✅ **Logout עובד**
- כפתור יציאה → חזרה ל-login
- localStorage מתרוקן
- ניסיון גישה לדף מוגן → redirect ל-login

## 📊 נתונים לבדיקה

המערכת עכשיו כוללת נתוני דוגמה:

**לקוחות**: 3 (חברה א', חברה ב', חברה ג')
**אתרים**: 5 (פרויקט 1-5)
**משאיות**: 4 (12-345-01 עד 12-345-04)
**נהגים**: 7 (יוסי, משה, דוד, אבי, רון, שלומי, עמית)
**נסיעות**: 5 (סטטוסים שונים: PLANNED, ASSIGNED, LOADED, DELIVERED)

## 🚀 צעדים הבאים

לאחר שאימתת שה-auth עובד, תוכל להמשיך עם:
1. ✅ יצירת נסיעה חדשה (/jobs/new)
2. ✅ שינוי סטטוס נסיעה (/jobs/[id])
3. ⏳ אפליקציית נהג (PWA)
4. ⏳ העלאת קבצים וחתימות
5. ⏳ יצירת חשבוניות וסיכומים

---

**תאריך עדכון**: 25/01/2026
**גרסה**: MVP 1.0
