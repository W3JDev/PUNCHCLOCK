const CACHE_NAME = 'punchclock-v2';
const DYNAMIC_CACHE = 'punchclock-dynamic-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Event: Cache Core Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event: Cleanup Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Network First for Nav, Stale-While-Revalidate for Assets
self.addEventListener('fetch', (event) => {
  // 1. Navigation Requests (HTML): Network First -> Fallback to Cache -> Fallback to /index.html (SPA)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match(event.request).then((cachedResponse) => {
             if (cachedResponse) return cachedResponse;
             // Critical for SPA: serve index.html if offline and route is not cached
             return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // 2. Static Assets (JS/CSS/Images): Stale-While-Revalidate
  // We check destinations to cache images/scripts/styles loaded at runtime
  if (event.request.destination === 'script' || event.request.destination === 'style' || event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
           // Basic CORS check before caching opaque or valid responses
           if (networkResponse && networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors')) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(event.request, responseToCache);
              });
           }
           return networkResponse;
        }).catch((err) => {
           // Network failed, do nothing (will return cachedResponse if available)
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Default: Network Only
  event.respondWith(fetch(event.request));
});