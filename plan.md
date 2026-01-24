**איפיון מערכת לעסק “הובלות עפר”** (PRD + מודל נתונים + מסכים + דוחות), מותאם לענף: משאיות, תעודות משלוח, שקלול, סבבים, מחירון לפי ק״מ/טון/סוג חומר, גבייה וספקים.
## 1) מטרת המערכת

מערכת לניהול מקצה לקצה של פעילות הובלות עפר:

- ניהול **לקוחות ואתרים** (פרויקטים/אתרי בנייה/מחצבה)
    
- ניהול **נהגים/משאיות/נגררים** וזמינות
    
- ניהול **נסיעות/סבבים** (Dispatch) ותכנון יומי
    
- תיעוד **תעודות משלוח** + **תעודות שקילה** (אופציונלי)
    
- חישוב מחיר אוטומטי לפי **מחירון** (טון/קוב/ק״מ/מינימום/זמן המתנה)
    
- הפקת **חשבוניות/סיכומים** ללקוח + מעקב גבייה
    
- מעקב **הוצאות** (דלק, תיקונים, קבלני משנה) + רווחיות לפי משאית/לקוח/אתר
    

---

## 2) סוגי משתמשים והרשאות

- **בעלים/מנהל**: הכל
    
- **סדרן/Dispatch**: תכנון נסיעות, הקצאת נהג/משאית, סטטוסים
    
- **נהג**: אפליקציה/מובייל – קבלת משימה, עדכון סטטוס, העלאת תמונות/מסמכים, חתימה
    
- **מנהלת חשבונות**: מסמכים, גבייה, הוצאות, דוחות
    
- **לקוח (פורטל)** (אופציונלי): צפייה בתעודות/סיכומים/חשבוניות
    

---

## 3) ישויות נתונים (מודל בסיסי)

### A) לקוחות ואתרים

**Customer**

- id, name, ח.פ/ע.מ, כתובת, איש קשר, תנאי תשלום
    

**Site / Project (אתר/פרויקט)**

- id, customer_id
    
- שם אתר, כתובת, שעות פעילות, הערות גישה/אישורים
    
- סוג פעילות: “פינוי”, “אספקה”, “גם וגם”
    

### B) צי

**Truck (משאית)**

- מספר רישוי, דגם, סוג (פול טריילר/סמי/דאבל), קיבולת (טון/קוב), סטטוס
    
- ביטוחים/טסט תוקף (תזכורות)
    

**Trailer (נגרר)**

- מספר, קיבולת, סטטוס
    

**Driver (נהג)**

- פרטים, רישיון, תוקף, סטטוס/זמינות
    
- שיוך משאית קבוע/זמני
    

### C) חומר ומחירון

**Material (חומר)**

- עפר, חצץ, מצע, חול, פסולת בניין, אספלט, וכו׳
    
- יחידת חיוב: `ton | m3 | trip | km`
    

**PriceList**

- customer_id (או “כללי”)
    
- material_id
    
- FromSite -> ToSite (או FromSupplier/Quarry)
    
- מחיר לפי: טון / קוב / נסיעה / ק״מ
    
- מינימום חיוב, תוספת “המתנה”, תוספת “לילה”, תוספת “גישה קשה”
    
- תוקף מחירון (date_from/date_to)
    

### D) נסיעות ותעודות

**Job / Trip (נסיעה)**

- id, date, dispatcher_id
    
- customer_id, site_from, site_to
    
- material_id, planned_qty, unit
    
- truck_id, trailer_id, driver_id
    
- סטטוס: `planned | assigned | enroute_pickup | loaded | enroute_dropoff | delivered | closed | canceled`
    
- זמני KPI: זמן יציאה, הגעה לטעינה, יציאה מהטעינה, הגעה לפריקה, סיום
    

**DeliveryNote (תעודת משלוח)**

- מספר תעודה פנימי + מספר לקוח (אם צריך)
    
- חתימה דיגיטלית (מקבל באתר)
    
- תמונות (פריקה/העמסה)
    
- הערות חריגים
    

**WeighTicket (תעודת שקילה)**

- מספר תעודה, מחצבה/מקום שקילה
    
- משקל ברוטו/נטו/טרה
    
- קבצים מצורפים (PDF/תמונה)
    
- קישור לנסיעה
    

### E) חיוב ותשלומים

**Invoice / CustomerStatement**

- איחוד נסיעות לפי תקופה/פרויקט/לקוח
    
- שורות: נסיעה/תעודה/חומר/כמות/מחיר/תוספות
    
- סטטוס: `draft | sent | partially_paid | paid`
    

**Payment**

- תאריך קבלה, סכום, אמצעי (העברה/צ’ק/אשראי)
    
- שיוך לחשבוניות (חלקי/מלא)
    

### F) הוצאות ורווחיות

**Expense**

- קטגוריה: דלק/טיפולים/צמיגים/אגרות/שכר/קבלן משנה
    
- שיוך ל: משאית/נהג/נסיעה/פרויקט
    
- קבצים (חשבונית ספק)
    

**Subcontractor (קבלן משנה)** (אם עובדים עם קבלני הובלה)

- פרטים, תנאים, מחירון קבלן
    
- נסיעות שבוצעו ע״י קבלן + חיוב קבלן
    

---

## 4) תהליכים (Workflows)

### תהליך 1: תכנון יומי (Dispatch)

1. יצירת “יום עבודה” / לוח משימות
    
2. פתיחת נסיעות לפי לקוחות/אתרים
    
3. הקצאת משאית+נהג
    
4. יציאה לשטח (נהג במובייל)
    
5. עדכוני סטטוס + העלאת מסמכים
    

### תהליך 2: ביצוע נסיעה בשטח (נהג)

- “קיבלתי משימה”
    
- “הגעתי לטעינה” → צילום תעודת שקילה/טעינה
    
- “יצאתי ליעד”
    
- “נפרק” → חתימה + תמונת אתר
    
- סגירת נסיעה
    

### תהליך 3: חיוב חודשי/שבועי

- סינון נסיעות “סגורות” לפי לקוח/פרויקט
    
- בדיקת חריגים (חסר שקילה/חתימה)
    
- יצירת חשבונית/סיכום עבודה
    
- שליחה ללקוח
    
- מעקב גבייה
    

---

## 5) מסכים עיקריים (UX)

1. **דשבורד**
    

- נסיעות היום (ביצוע/איחורים)
    
- התראות: נסיעות ללא מסמכים, ביטוחים/טסט פג תוקף, חובות לקוחות
    

2. **לוח תכנון יומי (Dispatch Board)**
    

- תצוגת טבלה/קאנבן לפי משאית/נהג
    
- Drag & Drop להקצאה
    
- פילטר לפי לקוח/אתר/חומר
    

3. **נסיעה (Job) – כרטיס**
    

- פרטי מהיכן-לאן, חומר, כמות
    
- מסמכים מצורפים, חתימה
    
- תוספות חיוב (המתנה/לילה)
    
- Timeline של זמנים
    

4. **לקוחות ואתרים**
    

- מחירונים, תנאים, היסטוריית נסיעות, חשבוניות
    

5. **צי: משאיות/נהגים**
    

- זמינות, תחזוקה, התראות
    

6. **חשבוניות/גבייה**
    

- רשימת חשבוניות, יתרות, תשלומים
    

7. **הוצאות**
    

- הוצאות לפי משאית/נהג/חודש + קבצים
    

8. **אפליקציית נהג (מובייל) – MVP**
    

- רשימת משימות להיום
    
- כפתורי סטטוס
    
- העלאת תמונות/מסמכים
    
- חתימה
    

---

## 6) חישוב מחיר (Pricing Engine)

המערכת מחשבת אוטומטית:

- מחיר בסיס לפי מחירון (טון/קוב/נסיעה/ק״מ)
    
- מינימום חיוב (למשל “מינימום 10 טון” או “מינימום נסיעה”)
    
- תוספת המתנה (לפי דקות מעבר לסף)
    
- תוספת לילה/סופ״ש
    
- תוספת “גישה קשה” / “דחוף”
    
- אפשר “Override” ידני עם סיבת שינוי (Audit)
    

---

## 7) דוחות חובה לענף

**תפעול**

- נסיעות לפי יום/משאית/נהג
    
- זמן המתנה ממוצע באתר (KPI)
    
- נסיעות עם מסמכים חסרים (שקילה/חתימה)
    

**כספים**

- הכנסות לפי לקוח/פרויקט/חומר
    
- רווחיות לפי משאית (הכנסות − דלק − תיקונים − קבלני משנה)
    
- חובות לקוחות (Aging)
    
- הוצאות לפי קטגוריה/משאית
    

**לקוח**

- דוח סיכום עבודה: פירוט נסיעות + תעודות משלוח + תעודות שקילה
    

---

## 8) דרישות לא פונקציונליות

- Offline/קליטה חלשה לנהגים (שמירה מקומית וסנכרון)
    
- Audit Log לשינויים במחיר/כמות/סטטוס
    
- הרשאות לפי תפקידים
    
- תמיכה בקבצים גדולים (תמונות/PDF)
    
- גיבויים + ייצוא נתונים
    

---

## 9) MVP מומלץ (מה בונים קודם)

### שלב 1 (חובה)

- לקוחות + אתרים
    
- משאיות + נהגים
    
- תכנון נסיעות בסיסי + סטטוסים
    
- העלאת תמונות/תעודות + חתימה
    
- מחירון בסיסי וחישוב
    
- סיכום/חשבונית פשוטה + ייצוא PDF/Excel
    

### שלב 2

- תעודות שקילה מתקדמות + OCR
    
- התראות תחזוקה/ביטוחים
    
- פורטל לקוח
    
- קבלני משנה + חיוב קבלן
    
- KPI מתקדמים (איחורים, תפוקה)
    

---

## 10) הצעה טכנולוגית קצרה

- Web Admin: **Next.js**
    
- Backend: **FastAPI / NestJS**
    
- DB: **PostgreSQL**
    
- Mobile Driver: PWA (מהיר ל-MVP) או Flutter/React Native
    
- Storage: S3-Compatible לקבצים
    
- Auth: RBAC + JWT







להלן **מסמך אפיון מלא לצוות פיתוח** למערכת “הובלות עפר” (Web Admin + נהגים במובייל). בנוי כך שאפשר להתחיל לפתח מיד: Scope, Roles, User Stories עם Acceptance Criteria, מודל נתונים, API, Workflows, ודגשי NFR.

---

# 1) תקציר מוצר

## 1.1 מטרת המערכת

מערכת לניהול תפעול וכספים של חברת הובלות עפר:

- תכנון/שיבוץ נסיעות (Dispatch)
    
- ביצוע בשטח ע״י נהגים (סטטוסים, חתימה, מסמכים/תמונות)
    
- מחירון וחישוב חיוב אוטומטי
    
- הפקת סיכומי עבודה/חשבוניות ומעקב גבייה
    
- מעקב הוצאות ורווחיות לפי משאית/נהג/לקוח/פרויקט
    

## 1.2 קהל יעד

- חברות הובלות עפר קטנות/בינוניות
    
- עבודה יומית אינטנסיבית, הרבה נסיעות/תעודות
    

## 1.3 פלטפורמות

- Web Admin (מנהל/סדרן/מנה"ח)
    
- Mobile Driver (PWA / אפליקציה) – חובה ל־MVP
    

---

# 2) Roles והרשאות

## 2.1 תפקידים

- **Owner/Admin**: כל הרשאות
    
- **Dispatcher**: יצירה/שיבוץ/ניהול נסיעות, צפייה בדוחות תפעוליים
    
- **Accounting**: לקוחות/חשבוניות/תשלומים/הוצאות/דוחות כספיים
    
- **Driver**: גישה רק למשימות שלו + עדכוני סטטוס + העלאת מסמכים + חתימות
    
- **Customer Portal (אופציונלי)**: צפייה בלבד (חשבוניות/תעודות)
    

## 2.2 RBAC (ברמת משאבים)

- Drivers לא רואים לקוחות/חשבוניות כלל, רק “Job assignments”
    
- Dispatcher לא משנה תשלומים/חשבוניות אחרי “Sent” ללא הרשאת Admin
    
- Audit חובה לשינויים במחיר/כמות/סטטוסים
    

---

# 3) טרמינולוגיה

- **Job / Trip**: נסיעה/משימה אחת
    
- **Delivery Note**: תעודת משלוח + חתימת לקוח
    
- **Weigh Ticket**: תעודת שקילה (נטו/ברוטו/טרה)
    
- **Statement**: סיכום עבודה ללקוח (תקופתי)
    
- **Invoice**: חשבונית (אם מייצרים במערכת) – ניתן להתחיל ב־Statement + Export
    

---

# 4) Scope לפי שלבים

## MVP (שלב 1)

1. ניהול לקוחות + אתרים
    
2. ניהול משאיות/נהגים
    
3. לוח תכנון יומי (Dispatch) + יצירת Jobs
    
4. אפליקציית נהג: קבלת משימה, סטטוס, חתימה, העלאת תמונות/PDF
    
5. מחירון בסיסי וחישוב חיוב + תוספות בסיס (המתנה/לילה/מינימום)
    
6. סגירת נסיעות + יצירת Statement/Invoice בסיסי + Export PDF/Excel
    
7. תשלומים ומעקב יתרות (ברמת חשבונית/סיכום)
    
8. דוחות בסיסיים
    

## שלב 2

- קבלני משנה (subcontractors)
    
- OCR לתעודות שקילה
    
- פורטל לקוח
    
- תחזוקה/התראות טסט/ביטוחים
    
- KPI מתקדמים (איחורים, זמני המתנה ממוצעים, תפוקה)
    

---

# 5) מסכים (Web + Mobile)

## 5.1 Web Admin

1. Dashboard
    
2. Dispatch Board (לוח יומי)
    
3. Jobs List + Job Details
    
4. Customers + Sites
    
5. Fleet: Trucks / Trailers / Drivers
    
6. Price Lists
    
7. Statements/Invoices + Payments
    
8. Expenses
    
9. Reports
    
10. Settings + Users/Roles
    

## 5.2 Mobile Driver

1. Login
    
2. Today Assignments
    
3. Job Details
    
4. Update Status buttons
    
5. Upload Files (camera/gallery/pdf)
    
6. Signature capture (touch)
    
7. Offline queue + sync
    

---

# 6) Workflows (תהליכים)

## 6.1 תכנון ושיבוץ

- Dispatcher פותח Job → מקצה נהג/משאית → Job עובר ל־Assigned → מופיע אצל הנהג.
    

## 6.2 ביצוע בשטח (Driver)

סטטוסים מומלצים:

- `ASSIGNED`
    
- `ENROUTE_PICKUP`
    
- `LOADED`
    
- `ENROUTE_DROPOFF`
    
- `DELIVERED` (כולל חתימה/תמונה)
    
- `CLOSED` (סגירה תפעולית, בעיקר ע״י משרד)
    

כל שינוי סטטוס נשמר עם timestamp ומיקום (אם יש הרשאה/אישור).

## 6.3 חיוב

- לאחר `DELIVERED` יש בדיקה: מסמכים חובה? (חתימה/תעודה)
    
- Dispatcher/Accounting מאשר → Job “Billable”
    
- יצירת Statement לפי טווח תאריכים + לקוח/פרויקט
    
- Generate Lines (נסיעות) לפי Pricing Engine
    
- Export + שליחה ללקוח
    
- קבלת תשלום → עדכון סטטוס Paid/Partial
    

---

# 7) User Stories + Acceptance Criteria

## 7.1 Dispatcher – ניהול נסיעות

### US-D1: יצירת נסיעה

**כדי** לתכנן הובלה  
**כסדרן** אני רוצה ליצור Job עם מקור, יעד, חומר וכמות.

**Acceptance**

- חובה: Customer, From Site, To Site, Material, Date, Unit (ton/m3/trip/km), Planned Qty
    
- אופציונלי: Truck/Trailer/Driver (אפשר לשבץ אחר כך)
    
- Job נוצר בסטטוס `PLANNED`
    
- Audit: מי יצר ומתי
    

### US-D2: שיבוץ נהג/משאית

**Acceptance**

- אפשר לשבץ Driver+Truck
    
- המערכת בודקת התנגשות זמינות (אם מוגדר) ומתריעה (לא חוסמת ב־MVP)
    
- שינוי סטטוס ל־`ASSIGNED`
    
- Push/Notification לנהג (או לפחות רענון באפליקציה)
    

### US-D3: לוח יומי

**Acceptance**

- תצוגה לפי יום עם פילטרים: לקוח/אתר/נהג/משאית/סטטוס
    
- Drag & drop לשינוי הקצאות (Nice to have ב־MVP; אפשר גם באמצעות “Assign”)
    

---

## 7.2 Driver – ביצוע בשטח

### US-DRV1: צפייה במשימות להיום

**Acceptance**

- נהג רואה רק משימות assigned אליו
    
- משימות ממוינות לפי זמן/עדיפות
    
- כל משימה מציגה: From/To, חומר, כמות, הערות גישה, טלפון איש קשר
    

### US-DRV2: שינוי סטטוס

**Acceptance**

- הנהג יכול לעדכן סטטוס דרך כפתורים מוגדרים
    
- שינוי נשמר מיידית; אם אין קליטה → נשמר Offline Queue ומסונכרן כשיש רשת
    
- לוג סטטוסים נשמר עם זמן + user_id + (אופציונלי lat/lng)
    

### US-DRV3: חתימה ותמונות חובה בסיום

**Acceptance**

- מעבר ל־`DELIVERED` מחייב:
    
    - חתימה דיגיטלית (שם מקבל + חתימה)
        
    - לפחות תמונה אחת (פריקה / תעודה)
        
- אם אין קליטה: מאפשר “שמירה מקומית” ומציג “לא מסונכרן” עד sync
    

---

## 7.3 Accounting – חיוב וגבייה

### US-A1: מחירון ללקוח

**Acceptance**

- ניתן להגדיר מחירון לפי:
    
    - חומר + יחידת חיוב
        
    - מסלול (From/To) או “כללי”
        
    - מחיר בסיס
        
    - מינימום חיוב (אופציונלי)
        
    - תוספת המתנה / לילה (אופציונלי)
        
    - תוקף מתאריכים
        

### US-A2: חישוב מחיר לנסיעה

**Acceptance**

- לכל Job יש “Pricing Preview”:
    
    - Base price
        
    - Adjustments
        
    - Total
        
- ניתן override ידני (הרשאת Accounting/Admin)
    
- override מחייב שדה “Reason” ונרשם Audit
    

### US-A3: יצירת Statement תקופתי

**Acceptance**

- בחירת Customer + טווח תאריכים
    
- המערכת מציעה Jobs במצב `DELIVERED` ושטרם חויבו
    
- Generate lines: נסיעה, תאריך, חומר, כמות מאושרת, מחיר, תוספות
    
- Statement מקבל מספר רץ פנימי
    
- Export PDF + Export Excel
    

### US-A4: תשלומים

**Acceptance**

- יצירת Payment עם תאריך/סכום/אמצעי/אסמכתא
    
- שיוך לחשבונית/Statement (מלא או חלקי)
    
- סטטוס: unpaid/partial/paid מתעדכן אוטומטית
    
- דוח יתרות פתוחות
    

---

## 7.4 ניהול צי והוצאות

### US-F1: רישום משאיות/נהגים

**Acceptance**

- CRUD מלא
    
- סטטוס פעיל/לא פעיל
    
- (שלב 2) תוקפי טסט/ביטוח + התראות
    

### US-E1: הוצאות

**Acceptance**

- הוצאה עם: קטגוריה, סכום, תאריך, ספק (אופציונלי), שיוך למשאית/נהג/פרויקט
    
- העלאת קובץ חשבונית ספק
    
- דוח הוצאות לפי משאית/קטגוריה/חודש
    

---

# 8) מודל נתונים (DB Schema – High level)

## 8.1 טבלאות ליבה

**organizations**

- id, name, timezone, settings_json
    

**users**

- id, name, phone, email, password_hash, is_active
    

**user_roles**

- id, org_id, user_id, role (ADMIN/DISPATCH/ACCOUNTING/DRIVER)
    

**customers**

- id, org_id, name, vat_id, contact_name, phone, email, payment_terms
    

**sites**

- id, org_id, customer_id, name, address, lat, lng, opening_hours, notes
    

**drivers**

- id, org_id, user_id, name, phone, license_type, is_active
    

**trucks**

- id, org_id, plate_number, model, capacity_ton, capacity_m3, is_active
    

**trailers**

- id, org_id, plate_number, capacity_ton, is_active
    

**materials**

- id, org_id, name, billing_unit (TON/M3/TRIP/KM)
    

**price_lists**

- id, org_id, customer_id nullable (null=general), material_id
    
- from_site_id nullable, to_site_id nullable
    
- unit, base_price
    
- min_charge nullable
    
- wait_fee_per_hour nullable
    
- night_surcharge_pct nullable
    
- valid_from, valid_to
    

## 8.2 Jobs + מסמכים

**jobs**

- id, org_id, customer_id
    
- from_site_id, to_site_id, material_id
    
- planned_qty, actual_qty nullable, unit
    
- scheduled_date, priority
    
- driver_id nullable, truck_id nullable, trailer_id nullable
    
- status
    
- pricing_total, pricing_breakdown_json
    
- manual_override_total nullable, manual_override_reason nullable
    
- created_by, created_at, updated_at
    

**job_status_events**

- id, job_id, status, event_time, user_id, lat, lng, note
    

**delivery_notes**

- id, job_id, note_number, receiver_name, receiver_signature_file_id, delivered_at
    

**weigh_tickets**

- id, job_id, ticket_number, gross_weight, tare_weight, net_weight, file_id, issued_at
    

**files**

- id, org_id, storage_key, filename, mime_type, size, uploaded_by, uploaded_at
    

**job_files**

- id, job_id, file_id, type (PHOTO/WEIGH_TICKET/DELIVERY_NOTE/OTHER)
    

## 8.3 חיוב וגבייה

**statements**

- id, org_id, customer_id, period_from, period_to
    
- number, status (DRAFT/SENT/PAID/PARTIAL)
    
- subtotal, tax, total, created_by, created_at
    

**statement_lines**

- id, statement_id, job_id
    
- description, qty, unit_price, total, breakdown_json
    

**payments**

- id, org_id, customer_id
    
- amount, paid_at, method, reference
    
- created_by, created_at
    

**payment_allocations**

- id, payment_id, statement_id, amount
    

## 8.4 הוצאות

**expenses**

- id, org_id
    
- category, amount, expense_date
    
- vendor_name nullable
    
- truck_id nullable, driver_id nullable, job_id nullable, customer_id nullable
    
- file_id nullable
    
- note
    

## 8.5 Audit

**audit_logs**

- id, org_id, user_id, entity_type, entity_id, action, before_json, after_json, created_at
    

---

# 9) API Endpoints (REST)

להלן מינימום Endpoints (אפשר גם GraphQL, אבל REST מספיק):

## Auth

- `POST /api/auth/login`
    
- `POST /api/auth/logout`
    
- `GET /api/auth/me`
    

## Customers/Sites

- `GET/POST /api/customers`
    
- `GET/PATCH/DELETE /api/customers/{id}`
    
- `GET/POST /api/sites`
    
- `GET/PATCH/DELETE /api/sites/{id}`
    

## Fleet

- `GET/POST /api/drivers`
    
- `GET/POST /api/trucks`
    
- `GET/POST /api/trailers`
    

## Materials & Pricing

- `GET/POST /api/materials`
    
- `GET/POST /api/price-lists`
    
- `POST /api/jobs/{id}/pricing/preview` (מחזיר breakdown)
    

## Jobs

- `GET /api/jobs?date=YYYY-MM-DD&status=&customer_id=&driver_id=`
    
- `POST /api/jobs`
    
- `GET /api/jobs/{id}`
    
- `PATCH /api/jobs/{id}` (כולל assign)
    
- `POST /api/jobs/{id}/status` (יוצר event ומעדכן status)
    
- `POST /api/jobs/{id}/files` (upload link/metadata)
    
- `POST /api/jobs/{id}/delivery-note` (כולל חתימה)
    
- `POST /api/jobs/{id}/weigh-ticket` (metadata + file)
    

## Statements/Invoices

- `POST /api/statements/generate` (customer_id, from, to, job_ids[])
    
- `GET/POST /api/statements`
    
- `GET /api/statements/{id}`
    
- `PATCH /api/statements/{id}` (status: sent)
    
- `GET /api/statements/{id}/export/pdf`
    
- `GET /api/statements/{id}/export/xlsx`
    

## Payments

- `GET/POST /api/payments`
    
- `POST /api/payments/{id}/allocate` (statement_id, amount)
    

## Expenses

- `GET/POST /api/expenses`
    
- `PATCH/DELETE /api/expenses/{id}`
    

## Reports

- `GET /api/reports/operations?from=&to=&group_by=driver|truck|customer`
    
- `GET /api/reports/finance/ar-aging?as_of=`
    
- `GET /api/reports/finance/profitability?from=&to=&group_by=truck|customer`
    

---

# 10) כללי ולידציה (Business Rules)

1. מעבר ל־`DELIVERED` מחייב:
    
    - חתימה + receiver_name
        
    - לפחות קובץ אחד (תמונה/תעודה)
        
2. Job לא נכנס ל־Statement אם:
    
    - לא `DELIVERED` או חסר חובה
        
    - כבר חויב (נמצא ב־statement_lines)
        
3. Override מחיר:
    
    - רק Accounting/Admin
        
    - חובה reason
        
    - נשמר audit
        
4. Quantity:
    
    - planned_qty תמיד קיים
        
    - actual_qty יכול להגיע מהנהג/שקילה/משרד
        
    - אם יש weigh_ticket → net_weight יכול להציע actual_qty אוטומטית
        

---

# 11) Non-Functional Requirements

- **Offline-first לנהגים**: Queue מקומית + retry
    
- **אבטחה**: JWT + RBAC + rate limiting ל־login
    
- **אחסון קבצים**: S3-compatible + חתימות upload (presigned)
    
- **ביצועים**:
    
    - Jobs list עם pagination + indexes על (org_id, scheduled_date, status)
        
- **Audit**: שינויי מחיר/כמות/סטטוס + מי/מתי
    
- **לוגים**: errors + trace_id
    
- **GDPR/פרטיות**: מחיקת משתמש/אנונימיזציה לפי צורך (שלב 2)
    

---

# 12) Wireframe טקסטואלי (מה יש בכל מסך)

## Dispatch Board

- Header: תאריך + פילטרים
    
- עמודות: Planned / Assigned / Enroute / Delivered / Closed
    
- כל כרטיס Job: לקוח, From→To, חומר, כמות, נהג/משאית, סטטוס, “חריגים” (חסר מסמך)
    

## Job Details (Admin)

- פרטי נסיעה
    
- Timeline סטטוסים
    
- קבצים (Gallery)
    
- Pricing breakdown + override
    
- כפתור “Mark Billable” (או אוטומטי לאחר delivered + בדיקות)
    

## Mobile – Job

- פרטי יעד + ניווט (פתיחת Waze/Maps)
    
- כפתורי סטטוס
    
- העלאת תמונות
    
- חתימה
    

---

# 13) קריטריוני הצלחה ל־MVP

- סדרן מצליח לנהל יום עבודה מלא עם 30–200 נסיעות
    
- נהג מסיים נסיעה עם חתימה ותמונות בלי לחזור למשרד
    
- הנהלת חשבונות מפיקה סיכום עבודה לפי לקוח תוך דקות
    
- אחוז נסיעות “חסרות מסמכים” קטן מ־5% אחרי חודש שימוש
    

---

# 14) תכנית עבודה לצוות (מומלץ)

## ספרינט 1

- Auth + Roles
    
- Customers/Sites
    
- Fleet בסיסי
    
- Jobs CRUD + statuses בסיסיים
    

## ספרינט 2

- Mobile Driver PWA: assignments + status + upload files
    
- Delivery note: signature
    
- Files storage
    

## ספרינט 3

- Pricing Engine + price lists
    
- Statements generation + PDF/Excel export
    
- Payments + AR basic
    

## ספרינט 4 (Hardening)

- Offline queue מלא
    
- Audit logs
    
- Reports בסיסיים
    
- QA + שיפור UX