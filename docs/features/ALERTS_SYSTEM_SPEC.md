# 🔔 איפיון מערכת התראות (Alerts & Notifications System)

**תאריך יצירה:** 27/01/2026  
**גרסה:** 1.0  
**סטטוס:** מאושר ליישום

---

## 📋 תוכן עניינים
- [מטרות המערכת](#מטרות-המערכת)
- [סוגי התראות](#סוגי-התראות)
- [ערוצי משלוח](#ערוצי-משלוח)
- [מודל נתונים](#מודל-נתונים)
- [תהליכים](#תהליכים)
- [UI/UX](#ui-ux)
- [שלבי פיתוח](#שלבי-פיתוח)

---

## 🎯 מטרות המערכת

### יעדים עסקיים
1. **צמצום איחורים** - התראה על נסיעות שלא התחילו בזמן
2. **שיפור תזרים מזומנים** - התראה על חשבוניות שלא שולמו
3. **מניעת קנסות** - התראה על ביטוחים/טסטים שפגו
4. **שיפור שירות** - התראה על חסרים במסמכים
5. **ניהול יעיל** - התראה על חריגות ממגבלות תוכנית

### יעדי משתמשים
- **מנהל**: סקירה כללית של כל החריגות
- **סדרן**: התראות תפעוליות בזמן אמת
- **מנה"ח**: התראות כספיות וגבייה
- **נהג**: התראות על משימות שלו בלבד

---

## 📬 סוגי התראות

### 1. התראות תפעוליות (Operational)

#### נסיעות (Jobs)
| התראה | תיאור | מתי | מי | חומרה |
|-------|--------|-----|-----|--------|
| JOB_NOT_ASSIGNED | נסיעה ב-PLANNED ללא נהג/משאית | 1 שעה לפני scheduled_date | Dispatcher | HIGH |
| JOB_NOT_STARTED | נסיעה ב-ASSIGNED אחרי scheduled_date | +30 דקות | Dispatcher | CRITICAL |
| JOB_DELAYED | נסיעה ב-LOADED ≥3 שעות | כל 30 דק' | Dispatcher | HIGH |
| JOB_MISSING_DOCS | נסיעה ב-DELIVERED ללא חתימה/תמונה | מיידי | Dispatcher | MEDIUM |
| JOB_STUCK | אין עדכון סטטוס ≥4 שעות | מיידי | Dispatcher + Driver | CRITICAL |

#### תחזוקה (Maintenance)
| התראה | תיאור | מתי | מי | חומרה |
|-------|--------|-----|-----|--------|
| INSURANCE_EXPIRY | insurance_expiry בעוד 30/15/7/1 ימים | יומי 08:00 | Admin | CRITICAL |
| TEST_EXPIRY | test_expiry בעוד 14/7/3 ימים | יומי 08:00 | Admin | HIGH |
| LICENSE_EXPIRY | license_expiry בעוד 30/14 ימים | יומי 08:00 | Admin + Driver | HIGH |

### 2. התראות כספיות (Financial)
| התראה | תיאור | מתי | מי | חומרה |
|-------|--------|-----|-----|--------|
| INVOICE_OVERDUE | Statement ב-SENT אחרי payment_terms | יומי | Accounting | HIGH |
| DEBT_30_DAYS | Statement unpaid ≥30 ימים | יומי | Accounting + Admin | CRITICAL |
| HIGH_EXPENSE | Expense ≥5000 ש"ח | מיידי | Admin | MEDIUM |
| SUBCONTRACTOR_UNBILLED | Job עם subcontractor ללא מחיר | סיום חודש | Accounting | MEDIUM |

### 3. התראות מערכת (System)
| התראה | תיאור | מתי | מי | חומרה |
|-------|--------|-----|-----|--------|
| TRIAL_ENDING | trial_ends_at בעוד 7/3/1 ימים | יומי | Owner | CRITICAL |
| TRUCK_LIMIT | total_trucks ≥ max_trucks * 0.9 | מיידי | Owner | MEDIUM |
| DRIVER_LIMIT | total_drivers ≥ max_drivers * 0.9 | מיידי | Owner | MEDIUM |
| STORAGE_LIMIT | storage_used_gb ≥ max_storage_gb * 0.8 | יומי | Admin | MEDIUM |

### 4. התראות זמן אמת (Real-time)
| התראה | תיאור | מתי | מי | חומרה |
|-------|--------|-----|-----|--------|
| JOB_ASSIGNED_TO_DRIVER | Job שויכה לנהג | מיידי | Driver | INFO |
| JOB_STATUS_CHANGED | Driver שינה סטטוס | מיידי | Dispatcher | INFO |
| JOB_COMPLETED | Job → DELIVERED | מיידי | Dispatcher + Accounting | SUCCESS |
| STATEMENT_CREATED | Statement נוצר | מיידי | Accounting | INFO |

---

## 📡 ערוצי משלוח

### שלב 1 (MVP)
1. **In-App Badge** 🔴 - מספר התראות לא נקראו
2. **Notification Center** 🔔 - פאנל התראות בתוך המערכת
3. **Email** 📧 - לחריגות קריטיות (אופציונלי)

### שלב 2
4. **SMS** 📱 - לנהגים (נסיעה חדשה, איחור)
5. **WhatsApp** 💬 - לסדרן/מנהל
6. **Push Notifications** 📲 - אפליקציית PWA

### שלב 3
7. **Webhook** 🔗 - אינטגרציה חיצונית
8. **Slack/Teams** 💼 - צוותי ניהול

---

## ⚡ רמות חומרה

```python
class AlertSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"  # 🔴 דורש טיפול מיידי
    HIGH = "HIGH"          # ⚠️ דורש טיפול בשעות הקרובות
    MEDIUM = "MEDIUM"      # 🟡 דורש טיפול היום
    LOW = "LOW"            # ℹ️ למידע בלבד
    INFO = "INFO"          # ℹ️ אינפורמטיבי
    SUCCESS = "SUCCESS"    # ✅ אישור חיובי
```

### כללי משלוח לפי חומרה

| חומרה | In-App | Email | SMS | התדירות |
|--------|--------|-------|-----|----------|
| CRITICAL | ✅ | ✅ | ✅ | מיידי |
| HIGH | ✅ | ✅ | ❌ | מיידי |
| MEDIUM | ✅ | ✅ (Digest) | ❌ | יומי 08:00 |
| LOW | ✅ | ❌ | ❌ | - |
| INFO | ✅ | ❌ | ❌ | - |
| SUCCESS | ✅ | ❌ | ❌ | - |

---

## 💾 מודל נתונים

### טבלה: alerts

```sql
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    -- סוג התראה
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    
    -- תוכן
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    action_url VARCHAR(500),
    
    -- קשר לישות
    entity_type VARCHAR(50),
    entity_id INTEGER,
    
    -- מצב
    status VARCHAR(20) DEFAULT 'UNREAD',
    read_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    
    -- משתמשים
    created_for_user_id INTEGER REFERENCES users(id),
    created_for_role VARCHAR(50),
    
    -- מטא
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT alerts_org_id_fkey FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX idx_alerts_org_user ON alerts(org_id, created_for_user_id, status);
CREATE INDEX idx_alerts_type ON alerts(alert_type, created_at);
CREATE INDEX idx_alerts_severity ON alerts(severity, status);
CREATE INDEX idx_alerts_expiry ON alerts(expires_at) WHERE expires_at IS NOT NULL;
```

### טבלה: alert_preferences

```sql
CREATE TABLE alert_preferences (
    id SERIAL PRIMARY KEY,
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id INTEGER REFERENCES users(id),
    
    alert_type VARCHAR(50) NOT NULL,
    
    -- ערוצים
    in_app_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    sms_enabled BOOLEAN DEFAULT false,
    push_enabled BOOLEAN DEFAULT false,
    
    -- זמנים
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(org_id, user_id, alert_type)
);
```

### טבלה: alert_logs

```sql
CREATE TABLE alert_logs (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER REFERENCES alerts(id) ON DELETE CASCADE,
    
    channel VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    
    recipient VARCHAR(255),
    error_message TEXT,
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_alert_logs_alert ON alert_logs(alert_id);
CREATE INDEX idx_alert_logs_sent ON alert_logs(sent_at);
```

---

## 🔄 תהליכים

### 1. יצירת התראות

#### Background Jobs (Scheduled)
```python
# Cron: */15 * * * * (כל 15 דקות)
def check_unassigned_jobs():
    threshold = datetime.now() + timedelta(hours=1)
    jobs = query_unassigned_jobs(threshold)
    for job in jobs:
        create_alert('JOB_NOT_ASSIGNED', job)

# Cron: 0 8 * * * (יומי 08:00)
def check_insurance_expiry():
    for days in [30, 15, 7, 1]:
        trucks = query_expiring_insurance(days)
        for truck in trucks:
            create_alert('INSURANCE_EXPIRY', truck, days_left=days)
```

#### Event-Based (Real-time)
```python
# במקום שיש עדכון נסיעה
@event_handler("job.assigned")
def on_job_assigned(job):
    if job.driver_id:
        create_alert(
            'JOB_ASSIGNED_TO_DRIVER',
            job,
            target_user=job.driver.user_id
        )
```

### 2. משלוח התראות

```python
def deliver_alert(alert):
    prefs = get_user_preferences(alert)
    
    # In-App - always
    # (already saved in DB)
    
    # Email
    if should_send_email(alert, prefs):
        send_email(alert)
    
    # SMS
    if should_send_sms(alert, prefs):
        send_sms(alert)
```

### 3. Auto-resolve

```python
# Cron: */5 * * * * (כל 5 דקות)
def auto_resolve_alerts():
    # נסיעה ששויכה
    resolve_alerts_where(
        alert_type='JOB_NOT_ASSIGNED',
        entity_has_truck=True
    )
    
    # ביטוח שחודש
    resolve_alerts_where(
        alert_type='INSURANCE_EXPIRY',
        entity_insurance_valid=True
    )
```

---

## 🎨 UI/UX Components

### 1. Header Badge
```tsx
<Bell className="h-6 w-6" />
{unreadCount > 0 && (
  <Badge count={unreadCount} />
)}
```

### 2. Notification Panel
```tsx
<div className="fixed right-0 top-16 w-96 h-full bg-white shadow-lg">
  <Header />
  <AlertList alerts={alerts} />
</div>
```

### 3. Alert Item
```tsx
<div className={unread ? 'bg-blue-50' : ''}>
  <SeverityIcon severity={alert.severity} />
  <Content>
    <Title>{alert.title}</Title>
    <Message>{alert.message}</Message>
    <Time>{formatRelativeTime(alert.created_at)}</Time>
  </Content>
  <Actions>
    <MarkRead />
    <Dismiss />
  </Actions>
</div>
```

---

## 📅 שלבי פיתוח

### Phase 1 - MVP (שבועיים)

**Backend**
- [x] טבלת alerts
- [ ] Alert Service (`create_alert`, `get_alerts`)
- [ ] API Endpoints (GET, POST read, POST dismiss)
- [ ] Background job: check_unassigned_jobs
- [ ] Models + Schemas

**Frontend**
- [ ] Notification Badge בהדר
- [ ] Notification Panel (צד ימין)
- [ ] Alert Item Component
- [ ] API Integration
- [ ] Real-time polling (30 sec)

**התראות ב-MVP**
1. נסיעה לא משויכת
2. ביטוח פג תוקף
3. נסיעה חדשה לנהג

---

### Phase 2 - Production (3 שבועות)

**Backend**
- [ ] טבלאות: alert_preferences, alert_logs
- [ ] Email Service (SMTP)
- [ ] SMS Service (Twilio/AWS)
- [ ] כל 15 סוגי ההתראות
- [ ] Auto-resolve logic
- [ ] Digest emails

**Frontend**
- [ ] Settings page
- [ ] Alert history
- [ ] Filters (severity, category)
- [ ] Toast notifications
- [ ] Sound notifications

---

### Phase 3 - Advanced (2 שבועות)

**Features**
- [ ] Push Notifications (PWA)
- [ ] WhatsApp integration
- [ ] Custom alert rules
- [ ] Analytics dashboard
- [ ] Webhooks

---

## 🎯 KPIs

| מדד | יעד | איך מודדים |
|-----|-----|------------|
| זמן תגובה (CRITICAL) | <15 דקות | created_at → resolved_at |
| False positives | <5% | dismissed ללא פעולה |
| נסיעות ללא מסמכים | <3% | לאחר הפעלת התראות |
| חשבוניות overdue | <10% | לאחר התראות גבייה |
| ביטוח פג תוקף | <48 שעות | זמן עד חידוש |

---

## 📝 דוגמאות קוד

### Backend - Create Alert

```python
from app.models import Alert, AlertSeverity

def create_alert(
    org_id: UUID,
    alert_type: str,
    severity: AlertSeverity,
    title: str,
    message: str,
    entity_type: str = None,
    entity_id: int = None,
    action_url: str = None,
    created_for_user_id: int = None,
    created_for_role: str = None,
    metadata: dict = None
) -> Alert:
    """יצירת התראה חדשה"""
    
    # בדיקה אם כבר קיימת התראה פעילה
    existing = db.query(Alert).filter(
        Alert.org_id == org_id,
        Alert.alert_type == alert_type,
        Alert.entity_id == entity_id,
        Alert.status.in_(['UNREAD', 'READ'])
    ).first()
    
    if existing:
        return existing
    
    alert = Alert(
        org_id=org_id,
        alert_type=alert_type,
        severity=severity.value,
        category=get_category_from_type(alert_type),
        title=title,
        message=message,
        entity_type=entity_type,
        entity_id=entity_id,
        action_url=action_url,
        created_for_user_id=created_for_user_id,
        created_for_role=created_for_role,
        metadata=metadata or {}
    )
    
    db.add(alert)
    db.commit()
    db.refresh(alert)
    
    return alert
```

### Frontend - Alert Hook

```tsx
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  const loadAlerts = async () => {
    const res = await alertsApi.getAll()
    setAlerts(res.data)
    setUnreadCount(res.data.filter(a => a.status === 'UNREAD').length)
  }
  
  const markAsRead = async (id: number) => {
    await alertsApi.markAsRead(id)
    loadAlerts()
  }
  
  const dismiss = async (id: number) => {
    await alertsApi.dismiss(id)
    loadAlerts()
  }
  
  useEffect(() => {
    loadAlerts()
    const interval = setInterval(loadAlerts, 30000) // כל 30 שניות
    return () => clearInterval(interval)
  }, [])
  
  return { alerts, unreadCount, markAsRead, dismiss, loadAlerts }
}
```

---

## 🔐 אבטחה

### הרשאות
- משתמש רואה רק התראות שלו או של התפקיד שלו
- Super Admin רואה את כל ההתראות (עם impersonation)
- התראות מסוננות לפי org_id

### Rate Limiting
- מקסימום 5 התראות זהות ביום
- Throttling: אם יצרנו התראה לפני 15 דקות, לא ניצור שוב

---

## 📚 מסמכים נוספים

- [API Documentation](./ALERTS_API.md) - תיעוד API מלא
- [Background Jobs](./ALERTS_JOBS.md) - תיעוד Cron jobs
- [Frontend Guide](./ALERTS_FRONTEND.md) - מדריך פיתוח UI

---

**גרסה:** 1.0  
**עדכון אחרון:** 27/01/2026  
**מאושר על ידי:** Product Team
