# אתרים כלליים - General Sites Feature

## תאריך: 26/01/2026

## מטרה
אפשרות ליצור אתרים **כלליים** שאינם קשורים ללקוח ספציפי, כמו:
- 🏭 מחצבות
- 📍 תחנות העמסה
- 🚛 מרכזי לוגיסטיקה
- ♻️ אתרי פסולת/מחזור

## לפני ⬅️ אחרי

### לפני
- ✅ כל אתר **חייב** להיות קשור ללקוח
- ❌ לא ניתן ליצור מחצבה כללית
- ❌ צריך "לקוח פיקטיבי" עבור אתרים משותפים

### אחרי
- ✅ אתר כללי - ללא קשר ללקוח
- ✅ אתר לקוח - קשור לפרויקט ספציפי
- ✅ מחצבות/תחנות העמסה נגישות לכולם
- ✅ אתרי לקוח רק עבור הלקוח הספציפי

## סוגי אתרים

### 🏭 אתר כללי (General Site)
- **מה זה**: אתר שמשרת את כל הארגון
- **דוגמאות**: מחצבה, תחנת העמסה, מתקן טיפול בפסולת
- **קשור ללקוח**: ❌ לא
- **שימוש**: כל נסיעה יכולה לטעון/לפרוק שם

### 👤 אתר לקוח (Customer Project)
- **מה זה**: פרויקט/אתר בניה ספציפי ללקוח
- **דוגמאות**: אתר בניה של לקוח X, פרויקט דירות של לקוח Y
- **קשור ללקוח**: ✅ כן
- **שימוש**: נסיעות ספציפיות ללקוח זה

## שינויים טכניים

### 1. Database Migration
```sql
-- הוספת עמודה site_type
ALTER TABLE sites 
ADD COLUMN site_type VARCHAR(50) DEFAULT 'customer_project';

-- הפיכת customer_id לאופציונלי
ALTER TABLE sites 
ALTER COLUMN customer_id DROP NOT NULL;

-- אינדקס לביצועים
CREATE INDEX idx_sites_site_type ON sites(site_type);
```

### 2. Backend API (`sites.py`)
```python
class SiteBase(BaseModel):
    customer_id: Optional[int] = None  # אופציונלי!
    name: str
    # ... שאר השדות
    site_type: Optional[str] = "general"  # general | customer_project
```

### 3. Frontend - טופס יצירה (`sites/new/page.tsx`)
```typescript
const [formData, setFormData] = useState({
  name: '',
  customer_id: null,  // עכשיו אופציונלי
  site_type: 'general' as 'general' | 'customer_project'
})
```

**UI:**
```jsx
<select value={formData.site_type}>
  <option value="general">🏭 אתר כללי (מחצבה, תחנת העמסה)</option>
  <option value="customer_project">👤 אתר לקוח (פרויקט/אתר בניה)</option>
</select>

{formData.site_type === 'customer_project' && (
  <select name="customer_id" required>
    {/* רשימת לקוחות */}
  </select>
)}
```

### 4. Frontend - רשימת אתרים (`sites/page.tsx`)
```typescript
const getCustomerName = (customerId: number | null) => {
  if (!customerId) return '🏭 כללי'  // אתר כללי
  return customers.find(c => c.id === customerId)?.name || '-'
}
```

## איך להשתמש

### יצירת אתר כללי (מחצבה)
1. גש ל-http://truckflow.site:3010/sites
2. לחץ "➕ אתר חדש"
3. **סוג אתר**: בחר "🏭 אתר כללי"
4. **שם האתר**: "מחצבת נשר"
5. **כתובת**: "כביש 6 צומת עירון"
6. **שעות פעילות**: "08:00-16:00"
7. **לקוח**: השדה **נעלם** אוטומטית! ✅
8. שמור

### יצירת אתר לקוח
1. לחץ "➕ אתר חדש"
2. **סוג אתר**: בחר "👤 אתר לקוח"
3. **לקוח**: **חובה** לבחור! ⚠️
4. **שם האתר**: "פרויקט פארק המדע"
5. שמור

### תוצאה ברשימה
```
אתר              | לקוח
-------------------|--------
מחצבת נשר         | 🏭 כללי
פרויקט פארק המדע  | חברת בנייה א'
תחנת העמסה רמלה   | 🏭 כללי
```

## תרחישי שימוש

### תרחיש 1: נסיעה ממחצבה ללקוח
```
FROM: מחצבת נשר (🏭 כללי)
TO:   פרויקט פארק המדע (👤 חברת בנייה א')
```

### תרחיש 2: פינוי פסולת מלקוח למתקן טיפול
```
FROM: אתר בניה דרום (👤 לקוח ב')
TO:   מתקן טיפול בפסולת (🏭 כללי)
```

### תרחיש 3: העברה בין אתרי לקוח
```
FROM: פרויקט A (👤 לקוח X)
TO:   פרויקט B (👤 לקוח X)
```

## יתרונות

### ✅ ארגון מסודר
- אתרים כלליים נגישים לכולם
- אתרי לקוח ברורים ומזוהים

### ✅ גמישות
- לא צריך "לקוח פיקטיבי"
- מחצבה אחת לכל הנסיעות

### ✅ דיווח נכון
- מי שהכי טוען ממחצבה?
- כמה נסיעות לאתר לקוח X?

### ✅ UX פשוט
- טופס מתאים עצמו לסוג האתר
- אין שדות מיותרים

## מה הלאה?
- 🎨 סמנים שונים במפה (אייקון מחצבה vs אתר בניה)
- 📊 דוחות: "נסיעות לפי אתר כללי"
- 🔍 פילטר: "הצג רק אתרים כלליים"
- 📱 במובייל: אתרים כלליים ראשונים ברשימה

## קבצים שונו
1. **Backend**:
   - `backend/app/api/v1/endpoints/sites.py` - customer_id אופציונלי + site_type
   - `backend/db/add_site_type.sql` - migration script
   - `backend/migrate_site_type.py` - Python migration runner

2. **Frontend**:
   - `frontend/src/app/sites/new/page.tsx` - בחירת סוג אתר + לקוח מותנה
   - `frontend/src/app/sites/page.tsx` - תצוגה "🏭 כללי" או שם לקוח

## Validation Rules
- ✅ אתר כללי: `customer_id = null`, `site_type = 'general'`
- ✅ אתר לקוח: `customer_id` חובה, `site_type = 'customer_project'`
- ❌ לא יכול: `site_type = 'customer_project'` בלי `customer_id`

## Migration Status
✅ עמודה `site_type` נוספה לטבלה  
✅ `customer_id` הפך nullable  
✅ אתרים קיימים קיבלו `site_type = 'customer_project'`  
✅ אינדקס נוצר לביצועים
