# 🚀 העלאה לשרת - הוראות מהירות

## שלב 1: העתק Service Account Key לשרת

```powershell
# מהמחשב המקומי - PowerShell
scp d:\workspace-project\Fleet_Management\backend\firebase-service-account.json root@64.176.173.36:/opt/Fleet_Management/backend/
```

## שלב 2: SSH לשרת

```bash
ssh root@64.176.173.36
```

## שלב 3: הרץ את סקריפט ההתקנה

```bash
cd /opt/Fleet_Management

# Pull עדכונים מGit
git pull origin main

# הרץ סקריפט התקנה אוטומטי
chmod +x setup-firebase.sh
./setup-firebase.sh
```

הסקריפט יעשה הכל אוטומטית:
- ✅ בדיקת Service Account Key
- ✅ בדיקת .env.production
- ✅ Pull עדכונים
- ✅ התקנת firebase-admin
- ✅ התקנת firebase
- ✅ Restart containers
- ✅ בדיקות Firebase

---

## אם אין לך את הסקריפט - פקודות ידניות:

```bash
cd /opt/Fleet_Management
git pull origin main

# התקן dependencies
docker exec fleet_backend_prod pip install firebase-admin==6.4.0
docker exec fleet_frontend_prod npm install firebase@10.7.2

# Restart
docker compose -f docker-compose.production.yml restart fleet_backend
docker compose -f docker-compose.production.yml restart fleet_frontend

# בדיקה
docker exec fleet_backend_prod python3 -c "from app.services.firebase_service import firebase_service; print('✅ OK' if firebase_service._initialized else '❌ FAIL')"
```

---

## ✅ תוצאה מצופה:

```
🔥 Firebase OTP Setup - TruckFlow
================================

📋 Step 1: Checking Firebase Service Account Key...
✅ firebase-service-account.json found

📋 Step 2: Checking .env.production file...
✅ .env.production exists
✅ Firebase API Key configured

📋 Step 3: Pulling latest code from Git...
✅ Git pull successful

📋 Step 4: Installing Backend dependencies...
✅ firebase-admin installed

📋 Step 5: Installing Frontend dependencies...
✅ firebase installed

📋 Step 6: Restarting Backend container...
✅ Backend restarted

📋 Step 7: Restarting Frontend container...
✅ Frontend restarted

📋 Step 8: Testing Firebase initialization...
✅ Backend Firebase initialized successfully!

📋 Step 9: Testing Frontend environment variables...
✅ Frontend Firebase env vars loaded

================================
✅ Firebase Setup Complete!
================================
```

---

## 🧪 בדיקות אחרי התקנה:

### 1. בדוק Backend API:
```bash
curl -X POST https://app.truckflow.site/api/phone-auth/verify-firebase-token \
  -H "Content-Type: application/json" \
  -d '{"firebase_token":"test","org_slug":"demo"}'
```

צריך להחזיר:
```json
{"detail":"Invalid Firebase token"}
```
זה טוב! פירושו שה-endpoint עובד.

### 2. בדוק Frontend:
פתח: https://app.truckflow.site
Console (F12):
```javascript
console.log('Firebase:', typeof firebase !== 'undefined' ? 'loaded' : 'not loaded')
```

---

## 🎯 מוכן לשימוש!

אחרי ההתקנה תוכל:
1. ✅ ליצור Login UI עם Firebase
2. ✅ לשלוח OTP דרך Firebase
3. ✅ לאמת משתמשים עם Firebase Token
4. ✅ לקבל JWT Token מהמערכת

---

**זמן התקנה משוער: 5 דקות** ⏱️
