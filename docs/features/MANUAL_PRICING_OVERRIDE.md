# Manual Pricing Override - תיעוד מלא

## 🎯 מטרה

מאפשר קביעת מחיר מותאם אישית לנסיעה שעוקף את המחיר המחושב ממחירון הלקוח.  
**המחיר הידני הוא המחיר הסופי והמחייב לכל מטרה**: חיוב לקוח, תשלום לקבלן משנה, ודוחות.

---

## 📊 שדות במסד הנתונים

### Job Model
```python
class Job(Base):
    # ... שדות אחרים
    
    # מחיר מחושב ממחירון (לעיון בלבד אם יש override)
    pricing_total = Column(Numeric(10, 2))
    pricing_breakdown_json = Column(JSON)
    
    # מחיר ידני - עוקף את pricing_total כשקיים
    manual_override_total = Column(Numeric(10, 2), nullable=True)
    manual_override_reason = Column(Text, nullable=True)
```

---

## 🎨 ממשק משתמש

### 1. יצירת נסיעה (`/jobs/new`)

**מיקום**: frontend/src/app/jobs/new/page.tsx

- צ'קבוקס "מחיר מותאם אישית" מאפשר הזנת מחיר ידני
- שדה מספרי חובה: "מחיר מותאם (₪)"
- שדה טקסט אופציונלי: "סיבה לשינוי מחיר (אופציונלי)"
- הצגת הפרש מהמחירון (ירוק/אדום)
- אזהרה: "⚠️ מחיר זה יעקוף את החישוב הרגיל ממחירון הלקוח"

**Validation**:
- מחיר חייב להיות > 0
- סיבה אופציונלית (לא נדרשת)

**Payload**:
```typescript
{
  ...otherJobFields,
  manual_override_total: 4200.50,
  manual_override_reason: "הנחה מיוחדת - לקוח VIP" // or null
}
```

---

### 2. עריכת נסיעה (`/jobs/[id]/edit`)

**מיקום**: frontend/src/app/jobs/[id]/edit/page.tsx

- טעינה אוטומטית של ערכים קיימים אם יש override
- אפשרות להוסיף/לעדכן/למחוק override
- UI זהה ליצירת נסיעה

**לוגיקת עדכון**:
- אם מסמנים checkbox → שולח manual_override_total + reason
- אם מבטלים checkbox → שולח `null` לשני השדות (מוחק את ה-override)

---

### 3. צפייה בנסיעה (`/jobs/[id]`)

**מיקום**: frontend/src/app/jobs/[id]/page.tsx

#### אם יש manual_override_total:
- **תיבה צהובה/כתומה** עם גבול בולט:
  - כותרת: "מחיר מותאם אישית"
  - אזהרה: "⚠️ מחיר זה עוקף את המחירון ומשמש לחיוב בפועל"
  - **מחיר גדול ובולט**: ₪4,200.50
  - סיבה (אם קיימת)
  - `<details>` מתקפל: הצגת מחיר ממחירון לעיון + הפרש

#### אם אין manual_override_total:
- **תיבה כחולה** רגילה:
  - כותרת: "מחיר ממחירון"
  - פירוט מחיר בסיס × כמות
  - תוספות (מינימום חיוב, המתנה, לילה)
  - סה"כ

**קוד מפתח**:
```typescript
{job.manual_override_total ? (
  // Yellow box - Manual Price
) : (
  // Blue box - Calculated Price
)}
```

---

## 📄 תעודת משלוח PDF

**מיקום**: backend/app/services/pdf_generator.py

**קטע "מחיר"** (אחרי חומר+כמות):
- רקע צהוב (#fef3c7)
- גבול כתום (#fde047)
- מחיר בפורמט ₪
- סיבה (אם קיימת) בטקסט קטן

**קוד**:
```python
if job_data.get('manual_override_total'):
    price_data = [
        ['מחיר', f"₪{job_data['manual_override_total']:,.2f}"],
    ]
    if job_data.get('manual_override_reason'):
        price_data.append(['הערה', job_data['manual_override_reason']])
    
    price_table = Table(price_data)
    price_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), HexColor('#fef3c7')),
        # ...
    ]))
```

---

## 🔧 Backend - API Endpoints

### POST /api/jobs (יצירה)
**Schema**: `JobCreate`
```python
class JobCreate(BaseModel):
    # ... שדות אחרים
    manual_override_total: Optional[float] = None
    manual_override_reason: Optional[str] = None
```

**Validation**: אין - השדות אופציונליים לגמרי.

---

### PATCH /api/jobs/{id} (עדכון)
**Schema**: `JobUpdate`
```python
class JobUpdate(BaseModel):
    # ... שדות אחרים
    manual_override_total: Optional[float] = None
    manual_override_reason: Optional[str] = None
```

**לוגיקת עדכון**:
- אם מועברים ערכים → מעדכן
- אם מועברים `null` → מוחק את ה-override (חוזר למחיר ממחירון)

---

### GET /api/jobs/{id}/pdf
**job_data** כולל:
```python
job_data = {
    # ... שדות אחרים
    'manual_override_total': float(job.manual_override_total) if job.manual_override_total else None,
    'manual_override_reason': job.manual_override_reason if job.manual_override_reason else None
}
```

---

## 💰 שימוש בדוחות וחיובים

### ⚠️ CRITICAL: כלל הזהב
**בכל מקום שמחשבים מחיר Job, חייבים לבדוק קודם אם יש `manual_override_total`!**

---

### 1. Statements (חשבוניות לקוח)

**מיקום**: backend/app/api/v1/endpoints/statements.py

**לפני התיקון** (❌ שגוי):
```python
amount = job.pricing_total or (job.actual_qty * Decimal(100))
```

**אחרי התיקון** (✅ נכון):
```python
amount = (
    job.manual_override_total          # Priority 1: Manual price
    or job.pricing_total               # Priority 2: Calculated price
    or (job.actual_qty * Decimal(100)) # Priority 3: Fallback
)
```

**הסבר**:
- Statement Line מקבל את המחיר הסופי שיחויב ללקוח
- אם יש manual_override_total → זה המחיר
- אחרת → מחיר מחושב ממחירון

---

### 2. Subcontractor Reports (דוחות קבלני משנה)

**מיקום**: backend/app/api/v1/endpoints/subcontractors.py  
**Endpoint**: GET /subcontractors/{id}/summary

**לפני התיקון** (❌ שגוי):
```python
total_company_price = sum(j.pricing_total or 0 for j in jobs)
```

**אחרי התיקון** (✅ נכון):
```python
total_company_price = sum(
    (j.manual_override_total or j.pricing_total or 0) 
    for j in jobs
)
```

**הסבר**:
- הדוח מחשב רווחיות: `profit = company_price - subcontractor_price`
- חובה שה-`company_price` ישקף את המחיר שבפועל יחויב ללקוח
- אחרת הרווח יהיה מוטעה!

---

## 🧪 תרחישי בדיקה (Test Cases)

### Test 1: יצירה עם מחיר ידני
1. יצירת נסיעה חדשה
2. סימון "מחיר מותאם אישית"
3. הזנת ₪4,500 (מול ₪3,500 ממחירון)
4. הזנת סיבה: "הנחה מיוחדת"
5. **ציפייה**:
   - Job נשמר עם manual_override_total=4500
   - תעודה PDF מציגה ₪4,500 בקטע צהוב
   - דף צפייה מציג תיבה צהובה עם ₪4,500

---

### Test 2: עריכה - הוספת מחיר ידני
1. נסיעה קיימת ללא manual_override
2. כניסה לעריכה → צ'קבוקס לא מסומן
3. סימון צ'קבוקס → הזנת ₪5,200
4. שמירה
5. **ציפייה**:
   - Job מעודכן עם manual_override_total=5200
   - דף צפייה עובר מתיבה כחולה לצהובה

---

### Test 3: עריכה - הסרת מחיר ידני
1. נסיעה עם manual_override_total=4200
2. כניסה לעריכה → צ'קבוקס מסומן, מוצג ₪4,200
3. ביטול צ'קבוקס
4. שמירה
5. **ציפייה**:
   - Job מעודכן עם manual_override_total=NULL
   - דף צפייה חוזר לתיבה כחולה (מחיר ממחירון)

---

### Test 4: Statement עם מחיר ידני
1. יצירת 3 נסיעות:
   - נסיעה A: manual_override=₪5,000 (ממחירון: ₪4,000)
   - נסיעה B: רק מחירון ₪3,500
   - נסיעה C: manual_override=₪2,800 (ממחירון: ₪3,200)
2. יצירת Statement
3. **ציפייה**:
   - Line A: ₪5,000 (manual)
   - Line B: ₪3,500 (calculated)
   - Line C: ₪2,800 (manual)
   - סה"כ: ₪11,300 (לא ₪10,700!)

---

### Test 5: Subcontractor Report
1. נסיעה של קבלן משנה:
   - manual_override_total = ₪6,000 (חיוב ללקוח)
   - subcontractor_price_total = ₪4,500 (תשלום לקבלן)
2. בדיקת דוח `/subcontractors/1/summary`
3. **ציפייה**:
   - total_company_price: ₪6,000 (לא מחיר ממחירון!)
   - total_subcontractor_price: ₪4,500
   - profit: ₪1,500
   - profit_margin: 25%

---

## 📝 הערות חשובות למפתחים

### 1. תמיד בדוק manual_override קודם!
```python
# ❌ WRONG
final_price = job.pricing_total

# ✅ CORRECT
final_price = job.manual_override_total or job.pricing_total
```

---

### 2. Audit Log
כרגע אין audit מיוחד ל-manual_override.  
**המלצה לעתיד**: לוגיקת Audit אוטומטית שרושמת:
- מי שינה
- מתי
- מה היה הערך הקודם
- מה הערך החדש
- סיבה (manual_override_reason)

---

### 3. Report Queries
כל query שמחשב סכומים חייב להשתמש ב-COALESCE:
```sql
SELECT 
    SUM(COALESCE(manual_override_total, pricing_total, 0)) AS total_revenue
FROM jobs
WHERE org_id = ?
```

---

### 4. Frontend Display Priority
בכל מקום שמציגים מחיר:
1. בדוק אם `job.manual_override_total` קיים
2. אם כן → הצג בסגנון מיוחד (צהוב/כתום + אזהרה)
3. אחרת → הצג מחיר רגיל מחושב

---

## 🔍 איך למצוא שימושים של pricing_total

```bash
# חיפוש בקוד Backend
grep -r "pricing_total" backend/app --include="*.py"

# חיפוש בקוד Frontend
grep -r "pricing" frontend/src --include="*.tsx" --include="*.ts"
```

**אזהרה**: כל מקום שמצאתם `pricing_total` בקוד דוחות/חיובים/חישובים -  
חובה לבדוק שמשתמשים קודם ב-`manual_override_total`!

---

## 📊 סיכום - היכן עדכנו

| קובץ | שינוי | מטרה |
|------|-------|------|
| `frontend/src/app/jobs/new/page.tsx` | UI מלא למחיר ידני | יצירת נסיעה עם override |
| `frontend/src/app/jobs/[id]/edit/page.tsx` | UI עריכה + טעינת ערכים | עדכון/הסרת override |
| `frontend/src/app/jobs/[id]/page.tsx` | תצוגה מותנית (צהוב/כחול) | הצגת מחיר סופי |
| `backend/app/api/v1/endpoints/jobs.py` | schemas + PDF data | שמירה ומסירת נתונים |
| `backend/app/services/pdf_generator.py` | קטע "מחיר" צהוב | תעודת משלוח |
| `backend/app/api/v1/endpoints/statements.py` | priority logic | חיוב ללקוח נכון |
| `backend/app/api/v1/endpoints/subcontractors.py` | priority logic בסיכום | דוחות רווחיות נכונים |

---

## ✅ Checklist פיצ'ר מושלם

- [x] UI יצירה (new)
- [x] UI עריכה (edit)
- [x] UI צפייה (view)
- [x] תעודה PDF
- [x] Backend schemas (create/update)
- [x] Statements - שימוש במחיר נכון
- [x] Subcontractor Reports - שימוש במחיר נכון
- [x] תיעוד מפורט
- [ ] Unit Tests (TODO)
- [ ] E2E Tests (TODO)
- [ ] Audit Log (Future)

---

## 🚀 גרסה

- **Created**: 2026-01-25
- **Last Updated**: 2026-01-25
- **Status**: ✅ Production Ready
- **Version**: 1.0.0

