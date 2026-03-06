const CACHE_NAME = 'easy-employee-v2';
const urlsToCache = [
    '/',
    '/dashboard',
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
                cacheNames.filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) return;

    // IMPORTANT: NEVER intercept API calls. Let the browser handle them naturally.
    if (event.request.url.includes('/api/')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached response if found
                if (response) {
                    return response;
                }

                // Otherwise fetch from network
                return fetch(event.request).catch(err => {
                    // If network fails and it's a page navigation, return dashboard/root
                    if (event.request.mode === 'navigate') {
                        return caches.match('/dashboard') || caches.match('/');
                    }
                    throw err;
                });
            })
    );
});

// Create listeners for Push Notifications
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
            // Check if there is already a window/tab open with the target URL
            for (let i = 0; i < clientList.length; i++) {
                const client = clientList[i];
                // Logic to focus if open, logic simplifed to focus first window or open new
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
