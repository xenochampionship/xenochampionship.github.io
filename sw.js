const CACHE_NAME = 'xeno-championship-shell-v3';
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
            .then(cache => cache.addAll(APP_SHELL_ASSETS.map(asset =>
                new Request(new URL(asset, self.registration.scope), { cache: 'reload' })
            )))
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

self.addEventListener('push', event => {
    let payload = {
        title: 'Xeno Championship result',
        body: 'A fixture result is available.',
        icon: './source/images/app-icon-192.png',
        badge: './source/images/app-icon-192.png',
        data: { url: './#current' }
    };

    if (event.data) {
        try {
            payload = { ...payload, ...event.data.json() };
        } catch (_error) {
            payload.body = event.data.text() || payload.body;
        }
    }

    event.waitUntil(self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon,
        badge: payload.badge,
        data: payload.data || { url: './#current' }
    }));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    let targetUrl = new URL('./#current', self.location.origin).toString();
    try {
        const requestedUrl = new URL(event.notification.data?.url || targetUrl, self.location.origin);
        if (requestedUrl.origin === self.location.origin) {
            targetUrl = requestedUrl.toString();
        }
    } catch (_error) {
    }

    event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        const currentClient = windowClients.find(client => new URL(client.url).origin === self.location.origin);
        if (currentClient) {
            return currentClient.navigate(targetUrl).then(() => currentClient.focus());
        }
        return clients.openWindow(targetUrl);
    }));
});

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (request.method !== 'GET' || requestUrl.origin !== self.location.origin) {
        return;
    }

    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(new Request(request, { cache: 'no-cache' }))
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    event.respondWith(
        fetch(new Request(request, { cache: request.cache === 'no-store' ? 'no-store' : 'no-cache' }))
            .then(response => {
                if (response.ok && response.type === 'basic') {
                    if (request.cache !== 'no-store') {
                        return caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, response.clone()))
                            .then(() => response);
                    }
                }
                return response;
            })
            .catch(() => caches.match(request))
    );
});
