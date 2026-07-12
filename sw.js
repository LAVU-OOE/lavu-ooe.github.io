// sw.js - LAVU Etiketten-Druckstudio
const CACHE_VERSION = 'lavu-studio-v9';
const CACHE_NAME = `lavu-studio-${CACHE_VERSION}`;

// Static assets that are part of the app
const STATIC_ASSETS = [
    '/app/',
    '/app/index.html',
    '/assets/favicon.svg',
    '/assets/logo.png',
    '/assets/favicon-96x96.png',
    '/assets/apple-touch-icon.png',
    '/assets/web-app-manifest-192x192.png',
    '/assets/web-app-manifest-512x512.png'
];

// External JSON databases
const DYNAMIC_JSON_URLS = [
    'https://raw.githubusercontent.com/LAVU-OOE/Etiketten-Druckstudio/refs/heads/main/locations.json',
    'https://raw.githubusercontent.com/LAVU-OOE/Etiketten-Druckstudio/refs/heads/main/sortiment.json'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll([...STATIC_ASSETS, ...DYNAMIC_JSON_URLS]);
            })
            .then(() => {
                console.log('[SW] Installation complete');
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] Installation failed:', err);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => name.startsWith('lavu-studio-') && name !== CACHE_NAME)
                        .map(name => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[SW] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - intercept network requests
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // --- Strategy for JSON databases: Network-First ---
    if (DYNAMIC_JSON_URLS.some(jsonUrl => url.href === jsonUrl)) {
        event.respondWith(
            fetch(request, { cache: 'no-store' })
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, clonedResponse);
                        })
                        .catch(err => console.warn('[SW] Cache put failed:', err));
                    return response;
                })
                .catch(() => {
                    return caches.match(request)
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                console.log('[SW] Serving JSON from cache');
                                return cachedResponse;
                            }
                            return new Response(JSON.stringify({ error: 'Offline - Data not available' }), {
                                status: 503,
                                headers: { 'Content-Type': 'application/json' }
                            });
                        });
                })
        );
        return;
    }

    // --- Strategy for HTML pages (navigation requests): Network-First ---
    if (request.mode === 'navigate') {
        event.respondWith(
            fetch(request)
                .then(response => {
                    const clonedResponse = response.clone();
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, clonedResponse);
                        })
                        .catch(err => console.warn('[SW] Cache put failed:', err));
                    return response;
                })
                .catch(() => {
                    return caches.match('/app/index.html')
                        .then(cachedResponse => {
                            if (cachedResponse) {
                                console.log('[SW] Serving offline fallback page');
                                return cachedResponse;
                            }
                            return new Response(
                                '<html><body><h1>Offline</h1><p>Bitte verbinden Sie sich mit dem Internet, um die App zu nutzen.</p></body></html>',
                                { headers: { 'Content-Type': 'text/html' } }
                            );
                        });
                })
        );
        return;
    }

    // --- Strategy for all other assets: Cache-First ---
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                if (cachedResponse) {
                    // Background cache update
                    fetch(request)
                        .then(networkResponse => {
                            if (networkResponse && networkResponse.ok) {
                                caches.open(CACHE_NAME)
                                    .then(cache => {
                                        cache.put(request, networkResponse);
                                    })
                                    .catch(err => console.warn('[SW] Background cache update failed:', err));
                            }
                        })
                        .catch(() => { /* Silent fail */ });
                    return cachedResponse;
                }
                return fetch(request)
                    .then(response => {
                        if (response && response.ok) {
                            const clonedResponse = response.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => {
                                    cache.put(request, clonedResponse);
                                })
                                .catch(err => console.warn('[SW] Cache put failed:', err));
                        }
                        return response;
                    })
                    .catch(err => {
                        console.warn('[SW] Fetch failed:', err);
                        return new Response('Network error', { status: 503 });
                    });
            })
    );
});

// Handle messages from the main thread
self.addEventListener('message', event => {
    if (event.data && event.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});