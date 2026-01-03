/**
 * Capsula Service Worker
 * Provides offline caching and background sync
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `capsula-${CACHE_VERSION}`;
const OFFLINE_URL = '/capsula/offline.html';

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  '/capsula/',
  '/capsula/index.html',
  '/capsula/offline.html',
  '/capsula/manifest.json',
  '/capsula/icon-192.png',
  '/capsula/icon-512.png',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching essential assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('capsula-') && name !== CACHE_NAME)
            .map((name) => {
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

// Fetch event - cache-first strategy for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip external requests
  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  // Network-first for HTML (always try to get fresh content)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful responses
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache or offline page
          return caches.match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL));
        })
    );
    return;
  }

  // Cache-first for assets (JS, CSS, images)
  event.respondWith(
    caches.match(request)
      .then((cached) => {
        if (cached) {
          // Return cached version and update cache in background
          fetch(request)
            .then((response) => {
              if (response.ok) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, response));
              }
            })
            .catch(() => {});
          return cached;
        }

        // Not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          });
      })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (!event.data) {
    console.log('[SW] No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'Capsula';
    const options = {
      body: data.body || 'Время принять лекарство',
      icon: '/capsula/icon-192.png',
      badge: '/capsula/icon-192.png',
      tag: data.tag || 'dose-reminder',
      requireInteraction: true,
      data: data.data || {},
      actions: [
        { action: 'take', title: '✓ Принял' },
        { action: 'snooze', title: '⏰ Через 15 мин' },
        { action: 'skip', title: '✗ Пропустить' },
      ],
      vibrate: [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Error parsing push data:', error);
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  const data = event.notification.data;

  // Handle different actions
  if (event.action === 'take') {
    // Mark dose as taken via postMessage
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'DOSE_ACTION',
              action: 'taken',
              data: data,
            });
          });
        })
    );
  } else if (event.action === 'snooze') {
    // Snooze for 15 minutes
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'DOSE_ACTION',
              action: 'snooze',
              minutes: 15,
              data: data,
            });
          });
        })
    );
  } else if (event.action === 'skip') {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((windowClients) => {
          windowClients.forEach((client) => {
            client.postMessage({
              type: 'DOSE_ACTION',
              action: 'skip',
              data: data,
            });
          });
        })
    );
  } else {
    // Default: open app
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((windowClients) => {
          // Focus existing window if available
          for (const client of windowClients) {
            if (client.url.includes('/capsula') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new window
          if (clients.openWindow) {
            return clients.openWindow('/capsula/today');
          }
        })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'dose-sync') {
    event.waitUntil(syncDoseActions());
  }
});

async function syncDoseActions() {
  // This would sync any offline dose actions when connection is restored
  console.log('[SW] Syncing dose actions...');
}

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
