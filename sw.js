// MimiFlower Service Worker – Professional V14 (Absolute Paths)
const CACHE_NAME = 'mimiflower-core-v14-absolute';
const REPO_PATH = '/mimihoalua'; // ĐƯỜNG DẪN CỨNG QUAN TRỌNG

// Danh sách file bắt buộc phải có (Critical Assets)
const STATIC_ASSETS = [
  `${REPO_PATH}/`,
  `${REPO_PATH}/index.html`,
  `${REPO_PATH}/manifest.json`,
  `${REPO_PATH}/icons/icon-192.png`,
  `${REPO_PATH}/icons/icon-512.png`
];

// 1. INSTALL: Cài đặt và cache
self.addEventListener('install', event => {
  self.skipWaiting(); // Kích hoạt ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      console.log(`[SW] Installing ${CACHE_NAME}...`);
      
      // Chiến lược: Cố gắng cache tất cả, nhưng không để lỗi 1 file làm hỏng tất cả
      const results = await Promise.allSettled(
        STATIC_ASSETS.map(url => 
          fetch(url, { cache: 'reload' }).then(res => {
            if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
            return cache.put(url, res);
          })
        )
      );

      // Log kết quả để debug
      results.forEach((res, i) => {
        if (res.status === 'rejected') console.warn(`[SW] Failed to cache: ${STATIC_ASSETS[i]}`, res.reason);
      });
    })
  );
});

// 2. ACTIVATE: Dọn dẹp cache cũ
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME && key.startsWith('mimiflower')) {
          console.log('[SW] Cleaning old cache:', key);
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('[SW] Clients claimed');
      return self.clients.claim();
    })
  );
});

// 3. FETCH: Chiến lược lai (Hybrid Strategy)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Chỉ xử lý GET request cùng domain
  if (req.method !== 'GET' || !url.href.startsWith(self.location.origin)) return;

  // A. HTML & Manifest: Network First (Ưu tiên mạng -> Luôn mới nhất)
  if (req.mode === 'navigate' || url.pathname.includes('manifest.json')) {
    event.respondWith(
      fetch(req).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, clone));
        return res;
      }).catch(() => caches.match(req)) // Mất mạng thì dùng cache
    );
    return;
  }

  // B. Các file tĩnh khác: Cache First (Ưu tiên tốc độ)
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
