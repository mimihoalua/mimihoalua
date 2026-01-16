// MimiFlower Service Worker – Production
const CACHE_NAME = 'mimiflower-cache-v3';

// Danh sách file tĩnh cần cache ngay lập tức để chạy Offline
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// INSTALL: Tải và cache file tĩnh
self.addEventListener('install', event => {
  // Quan trọng: Bỏ qua trạng thái chờ để cập nhật ngay
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ACTIVATE: Xóa cache cũ để tránh xung đột
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    )
  );
  // Quan trọng: Chiếm quyền kiểm soát ngay các tab đang mở
  self.clients.claim();
});

// FETCH: Chiến thuật Cache-First cho file tĩnh, Network-Only cho API
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1. Không bao giờ cache request đến Firebase / API
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis') ||
    url.pathname.includes('firestore')
  ) {
    return; // Để trình duyệt tự xử lý (Network Only)
  }

  // 2. Cache First cho tài nguyên tĩnh (HTML, CSS, JS, Image)
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.mode === 'navigate' // Quan trọng cho SPA
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        // Chiến thuật Stale-While-Revalidate:
        // Trả về cache ngay (nếu có) để nhanh, đồng thời tải ngầm bản mới
        const fetchPromise = fetch(req).then(res => {
          // Chỉ cache nếu phản hồi hợp lệ
          if (res && res.status === 200 && res.type === 'basic') {
             const resClone = res.clone();
             caches.open(CACHE_NAME).then(c => c.put(req, resClone));
          }
          return res;
        }).catch(() => {
           // Nếu mất mạng, không làm gì cả (đã có cached trả về ở dưới)
        });

        return cached || fetchPromise;
      })
    );
  }
});
