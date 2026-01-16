// MimiFlower Service Worker - Safe Relative Paths v7.0
const CACHE_NAME = 'mimi-safe-v7';

// Dùng ./ để đảm bảo đúng đường dẫn trên GitHub Pages
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. Cài đặt và Cache file tĩnh
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching assets...');
      // Dùng {cache: 'reload'} để đảm bảo lấy file mới nhất
      return Promise.all(
        ASSETS_TO_CACHE.map(url => {
            return fetch(url, { cache: 'reload' }).then(res => {
                if(res.ok) return cache.put(url, res);
            }).catch(err => console.log('SW Skip:', url));
        })
      );
    })
  );
});

// 2. Kích hoạt và Xóa cache cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    )).then(() => self.clients.claim())
  );
});

// 3. Xử lý tải trang (QUAN TRỌNG: Ưu tiên mạng cho HTML)
self.addEventListener('fetch', event => {
  const req = event.request;
  
  // Chỉ xử lý GET request
  if (req.method !== 'GET') return;

  // HTML & Manifest: Network First (Ưu tiên mạng -> Mới nhất)
  if (req.mode === 'navigate' || req.url.includes('manifest.json')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req)) // Mất mạng thì lấy cache
    );
    return;
  }

  // Ảnh/File tĩnh: Cache First (Ưu tiên tốc độ)
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
