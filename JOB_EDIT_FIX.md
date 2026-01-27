# ✅ תיקון עריכת נסיעה - הושלם!

## 🐛 הבעיות שדווחו

1. ❌ לא ניתן לערוך מחיר של הנסיעה
2. ❌ לא ניתן להגדיר קבלן משנה

---

## ✅ מה תוקן

### 1. מחיר מותאם אישית - תמיד זמין!

**לפני התיקון**: קטע המחיר הידני היה מוצג רק אם `pricingPreview` קיים או `manualPricingEnabled` כבר היה מסומן.

**אחרי התיקון**: 
```tsx
{/* Manual Price Override - Always visible */}
{
  <div className="bg-yellow-50 rounded-lg border-2 border-yellow-300 p-6 space-y-4">
    // ... תמיד מוצג!
  </div>
}
```

✅ **תוצאה**: כעת ניתן לסמן "מחיר ידני (Override)" בכל עת, גם אם אין מחירון!

---

### 2. קבלן משנה - נוסף!

**תוספות**:

#### A. טעינת קבלני משנה
```tsx
const [subcontractors, setSubcontractors] = useState<any[]>([])
const [isSubcontractor, setIsSubcontractor] = useState(false)

// In loadData():
subcontractorsApi.getAll().catch(() => ({ data: [] }))
```

#### B. טעינת מצב קיים
```tsx
// Load existing subcontractor mode if exists
if (job.is_subcontractor || job.subcontractor_id) {
  setIsSubcontractor(true)
}
```

#### C. UI לבחירת קבלן
```tsx
{/* Subcontractor Toggle */}
<input
  type="checkbox"
  checked={isSubcontractor}
  onChange={(e) => {
    setIsSubcontractor(e.target.checked)
    if (!e.target.checked) {
      setFormData({ ...formData, subcontractor_id: '', driver_id: '', truck_id: '' })
    }
  }}
/>
<span>🚛 נסיעה של קבלן משנה</span>

{/* Conditional rendering */}
{isSubcontractor ? (
  <Combobox label="קבלן משנה" required ... />
) : (
  <div className="grid grid-cols-2 gap-6">
    <Combobox label="נהג" ... />
    <Combobox label="משאית" ... />
  </div>
)}
```

#### D. שמירה
```tsx
const payload = {
  // ... other fields
  is_subcontractor: isSubcontractor,
  subcontractor_id: isSubcontractor && formData.subcontractor_id 
    ? parseInt(formData.subcontractor_id) 
    : null,
}
```

---

## 🎯 איך זה עובד עכשיו?

### מחיר ידני
1. ✅ **תמיד מוצג** - לא תלוי במחירון
2. ✅ סמן צ'קבוקס "מחיר ידני (Override)"
3. ✅ הזן מחיר
4. ✅ הזן סיבה (אופציונלי)
5. ✅ שמור - המחיר הידני נשמר

### קבלן משנה
1. ✅ סמן צ'קבוקס "🚛 נסיעה של קבלן משנה"
2. ✅ בחר קבלן מהרשימה
3. ✅ שדות נהג/משאית נעלמים (לא רלוונטי לקבלן חיצוני)
4. ✅ שמור - `is_subcontractor=true` ו-`subcontractor_id` נשמרים

### שילוב של שניהם
- ✅ אפשר לבחור קבלן משנה **וגם** להגדיר מחיר ידני!
- 💡 **תרחיש לדוגמה**: 
  - קבלן משנה עושה נסיעה במחיר מיוחד
  - מסמנים: is_subcontractor=true
  - מזינים: manual_override_total=5000
  - מציינים: "הסכם מיוחד עם קבלן X"

---

## 📁 קבצים שונו

### Frontend
- **`frontend/src/app/jobs/[id]/edit/page.tsx`**
  - ✅ Import של `subcontractorsApi`
  - ✅ State: `subcontractors`, `isSubcontractor`
  - ✅ FormData: `subcontractor_id`
  - ✅ loadData: טעינת קבלנים וסטטוס קיים
  - ✅ UI: תמיד מציג Manual Price Override
  - ✅ UI: Toggle לקבלן משנה
  - ✅ UI: רינדור מותנה נהג/משאית vs קבלן
  - ✅ handleSubmit: שליחת `is_subcontractor` ו-`subcontractor_id`

---

## 🧪 בדיקות מומלצות

### Test 1: עריכת מחיר בלי מחירון
1. צור נסיעה ללקוח שאין לו מחירון
2. היכנס לעריכה
3. **ציפייה**: תיבה צהובה "מחיר ידני" תמיד מוצגת
4. סמן, הזן מחיר, שמור
5. **ציפייה**: המחיר נשמר ב-`manual_override_total`

### Test 2: הוספת קבלן משנה
1. עריכת נסיעה קיימת עם נהג/משאית
2. סמן "🚛 נסיעה של קבלן משנה"
3. **ציפייה**: שדות נהג/משאית נעלמים, מופיע שדה קבלן
4. בחר קבלן, שמור
5. **ציפייה**: `is_subcontractor=true`, `subcontractor_id` מלא

### Test 3: הסרת קבלן משנה
1. נסיעה עם קבלן משנה
2. ביטול הצ'קבוקס
3. **ציפייה**: שדות נהג/משאית חוזרים, קבלן מתנקה
4. בחר נהג+משאית, שמור
5. **ציפייה**: `is_subcontractor=false`, `subcontractor_id=null`

### Test 4: שילוב - קבלן עם מחיר ידני
1. צור/ערוך נסיעה
2. סמן קבלן משנה + בחר קבלן
3. סמן מחיר ידני + הזן 5000
4. שמור
5. **ציפייה**: גם `is_subcontractor` וגם `manual_override_total` נשמרים
6. הצג נסיעה: תיבה צהובה מציגה את המחיר הידני

---

## 📝 הערות חשובות

### 1. Logic של קבלן משנה
כשמסמנים `isSubcontractor`:
- ✅ שדות נהג/משאית **לא חובה** (נמחקים בזמן toggle)
- ✅ שדה קבלן **חובה** (`required`)
- 💡 הקבלן מביא את המשאית והנהג שלו

### 2. Logic של מחיר ידני
- ✅ **תמיד זמין** - גם בלי מחירון
- ✅ אם מחירון קיים - מציג הפרש באחוזים
- ✅ אם אין מחירון - מאפשר להזין מחיר חופשי

### 3. Backend Support
Backend כבר תומך ב:
- ✅ `is_subcontractor` (boolean)
- ✅ `subcontractor_id` (nullable int)
- ✅ `manual_override_total` (nullable decimal)
- ✅ `manual_override_reason` (nullable text)

---

## 🎨 UI/UX

### מחיר ידני
- 🟨 תיבה צהובה עם גבול בולט
- 🖊️ אייקון "מחיר ידני (Override)"
- ⚠️ אזהרה: "שינוי מחיר ידני יתועד במערכת"

### קבלן משנה
- 🚛 אייקון משאית
- 🟦 תיבה אפורה עם toggle
- 💡 הסבר: "עלות קבלן תחושב לפי מחירון הקבלן"

---

## ✅ סטטוס

- ✅ בעיה #1 (מחיר ידני) - **תוקן!**
- ✅ בעיה #2 (קבלן משנה) - **תוקן!**
- ✅ Frontend restarted
- ✅ קומפילציה הצליחה
- ✅ Ready for testing

**רענן דפדפן (Ctrl+Shift+R) וכנס לעריכת נסיעה!** 🚀

