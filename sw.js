const CACHE_NAME = 'kumamon-pwa-v1';

// 必須快取的資源，包含你的首頁和所有外部 CDN
const urlsToCache = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/react@18/umd/react.production.min.js',
    'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
    'https://unpkg.com/@babel/standalone/babel.min.js'
];

// 安裝階段：強制拉取並快取指定檔案
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('快取開啟成功');
                return cache.addAll(urlsToCache);
            })
    );
});

// 攔截請求階段：斷網時從快取拿資料
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // 如果在快取中找到 (斷網可用)，就直接回傳快取
                if (response) {
                    return response;
                }
                
                // 如果快取沒有，去網路抓
                return fetch(event.request).then(networkResponse => {
                    // 順便把新抓到的資料放進快取，以備下次斷網使用
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type !== 'opaque') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return networkResponse;
                }).catch(() => {
                    // 如果徹底斷網且沒快取，退回給他 index.html
                    if (event.request.mode === 'navigate') {
                        return caches.match('./index.html');
                    }
                });
            })
    );
});

// 啟動階段：清理舊版快取
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                          .map(name => caches.delete(name))
            );
        })
    );
});
