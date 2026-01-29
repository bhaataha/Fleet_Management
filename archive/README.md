# 📁 ארכיון - קבצים ישנים

**תאריך יצירה:** 27/01/2026  
**עדכון אחרון:** 29/01/2026 - ארגון מחדש ועדכון מבנה

תיקייה זו מכילה קבצים ישנים שהועברו לארכיון במסגרת ארגון הפרויקט.

---

## 📂 מבנה הארכיון המעודכן

```
archive/
├── old-docs/                      ← קבצי תיעוד ישנים
│   ├── guides/                   ← מדריכים ישנים שהועברו מהשורש
│   ├── README_OLD.md            ← README ישן (הוחלף ב-README_NEW)
│   └── DEPLOYMENT_*.md          ← דוחות deployment היסטוריים
├── old-tests/                     ← קבצי בדיקה ישנים
│   └── root-tests/               ← בדיקות שהיו בשורש (test_*.py, test_*.html)
├── old-deployment/                ← קבצי deployment ישנים
├── old-sql-scripts/               ← סקריפטי SQL ומיגרציה ישנים
│   ├── fix_uuid_to_int.py
│   ├── demo_seed.py
│   └── reset_alembic.sql
└── Fleet_Management.zip           ← גיבוי ZIP ישן
```

---

## 📄 קבצי תיעוד ישנים (old-docs/)

### מדריכים שהועברו מהשורש (guides/)
| קובץ | תיאור |
|------|-------|
| `EMAIL_LOGIN_GUIDE.md` | מדריך התחברות באימייל |
| `PHONE_AUTH_DEV_MODE.md` | מצב פיתוח לאימות טלפוני |
| `PHONE_LOGIN_GUIDE.md` | מדריך התחברות בטלפון |
| `SUB_NAVIGATION_FEATURE.md` | תיעוד ניווט משני |
| `VEHICLE_TYPES_GUIDE.md` | מדריך סוגי רכבים |
| `VEHICLE_TYPES_SUMMARY.md` | סיכום סוגי רכבים |
| `UNIFIED_SYSTEM_PROPOSAL.md` | הצעה למערכת מאוחדת |
| `SYSTEM_ANALYSIS_REPORT.md` | דוח ניתוח מערכת |

### קבצי מצב deployment
| קובץ | תיאור |
|------|-------|
| `DEPLOYMENT_STATUS.md` | סטטוס deployment |
| `DEPLOYMENT_SUCCESS.md` | דוח הצלחת deployment |
| `DEPLOYMENT_SUMMARY.md` | סיכום deployment |
| `README_OLD.md` | README קודם (הוחלף ב-README_NEW) |

### תיעוד ישן נוסף (ללא שינוי)

| קובץ | תיאור | תאריך |
|------|-------|-------|
| `DATE_FORMAT_UPDATE.md` | תיעוד שינוי פורמט תאריכים | - |
| `FORM_DEBUGGING_GUIDE.md` | מדריך debug לטפסים | - |
| `JOB_DATE_FIX.md` | תיקון תאריכים בנסיעות | - |
| `JOB_EDIT_FIX.md` | תיקון עריכת נסיעות | - |
| `JOB_SAVE_FIX.md` | תיקון שמירת נסיעות | - |
| `MANUAL_PRICING_UPDATE.md` | עדכון מחירון ידני | - |
| `SUBCONTRACTOR_PRICES_PAGE.md` | עמוד מחירי קבלנים | - |
| `SUPER_ADMIN_ACCESS.md` | גישת super admin | - |

---

## 🧪 קבצי בדיקה ישנים (old-tests/)

### בדיקות שהועברו מהשורש (root-tests/)
| קובץ | תיאור | סוג |
|------|-------|-----|
| `test_alerts_api.html` | בדיקת API התראות | HTML |
| `test_cors_fix.html` | בדיקת תיקון CORS | HTML |
| `test_full_otp_flow.py` | בדיקת זרימת OTP מלאה | Python |
| `test_login_api.py` | בדיקת API login | Python |
| `test_login_correct.py` | בדיקת login נכון | Python |
| `test_login_fixed.html` | בדיקת login מתוקן | HTML |
| `test_otp_final.py` | בדיקת OTP סופית | Python |
| `test_otp_verify.py` | בדיקת אימות OTP | Python |
| `test_phone_auth.html` | בדיקת אימות טלפוני | HTML |
| `test_phone_login.html` | בדיקת login טלפוני | HTML |
| `test_super_admin_alerts.py` | בדיקת התראות super admin | Python |
| `test_vehicle_types.html` | בדיקת סוגי רכבים | HTML |
| `login_test.json` | נתוני בדיקה ל-login | JSON |

### בדיקות ישנות נוספות (ללא שינוי)

| קובץ | תיאור | סוג |
|------|-------|-----|
| `test_api_connection.html` | בדיקת חיבור API | HTML |
| `test_login.html` | בדיקת login | HTML |
| `test_local_api.ps1` | בדיקת API מקומי | PowerShell |
| `test_super_admin_login.ps1` | בדיקת super admin | PowerShell |

---

## �️ סקריפטי SQL ומיגרציה ישנים (old-sql-scripts/)

| קובץ | תיאור |
|------|-------|
| `fix_uuid_to_int.py` | סקריפט המרה מ-UUID ל-Integer (org_id) |
| `demo_seed.py` | סקריפט seed נתוני דמו (מהשורש) |
| `reset_alembic.sql` | איפוס Alembic migrations |

**הערה:** סקריפטי SQL ומיגרציה פעילים נמצאים ב:
- `/backend/alembic/versions/` - מיגרציות פעילות
- `/backend/scripts/` - סקריפטי עזר פעילים

---

## �🚀 קבצי Deployment ישנים (old-deployment/)

| קובץ | תיאור | הערות |
|------|-------|-------|
| `docker-compose.prod.yml` | Docker Compose production (גרסה ישנה) | הוחלף ב-`docker-compose.production.yml` |
| `watch-deploy.ps1` | סקריפט deploy אוטומטי | - |

---

## 🗄️ Backend Archive

**מיקום:** `backend/archive/old-migrations/`

### SQL Scripts ישנים

- `convert_all_org_ids_to_uuid.sql` - המרת org_id ל-UUID
- `fix_all_tables.sql` - תיקוני טבלאות
- `fix_missing_org_id.sql` - תיקון org_id חסרים
- `fix_organizations.sql` - תיקון טבלת organizations
- `fix_users_org_id.sql` - תיקון org_id במשתמשים
- `init_multi_tenant.sql` - אתחול multi-tenant
- `upgrade_organizations.sql` - שדרוג organizations
- `upgrade_share_urls.sql` - שדרוג share_urls

### Python Scripts ישנים

- `fix_db.py` - תיקון DB
- `fix_uuid_to_integer.py` - המרת UUID לinteger
- `migrate_site_type.py` - מיגרציית site_type
- `quick_check_org_id.py` - בדיקת org_id
- `test_models.py` - בדיקת models
- `test_multi_tenant_isolation.py` - בדיקת tenant isolation
- `test_super_admin_api.py` - בדיקת super admin API
- `verify_multi_tenant.py` - אימות multi-tenant

---

## ⚠️ הערות חשובות

1. **אל תמחק** - קבצים אלו עשויים להיות שימושיים להפניה עתידית
2. **לא בשימוש** - כל הקבצים כאן אינם בשימוש פעיל במערכת
3. **מיגרציות** - המיגרציות הרשמיות נמצאות ב-`backend/alembic/versions/`
4. **גיבויים** - גיבויים אוטומטיים נמצאים ב-`backups/`

---

## � מיקומים פעילים חדשים

לאחר ארגון מחדש (29/01/2026), הקבצים הפעילים נמצאים ב:

- **סקריפטים** → `/scripts/` - סקריפטי deployment ועזר
- **בדיקות** → הועברו לארכיון (לא בשימוש פעיל)
- **תיעוד** → `/docs/` - כל התיעוד הפעיל
- **Backend Scripts** → `/backend/scripts/` - סקריפטי Python לניהול המערכת

---

**תאריך יצירה:** 27/01/2026  
**עדכון אחרון:** 29/01/2026 - ארגון מחדש של הפרויקט
