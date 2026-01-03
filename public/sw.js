/**
 * Capsula Service Worker
 * Handles caching for offline support and notification scheduling
 */

const CACHE_NAME = 'capsula-v1';
const STATIC_ASSETS = [
  '/capsula/',
  '/capsula/index.html',
  '/capsula/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version and update in background
        event.waitUntil(
          fetch(event.request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
          }).catch(() => {})
        );
        return cachedResponse;
      }

      // No cache, fetch from network
      return fetch(event.request).then((response) => {
        // Cache successful responses
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/capsula/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || 'Time to take your medication',
    icon: '/capsula/icons/icon-192x192.png',
    badge: '/capsula/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'dose-reminder',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'take', title: '✓ Принял' },
      { action: 'snooze', title: '⏰ +15 мин' },
      { action: 'skip', title: '✗ Пропустить' },
    ],
    data: {
      url: data.url || '/capsula/today',
      doseId: data.doseId,
      itemId: data.itemId,
    },
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Capsula', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'take') {
    // Mark dose as taken
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'DOSE_ACTION',
            action: 'taken',
            doseId: data.doseId,
            itemId: data.itemId,
          });
        }
        if (clientList.length === 0) {
          clients.openWindow(data.url + '?action=taken&doseId=' + data.doseId);
        }
      })
    );
  } else if (action === 'snooze') {
    // Snooze for 15 minutes
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'DOSE_ACTION',
            action: 'snooze',
            doseId: data.doseId,
            itemId: data.itemId,
            snoozeMinutes: 15,
          });
        }
      })
    );
  } else if (action === 'skip') {
    // Skip dose
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          client.postMessage({
            type: 'DOSE_ACTION',
            action: 'skipped',
            doseId: data.doseId,
            itemId: data.itemId,
          });
        }
      })
    );
  } else {
    // Default: open the app
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes('/capsula') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(data.url || '/capsula/today');
      })
    );
  }
});

// Message handler for scheduling notifications
self.addEventListener('message', (event) => {
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { delay, title, body, doseId, itemId } = event.data;
    
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: '/capsula/icons/icon-192x192.png',
        badge: '/capsula/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        tag: `dose-${doseId}`,
        renotify: true,
        requireInteraction: true,
        actions: [
          { action: 'take', title: '✓ Принял' },
          { action: 'snooze', title: '⏰ +15 мин' },
          { action: 'skip', title: '✗ Пропустить' },
        ],
        data: {
          url: '/capsula/today',
          doseId,
          itemId,
        },
      });
    }, delay);
  }
});

