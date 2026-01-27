# מערכת הרשאות - מדריך שימוש

## סקירה כללית

המערכת כוללת בדיקת הרשאות מלאה שמגבילה גישה לפיצ'רים בהתאם להרשאות שהמשתמש קיבל.

## רכיבים עיקריים

### 1. **usePermissions Store**
מנהל את ההרשאות של המשתמש הנוכחי.

```typescript
import { usePermissions, Permissions } from '@/lib/stores/permissions'

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

// בדיקת הרשאה בודדת
if (hasPermission(Permissions.CUSTOMERS_VIEW)) {
  // הצג לקוחות
}

// בדיקת לפחות אחת מההרשאות
if (hasAnyPermission([Permissions.JOBS_CREATE, Permissions.JOBS_EDIT])) {
  // הצג כפתור יצירה או עריכה
}

// בדיקת כל ההרשאות
if (hasAllPermissions([Permissions.BILLING_VIEW, Permissions.BILLING_EDIT])) {
  // הצג ממשק מלא של חיוב
}
```

### 2. **Protected Component**
רכיב לעטיפת תוכן שדורש הרשאות.

```tsx
import { Protected } from '@/components/auth/Protected'
import { Permissions } from '@/lib/stores/permissions'

// הרשאה בודדת
<Protected permission={Permissions.CUSTOMERS_VIEW}>
  <CustomersList />
</Protected>

// לפחות אחת מההרשאות
<Protected anyPermission={[Permissions.JOBS_CREATE, Permissions.JOBS_EDIT]}>
  <CreateJobButton />
</Protected>

// כל ההרשאות
<Protected allPermissions={[Permissions.BILLING_VIEW, Permissions.BILLING_EDIT]}>
  <BillingPanel />
</Protected>

// עם fallback
<Protected 
  permission={Permissions.CUSTOMERS_VIEW}
  fallback={<div>אין הרשאה לצפות בלקוחות</div>}
>
  <CustomersList />
</Protected>
```

### 3. **Hooks לבדיקת הרשאות**

```tsx
import { useHasPermission, useHasAnyPermission } from '@/components/auth/Protected'

function MyComponent() {
  const canEdit = useHasPermission(Permissions.CUSTOMERS_EDIT)
  const canManageJobs = useHasAnyPermission([
    Permissions.JOBS_CREATE, 
    Permissions.JOBS_EDIT, 
    Permissions.JOBS_DELETE
  ])

  return (
    <div>
      {canEdit && <button>ערוך</button>}
      {canManageJobs && <JobsManager />}
    </div>
  )
}
```

### 4. **NoPermission Component**
מסך הודעה יפה כאשר אין הרשאות.

```tsx
import NoPermission from '@/components/auth/NoPermission'
import { useHasPermission } from '@/components/auth/Protected'
import { Permissions } from '@/lib/stores/permissions'

function CustomersPage() {
  const canView = useHasPermission(Permissions.CUSTOMERS_VIEW)

  if (!canView) {
    return <NoPermission message="אין לך הרשאה לצפות בלקוחות" />
  }

  return <CustomersList />
}
```

## רשימת כל ההרשאות

### דשבורד
- `dashboard.view` - צפייה בדשבורד

### דוחות
- `reports.view` - צפייה בדוחות
- `reports.financial` - דוחות פיננסיים

### נסיעות
- `jobs.view` - צפייה בנסיעות
- `jobs.create` - יצירת נסיעות
- `jobs.edit` - עריכת נסיעות
- `jobs.delete` - מחיקת נסיעות
- `jobs.assign` - שיבוץ נהגים (Dispatch)
- `jobs.close` - סגירת נסיעות

### לקוחות
- `customers.view` - צפייה בלקוחות
- `customers.create` - יצירת לקוחות
- `customers.edit` - עריכת לקוחות

### אתרים
- `sites.view` - צפייה באתרים
- `sites.create` - יצירת אתרים

### צי רכבים
- `fleet.view` - צפייה בצי
- `fleet.create` - הוספת רכבים
- `fleet.edit` - עריכת רכבים
- `fleet.drivers` - ניהול נהגים
- `fleet.trucks` - ניהול משאיות

### חיוב
- `billing.view` - צפייה בחשבוניות
- `billing.create` - יצירת חשבוניות
- `billing.edit` - עריכת חשבוניות
- `billing.send` - שליחת חשבוניות

### מחירון
- `pricing.view` - צפייה במחירון
- `pricing.edit` - עריכת מחירון

### מערכת
- `system.settings` - הגדרות מערכת
- `system.users` - ניהול משתמשים
- `system.backup` - גיבויים
- `system.audit` - לוגים

### תשלומים
- `payments.view` - צפייה בתשלומים

## דוגמאות שימוש מעשיות

### דוגמה 1: הסתרת כפתורים לפי הרשאות

```tsx
import { useHasPermission } from '@/components/auth/Protected'
import { Permissions } from '@/lib/stores/permissions'

function CustomerCard({ customer }) {
  const canEdit = useHasPermission(Permissions.CUSTOMERS_EDIT)

  return (
    <div className="card">
      <h3>{customer.name}</h3>
      <p>{customer.email}</p>
      
      {canEdit && (
        <button onClick={() => editCustomer(customer.id)}>
          ערוך לקוח
        </button>
      )}
    </div>
  )
}
```

### דוגמה 2: הגנה על דף שלם

```tsx
'use client'

import { useAuth } from '@/lib/stores/auth'
import { useHasPermission } from '@/components/auth/Protected'
import { Permissions } from '@/lib/stores/permissions'
import NoPermission from '@/components/auth/NoPermission'
import DashboardLayout from '@/components/layout/DashboardLayout'

export default function PricingPage() {
  const { user } = useAuth()
  const canViewPricing = useHasPermission(Permissions.PRICING_VIEW)
  const canEditPricing = useHasPermission(Permissions.PRICING_EDIT)

  // Super Admin עובר ישירות
  if (!user?.is_super_admin && !canViewPricing) {
    return (
      <DashboardLayout>
        <NoPermission message="אין לך הרשאה לצפות במחירון" />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div>
        <h1>מחירון</h1>
        <PriceList canEdit={canEditPricing} />
      </div>
    </DashboardLayout>
  )
}
```

### דוגמה 3: תפריט דינמי

```tsx
// התפריט הצידי כבר משתמש בזה!
// ראה: /frontend/src/components/layout/DashboardLayout.tsx

{(user?.is_super_admin || hasPermission(Permissions.CUSTOMERS_VIEW)) && (
  <MenuItem href="/customers" icon="👨‍💼">
    לקוחות
  </MenuItem>
)}
```

## טיפים חשובים

1. **Super Admin תמיד עובר** - אין צורך לבדוק הרשאות עבור Super Admin
2. **טען הרשאות בהתחלה** - ההרשאות נטענות אוטומטית בזמן login
3. **השתמש ב-Protected** - עדיף להשתמש ב-`<Protected>` מאשר בדיקות ידניות
4. **הצג הודעה ברורה** - תמיד השתמש ב-`NoPermission` לדפים מוגנים
5. **בדוק גם בבק-אנד** - הרשאות בפרונט-אנד זה רק UI, חייב לבדוק גם בשרת

## בדיקה

### התחבר כסדרן
```bash
# משתמש: 0501234568
# סיסמה: demo123
# הרשאות: dashboard, customers, fleet
```

המשתמש **לא** יראה:
- תפריט "פיננסים"
- תפריט "דוחות" (אלא אם יש reports.view)
- אפשרות לערוך מחירון
- ניהול משתמשים

המשתמש **יראה**:
- דשבורד
- לקוחות (view, create, edit)
- צי רכבים (view)
- נסיעות (view, create, assign)
