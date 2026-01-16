// MimiFlower Service Worker – Relative Path v3.0
// Tự động nhận diện thư mục gốc dựa trên vị trí file sw.js
const CACHE_NAME = 'mimiflower-v3-relative';

// Sử dụng đường dẫn tương đối để an toàn trên mọi hosting (GitHub Pages, Subdomain...)
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching relative assets...');
      // Dùng {cache: 'reload'} để ép trình duyệt tải file mới nhất từ server
      return Promise.all(
        STATIC_ASSETS.map(url => 
          fetch(url, { cache: 'reload' }).then(res => {
            if (!res.ok) throw Error(`[SW] Fail to load: ${url}`);
            return cache.put(url, res);
          }).catch(err => console.warn(err))
        )
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Chỉ xử lý GET request cùng domain
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  // HTML: Network First (Luôn lấy mới nhất, lỗi mạng mới dùng cache)
  if (req.mode === 'navigate' || req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Assets khác (Ảnh, JS, CSS): Cache First
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
