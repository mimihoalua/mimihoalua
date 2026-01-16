// MimiFlower Service Worker – Production V4 (Fix Path)
const CACHE_NAME = 'mimiflower-cache-v4';

// Danh sách file tĩnh cần cache (Đường dẫn tương đối với sw.js)
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

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ACTIVATE (Xóa cache cũ v1, v2, v3...)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Không cache Firebase / API
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis') ||
    url.pathname.includes('firestore')
  ) return;

  // Cache First cho tài nguyên tĩnh
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.mode === 'navigate'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
             const resClone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, resClone));
          }
          return res;
        }).catch(() => {
           // Fallback
        });
        return cached || fetchPromise;
      })
    );
  }
});
