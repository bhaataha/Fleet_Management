# 🧪 בדיקת הפניה אוטומטית לנהגים - מדריך מהיר

## ⚡ בדיקה מהירה

### 1. התחבר כנהג מהמובייל

**כתובת**: http://64.176.173.36:3010/login

**פרטי נהג לבדיקה** (מהדאטה בייס):
```
טלפון: 050-2345678  (או אחר מהדאטה בייס)
סיסמה: driver123
```

### 2. פתח Console של הדפדפן

**Chrome/Edge**: F12 או Ctrl+Shift+I  
**Safari**: Cmd+Option+I

### 3. מה צריך לראות?

#### ✅ **תרחיש מוצלח**:
```
✅ Password login successful: {
  name: "יוסי נהג",
  org_role: "driver",
  driver_id: 2,
  roles: ["DRIVER"]
}

🚚 Driver detected, redirecting to mobile app: {
  isDriverRole: true,
  hasDriverRole: true,
  hasDriverProfile: true,
  driver_id: 2,
  org_role: "driver"
}

🚀 Redirecting to: /mobile/home
```

**והדף צריך לעבור אוטומטית ל**:  
`http://64.176.173.36:3010/mobile/home`

---

#### ❌ **אם לא עובד** - מה לבדוק:

1. **אין הודעות בקונסול?**
   - בדוק Network tab → חפש את request של `/login` או `/phone-auth/verify-otp`
   - לחץ על Response ובדוק את ה-`user` object
   - וודא ש-`driver_id` קיים או `org_role: "driver"`

2. **מופיע שגיאה?**
   - העתק את השגיאה
   - בדוק backend logs:
     ```bash
     ssh root@64.176.173.36 "docker logs --tail 100 fleet_backend_prod"
     ```

3. **נשאר בדף לוגין?**
   - וודא שהטלפון והסיסמה נכונים
   - נסה להתחבר שוב עם F5 (רענון)
   - נקה cache: Ctrl+Shift+Del

---

## 🔍 בדיקת משתמשים בדאטה בייס

```bash
# התחבר לשרת
ssh root@64.176.173.36

# בדוק נהגים קיימים
docker exec fleet_db_prod psql -U fleet_user -d fleet_management -c "
  SELECT u.id, u.name, u.phone, u.org_role, d.id as driver_id
  FROM users u
  LEFT JOIN drivers d ON d.user_id = u.id
  WHERE d.id IS NOT NULL
  LIMIT 5;
"
```

**תוצאה מצופה**:
```
 id |    name     |    phone     | org_role | driver_id
----+-------------+--------------+----------+-----------
  5 | יוסי נהג    | 050-2345678  | driver   |         2
  6 | משה כהן     | 050-3456789  | driver   |         3
```

---

## 🛠️ בעיות נפוצות ופתרונות

### בעיה 1: "נהג מתחבר אבל עובר ל-/dashboard"

**פתרון**:
```bash
# בדוק שה-driver_id מוחזר מה-API
curl -X POST http://64.176.173.36:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "050-2345678", "password": "driver123"}' | jq '.user.driver_id'
```

אם מחזיר `null` - הנהג לא מקושר ל-User. תקן:
```sql
docker exec fleet_db_prod psql -U fleet_user -d fleet_management -c "
  UPDATE drivers SET user_id = 5 WHERE phone = '050-2345678';
"
```

### בעיה 2: "שגיאה 401 Unauthorized"

**פתרון**: אפס סיסמת נהג
```bash
ssh root@64.176.173.36
cd /opt/Fleet_Management/backend
docker exec fleet_backend_prod python scripts/reset_admin_password.py
```

### בעיה 3: "דף לבן / אין כלום"

**פתרון**: בדוק שה-frontend רץ
```bash
ssh root@64.176.173.36 "docker ps | grep frontend"

# אם לא רץ - הפעל מחדש
ssh root@64.176.173.36 "cd /opt/Fleet_Management && docker compose restart frontend"
```

---

## 📊 סטטיסטיקות דיבאגינג

לבדיקה מתקדמת יותר:

```bash
# בדוק כמה נהגים יש במערכת
ssh root@64.176.173.36 "docker exec fleet_db_prod psql -U fleet_user -d fleet_management -c 'SELECT COUNT(*) FROM drivers WHERE is_active = true;'"

# בדוק כמה users עם driver_id
ssh root@64.176.173.36 "docker exec fleet_db_prod psql -U fleet_user -d fleet_management -c \"
  SELECT 
    COUNT(*) FILTER (WHERE d.id IS NOT NULL) as has_driver_profile,
    COUNT(*) FILTER (WHERE u.org_role = 'driver') as has_driver_role,
    COUNT(*) as total_drivers
  FROM users u
  LEFT JOIN drivers d ON d.user_id = u.id
  WHERE u.is_active = true;
\""
```

---

## ✅ Checklist לבדיקה

- [ ] התחבר כנהג מהמובייל
- [ ] פתח Console (F12)
- [ ] ראה את ההודעה: `🚚 Driver detected`
- [ ] ראה את ההודעה: `🚀 Redirecting to: /mobile/home`
- [ ] הדף עבר אוטומטית ל-`/mobile/home`
- [ ] רואה את רשימת המשימות של הנהג
- [ ] יכול לצאת ולהיכנס שוב (בדוק שהקאש עובד)

---

**עודכן**: 29/01/2026  
**גרסה**: v1.1 (עם תיקון driver_id)  
**סטטוס**: ✅ עובד בפרודקשן
