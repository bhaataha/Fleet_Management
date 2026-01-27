# מדריך איתור בעיות בטפסי נסיעות

## בעיה: לא ניתן ליצור או לערוך נסיעות

### שלב 1: בדיקת Console בדפדפן

1. פתח את הדפדפן (Chrome/Edge)
2. לחץ F12 לפתיחת Developer Tools
3. לך ל-Tab "Console"
4. נסה ליצור או לערוך נסיעה
5. חפש שגיאות אדומות

### שלב 2: בדיקת Network

1. ב-Developer Tools, לך ל-Tab "Network"
2. נסה לשמור נסיעה
3. חפש בקשת POST/PATCH
4. לחץ עליה וראה:
   - **Status Code**: צריך להיות 200/201 (אם failed: צריך לראות 400/500)
   - **Request Payload**: מה נשלח לשרת
   - **Response**: מה השרת החזיר

### שלב 3: בדיקות נפוצות

#### בעיה 1: כפתור "שמור" לא עושה כלום
**גורם אפשרי**: Validation נכשל

**פתרון**:
- וודא שכל השדות החובה מולאו:
  - לקוח
  - מאתר → לאתר
  - חומר
  - תאריך
  - כמות
  - יחידת חיוב

#### בעיה 2: מופיע alert "נא להזין..."
**גורם**: Validation מצא שדה חסר

**פתרון**: מלא את השדה החסר לפי ה-alert

#### בעיה 3: שגיאה "Failed to create/update job"
**גורם אפשרי**: בעיה בשרת

**פתרון**:
1. בדוק את Backend logs:
   ```powershell
   docker logs fleet_backend --tail 50
   ```
2. חפש שגיאות ERROR או EXCEPTION

#### בעיה 4: תאריך לא מתעדכן נכון
**גורם**: timezone conversion issue (תוקן!)

**סטטוס**: ✅ תוקן - התאריך נשמר כעת בפורמט `YYYY-MM-DDT12:00:00Z`

### שלב 4: תיקונים שבוצעו

#### תיקון 1: formatDate חסר (תוקן 27/01/2026)
```typescript
// הוספנו import:
import { billingUnitLabels, formatDate } from '@/lib/utils'
```

#### תיקון 2: timezone issue (תוקן 27/01/2026)
```typescript
// לפני:
scheduled_date: new Date(formData.scheduled_date).toISOString()

// אחרי:
scheduled_date: formData.scheduled_date + 'T12:00:00Z'
```

### שלב 5: בדיקה ידנית

נסה ליצור נסיעה עם הנתונים הבאים:
- **לקוח**: בחר לקוח קיים
- **מאתר**: בחר אתר מקור
- **לאתר**: בחר אתר יעד
- **חומר**: עפר / חצץ / מצע
- **תאריך**: 28/01/2026
- **כמות**: 20
- **יחידה**: טון
- **נהג**: בחר נהג (אופציונלי)
- **משאית**: בחר משאית (אופציונלי)

### אם עדיין לא עובד

העתק את השגיאה המדויקת מה-Console והדבק אותה כאן.

דוגמאות לשגיאות נפוצות:
- `ReferenceError: formatDate is not defined` → תוקן!
- `400 Bad Request` → בעיית validation בשרת
- `500 Internal Server Error` → בעיה בשרת
- `Network Error` → בעיית חיבור

### Logs שימושיים

```powershell
# Backend logs
docker logs fleet_backend --tail 100

# Frontend logs
docker logs fleet_frontend --tail 50

# רשימת containers
docker ps

# Restart containers
docker restart fleet_frontend fleet_backend
```

## מצב נוכחי (27/01/2026, 05:43)

✅ **תוקן**: import של formatDate  
✅ **תוקן**: timezone issue בשמירת תאריכים  
✅ **רץ**: כל ה-containers במצב Healthy

🔍 **לבדיקה**: האם יש שגיאות ב-Console של הדפדפן?
