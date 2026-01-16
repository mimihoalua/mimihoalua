// MimiFlower Service Worker – Production V10 (Auto-Detect Path)
const CACHE_NAME = 'mimiflower-cache-v10';

// Tự động xác định đường dẫn gốc dựa trên vị trí của file sw.js
// Ví dụ: https://domain.com/mimihoalua/sw.js -> BASE_PATH = '/mimihoalua'
// Ví dụ: https://domain.com/sw.js -> BASE_PATH = ''
const SCOPE = self.registration.scope;
const BASE_PATH = new URL(SCOPE).pathname.replace(/\/$/, '');

console.log(`[SW] Initializing with BASE_PATH: "${BASE_PATH}"`);

// 1. Tài nguyên CỐT LÕI (Bắt buộc phải có để App chạy Offline)
const CORE_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.json`
];

// 2. Tài nguyên PHỤ (Icon - Fail-Safe: Thiếu cũng không sao)
const ICON_ASSETS = [
  `${BASE_PATH}/icons/icon-72.png`,
  `${BASE_PATH}/icons/icon-96.png`,
  `${BASE_PATH}/icons/icon-128.png`,
  `${BASE_PATH}/icons/icon-144.png`,
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-384.png`,
  `${BASE_PATH}/icons/icon-512.png`
];

// INSTALL
self.addEventListener('install', event => {
  self.skipWaiting(); // Kích hoạt ngay lập tức
  
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW] Caching Core Assets...');
      
      // Cache Core Assets (Nếu lỗi -> SW chết -> Báo lỗi cho Dev biết)
      try {
          await cache.addAll(CORE_ASSETS);
      } catch (e) {
          console.error('[SW] CRITICAL: Failed to cache core assets. Check paths!', e);
          // Không throw e để SW vẫn cố gắng cài đặt (dù rủi ro)
      }

      console.log('[SW] Caching Icons (Fail-Safe)...');
      // Thử cache từng icon, lỗi thì bỏ qua (404 safe)
      for (const icon of ICON_ASSETS) {
        try {
          const req = new Request(icon, { mode: 'no-cors' }); // no-cors để tránh lỗi cross-origin nếu có
          const res = await fetch(req);
          if (res.ok || res.type === 'opaque') {
            await cache.put(icon, res);
          } else {
            console.warn(`[SW] Missing icon (404): ${icon}`);
          }
        } catch (e) {
          // Icon lỗi không sao cả, App vẫn chạy
          console.warn(`[SW] Error fetching icon: ${icon}`, e);
        }
      }
    })()
  );
});

// ACTIVATE (Dọn dẹp cache cũ)
self.addEventListener('activate', event => {
  console.log('[SW] Activated. Cleaning old caches...');
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
    url.pathname.includes('firestore') ||
    req.method !== 'GET'
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
        // Chiến thuật Stale-While-Revalidate
        const fetchPromise = fetch(req).then(res => {
          // Chỉ cache response hợp lệ (status 200, type basic)
          if (res && res.status === 200 && res.type === 'basic') {
             const resClone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, resClone));
          }
          return res;
        }).catch(err => {
            console.log('[SW] Network fail, serving offline content if available');
        });
        
        return cached || fetchPromise;
      })
    );
  }
});
