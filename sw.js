// ======================================
// MimiFlower Service Worker v2.0
// Auto Update – Safe Reload
// ======================================

const CACHE_NAME = 'mimiflower-cache-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',

  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// ---------- INSTALL ----------
self.addEventListener('install', event => {
  self.skipWaiting(); // ⚠️ cho phép update ngay
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ---------- ACTIVATE ----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim(); // takeover tab đang mở
});

// ---------- FETCH ----------
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // ❌ Không cache Firebase / API
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis')
  ) return;

  // ✅ Cache First cho static
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(networkRes => {
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
          });
          return networkRes;
        });
        return cached || fetchPromise;
      })
    );
  }
});
