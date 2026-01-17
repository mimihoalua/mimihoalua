// MimiFlower Service Worker - Fix Path 404
const CACHE_NAME = 'mimi-fix-404-v1';
const REPO = '/mimihoalua'; // Tên repo trên GitHub Pages

// Sử dụng đường dẫn tuyệt đối để đảm bảo tìm thấy file
const ASSETS = [
  `${REPO}/`,
  `${REPO}/index.html`,
  `${REPO}/manifest.json`,
  `${REPO}/icons/icon-192.png`,
  `${REPO}/icons/icon-512.png`
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching absolute paths...');
      return Promise.all(
        ASSETS.map(url => 
            fetch(url, {cache: 'reload'}).then(res => {
                if(res.ok) return cache.put(url, res);
                console.warn('[SW] 404 on:', url);
            }).catch(e => console.warn('[SW] Error:', url))
        )
      );
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  // Network First cho HTML để luôn lấy nội dung mới nhất
  if (event.request.mode === 'navigate' || event.request.url.includes('manifest.json')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache First cho ảnh/css
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
