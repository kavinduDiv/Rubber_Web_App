const CACHE_NAME = 'rubber-pwa-v1';

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                '/',
                '/manifest.webmanifest',
                '/icon-192.png',
                '/icon-512.png'
            ]);
        })
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            self.clients.claim(),
            caches.keys().then((keys) => {
                return Promise.all(
                    keys.map((key) => {
                        if (key !== CACHE_NAME) return caches.delete(key);
                    })
                );
            })
        ])
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).then((res) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, res.clone());
                    return res;
                });
            });
        }).catch(() => {
            return caches.match('/');
        })
    );
});
