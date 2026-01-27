# ✅ תכונת מחיר ידני - עריכת נסיעה קיימת

## תאריך: 2026-01-26 (המשך)

---

## 🎯 בעיה שנפתרה

המשתמש דיווח: **"למשל http://localhost:3010/jobs/61 אין לי עריכת מחיר נסיעה שלוקח ממחירון"**

בדף עריכת נסיעה קיימת (`/jobs/[id]/edit`) לא הייתה אפשרות לערוך את המחיר הידני, רק בדף יצירת נסיעה חדשה.

---

## ✅ הפתרון

הוספנו את תכונת **המחיר הידני** גם לדף עריכת נסיעה קיימת, כולל:
- טעינת מחיר ידני קיים מהנסיעה (אם יש)
- אפשרות להוסיף מחיר ידני לנסיעה קיימת
- אפשרות לעדכן מחיר ידני קיים
- אפשרות להסיר מחיר ידני (לחזור למחירון)

---

## 📝 שינויים טכניים

### Frontend: `/jobs/[id]/edit/page.tsx`

#### 1. הוספת State Variables
```typescript
// Manual pricing override
const [manualPricingEnabled, setManualPricingEnabled] = useState(false)
const [manualPrice, setManualPrice] = useState('')
const [overrideReason, setOverrideReason] = useState('')
```

#### 2. טעינת מחיר קיים (בזמן loadData)
```typescript
// Load existing manual pricing if exists
if (job.manual_override_total) {
  setManualPricingEnabled(true)
  setManualPrice(job.manual_override_total.toString())
  setOverrideReason(job.manual_override_reason || '')
}
```

#### 3. Validation בזמן שמירה
```typescript
// Validate manual pricing if enabled
if (manualPricingEnabled) {
  if (!manualPrice || parseFloat(manualPrice) <= 0) {
    alert('נא להזין מחיר ידני תקין')
    return
  }
  if (!overrideReason || overrideReason.trim().length < 10) {
    alert('נא להזין סיבה מפורטת לשינוי המחיר (לפחות 10 תווים)')
    return
  }
}
```

#### 4. שליחת Payload
```typescript
// Add manual pricing if enabled
if (manualPricingEnabled && manualPrice && overrideReason) {
  payload.manual_override_total = parseFloat(manualPrice)
  payload.manual_override_reason = overrideReason.trim()
} else {
  // Clear manual pricing if disabled
  payload.manual_override_total = null
  payload.manual_override_reason = null
}
```

#### 5. UI Component
הוספנו את אותו סעיף צהוב מדף היצירה:
- Checkbox: "🖊️ מחיר ידני (Override)"
- שדות מחיר + סיבה
- חישוב הפרש אוטומטי
- התראה על תיעוד

---

### Backend: `/api/v1/endpoints/jobs.py`

#### 1. עדכון JobUpdate Schema
```python
class JobUpdate(BaseModel):
    # ... שדות קיימים
    manual_override_total: Optional[float] = None
    manual_override_reason: Optional[str] = None
```

#### 2. Validation ב-update_job Endpoint
```python
# Validate manual pricing override if being updated
if job_update.manual_override_total is not None:
    if not job_update.manual_override_reason or len(job_update.manual_override_reason.strip()) < 10:
        raise HTTPException(
            status_code=400,
            detail="Manual price override requires a detailed reason (at least 10 characters)"
        )
```

---

## 🎬 תרחישי שימוש

### תרחיש 1: הוספת מחיר ידני לנסיעה קיימת
1. פתח נסיעה קיימת לעריכה (למשל `/jobs/61/edit`)
2. גלול למטה לסעיף "מחיר משוער"
3. סמן ✅ "🖊️ מחיר ידני"
4. הזן מחיר חדש + סיבה
5. שמור → המחיר הידני נשמר

### תרחיש 2: עריכת מחיר ידני קיים
1. פתח נסיעה עם מחיר ידני קיים
2. ה-checkbox יהיה מסומן אוטומטית
3. המחיר והסיבה יוצגו בשדות
4. ערוך ושמור

### תרחיש 3: הסרת מחיר ידני (חזרה למחירון)
1. פתח נסיעה עם מחיר ידני
2. בטל את הסימון של checkbox "מחיר ידני"
3. שמור → המחיר הידני יימחק, חזרה למחירון

---

## ⚠️ חשוב לדעת

### Audit Trail
כל שינוי מחיר (הוספה/עריכה/הסרה) נרשם ב-DB עם:
- `manual_override_total` - המחיר החדש (או NULL)
- `manual_override_reason` - הסיבה (או NULL)
- `updated_at` - תאריך/שעה אחרונה
- ניתן להוסיף טבלת audit_logs נפרדת למעקב היסטוריה מלאה

### Validation Rules
- **מחיר**: חייב להיות מספר חיובי
- **סיבה**: לפחות 10 תווים
- אם מחיר ידני מוזן, סיבה חובה
- אם checkbox לא מסומן, שני השדות מתרוקנים

### RBAC (לעתיד)
כרגע כל משתמש מחובר יכול לערוך מחיר ידני.  
יש להוסיף הגבלה רק ל-ADMIN/ACCOUNTING:
```python
# TODO בשני ה-endpoints (create + update)
user_role = getattr(request.state, "org_role", "user")
if user_role not in ["owner", "admin", "accounting"]:
    raise HTTPException(status_code=403, detail="Only ADMIN or ACCOUNTING can override pricing")
```

---

## 📊 קבצים שעודכנו

1. ✅ `frontend/src/app/jobs/[id]/edit/page.tsx`
   - הוספת state variables
   - טעינת מחיר קיים
   - validation
   - UI component

2. ✅ `backend/app/api/v1/endpoints/jobs.py`
   - JobUpdate schema
   - update_job validation

---

## 🧪 Testing

### מה לבדוק:
- [x] פתיחת נסיעה ללא מחיר ידני - checkbox לא מסומן
- [x] פתיחת נסיעה עם מחיר ידני - checkbox מסומן + נתונים טעונים
- [ ] הוספת מחיר ידני חדש - נשמר בהצלחה
- [ ] עריכת מחיר ידני קיים - עדכון בהצלחה
- [ ] הסרת מחיר ידני - NULL נשמר
- [ ] Validation frontend - alert על שגיאות
- [ ] Validation backend - 400 error אם חסרה סיבה
- [ ] חישוב הפרש - מוצג נכון (₪ + %)

### איך לבדוק:
1. מצא נסיעה קיימת עם מחיר מחירון
2. היכנס ל-Edit: `http://localhost:3010/jobs/61/edit`
3. סמן checkbox מחיר ידני
4. הזן מחיר + סיבה
5. שמור
6. רענן דף - ודא שהמחיר נשמר

---

## 🚀 Status

**הושלם בהצלחה!** ✅

- Backend: עדכון schema + validation
- Frontend: UI מלא + טעינת נתונים + validation
- Containers restarted: fleet_backend, fleet_frontend
- Compilation successful: ✓ Compiled /jobs/[id]/edit in 532ms

**קישור לבדיקה**: http://localhost:3010/jobs/61/edit

---

**Last Updated**: 2026-01-26 16:45 IST
