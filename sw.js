const CACHE_NAME = 'kumamon-pwa-v5';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './react.production.min.js',
  './react-dom.production.min.js',
  './babel.min.js',
  './icon-192.png',
  './icon-512.png'
];

// 安裝
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.warn('部分本地檔案快取失敗', err);
      });
    })
  );
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // 只處理同源請求（自己的檔案），CDN 一律放行給網路
  if (url.origin !== location.origin) {
    return; // 不攔截 CDN
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(networkRes => {
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});

// 清除舊快取
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});
