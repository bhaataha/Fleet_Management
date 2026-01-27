# דו"ח יכולות מערכת Fleet Management / TruckFlow

**תאריך:** 27/01/2026  
**גרסה:** 1.0  
**הקשר:** סקירת קוד + תיעוד + סטטוס MVP

---

## תקציר מנהלים
המערכת היא פתרון SaaS רב‑ארגוני לניהול תפעול הובלות (נבנתה לענף הובלות עפר/צובר), עם תשתית רחבה לניהול ארגונים, צי, נסיעות, תמחור, חיוב/גבייה, קבלני‑משנה, מסמכים ואפליקציית נהגים (PWA). ה‑MVP פעיל ומכסה את הזרימה המרכזית מקצה‑לקצה (יצירת נסיעה → ביצוע בשטח → חיוב/סיכום), אך קיימים מודולים בתכנון/חלקיים (התראות, RBAC מתקדם, חתימה דיגיטלית מלאה, מפות GPS, דוחות מתקדמים ועוד).

כדי להרחיב את המערכת ללוגיסטיקה כללית (לא רק עפר), מומלץ לבצע הכללה של המודל הדומייני (Shipment/Order/Stop/Leg), להוסיף מנוע תמחור חוקים גמיש, מודולריות לפי ענפי לוגיסטיקה (קונטיינרים/קירור/משטחים/Last‑Mile), ואינטגרציות טלמטיקה/ERP/WMS. בפועל ניתן לבצע זאת בשכבות, תוך שמירה על תאימות לאחור.

---

## מקורות שנבדקו (מסמכים וקוד)
### מסמכי תיעוד מרכזיים
- `README.md`, `PROJECT_STRUCTURE.md`, `docs/INDEX.md`, `docs/README.md`, `docs/STRUCTURE.md`
- `docs/architecture/plan.md`, `docs/architecture/MULTI_TENANT_SPEC.md`
- `docs/features/SUBCONTRACTOR_SYSTEM_SPEC.md`, `docs/features/ALERTS_SYSTEM_SPEC.md`, `docs/features/ALERTS_MVP_PLAN.md`
- `docs/features/RBAC_PERMISSIONS_SPEC.md`, `docs/features/MOBILE_APP_SPEC.md`
- `docs/features/LATEST_UPDATES.md`, `docs/features/NEW_PAGES_SUMMARY.md`
- `docs/project/TODO_IMPROVEMENTS.md`, `docs/project/RUNNING_STATUS.md`, `docs/project/MVP_COMPLETE.md`

### קוד ליבה (Backend + Frontend)
- Models: `backend/app/models/__init__.py`
- Multi‑Tenant: `backend/app/middleware/tenant.py`, `backend/app/core/tenant.py`
- API Router: `backend/app/api/v1/api.py`
- Endpoints מרכזיים: `backend/app/api/v1/endpoints/*` (jobs, pricing, statements, files, trucks, drivers, customers, sites, materials, expenses, subcontractors, super_admin, users, vehicle_types)
- Services: `backend/app/services/pdf_generator.py`, `backend/app/services/storage.py`
- Frontend: `frontend/src/app/fleet/page.tsx`, `frontend/src/lib/constants.ts`, `frontend/src/lib/i18n/index.ts`

---

## יכולות מערכת קיימות (As‑Is)

### 1) רב‑ארגוניות (Multi‑Tenant SaaS)
- ארגונים (`organizations`) עם תוכניות/מגבלות (משאיות/נהגים/אחסון) והעדפות (שפה/מטבע/אזור זמן).
- בידוד לפי `org_id` בכל היישויות המרכזיות.
- Middleware שמחלץ `org_id` מתוך JWT ומזריק ל‑request, כולל אימפרסונציה ל‑Super Admin.
- תשתית למגבלות תוכנית (`check_org_limit`).

### 2) ניהול משתמשים והרשאות
- JWT + Roles בסיסיים: ADMIN / DISPATCHER / ACCOUNTING / DRIVER.
- מודל `UserRoleModel` ל‑RBAC בסיסי.
- מפרט RBAC מתקדם קיים בתיעוד (OWNER, VIEWER, הזמנות משתמשים, Audit), אך לא מיושם במלואו בקוד.

### 3) ישויות ליבה ונתונים תפעוליים
- לקוחות (`Customer`) ואתרים (`Site`) כולל אתרי לקוח ואתרים כלליים (מחצבה/תחנת דלק/מזבלה).
- חומרים (`Material`) עם יחידות חיוב: TON / M3 / TRIP / KM.
- צי: משאיות (`Truck`), נהגים (`Driver`), נגררים (`Trailer`).
- טיפוסי רכב מותאמים (`VehicleType`) + רשימת סוגי משאית ב‑frontend (כולל מערבל בטון, משטח פתוח, טנדר וכו').
- קבלני‑משנה (`Subcontractor`) ומחירוני קבלן (`SubcontractorPriceList`).

### 4) ניהול נסיעות (Jobs/Trips)
- ישות `Job` עם סטטוסים מלאים: PLANNED → ASSIGNED → ENROUTE_PICKUP → LOADED → ENROUTE_DROPOFF → DELIVERED → CLOSED / CANCELED.
- לוג אירועים (`JobStatusEvent`) כולל GPS (lat/lng) ומידע משתמש.
- שיוך נהג/משאית/נגרר, כולל תמיכה בקבלן משנה.

### 5) תמחור וחיוב
- מחירונים ללקוחות (`PriceList`) עם תוספות: מינימום חיוב, תוספת לילה, המתנה, תוספת נסיעה.
- Preview לחישוב מחיר לפני יצירת נסיעה.
- Override ידני למחיר ב‑Job (עם סיבה).
- סיכומי עבודה/חשבוניות (`Statement`, `StatementLine`) כולל מע"מ.
- תשלומים (`Payment`) והקצאות לתעודות (`PaymentAllocation`).

### 6) הוצאות ורווחיות
- מודול הוצאות (`Expense`) עם שיוך לנהג/משאית/נסיעה, סינון לפי קטגוריה וטווח תאריכים.

### 7) מסמכים וקבצים
- אחסון קבצים (Local filesystem במצב MVP, S3/MinIO ב‑production).
- העלאת קבצים לנסיעה (`/jobs/{id}/files/upload`) וקריאה של קבצים (`/jobs/{id}/files`).
- קישור שיתוף קצר (`ShareUrl`) להפניה ל‑PDF.
- תשתית PDF קיימת ל‑Delivery Note עם תמיכה ב‑RTL ועיצוב מקצועי.

### 8) אפליקציית נהגים (PWA)
- אפליקציית נהג סטטית (`/driver.html`) עם עדכוני סטטוס, GPS, Offline ו‑Service Worker.

### 9) ממשק ניהול Web
- דפי מערכת עיקריים קיימים: Dashboard, Dispatch, Jobs, Customers, Sites, Materials, Fleet, Billing, Reports, Settings.
- Fleet Page כולל חיווי פגות תוקף (ביטוח/טסט/רישיון).
- תמיכה מלאה ב‑i18n: עברית/אנגלית/ערבית + RTL/LTR.

### 10) תשתית ו‑DevOps
- Docker Compose (frontend/backend/db/MinIO) + סקריפטי התקנה.
- Alembic migrations + SQL init.

---

## מיפוי יכולות לפי מודולים

| מודול | יכולות מרכזיות | סטטוס כללי |
|---|---|---|
| רב‑ארגוניות | organizations, org_id isolation, Super Admin | פעיל |
| משתמשים והרשאות | JWT + RBAC בסיסי | פעיל חלקית |
| צי | משאיות/נהגים/נגררים/טיפוסי רכב | פעיל |
| תפעול | Dispatch, Jobs lifecycle, GPS events | פעיל |
| תמחור | מחירונים, חישוב, override | פעיל |
| חיוב/גבייה | Statements, Payments, Allocations | פעיל חלקית (UI בסיסי) |
| קבלני‑משנה | CRUD + מחירונים | פעיל |
| מסמכים | העלאת קבצים, PDF בסיסי, Share URL | פעיל חלקית |
| דוחות | דפי Reports בסיסיים/placeholder | חלקי |
| התראות | מפרט קיים (Alerts System) | בתכנון |
| RBAC מתקדם | מפרט מלא | בתכנון |

---

## פערים/שיפורים מומלצים (Top Priority)

### A) תפעול בזמן אמת ו‑GPS
- UI למפת צי חיה + היסטוריית מסלול (`/fleet-tracking`).
- Endpoints ייעודיים למיקום אחרון/היסטוריה.
- WebSocket/Push לעדכונים חיים (או polling מבוקר).

### B) מסמכים וחתימות
- חתימה דיגיטלית ב‑Driver App + endpoint לשמירה.
- PDF מלא לתעודות משלוח/סיכומי עבודה.
- OCR לתעודות שקילה (Phase 2).

### C) התראות
- יישום Alerts MVP (3 התראות קריטיות) לפי `ALERTS_MVP_PLAN.md`.
- מרכז התראות UI + badge.

### D) הרשאות וניהול משתמשים מתקדם
- Owner/Viewer, הזמנות משתמשים, חסימות, Audit לוג הרשאות.
- UI לניהול משתמשים לפי `RBAC_PERMISSIONS_SPEC.md`.

### E) דוחות וכלכליות
- דוחות רווחיות משאית/לקוח/קבלן משנה.
- Aging מתקדם + KPI תפעוליים (איחורים, מסמכים חסרים).

### F) יציבות/סקייל
- אינדקסים לפי org_id + תאריכים (Jobs, Statements, Expenses).
- בדיקות E2E ותיקוף הרשאות עקבי בכל ה‑endpoints.

---

## התאמה ללוגיסטיקה כללית (Beyond Dirt Hauling)
המערכת בנויה היום סביב “נסיעה עם חומר” (Job + Material). כדי לתמוך בכל סוגי הלוגיסטיקה יש לבצע הכללה של המודל והזרימות:

### 1) הכללת מודל הדומיין
מומלץ להפריד בין **Order/Shipment** לבין **Leg/Stop**:
- **Shipment**: הזמנה לוגיסטית (לקוח, SLA, מחיר, מסמכים).
- **Leg/Stop**: מקטע נסיעה עם נקודות עצירה (Pickup/Dropoff/Hub).
- **Asset**: כל אמצעי הובלה (משאית/נגרר/מכולה/ואן/רכב קירור).

### 2) סוגי מטען (Cargo Types)
להחליף “Material” בישות כללית **CargoType** עם מאפיינים:
- יחידות חיוב: משקל/נפח/משטח/יחידה/ק״מ/שעה.
- מגבלות טיפול: קירור, ADR/Hazmat, שבירות, טמפרטורה.
- אריזות: pallet, container, loose, parcels.

### 3) מנוע תמחור גמיש
בניית Pricing Rules Engine:
- חוקים לפי מרחק, אזורים, זמן, משקל, תדלוק, כבישי אגרה.
- תמחור לפי חוזה לקוח/ספק (rate tables, tiers).
- תוספות עונתיות/שעתיות + surcharge דלק.

### 4) תהליכי עבודה מודולריים
לאפשר פרופילי Workflow לפי ענף:
- עפר/צובר (כיום)
- קונטיינרים (Container trucking)
- קירור (Cold Chain) – תיעוד טמפ׳
- Last‑Mile/Parcel – ריבוי stops
- פסולת/מיחזור – אישורי הטמנה

### 5) מסמכים לוגיסטיים נוספים
להוסיף סוגי מסמכים:
- POD / BOL / CMR / Customs
- טופסי טמפרטורה / שקילה / צילום אריזה

### 6) אינטגרציות
- טלמטיקה/ELD (Geotab, Samsara וכו׳)
- ERP/חשבונאות (Priority, SAP, Netsuite)
- WMS/TMS קיימים

---

## מיפוי מהיר: ישויות קיימות → לוגיסטיקה כללית

| היום | הכללה מוצעת | הערה |
|---|---|---|
| Job | Shipment + Legs | תמיכה במקטעים ומספר עצירות |
| Material | CargoType | סוג מטען כללי עם מאפייני טיפול |
| Site | Stop/Location | כולל Hub, Warehouse, Port |
| Truck/Trailer | Asset/Equipment | כולל מכולות/רכבי קירור |
| PriceList | RateTable | מנוע תמחור חוקים |

---

## תכנית מעבר מומלצת (שלבים)

### שלב 1 – שכבת הכללה ללא שבירה
- הוספת טבלאות Shipment/Stop/Leg במקביל ל‑Job.
- Sync דו‑כיווני בין Job ↔ Shipment (ללקוחות קיימים).

### שלב 2 – מנוע תמחור חוקים
- הכנסת Rate Engine עם חוקים גמישים.
- מיפוי מחירונים קיימים לחוקים.

### שלב 3 – UI מודולרי לפי ענף
- הגדרות Tenant: סוג פעילות (Bulk / Container / Cold / Last‑Mile).
- התאמת מסכים/שדות בהתאם לפרופיל.

### שלב 4 – מסמכים ואינטגרציות
- הרחבת מסמכים לפי ענף.
- הטמעת API/Webhooks ואינטגרציות חיצוניות.

---

## המלצות מיידיות (30–60 יום)
1. להשלים חתימה דיגיטלית + PDF מלא (Delivery Note + Statement).  
2. להפעיל Alerts MVP (3 סוגי התראות).  
3. להוסיף Map Tracking UI לניהול צי.  
4. לסגור פערי RBAC בסיסיים (Owner/Viewer + ניהול משתמשים).  
5. להכין “שכבת הכללה” ל‑Shipment/Stops כדי לפתוח את הדרך ללוגיסטיקה כללית.

---

## נספח: סטטוס כללי לפי מסמכים
- **MVP פעיל:** לפי `docs/project/MVP_COMPLETE.md` ו‑`RUNNING_STATUS.md`.
- **שיפורים מרכזיים:** `docs/project/TODO_IMPROVEMENTS.md`.
- **פיצ'רים בתכנון:** Alerts, RBAC מתקדם, Mobile App הרחבה.

---

אם תרצה, אכין גם:
- Roadmap מפורט (אפיון + אומדני זמנים)
- רשימת שינויים למודל נתונים (ERD) עבור לוגיסטיקה כללית
- תוכנית Migration מסודרת ללקוחות קיימים
