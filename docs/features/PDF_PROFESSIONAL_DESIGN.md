# עיצוב PDF מקצועי - תעודות משלוח TruckFlow

## תאריך: 2026-01-26

## מטרה
שדרוג עיצוב תעודות המשלוח ל-PDF מקצועי עם מיתוג TruckFlow מלא.

## שינויים שבוצעו

### 1. Header מקצועי
- **רקע כחול**: `#1e40af` (TruckFlow blue)
- **לוגו וטקסט**:
  - "TruckFlow" בגודל 20pt
  - "FLEET MANAGEMENT" בגודל 10pt
- **גובה**: 2cm

### 2. Footer מקצועי
- **רקע אפור**: `#f3f4f6`
- **קו כחול מפריד**: 2px
- **תוכן Footer**:
  - **זכויות יוצרים**: `© 2026 TruckFlow. כל הזכויות שמורות.`
  - **מפתח**:
    - "פותח ונבנה על ידי"
    - "נינגה תקשורת והנדסה"
    - טלפון: 054-774-8823
  - **מספור עמודים**: "עמוד X מתוך Y"
- **גובה**: 2.5cm

### 3. עיצוב תוכן מקצועי

#### כותרת ראשית
- **גודל פונט**: 24pt (היה 20pt)
- **צבע**: `#1e40af` (כחול TruckFlow)
- **יישור**: למרכז
- **קו דקורטיבי**: קו כחול 2px + קו תכלת 0.5px

#### סגנון סעיפים
- **גודל פונט**: 14pt
- **צבע**: `#1e40af`
- **יישור**: ימין (RTL)
- **רווחים**: 12px למעלה, 8px למטה

#### טבלאות עם קוד צבעים

**פרטי נסיעה:**
- כותרות: רקע `#dbeafe` (כחול בהיר)
- תוכן: רקע לבן
- מסגרת: `#93c5fd`

**מסלול:**
- מקור: רקע `#f0fdf4` (ירוק בהיר), מסגרת `#86efac`
- יעד: רקע `#fef3c7` (צהוב בהיר), מסגרת `#fde047`
- חץ: `←` בגודל 18pt כחול

**חומר וכמות:**
- כותרות: רקע `#ede9fe` (סגול בהיר)
- מסגרת: `#c4b5fd`

**צי (נהג/משאית):**
- כותרות: רקע `#dbeafe` (כחול בהיר)
- מסגרת: `#93c5fd`

**הערות:**
- רקע: `#fef9c3` (צהוב בהיר)
- מסגרת: `#fde047`

### 4. תמיכה עברית מלאה
- **פונט**: DejaVu Sans (תמיכה בעברית)
- **BiDi**: `python-bidi` + `arabic-reshaper`
- **פונקציה**: `fix_hebrew()` לעיבוד טקסט RTL

## קבצים שהשתנו

### קובץ מרכזי
```
backend/app/services/pdf_generator.py
```

### גיבוי
```
backend/app/services/pdf_generator_backup.py
```

## מחלקות חדשות

### NumberedCanvas
מחלקה מותאמת אישית שמוסיפה Header ו-Footer לכל עמוד:

```python
class NumberedCanvas(canvas.Canvas):
    def draw_page_decorations(self, page_count):
        # Header עם TruckFlow branding
        # Footer עם זכויות + מפתח + מספור
```

### DeliveryNotePDF
מחלקה ליצירת PDF עם:
- שוליים מותאמים (3cm למעלה/למטה)
- סגנונות מקצועיים
- טבלאות עם קוד צבעים
- תמיכה מלאה בעברית RTL

## שימוש

### ב-API:
```python
from app.services.pdf_generator import DeliveryNotePDF

pdf_gen = DeliveryNotePDF()
buffer = pdf_gen.generate(job_data)
```

### API Endpoint:
```
GET /api/jobs/{job_id}/pdf?token=<access_token>
```

## דרישות טכניות

### תלויות Python:
```
reportlab==4.0.9
python-bidi==0.4.2
arabic-reshaper==3.0.0
```

### פונטים (Docker):
```dockerfile
RUN apt-get update && apt-get install -y \
    fonts-dejavu \
    fonts-dejavu-core
```

## תוצאה
✅ PDF מקצועי עם:
- Header ו-Footer מותגים
- עיצוב צבעוני ומסודר
- תמיכה מלאה בעברית RTL
- מיתוג TruckFlow מלא
- פרטי מפתח: נינגה תקשורת והנדסה

## נבדק
- ✅ השרת רץ (health check)
- ✅ קבצים הועלו בהצלחה
- ✅ הקונטיינר אותחל
- ✅ עברית מוצגת נכון

## הבא
- בדיקת PDF ממשי מנסיעה
- ייצוא ושיתוף ב-WhatsApp
- צפייה במסך הנייד
