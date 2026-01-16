// MimiFlower Service Worker – Production V13 (Hardcoded Path)
const CACHE_NAME = 'mimiflower-cache-v13';
const BASE = '/mimihoalua'; // Đường dẫn gốc trên GitHub Pages

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
        console.log('[SW] Caching assets V13...');
        for (const asset of STATIC_ASSETS) {
            try {
                // Thêm mode: 'no-cors' để tránh lỗi cross-origin nếu có
                const res = await fetch(asset, { cache: 'reload' });
                if (res.ok) {
                    await cache.put(asset, res);
                } else {
                    console.error('[SW] 404 Not Found:', asset);
                }
            } catch (e) {
                console.warn('[SW] Fetch fail:', asset);
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
        }).catch(() => {});
        return cached || network;
      })
    );
  }
});
