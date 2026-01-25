# 📚 Fleet Management - מדריך תיעוד

## ברוכים הבאים למערכת ניהול צי הובלות עפר!

מסמך זה מסכם את כל התיעוד הזמין במערכת.

---

## 🎯 התחלה מהירה

### למשתמשים חדשים
1. **קרא**: [QUICK_START.md](QUICK_START.md) - התחלה מהירה (5 דקות)
2. **התחבר**: [DEMO_DATA.md](DEMO_DATA.md) - פרטי כניסה ונתוני דמו
3. **נסה**: http://localhost:3010/driver.html - אפליקציית נהג

### למפתחים
1. **קרא**: [README.md](README.md) - מבנה הפרויקט וסטטוס
2. **הגדר**: [GETTING_STARTED.md](GETTING_STARTED.md) - הוראות הרצה מפורטות
3. **פתח**: [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) - רשימת משימות

---

## 📁 רשימת קבצי תיעוד

### 🚀 הפעלה וניהול

| קובץ | תיאור | קהל יעד | זמן קריאה |
|------|--------|---------|-----------|
| [QUICK_START.md](QUICK_START.md) | מדריך התחלה מהירה + פקודות שימושיות | מפתחים | 5 דק׳ |
| [RUNNING_STATUS.md](RUNNING_STATUS.md) | מצב המערכת הנוכחי + גישה לשירותים | כולם | 3 דק׳ |
| [GETTING_STARTED.md](GETTING_STARTED.md) | הוראות התקנה מפורטות | מפתחים חדשים | 10 דק׳ |
| [README.md](README.md) | תיאור כללי + ארכיטקטורה | כולם | 5 דק׳ |

### 📊 נתונים ודמו

| קובץ | תיאור | קהל יעד |
|------|--------|---------|
| [DEMO_DATA.md](DEMO_DATA.md) | פרטי התחברות, נתוני דמו, תרחישי בדיקה | כולם |
| [DRIVER_PHONE_LOGIN.md](DRIVER_PHONE_LOGIN.md) | מערכת התחברות נהגים עם טלפון | מפתחים/QA |

### 🛠️ פיתוח

| קובץ | תיאור | קהל יעד |
|------|--------|---------|
| [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) | ⭐ משימות ושיפורים נדרשים (חשוב!) | מפתחים |
| [plan.md](plan.md) | אפיון מלא PRD בעברית | כולם |
| [BUILD_COMPLETE.md](BUILD_COMPLETE.md) | סיכום בנייה ראשונית | מפתחים |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | מדריך בדיקות | QA |

### 📋 סיכומים והדרכות

| קובץ | תיאור |
|------|--------|
| [MVP_COMPLETE.md](MVP_COMPLETE.md) | סיכום MVP |
| [I18N_UPDATE.md](I18N_UPDATE.md) | תמיכה בעברית |
| [NEW_PAGES_SUMMARY.md](NEW_PAGES_SUMMARY.md) | דפים חדשים |
| [CREATE_FORMS_SUMMARY.md](CREATE_FORMS_SUMMARY.md) | טפסים |

---

## 🎓 מסלולי למידה לפי תפקיד

### 👨‍💼 מנהל/בעלים
```
1. DEMO_DATA.md (פרטי כניסה)
2. plan.md (סעיפים 1-7: מטרה ותהליכים)
3. RUNNING_STATUS.md (מה זמין עכשיו)
4. TODO_IMPROVEMENTS.md (מה חסר)
```

### 👨‍✈️ נהג
```
1. DEMO_DATA.md → חפש את מספר הטלפון שלך
2. DRIVER_PHONE_LOGIN.md → איך להתחבר
3. פתח: http://localhost:3010/driver.html
```

### 👨‍💻 מפתח (Backend)
```
1. README.md → ארכיטקטורה
2. QUICK_START.md → פקודות Docker
3. plan.md → סעיף 8-10 (DB Schema + API)
4. TODO_IMPROVEMENTS.md → בחר Task ותתחיל!
```

### 👨‍💻 מפתח (Frontend)
```
1. README.md → מבנה frontend
2. QUICK_START.md → npm commands
3. I18N_UPDATE.md → תמיכה בעברית
4. TODO_IMPROVEMENTS.md → UI tasks
```

### 🧪 QA/Tester
```
1. DEMO_DATA.md → נתוני בדיקה
2. TESTING_GUIDE.md → תרחישי בדיקה
3. DRIVER_PHONE_LOGIN.md → איך לבדוק כניסת נהגים
4. TODO_IMPROVEMENTS.md → מה לא עובד עדיין
```

---

## 🔍 חיפוש מהיר

### "איך אני..."

| שאלה | תשובה |
|------|--------|
| איך אני מתחיל? | [QUICK_START.md](QUICK_START.md) |
| איך אני נכנס? | [DEMO_DATA.md](DEMO_DATA.md) → סעיף "משתמשים" |
| איך אני מפעיל את המערכת? | `docker-compose up -d` ([RUNNING_STATUS.md](RUNNING_STATUS.md)) |
| איך אני יוצר admin? | [QUICK_START.md](QUICK_START.md) → סעיף "הורדה והרצה ראשונית" |
| איך אני מריץ migrations? | `docker exec fleet_backend alembic upgrade head` |
| איך אני רואה logs? | `docker-compose logs -f backend` |

### "איפה..."

| שאלה | תשובה |
|------|--------|
| איפה ה-API docs? | http://localhost:8001/docs |
| איפה אפליקציית הנהג? | http://localhost:3010/driver.html |
| איפה ה-Admin? | http://localhost:3010 |
| איפה פרטי ה-DB? | [RUNNING_STATUS.md](RUNNING_STATUS.md) → "Database" |
| איפה קוד ה-Backend? | `backend/app/` |
| איפה קוד ה-Frontend? | `frontend/src/` |

### "מה..."

| שאלה | תשובה |
|------|--------|
| מה עובד? | [README.md](README.md) → "Current Status" |
| מה חסר? | [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) ⭐ |
| מה הפורטים? | Backend:8001, Frontend:3010, DB:5434, MinIO:9101 |
| מה הסיסמה של admin? | `admin123` ([DEMO_DATA.md](DEMO_DATA.md)) |
| מה הטלפונים של הנהגים? | 050-1111111, 052-2222222... ([DEMO_DATA.md](DEMO_DATA.md)) |

---

## ⭐ המסמכים החשובים ביותר

### Top 5 Must-Read

1. **[QUICK_START.md](QUICK_START.md)** 🚀  
   התחלה מהירה - תוך 5 דקות אתה רץ!

2. **[DEMO_DATA.md](DEMO_DATA.md)** 👤  
   כל פרטי הכניסה והנתונים - אי אפשר בלי!

3. **[TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md)** 📋  
   מה לפתח הלאה - חובה למפתחים!

4. **[RUNNING_STATUS.md](RUNNING_STATUS.md)** ✅  
   מה המצב עכשיו - מהיר ועדכני

5. **[plan.md](plan.md)** 📖  
   האפיון המלא - הכל פה!

---

## 🆘 בעיות נפוצות

### "המערכת לא עולה"
1. בדוק Docker: `docker ps`
2. בדוק logs: `docker-compose logs -f`
3. עצור והפעל מחדש: `docker-compose down && docker-compose up -d`

### "לא מצליח להתחבר"
1. ודא שהפורט נכון: 3010 (לא 3000)
2. בדוק credentials ב-[DEMO_DATA.md](DEMO_DATA.md)
3. Admin: אימייל | Drivers: טלפון

### "אין נתונים"
1. הרץ: `docker exec fleet_backend python /app/scripts/add_demo_data.py`
2. רענן דפדפן
3. בדוק ב-API docs: http://localhost:8001/docs

### "העלאת תמונות/חתימה לא עובדת"
זה נורמלי! ראה [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md) - הפיצ'רים האלה עדיין לא מוטמעים במלואם.

---

## 📞 תמיכה

### נושא Backend
- קרא: [plan.md](plan.md) סעיפים 8-10
- בדוק: `backend/app/api/v1/endpoints/`

### נושא Frontend
- קרא: [I18N_UPDATE.md](I18N_UPDATE.md)
- בדוק: `frontend/src/app/`

### נושא Database
- קרא: [plan.md](plan.md) סעיף 8
- בדוק: `backend/alembic/versions/`

### נושא Docker
- קרא: [RUNNING_STATUS.md](RUNNING_STATUS.md)
- בדוק: `docker-compose.yml`

---

## 🗺️ Roadmap

**MVP (✅ Done)**
- Authentication, CRUD, Driver app, Demo data

**Phase 2 (📋 Planned)**
- Photo upload
- Digital signature
- GPS map tracking
- PDF reports

**Phase 3 (🔮 Future)**
- Real-time notifications
- Subcontractor management
- Customer portal
- Advanced analytics

👉 **פרטים מלאים**: [TODO_IMPROVEMENTS.md](TODO_IMPROVEMENTS.md)

---

## 📝 כיצד להשתמש במדריך זה?

1. **התחל כאן** - קרא את המסמך הזה
2. **בחר מסלול** - לפי תפקידך (למעלה)
3. **קרא לפי הצורך** - לא חייבים הכל בבת אחת
4. **השתמש בחיפוש** - Ctrl+F למציאת מידע מהיר
5. **עדכן אותנו** - מצאת שגיאה? פתח issue!

---

**תאריך**: 25 ינואר 2026  
**גרסה**: v1.0  
**סטטוס**: 📚 מלא ומעודכן

---

**💡 טיפ**: שמור את המסמך הזה במועדפים - זה נקודת הכניסה לכל התיעוד!
