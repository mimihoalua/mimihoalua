// ======================================
// MimiFlower Service Worker v2.0
// Auto Update – Safe Reload
// ======================================

const CACHE_NAME = 'mimiflower-cache-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  
  // Đảm bảo bạn đã tạo thư mục icons và có các file này
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// ---------- INSTALL (Cài đặt & Cache ngay lập tức) ----------
self.addEventListener('install', event => {
  self.skipWaiting(); // ⚠️ Quan trọng: Cho phép SW mới đè lên SW cũ ngay lập tức
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
});

// ---------- ACTIVATE (Dọn dẹp cache cũ) ----------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME && caches.delete(key))
      )
    )
  );
  self.clients.claim(); // Takeover: Kiểm soát ngay các tab đang mở
});

// ---------- FETCH (Chiến thuật Cache Thông Minh) ----------
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // ❌ 1. KHÔNG CACHE DỮ LIỆU ĐỘNG (Firebase / API)
  // Để đảm bảo đơn hàng và tồn kho luôn chính xác
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis') ||
    url.pathname.includes('firestore')
  ) {
    return; // Dùng mạng trực tiếp (Network Only)
  }

  // ✅ 2. CACHE FIRST (Cho tài nguyên tĩnh)
  // HTML, CSS, JS, Ảnh -> Lấy từ Cache cho nhanh, sau đó ngầm cập nhật
  if (
    req.destination === 'document' ||
    req.destination === 'script' ||
    req.destination === 'style' ||
    req.destination === 'image' ||
    req.destination === 'font'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        // Chiến thuật: Stale-While-Revalidate
        // (Trả về Cache ngay, nhưng vẫn tải ngầm bản mới để lần sau dùng)
        const fetchPromise = fetch(req).then(networkRes => {
          // Nếu tải thành công, lưu bản mới vào cache
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, networkRes.clone());
          });
          return networkRes;
        }).catch(() => {
            // Nếu mất mạng, kệ nó (đã có cached trả về rồi)
        });

        // Ưu tiên trả về Cache nếu có, nếu không thì chờ mạng
        return cached || fetchPromise;
      })
    );
  }
});
