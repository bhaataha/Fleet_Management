# תכונת עריכת ארגון - Super Admin

## סקירה
נוספה תכונה מלאה לעריכת ארגונים עבור Super Admin, כולל שם חברה, שם תצוגה, מספר טלפון, ופרטי קשר נוספים.

## דפים חדשים

### 1. `/super-admin/organizations/[id]/page.tsx`
דף עריכה מלא עם טופס שכולל:

#### פרטים בסיסיים
- **שם הארגון** (name) - חובה
- **שם תצוגה** (display_name) - אופציונלי, ברירת מחדל לשם הארגון
- **Slug** - לא ניתן לשינוי (read-only)
- **מזהה ארגון** (UUID) - לא ניתן לשינוי (read-only)

#### פרטי קשר
- **שם איש קשר** (contact_name) - חובה
- **מספר טלפון** (contact_phone) - אופציונלי
- **אימייל** (contact_email) - חובה
- **ח.פ / ע.מ** (vat_id) - אופציונלי

#### תוכנית ומגבלות
- **סוג תוכנית** (plan_type) - dropdown: חינם/נסיון/בסיסי/מקצועי/ארגוני
- **תפוגת נסיון** (trial_ends_at) - תאריך (מוצג רק אם plan_type = trial)
- **מקסימום משאיות** (max_trucks)
- **מקסימום נהגים** (max_drivers)

#### סטטיסטיקות (קריאה בלבד)
- משאיות קיימות / מקסימום
- נהגים קיימים / מקסימום
- נסיעות שהושלמו
- סטטוס ארגון

## שינויים ב-Backend

### `backend/app/api/v1/endpoints/super_admin.py`
הוספת שדה `vat_id` ל-`OrganizationUpdate`:

```python
class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    vat_id: Optional[str] = None  # ← חדש
    plan_type: Optional[str] = None
    # ... שאר השדות
```

## שינויים ב-Frontend

### `frontend/src/lib/api.ts`
עדכון ה-TypeScript interface של `updateOrganization`:

```typescript
updateOrganization: (orgId: string, data: Partial<{
  name: string;
  display_name: string;  // ← חדש
  slug: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string; // ← חדש
  vat_id: string;        // ← חדש
  plan_type: string;
  max_users: number;
  max_trucks: number;
  max_drivers: number;
  max_customers: number;
  trial_ends_at: string;
}>) => api.patch<any>(`/super-admin/organizations/${orgId}`, data)
```

## תהליך עבודה

### 1. גישה לעריכה
מדף ניהול ארגונים (`/super-admin`):
- לחיצה על כפתור "ערוך" ליד ארגון
- ניווט ל-`/super-admin/organizations/{org_id}`

### 2. טעינת נתונים
- טעינה אוטומטית של פרטי ארגון קיימים
- אכלוס הטופס עם הערכים הקיימים
- ברירות מחדל: `country=IL`, `timezone=Asia/Jerusalem`, `locale=he`, `currency=ILS`

### 3. עריכה ושמירה
- שינוי ערכים בטופס
- לחיצה על "שמור שינויים"
- שליחת `PATCH /api/super-admin/organizations/{id}`
- הצגת הודעת הצלחה
- חזרה לדף ניהול ארגונים

### 4. ביטול
- כפתור "ביטול" מבטל שינויים ומחזיר לדף הראשי

## Validations

### Frontend
- **שם ארגון** - required
- **שם איש קשר** - required
- **אימייל** - required + validation תקינות email
- **מספרים** (max_trucks, max_drivers) - min=1

### Backend
- בדיקת קיום ארגון (404 אם לא קיים)
- ולידציה של `contact_email` כ-EmailStr
- שמירת `updated_at` timestamp אוטומטית

## הרשאות
- **רק Super Admin** יכול לגשת לדף זה
- בדיקת `user.is_super_admin` ב-Frontend
- בדיקת `require_super_admin(request)` ב-Backend
- ניווט אוטומטי ל-`/login` או `/dashboard` למשתמשים לא מורשים

## UX/UI Features

### טוען (Loading State)
- Spinner במרכז העמוד בזמן טעינת נתונים
- הודעת "שומר..." על כפתור השמירה

### כפתור חזרה
- חזרה לדף ניהול ארגונים עם ניווט breadcrumb

### Responsive Design
- Grid layout 2 עמודות ב-desktop
- עמודה אחת ב-mobile
- טופס עם shadow + rounded corners

### סטטיסטיקות חיות
- 4 כרטיסים עם נתונים עדכניים:
  - משאיות (מתוך מקסימום)
  - נהגים (מתוך מקסימום)
  - נסיעות הושלמו
  - סטטוס (פעיל/מושעה/נסיון)
- צבעי רקע: ירוק (פעיל), אדום (מושעה), צהוב (נסיון)

## דוגמת שימוש

```typescript
// טעינת נתוני ארגון
const response = await superAdminApi.getOrganization('org-uuid-here')
// response.data: OrganizationDetail עם stats

// עדכון ארגון
await superAdminApi.updateOrganization('org-uuid-here', {
  name: 'חברת הובלות חדשה',
  display_name: 'הובלות חדשה',
  contact_name: 'ישראל ישראלי',
  contact_phone: '050-1234567',
  contact_email: 'israel@company.com',
  vat_id: '123456789',
  plan_type: 'professional',
  max_trucks: 50,
  max_drivers: 60
})
```

## בדיקות

### ✅ נבדק
1. טעינת דף עריכה עם נתוני ארגון קיימים
2. עדכון פרטים בסיסיים (שם, שם תצוגה)
3. עדכון פרטי קשר (טלפון, אימייל, ח.פ)
4. עדכון תוכנית ומגבלות
5. שמירה מוצלחת ל-DB
6. חזרה אוטומטית לדף ניהול ארגונים
7. הגנת הרשאות (רק Super Admin)

### 🔄 לבדיקה עתידית
- עדכון שדות נוספים (כתובת, עיר, מדינה)
- העלאת לוגו
- הגדרות branding (צבעים, דומיין מותאם)
- מניעת הקטנת מגבלות מתחת לשימוש קיים

## קבצים שנוצרו/שונו

### נוצרו
1. `frontend/src/app/super-admin/organizations/[id]/page.tsx` (~330 שורות)

### שונו
1. `backend/app/api/v1/endpoints/super_admin.py` - הוספת `vat_id` ל-OrganizationUpdate
2. `frontend/src/lib/api.ts` - עדכון TypeScript interface

### קיימים (לא שונו)
- `frontend/src/app/super-admin/page.tsx` - כבר כלל כפתור "ערוך"
- `backend/app/models/organization.py` - המודל כבר תמך בכל השדות

## סיכום
התכונה מאפשרת עריכה מלאה של ארגונים ישירות מהממשק, כולל:
- ✅ שם חברה ושם תצוגה
- ✅ מספר טלפון
- ✅ פרטי קשר מלאים
- ✅ תוכנית ומגבלות
- ✅ סטטיסטיקות בזמן אמת
- ✅ ממשק משתמש נוח ואינטואיטיבי
