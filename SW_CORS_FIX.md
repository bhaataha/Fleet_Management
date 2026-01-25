# תיקון שגיאות CORS ב-Service Worker

## הבעיה
שגיאות CORS מרובות בממשק Super Admin:
```
Access to fetch at 'http://localhost:8001/api/jobs' from origin 'http://localhost:3010' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

## סיבה
- **Service Worker** (sw.js) היה מיירט את **כל** ה-fetch requests
- Service Worker נועד רק לאפליקציית הנהגים (driver.html) ולא לממשק Admin
- ברגע ש-SW נרשם בדפדפן, הוא ממשיך לפעול על כל ה-domain (localhost:3010)
- ליירוט של API requests גורם לבעיות CORS

## התיקון

### 1. עדכון sw.js - סינון Requests
**קובץ**: `frontend/public/sw.js`

```javascript
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip API requests completely to avoid CORS issues
  if (url.pathname.startsWith('/api/') || 
      url.hostname === 'localhost' && url.port === '8001') {
    return; // Let API requests go through without interception
  }
  
  // Only cache driver app resources
  if (url.pathname === '/driver.html' || 
      url.pathname === '/manifest.json' ||
      url.pathname.startsWith('/driver/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});
```

**מה השתנה:**
- ✅ Service Worker עכשיו **מדלג** על כל requests ל-`/api/*`
- ✅ מדלג על requests ל-`localhost:8001` (backend)
- ✅ מטפל **רק** ב-driver.html ומשאבים קשורים
- ✅ כל שאר ה-requests עוברים ישירות ללא התערבות

### 2. Unregister Script - ניקוי SW ישנים
**קובץ חדש**: `frontend/public/unregister-sw.js`

```javascript
// Unregister old service worker to fix CORS issues
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function(registrations) {
    for(let registration of registrations) {
      registration.unregister();
      console.log('Service Worker unregistered');
    }
  });
}
```

**מטרה**: 
- מסיר Service Workers ישנים שנרשמו בעבר
- מבטיח שהגרסה החדשה והמתוקנת תיטען

### 3. טעינה ב-Layout
**קובץ**: `frontend/src/app/layout.tsx`

```tsx
import Script from 'next/script'

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        {/* Unregister old service worker to prevent CORS issues */}
        <Script src="/unregister-sw.js" strategy="beforeInteractive" />
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
```

**strategy="beforeInteractive"**: 
- הסקריפט רץ **לפני** שהדף אינטראקטיבי
- מבטיח שה-SW הישן מוסר לפני שאר הקוד רץ

## בדיקה

### לאחר התיקון:
1. **רענן את הדפדפן** עם Ctrl+Shift+R (hard refresh)
2. **פתח את Console** (F12)
3. בדוק ש**אין** שגיאות CORS
4. בדוק ב-DevTools → Application → Service Workers שאין SW רשום (או שיש רק את החדש)

### צעדי ניקוי ידניים (אם צריך):
```javascript
// בקונסול של הדפדפן:
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister())
  console.log('All SWs unregistered')
})

// נקה גם cache:
caches.keys().then(names => {
  names.forEach(name => caches.delete(name))
  console.log('All caches cleared')
})
```

## כיצד זה עובד עכשיו

### ממשק Admin (Super Admin / Dispatch)
- ✅ **אין** Service Worker פעיל
- ✅ כל API requests עוברים ישירות ל-backend
- ✅ אין בעיות CORS
- ✅ עובד עם CORS רגיל של FastAPI

### אפליקציית נהג (driver.html)
- ✅ Service Worker **כן** פעיל
- ✅ Cache רק של driver.html + manifest.json
- ✅ API requests **לא** נשמרים ב-cache (כדי למנוע נתונים ישנים)
- ✅ עובד offline רק עבור ה-UI, לא עבור נתונים

## קבצים ששונו

1. ✅ `frontend/public/sw.js` - סינון requests
2. ✅ `frontend/public/unregister-sw.js` - נוצר חדש
3. ✅ `frontend/src/app/layout.tsx` - הוספת unregister script

## סטטוס
✅ **תוקן** - שגיאות CORS של Service Worker נפתרו
✅ Frontend הופעל מחדש
✅ Super Admin אמור לעבוד ללא שגיאות

## הערות
- Service Worker הוא **כלי לנהגים**, לא לממשק Admin
- Admin תמיד דורש חיבור לאינטרנט (אין צורך ב-offline mode)
- נהגים עשויים לעבוד ללא רשת, אז SW עדיין שימושי עבורם
