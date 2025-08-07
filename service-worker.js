// A unique name for our cache
const CACHE_NAME = 'poppy-market-cache-v2'; // Incremented version to ensure updates
const DATA_CACHE_NAME = 'poppy-market-data-cache-v1';

// The list of core files to cache immediately upon installation
const CORE_ASSETS = [
  '/', // The main index.html file
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// --- INSTALL Event ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened core asset cache');
        return cache.addAll(CORE_ASSETS);
      })
  );
});

// --- ACTIVATE Event ---
// Cleans up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME, DATA_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// --- FETCH Event ---
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // --- Stale-While-Revalidate for API/Data calls ---
  // If the request is for our Supabase data, use a network-first strategy.
  if (url.origin === 'https://lmzxjxumfqjrvcnsrfbr.supabase.co') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request).then((networkResponse) => {
          // If we get a valid response, cache it and return it.
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If the network fails, try to serve from the cache.
          return cache.match(event.request);
        });
      })
    );
    return;
  }

  // --- Cache First for Core Assets ---
  // For all other requests (our core assets), serve from cache first.
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If a cached response is found, return it. Otherwise, fetch from network.
        return response || fetch(event.request);
      })
  );
});
