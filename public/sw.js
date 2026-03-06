const CACHE_NAME = 'easy-employee-v4';
const urlsToCache = [
    '/manifest.json',
    '/pwa-icon-192.png',
    '/pwa-icon-512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (!event.request.url.startsWith(self.location.origin)) return;

    if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
        return; 
    }

    // Force network for navigation to ensure fresh CSS/Layout
    if (event.request.mode === 'navigate') {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});

// Notifications
self.addEventListener('push', function (event) {
    const data = event.data.json();
    const title = data.title || 'Nuovo messaggio';
    const options = {
        body: data.body,
        icon: '/pwa-icon-192.png',
        badge: '/pwa-icon-192.png',
        data: { url: data.url }
    };
    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                if ('focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(event.notification.data.url || '/');
            }
        })
    );
});
