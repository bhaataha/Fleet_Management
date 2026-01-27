// ==========================================
// TruckFlow PWA Service Worker v2.0.0
// Professional offline-first architecture
// ==========================================

const APP_VERSION = '2.0.0';
const CACHE_NAME = `truckflow-v${APP_VERSION}`;
const RUNTIME_CACHE = 'truckflow-runtime';
const API_CACHE = 'truckflow-api';
const IMAGE_CACHE = 'truckflow-images';

// Critical assets to precache
const PRECACHE_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/manifest.json',
  '/icon-192.svg',
  '/driver.html', // Legacy support
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log(`[SW v${APP_VERSION}] Installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, {
          cache: 'reload' // Always fetch fresh on install
        })));
      })
      .then(() => {
        console.log('[SW] Precaching complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch((error) => {
        console.error('[SW] Install error:', error);
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW v${APP_VERSION}] Activating...`);
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => 
              name !== CACHE_NAME && 
              name !== RUNTIME_CACHE && 
              name !== API_CACHE &&
              name !== IMAGE_CACHE
            )
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});


// Fetch event - smart caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Strategy 1: API requests - Network First with cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Strategy 2: Images - Cache First
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Strategy 3: Navigation - Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const cache = caches.open(RUNTIME_CACHE);
            cache.then(c => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.match('/offline') || caches.match('/') || new Response('Offline', { status: 503 }))
    );
    return;
  }

  // Strategy 4: Static assets - Cache First
  event.respondWith(cacheFirstStrategy(request, RUNTIME_CACHE));
});

// Cache First Strategy
async function cacheFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    if (request.destination === 'image') {
      return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect fill="#ddd" width="200" height="200"/></svg>', 
        { headers: { 'Content-Type': 'image/svg+xml' } });
    }
    throw error;
  }
}

// Network First Strategy
async function networkFirstStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

// Background Sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-jobs') {
    event.waitUntil(syncPendingData());
  }
});

async function syncPendingData() {
  console.log('[SW] Syncing pending data...');
}

// Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'TruckFlow', body: 'התראה חדשה', icon: '/icon-192.svg' };
  if (event.data) {
    try { data = { ...data, ...event.data.json() }; } 
    catch (e) { data.body = event.data.text(); }
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      vibrate: [200, 100, 200],
      tag: data.tag || 'default',
      data: data,
      dir: 'rtl',
      lang: 'he'
    })
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(urlToOpen)) return client.focus();
      }
      return clients.openWindow(urlToOpen);
    })
  );
});

// Message Handling
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.ports[0].postMessage({ version: APP_VERSION });
});

console.log(`[SW v${APP_VERSION}] Service Worker loaded`);
 
        url.pathname === '/manifest.json' ||
        url.pathname.startsWith('/driver/')) {
      event.respondWith(
        caches.match(event.request)
          .then((response) => {
            if (response) {
              return response;
            }
            return fetch(event.request).catch((error) => {
              console.error('Fetch failed:', error);
              throw error;
            });
          })
          .catch((error) => {
            console.error('SW Fetch Error:', error);
            // Return a basic offline response if needed
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          })
      );
    }
  } catch (error) {
    console.error('SW Fetch Handler Error:', error);
  }
});
