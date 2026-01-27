# 🚛 מדריך ניהול סוגי רכב

## סקירה כללית

המערכת כעת תומכת בסוגי רכב דינמיים שניתן לערוך ולנהל דרך הממשק!

## ✅ מה הושלם

### Backend
- ✅ API מלא ל-CRUD (יצירה, קריאה, עדכון, מחיקה)
- ✅ תמיכה ב-Multi-tenant (כל ארגון רואה רק את הסוגים שלו)
- ✅ Seed defaults - 8 סוגי רכב מובנים
- ✅ מיגרציית DB הושלמה

### Frontend
- ✅ דף ניהול סוגי רכב עם ממשק מלא
- ✅ כפתור "ניהול סוגי רכב" בדף הצי
- ✅ שילוב עם טפסי משאיות (יצירה ועריכה)
- ✅ סינון בדף הצי לפי סוג רכב
- ✅ DashboardLayout עם ניווט מלא

## 📍 איך להשתמש

### גישה לניהול סוגי רכב

**דרך 1**: היכנס ל-[http://localhost:3010/truck-types](http://localhost:3010/truck-types)

**דרך 2**: היכנס ל"ניהול צי" ולחץ על הכפתור "ניהול סוגי רכב" בפינה הימנית העליונה

### פעולות זמינות

#### 1. הוספת סוג רכב חדש
1. לחץ על הכפתור "הוסף סוג רכב" (Plus icon)
2. מלא את הפרטים:
   - **שם באנגלית** (חובה) - לדוגמה: `Full Trailer`
   - **שם בעברית** - לדוגמה: `פול טריילר`
   - **קוד** (חובה) - לדוגמה: `FULL_TRAILER`
   - **תיאור** - הסבר קצר על הרכב
3. לחץ "שמור"

#### 2. עריכת סוג רכב
1. לחץ על אייקון העיפרון (Edit) בכרטיס
2. ערוך את השדות
3. לחץ "עדכן"

#### 3. מחיקת סוג רכב (Soft Delete)
1. לחץ על אייקון הפח (Trash)
2. אשר את המחיקה
3. **שים לב**: הסוג לא נמחק לגמרי, רק מסתתר מהרשימה

#### 4. טעינת ברירות מחדל
- לחץ על "טען סוגי רכב מוגדרים מראש" (Settings icon)
- יתווספו 8 סוגי רכב קבועים:
  - פול טריילר (Full Trailer)
  - סמי (Semi)
  - דאבל (Double)
  - משאית קטנה (Small Truck)
  - משאית בינונית (Medium Truck)
  - משאית גדולה (Large Truck)
  - טנדר (Van)
  - טרקטור (Tractor)

## 🔌 API Endpoints

```
GET    /api/vehicle-types              - רשימת כל סוגי הרכב
GET    /api/vehicle-types?active_only=true  - רק סוגים פעילים
POST   /api/vehicle-types              - יצירת סוג חדש
GET    /api/vehicle-types/{id}         - פרטי סוג ספציפי
PATCH  /api/vehicle-types/{id}         - עדכון סוג
DELETE /api/vehicle-types/{id}         - מחיקה רכה (is_active=false)
POST   /api/vehicle-types/seed-defaults - טעינת ברירות מחדל
```

## 📁 קבצים חשובים

### Backend
- `backend/app/api/v1/endpoints/vehicle_types.py` - API endpoints
- `backend/app/models/__init__.py` - VehicleType model
- `backend/alembic/versions/50897775e9cd_add_vehicle_types_table.py` - Migration

### Frontend
- `frontend/src/app/truck-types/page.tsx` - דף ניהול סוגי רכב
- `frontend/src/app/fleet/page.tsx` - דף הצי (כולל כפתור לניהול)
- `frontend/src/hooks/useVehicleTypes.ts` - Custom hook
- `frontend/src/lib/api.ts` - vehicleTypesApi
- `frontend/src/types/index.ts` - VehicleType interface

## 🧪 בדיקות

### בדיקה מהירה
1. פתח [http://localhost:3010/truck-types](http://localhost:3010/truck-types)
2. לחץ "טען סוגי רכב מוגדרים מראש"
3. וודא ש-8 סוגים מופיעים
4. נסה ליצור סוג חדש
5. עבור ל"משאיות" → "הוסף משאית" ובדוק שהסוגים מופיעים ב-dropdown

### בדיקת Multi-Tenant
1. כל ארגון רואה רק את הסוגים שלו
2. אם יוצרים סוג עם אותו CODE בארגון אחר - זה מותר (isolation)

## ⚠️ הערות חשובות

1. **קוד ייחודי לארגון**: לא ניתן ליצור 2 סוגי רכב עם אותו CODE באותו ארגון
2. **מחיקה רכה**: מחיקת סוג רכב מסתירה אותו, לא מוחקת לגמרי מה-DB
3. **ברירות מחדל**: אפשר לטעון כמה פעמים, המערכת לא תכפיל סוגים קיימים
4. **שילוב בטפסים**: כל הטפסים משתמשים אוטומטית בסוגים הדינמיים

## 🚀 מה הלאה?

### שיפורים עתידיים (אופציונלי)
- [ ] משיכה לשינוי סדר (drag & drop reorder)
- [ ] שיוך סוג רכב לקיבולת מסוימת (אוטומט-fill capacity)
- [ ] חיפוש/סינון בדף סוגי הרכב
- [ ] ייצוא/ייבוא של סוגי רכב
- [ ] תמונות לסוגי רכב
- [ ] שדות מותאמים אישית לכל סוג

## 📞 תמיכה טכנית

במקרה של בעיות:
1. בדוק logs: `docker logs fleet_frontend --tail 50`
2. בדוק logs: `docker logs fleet_backend --tail 50`
3. וודא שה-DB migration הרצה: `docker exec fleet_backend alembic current`

---

**גרסה**: 1.0.0  
**תאריך**: 2024-01-25  
**סטטוס**: ✅ Production Ready
