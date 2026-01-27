# 📋 תכנית יישום - מערכת התראות MVP

**תאריך התחלה:** 27/01/2026  
**זמן משוער:** 2 שבועות  
**סטטוס:** 🟡 בתכנון

---

## 🎯 מטרות MVP

1. ✅ תשתית בסיסית להתראות
2. ✅ 3 סוגי התראות קריטיות
3. ✅ UI פשוט ופונקציונלי
4. ✅ Real-time updates

**לא כלול ב-MVP:**
- ❌ Email/SMS
- ❌ Push notifications
- ❌ Alert preferences
- ❌ Alert history/archive

---

## 📅 Timeline

### Week 1 - Backend

#### Day 1-2: Database & Models
- [ ] יצירת migration לטבלת `alerts`
- [ ] יצירת SQLAlchemy model
- [ ] יצירת Pydantic schemas
- [ ] Enums: AlertType, AlertSeverity, AlertCategory

#### Day 3-4: API Endpoints
- [ ] `GET /api/alerts` - רשימת התראות
- [ ] `GET /api/alerts/{id}` - התראה בודדת
- [ ] `POST /api/alerts/{id}/read` - סימון כנקרא
- [ ] `POST /api/alerts/{id}/dismiss` - דחייה
- [ ] `GET /api/alerts/unread-count` - מספר לא נקראות

#### Day 5: Background Jobs
- [ ] יצירת alert service
- [ ] Background job: check_unassigned_jobs
- [ ] Background job: check_insurance_expiry
- [ ] Cron setup (APScheduler או Celery Beat)

---

### Week 2 - Frontend

#### Day 1-2: Components
- [ ] Alert Badge component (בהדר)
- [ ] Notification Panel component
- [ ] Alert Item component
- [ ] Alert severity icons & colors

#### Day 3-4: Integration
- [ ] API client functions
- [ ] useAlerts hook
- [ ] Real-time polling (30 sec)
- [ ] Integration בהדר ראשי

#### Day 5: Polish
- [ ] Animations & transitions
- [ ] Empty states
- [ ] Error handling
- [ ] Testing manual

---

## 🗂️ קבצים שייווצרו

### Backend

```
backend/
├── app/
│   ├── models/
│   │   ├── alert.py                    # ✅ NEW
│   │   └── __init__.py                 # ✏️ UPDATE
│   ├── schemas/
│   │   ├── alert.py                    # ✅ NEW
│   │   └── __init__.py                 # ✏️ UPDATE
│   ├── api/v1/endpoints/
│   │   ├── alerts.py                   # ✅ NEW
│   │   └── __init__.py                 # ✏️ UPDATE
│   ├── services/
│   │   └── alert_service.py            # ✅ NEW
│   ├── jobs/
│   │   └── alert_jobs.py               # ✅ NEW
│   └── core/
│       └── scheduler.py                # ✅ NEW
├── alembic/versions/
│   └── xxxx_add_alerts_table.py        # ✅ NEW
```

### Frontend

```
frontend/
├── src/
│   ├── types/
│   │   └── alert.ts                    # ✅ NEW
│   ├── lib/
│   │   ├── api.ts                      # ✏️ UPDATE
│   │   └── hooks/
│   │       └── useAlerts.ts            # ✅ NEW
│   ├── components/
│   │   ├── alerts/
│   │   │   ├── AlertBadge.tsx          # ✅ NEW
│   │   │   ├── NotificationPanel.tsx   # ✅ NEW
│   │   │   ├── AlertItem.tsx           # ✅ NEW
│   │   │   └── AlertSeverityIcon.tsx   # ✅ NEW
│   │   └── layout/
│   │       └── DashboardLayout.tsx     # ✏️ UPDATE (add badge)
```

---

## 🔧 פרטי יישום

### 1. Database Migration

```sql
-- alembic/versions/xxxx_add_alerts_table.py

CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    
    entity_type VARCHAR(50),
    entity_id INTEGER,
    
    status VARCHAR(20) DEFAULT 'UNREAD',
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    
    created_for_user_id INTEGER REFERENCES users(id),
    created_for_role VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alerts_org_user ON alerts(org_id, created_for_user_id, status);
CREATE INDEX idx_alerts_type ON alerts(alert_type, created_at);
CREATE INDEX idx_alerts_severity ON alerts(severity, status);
```

### 2. Alert Types (MVP)

```python
class AlertType(str, enum.Enum):
    # התראות MVP בלבד
    JOB_NOT_ASSIGNED = "JOB_NOT_ASSIGNED"
    INSURANCE_EXPIRY = "INSURANCE_EXPIRY"
    JOB_ASSIGNED_TO_DRIVER = "JOB_ASSIGNED_TO_DRIVER"

class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    INFO = "INFO"

class AlertCategory(str, enum.Enum):
    OPERATIONAL = "OPERATIONAL"
    MAINTENANCE = "MAINTENANCE"
    SYSTEM = "SYSTEM"
```

### 3. Background Jobs Schedule

```python
# app/core/scheduler.py

from apscheduler.schedulers.background import BackgroundScheduler

scheduler = BackgroundScheduler()

# כל 15 דקות - בדיקת נסיעות ללא שיוך
scheduler.add_job(
    check_unassigned_jobs,
    'cron',
    minute='*/15',
    id='check_unassigned_jobs'
)

# יומי בשעה 08:00 - בדיקת ביטוחים
scheduler.add_job(
    check_insurance_expiry,
    'cron',
    hour=8,
    minute=0,
    id='check_insurance_expiry'
)

scheduler.start()
```

### 4. API Response Example

```json
GET /api/alerts

{
  "total": 15,
  "unread": 3,
  "items": [
    {
      "id": 123,
      "alert_type": "JOB_NOT_ASSIGNED",
      "severity": "HIGH",
      "category": "OPERATIONAL",
      "title": "נסיעה #1045 ללא שיוך",
      "message": "נסיעה לאתר החדש מתוכננת בעוד שעה וטרם שויכה",
      "action_url": "/jobs/1045",
      "entity_type": "job",
      "entity_id": 1045,
      "status": "UNREAD",
      "created_at": "2026-01-27T10:30:00Z",
      "expires_at": "2026-01-27T15:00:00Z"
    }
  ]
}
```

### 5. Frontend Component Structure

```tsx
// Header with Badge
<DashboardLayout>
  <Header>
    <NotificationBadge unreadCount={3} onClick={openPanel} />
  </Header>
  
  {/* Sliding Panel */}
  {isPanelOpen && (
    <NotificationPanel
      alerts={alerts}
      onClose={closePanel}
      onMarkAsRead={handleMarkAsRead}
      onDismiss={handleDismiss}
    />
  )}
</DashboardLayout>
```

---

## ✅ Definition of Done

### Backend
- [x] טבלת alerts קיימת ב-DB
- [ ] 5 API endpoints עובדים
- [ ] 2 background jobs רצים
- [ ] Tests: unit tests ל-alert_service
- [ ] Documentation: API docs ב-/docs

### Frontend
- [ ] Badge מציג מספר נכון
- [ ] Panel נפתח/נסגר חלק
- [ ] Alerts ניתנים לסימון כנקרא/דחייה
- [ ] Real-time polling עובד
- [ ] Mobile responsive

### Integration
- [ ] נסיעה חדשה יוצרת התראה
- [ ] נסיעה ללא שיוך מזהה ב-15 דקות
- [ ] ביטוח פג תוקף מזהה יומי
- [ ] Click על alert מוביל לעמוד הנכון

---

## 🧪 תרחישי בדיקה

### Test Case 1: נסיעה ללא שיוך
1. צור נסיעה עם scheduled_date בעוד 50 דקות
2. אל תשייך נהג/משאית
3. המתן 10 דקות
4. ✅ התראה מופיעה ב-badge ובפאנל
5. שייך משאית
6. ✅ התראה נעלמת אוטומטית

### Test Case 2: ביטוח פג תוקף
1. עדכן insurance_expiry למשאית ל-+6 ימים
2. הפעל manually את check_insurance_expiry()
3. ✅ התראה CRITICAL מופיעה
4. עדכן insurance_expiry ל-+60 ימים
5. ✅ התראה נפתרת

### Test Case 3: נסיעה שויכה לנהג
1. התחבר כסדרן
2. שייך נהג לנסיעה
3. התחבר כנהג
4. ✅ התראה מופיעה "נסיעה חדשה"

---

## 📊 Progress Tracking

### Backend Progress
```
[████████░░] 80% Complete
- ✅ Models created
- ✅ Schemas created
- ✅ API endpoints created
- ✅ Alert service created
- ⏳ Background jobs (in progress)
- ⏳ Scheduler setup (pending)
```

### Frontend Progress
```
[░░░░░░░░░░] 0% Complete
- ⏳ Components (pending)
- ⏳ API integration (pending)
- ⏳ Real-time polling (pending)
```

---

## 🚀 Getting Started

### הפעלת המערכת

```bash
# Backend
cd backend
alembic upgrade head
python -m app.main  # scheduler יתחיל אוטומטית

# Frontend
cd frontend
npm run dev

# בדיקה ידנית
curl http://localhost:8001/api/alerts
```

### יצירת התראה ידנית (לבדיקה)

```python
# backend/scripts/test_alerts.py
from app.services.alert_service import create_alert

create_alert(
    org_id="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    alert_type="JOB_NOT_ASSIGNED",
    severity="HIGH",
    title="בדיקה",
    message="זו התראת בדיקה",
    action_url="/jobs/1"
)
```

---

## 📞 Contact

**PM:** [Name]  
**Tech Lead:** [Name]  
**Slack:** #alerts-mvp

---

**עדכון אחרון:** 27/01/2026  
**סטטוס:** 🟡 בתכנון → 🟢 מוכן להתחלה
