// MimiFlower Service Worker – Smart Logic v2.0
const CACHE_NAME = 'mimiflower-core-v20';
const BASE_PATH = '/mimihoalua';

// Tài nguyên tĩnh quan trọng (Pre-cache)
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// 1. INSTALL: Cài đặt và cache tài nguyên tĩnh ngay lập tức
self.addEventListener('install', event => {
  self.skipWaiting(); // Kích hoạt SW mới ngay lập tức, không chờ đợi
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching core assets...');
      return cache.addAll(PRECACHE_URLS);
    })
  );
});

// 2. ACTIVATE: Dọn dẹp cache cũ để tiết kiệm bộ nhớ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim()) // Kiểm soát tất cả các tab ngay lập tức
  );
});

// 3. FETCH: Bộ não phân luồng request
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // A. Bỏ qua request không phải GET hoặc request tới API bên ngoài (Firebase, Google Fonts...)
  // Để trình duyệt tự xử lý (Network Only) tránh lỗi CORS hoặc dữ liệu cũ
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // B. Chiến lược cho HTML (Navigations): Network First, Fallback to Cache
  // Đảm bảo người dùng luôn thấy giá/sản phẩm mới nhất. Nếu mất mạng mới dùng cache.
  if (req.mode === 'navigate' || req.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(networkRes => {
          // Nếu có mạng, copy vào cache để dành cho lần sau
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return networkRes;
        })
        .catch(() => {
          // Nếu mất mạng, lấy từ cache
          return caches.match(req).then(cachedRes => {
            if (cachedRes) return cachedRes;
            // Nếu không có cả cache (lần đầu vào mà mất mạng), trả về trang offline (nếu có)
            return new Response("<h1>Bạn đang offline. Vui lòng kiểm tra kết nối.</h1>", {
              headers: { "Content-Type": "text/html; charset=utf-8" }
            });
          });
        })
    );
    return;
  }

  // C. Chiến lược cho Ảnh/JS/CSS/Manifest: Cache First, Fallback to Network
  // Tối ưu tốc độ tải trang.
  event.respondWith(
    caches.match(req).then(cachedRes => {
      if (cachedRes) return cachedRes;
      return fetch(req).then(networkRes => {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
        return networkRes;
      });
    })
  );
});
