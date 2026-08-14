const CACHE_NAME = 'kumamon-expense-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './js/react.production.min.js',      // 改用本地檔案
  './js/react-dom.production.min.js',  // 改用本地檔案
  './js/babel.min.js'                  // 改用本地檔案
];

// 1. 安裝階段
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// 2. 啟用階段（清理舊快取）
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. 攔截請求（加強防錯）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // 如果快取有就直接回傳，否則去網絡抓
      return response || fetch(event.request).catch(() => {
        // 斷網且不在快取時的保底處理（例如回傳首頁或靜態提示）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
