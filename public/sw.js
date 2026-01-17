// MimiFlower Service Worker – V18 (Full Icon Cache)
const CACHE_NAME = 'mimi-cache-v18-full-icons';
const BASE = '/mimihoalua';

const STATIC_ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/manifest.json`,
  `${BASE}/icons/icon-72.png`,
  `${BASE}/icons/icon-96.png`,
  `${BASE}/icons/icon-128.png`,
  `${BASE}/icons/icon-144.png`,
  `${BASE}/icons/icon-192.png`,
  `${BASE}/icons/icon-384.png`,
  `${BASE}/icons/icon-512.png`
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[SW] Caching full icon set...');
      await Promise.all(STATIC_ASSETS.map(url => 
        fetch(url, { cache: 'reload' }).then(res => {
          if (res.ok) return cache.put(url, res);
        }).catch(() => {})
      ));
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // HTML & Manifest: Network First
  if (req.mode === 'navigate' || req.url.includes('manifest.json')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Assets: Cache First
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
