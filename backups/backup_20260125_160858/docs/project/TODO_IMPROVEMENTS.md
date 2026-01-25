# 📋 משימות ושיפורים נדרשים - Fleet Management

## 🎯 Completed Tasks

### ✅ Task #2: Photo Upload and File Management (COMPLETE - Jan 25, 2026)
- **Time**: 2 hours (estimated 4-6h)
- **Status**: 🟢 Working in production
- **Storage**: Local filesystem (MVP), S3-ready
- **Details**: See `TASK_2_PHOTO_UPLOAD_COMPLETE.md`

---

## ⚠️ פונקציות חלקיות שצריכות השלמה

המערכת פועלת, אבל יש פיצ'רים שמוזכרים באפליקציית הנהג ועדיין לא מוטמעים במלואם ב-backend ובממשק הניהול.

---

## 🗺️ Task #1: מערכת מעקב מיקום GPS

### 📍 מצב נוכחי
- ✅ **Driver App**: אפליקציית הנהג אוספת מיקום GPS בכל עדכון סטטוס
- ✅ **API**: ה-endpoint `/jobs/{id}/status` מקבל `lat` ו-`lng`
- ⚠️ **Database**: המיקום נשמר ב-`job_status_events` (lat, lng)
- ❌ **Web Admin**: אין ממשק להצגת המיקומים על מפה

### 🎯 מה חסר?

#### 1. דף מפה בממשק הניהול (Map View)
**מיקום מוצע**: `/admin/tracking` או `/admin/fleet-map`

**פיצ'רים נדרשים**:
- [ ] אינטגרציה עם Google Maps API או Leaflet (חינמי)
- [ ] הצגת כל המשאיות הפעילות על המפה
- [ ] אייקון שונה לכל סטטוס (ASSIGNED, ENROUTE, LOADED...)
- [ ] קו מסלול של כל נסיעה (מאתר טעינה → אתר פריקה)
- [ ] פופאפ עם פרטי הנסיעה בלחיצה על משאית
- [ ] רענון אוטומטי כל 30 שניות (real-time tracking)
- [ ] פילטרים: לפי נהג, משאית, סטטוס, תאריך

#### 2. Dashboard Widget - מפה מוקטנת
**מיקום**: דף Dashboard הראשי

- [ ] מפה קטנה עם סקירה כללית של כל המשאיות
- [ ] ספירה מהירה: "X משאיות בדרך", "Y נסיעות בביצוע"

#### 3. דף פרטי נסיעה - מסלול היסטורי
**מיקום**: `/jobs/{id}` - פרטי Job

- [ ] מפה עם כל נקודות ה-GPS שנשמרו
- [ ] קו המסלול בפועל (trail)
- [ ] סמנים (markers) לכל שינוי סטטוס
- [ ] חישוב מרחק בפועל לעומת מרחק מתוכנן

#### 4. API נוסף נדרש

```python
# GET /api/jobs/active-locations
# מחזיר רשימת כל הנסיעות הפעילות + המיקום האחרון
[
  {
    "job_id": 123,
    "driver_name": "משה כהן",
    "truck_plate": "12-345-67",
    "status": "ENROUTE_DROPOFF",
    "last_location": {
      "lat": 32.0853,
      "lng": 34.7818,
      "timestamp": "2026-01-25T14:30:00Z"
    },
    "from_site": "מחצבת נשר",
    "to_site": "רמת אביב"
  }
]

# GET /api/jobs/{id}/location-history
# מחזיר היסטוריית מיקומים לנסיעה ספציפית
{
  "job_id": 123,
  "locations": [
    {"lat": 32.08, "lng": 34.78, "status": "ASSIGNED", "timestamp": "..."},
    {"lat": 32.09, "lng": 34.79, "status": "ENROUTE_PICKUP", "timestamp": "..."}
  ]
}
```

### 📦 Dependencies נדרשות

```bash
# Frontend
npm install @react-google-maps/api
# או (חינמי)
npm install react-leaflet leaflet

# Backend - אין צורך בשינוי, הכל כבר נשמר
```

### 📐 Design Mockup

```
┌─────────────────────────────────────────┐
│  🗺️ מעקב צי - Fleet Tracking            │
├─────────────────────────────────────────┤
│ [הצג הכל] [נסיעות פעילות] [היסטוריה]   │
├─────────────────────────────────────────┤
│                                         │
│        ┌─────────────────┐              │
│        │   🚛 משאית 1    │              │
│        └─────────────────┘              │
│                                         │
│                  📍                      │
│        ┌─────────────────┐              │
│        │   🚛 משאית 2    │              │
│        └─────────────────┘              │
│                                         │
│  ════════ מסלול ═══════►                │
│                                         │
│                  📍 יעד                  │
└─────────────────────────────────────────┘

כשלוחצים על 🚛:
┌──────────────────────┐
│ משאית: 12-345-67     │
│ נהג: משה כהן         │
│ סטטוס: בדרך לפריקה   │
│ מ: מחצבת נשר         │
│ ל: רמת אביב          │
│ עדכון: לפני 2 דקות   │
│ [פרטים מלאים]        │
└──────────────────────┘
```

### ⏱️ זמן משוער: 8-12 שעות
- Google Maps integration: 3h
- API endpoints: 2h
- UI Components: 4h
- Testing: 2h
- Real-time updates (optional): 3h

---

## 📷 Task #2: מערכת העלאת תמונות

### 📸 מצב נוכחי
- ✅ **Driver App**: כפתור "צילום תמונה" קיים
- ✅ **Storage**: MinIO (S3-compatible) מותקן ופועל
- ❌ **API**: אין endpoint להעלאת קבצים
- ❌ **Database**: אין שמירת metadata של קבצים
- ❌ **Web Admin**: אין גלריה להצגת תמונות

### 🎯 מה חסר?

#### 1. API Endpoints להעלאת קבצים

```python
# POST /api/jobs/{job_id}/files/upload
# העלאת תמונה/PDF לנסיעה
# Body: multipart/form-data
# Response: {"file_id": 123, "url": "https://..."}

# GET /api/jobs/{job_id}/files
# רשימת כל הקבצים של נסיעה
# Response: [
#   {
#     "id": 1,
#     "filename": "delivery_photo.jpg",
#     "file_type": "PHOTO",
#     "uploaded_at": "...",
#     "uploaded_by": "משה כהן",
#     "url": "presigned_url_here"
#   }
# ]

# DELETE /api/files/{file_id}
# מחיקת קובץ (admin בלבד)
```

#### 2. טבלת Database (כבר קיימת!)

**טבלה `files`** (כבר מוגדרת ב-models):
```sql
- id
- org_id
- storage_key (S3 key)
- filename
- mime_type
- size
- uploaded_by (user_id)
- uploaded_at
```

**טבלה `job_files`** (כבר מוגדרת):
```sql
- id
- job_id
- file_id
- type (PHOTO, WEIGH_TICKET, DELIVERY_NOTE, OTHER)
```

✅ **המבנה כבר קיים! רק צריך לממש את ה-API**

#### 3. שירות S3/MinIO

**קובץ חדש**: `backend/app/services/storage.py`

```python
import boto3
from app.core.config import settings

class StorageService:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT,
            aws_access_key_id=settings.S3_ACCESS_KEY,
            aws_secret_access_key=settings.S3_SECRET_KEY
        )
    
    def upload_file(self, file, key: str):
        """Upload file to S3"""
        self.s3.upload_fileobj(file, settings.S3_BUCKET, key)
        return key
    
    def get_presigned_url(self, key: str, expiration=3600):
        """Get temporary download URL"""
        return self.s3.generate_presigned_url(
            'get_object',
            Params={'Bucket': settings.S3_BUCKET, 'Key': key},
            ExpiresIn=expiration
        )
    
    def delete_file(self, key: str):
        """Delete file from S3"""
        self.s3.delete_object(Bucket=settings.S3_BUCKET, Key=key)
```

#### 4. Frontend - Driver App

עדכון ב-`driver.html`:

```javascript
async function takePhoto(jobId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.capture = 'environment';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'PHOTO');
      
      try {
        const res = await fetch(`${API_URL}/jobs/${jobId}/files/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        
        if (res.ok) {
          alert('✅ תמונה הועלתה בהצלחה!');
          await loadJobs(); // רענן
        } else {
          alert('❌ שגיאה בהעלאת תמונה');
        }
      } catch (err) {
        alert('❌ שגיאה: ' + err.message);
      }
    }
  };
  input.click();
}
```

#### 5. Frontend - Web Admin

**דף פרטי נסיעה** - גלריית תמונות:

```tsx
// components/JobFileGallery.tsx
interface JobFile {
  id: number;
  filename: string;
  file_type: string;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
}

export function JobFileGallery({ jobId }: { jobId: number }) {
  const [files, setFiles] = useState<JobFile[]>([]);
  
  useEffect(() => {
    fetch(`/api/jobs/${jobId}/files`)
      .then(r => r.json())
      .then(setFiles);
  }, [jobId]);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {files.map(file => (
        <div key={file.id} className="border rounded p-2">
          <img src={file.url} alt={file.filename} />
          <p className="text-xs">{file.uploaded_by}</p>
          <p className="text-xs">{new Date(file.uploaded_at).toLocaleString('he-IL')}</p>
        </div>
      ))}
    </div>
  );
}
```

### 📦 Dependencies נדרשות

```bash
# Backend
pip install boto3  # S3 client (כבר אמור להיות)
pip install python-multipart  # FastAPI file upload

# Frontend - אין צורך, native HTML5
```

### ⏱️ זמן משוער: 4-6 שעות
- Backend API: 2h
- Storage service: 1h
- Frontend updates: 2h
- Testing: 1h

---

## 🔐 Task #3: חתימה דיגיטלית (Signature)

### ✍️ מצב נוכחי
- ⚠️ **Driver App**: יש רמז לחתימה בקוד (`delivery_notes` table)
- ❌ **UI**: אין canvas לחתימה באפליקציית הנהג
- ❌ **API**: אין endpoint לשמירת חתימה
- ✅ **Database**: טבלה `delivery_notes` כבר קיימת

### 🎯 מה נדרש?

#### 1. Signature Pad באפליקציית הנהג

```html
<!-- driver.html - הוסף בעת DELIVERED -->
<canvas id="signature-pad" class="signature-pad" width="400" height="200"></canvas>
<button onclick="clearSignature()">נקה</button>
<button onclick="saveSignature(jobId)">שמור חתימה</button>
```

```javascript
let signaturePad;

function initSignaturePad() {
  const canvas = document.getElementById('signature-pad');
  const ctx = canvas.getContext('2d');
  let drawing = false;
  
  canvas.addEventListener('touchstart', (e) => {
    drawing = true;
    const touch = e.touches[0];
    ctx.beginPath();
    ctx.moveTo(touch.clientX - canvas.offsetLeft, touch.clientY - canvas.offsetTop);
  });
  
  canvas.addEventListener('touchmove', (e) => {
    if (!drawing) return;
    const touch = e.touches[0];
    ctx.lineTo(touch.clientX - canvas.offsetLeft, touch.clientY - canvas.offsetTop);
    ctx.stroke();
  });
  
  canvas.addEventListener('touchend', () => drawing = false);
}

async function saveSignature(jobId) {
  const canvas = document.getElementById('signature-pad');
  const blob = await new Promise(resolve => canvas.toBlob(resolve));
  
  const formData = new FormData();
  formData.append('signature', blob, 'signature.png');
  formData.append('receiver_name', prompt('שם המקבל:'));
  
  await fetch(`${API_URL}/jobs/${jobId}/delivery-note`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
}
```

#### 2. API Endpoint

```python
# POST /api/jobs/{job_id}/delivery-note
# Body: multipart/form-data
# - signature: file (PNG image)
# - receiver_name: string
# Response: DeliveryNote
```

### ⏱️ זמן משוער: 3-4 שעות

---

## 📊 Task #4: דוחות ותעודות משלוח (PDF)

### 📄 מצב נוכחי
- ❌ אין יצירת PDF לתעודות משלוח
- ❌ אין export של דוחות

### 🎯 מה נדרש?

#### PDF Templates

```python
# backend/app/services/pdf_generator.py
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4

class PDFGenerator:
    def generate_delivery_note(self, job_id: int) -> bytes:
        """Generate delivery note PDF"""
        # Create PDF with job details, signature, photos
        pass
    
    def generate_statement(self, statement_id: int) -> bytes:
        """Generate customer statement PDF"""
        pass
```

#### API Endpoints

```python
# GET /api/jobs/{id}/delivery-note/pdf
# Response: PDF file download

# GET /api/statements/{id}/pdf
# Response: PDF file download
```

### ⏱️ זמן משוער: 6-8 שעות

---

## 🔔 Task #5: התראות Real-time (Optional)

### 🎯 מה נדרש?

- WebSocket connection לעדכונים חיים
- התראות למשרד כשנהג מסיים נסיעה
- התראות לנהג על משימה חדשה

### 📦 Dependencies

```bash
pip install websockets
npm install socket.io-client
```

### ⏱️ זמן משוער: 8-10 שעות

---

## 📋 סיכום עדיפויות

| Task | עדיפות | זמן | מורכבות | השפעה |
|------|---------|-----|---------|--------|
| **#2 העלאת תמונות** | 🔴 גבוהה | 4-6h | בינונית | ⭐⭐⭐⭐⭐ |
| **#3 חתימה דיגיטלית** | 🔴 גבוהה | 3-4h | נמוכה | ⭐⭐⭐⭐⭐ |
| **#1 מפת מעקב GPS** | 🟡 בינונית | 8-12h | גבוהה | ⭐⭐⭐⭐ |
| **#4 PDF דוחות** | 🟡 בינונית | 6-8h | בינונית | ⭐⭐⭐ |
| **#5 Real-time** | 🟢 נמוכה | 8-10h | גבוהה | ⭐⭐ |

### 🎯 המלצה: התחל עם Tasks #2 + #3

**סה"כ**: 7-10 שעות  
**ערך עסקי**: גבוה מאוד  
**מורכבות**: בינונית  
**ROI**: מעולה

---

## 🚀 איך להתחיל?

### שלב 1: העלאת תמונות (Task #2)

```bash
# 1. צור את שירות הStorage
touch backend/app/services/storage.py

# 2. הוסף API endpoint
# עדכן: backend/app/api/v1/endpoints/files.py (צור חדש)

# 3. עדכן driver.html
# שנה את takePhoto() להעלות בפועל

# 4. בדיקה
# צלם תמונה → בדוק ב-MinIO console → בדוק ב-DB
```

### שלב 2: חתימה דיגיטלית (Task #3)

```bash
# 1. הוסף signature canvas ב-driver.html

# 2. הוסף API endpoint
# עדכן: backend/app/api/v1/endpoints/jobs.py

# 3. בדיקה
# חתום → שמור → בדוק ב-DB
```

---

## 📚 משאבים נוספים

### Google Maps API
- [React Google Maps](https://react-google-maps-api-docs.netlify.app/)
- [Leaflet (חינמי)](https://react-leaflet.js.org/)

### File Upload
- [FastAPI File Upload](https://fastapi.tiangolo.com/tutorial/request-files/)
- [Boto3 S3 Docs](https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html)

### Signature Pad
- [Signature Pad JS](https://github.com/szimek/signature_pad)
- [HTML Canvas Tutorial](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial)

### PDF Generation
- [ReportLab](https://www.reportlab.com/docs/reportlab-userguide.pdf)
- [WeasyPrint](https://weasyprint.org/)

---

**תאריך יצירה**: 25 ינואר 2026  
**גרסה**: v1.0  
**סטטוס**: 📝 מסמך תכנון - ממתין ליישום
