// MimiFlower Service Worker – Production V11 (Absolute Path Fix)
const CACHE_NAME = 'mimiflower-cache-v11';
const BASE = '/mimihoalua';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-512.png`
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
        console.log('[SW] Caching assets...');
        // Dùng try-catch để nếu 1 file lỗi (ví dụ icon), App vẫn cài được
        for (const asset of STATIC_ASSETS) {
            try {
                const res = await fetch(asset);
                if (res.ok) await cache.put(asset, res);
            } catch (e) {
                console.warn('[SW] Cache fail:', asset);
            }
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
  const url = new URL(req.url);

  // Bỏ qua request không hợp lệ
  if (url.origin.includes('firebase') || url.origin.includes('googleapis') || req.method !== 'GET') return;

  // Cache First Strategy
  if (req.mode === 'navigate' || req.destination === 'document' || req.destination === 'script' || req.destination === 'style' || req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(cached => {
        const network = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
             const clone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, clone));
          }
          return res;
        }).catch(() => {}); // Mất mạng thì thôi
        return cached || network;
      })
    );
  }
});
