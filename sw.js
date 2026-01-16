// MimiFlower Service Worker – Production V9 (Relative Paths & Debug)
const CACHE_NAME = 'mimiflower-cache-v9';

// Dùng đường dẫn tương đối. Nó sẽ tự động hiểu là nằm cùng cấp với sw.js
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png', // Chỉ cần cache các icon chính để đảm bảo PWA
  './icons/icon-512.png' 
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
        console.log('[SW] Starting Cache...');
        // Thử cache từng file một để nếu lỗi 1 file cũng không chết cả SW
        for (const asset of STATIC_ASSETS) {
            try {
                const res = await fetch(asset);
                if (res.ok) {
                    await cache.put(asset, res);
                } else {
                    console.error('[SW] Failed to load:', asset, res.status);
                }
            } catch (err) {
                console.error('[SW] Fetch error for:', asset, err);
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
  
  // Bỏ qua request lạ
  if (!req.url.startsWith('http')) return;
  const url = new URL(req.url);

  // Không cache Firebase / API
  if (url.origin.includes('firebase') || url.origin.includes('googleapis')) return;

  // Cache First Strategy
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
        }).catch(err => {
            // console.log('Offline mode');
        });
        return cached || fetchPromise;
      })
    );
  }
});
