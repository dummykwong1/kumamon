const CACHE_NAME = 'kumamon-pwa-v2';

const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',          // 如果你有圖示的話
  // CDN 改成個別處理，不要放在 addAll
];

// 安裝
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      // 先快取本地檔案
      await cache.addAll(urlsToCache);

      // CDN 個別嘗試，失敗也不影響整體
      const cdnUrls = [
        'https://cdn.tailwindcss.com',
        'https://unpkg.com/react@18/umd/react.production.min.js',
        'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
        'https://unpkg.com/@babel/standalone/babel.min.js'
      ];

      for (const url of cdnUrls) {
        try {
          const res = await fetch(url, { mode: 'no-cors' });
          // no-cors 會得到 opaque response，仍然可以快取
          await cache.put(url, res);
          console.log('已快取:', url);
        } catch (e) {
          console.warn('快取失敗（可忽略）:', url, e);
        }
      }
    })
  );
  self.skipWaiting();
});

// 攔截請求
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(networkRes => {
        // 只快取成功的回應
        if (networkRes && networkRes.status === 200) {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return networkRes;
      }).catch(() => {
        // 斷網且沒有快取時，回傳首頁
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
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});
