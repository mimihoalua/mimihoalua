// MimiFlower Service Worker – V20 (Full Icons & Safe Cache)
const CACHE_NAME = 'mimi-cache-v20-icons';
const BASE = '/mimihoalua'; // Đường dẫn gốc GitHub Pages
// Danh sách file cần cache (Đường dẫn tuyệt đối để tránh lỗi 404 trên Mobile)
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

// 1. INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log('[SW] Caching full icon set...');
      // Dùng map để fetch từng file, tránh lỗi 1 file làm hỏng tất cả
      await Promise.all(STATIC_ASSETS.map(url => 
        fetch(url, { cache: 'reload' }).then(res => {
          if (res.ok) return cache.put(url, res);
          console.warn('[SW] Skip 404:', url);
        }).catch(() => {})
      ));
    })
  );
});

// 2. ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// 3. FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Bỏ qua các request không phải GET hoặc request API (Firebase/Google)
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // HTML & Manifest: Network First (Ưu tiên mạng -> Luôn mới nhất)
  if (req.mode === 'navigate' || url.pathname.includes('manifest.json')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Assets (Ảnh/Icon): Cache First (Ưu tiên tốc độ)
  event.respondWith(
    caches.match(req).then(res => res || fetch(req))
  );
});
