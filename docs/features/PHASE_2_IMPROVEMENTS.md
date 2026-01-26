# איפיון שיפורים - שלב 2
## Fleet Management System - Phase 2 Improvements Specification

**תאריך:** 26 ינואר 2026  
**גרסה:** 2.0  
**סטטוס:** לאישור לקוח

---

## 1. סקירה כללית

מסמך זה מפרט שיפורים והוספות למערכת ניהול הצי בהתבסס על משוב מלקוחות וארגונים.

### 1.1 מטרות עיקריות
- הרחבת יכולות ניהול קבלני משנה
- גמישות מחירים ושיבוצים
- שיפור חוויית המשתמש בתהליכי עבודה
- דוחות מתקדמים לניהול ובקרה

---

## 2. שינוי מבנה ליבה: מעבר ממרכזיות נהג למרכזיות משאית

### 2.1 המצב הנוכחי
```
Job -> Driver -> Truck
```
המשימה משובצת לנהג, והמשאית היא שדה משני.

### 2.2 המבנה החדש (מוצע)
```
Job -> Truck -> Driver
```
המשימה משובצת למשאית, והנהג נקשר דרך המשאית.

### 2.3 שינויים במודל הנתונים

#### 2.3.1 טבלת Trucks (ללא שינוי מבני)
```sql
trucks:
  - id
  - plate_number (מספר רישוי)
  - model
  - capacity_ton
  - capacity_m3
  - owner_type: ENUM('COMPANY', 'SUBCONTRACTOR')  -- חדש
  - subcontractor_id: FK -> subcontractors.id (nullable)  -- חדש
  - is_active
  - insurance_expiry
  - test_expiry
```

#### 2.3.2 טבלת Drivers - שינוי קשר
```sql
drivers:
  - id
  - name
  - phone
  - license_type
  - license_expiry
  - default_truck_id: FK -> trucks.id (nullable)  -- חדש
  - is_active
```

**הסבר:** 
- נהג יכול להיות משויך למשאית ברירת מחדל
- מותר שנהג לא יהיה משויך לאף משאית (גמישות)
- שיבוץ Job יהיה למשאית, ואז המערכת תציע את הנהג ברירת המחדל

#### 2.3.3 טבלת Jobs - שינוי לוגיקה
```sql
jobs:
  - id
  - truck_id: FK -> trucks.id (NOT NULL)  -- שדה עיקרי
  - driver_id: FK -> drivers.id (nullable)  -- שדה משני
  - trailer_id: FK -> trailers.id (nullable)
  
  -- אין שינוי בשאר השדות
```

**חוקי עסקיים:**
1. **חובה** לשבץ משאית לכל Job
2. **מומלץ** לשבץ נהג, אך לא חובה (למקרה של שיבוץ מראש)
3. אם `truck_id` נבחר ויש `default_truck_id` לנהג, המערכת תמלא אוטומטית
4. במסך שיבוץ: בחירת משאית → המערכת תציע נהגים פנויים או נהג ברירת מחדל

### 2.4 השפעה על UI/UX

#### Dispatch Board (לוח שיבוץ)
**נוכחי:** עמודות לפי נהגים  
**חדש:** עמודות לפי משאיות

```
+----------------+----------------+----------------+
| משאית 12-345-67| משאית 23-456-78| משאית 34-567-89|
| (נהג: משה כהן) | (נהג: דוד לוי) | (לא משובץ)    |
+----------------+----------------+----------------+
| Job #123       | Job #124       | Job #125       |
| מחצבה -> אתר א׳| אתר ב׳-> אתר ג׳| אתר ד׳-> מחצבה |
+----------------+----------------+----------------+
```

#### משאית ללא נהג
- המערכת תציג התראה: "⚠️ משאית ללא נהג - נא לשבץ"
- ניתן לשבץ Job גם ללא נהג (תכנון מוקדם)

---

## 3. ניהול קבלני משנה (Subcontractors)

### 3.1 הגדרה
קבלן משנה = ספק חיצוני שמספק שירותי הובלה עם משאית שלו.

### 3.2 טבלת נתונים חדשה: Subcontractors

```sql
CREATE TABLE subcontractors (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  
  -- פרטי קבלן
  name VARCHAR(200) NOT NULL,
  company_name VARCHAR(200),
  vat_id VARCHAR(50),
  contact_person VARCHAR(200),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  
  -- תנאי תשלום
  payment_terms VARCHAR(100) DEFAULT 'monthly',  -- שבועי/חודשי/לפי נסיעה
  payment_method VARCHAR(50),  -- העברה בנקאית/צ'ק/מזומן
  
  -- מטא
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_subcontractors_org ON subcontractors(org_id);
CREATE INDEX idx_subcontractors_active ON subcontractors(org_id, is_active);
```

### 3.3 טבלת מחירון קבלנים

```sql
CREATE TABLE subcontractor_price_lists (
  id SERIAL PRIMARY KEY,
  org_id INTEGER NOT NULL REFERENCES organizations(id),
  subcontractor_id INTEGER NOT NULL REFERENCES subcontractors(id),
  truck_id INTEGER REFERENCES trucks(id),  -- מחירון לפי משאית ספציפית (אופציונלי)
  
  -- הגדרת מסלול/חומר (כמו מחירון רגיל)
  customer_id INTEGER REFERENCES customers(id),  -- אופציונלי - מחיר לקוח ספציפי
  material_id INTEGER REFERENCES materials(id),
  from_site_id INTEGER REFERENCES sites(id),
  to_site_id INTEGER REFERENCES sites(id),
  
  -- מחירים
  price_per_trip DECIMAL(10,2),      -- מחיר לפי נסיעה (₪)
  price_per_ton DECIMAL(10,2),       -- מחיר לפי טון (₪)
  price_per_m3 DECIMAL(10,2),        -- מחיר לפי מ״ק (₪)
  price_per_km DECIMAL(10,2),        -- מחיר לפי ק״מ (₪)
  
  -- תוקף
  valid_from DATE,
  valid_to DATE,
  is_active BOOLEAN DEFAULT true,
  
  -- מטא
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  created_by INTEGER REFERENCES users(id)
);

CREATE INDEX idx_subcontractor_prices_org ON subcontractor_price_lists(org_id);
CREATE INDEX idx_subcontractor_prices_sub ON subcontractor_price_lists(subcontractor_id);
CREATE INDEX idx_subcontractor_prices_truck ON subcontractor_price_lists(truck_id);
```

### 3.4 חישוב מחיר קבלן

**תרחיש 1: מחיר נסיעה + טון**
```
מחיר קבלן = (price_per_trip) + (actual_qty * price_per_ton)
דוגמה: 80₪ נסיעה + (15 טון × 50₪) = 80 + 750 = 830₪
```

**תרחיש 2: רק לפי נסיעה**
```
מחיר קבלן = price_per_trip
דוגמה: 500₪ נסיעה (קבוע)
```

**תרחיש 3: רק לפי כמות**
```
מחיר קבלן = actual_qty * price_per_ton
דוגמה: 18 טון × 60₪ = 1,080₪
```

### 3.5 שינויים בטבלת Jobs

```sql
ALTER TABLE jobs ADD COLUMN is_subcontractor BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN subcontractor_id INTEGER REFERENCES subcontractors(id);
ALTER TABLE jobs ADD COLUMN subcontractor_price_total DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN subcontractor_price_breakdown_json JSON;
```

**דוגמת JSON:**
```json
{
  "base_trip_price": 80,
  "qty": 15,
  "price_per_ton": 50,
  "qty_price": 750,
  "total": 830,
  "calculation": "80₪ נסיעה + (15 טון × 50₪)"
}
```

### 3.6 תהליך עבודה עם קבלן

```
1. יצירת קבלן משנה (Subcontractors)
2. רישום משאיות של הקבלן (Trucks, owner_type=SUBCONTRACTOR)
3. הגדרת מחירון לקבלן (Subcontractor Price Lists)
4. שיבוץ Job למשאית של קבלן
   ↓
   המערכת מזהה אוטומטית: is_subcontractor=true
   ↓
5. חישוב מחיר לקבלן (במקביל למחיר ללקוח)
6. הפקת דוח קבלן (סיכום לתשלום)
```

---

## 4. מחיר ידני כללי לתעודה (Manual Price Override)

### 4.1 רקע
לעיתים צריך לעקוף את המחירון האוטומטי (הנחה, תיקון טעות, מקרה חד־פעמי).

### 4.2 שינוי במודל - **כבר קיים חלקית!**

```sql
jobs:
  -- כבר קיים:
  pricing_total DECIMAL(10,2)
  pricing_breakdown_json JSON
  manual_override_total DECIMAL(10,2)  -- ✅ קיים
  manual_override_reason TEXT          -- ✅ קיים
```

### 4.3 חוקים עסקיים (לחיזוק)

1. **הרשאה:** רק Admin/Accounting יכולים לעקוף מחיר
2. **חובה:** שדה `manual_override_reason` חייב להיות מלא
3. **Audit:** כל שינוי נרשם ב־`audit_logs`
4. **UI:** הצגה ברורה:
   ```
   מחיר מחושב: 1,200₪
   מחיר ידני:  1,000₪ ✏️
   סיבה: "הנחה 200₪ - לקוח VIP"
   ```

### 4.4 UI מוצע - עריכת Job

```
┌─────────────────────────────────────────┐
│ פרטי נסיעה #123                        │
├─────────────────────────────────────────┤
│ מחיר מחושב אוטומטי: 1,200₪            │
│ [ ] עקוף מחיר (Override)               │
│                                         │
│ ☑️ עקוף מחיר                           │
│ ┌─────────────────────────────────────┐ │
│ │ מחיר ידני: [1,000] ₪               │ │
│ └─────────────────────────────────────┘ │
│ ┌─────────────────────────────────────┐ │
│ │ סיבה (חובה):                       │ │
│ │ [הנחה 200₪ - לקוח VIP              │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ⚠️ שינוי זה יירשם ב־Audit Log         │
│                                         │
│ [שמור שינויים]  [ביטול]               │
└─────────────────────────────────────────┘
```

---

## 5. הוספת אתר/לקוח מתוך תעודה (Quick Add)

### 5.1 בעיה נוכחית
כשיוצרים Job חדש, אם האתר לא קיים → צריך לצאת מהטופס, ליצור אתר, לחזור.

### 5.2 פתרון: כפתורי Quick Add

#### 5.2.1 הוספת לקוח מהיר

```
┌─────────────────────────────────────────┐
│ יצירת נסיעה חדשה                       │
├─────────────────────────────────────────┤
│ לקוח: [בחר לקוח ▼] [+ לקוח חדש]       │
└─────────────────────────────────────────┘
```

**Modal - לקוח חדש:**
```
┌─────────────────────────────────────────┐
│ ✨ הוספת לקוח מהירה                    │
├─────────────────────────────────────────┤
│ שם לקוח: [_______________] (חובה)     │
│ טלפון:   [_______________]             │
│ ח.פ/ע.מ: [_______________]             │
│                                         │
│ [💾 שמור]  [❌ ביטול]                  │
└─────────────────────────────────────────┘
```

לאחר שמירה → הלקוח מתווסף לרשימה ונבחר אוטומטית.

#### 5.2.2 הוספת אתר מהיר

```
┌─────────────────────────────────────────┐
│ אתר מקור:  [בחר אתר ▼] [+ אתר חדש]    │
│ אתר יעד:   [בחר אתר ▼] [+ אתר חדש]    │
└─────────────────────────────────────────┘
```

**Modal - אתר חדש:**
```
┌─────────────────────────────────────────┐
│ ✨ הוספת אתר מהירה                     │
├─────────────────────────────────────────┤
│ לקוח:    [אוטומטי מהטופס]              │
│ שם אתר:  [_______________] (חובה)     │
│ כתובת:   [_______________] (חובה)     │
│ טלפון:   [_______________]             │
│ הערות:   [_______________]             │
│                                         │
│ [💾 שמור]  [❌ ביטול]                  │
└─────────────────────────────────────────┘
```

#### 5.2.3 אתר ללא לקוח (Generic Sites)

**שימוש:** מחצבות, תחנות דלק, שטחים ציבוריים.

```sql
ALTER TABLE sites ADD COLUMN is_generic BOOLEAN DEFAULT false;
-- אם is_generic=true, customer_id יכול להיות NULL
```

**UI:**
```
┌─────────────────────────────────────────┐
│ ☑️ אתר כללי (לא משויך ללקוח)          │
│ שם: [מחצבת נחל חמה]                    │
│ כתובת: [כביש 90 צפון ים המלח]         │
└─────────────────────────────────────────┘
```

**תהליך:**
1. אם בוחרים "אתר כללי", שדה לקוח לא חובה
2. האתר זמין לכל הלקוחות במערכת
3. שימושי למחצבות מרכזיות, תחנות מעבר וכו׳

---

## 6. דוחות מתקדמים

### 6.1 דוחות קבלן (Subcontractor Reports)

#### 6.1.1 דוח סיכום עבודה קבלן

**מטרה:** הפקת סיכום לתשלום לקבלן משנה.

**פרמטרים:**
- קבלן: [בחר קבלן]
- תקופה: מתאריך [__/__/____] עד [__/__/____]
- משאית: [כל המשאיות / משאית ספציפית]
- סטטוס: [רק נסיעות שהושלמו / הכל]

**תוכן הדוח:**

```
┌─────────────────────────────────────────────────────────────────┐
│                  דוח סיכום עבודה - קבלן משנה                   │
│                                                                  │
│ קבלן: משה כהן הובלות בע״מ                                      │
│ תקופה: 01/01/2026 - 31/01/2026                                 │
│ משאית: 12-345-67 (מרצדס אקטרוס)                               │
├─────────────────────────────────────────────────────────────────┤
│ תאריך  │ נסיעה │ מקור → יעד        │ טון  │ מחיר נסיעה │ מחיר טון │ סה״כ  │
├────────┼────────┼───────────────────┼──────┼────────────┼──────────┼────────┤
│ 05/01  │ #123   │ מחצבה א → אתר ב  │ 15.0 │ 80₪       │ 750₪     │ 830₪  │
│ 07/01  │ #156   │ מחצבה ג → אתר ד  │ 18.2 │ 80₪       │ 910₪     │ 990₪  │
│ 10/01  │ #189   │ אתר ה → מחצבה ו  │ 12.5 │ 80₪       │ 625₪     │ 705₪  │
│ ...    │ ...    │ ...               │ ...  │ ...        │ ...      │ ...    │
├────────┴────────┴───────────────────┴──────┴────────────┴──────────┴────────┤
│ סה״כ נסיעות: 45                                                            │
│ סה״כ טונות: 675.5                                                          │
│                                                                              │
│ סה״כ לתשלום לקבלן: 37,250₪                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

**ייצוא:** PDF, Excel

#### 6.1.2 דוח רווחיות קבלן

**השוואה:** הכנסה מלקוח vs. תשלום לקבלן

```
Job #123:
  הכנסה מלקוח:  1,200₪
  תשלום לקבלן:    830₪
  רווח גולמי:     370₪ (30.8%)
```

### 6.2 דוח משאית (Truck Report)

**מטרה:** ניתוח ביצועים ורווחיות לפי משאית.

**פרמטרים:**
- משאית: [בחר משאית]
- תקופה: [__/__/____] - [__/__/____]

**תוכן:**

```
┌─────────────────────────────────────────────────────────────────┐
│                  דוח ביצועים - משאית 12-345-67                 │
│                     (מרצדס אקטרוס 2020)                         │
├─────────────────────────────────────────────────────────────────┤
│ תקופה: 01/01/2026 - 31/01/2026                                 │
│                                                                  │
│ 📊 סטטיסטיקה:                                                  │
│   • סה״כ נסיעות: 85                                            │
│   • ימי פעילות: 22 מתוך 31                                     │
│   • ממוצע נסיעות ליום: 3.86                                    │
│   • סה״כ טונות הועברו: 1,275 טון                              │
│                                                                  │
│ 💰 כספים:                                                      │
│   • הכנסות ללקוחות: 102,000₪                                   │
│   • הוצאות דלק: 12,500₪                                        │
│   • הוצאות תחזוקה: 3,200₪                                      │
│   • רווח גולמי: 86,300₪                                        │
│                                                                  │
│ 🔧 תחזוקה:                                                     │
│   • טסט אחרון: 15/12/2025                                       │
│   • ביטוח בתוקף עד: 30/06/2026                                 │
│   • טיפול הבא: 15/02/2026 (20 יום)                            │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 דוח משאית של קבלן

**מיוחד:** משאיות שבבעלות קבלן משנה.

```
┌─────────────────────────────────────────────────────────────────┐
│         דוח משאית קבלן - 23-456-78 (קבלן: משה כהן)            │
├─────────────────────────────────────────────────────────────────┤
│ תקופה: 01/01/2026 - 31/01/2026                                 │
│                                                                  │
│ 📊 ביצועים:                                                     │
│   • נסיעות: 45                                                  │
│   • טונות: 675.5                                                │
│                                                                  │
│ 💰 כספים:                                                      │
│   • הכנסות מלקוחות: 54,000₪                                    │
│   • תשלום לקבלן: 37,250₪                                       │
│   • רווח גולמי: 16,750₪ (31%)                                  │
│                                                                  │
│ 🚛 נהגים (החודש):                                              │
│   • דוד לוי - 25 נסיעות                                        │
│   • יוסי כהן - 20 נסיעות                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 6.4 דוח לפי לקוח (Customer Report) - מורחב

**הרחבה:** כולל פילוח משאיות.

```
┌─────────────────────────────────────────────────────────────────┐
│              דוח לקוח - חברת הבניה המרכזית בע״מ               │
├─────────────────────────────────────────────────────────────────┤
│ תקופה: 01/01/2026 - 31/01/2026                                 │
│                                                                  │
│ 📊 סיכום נסיעות:                                               │
│   • סה״כ נסיעות: 156                                           │
│   • סה״כ טונות: 2,340                                          │
│   • אתרים פעילים: 4                                            │
│                                                                  │
│ 🚛 פילוח לפי משאיות:                                           │
│   ┌───────────────┬──────────┬─────────┬──────────┐            │
│   │ משאית         │ נסיעות  │ טונות  │ סכום     │            │
│   ├───────────────┼──────────┼─────────┼──────────┤            │
│   │ 12-345-67     │ 65       │ 975     │ 78,000₪ │            │
│   │ 23-456-78 (ק) │ 45       │ 675     │ 54,000₪ │            │
│   │ 34-567-89     │ 46       │ 690     │ 55,200₪ │            │
│   └───────────────┴──────────┴─────────┴──────────┘            │
│                                                                  │
│ 💰 כספים:                                                      │
│   • סה״כ חשבוניות: 187,200₪                                    │
│   • תשלומים: 150,000₪                                          │
│   • יתרה: 37,200₪                                               │
│                                                                  │
│ (ק) = משאית קבלן משנה                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. סיכום שינויים טכניים

### 7.1 שינויי Schema (Database)

```sql
-- 1. הוספת טבלת קבלני משנה
CREATE TABLE subcontractors (...);
CREATE TABLE subcontractor_price_lists (...);

-- 2. שינויים ב־Trucks
ALTER TABLE trucks ADD COLUMN owner_type VARCHAR(20) DEFAULT 'COMPANY';
ALTER TABLE trucks ADD COLUMN subcontractor_id INTEGER REFERENCES subcontractors(id);

-- 3. שינויים ב־Drivers
ALTER TABLE drivers ADD COLUMN default_truck_id INTEGER REFERENCES trucks(id);

-- 4. שינויים ב־Jobs
ALTER TABLE jobs ADD COLUMN is_subcontractor BOOLEAN DEFAULT false;
ALTER TABLE jobs ADD COLUMN subcontractor_id INTEGER REFERENCES subcontractors(id);
ALTER TABLE jobs ADD COLUMN subcontractor_price_total DECIMAL(10,2);
ALTER TABLE jobs ADD COLUMN subcontractor_price_breakdown_json JSON;

-- 5. אתרים כלליים
ALTER TABLE sites ADD COLUMN is_generic BOOLEAN DEFAULT false;
ALTER TABLE sites ALTER COLUMN customer_id DROP NOT NULL;  -- אם customer_id היה NOT NULL
```

### 7.2 API Endpoints חדשים

```
# קבלני משנה
GET    /api/subcontractors
POST   /api/subcontractors
GET    /api/subcontractors/{id}
PATCH  /api/subcontractors/{id}
DELETE /api/subcontractors/{id}

# מחירוני קבלנים
GET    /api/subcontractor-price-lists?subcontractor_id={id}
POST   /api/subcontractor-price-lists
GET    /api/subcontractor-price-lists/{id}
PATCH  /api/subcontractor-price-lists/{id}
DELETE /api/subcontractor-price-lists/{id}

# חישוב מחיר קבלן
POST   /api/jobs/{id}/pricing/subcontractor-preview

# דוחות
GET    /api/reports/subcontractors/{id}/summary?from=&to=
GET    /api/reports/subcontractors/{id}/profitability?from=&to=
GET    /api/reports/trucks/{id}/performance?from=&to=
GET    /api/reports/customers/{id}/detailed?from=&to=

# Quick Add (מ־Job form)
POST   /api/customers/quick-add
POST   /api/sites/quick-add
```

### 7.3 מסכים חדשים/מעודכנים

```
Frontend Pages:
1. /subcontractors (רשימת קבלני משנה)
2. /subcontractors/new (הוספת קבלן)
3. /subcontractors/[id] (עריכת קבלן)
4. /subcontractor-price-lists (מחירונים)
5. /reports/subcontractors (דוחות קבלנים)
6. /reports/trucks (דוחות משאיות)

Updated Pages:
1. /jobs/new - הוספת Quick Add buttons
2. /jobs/[id] - הוספת Manual Price Override section
3. /dispatch - שינוי מנהגים למשאיות
4. /trucks/[id] - הצגת owner_type + קבלן
5. /drivers/[id] - הוספת default_truck_id
```

---

## 8. תכנית יישום (Implementation Plan)

### שלב 1: תשתית (2 שבועות)
- [ ] שינויי Schema במסד נתונים
- [ ] Migration scripts
- [ ] Models חדשים בBackend
- [ ] API Endpoints בסיסיים

### שלב 2: קבלני משנה (2 שבועות)
- [ ] CRUD קבלני משנה (UI + API)
- [ ] מחירונים לקבלנים
- [ ] חישוב מחיר קבלן ב־Job
- [ ] שיוך משאית לקבלן

### שלב 3: שינוי מרכזיות משאית (2 שבועות)
- [ ] עדכון Dispatch Board (משאיות במקום נהגים)
- [ ] שיוך נהג למשאית ברירת מחדל
- [ ] עדכון לוגיקת שיבוץ Jobs
- [ ] בדיקות תאימות (backward compatibility)

### שלב 4: Quick Add ומחיר ידני (1 שבוע)
- [ ] כפתורי Quick Add ב־Job form
- [ ] Modal הוספת לקוח/אתר מהירה
- [ ] אתרים כלליים (is_generic)
- [ ] חיזוק UI מחיר ידני

### שלב 5: דוחות מתקדמים (2 שבועות)
- [ ] דוחות קבלן (סיכום + רווחיות)
- [ ] דוח משאית מפורט
- [ ] דוח לקוח עם פילוח משאיות
- [ ] ייצוא PDF/Excel

### שלב 6: בדיקות ו־QA (1 שבוע)
- [ ] בדיקות אינטגרציה
- [ ] בדיקות עם נתוני לקוח אמיתיים
- [ ] תיקוני באגים
- [ ] תיעוד למשתמשים

**סה״כ זמן משוער: 10 שבועות (~2.5 חודשים)**

---

## 9. סיכונים ומגבלות

### 9.1 שינוי מבני גדול (משאית במרכז)
**סיכון:** שיבוש נתונים קיימים  
**מיטיגציה:** 
- Migration script שמירושים נתונים קיימים
- שמירת backward compatibility לחודשיים
- בדיקות מקיפות

### 9.2 מורכבות מחירון כפול
**סיכון:** טעויות בחישוב (מחיר ללקוח vs. מחיר לקבלן)  
**מיטיגציה:**
- בדיקות אוטומטיות
- הצגה ברורה ב־UI
- אישורים לפני חשבוניות

### 9.3 ביצועים עם דוחות מורכבים
**סיכון:** דוחות איטיים עם הרבה נתונים  
**מיטיגציה:**
- Indexes מתאימים
- Caching של דוחות
- Pagination

---

## 10. נספחים

### 10.1 דוגמאות נתונים

#### דוגמה: Job עם קבלן משנה
```json
{
  "id": 123,
  "customer_id": 5,
  "truck_id": 15,
  "driver_id": null,
  "is_subcontractor": true,
  "subcontractor_id": 3,
  "actual_qty": 15.0,
  "unit": "TON",
  
  "pricing_total": 1200,
  "pricing_breakdown_json": {
    "base_price": 80,
    "qty_price": 1120,
    "total": 1200,
    "calculation": "80₪/ton × 15 tons"
  },
  
  "subcontractor_price_total": 830,
  "subcontractor_price_breakdown_json": {
    "base_trip_price": 80,
    "qty": 15,
    "price_per_ton": 50,
    "qty_price": 750,
    "total": 830,
    "calculation": "80₪ trip + (15 tons × 50₪)"
  }
}
```

**רווח:** 1,200₪ - 830₪ = 370₪ (30.8%)

---

## סיום מסמך

**מאושר על ידי:** _______________  
**תאריך:** _______________

**הערות נוספות:**
_________________________________
_________________________________
_________________________________
