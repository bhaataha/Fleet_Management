# מדריך תיעוד - Fleet Management System

## 📚 מבנה התיעוד

התיעוד מאורגן בתיקיות לפי קטגוריות:

```
docs/
├── setup/              # מדריכי התקנה והגדרה
├── architecture/       # תכנון ואדריכלות
├── features/          # תיעוד תכונות
├── phases/            # שלבי פיתוח
└── troubleshooting/   # פתרון בעיות
```

---

## 🚀 התחלה מהירה

### למשתמש חדש
1. [מדריך התחלה מהיר](setup/QUICK_START.md) - התקנה ב-5 דקות
2. [מדריך התקנה מפורט](setup/GETTING_STARTED.md) - הסבר שלב-אחר-שלב
3. [נתוני דוגמה](setup/DEMO_DATA.md) - טעינת נתונים לבדיקה

### למפתח
1. [מבנה הפרויקט](STRUCTURE.md) - סקירת קוד ותיקיות
2. [PRD מלא](architecture/plan.md) - תכנון מפורט של המערכת
3. [מדריך בדיקות](setup/TESTING_GUIDE.md) - כיצד לבדוק את המערכת

---

## 📖 תיעוד לפי קטגוריה

### 🛠️ Setup & Installation
| מסמך | תיאור |
|------|--------|
| [QUICK_START.md](setup/QUICK_START.md) | התקנה מהירה ב-5 דקות |
| [GETTING_STARTED.md](setup/GETTING_STARTED.md) | מדריך התקנה מפורט |
| [DEMO_DATA.md](setup/DEMO_DATA.md) | טעינת נתוני דוגמה |
| [TESTING_GUIDE.md](setup/TESTING_GUIDE.md) | מדריך בדיקות |

### 🏗️ Architecture & Planning
| מסמך | תיאור |
|------|--------|
| [plan.md](architecture/plan.md) | PRD מלא - תכנון מפורט של כל המערכת |
| [STRUCTURE.md](STRUCTURE.md) | מבנה קוד ותיקיות |

### ⭐ Features
| מסמך | תיאור |
|------|--------|
| [SUPER_ADMIN_UI_GUIDE.md](features/SUPER_ADMIN_UI_GUIDE.md) | מדריך משתמש Super Admin |
| [SUPER_ADMIN_UI_COMPLETE.md](features/SUPER_ADMIN_UI_COMPLETE.md) | תיעוד טכני Super Admin |
| [EDIT_ORGANIZATION_FEATURE.md](features/EDIT_ORGANIZATION_FEATURE.md) | עריכת ארגונים |
| [SUPER_ADMIN_ACCESS.md](features/SUPER_ADMIN_ACCESS.md) | הרשאות גישה |
| [SUPER_ADMIN_COMPLETE.md](features/SUPER_ADMIN_COMPLETE.md) | סיכום תכונת Super Admin |

### 📊 Development Phases
| מסמך | תיאור |
|------|--------|
| [PHASE_1_COMPLETE.md](phases/PHASE_1_COMPLETE.md) | Phase 1 - Multi-Tenant DB |
| [MULTI_TENANT_STATUS.md](phases/MULTI_TENANT_STATUS.md) | סטטוס Multi-Tenant |
| [MULTI_TENANT_README.md](phases/MULTI_TENANT_README.md) | תיעוד Multi-Tenant |

### 🔧 Troubleshooting
| מסמך | תיאור |
|------|--------|
| [SW_CORS_FIX.md](troubleshooting/SW_CORS_FIX.md) | תיקון שגיאות CORS Service Worker |
| [DATABASE_VERIFICATION.md](troubleshooting/DATABASE_VERIFICATION.md) | אימות מסד נתונים |

---

## 🎯 מסלולי קריאה מומלצים

### אני רוצה להתקין את המערכת
```
1. QUICK_START.md       → התקנה מהירה
2. DEMO_DATA.md         → נתוני דוגמה
3. SUPER_ADMIN_UI_GUIDE.md → איך להשתמש
```

### אני רוצה להבין את המערכת
```
1. plan.md              → מה המערכת עושה
2. STRUCTURE.md         → איך הקוד מאורגן
3. SUPER_ADMIN_UI_COMPLETE.md → איך זה בנוי
```

### אני רוצה לפתח תכונה חדשה
```
1. STRUCTURE.md         → מבנה הקוד
2. plan.md              → כללי עסקיים
3. PHASE_1_COMPLETE.md  → מה כבר קיים
```

### יש לי בעיה
```
1. SW_CORS_FIX.md       → בעיות CORS
2. DATABASE_VERIFICATION.md → בעיות DB
3. TESTING_GUIDE.md     → איך לבדוק שהכל עובד
```

---

## 🔍 חיפוש מהיר

### Super Admin
- **מדריך משתמש:** [SUPER_ADMIN_UI_GUIDE.md](features/SUPER_ADMIN_UI_GUIDE.md)
- **תיעוד טכני:** [SUPER_ADMIN_UI_COMPLETE.md](features/SUPER_ADMIN_UI_COMPLETE.md)
- **עריכת ארגון:** [EDIT_ORGANIZATION_FEATURE.md](features/EDIT_ORGANIZATION_FEATURE.md)

### Multi-Tenant
- **Phase 1:** [PHASE_1_COMPLETE.md](phases/PHASE_1_COMPLETE.md)
- **Status:** [MULTI_TENANT_STATUS.md](phases/MULTI_TENANT_STATUS.md)
- **README:** [MULTI_TENANT_README.md](phases/MULTI_TENANT_README.md)

### בעיות נפוצות
- **CORS Errors:** [SW_CORS_FIX.md](troubleshooting/SW_CORS_FIX.md)
- **Database Issues:** [DATABASE_VERIFICATION.md](troubleshooting/DATABASE_VERIFICATION.md)

---

## 📝 הוספת תיעוד חדש

כאשר מוסיפים תיעוד חדש:

1. **בחר קטגוריה:** setup / architecture / features / phases / troubleshooting
2. **צור קובץ MD** בתיקייה המתאימה
3. **עדכן את INDEX.md** (הקובץ הזה)
4. **הוסף קישור ב-README.md** הראשי

### תבנית לקובץ תיעוד חדש
```markdown
# [שם התכונה/נושא]

## סקירה
[מה זה עושה]

## דרישות מקדימות
[מה צריך לפני]

## שלבים
[הסבר שלב-אחר-שלב]

## דוגמאות
[קוד/צילומי מסך]

## שאלות נפוצות
[FAQ]

## ראה גם
[קישורים למסמכים קשורים]
```

---

## 🔄 עדכון אחרון

**תאריך:** 25 ינואר 2026  
**שינויים אחרונים:**
- ארגון מחדש של כל קבצי ה-MD לתיקיות
- יצירת README מרכזי מעודכן
- הוספת INDEX למדריך התיעוד
- מיזוג מסמכים כפולים

---

## 💡 טיפים

- **חיפוש:** השתמש ב-Ctrl+F בקובץ הזה כדי למצוא נושא
- **ניווט:** כל הקישורים יחסיים - עובדים ב-GitHub וב-VS Code
- **עדכונים:** תיעוד מתעדכן בזמן אמת עם הפיתוח

---

**עבור למדריך הראשי:** [../README.md](../README.md)
