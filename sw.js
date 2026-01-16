// MimiFlower Service Worker – Production V12 (Critical Path Check)
const CACHE_NAME = 'mimiflower-cache-v12';

// Đường dẫn tuyệt đối chuẩn cho GitHub Pages
const BASE = '/mimihoalua';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`
  // Tạm thời không cache icon ở đây để tránh lỗi làm chết SW
  // Browser sẽ tự cache icon theo manifest
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
        console.log('[SW] Caching Critical Assets...');
        try {
            await cache.addAll(STATIC_ASSETS);
            console.log('[SW] Critical Assets Cached!');
        } catch (e) {
            console.error('[SW] Cache Failed! Check paths:', e);
        }
    })
  );
});

// ACTIVATE
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
  
  if (req.method !== 'GET') return;

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok) {
           const clone = res.clone();
           caches.open(CACHE_NAME).then(c => c.put(req, clone));
        }
        return res;
      }).catch(e => console.log('Offline fallback'));

      return cached || network;
    })
  );
});
