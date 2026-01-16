// MimiFlower Service Worker – Production V8 (Fail-Safe)
const CACHE_NAME = 'mimiflower-cache-v8';
const BASE_PATH = '/mimihoalua';

// Danh sách file quan trọng nhất (Nếu thiếu các file này, App sẽ lỗi)
const CORE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`
];

// Danh sách icon (Nếu thiếu 1-2 file cũng không sao, ta sẽ xử lý mềm)
const ICON_ASSETS = [
  `${BASE_PATH}/icons/icon-72.png`,
  `${BASE_PATH}/icons/icon-96.png`,
  `${BASE_PATH}/icons/icon-128.png`,
  `${BASE_PATH}/icons/icon-144.png`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-384.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Caching Core Assets...');
      await cache.addAll(CORE_ASSETS);

      console.log('[SW] Caching Icons (Fail-Safe)...');
      // Thử cache từng icon, nếu lỗi thì bỏ qua, không làm chết SW
      for (const icon of ICON_ASSETS) {
        try {
          const res = await fetch(icon);
          if (res.ok) await cache.put(icon, res);
        } catch (e) {
          console.warn(`[SW] Failed to cache icon: ${icon}`, e);
        }
      }
    })()
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
  const url = new URL(req.url);

  if (url.origin.includes('firebase') || url.origin.includes('googleapis') || url.pathname.includes('firestore')) return;

  if (req.mode === 'navigate' || req.destination === 'document' || req.destination === 'script' || req.destination === 'style' || req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(cached => {
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
             const resClone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, resClone));
          }
          return res;
        }).catch(err => console.log('Network fail'));
        return cached || fetchPromise;
      })
    );
  }
});
