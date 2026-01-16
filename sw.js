// ================================
// MimiFlower Service Worker v1.0
// Cache Smart – Safe – Stable
// ================================

const CACHE_NAME = 'mimiflower-cache-v1';

// Những file tĩnh, rất ít thay đổi
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',

  // Icons
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png'
];

// ---------------- INSTALL ----------------
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ---------------- ACTIVATE ----------------
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ---------------- FETCH ----------------
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // 1️⃣ KHÔNG CACHE FIREBASE / API
  if (
    url.origin.includes('firebase') ||
    url.origin.includes('googleapis') ||
    url.pathname.includes('/__')
  ) {
    return;
  }

  // 2️⃣ CACHE FIRST – CHO FILE TĨNH
  if (
    req.destination === 'document' ||
    req.destination === 'style' ||
    req.destination === 'script' ||
    req.destination === 'image'
  ) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;

        return fetch(req).then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(req, copy);
          });
          return res;
        }).catch(() => cached);
      })
    );
  }
});
