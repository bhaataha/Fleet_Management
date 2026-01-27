# ✅ Priority 1 Features - Implementation Complete

## תאריך: 2026-01-26

---

## 🎯 תכונות שהושלמו

### 1. ✅ Truck-Centric Architecture (ארכיטקטורת משאית-מרכזית)

#### Backend Changes:
- **Migration 004**: `backend/db/migrations/004_truck_centric_architecture.sql`
  - הוספת `primary_driver_id` ל-trucks (קשר ל-drivers.id)
  - הוספת `secondary_driver_ids` ל-trucks (JSONB array של driver IDs)
  - הסרת `default_truck_id` מ-drivers (breaking change - כבר לא drivers בוחרים משאית)
  - הפיכת `sites.customer_id` ל-nullable (תמיכה באתרים כלליים)
  - הוספת `is_generic` flag ל-sites
  - יצירת indexes לביצועים
  
- **Models Updated**: `backend/app/models/__init__.py`
  ```python
  # Truck model:
  primary_driver_id = Column(Integer, ForeignKey("drivers.id"))
  secondary_driver_ids = Column(JSONB, default=[])
  primary_driver = relationship("Driver", foreign_keys=[primary_driver_id])
  
  # Driver model:
  # REMOVED: default_truck_id, default_truck relationship
  primary_trucks = relationship("Truck", foreign_keys="Truck.primary_driver_id")
  ```

- **Schemas Updated**: `backend/app/api/v1/endpoints/trucks.py`
  - TruckBase: הוספת primary_driver_id, secondary_driver_ids
  - TruckUpdate: שדות אופציונליים

#### Status:
- ✅ Migration executed successfully
- ✅ Models updated
- ✅ Backend restarted without errors
- ⏳ Frontend truck selection UI (pending)

---

### 2. ✅ Manual Price Override (מחיר ידני)

#### Backend Implementation:
- **Schema Updates**: `backend/app/api/v1/endpoints/jobs.py`
  ```python
  class JobCreate(JobBase):
      manual_override_total: Optional[float] = None
      manual_override_reason: Optional[str] = None
  ```

- **Validation**:
  - אם `manual_override_total` מוזן, `manual_override_reason` חובה
  - סיבה חייבת להיות לפחות 10 תווים
  - TODO: הגבלת הרשאות (רק ADMIN/ACCOUNTING)

- **Audit Trail**:
  - שדות קיימים במודל Job: `manual_override_total`, `manual_override_reason`
  - `created_by` מתעד מי ביצע את השינוי

#### Frontend Implementation:
- **UI Component**: `frontend/src/app/jobs/new/page.tsx`
  - Checkbox: "🖊️ מחיר ידני (Override)"
  - שדות נוספים (מוצגים רק אם ה-checkbox מסומן):
    - **מחיר מותאם אישית**: input number עם step 0.01
    - **סיבה לשינוי מחיר**: textarea (חובה, מינימום 10 תווים)
  - רקע צהוב (bg-yellow-50) להדגשת override
  - חישוב הפרש: מציג ההפרש ב-₪ ובאחוזים לעומת מחיר מחירון
  - התראה: "⚠️ שינוי מחיר ידני יתועד במערכת"

- **Validation Frontend**:
  ```typescript
  if (manualPricingEnabled) {
    if (!manualPrice || parseFloat(manualPrice) <= 0) {
      alert('נא להזין מחיר ידני תקין')
      return
    }
    if (!overrideReason || overrideReason.trim().length < 10) {
      alert('נא להזין סיבה מפורטת (לפחות 10 תווים)')
      return
    }
  }
  ```

- **Payload**:
  ```typescript
  if (manualPricingEnabled && manualPrice && overrideReason) {
    payload.manual_override_total = parseFloat(manualPrice)
    payload.manual_override_reason = overrideReason.trim()
  }
  ```

#### Status:
- ✅ Backend validation implemented
- ✅ Frontend UI implemented
- ✅ Form validation working
- ✅ Payload sent correctly
- ⏳ RBAC restrictions (TODO: limit to ADMIN/ACCOUNTING only)

---

### 3. ✅ Quick-Add Modals (יצירה מהירה)

#### Component: QuickAddCustomerModal
- **Path**: `frontend/src/components/modals/QuickAddCustomerModal.tsx`
- **Fields**:
  - שם (חובה)
  - טלפון (חובה)
  - ח.פ/ע.מ (אופציונלי)
  - איש קשר (אופציונלי)
- **Features**:
  - טופס מינימלי - רק שדות חובה
  - טיפ: "פרטים נוספים ניתן להוסיף מאוחר יותר"
  - הצלחה → מחזיר לקוח חדש + סוגר מודל
  - ביטול → סוגר מודל

#### Component: QuickAddSiteModal
- **Path**: `frontend/src/components/modals/QuickAddSiteModal.tsx`
- **Fields**:
  - שם אתר (חובה)
  - כתובת (חובה)
  - איש קשר (אופציונלי)
  - טלפון (אופציונלי)
  - **🏭 אתר כללי** (checkbox) - אתר שאינו משויך ללקוח ספציפי
- **Features**:
  - אם `customerId` מועבר בprops → אתר ישויך אוטומטית ללקוח
  - אם checkbox "אתר כללי" מסומן → `customer_id = null`
  - סוגי אתרים כלליים: מחצבה, תחנת דלק, מזבלה, מכון שקילה
  - אייקון 🏭 מוצג ליד אתרים כלליים ברשימה

#### Integration in Job Form:
- **Buttons**:
  - "➕ לקוח חדש" - מתחת ל-Combobox של לקוחות
  - "➕ אתר חדש" - מתחת ל-Combobox של מקור ויעד

- **Success Handlers**:
  ```typescript
  onSuccess={(newCustomer) => {
    setCustomers(prev => [...prev, newCustomer])  // הוספה לרשימה
    setFormData(prev => ({ 
      ...prev, 
      customer_id: newCustomer.id.toString()  // בחירה אוטומטית
    }))
    setShowQuickAddCustomer(false)
  }}
  
  onSuccess={(newSite) => {
    setSites(prev => [...prev, newSite])
    // אוטו-בחירה: אם from_site ריק → הכנס שם, אחרת הכנס ל-to_site
    if (!formData.from_site_id) {
      setFormData(prev => ({ ...prev, from_site_id: newSite.id.toString() }))
    } else if (!formData.to_site_id) {
      setFormData(prev => ({ ...prev, to_site_id: newSite.id.toString() }))
    }
    setShowQuickAddSite(false)
  }}
  ```

#### Status:
- ✅ QuickAddCustomerModal created
- ✅ QuickAddSiteModal created
- ✅ Integration in job form
- ✅ Success handlers wired
- ✅ Auto-selection after creation
- ✅ Generic sites support (🏭 icon)

---

## 📊 Technical Summary

### Files Modified/Created:
1. ✅ `backend/db/migrations/004_truck_centric_architecture.sql` - NEW
2. ✅ `backend/app/models/__init__.py` - MODIFIED (Truck, Driver, Site)
3. ✅ `backend/app/api/v1/endpoints/trucks.py` - MODIFIED (schemas)
4. ✅ `backend/app/api/v1/endpoints/jobs.py` - MODIFIED (JobCreate + validation)
5. ✅ `frontend/src/components/modals/QuickAddCustomerModal.tsx` - NEW (143 lines)
6. ✅ `frontend/src/components/modals/QuickAddSiteModal.tsx` - NEW (186 lines)
7. ✅ `frontend/src/app/jobs/new/page.tsx` - MODIFIED (modals + manual pricing)

### Database Changes:
```sql
-- Executed successfully:
ALTER TABLE trucks ADD COLUMN primary_driver_id INTEGER REFERENCES drivers(id);
ALTER TABLE trucks ADD COLUMN secondary_driver_ids JSONB DEFAULT '[]';
ALTER TABLE drivers DROP COLUMN IF EXISTS default_truck_id;
ALTER TABLE sites ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE sites ADD COLUMN IF NOT EXISTS is_generic BOOLEAN DEFAULT FALSE;
CREATE INDEX idx_trucks_primary_driver ON trucks(primary_driver_id);
CREATE INDEX idx_sites_is_generic ON sites(is_generic);
CREATE INDEX idx_sites_customer_id ON sites(customer_id);
CREATE INDEX idx_sites_combined ON sites(customer_id, is_generic);
```

### Container Restarts:
- ✅ `fleet_backend` - Restarted, running healthy
- ✅ `fleet_frontend` - Restarted, compiled successfully

---

## 🎬 User Experience Improvements

### Before Priority 1:
- יצירת Job דרשה לקוחות/אתרים קיימים - צריך לנווט לעמוד אחר
- מחיר נשלט רק ע״י מחירון - אין גמישות
- משאיות לא מחוברות לנהגים - בחירה ידנית בכל פעם

### After Priority 1:
- ✅ יצירת לקוח/אתר **בזמן פתיחת Job** - לחיצה אחת
- ✅ מחיר ידני **עם תיעוד מלא** - גמישות + אחריותיות
- ✅ משאיות מחוברות לנהגים - קל יותר לשבץ

---

## 🚀 Next Steps (Priority 2)

### From SUBCONTRACTOR_SYSTEM_SPEC.md:

1. **Truck-Centric UI** (Week 2):
   - עדכון טופס Job: בחירת משאית לפני נהג
   - Endpoint חדש: `GET /trucks/{truck_id}/available-drivers`
   - תצוגת נהג ראשי + נהגים משניים
   - סינון אוטומטי של נהגים לפי משאית

2. **Reports - Subcontractor Billing**:
   - דוח חודשי לכל קבלן משנה
   - סה״כ נסיעות, סה״כ לחיוב
   - Export PDF/Excel

3. **Reports - Truck Profitability**:
   - הכנסות לעומת הוצאות (דלק, תיקונים)
   - רווח/הפסד לפי משאית
   - KPIs: נסיעות ממוצעות ליום, הכנסה ממוצעת לנסיעה

4. **Reports - Customer Summary**:
   - סה״כ נסיעות לתקופה
   - פילוח לפי חומר, אתרים, קבלנים
   - שעות שיא, ימים עמוסים

---

## 📝 Known Issues & TODOs

### Backend:
- [ ] RBAC for manual pricing (limit to ADMIN/ACCOUNTING only)
- [ ] Audit log table for price overrides (separate from jobs)
- [ ] Validate driver assignments (primary + secondary must be active)

### Frontend:
- [ ] Truck-centric selection UI in job form
- [ ] Display truck's primary driver as default
- [ ] Show secondary drivers in dropdown
- [ ] Highlight generic sites in UI (🏭 icon consistently)

### Performance:
- [ ] Index optimization for large-scale queries
- [ ] Pagination for customers/sites dropdowns (when >100 items)
- [ ] Lazy loading for modals

---

## 🧪 Testing Checklist

### Manual Price Override:
- [x] Checkbox enables/disables fields
- [x] Price validation (positive number)
- [x] Reason validation (min 10 chars)
- [x] Difference calculation (₪ + %)
- [x] Alert on missing fields
- [x] Payload sent to backend
- [x] Backend validation works
- [ ] RBAC restriction (pending)

### Quick-Add Modals:
- [x] Customer modal opens/closes
- [x] Site modal opens/closes
- [x] Customer creation successful
- [x] Site creation successful
- [x] Auto-selection after creation
- [x] Generic site checkbox works
- [ ] Validation errors display correctly
- [ ] API error handling

### Truck-Centric:
- [x] Migration executed
- [x] Models updated
- [x] Backend restart successful
- [ ] Truck selection UI (not implemented yet)
- [ ] Driver filtering (not implemented yet)

---

## 📖 Documentation Updated:
- ✅ `docs/features/SUBCONTRACTOR_SYSTEM_SPEC.md` - Original specification
- ✅ `docs/features/PRIORITY_1_COMPLETE.md` - This file

---

**Status**: **COMPLETE** ✅  
**Next Phase**: Priority 2 (Week 2) - Reports & Truck-Centric UI  
**Last Updated**: 2026-01-26 15:30 IST
