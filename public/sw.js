// MimiFlower Service Worker – Production V17 (Fixed Path)
const CACHE_NAME = 'mimiflower-cache-v17-android-fix';
const BASE = '/mimihoalua'; // Đường dẫn gốc CỐ ĐỊNH

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
        console.log('[SW] Caching assets V17...');
        // Dùng map để fetch từng file, tránh lỗi 1 file làm hỏng tất cả
        await Promise.all(STATIC_ASSETS.map(url => 
            fetch(url, { cache: 'reload' }).then(res => {
                if (res.ok) return cache.put(url, res);
                console.warn('[SW] Skip 404:', url);
            }).catch(e => console.warn('[SW] Fail:', url))
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
  
  // Chỉ xử lý GET request
  if (req.method !== 'GET') return;

  // HTML & Manifest: Network First (Ưu tiên mạng)
  // Để đảm bảo không bị kẹt cache cũ trên Android
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

  // Assets khác: Cache First
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
