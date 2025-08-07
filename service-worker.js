/* eslint-disable no-restricted-globals */

/* ----------------------------------------------------------
   Cache names
---------------------------------------------------------- */
const CACHE_NAME      = 'poppy-market-shell-v3';
const DATA_CACHE_NAME = 'poppy-market-data-v1';

/* ----------------------------------------------------------
   Core assets to precache (first-party only)
---------------------------------------------------------- */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/main.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/* ----------------------------------------------------------
   INSTALL – cache app shell
---------------------------------------------------------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      await cache.addAll(CORE_ASSETS);      // precache shell
      console.log('[SW] Core assets cached');
    } catch (err) {
      console.warn('[SW] Partial cache:', err);
    }
    self.skipWaiting();                     // activate immediately
  })());
});

/* ----------------------------------------------------------
   ACTIVATE – prune old caches
---------------------------------------------------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) =>
          [CACHE_NAME, DATA_CACHE_NAME].includes(key) ? null : caches.delete(key)
        )
      )
    ).then(() => self.clients.claim())
  );
});

/* ----------------------------------------------------------
   FETCH
---------------------------------------------------------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  /* Network-first for Supabase API calls ------------------ */
  if (url.origin === 'https://lmzxjxumfqjrvcnsrfbr.supabase.co') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) =>
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(request, response.clone());   // update cache
            }
            return response;
          })
          .catch(() => cache.match(request))           // fallback to cache
      )
    );
    return;                                           // stop here
  }

  /* Cache-first for everything else ----------------------- */
  event.respondWith(
    caches.match(request).then((response) =>
      response || fetch(request)                       // network fallback
    )
::contentReference[oaicite:0]{index=0}
