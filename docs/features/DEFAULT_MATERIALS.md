# חומרים סטנדרטיים - Default Materials

## תאריך: 26/01/2026

## תכונה
כל ארגון חדש יכול ליצור חומרים סטנדרטיים בלחיצת כפתור אחת במקום להקליד ידנית.

## רשימת החומרים הסטנדרטיים
1. **עפר** - טון
2. **חצץ** - טון
3. **מצע** - טון
4. **חול** - טון
5. **פסולת בניין** - טון
6. **אספלט** - טון

כל החומרים מוגדרים עם יחידת חיוב: **טון**

## שימוש

### דרך הממשק
1. גש ל-http://truckflow.site:3010/materials
2. אם אין חומרים - יופיע כפתור ירוק **"הוסף חומרים סטנדרטיים"**
3. לחץ על הכפתור
4. אשר את היצירה
5. 6 חומרים נוצרו אוטומטית!

### דרך API
```bash
POST /api/materials/seed-defaults
Authorization: Bearer <token>
```

**תגובה:**
```json
{
  "message": "Created 6 default materials",
  "materials": ["עפר", "חצץ", "מצע", "חול", "פסולת בניין", "אספלט"]
}
```

## מה אפשר לעשות עם החומרים?
✅ **למחוק** חומרים שלא צריכים (לחצן 🗑️)
✅ **לערוך** שמות או יחידות (לחצן ✏️)
✅ **להוסיף** חומרים נוספים (כפתור "הוסף חומר")
✅ **לחפש** בין החומרים (שדה חיפוש)

## הגנות
- ✅ לא ניתן ליצור חומרים דיפולטיביים אם כבר יש חומרים קיימים
- ✅ כל ארגון מנותק - לא רואים חומרים של ארגונים אחרים
- ✅ הכפתור מופיע רק אם אין חומרים

## קבצים שונו
1. **Backend**: `backend/app/api/v1/endpoints/materials.py`
   - נוסף endpoint: `POST /materials/seed-defaults`
   - פונקציה: `seed_default_materials()`

2. **Frontend**: `frontend/src/app/materials/page.tsx`
   - נוספה פונקציה: `seedDefaultMaterials()`
   - כפתור מותנה: מופיע רק אם `materials.length === 0`

3. **API Client**: `frontend/src/lib/api.ts`
   - נוספה מתודה: `materialsApi.seedDefaults()`

## דוגמת קוד

### Backend (materials.py)
```python
@router.post("/seed-defaults", status_code=201)
async def seed_default_materials(request: Request, db: Session = Depends(get_db)):
    org_id = get_current_org_id(request)
    
    default_materials = [
        {"name": "עפר", "billing_unit": BillingUnit.TON},
        {"name": "חצץ", "billing_unit": BillingUnit.TON},
        {"name": "מצע", "billing_unit": BillingUnit.TON},
        {"name": "חול", "billing_unit": BillingUnit.TON},
        {"name": "פסולת בניין", "billing_unit": BillingUnit.TON},
        {"name": "אספלט", "billing_unit": BillingUnit.TON},
    ]
    
    for mat_data in default_materials:
        db_material = Material(org_id=org_id, **mat_data, is_active=True)
        db.add(db_material)
    
    db.commit()
    return {"message": f"Created {len(default_materials)} default materials"}
```

### Frontend (page.tsx)
```typescript
const seedDefaultMaterials = async () => {
  if (!confirm('האם ליצור חומרים סטנדרטיים?')) return
  
  try {
    await materialsApi.seedDefaults()
    alert('החומרים הסטנדרטיים נוצרו בהצלחה!')
    loadMaterials()
  } catch (error: any) {
    alert('שגיאה: ' + error.response?.data?.detail)
  }
}
```

## תרחישי שימוש

### תרחיש 1: ארגון חדש
1. מנהל נכנס לראשונה למערכת
2. נכנס לעמוד "חומרים"
3. רואה "אין חומרים" + כפתור ירוק
4. לוחץ "הוסף חומרים סטנדרטיים"
5. 6 חומרים נוצרו - יכול להתחיל לעבוד!

### תרחיש 2: מחיקת חומר מיותר
1. הארגון לא עובד עם אספלט
2. לוחץ 🗑️ ליד "אספלט"
3. מאשר מחיקה
4. נשאר עם 5 חומרים רלוונטיים

### תרחיש 3: הוספת חומר מיוחד
1. יש חומרים סטנדרטיים
2. צריך "בטון מזוין"
3. לוחץ "הוסף חומר"
4. מגדיר: שם="בטון מזוין", יחידה="קוב"
5. עכשיו יש 7 חומרים

## מה הלאה?
- 📧 אפשרות לשלוח הצעה ללקוח עם רשימת חומרים
- 📊 סטטיסטיקות: איזה חומרים הכי נפוצים
- 🔄 סנכרון עם מערכות חיצוניות
- 📱 הצגה באפליקציית הנהגים
