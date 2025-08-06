// A unique name for our cache
const CACHE_NAME = 'poppy-market-cache-v1';

// The list of files and resources to cache immediately upon installation
const urlsToCache = [
  '/', // The main index.html file
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// --- INSTALL Event ---
// This event is fired when the service worker is first installed.
self.addEventListener('install', (event) => {
  // We wait until the caching is complete before finishing installation.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        // Add all the specified URLs to the cache.
        return cache.addAll(urlsToCache);
      })
  );
});

// --- FETCH Event ---
// This event is fired for every network request the page makes.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    // Try to find a matching response in the cache first.
    caches.match(event.request)
      .then((response) => {
        // If a cached response is found, return it.
        if (response) {
          return response;
        }

        // If not found in cache, fetch it from the network.
        return fetch(event.request).then(
          (networkResponse) => {
            // If the fetch is successful, we should cache the new response.
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        );
      })
  );
});

// --- ACTIVATE Event ---
// This event is fired when the service worker is activated.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // If this cache name is not in our whitelist, delete it.
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
