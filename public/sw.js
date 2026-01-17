// MimiFlower Service Worker – Public Folder Structure
const CACHE_NAME = 'mimi-public-v1';

// Tất cả đường dẫn đều là tương đối so với file sw.js này
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
      console.log('[SW] Caching relative assets...');
      return Promise.all(
        ASSETS.map(url => 
            fetch(url, {cache: 'reload'}).then(res => {
                if(res.ok) return cache.put(url, res);
                console.warn('[SW] 404:', url);
            }).catch(e => console.warn('[SW] Error:', url))
        )
      );
    })
  );
});

// 2. ACTIVATE
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
    )).then(() => self.clients.claim())
  );
});

// 3. FETCH
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);

  // HTML & Manifest: Network First (Luôn mới)
  if (event.request.mode === 'navigate' || url.pathname.endsWith('manifest.json')) {
    event.respondWith(
      fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  // Assets: Cache First
  event.respondWith(
    caches.match(event.request).then(res => res || fetch(event.request))
  );
});
