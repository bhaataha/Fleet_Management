# TruckFlow Documentation Index

מסמכים מקיפים למערכת TruckFlow לניהול הובלות עפר.

---

## 🚀 התחלה מהירה (Setup)

קראו קודם את המסמכים האלה להתקנה והרצה:

- **[Quick Start Guide](setup/QUICK_START.md)** ⭐ התחל כאן!
  - התקנה ב-5 דקות
  - Docker Compose setup
  - גישה למערכת

- **[Getting Started](setup/GETTING_STARTED.md)**
  - הדרכה מפורטת
  - תצורת סביבה
  - Troubleshooting

- **[Demo Data & Credentials](setup/DEMO_DATA.md)**
  - משתמשי Demo
  - נתוני לדוגמה
  - פרטי התחברות

- **[Testing Guide](setup/TESTING_GUIDE.md)**
  - איך להריץ בדיקות
  - Unit + Integration tests
  - Coverage reports

---

## 📊 ניהול פרויקט (Project Management)

מעקב אחר התקדמות והמשימות הבאות:

- **[TODO & Improvements](project/TODO_IMPROVEMENTS.md)** ⭐
  - משימות ממתינות
  - תכונות לעתיד
  - סדרי עדיפויות

- **[Running Status](project/RUNNING_STATUS.md)**
  - סטטוס נוכחי של המערכת
  - תכונות פעילות
  - בעיות ידועות

- **[MVP Complete](project/MVP_COMPLETE.md)**
  - תכונות שהושלמו ב-MVP
  - Milestone achievements
  - Lessons learned

---

## ✨ תיעוד תכונות (Features)

מסמכים על תכונות ספציפיות שפותחו:

- **[Latest Updates](features/LATEST_UPDATES.md)** ⭐ חדש!
  - עדכונים אחרונים
  - Changelog מקיף
  - בדיקות שבוצעו

- **[Mobile Apps Landing Update](features/MOBILE_APPS_LANDING_UPDATE.md)** 🆕
  - עדכון דף הבית
  - קידום אפליקציות Native
  - Q2 2026 roadmap

- **[Driver Phone Login](features/DRIVER_PHONE_LOGIN.md)**
  - התחברות נהג עם מספר טלפון
  - Authentication flow
  - Security considerations

- **[Photo Upload Success](features/PHOTO_UPLOAD_SUCCESS.md)**
  - העלאת תמונות הושלמה
  - S3 integration
  - UI/UX improvements

- **[Photo Display Fix](features/PHOTO_DISPLAY_FIX.md)**
  - תיקון תצוגת תמונות
  - Presigned URLs
  - Gallery component

- **[Task 2: Photo Upload Complete](features/TASK_2_PHOTO_UPLOAD_COMPLETE.md)**
  - השלמת משימה #2
  - תיעוד טכני
  - Testing results

- **[Internationalization (i18n)](features/I18N_UPDATE.md)**
  - תמיכה ב-3 שפות (עברית, אנגלית, ערבית)
  - מערכת תרגומים
  - RTL/LTR support

- **[Create Forms Summary](features/CREATE_FORMS_SUMMARY.md)**
  - טפסי יצירה חדשים
  - Validation logic
  - UX improvements

- **[New Pages Summary](features/NEW_PAGES_SUMMARY.md)**
  - דפים שנוספו
  - Routes חדשים
  - Navigation changes

---

## 🏗️ ארכיטקטורה ואיפיון (Architecture)

תכנון ואיפיונים טכניים:

- **[Multi-Tenant Specification](architecture/MULTI_TENANT_SPEC.md)** 🆕 חדש!
  - איפיון מלא למערכת Multi-Tenant
  - Super Admin Dashboard
  - Organization management
  - Billing & Subscriptions
  - 15 פרקים מפורטים

- **[Mobile App Strategy](architecture/MOBILE_APP_STRATEGY.md)**
  - אסטרטגיית אפליקציות Native
  - React Native vs Flutter
  - Timeline ל-8 שבועות
  - Budget ₪35-45K

- **[Original PRD (plan.md)](architecture/plan.md)** 📖
  - מסמך האיפיון המקורי (עברית)
  - דרישות מלאות
  - מודל נתונים
  - User stories
  - Wireframes

---

## 📦 ארכיון (Archive)

מסמכים ישנים ולא בשימוש:

- [Build Complete](archive/BUILD_COMPLETE.md)
- [README Final](archive/README_FINAL.md)
- [DOCS_INDEX (old)](archive/DOCS_INDEX.md)
- [Documentation Summary (old)](archive/DOCUMENTATION_SUMMARY.md)

---

## 📚 מסמכים נוספים

### קבצים בשורש הפרויקט:

- **[README.md](../README.md)** - README ראשי
- **[.github/copilot-instructions.md](../.github/copilot-instructions.md)** - הנחיות ל-AI Agent

### תיקיות קוד:

- `backend/` - FastAPI backend
  - `app/api/` - API endpoints
  - `app/models/` - Database models
  - `db/` - SQL scripts
  
- `frontend/` - Next.js frontend
  - `src/app/` - Pages (App Router)
  - `src/components/` - React components
  - `src/lib/` - Utilities & stores

---

## 🔍 מפת אתר מהירה

| אם אתה...                          | קרא את...                                          |
|------------------------------------|----------------------------------------------------|
| מתחיל חדש                          | [Quick Start](setup/QUICK_START.md)                |
| צריך להתחבר למערכת                 | [Demo Data](setup/DEMO_DATA.md)                    |
| רוצה לראות מה חסר                  | [TODO](project/TODO_IMPROVEMENTS.md)               |
| רוצה להבין את המערכת                | [Original PRD](architecture/plan.md)               |
| עובד על Multi-Tenant               | [Multi-Tenant Spec](architecture/MULTI_TENANT_SPEC.md) |
| מפתח אפליקציית מובייל              | [Mobile Strategy](architecture/MOBILE_APP_STRATEGY.md) |
| רוצה לראות עדכונים אחרונים        | [Latest Updates](features/LATEST_UPDATES.md)      |

---

## 📞 תמיכה

**שאלות?** פתח Issue בגיטהאב או צור קשר:
- Email: support@truckflow.com
- GitHub: [Fleet_Management](https://github.com/bhaataha/Fleet_Management)

---

**עודכן לאחרונה**: 25 ינואר 2026  
**גרסת מסמכים**: 2.0 (מאורגן!)
