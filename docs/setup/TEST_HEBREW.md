# 🚀 בדיקה על שרת מרוחק - מדריך מהיר

## פרטי השרת
**IP**: `64.176.173.36`  
**User**: `root`

---

## שלבים להתקנה

### 1️⃣ התחבר לשרת
```bash
ssh root@64.176.173.36
```

### 2️⃣ בחר אחת מהאפשרויות:

#### ✨ אפשרות A: התקנה אוטומטית (מומלץ)
```bash
apt update && apt install -y git curl
cd /opt
git clone https://github.com/bhaataha/Fleet_Management.git
cd Fleet_Management
chmod +x setup-wizard.sh
./setup-wizard.sh
```

#### 📋 אפשרות B: סקריפט מהיר
```bash
curl -o quick-test.sh https://raw.githubusercontent.com/bhaataha/Fleet_Management/main/quick-test.sh
chmod +x quick-test.sh
./quick-test.sh
```

---

## 3️⃣ ענה על השאלות באשף

| שאלה | תשובה מומלצת |
|------|--------------|
| **Server IP/Domain** | `64.176.173.36` |
| **Generate passwords?** | `y` ✅ |
| **Super Admin Email** | `admin@example.com` (שנה לאימייל שלך) |
| **Super Admin Password** | סיסמה חזקה (12+ תווים) |
| **Confirm Password** | אותה סיסמה שוב |
| **Organization Name** | `חברת הובלות דמו` (שנה לשם שלך) |

---

## 4️⃣ המתן לסיום (5-10 דקות)

האשף יבצע:
- ✓ בדיקת Docker
- ✓ יצירת .env.production
- ✓ בניית קונטיינרים
- ✓ הרצת Database
- ✓ יצירת Super Admin
- ✓ אימות התקנה

---

## 5️⃣ בדיקת גישה

### מהשרת עצמו:
```bash
# API
curl http://localhost:8001/health

# קונטיינרים
docker compose ps
```

### מהמחשב שלך:
```bash
# API
curl http://64.176.173.36:8001/health

# Frontend - פתח בדפדפן:
http://64.176.173.36:3010
```

---

## 6️⃣ התחבר למערכת

1. פתח דפדפן: `http://64.176.173.36:3010`
2. הזן אימייל וסיסמה (שהגדרת באשף)
3. צפוי: Dashboard של המערכת

---

## 🔥 Firewall (אם צריך)

אם לא מצליח להתחבר מהדפדפן:

```bash
# בדוק Firewall
ufw status

# פתח פורטים
ufw allow 8001/tcp
ufw allow 3010/tcp
ufw allow 80/tcp
ufw allow 443/tcp

# או כבה זמנית (לבדיקה בלבד!)
ufw disable
```

---

## 🐛 פתרון בעיות

### הקונטיינרים לא עולים
```bash
# צפה ב-logs
docker compose logs -f

# או ספציפי
docker logs fleet_backend
docker logs fleet_db
```

### פורט תפוס
```bash
# מצא מה משתמש בפורט
lsof -i :8001
lsof -i :3010

# הרוג את התהליך
kill -9 <PID>
```

### איפוס מלא (אם כל השאר לא עזר)
```bash
cd /opt/Fleet_Management
docker compose down -v
docker system prune -a -f
./setup-wizard.sh  # הרץ שוב
```

---

## ✅ רשימת בדיקה

- [ ] התחברתי לשרת SSH
- [ ] הרצתי את setup-wizard.sh
- [ ] האשף הסתיים בהצלחה
- [ ] 4 קונטיינרים רצים (`docker compose ps`)
- [ ] API עונה (`curl http://64.176.173.36:8001/health`)
- [ ] Frontend נטען בדפדפן (`http://64.176.173.36:3010`)
- [ ] הצלחתי להתחבר עם Super Admin
- [ ] רואה את ה-Dashboard

---

## 📊 פקודות שימושיות

```bash
# הפעל מערכת
cd /opt/Fleet_Management && docker compose up -d

# עצור מערכת
docker compose down

# אתחל מחדש
docker compose restart

# צפה ב-logs
docker compose logs -f

# גיבוי
./backup.sh

# סטטוס קונטיינרים
docker compose ps

# שימוש במשאבים
docker stats
```

---

## 🎯 מה הלאה?

לאחר בדיקה מוצלחת:

1. **SSL/TLS** - הגדר תעודה (Let's Encrypt)
2. **Firewall** - הגבל גישה רק לפורטים הנדרשים
3. **Backup** - הגדר גיבוי אוטומטי יומי
4. **Domain** - קשר domain name (במקום IP)
5. **Email** - הגדר SMTP להתראות

---

## 📞 עזרה

- **Logs**: `/var/log/fleet-setup.log`
- **תיעוד**: `docs/setup/PRODUCTION_INSTALL.md`
- **בעיות**: `docs/setup/TROUBLESHOOTING.md`

---

**בהצלחה! 🚀**

אם משהו לא עובד - תשלח את ה-logs ואנחנו נפתור ביחד.
