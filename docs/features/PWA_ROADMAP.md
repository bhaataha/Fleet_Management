# 🚀 PWA Implementation Roadmap - Next Steps

**Created:** 29/01/2026  
**Target:** Production-ready PWA for drivers

---

## 📋 Sprint 1: Critical Features (Week 1-2)

### ✅ Task 1: Push Notifications Implementation (COMPLETED)
**Priority:** CRITICAL  
**Effort:** 8 hours  
**Dependencies:** None

#### Backend Tasks:
1. **Create notification subscription model** ✅
   ```bash
   File: backend/app/models/notification_subscription.py
   ```
   ```python
   class NotificationSubscription(Base):
       __tablename__ = "notification_subscriptions"
       id = Column(Integer, primary_key=True)
       user_id = Column(Integer, ForeignKey("users.id"))
       subscription_json = Column(JSONB)  # Web Push subscription
       device_info = Column(JSONB)
       created_at = Column(DateTime)
   ```

2. **Create push notification endpoint** ✅
   ```bash
   File: backend/app/api/v1/endpoints/push_notifications.py
   ```
   ```python
   @router.post("/subscribe")
   async def subscribe(subscription: dict, request: Request):
       # Save subscription to DB
       pass

   @router.post("/send")
   async def send_notification(user_id: int, title: str, body: str):
       # Use pywebpush to send
       pass
   ```

3. **Install dependencies** ✅
   ```bash
   pip install pywebpush
   # Add to requirements.txt
   ```

4. **Send notifications on events** ✅
  - Alert created → notify user

#### Frontend Tasks:
1. **Create usePushNotifications hook** ✅
   ```bash
   File: frontend/src/lib/hooks/usePushNotifications.ts
   ```
   ```typescript
   export function usePushNotifications() {
     const subscribe = async () => {
       const registration = await navigator.serviceWorker.ready
       const subscription = await registration.pushManager.subscribe({
         userVisibleOnly: true,
         applicationServerKey: VAPID_PUBLIC_KEY
       })
       // Send to backend
     }
     return { subscribe, unsubscribe }
   }
   ```

2. **Update Service Worker for push events** ✅
   ```bash
   File: frontend/public/sw.js
   ```
   Add push event listener

3. **Add notification permission request** ✅
   ```bash
   File: frontend/src/app/mobile/home/page.tsx
   ```
   Request permission on first load

#### Testing:
- [x] Subscribe on mobile device (Android)
- [x] Send test notification from backend
- [x] Verify notification appears
- [ ] Test notification click action (iOS)

---

### 📸 Task 2: Camera Integration
**Priority:** CRITICAL  
**Effort:** 6 hours  
**Dependencies:** None

#### Frontend Tasks:
1. **Create camera utility functions**
   ```bash
   File: frontend/src/lib/camera-utils.ts
   ```
   ```typescript
   export async function capturePhoto() {
     const stream = await navigator.mediaDevices.getUserMedia({ video: true })
     // Capture frame from video
     // Return base64 or blob
   }

   export async function compressImage(file: File) {
     // Compress to max 1MB
   }
   ```

2. **Update camera page**
   ```bash
   File: frontend/src/app/mobile/camera/page.tsx
   ```
   - Add video preview
   - Capture button
   - Show captured photos
   - Upload button
   - Delete photos

3. **Add file upload API call**
   ```bash
   File: frontend/src/lib/api.ts
   ```
   ```typescript
   export const filesApi = {
     uploadJobFile: (jobId: number, file: File) => {
       const formData = new FormData()
       formData.append('file', file)
       return api.post(`/jobs/${jobId}/files/upload`, formData)
     }
   }
   ```

#### Backend (Already exists!):
- ✅ Upload endpoint: `/api/jobs/{job_id}/files/upload`
- ✅ File storage in `uploads/`

#### Testing:
- [ ] Request camera permission
- [ ] Capture photo
- [ ] Show preview
- [ ] Upload to server
- [ ] Verify file saved

---

### 🖊️ Task 3: Signature Capture
**Priority:** HIGH  
**Effort:** 4 hours  
**Dependencies:** react-signature-canvas (already installed)

#### Frontend Tasks:
1. **Create SignatureCapture component**
   ```bash
   File: frontend/src/components/SignatureCapture.tsx
   ```
   ```typescript
   import SignatureCanvas from 'react-signature-canvas'

   export default function SignatureCapture({ onSave }: { onSave: (signature: string) => void }) {
     const sigCanvas = useRef<SignatureCanvas>(null)
     
     const save = () => {
       if (sigCanvas.current) {
         const dataURL = sigCanvas.current.toDataURL()
         onSave(dataURL)
       }
     }

     return (
       <div>
         <SignatureCanvas ref={sigCanvas} />
         <button onClick={save}>שמור חתימה</button>
       </div>
     )
   }
   ```

2. **Add to job delivery page**
   ```bash
   File: frontend/src/app/mobile/jobs/[id]/deliver/page.tsx (create if not exists)
   ```
   - Show signature canvas
   - Receiver name input
   - Save signature
   - Upload to server

3. **Add delivery note API**
   ```typescript
   export const jobsApi = {
     submitDeliveryNote: (jobId: number, data: {
       receiver_name: string
       signature: string
       photos: File[]
     }) => api.post(`/jobs/${jobId}/delivery-note`, data)
   }
   ```

#### Testing:
- [ ] Draw signature
- [ ] Save signature
- [ ] Submit delivery note
- [ ] Verify saved in DB

---

## 📋 Sprint 2: Enhancement Features (Week 3-4)

### 🔄 Task 4: Background Sync
**Priority:** MEDIUM  
**Effort:** 8 hours

#### Implementation:
1. **Create offline queue**
   ```bash
   File: frontend/src/lib/offline-queue.ts
   ```
   ```typescript
   class OfflineQueue {
     add(action: { type: string, data: any }) {
       const queue = this.getQueue()
       queue.push(action)
       localStorage.setItem('offline_queue', JSON.stringify(queue))
     }

     async process() {
       const queue = this.getQueue()
       for (const action of queue) {
         try {
           await this.executeAction(action)
           this.remove(action.id)
         } catch (error) {
           console.error('Failed to sync:', error)
         }
       }
     }
   }
   ```

2. **Update Service Worker**
   ```javascript
   self.addEventListener('sync', event => {
     if (event.tag === 'sync-jobs') {
       event.waitUntil(syncJobs())
     }
   })
   ```

3. **Add sync indicator UI**
   Show "syncing..." when processing queue

---

### 📍 Task 5: GPS Location Tracking
**Priority:** MEDIUM  
**Effort:** 10 hours

#### Implementation:
1. **Create useLocation hook**
   ```typescript
   export function useLocation() {
     const [location, setLocation] = useState(null)
     
     useEffect(() => {
       navigator.geolocation.watchPosition(
         (position) => {
           setLocation({
             lat: position.coords.latitude,
             lng: position.coords.longitude
           })
         },
         (error) => console.error(error),
         { enableHighAccuracy: true }
       )
     }, [])

     return { location, sendLocation }
   }
   ```

2. **Send location updates**
   - On job status change
   - Every 5 minutes when job active
   - Store in `job_status_events` table

3. **Admin map view**
   - Show all active drivers on map
   - Real-time location updates
   - Use Google Maps or Mapbox

---

### 💾 Task 6: IndexedDB Storage
**Priority:** LOW  
**Effort:** 12 hours

#### Implementation:
1. **Setup IndexedDB**
   ```typescript
   const DB_NAME = 'truckflow_db'
   const STORES = {
     jobs: 'jobs',
     drivers: 'drivers',
     sites: 'sites'
   }

   async function openDB() {
     return await idb.openDB(DB_NAME, 1, {
       upgrade(db) {
         db.createObjectStore('jobs', { keyPath: 'id' })
         db.createObjectStore('drivers', { keyPath: 'id' })
       }
     })
   }
   ```

2. **Sync strategy**
   - Fetch from API → Save to IndexedDB
   - Read from IndexedDB when offline
   - Periodic sync when online

---

## 📋 Sprint 3: Polish & Launch (Week 5-6)

### 📷 Task 7: Create Real Screenshots
**Priority:** HIGH  
**Effort:** 3 hours

#### Steps:
1. Deploy to staging
2. Take screenshots:
   - Mobile: Home, Jobs list, Job detail, Camera
   - Desktop: Dashboard, Dispatch board
3. Optimize images (PNG, <500KB each)
4. Save to `/public/screenshots/`
5. Update manifest.json

---

### 🏪 Task 8: App Store Preparation
**Priority:** LOW  
**Effort:** 20 hours

#### Google Play (TWA):
1. Create TWA project
2. Configure manifest
3. Build signed APK
4. Create Play Store listing
5. Submit for review

#### Apple App Store (Capacitor):
1. Setup Capacitor
2. Build iOS app
3. Create App Store listing
4. Submit for review

---

### ⚡ Task 9: Performance Optimization
**Priority:** MEDIUM  
**Effort:** 8 hours

#### Tasks:
1. **Code splitting**
   - Lazy load pages
   - Dynamic imports

2. **Image optimization**
   - WebP format
   - Lazy loading
   - Responsive images

3. **Bundle size**
   - Remove unused dependencies
   - Tree shaking

4. **Lighthouse audit**
   - Target: 90+ PWA score
   - Fix all issues

---

## 📊 Progress Tracking

| Sprint | Tasks | Status | Progress |
|--------|-------|--------|----------|
| Sprint 1 | Push Notifications, Camera, Signature | ✅ Completed | 100% |
| Sprint 2 | Background Sync, GPS, IndexedDB | ⏳ Not Started | 0% |
| Sprint 3 | Screenshots, App Store, Performance | ⏳ Not Started | 0% |

**Overall PWA Completion:** 75% → Target: 100%

---

## 🎯 Success Criteria

### MVP Launch (After Sprint 1):
- ✅ Push notifications working
- ✅ Camera capture working
- ✅ Signature capture working
- ✅ Basic offline support
- ✅ Install prompt working

### Full Launch (After Sprint 3):
- ✅ All features implemented
- ✅ Lighthouse score 90+
- ✅ Real screenshots
- ✅ App stores submitted
- ✅ Performance optimized

---

## 📝 Notes

### Environment Variables Needed:
```bash
# .env.local
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-key
NEXT_PUBLIC_API_URL=http://localhost:8001/api
NEXT_PUBLIC_DISABLE_PWA=false  # true for development without SW
```

### Backend Environment:
```bash
# .env
VAPID_PRIVATE_KEY=your-private-key
VAPID_PUBLIC_KEY=your-public-key
VAPID_SUBJECT=mailto:admin@truckflow.site
```

### Generate VAPID Keys:
```bash
# Install web-push CLI
npm install -g web-push

# Generate keys
web-push generate-vapid-keys
```

---

## 🔗 Useful Links

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Lighthouse PWA](https://web.dev/lighthouse-pwa/)
- [Service Worker Cookbook](https://serviceworke.rs/)
- [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices)
- [IndexedDB Guide](https://web.dev/indexeddb/)

---

**Start Date:** TBD  
**Target Completion:** 6 weeks from start  
**Review Date:** After each sprint
