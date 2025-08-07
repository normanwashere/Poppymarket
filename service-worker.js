/* eslint-disable no-restricted-globals */
const CACHE_NAME      = 'poppy-shell-v5';
const DATA_CACHE_NAME = 'poppy-data-v1';

/* ONLY assets you’re certain are emitted by Vercel */
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

/* ---------- INSTALL ---------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    /* try each asset individually so one 404 doesn’t crash everything */
    await Promise.all(
      CORE_ASSETS.map(async (url) => {
        try { await cache.add(url); }         // 200 => cached
        catch (err) { console.warn('[SW] skip', url); }
      })
    );

    self.skipWaiting();
  })());
});

/* ---------- ACTIVATE ---------- */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys.map(k =>
            [CACHE_NAME, DATA_CACHE_NAME].includes(k)
              ? null
              : caches.delete(k)
          )
        )
      )
      .then(() => self.clients.claim())
  );
});

/* ---------- FETCH ---------- */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Never cache Supabase auth endpoints, profile data, or any POST/PATCH/PUT requests
  const isSupabaseAuth = url.origin === 'https://lmzxjxumfqjrvcnsrfbr.supabase.co' && (
    url.pathname.startsWith('/auth/v1') ||
    url.pathname.startsWith('/rest/v1/profiles') ||
    url.pathname.startsWith('/rest/v1/logged_sessions') ||
    url.pathname.startsWith('/rest/v1/bonus_configs') ||
    url.pathname.startsWith('/functions/v1/')
  );
  if (isSupabaseAuth || request.method !== 'GET') {
    // Always go to network, never cache
    event.respondWith(fetch(request));
    return;
  }

  // Network-first for safe Supabase GET data endpoints
  if (
    url.origin === 'https://lmzxjxumfqjrvcnsrfbr.supabase.co' &&
    url.pathname.startsWith('/rest/v1')
  ) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache =>
        fetch(request)
          .then(res => {
            if (res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  // Cache-first for static assets only
  event.respondWith(
    caches.match(request).then(resp => resp || fetch(request))
  );
});
