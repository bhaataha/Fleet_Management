# איפיון מערכת Multi-Tenant - TruckFlow

## 📋 תוכן עניינים

1. [סקירה כללית](#1-סקירה-כללית)
2. [ארכיטקטורה ושכבת Isolation](#2-ארכיטקטורה-ושכבת-isolation)
3. [מודל נתונים](#3-מודל-נתונים)
4. [Super Admin Dashboard](#4-super-admin-dashboard)
5. [Tenant Management](#5-tenant-management)
6. [API Changes](#6-api-changes)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Billing & Subscriptions](#8-billing--subscriptions)
9. [Data Migration](#9-data-migration)
10. [Security & Compliance](#10-security--compliance)
11. [UI/UX Changes](#11-uiux-changes)
12. [Technical Implementation](#12-technical-implementation)
13. [Testing Strategy](#13-testing-strategy)
14. [Deployment Plan](#14-deployment-plan)

---

## 1. סקירה כללית

### 1.1 מה זה Multi-Tenant?

**Multi-Tenancy** = מערכת אחת משרתת מספר ארגונים (Tenants) בצורה מבודדת ומאובטחת.

**דוגמה**:
- **Tenant 1**: חברת "הובלות הנגב" - 15 משאיות
- **Tenant 2**: חברת "משאיות הצפון" - 8 משאיות
- **Tenant 3**: חברת "טרנס-קארגו" - 25 משאיות

כל אחת רואה **רק את הנתונים שלها**.

### 1.2 יתרונות

✅ **לספק (TruckFlow)**:
- מכירת מנויים לכמה חברות במקביל
- אחזקה של קוד אחד (לא deployment נפרד לכל לקוח)
- עדכונים אוטומטיים לכולם
- ניהול מרכזי של תשתיות
- Analytics צולבת (aggregate data)

✅ **ללקוח**:
- אין צורך בהתקנה/תחזוקה
- עדכונים אוטומטיים
- גיבויים מנוהלים
- SLA מובטח
- מחיר נמוך יותר (SaaS)

### 1.3 דרישות עסקיות

1. **בידוד מוחלט**: Tenant לא יכול לראות נתונים של Tenant אחר
2. **Super Admin**: ממשק ניהול לספק (TruckFlow)
3. **Self-Service**: לקוח יכול להירשם ולהתחיל מיידית (trial)
4. **Billing**: מנויים לפי תוכניות (Starter/Pro/Enterprise)
5. **Custom Domains**: אופציה לקוחות Enterprise - `trucks.negev-transport.co.il`
6. **Branding**: לוגו + צבעים של הלקוח (White label - Phase 2)
7. **Limits**: הגבלות לפי תוכנית (5/20/unlimited trucks)

---

## 2. ארכיטקטורה ושכבת Isolation

### 2.1 גישות אפשריות

#### אופציה 1: Shared Database + Row-Level Security (מומלץ ל-MVP)
```
┌─────────────────────────────────────┐
│         PostgreSQL Database          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │ users (org_id)                 │ │
│  │ - id: 1, name: "משה", org: A  │ │
│  │ - id: 2, name: "דוד", org: B  │ │
│  ├────────────────────────────────┤ │
│  │ jobs (org_id)                  │ │
│  │ - id: 1, customer_id, org: A  │ │
│  │ - id: 2, customer_id, org: B  │ │
│  └────────────────────────────────┘ │
└─────────────────────────────────────┘
```

**יתרונות**:
- פשוט יחסית
- קל למיגרציה
- Queries יעילים
- גיבוי פשוט (DB אחד)

**חסרונות**:
- חייב filter לפי `org_id` בכל query
- סיכון security (bug אחד = דליפת נתונים)

---

#### אופציה 2: Database per Tenant (לעתיד/Enterprise)
```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   DB_ORG_A  │  │   DB_ORG_B  │  │   DB_ORG_C  │
│ ─────────── │  │ ─────────── │  │ ─────────── │
│ users       │  │ users       │  │ users       │
│ jobs        │  │ jobs        │  │ jobs        │
│ customers   │  │ customers   │  │ customers   │
└─────────────┘  └─────────────┘  └─────────────┘
```

**יתרונות**:
- בידוד מוחלט
- ביצועים (DB קטן יותר)
- Security מקסימלי
- גיבוי נפרד (לקוח יכול לקבל export של ה-DB שלו)

**חסרונות**:
- מורכב (ניהול מספר DBs)
- עדכוני סכמה (צריך לעדכן כל DB)
- יקר (PostgreSQL instance לכל tenant)

---

### 2.2 החלטה: Shared DB עם Row-Level Security

**הסיבה**: MVP, עלות נמוכה, פשוט למיגרציה, מספיק עד 100-200 tenants.

**שכבת Security**:
1. כל טבלה מכילה `org_id` (organization_id)
2. כל query מוסיף WHERE `org_id = :current_org_id`
3. Middleware ב-FastAPI חוסם requests עם org_id לא נכון
4. Database Constraints (Foreign Keys כוללים org_id)
5. PostgreSQL Row-Level Security Policies (תכונה מובנית)

---

## 3. מודל נתונים

### 3.1 טבלה חדשה: `organizations`

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL, -- URL-friendly: "negev-transport"
  display_name VARCHAR(200), -- "הובלות הנגב בע״מ"
  
  -- Contact
  contact_name VARCHAR(200),
  contact_email VARCHAR(255) UNIQUE NOT NULL,
  contact_phone VARCHAR(20),
  vat_id VARCHAR(50), -- ח.פ / ע.מ
  
  -- Address
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(3) DEFAULT 'ISR',
  
  -- Subscription
  plan_type VARCHAR(50) NOT NULL DEFAULT 'trial', 
    -- 'trial', 'starter', 'professional', 'enterprise', 'suspended'
  plan_start_date DATE,
  plan_end_date DATE, -- NULL = unlimited
  trial_ends_at TIMESTAMP WITH TIME ZONE,
  
  -- Limits (from plan)
  max_trucks INTEGER DEFAULT 5,
  max_drivers INTEGER DEFAULT 10,
  max_storage_gb INTEGER DEFAULT 10,
  features_json JSONB DEFAULT '{}', -- {"gps_tracking": true, "api_access": false}
  
  -- Billing
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- 'monthly', 'yearly'
  billing_email VARCHAR(255),
  last_payment_date DATE,
  next_billing_date DATE,
  total_paid DECIMAL(10,2) DEFAULT 0,
  
  -- Settings
  timezone VARCHAR(50) DEFAULT 'Asia/Jerusalem',
  locale VARCHAR(10) DEFAULT 'he',
  currency VARCHAR(3) DEFAULT 'ILS',
  settings_json JSONB DEFAULT '{}',
  
  -- Branding (White Label - Phase 2)
  logo_url TEXT,
  primary_color VARCHAR(7), -- #3B82F6
  custom_domain VARCHAR(255), -- trucks.negev-transport.co.il
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active', 
    -- 'active', 'trial', 'suspended', 'cancelled'
  suspended_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- Stats (cached)
  total_trucks INTEGER DEFAULT 0,
  total_drivers INTEGER DEFAULT 0,
  total_jobs_completed INTEGER DEFAULT 0,
  storage_used_gb DECIMAL(10,2) DEFAULT 0
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status);
CREATE INDEX idx_organizations_plan_type ON organizations(plan_type);
```

---

### 3.2 עדכון טבלאות קיימות

**כל טבלה מקבלת `org_id`**:

```sql
-- Example: users table
ALTER TABLE users 
  ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_users_org_id ON users(org_id);

-- Example: jobs table
ALTER TABLE jobs 
  ADD COLUMN org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE;

CREATE INDEX idx_jobs_org_id ON jobs(org_id);
```

**רשימת טבלאות לעדכן**:
- ✅ users (org_id + role מורחב)
- ✅ customers (org_id)
- ✅ sites (org_id)
- ✅ drivers (org_id)
- ✅ trucks (org_id)
- ✅ trailers (org_id)
- ✅ materials (org_id או NULL = global)
- ✅ price_lists (org_id)
- ✅ jobs (org_id)
- ✅ job_status_events (org_id)
- ✅ delivery_notes (org_id)
- ✅ weigh_tickets (org_id)
- ✅ files (org_id)
- ✅ job_files (org_id דרך job)
- ✅ statements (org_id)
- ✅ statement_lines (org_id דרך statement)
- ✅ payments (org_id)
- ✅ payment_allocations (org_id דרך payment)
- ✅ expenses (org_id)

---

### 3.3 טבלה חדשה: `subscriptions` (Billing)

```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Plan
  plan_type VARCHAR(50) NOT NULL, -- 'starter', 'professional', 'enterprise'
  billing_cycle VARCHAR(20) NOT NULL, -- 'monthly', 'yearly'
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  discount_percent DECIMAL(5,2) DEFAULT 0,
  final_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  
  -- Dates
  start_date DATE NOT NULL,
  end_date DATE, -- NULL = active/renewing
  next_billing_date DATE NOT NULL,
  
  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- 'active', 'past_due', 'cancelled', 'expired'
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancel_reason TEXT
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions(org_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON subscriptions(next_billing_date);
```

---

### 3.4 טבלה חדשה: `invoices` (חשבוניות מנוי)

```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id),
  
  -- Invoice Info
  invoice_number VARCHAR(50) UNIQUE NOT NULL, -- "INV-2026-001"
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10,2) NOT NULL,
  tax_percent DECIMAL(5,2) DEFAULT 17.00, -- מע״מ
  tax_amount DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ILS',
  
  -- Payment
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
    -- 'pending', 'paid', 'overdue', 'cancelled'
  paid_at TIMESTAMP WITH TIME ZONE,
  payment_method VARCHAR(50), -- 'credit_card', 'bank_transfer', 'check'
  payment_reference VARCHAR(255),
  
  -- Files
  pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT
);

CREATE INDEX idx_invoices_org_id ON invoices(org_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
```

---

### 3.5 טבלה חדשה: `usage_logs` (מעקב שימוש)

```sql
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Metric
  metric_type VARCHAR(50) NOT NULL,
    -- 'trucks_count', 'drivers_count', 'jobs_created', 'storage_used', 'api_calls'
  metric_value DECIMAL(15,2) NOT NULL,
  metric_unit VARCHAR(20), -- 'count', 'GB', 'calls'
  
  -- Time
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  date DATE NOT NULL,
  hour INTEGER, -- 0-23 for hourly tracking
  
  -- Metadata
  metadata_json JSONB DEFAULT '{}'
);

CREATE INDEX idx_usage_logs_org_date ON usage_logs(org_id, date);
CREATE INDEX idx_usage_logs_metric ON usage_logs(metric_type, date);
```

---

### 3.6 עדכון `users` - תפקידים חדשים

```sql
ALTER TABLE users 
  ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE,
  ADD COLUMN org_role VARCHAR(50) DEFAULT 'user';
    -- 'owner', 'admin', 'dispatcher', 'accounting', 'driver', 'user'

-- Super Admin = ניהול כל המערכת (TruckFlow staff)
-- Owner = בעלים של הארגון (הרשום ראשון)
-- Admin = מנהל ארגון (יכול להוסיף משתמשים)
```

---

## 4. Super Admin Dashboard

### 4.1 מסך ראשי

**URL**: `/super-admin` (נדרש `is_super_admin = true`)

**Layout**:
```
┌────────────────────────────────────────────────────┐
│  TruckFlow Super Admin                    [משתמש] │
├────────────────────────────────────────────────────┤
│  📊 Dashboard  │  🏢 Organizations  │  💳 Billing  │
│  👥 Users      │  📈 Analytics      │  ⚙️ Settings │
├────────────────────────────────────────────────────┤
│                                                     │
│  📊 סטטיסטיקות כלליות                              │
│  ┌──────────┬──────────┬──────────┬──────────┐    │
│  │ 127      │ 1,234    │ 45       │ ₪125K    │    │
│  │ ארגונים  │ משתמשים  │ חדשים   │ MRR      │    │
│  │ פעילים   │ כולל     │ החודש   │ הכנסה    │    │
│  └──────────┴──────────┴──────────┴──────────┘    │
│                                                     │
│  📈 גרף: הכנסות לפי חודש (12 חודשים אחרונים)      │
│  [תרשים עמודות]                                    │
│                                                     │
│  🏢 ארגונים אחרונים                                │
│  [טבלה: שם, תוכנית, נרשם, סטטוס, פעולות]         │
│                                                     │
│  ⚠️ התראות                                         │
│  • 3 ארגונים עוברים ל-overdue בעוד 7 ימים        │
│  • 2 ארגונים עברו את limit של trucks              │
│  • 5 ארגונים trial מסתיים בעוד 3 ימים            │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

### 4.2 מסך Organizations

**טבלה**:
```
┌─────┬──────────────┬──────────┬────────┬──────────┬────────┬─────────┐
│ ID  │ שם הארגון    │ תוכנית  │ סטטוס  │ נרשם     │ MRR    │ פעולות │
├─────┼──────────────┼──────────┼────────┼──────────┼────────┼─────────┤
│ 001 │ הובלות הנגב │ Pro      │ 🟢     │ 15/12/25 │ ₪2490  │ [👁️📝🗑️]│
│ 002 │ משאיות הצפון│ Starter  │ 🟡     │ 20/01/26 │ ₪990   │ [👁️📝🗑️]│
│ 003 │ טרנס-קארגו  │ Ent.     │ 🟢     │ 10/11/25 │ Custom │ [👁️📝🗑️]│
│ 004 │ דרום שירות  │ Trial    │ ⏰     │ 22/01/26 │ ₪0     │ [👁️📝🗑️]│
│ 005 │ חיפה הובלות │ Starter  │ 🔴     │ 05/01/26 │ ₪0     │ [👁️📝🗑️]│
└─────┴──────────────┴──────────┴────────┴──────────┴────────┴─────────┘

סטטוס:
🟢 Active (שילם, פעיל)
🟡 Trial (תקופת ניסיון)
⏰ Trial Ending (נגמר בקרוב)
🔴 Suspended (מושעה, לא שילם)
⚫ Cancelled (מבוטל)
```

**פילטרים**:
- Status: All / Active / Trial / Suspended / Cancelled
- Plan: All / Starter / Professional / Enterprise
- Sort by: Created date / MRR / Name / Status

**פעולות**:
- 👁️ View Details
- 📝 Edit Settings
- 🗑️ Delete/Cancel
- ▶️ Activate (אם suspended)
- ⏸️ Suspend (אם לא שילם)

---

### 4.3 מסך Organization Details

**URL**: `/super-admin/organizations/:id`

```
┌────────────────────────────────────────────────────┐
│  ← Back to List          הובלות הנגב בע״מ          │
├────────────────────────────────────────────────────┤
│  📊 Overview  │  👥 Users  │  💳 Billing  │ 📈 Usage│
├────────────────────────────────────────────────────┤
│                                                     │
│  📋 פרטי ארגון                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ שם: הובלות הנגב בע״מ                         │ │
│  │ Slug: negev-transport                         │ │
│  │ ח.פ: 123456789                                │ │
│  │ אימייל: office@negev-transport.co.il         │ │
│  │ טלפון: 050-1234567                            │ │
│  │ נרשם: 15/12/2025                              │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  💳 מנוי נוכחי                                     │
│  ┌──────────────────────────────────────────────┐ │
│  │ תוכנית: Professional (₪2490/חודש)            │ │
│  │ סטטוס: 🟢 Active                              │ │
│  │ התחיל: 15/12/2025                             │ │
│  │ חידוש הבא: 15/02/2026                         │ │
│  │ [שנה תוכנית] [השהה] [בטל]                    │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  📊 שימוש נוכחי                                    │
│  ┌──────────────────────────────────────────────┐ │
│  │ משאיות: 12 / 20 (60%)                        │ │
│  │ [██████────────────]                          │ │
│  │                                                │ │
│  │ נהגים: 18 / 40 (45%)                         │ │
│  │ [█████─────────────]                          │ │
│  │                                                │ │
│  │ אחסון: 8.3GB / 50GB (17%)                    │ │
│  │ [███───────────────]                          │ │
│  └──────────────────────────────────────────────┘ │
│                                                     │
│  📈 סטטיסטיקות חודש אחרון                         │
│  • נסיעות: 456                                    │
│  • משתמשים פעילים: 22                             │
│  • Login events: 1,234                            │
│                                                     │
│  ⚙️ הגדרות מתקדמות                                │
│  [✓] API Access                                   │
│  [✓] GPS Tracking                                 │
│  [ ] White Label                                  │
│  [ ] Custom Domain                                │
│                                                     │
│  🚨 פעולות מנהל                                   │
│  [Login as Org Admin] [Reset Password]            │
│  [Export Data] [Delete Organization]              │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

### 4.4 מסך Billing

**חשבוניות מנויים**:
```
┌─────┬──────────────┬────────────┬────────┬──────────┬────────┬─────────┐
│ #   │ ארגון        │ תאריך      │ סכום   │ סטטוס    │ תשלום  │ פעולות │
├─────┼──────────────┼────────────┼────────┼──────────┼────────┼─────────┤
│ 245 │ הובלות הנגב │ 15/01/2026 │ ₪2490  │ ✅ Paid  │ CC     │ [👁️📄] │
│ 244 │ משאיות הצפון│ 20/01/2026 │ ₪990   │ ⏰ Due   │ -      │ [👁️📄] │
│ 243 │ טרנס-קארגו  │ 10/01/2026 │ ₪4500  │ ✅ Paid  │ Wire   │ [👁️📄] │
│ 242 │ דרום שירות  │ 05/01/2026 │ ₪990   │ 🔴 Over  │ -      │ [👁️📄] │
└─────┴──────────────┴────────────┴────────┴──────────┴────────┴─────────┘

סטטוס:
✅ Paid (שולם)
⏰ Due (לתשלום - עוד לא overdue)
🔴 Overdue (באיחור)
❌ Cancelled (מבוטל)
```

**פילטרים**:
- Status: All / Paid / Due / Overdue
- Date Range: Last 30 days / This month / Last 3 months / Custom

**סטטיסטיקות למעלה**:
- MRR (Monthly Recurring Revenue): ₪125,000
- Overdue: ₪8,500 (4 invoices)
- Projected this month: ₪132,000

---

### 4.5 מסך Analytics

**דוחות מרכזיים**:

1. **Revenue Over Time** (הכנסות לאורך זמן)
   - תרשים קו: 12 חודשים אחרונים
   - MRR vs Actual (חודשי vs שנתי)

2. **Churn Rate** (שיעור עזיבה)
   - תרשים: כמה ארגונים ביטלו לפי חודש
   - % churn

3. **Growth Metrics**
   - New signups per month
   - Trial → Paid conversion rate
   - Average subscription duration

4. **Usage Metrics**
   - Total trucks managed across all orgs
   - Total jobs completed
   - Storage used (aggregate)

5. **Top Organizations** (לפי revenue)
   - טבלה: Top 20 paying customers

6. **Plan Distribution**
   - Pie chart: Starter / Professional / Enterprise / Trial

---

## 5. Tenant Management

### 5.1 Signup Flow (Self-Service)

**URL**: `/signup` (קיים, צריך עדכון)

**שלבים**:

#### שלב 1: פרטי חברה
```
┌────────────────────────────────────────────┐
│      הרשמו ל-TruckFlow                      │
│      התחל תקופת ניסיון חינם ל-14 יום       │
├────────────────────────────────────────────┤
│                                             │
│  שם החברה *                                 │
│  [___________________________]             │
│                                             │
│  ח.פ / ע.מ                                 │
│  [___________________________]             │
│                                             │
│  כתובת אימייל *                            │
│  [___________________________]             │
│                                             │
│  טלפון *                                   │
│  [___________________________]             │
│                                             │
│  כמה משאיות יש לכם?                       │
│  [▼ בחר...]                                │
│     1-5 משאיות                             │
│     6-10 משאיות                            │
│     11-20 משאיות                           │
│     21+ משאיות                             │
│                                             │
│  [המשך ←]                                  │
│                                             │
└────────────────────────────────────────────┘
```

#### שלב 2: פרטי מנהל
```
┌────────────────────────────────────────────┐
│      הגדרת חשבון מנהל                       │
├────────────────────────────────────────────┤
│                                             │
│  שם מלא *                                   │
│  [___________________________]             │
│                                             │
│  סיסמה *                                   │
│  [___________________________]             │
│                                             │
│  אימות סיסמה *                             │
│  [___________________________]             │
│                                             │
│  □ אני מאשר את תנאי השימוש ומדיניות        │
│    הפרטיות                                 │
│                                             │
│  [← חזור]    [צור חשבון ←]                │
│                                             │
└────────────────────────────────────────────┘
```

#### שלב 3: בחירת תוכנית (אופציונלי - אפשר לדחות לאחר trial)
```
┌────────────────────────────────────────────┐
│      בחר את התוכנית שלך                     │
│      (אפשר לשנות בכל עת)                   │
├────────────────────────────────────────────┤
│                                             │
│  ○ Starter - ₪990/חודש                    │
│     עד 5 משאיות, 10 נהגים                 │
│                                             │
│  ● Professional - ₪2490/חודש              │
│     עד 20 משאיות, 40 נהגים (מומלץ)        │
│                                             │
│  ○ Enterprise - הצעת מחיר מותאמת           │
│     ללא הגבלה + תמיכה ייעודית              │
│                                             │
│  [דלג לעכשיו]    [המשך לתשלום ←]          │
│                                             │
└────────────────────────────────────────────┘
```

#### שלב 4: הצלחה!
```
┌────────────────────────────────────────────┐
│      ✅ החשבון נוצר בהצלחה!                │
├────────────────────────────────────────────┤
│                                             │
│  ברוכים הבאים ל-TruckFlow!                 │
│                                             │
│  תקופת הניסיון שלכם מתחילה היום ונמשכת     │
│  14 יום (עד 08/02/2026)                   │
│                                             │
│  נשלחנו אליכם אימייל עם פרטי התחברות.     │
│                                             │
│  הצעדים הבאים:                             │
│  1. הוסף משאיות ונהגים                     │
│  2. צור את הנסיעה הראשונה                  │
│  3. נסה את אפליקציית הנהגים                │
│                                             │
│  [כניסה למערכת ←]                          │
│                                             │
└────────────────────────────────────────────┘
```

**Backend Logic**:
```python
@router.post("/signup")
async def signup(signup_data: SignupSchema):
    # 1. Create organization
    org = Organization.create(
        name=signup_data.company_name,
        slug=slugify(signup_data.company_name),
        contact_email=signup_data.email,
        contact_phone=signup_data.phone,
        vat_id=signup_data.vat_id,
        plan_type='trial',
        trial_ends_at=datetime.now() + timedelta(days=14),
        status='trial',
        max_trucks=5,  # Trial limits
        max_drivers=10,
        max_storage_gb=5
    )
    
    # 2. Create owner user
    user = User.create(
        org_id=org.id,
        name=signup_data.full_name,
        email=signup_data.email,
        password=hash_password(signup_data.password),
        org_role='owner',
        is_active=True
    )
    
    # 3. Send welcome email
    send_welcome_email(org, user)
    
    # 4. Create default data (optional)
    create_default_materials(org.id)
    
    return {"org_id": org.id, "user_id": user.id}
```

---

### 5.2 מסך Organization Settings (בתוך המערכת)

**URL**: `/settings/organization` (נראה ל-Owner/Admin בלבד)

```
┌────────────────────────────────────────────────────┐
│  הגדרות ארגון                                      │
├────────────────────────────────────────────────────┤
│  📋 פרטי חברה  │  💳 מנוי  │  👥 משתמשים  │ ⚙️    │
├────────────────────────────────────────────────────┤
│                                                     │
│  שם החברה                                          │
│  [הובלות הנגב בע״מ_______________]                │
│                                                     │
│  ח.פ / ע.מ                                        │
│  [123456789_________________________]             │
│                                                     │
│  אימייל                                            │
│  [office@negev-transport.co.il________]           │
│                                                     │
│  טלפון                                             │
│  [050-1234567_______________________]             │
│                                                     │
│  כתובת                                             │
│  [רח׳ הנגב 15, באר שבע______________]             │
│                                                     │
│  [שמור שינויים]                                    │
│                                                     │
└────────────────────────────────────────────────────┘
```

**Tab "מנוי"**:
```
┌────────────────────────────────────────────────────┐
│  💳 המנוי שלכם                                     │
├────────────────────────────────────────────────────┤
│                                                     │
│  תוכנית נוכחית: Professional                      │
│  סטטוס: 🟢 פעיל                                   │
│  מחיר: ₪2,490 לחודש                               │
│  חידוש הבא: 15/02/2026                            │
│                                                     │
│  [שנה תוכנית]  [בטל מנוי]                         │
│                                                     │
├────────────────────────────────────────────────────┤
│  📊 שימוש נוכחי                                    │
│                                                     │
│  משאיות: 12 / 20                                   │
│  [██████────────────] 60%                          │
│                                                     │
│  נהגים: 18 / 40                                    │
│  [█████─────────────] 45%                          │
│                                                     │
│  אחסון: 8.3GB / 50GB                               │
│  [███───────────────] 17%                          │
│                                                     │
├────────────────────────────────────────────────────┤
│  📄 חשבוניות אחרונות                              │
│                                                     │
│  • 15/01/2026 - ₪2,490 (✅ שולם)                  │
│  • 15/12/2025 - ₪2,490 (✅ שולם)                  │
│  • 15/11/2025 - ₪2,490 (✅ שולם)                  │
│                                                     │
│  [צפה בכל החשבוניות]                              │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

## 6. API Changes

### 6.1 Middleware: Tenant Context

**FastAPI Middleware**:
```python
# backend/app/middleware/tenant.py

from fastapi import Request, HTTPException
from app.core.database import get_db

async def tenant_middleware(request: Request, call_next):
    """
    Extract org_id from JWT token and inject into request state.
    All subsequent queries must filter by this org_id.
    """
    
    # Skip for public endpoints
    if request.url.path in ["/api/auth/login", "/api/auth/signup", "/api/health"]:
        return await call_next(request)
    
    # Extract user from JWT
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        raise HTTPException(401, "Missing authentication token")
    
    user = decode_jwt(token)
    if not user:
        raise HTTPException(401, "Invalid token")
    
    # Inject org_id into request state
    request.state.org_id = user.get("org_id")
    request.state.user_id = user.get("user_id")
    request.state.is_super_admin = user.get("is_super_admin", False)
    
    # Super admins can specify org_id in header (for impersonation)
    if request.state.is_super_admin:
        impersonate_org = request.headers.get("X-Org-Id")
        if impersonate_org:
            request.state.org_id = impersonate_org
    
    response = await call_next(request)
    return response
```

---

### 6.2 Database Query Helper

```python
# backend/app/core/tenant.py

from fastapi import Request, HTTPException
from sqlalchemy.orm import Query

def get_org_id(request: Request) -> str:
    """Get current org_id from request state."""
    org_id = getattr(request.state, "org_id", None)
    if not org_id:
        raise HTTPException(403, "Organization context missing")
    return org_id

def tenant_filter(query: Query, request: Request) -> Query:
    """Apply org_id filter to SQLAlchemy query."""
    org_id = get_org_id(request)
    return query.filter_by(org_id=org_id)

# Usage example:
@router.get("/api/jobs")
async def get_jobs(request: Request, db: Session = Depends(get_db)):
    org_id = get_org_id(request)
    jobs = db.query(Job).filter(Job.org_id == org_id).all()
    return jobs
```

---

### 6.3 Updated Endpoints

**כל endpoint חייב לכלול `org_id` filter**:

```python
# Before (Single-tenant):
@router.get("/api/customers")
async def get_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()  # ❌ לא בטוח!

# After (Multi-tenant):
@router.get("/api/customers")
async def get_customers(
    request: Request, 
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    return db.query(Customer).filter(Customer.org_id == org_id).all()  # ✅
```

**Create Endpoints**:
```python
@router.post("/api/customers")
async def create_customer(
    customer_data: CustomerCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    org_id = get_org_id(request)
    
    # Auto-inject org_id
    customer = Customer(
        **customer_data.dict(),
        org_id=org_id
    )
    
    db.add(customer)
    db.commit()
    return customer
```

---

### 6.4 Super Admin Endpoints

**URL Prefix**: `/api/super-admin/*`

```python
# Get all organizations
GET /api/super-admin/organizations
  ?status=active
  &plan=professional
  &page=1&limit=50

# Get single organization
GET /api/super-admin/organizations/:id

# Create organization (manual)
POST /api/super-admin/organizations
{
  "name": "חברה חדשה",
  "contact_email": "contact@company.com",
  "plan_type": "professional"
}

# Update organization
PATCH /api/super-admin/organizations/:id
{
  "status": "suspended",
  "suspended_reason": "לא שילם"
}

# Delete organization (soft delete)
DELETE /api/super-admin/organizations/:id

# Get organization stats
GET /api/super-admin/organizations/:id/stats

# Get organization usage logs
GET /api/super-admin/organizations/:id/usage
  ?metric=trucks_count
  &from=2026-01-01&to=2026-01-31

# Impersonate (login as org admin)
POST /api/super-admin/organizations/:id/impersonate
  → Returns JWT with org_id

# Export organization data
GET /api/super-admin/organizations/:id/export
  → ZIP file with all data

# Analytics
GET /api/super-admin/analytics/revenue
  ?from=2025-01-01&to=2026-01-31
  
GET /api/super-admin/analytics/churn
  
GET /api/super-admin/analytics/growth

# Billing
GET /api/super-admin/invoices
  ?status=overdue
  
POST /api/super-admin/invoices/:id/mark-paid

# Users across orgs
GET /api/super-admin/users
  ?search=john@example.com
```

---

## 7. Authentication & Authorization

### 7.1 JWT Token Structure

**Before (Single-tenant)**:
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "role": "admin"
}
```

**After (Multi-tenant)**:
```json
{
  "user_id": "uuid",
  "org_id": "uuid",
  "email": "user@example.com",
  "org_role": "admin",
  "is_super_admin": false,
  "exp": 1738252800
}
```

---

### 7.2 RBAC Matrix

| Role          | Scope     | Create Jobs | Edit Jobs | Billing | Manage Users | Super Admin Dashboard |
|---------------|-----------|-------------|-----------|---------|--------------|----------------------|
| **Super Admin** | All Orgs | ✅ (any org) | ✅ (any)  | ✅ (all) | ✅ (all)     | ✅                   |
| **Owner**       | Own Org  | ✅          | ✅        | ✅      | ✅           | ❌                   |
| **Admin**       | Own Org  | ✅          | ✅        | ✅      | ✅ (limited) | ❌                   |
| **Dispatcher**  | Own Org  | ✅          | ✅        | ❌      | ❌           | ❌                   |
| **Accounting**  | Own Org  | ❌          | ❌        | ✅      | ❌           | ❌                   |
| **Driver**      | Own Org  | ❌          | ❌ (own)  | ❌      | ❌           | ❌                   |

---

### 7.3 Login Flow

**Endpoint**: `POST /api/auth/login`

```python
@router.post("/login")
async def login(credentials: LoginSchema, db: Session = Depends(get_db)):
    # 1. Find user by email (email is unique across all orgs)
    user = db.query(User).filter(User.email == credentials.email).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(401, "Invalid credentials")
    
    # 2. Check if user is active
    if not user.is_active:
        raise HTTPException(403, "User account is disabled")
    
    # 3. Check if organization is active
    org = db.query(Organization).filter(Organization.id == user.org_id).first()
    if org.status == "suspended":
        raise HTTPException(403, "Organization is suspended. Please contact support.")
    
    if org.status == "cancelled":
        raise HTTPException(403, "Organization is cancelled.")
    
    # 4. Check trial expiry
    if org.plan_type == "trial" and org.trial_ends_at < datetime.now():
        raise HTTPException(403, "Trial period expired. Please upgrade to continue.")
    
    # 5. Generate JWT
    token_data = {
        "user_id": str(user.id),
        "org_id": str(user.org_id),
        "email": user.email,
        "org_role": user.org_role,
        "is_super_admin": user.is_super_admin,
        "exp": datetime.now() + timedelta(days=7)
    }
    
    token = encode_jwt(token_data)
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "org_role": user.org_role
        },
        "organization": {
            "id": org.id,
            "name": org.name,
            "slug": org.slug,
            "plan_type": org.plan_type,
            "status": org.status
        }
    }
```

---

## 8. Billing & Subscriptions

### 8.1 Plans

| Plan          | Monthly | Yearly (17% off) | Trucks | Drivers | Storage | Features                    |
|---------------|---------|------------------|--------|---------|---------|----------------------------|
| **Trial**     | ₪0      | -                | 5      | 10      | 5GB     | All basic features, 14 days|
| **Starter**   | ₪990    | ₪9,900          | 5      | 10      | 10GB    | Basic                      |
| **Professional** | ₪2,490 | ₪24,900       | 20     | 40      | 50GB    | + Advanced reports, API    |
| **Enterprise**| Custom  | Custom           | ∞      | ∞       | ∞       | + White label, SLA 99.9%   |

---

### 8.2 Trial → Paid Conversion

**סוף תקופת ניסיון**:

```
┌────────────────────────────────────────────────────┐
│  ⚠️ תקופת הניסיון מסתיימת בעוד 3 ימים             │
│                                                     │
│  כדי להמשיך להשתמש ב-TruckFlow, יש לשדרג          │
│  לתוכנית בתשלום.                                   │
│                                                     │
│  [בחר תוכנית ←]  [התחל שיחה עם המכירות]           │
│                                                     │
└────────────────────────────────────────────────────┘
```

**אם Trial פג**:
```
┌────────────────────────────────────────────────────┐
│  🔒 תקופת הניסיון הסתיימה                          │
│                                                     │
│  החשבון שלכם מוגבל עד שתשדרגו לתוכנית בתשלום.     │
│                                                     │
│  אתם עדיין יכולים לצפות בנתונים הקיימים, אך לא   │
│  ליצור נסיעות חדשות.                              │
│                                                     │
│  [שדרג עכשיו ←]                                    │
│                                                     │
└────────────────────────────────────────────────────┘
```

---

### 8.3 Payment Integration (Phase 2)

**אפשרויות**:
1. **Stripe** (בינלאומי, כרטיסי אשראי)
2. **PayPal** (חלופה)
3. **הוראת קבע ישראלית** (דרך Tranzila/CardCom/Meshulam)
4. **חשבונית עצמית** (Enterprise - העברה בנקאית)

**Flow עם Stripe**:
```
User clicks "שדרג לתוכנית Professional"
  ↓
Redirect to Stripe Checkout
  ↓
User enters credit card details
  ↓
Stripe validates and charges
  ↓
Webhook → backend/api/webhooks/stripe
  ↓
Update subscription status → 'active'
Create invoice record
Send confirmation email
  ↓
Redirect back to /settings/organization?success=true
```

---

### 8.4 Usage Limits Enforcement

**Middleware Check**:
```python
async def check_usage_limits(request: Request):
    org_id = get_org_id(request)
    org = db.query(Organization).filter(Organization.id == org_id).first()
    
    # Check trucks limit
    if request.url.path == "/api/trucks" and request.method == "POST":
        current_count = db.query(Truck).filter(Truck.org_id == org_id).count()
        if current_count >= org.max_trucks:
            raise HTTPException(
                403, 
                f"הגעת למגבלת המשאיות ({org.max_trucks}). שדרג את התוכנית."
            )
    
    # Check drivers limit
    if request.url.path == "/api/drivers" and request.method == "POST":
        current_count = db.query(Driver).filter(Driver.org_id == org_id).count()
        if current_count >= org.max_drivers:
            raise HTTPException(
                403,
                f"הגעת למגבלת הנהגים ({org.max_drivers}). שדרג את התוכנית."
            )
    
    # Check storage limit (when uploading files)
    if request.url.path.startswith("/api/files") and request.method == "POST":
        used_storage = db.query(func.sum(File.size_bytes)).filter(
            File.org_id == org_id
        ).scalar() or 0
        
        if used_storage / (1024**3) >= org.max_storage_gb:  # Convert to GB
            raise HTTPException(
                403,
                f"הגעת למגבלת האחסון ({org.max_storage_gb}GB). שדרג את התוכנית."
            )
```

**UI Indicator**:
```tsx
{trucksCount >= maxTrucks && (
  <Alert variant="warning">
    הגעת למגבלת המשאיות ({maxTrucks}). 
    <Link href="/settings/organization?tab=plan">שדרג את התוכנית</Link>
  </Alert>
)}
```

---

## 9. Data Migration

### 9.1 מהמצב הנוכחי (Single-tenant) ל-Multi-tenant

**שלבים**:

#### שלב 1: הוסף עמודת `org_id` (nullable)
```sql
-- Add column (nullable first)
ALTER TABLE users ADD COLUMN org_id UUID;
ALTER TABLE customers ADD COLUMN org_id UUID;
ALTER TABLE jobs ADD COLUMN org_id UUID;
-- ... (repeat for all tables)
```

#### שלב 2: צור ארגון default
```sql
-- Create default organization for existing data
INSERT INTO organizations (
  id, 
  name, 
  slug, 
  contact_email, 
  plan_type, 
  status
) VALUES (
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'ארגון ראשי',
  'default-org',
  'admin@truckflow.com',
  'enterprise',
  'active'
);
```

#### שלב 3: מלא `org_id` בנתונים קיימים
```sql
-- Populate org_id for all existing data
UPDATE users SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE org_id IS NULL;
UPDATE customers SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE org_id IS NULL;
UPDATE jobs SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' WHERE org_id IS NULL;
-- ... (repeat for all tables)
```

#### שלב 4: הפוך `org_id` ל-NOT NULL
```sql
ALTER TABLE users ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE customers ALTER COLUMN org_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN org_id SET NOT NULL;
-- ...
```

#### שלב 5: הוסף Foreign Keys
```sql
ALTER TABLE users 
  ADD CONSTRAINT fk_users_org 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE customers 
  ADD CONSTRAINT fk_customers_org 
  FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE;
-- ...
```

#### שלב 6: הוסף Indexes
```sql
CREATE INDEX idx_users_org_id ON users(org_id);
CREATE INDEX idx_customers_org_id ON customers(org_id);
CREATE INDEX idx_jobs_org_id ON jobs(org_id);
-- ...
```

---

### 9.2 Alembic Migration Script

```python
# backend/alembic/versions/xxxx_add_multi_tenant.py

def upgrade():
    # 1. Create organizations table
    op.create_table(
        'organizations',
        sa.Column('id', sa.UUID(), primary_key=True),
        sa.Column('name', sa.String(200), nullable=False),
        sa.Column('slug', sa.String(100), unique=True, nullable=False),
        # ... (all columns from section 3.1)
    )
    
    # 2. Add org_id to existing tables (nullable)
    for table in ['users', 'customers', 'sites', 'jobs', ...]:
        op.add_column(table, sa.Column('org_id', sa.UUID(), nullable=True))
    
    # 3. Create default organization
    op.execute("""
        INSERT INTO organizations (id, name, slug, contact_email, plan_type, status)
        VALUES (
          'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
          'Default Organization',
          'default-org',
          'admin@truckflow.com',
          'enterprise',
          'active'
        )
    """)
    
    # 4. Populate org_id
    for table in ['users', 'customers', 'sites', 'jobs', ...]:
        op.execute(f"""
            UPDATE {table} 
            SET org_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' 
            WHERE org_id IS NULL
        """)
    
    # 5. Make org_id NOT NULL
    for table in ['users', 'customers', 'sites', 'jobs', ...]:
        op.alter_column(table, 'org_id', nullable=False)
    
    # 6. Add foreign keys
    for table in ['users', 'customers', 'sites', 'jobs', ...]:
        op.create_foreign_key(
            f'fk_{table}_org',
            table, 'organizations',
            ['org_id'], ['id'],
            ondelete='CASCADE'
        )
    
    # 7. Add indexes
    for table in ['users', 'customers', 'sites', 'jobs', ...]:
        op.create_index(f'idx_{table}_org_id', table, ['org_id'])

def downgrade():
    # Reverse all operations
    ...
```

---

## 10. Security & Compliance

### 10.1 Data Isolation Checklist

✅ **Database Level**:
- [ ] כל טבלה מכילה `org_id`
- [ ] Foreign Keys כוללים `org_id` בכל relation
- [ ] PostgreSQL Row-Level Security Policies
- [ ] Database Views מוסתרים (לא חושפים cross-org data)

✅ **Application Level**:
- [ ] Middleware מזהה `org_id` מ-JWT
- [ ] כל query מסנן לפי `org_id`
- [ ] Create operations מזריקים `org_id` אוטומטית
- [ ] Unit tests לכל endpoint עם multi-org scenarios

✅ **API Level**:
- [ ] אין endpoint שמחזיר data ללא filter `org_id`
- [ ] Super admin endpoints מוגנים ב-`is_super_admin` check
- [ ] Rate limiting לפי org (למנוע DOS)

✅ **File Storage**:
- [ ] קבצים מאוחסנים ב-S3 עם prefix `{org_id}/`
- [ ] Presigned URLs כוללים `org_id` validation
- [ ] אי אפשר לגשת לקובץ של org אחר

---

### 10.2 PostgreSQL Row-Level Security (RLS)

**הגדרה**:
```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- ...

-- Create policy: users can only see their org's data
CREATE POLICY org_isolation_policy ON users
  USING (org_id = current_setting('app.current_org_id')::uuid);

CREATE POLICY org_isolation_policy ON customers
  USING (org_id = current_setting('app.current_org_id')::uuid);

-- ... (repeat for all tables)
```

**שימוש ב-Application**:
```python
# Set org_id in session before queries
@router.get("/api/customers")
async def get_customers(request: Request, db: Session = Depends(get_db)):
    org_id = get_org_id(request)
    
    # Set PostgreSQL session variable
    db.execute(f"SET app.current_org_id = '{org_id}'")
    
    # Now all queries are automatically filtered by RLS
    customers = db.query(Customer).all()  # Only returns current org's customers
    
    return customers
```

**יתרון**: בטיחות כפולה - גם אם שכחנו להוסיף WHERE בקוד, PostgreSQL חוסם.

---

### 10.3 Audit Logging

**רשום כל פעולה חשובה**:
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES users(id),
  
  action VARCHAR(100) NOT NULL, -- 'create_job', 'delete_customer', 'login', etc.
  entity_type VARCHAR(50), -- 'job', 'customer', 'user'
  entity_id UUID,
  
  before_data JSONB, -- State before change
  after_data JSONB,  -- State after change
  
  ip_address VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**דוגמה**:
```python
def log_audit(
    org_id: str,
    user_id: str,
    action: str,
    entity_type: str = None,
    entity_id: str = None,
    before_data: dict = None,
    after_data: dict = None,
    request: Request = None
):
    audit_log = AuditLog(
        org_id=org_id,
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before_data=before_data,
        after_data=after_data,
        ip_address=request.client.host if request else None,
        user_agent=request.headers.get("User-Agent") if request else None
    )
    db.add(audit_log)
    db.commit()
```

---

### 10.4 GDPR & Data Deletion

**"Right to be Forgotten"**:

```python
@router.delete("/api/super-admin/organizations/:id")
async def delete_organization(org_id: str, db: Session = Depends(get_db)):
    """
    Soft delete: mark as deleted, schedule purge after 30 days.
    Hard delete: physically remove all data.
    """
    
    # Option 1: Soft delete
    org = db.query(Organization).filter(Organization.id == org_id).first()
    org.status = 'deleted'
    org.deleted_at = datetime.now()
    db.commit()
    
    # Schedule task to hard delete after 30 days
    schedule_deletion(org_id, days=30)
    
    # Option 2: Hard delete (immediate)
    # Cascades to all related tables due to ON DELETE CASCADE
    db.query(Organization).filter(Organization.id == org_id).delete()
    db.commit()
    
    # Also delete files from S3
    delete_org_files_from_s3(org_id)
    
    return {"message": "Organization deleted"}
```

---

## 11. UI/UX Changes

### 11.1 Navigation Changes

**Before (Single-tenant)**:
```
[Logo] Fleet Management
  Dashboard
  Customers
  Jobs
  Fleet
  Reports
  Settings
```

**After (Multi-tenant)**:
```
[Logo] TruckFlow | [Org Name: הובלות הנגב ▼]
  Dashboard
  Customers
  Jobs
  Fleet
  Reports
  Settings
    - חשבון שלי
    - הגדרות ארגון ← NEW
    - משתמשים וצוות ← NEW
    - מנוי וחיוב ← NEW
```

**Org Selector (Owner/Admin בלבד)**:
```
┌─────────────────────────┐
│ הובלות הנגב ▼           │ ← Click
├─────────────────────────┤
│ 🏢 הובלות הנגב         │ ← Current
│ ⚙️ הגדרות ארגון        │
│ 👥 ניהול משתמשים        │
│ 💳 מנוי וחיוב          │
│ ───────────────────     │
│ 🚪 התנתק               │
└─────────────────────────┘
```

---

### 11.2 Super Admin Access

**UI בעמוד ראשי** (רק ל-Super Admin):
```
┌────────────────────────────────────────┐
│  TruckFlow                    [User ▼] │
│                                         │
│  🏠 Dashboard  │  🏢 Organizations     │ ← Super Admin tabs
│                                         │
├────────────────────────────────────────┤
│  אתה מחובר כ-Super Admin                │
│  [עבור לדשבורד ארגוני ←]               │
└────────────────────────────────────────┘
```

---

### 11.3 Trial Banner

**בראש המסך לארגוני Trial**:
```
┌────────────────────────────────────────────────┐
│ ⏰ תקופת הניסיון שלכם מסתיימת בעוד 7 ימים      │
│    [שדרג עכשיו ←]  [הרחב ניסיון]             │
└────────────────────────────────────────────────┘
```

---

### 11.4 Usage Indicators

**בפינה העליונה (לכל ארגון)**:
```
┌─────────────────────────┐
│ שימוש:                  │
│ 🚚 12/20 משאיות (60%)  │
│ 👤 18/40 נהגים (45%)   │
│ 💾 8.3/50GB (17%)       │
│ [צפה בפירוט]           │
└─────────────────────────┘
```

---

## 12. Technical Implementation

### 12.1 Backend Tasks

**Priority 1 (Critical)**:
1. ✅ Create `organizations` table
2. ✅ Add `org_id` to all tables (migration)
3. ✅ Update all endpoints to filter by `org_id`
4. ✅ Tenant middleware + JWT changes
5. ✅ Super Admin endpoints (`/api/super-admin/*`)
6. ✅ Signup flow with org creation

**Priority 2 (Important)**:
7. ✅ Usage limits enforcement
8. ✅ Audit logging
9. ✅ PostgreSQL RLS policies
10. ✅ Trial expiry checker (cron job)

**Priority 3 (Nice to have)**:
11. ⏳ Billing integration (Stripe)
12. ⏳ Invoice generation
13. ⏳ Analytics endpoints

---

### 12.2 Frontend Tasks

**Priority 1 (Critical)**:
1. ✅ Update Zustand auth store (add `org_id`, `org_name`, `plan_type`)
2. ✅ Update API client to include `org_id` in requests
3. ✅ Signup page (multi-step, org creation)
4. ✅ Settings → Organization tab
5. ✅ Trial banner component

**Priority 2 (Important)**:
6. ✅ Super Admin dashboard (new app or route)
7. ✅ Organizations list page
8. ✅ Organization details page
9. ✅ Usage indicators component
10. ✅ Plan selection/upgrade flow

**Priority 3 (Nice to have)**:
11. ⏳ Billing/invoices page
12. ⏳ Analytics charts
13. ⏳ White label settings (logo/colors)

---

### 12.3 Technology Stack

| Component           | Technology                    |
|---------------------|-------------------------------|
| Backend             | FastAPI + SQLAlchemy          |
| Database            | PostgreSQL 15+                |
| Auth                | JWT + bcrypt                  |
| Payments (Phase 2)  | Stripe / PayPal               |
| Email               | SendGrid / AWS SES            |
| Cron Jobs           | APScheduler / Celery          |
| Analytics (Phase 2) | Metabase / Redash             |
| Monitoring          | Sentry + Prometheus           |

---

## 13. Testing Strategy

### 13.1 Unit Tests

```python
# Test: User can only see their org's data
def test_get_customers_filters_by_org(client, db_session):
    # Create 2 orgs
    org1 = create_organization(name="Org 1")
    org2 = create_organization(name="Org 2")
    
    # Create customers for each org
    customer1 = create_customer(org_id=org1.id, name="Customer 1")
    customer2 = create_customer(org_id=org2.id, name="Customer 2")
    
    # Login as user from org1
    token = login_as(org_id=org1.id)
    
    # Request customers
    response = client.get("/api/customers", headers={"Authorization": f"Bearer {token}"})
    
    # Should only return customer1
    assert len(response.json()) == 1
    assert response.json()[0]["id"] == customer1.id
```

---

### 13.2 Integration Tests

```python
# Test: Signup flow creates org + user
def test_signup_creates_org_and_user(client):
    response = client.post("/api/auth/signup", json={
        "company_name": "Test Company",
        "email": "test@example.com",
        "password": "password123",
        "phone": "050-1234567"
    })
    
    assert response.status_code == 200
    
    # Check org was created
    org = db_session.query(Organization).filter(
        Organization.contact_email == "test@example.com"
    ).first()
    assert org is not None
    assert org.plan_type == "trial"
    
    # Check user was created
    user = db_session.query(User).filter(User.email == "test@example.com").first()
    assert user is not None
    assert user.org_id == org.id
    assert user.org_role == "owner"
```

---

### 13.3 Security Tests

```python
# Test: User cannot access another org's data
def test_cannot_access_other_org_data(client, db_session):
    org1 = create_organization(name="Org 1")
    org2 = create_organization(name="Org 2")
    
    job_org2 = create_job(org_id=org2.id)
    
    # Login as user from org1
    token = login_as(org_id=org1.id)
    
    # Try to access job from org2
    response = client.get(
        f"/api/jobs/{job_org2.id}",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    # Should return 404 (not found) or 403 (forbidden)
    assert response.status_code in [403, 404]
```

---

## 14. Deployment Plan

### 14.1 Rollout Strategy

**אופציה 1: Big Bang (כל האתר בבת אחת)**
- סוף שבוע אחד
- כל הנתונים הקיימים עוברים ל-"Default Org"
- משתמשים קיימים לא רואים שינוי

**אופציה 2: Gradual (הדרגתי)** ← מומלץ
1. **Week 1**: Deploy backend changes (org_id columns, middleware)
   - נתונים קיימים ב-"Default Org"
   - ממשק משתמש לא משתנה
2. **Week 2**: Enable signup for new organizations
   - משתמשים חדשים יכולים להירשם
3. **Week 3**: Launch Super Admin dashboard
4. **Week 4**: Marketing push + onboarding

---

### 14.2 Checklist לפני Production

**Backend**:
- [ ] כל הטבלאות מכילות `org_id`
- [ ] Migration tested על staging
- [ ] PostgreSQL RLS policies פעילים
- [ ] Middleware לא מאפשר cross-org access
- [ ] Audit logging פעיל
- [ ] Rate limiting בפעולה
- [ ] Backup של DB לפני migration

**Frontend**:
- [ ] Signup flow מתפקד
- [ ] Super Admin dashboard נבדק
- [ ] Trial banner מופיע
- [ ] Usage indicators נכונים

**Testing**:
- [ ] Unit tests עוברים (>95% coverage)
- [ ] Security tests עוברים
- [ ] Load testing (100+ concurrent orgs)

**Monitoring**:
- [ ] Sentry configured (error tracking)
- [ ] Logs centralized (CloudWatch / ELK)
- [ ] Alerts על trial expirations

---

### 14.3 Rollback Plan

**אם משהו קורה**:

1. **Rollback Application**:
   ```bash
   git revert <commit>
   docker-compose restart
   ```

2. **Rollback Database** (אם migration נכשלה):
   ```bash
   docker-compose exec backend alembic downgrade -1
   ```

3. **Restore Backup**:
   ```bash
   pg_restore -d fleet_management backup.sql
   ```

---

## 15. סיכום

### 15.1 Timeline (אומדן)

| Phase                      | Duration | Tasks                                                |
|----------------------------|----------|------------------------------------------------------|
| **Phase 1: DB Migration**  | 1 week   | Add org_id, create orgs table, migration script     |
| **Phase 2: Backend API**   | 2 weeks  | Update endpoints, middleware, super admin API        |
| **Phase 3: Frontend**      | 2 weeks  | Signup flow, Super Admin dashboard, org settings     |
| **Phase 4: Testing**       | 1 week   | Unit tests, security tests, load tests               |
| **Phase 5: Deployment**    | 1 week   | Staging → Production, monitoring                     |
| **Total**                  | **7 weeks** | Full multi-tenant implementation                  |

---

### 15.2 Success Metrics

**טכני**:
- ✅ 100% data isolation (0 cross-org leaks)
- ✅ <100ms query overhead (with org_id filter)
- ✅ Support 500+ organizations

**עסקי**:
- 🎯 10 new signups in first month
- 🎯 70% trial → paid conversion rate
- 🎯 ₪50,000 MRR after 3 months

---

### 15.3 Documentation Files

סדרת מסמכים לתיעוד:

1. ✅ **MULTI_TENANT_SPEC.md** (זה) - איפיון מלא
2. ⏳ **MULTI_TENANT_API.md** - תיעוד API endpoints
3. ⏳ **MULTI_TENANT_MIGRATION.md** - הנחיות migration
4. ⏳ **SUPER_ADMIN_GUIDE.md** - מדריך למנהלי TruckFlow
5. ⏳ **ORG_ADMIN_GUIDE.md** - מדריך למנהלי ארגון

---

## 📞 תמיכה

שאלות? בעיות?  
צור קשר: support@truckflow.com

---

**מסמך זה עודכן לאחרונה**: 25 ינואר 2026  
**גרסה**: 1.0  
**מחבר**: TruckFlow Development Team
