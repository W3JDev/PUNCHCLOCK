
const CACHE_NAME = 'punchclock-app-v3';
const DYNAMIC_CACHE = 'punchclock-dynamic-v3';

// 1. App Shell - Critical assets for instant load
const ASSETS_TO_PRECACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com', // Pre-cache Tailwind (if allowed by CORS)
  'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@500;700;900&display=swap'
];

// --- INSTALL ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker ...', event);
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching App Shell');
      return cache.addAll(ASSETS_TO_PRECACHE);
    })
  );
  self.skipWaiting(); // Force activation
});

// --- ACTIVATE ---
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker ...', event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Removing old cache.', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// --- FETCH STRATEGIES ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API Calls / Dynamic Data: Network First, No Cache
  // We want real-time data for APIs. If offline, the app handles it gracefully via try/catch.
  if (url.pathname.includes('/api/') || request.method !== 'GET') {
    return; // Let browser handle it (Network only)
  }

  // 2. Navigation Requests (HTML): Network First -> Cache -> Offline Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
             if (cachedResponse) return cachedResponse;
             // If navigation fails and not in cache, return index.html (SPA) or Offline page
             return caches.match('/index.html')
               .then(indexRes => indexRes || caches.match('/offline.html')); // Fallback chain
          });
        })
    );
    return;
  }

  // 3. Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  // Serve from cache immediately, then update cache in background
  if (
    request.destination === 'script' || 
    request.destination === 'style' || 
    request.destination === 'image' || 
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request).then((networkResponse) => {
           // Check if valid response before caching
           if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
           }
           return networkResponse;
        }).catch(() => {
           // Network failure, just return what we have
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Default Fallback
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// --- BACKGROUND SYNC (Placeholder) ---
// Useful for syncing punch-ins made while offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-attendance') {
    console.log('[Service Worker] Syncing Attendance Data...');
    // event.waitUntil(syncAttendance());
  }
});
