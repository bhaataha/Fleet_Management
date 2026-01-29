# תיקון בעיית יצירת נהגים - שגיאת 500

## 🐛 הבעיה
כשניסינו ליצור נהג חדש דרך הממשק, קיבלנו שגיאת 500:
```
IntegrityError: null value in column "email" of relation "users" violates not-null constraint
```

## 🔍 הסיבה
- המודל `User` ב-`backend/app/models/__init__.py` הוגדר עם `email` כ-`nullable=True`
- אבל במסד הנתונים בפועל, העמודה הייתה מוגדרת כ-`NOT NULL`
- כשניסינו ליצור נהג ללא email (שזה לגיטימי - נהגים מתחברים עם טלפון), השרת זרק שגיאה

## ✅ הפתרון

### 1. שינוי במסד הנתונים
```sql
ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
```
ביצענו בשרת המרוחק:
```bash
docker exec fleet_db_prod psql -U fleet_user -d fleet_management \
  -c "ALTER TABLE users ALTER COLUMN email DROP NOT NULL;"
```

### 2. יצירת Migration
נוצר קובץ: `backend/alembic/versions/20260130_make_email_nullable.py`

זה מבטיח שהשינוי יישמר גם אם מריצים מחדש את המסד נתונים.

### 3. אימות
```sql
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'email';

-- תוצאה: email | YES ✅
```

## 📊 סטטוס עכשיו

| עמודה | is_nullable | הערה |
|-------|-------------|------|
| email | YES ✅ | נהגים יכולים ללא email |
| phone | YES ✅ | משתמשים שאינם נהגים יכולים ללא טלפון |

## 🎯 תוצאה
✅ עכשיו אפשר ליצור נהגים עם או בלי email  
✅ נהגים מתחברים עם טלפון + סיסמה  
✅ משתמשים אחרים (מנהל/סדרן/הנהלת חשבונות) מתחברים עם email + סיסמה

---

**תאריך תיקון**: 30/01/2026  
**קובץ Migration**: `backend/alembic/versions/20260130_make_email_nullable.py`
