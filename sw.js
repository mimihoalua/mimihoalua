// MimiFlower Service Worker – Production V9 (Fail-Safe Mode)
const CACHE_NAME = 'mimiflower-cache-v9';
const BASE_PATH = '/mimihoalua'; // Đường dẫn gốc GitHub Pages

// 1. Tài nguyên CỐT LÕI (Bắt buộc phải có)
const CORE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`
];

// 2. Tài nguyên PHỤ (Icon - Nếu thiếu cũng không làm chết App)
const ICON_ASSETS = [
  `${BASE_PATH}/icons/icon-72.png`,
  `${BASE_PATH}/icons/icon-96.png`,
  `${BASE_PATH}/icons/icon-128.png`,
  `${BASE_PATH}/icons/icon-144.png`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-384.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// INSTALL (Chạy ngay khi vào web)
self.addEventListener('install', event => {
  self.skipWaiting(); // Ép cập nhật ngay lập tức
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Caching Core Assets...');
      // Cache file quan trọng trước
      await cache.addAll(CORE_ASSETS);

      console.log('[SW] Caching Icons (Fail-Safe)...');
      // Thử cache từng icon, lỗi thì bỏ qua chứ không crash
      for (const icon of ICON_ASSETS) {
        try {
          const res = await fetch(icon);
          if (res.ok) {
            await cache.put(icon, res);
          } else {
            console.warn(`[SW] Missing icon (404): ${icon}`);
          }
        } catch (e) {
          console.warn(`[SW] Error fetching icon: ${icon}`, e);
        }
      }
    })()
  );
});

// ACTIVATE (Dọn dẹp nhà cửa)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  self.clients.claim(); // Kiểm soát ngay lập tức
});

// FETCH (Phục vụ file từ cache)
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Không cache API / Firebase / File lạ
  if (
    url.origin.includes('firebase') || 
    url.origin.includes('googleapis') ||
    url.pathname.includes('firestore')
  ) return;

  // Cache First Strategy cho tài nguyên tĩnh
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.mode === 'navigate'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        // Chiến thuật Stale-While-Revalidate: Trả về cache ngay, tải mới ngầm
        const fetchPromise = fetch(req).then(res => {
          if (res && res.status === 200 && res.type === 'basic') {
             const resClone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, resClone));
          }
          return res;
        }).catch(() => {
           // Mất mạng thì thôi (đã có cached ở trên)
        });
        return cached || fetchPromise;
      })
    );
  }
});
