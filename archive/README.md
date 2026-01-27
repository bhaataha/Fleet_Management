# 📁 ארכיון - קבצים ישנים

**תאריך יצירה:** 27/01/2026

תיקייה זו מכילה קבצים ישנים שהועברו לארכיון במסגרת ארגון הפרויקט.

---

## 📂 מבנה הארכיון

```
archive/
├── old-docs/              ← קבצי תיעוד ישנים (MD)
├── old-tests/             ← קבצי בדיקה ישנים (HTML, PS1)
├── old-deployment/        ← קבצי deployment ישנים
└── Fleet_Management.zip   ← גיבוי ZIP ישן
```

---

## 📄 קבצי תיעוד ישנים (old-docs/)

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

| קובץ | תיאור | סוג |
|------|-------|-----|
| `test_api_connection.html` | בדיקת חיבור API | HTML |
| `test_login.html` | בדיקת login | HTML |
| `test_local_api.ps1` | בדיקת API מקומי | PowerShell |
| `test_super_admin_login.ps1` | בדיקת super admin | PowerShell |

---

## 🚀 קבצי Deployment ישנים (old-deployment/)

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

## 🗑️ קבצים שנמחקו לגמרי

| קובץ | סיבה |
|------|------|
| `added')` | קובץ זבל (typo) |
| `leep 2` | קובץ זבל (typo) |

---

**עדכון אחרון:** 27/01/2026
