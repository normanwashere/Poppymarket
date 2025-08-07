/* eslint-disable no-restricted-globals */
const CACHE_NAME      = 'poppy-market-shell-v4';
const DATA_CACHE_NAME = 'poppy-market-data-v1';

const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css',
  '/main.js',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

/* INSTALL */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    try { await cache.addAll(CORE_ASSETS); } catch (err) { console.warn(err); }
    self.skipWaiting();
  })());
});

/* ACTIVATE */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(k =>
            [CACHE_NAME, DATA_CACHE_NAME].includes(k) ? null : caches.delete(k)
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

/* FETCH */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  /* Network-first for Supabase API */
  if (url.origin === 'https://lmzxjxumfqjrvcnsrfbr.supabase.co') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache =>
        fetch(request)
          .then(res => {
            if (request.method === 'GET' && res.status === 200) {
              cache.put(request, res.clone());     // only GET can be cached
            }
            return res;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  /* Cache-first for everything else */
  event.respondWith(
    caches.match(request).then(resp => resp || fetch(request))
  );
});
