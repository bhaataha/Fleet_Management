# דפי יצירה (Create Forms) - 25/01/2026

## ✅ 5 דפי יצירה חדשים נוצרו

### 1. `/customers/new` - לקוח חדש
**קובץ**: `/frontend/src/app/customers/new/page.tsx` (230 שורות)

**שדות**:
- שם החברה* (חובה)
- ח.פ / ע.מ
- תנאי תשלום (ימים) - ברירת מחדל 30
- איש קשר: שם, טלפון, אימייל
- כתובת
- סטטוס פעיל/לא פעיל

**תכונות**:
- וולידציה - שם חובה
- טיפול בשגיאות
- כפתורי שמירה/ביטול
- חזרה אוטומטית ל-/customers אחרי שמירה

---

### 2. `/sites/new` - אתר חדש
**קובץ**: `/frontend/src/app/sites/new/page.tsx` (270 שורות)

**שדות**:
- שם האתר* (חובה)
- לקוח* (dropdown - חובה)
- כתובת מלאה
- קואורדינטות (lat/lng)
- שעות פעילות
- איש קשר באתר: שם, טלפון

**תכונות**:
- טעינת לקוחות מהמערכת
- התראה אם אין לקוחות + לינק ליצירה
- וולידציה - לקוח חובה
- נתונים אופציונליים (GPS, שעות)

---

### 3. `/trucks/new` - משאית חדשה
**קובץ**: `/frontend/src/app/trucks/new/page.tsx` (210 שורות)

**שדות**:
- מספר רישוי* (חובה)
- דגם
- סוג משאית (dropdown):
  - פול טריילר
  - סמי טריילר
  - דאבל
  - משאית קטנה
  - טנדר
- קיבולת (טון)
- קיבולת (מ"ק)
- סטטוס פעיל/לא פעיל

**תכונות**:
- 5 סוגי משאיות מוגדרים
- שדות קיבולת אופציונליים
- טיפ: ביטוח/טסט בעריכה

---

### 4. `/drivers/new` - נהג חדש
**קובץ**: `/frontend/src/app/drivers/new/page.tsx` (180 שורות)

**שדות**:
- שם מלא* (חובה)
- טלפון
- סוג רישיון (dropdown):
  - B
  - C
  - C1
  - C+E
  - D
- סטטוס פעיל/לא פעיל

**תכונות**:
- פשוט וממוקד
- 5 סוגי רישיון נפוצים
- טיפ: פרטי רישיון נוספים בעריכה

---

### 5. `/materials/new` - חומר חדש
**קובץ**: `/frontend/src/app/materials/new/page.tsx` (240 שורות)

**שדות**:
- שם החומר* (חובה)
- יחידת חיוב* (חובה):
  - טון
  - מטר קוב
  - נסיעה
  - קילומטר
- תיאור (textarea)
- סטטוס פעיל/לא פעיל

**תכונות**:
- 4 יחידות חיוב מוגדרות
- דוגמאות נפוצות (עפר-טון, חצץ-מ"ק, וכו')
- טיפ: קישור למחירונים

---

## 🔗 עדכוני דפים קיימים

### `/customers` - עודכן
- הוחלף `button + modal` ב-`<Link href="/customers/new">`
- הוסר state של `showCreateModal`
- כפתור פותח דף חדש במקום modal

### `/sites` - עודכן
- הוחלף `button` ב-`<Link href="/sites/new">`
- כפתור פותח דף חדש

### `/materials` - עודכן
- הוחלף `button` ב-`<Link href="/materials/new">`
- כפתור פותח דף חדש

### `/fleet` - לא שונה
- כבר היה עם Link ל-/trucks/new ו-/drivers/new

---

## 🎨 עיצוב אחיד

כל 5 הדפים החדשים כוללים:

✅ **Header** עם:
- כפתור חזרה (ArrowRight)
- כותרת + תיאור

✅ **Form Card** לבן עם shadow:
- כותרת מקטע עם אייקון
- Grid responsive (1 עמודה מובייל, 2 עמודות דסקטופ)
- Labels ברורים עם (*) לשדות חובה
- Placeholders מועילים

✅ **Validation**:
- שדות חובה עם `required`
- שגיאות ב-banner אדום למעלה
- טיפול בשגיאות API

✅ **Actions Bar** תחתון:
- רקע אפור (bg-gray-50)
- כפתור ביטול (אפור)
- כפתור שמירה (כחול) עם אייקון Save
- Disabled state בזמן שמירה

✅ **Info Boxes**:
- טיפים כחולים (bg-blue-50)
- דוגמאות אפורות (bg-gray-50)

---

## 📊 API Integration

כל הדפים מתחברים ל-API הנכון:
- `customersApi.create()`
- `sitesApi.create()`
- `trucksApi.create()`
- `driversApi.create()`
- `materialsApi.create()`

**Flow**:
1. משתמש ממלא טופס
2. לחיצה על "שמור" → `setSaving(true)`
3. קריאה ל-API
4. הצלחה → `router.push()` חזרה לרשימה
5. שגיאה → `setError()` הצגת הודעה

---

## 🧪 בדיקות

### בדוק כל דף:

1. **Customers New**: http://localhost:3010/customers/new
   - שדות חובה עובדים
   - תנאי תשלום ברירת מחדל 30
   - שמירה + חזרה ל-/customers

2. **Sites New**: http://localhost:3010/sites/new
   - טעינת לקוחות מהמערכת
   - dropdown לקוחות עובד
   - שמירה עם customer_id נכון

3. **Trucks New**: http://localhost:3010/trucks/new
   - dropdown סוגי משאיות
   - קיבולת אופציונלית
   - שמירה + חזרה ל-/fleet

4. **Drivers New**: http://localhost:3010/drivers/new
   - dropdown רישיונות
   - שדות פשוטים
   - שמירה + חזרה ל-/fleet

5. **Materials New**: http://localhost:3010/materials/new
   - dropdown יחידות חיוב
   - דוגמאות נפוצות מוצגות
   - שמירה + חזרה ל-/materials

### בדוק כפתורי "הוסף" מהדפים הראשיים:
- ✅ /customers → כפתור "הוסף לקוח" → /customers/new
- ✅ /sites → כפתור "הוסף אתר" → /sites/new
- ✅ /materials → כפתור "הוסף חומר" → /materials/new
- ✅ /fleet → טאב משאיות → "הוספת משאית" → /trucks/new
- ✅ /fleet → טאב נהגים → "הוספת נהג" → /drivers/new

---

## 📈 סטטיסטיקות

**קוד שנוסף**:
- 5 דפי יצירה חדשים
- ~1,130 שורות TypeScript/React
- 3 דפים עודכנו (customers, sites, materials)

**תכונות**:
- Form validation
- Error handling
- Loading states
- RTL support
- Responsive design
- Consistent UX

---

## ⏭️ מה הלאה?

### עדיפות גבוהה
1. **דפי עריכה** (Edit Pages)
   - /customers/[id] - עריכת לקוח
   - /sites/[id] - עריכת אתר
   - /trucks/[id] - עריכת משאית
   - /drivers/[id] - עריכת נהג
   - /materials/[id] - עריכת חומר

2. **מחיקה**
   - Modal אישור מחיקה
   - API delete calls
   - רענון אחרי מחיקה

### עדיפות בינונית
3. **ולידציות מתקדמות**
   - בדיקת ח.פ/ע.מ תקין
   - פורמט טלפון ישראלי
   - ולידציית אימייל
   - מספר רישוי ייחודי

4. **אפליקציית נהג** (PWA)
   - Login למובייל
   - רשימת משימות
   - עדכון סטטוס
   - חתימה

---

**סטטוס**: כל דפי היצירה קיימים ועובדים ✅
**תאריך**: 25/01/2026
**גרסה**: MVP 1.0
