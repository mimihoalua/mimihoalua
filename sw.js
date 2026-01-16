// MimiFlower Service Worker v8.0 - Debug & Fix Mode
const CACHE_NAME = 'mimi-pwa-v8-debug';

// Danh sách file tĩnh
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// 1. INSTALL
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Installing v8.0...');
      return Promise.all(
        ASSETS.map(url => 
          fetch(url, {cache: 'reload'}).then(res => {
            if(res.ok) return cache.put(url, res);
            console.warn('[SW] Failed to load:', url, res.status);
          }).catch(e => console.warn('[SW] Connection error:', url))
        )
      );
    })
  );
});

// 2. ACTIVATE (Xóa cache cũ ngay lập tức)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', key);
          return caches.delete(key);
        }
      })
    )).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// 3. FETCH (Network First cho HTML/Manifest)
self.addEventListener('fetch', event => {
  // Chỉ xử lý GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // HTML & Manifest: Luôn ưu tiên mạng để tránh lỗi 404 ảo do cache
  if (event.request.mode === 'navigate' || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          // Chỉ cache nếu thành công
          if(res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Các file khác: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  );
});
