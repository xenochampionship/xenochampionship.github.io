const CACHE_NAME = 'xeno-championship-shell-v1';
const APP_SHELL_ASSETS = [
    './',
    './index.html',
    './manifest.webmanifest',
    './source/styles.css',
    './source/main.js',
    './source/recs.js',
    './source/images/xc-new-t.png',
    './source/images/app-icon-192.png',
    './source/images/app-icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key.startsWith('xeno-championship-shell-') && key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => cachedResponse || fetch(request).then(response => {
                if (response.ok && response.type === 'basic') {
                    const responseCopy = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, responseCopy));
                }
                return response;
            }))
    );
});
