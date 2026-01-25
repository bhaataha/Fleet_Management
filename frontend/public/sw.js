// Service Worker for PWA offline support (Driver App Only)
const CACHE_NAME = 'fleet-driver-v2'; // Updated version
const urlsToCache = [
  '/driver.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .catch((error) => {
        console.error('SW Install Error:', error);
      })
  );
  // Force activation of new service worker
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Take control of all clients immediately
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  try {
    const url = new URL(event.request.url);
    
    // Skip API requests completely to avoid CORS issues
    if (url.pathname.startsWith('/api/') || 
        (url.hostname === 'localhost' && url.port === '8001') ||
        url.hostname !== self.location.hostname) {
      // Let API and external requests go through without caching
      return;
    }
    
    // Only cache driver app resources
    if (url.pathname === '/driver.html' || 
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
