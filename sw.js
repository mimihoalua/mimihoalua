// MimiFlower Service Worker – Production V5 (Fix Install Prompt)
const CACHE_NAME = 'mimiflower-cache-v5';

// Sử dụng đường dẫn tương đối linh hoạt hơn để tránh lỗi 404 trên GitHub Pages
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon-72.png',
  'icons/icon-96.png',
  'icons/icon-128.png',
  'icons/icon-144.png',
  'icons/icon-192.png',
  'icons/icon-384.png',
  'icons/icon-512.png'
];

// INSTALL
self.addEventListener('install', event => {
  console.log('[SW] Installing V5...');
  self.skipWaiting(); // Kích hoạt ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
        console.log('[SW] Caching all assets');
        return cache.addAll(STATIC_ASSETS);
    })
  );
});

// ACTIVATE
self.addEventListener('activate', event => {
  console.log('[SW] Activating V5...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  return self.clients.claim(); // Chiếm quyền điều khiển ngay
});

// FETCH
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Bỏ qua request không phải GET hoặc request đến API/Firebase
  if (req.method !== 'GET' || url.origin.includes('firebase') || url.origin.includes('googleapis')) {
    return;
  }

  // Chiến thuật: Stale-While-Revalidate (Ưu tiên tốc độ, cập nhật ngầm)
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.mode === 'navigate'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        const networkFetch = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          }
          return res;
        }).catch(() => {
            // Network lỗi, không làm gì (đã có cached)
        });
        return cached || networkFetch;
      })
    );
  }
});
