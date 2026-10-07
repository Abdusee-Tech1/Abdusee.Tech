/**
 * ABDUSEE TIPS — service-worker.js
 * PWA Service Worker with Cache-First + Network-Fallback strategy
 * Author: Abdusalam Ahmed Kasim
 * Version: 2.0.0
 */

'use strict';

/* ─── CACHE CONFIG ─────────────────────────────────────────── */
const CACHE_VERSION = 'v2.0.0';
const CACHE_STATIC  = `abdusee-static-${CACHE_VERSION}`;
const CACHE_DYNAMIC = `abdusee-dynamic-${CACHE_VERSION}`;
const CACHE_IMAGES  = `abdusee-images-${CACHE_VERSION}`;

/** Core assets to pre-cache on install */
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/manifest.json',
  '/offline.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
];

/** Legal pages to pre-cache */
const LEGAL_PAGES = [
  '/privacy.html',
  '/terms.html',
  '/cookies.html',
  '/disclaimer.html',
  '/affiliate.html',
];

const ALL_PRECACHE = [...STATIC_ASSETS, ...LEGAL_PAGES];

/* ─── MAX CACHE SIZES ──────────────────────────────────────── */
const MAX_DYNAMIC_ITEMS = 50;
const MAX_IMAGE_ITEMS   = 30;

/* ═══════════════════════════════════════════════════════════
   INSTALL — pre-cache critical assets
═══════════════════════════════════════════════════════════ */
self.addEventListener('install', event => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_STATIC)
      .then(cache => {
        // Cache what we can; ignore failures for optional assets
        return Promise.allSettled(
          ALL_PRECACHE.map(url =>
            cache.add(url).catch(err =>
              console.warn(`[SW] Failed to cache ${url}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('[SW] Install complete');
        return self.skipWaiting(); // activate immediately
      })
  );
});

/* ═══════════════════════════════════════════════════════════
   ACTIVATE — clean up old caches
═══════════════════════════════════════════════════════════ */
self.addEventListener('activate', event => {
  console.log('[SW] Activating…');
  const currentCaches = [CACHE_STATIC, CACHE_DYNAMIC, CACHE_IMAGES];

  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => !currentCaches.includes(key))
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => {
        console.log('[SW] Activated — controlling all clients');
        return self.clients.claim();
      })
  );
});

/* ═══════════════════════════════════════════════════════════
   FETCH — routing strategies
═══════════════════════════════════════════════════════════ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // Route to appropriate strategy
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirstWithLimit(request, CACHE_IMAGES, MAX_IMAGE_ITEMS));
  } else if (isGoogleFont(url)) {
    event.respondWith(cacheFirst(request, CACHE_STATIC));
  } else if (isNavigationRequest(request)) {
    event.respondWith(networkFirstWithOfflineFallback(request));
  } else {
    event.respondWith(networkFirstWithCache(request, CACHE_DYNAMIC, MAX_DYNAMIC_ITEMS));
  }
});

/* ═══════════════════════════════════════════════════════════
   STRATEGIES
═══════════════════════════════════════════════════════════ */

/**
 * Cache First — serve from cache, fall back to network
 * Best for: CSS, JS, fonts (rarely change)
 */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return offlineFallback(request);
  }
}

/**
 * Cache First with item limit
 * Best for: images
 */
async function cacheFirstWithLimit(request, cacheName, maxItems) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await trimCache(cache, maxItems - 1);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 404 });
  }
}

/**
 * Network First with cache fallback
 * Best for: dynamic content, API calls
 */
async function networkFirstWithCache(request, cacheName, maxItems) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await trimCache(cache, maxItems - 1);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    return cached || offlineFallback(request);
  }
}

/**
 * Network First with offline HTML fallback for navigation
 * Best for: page navigations
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_DYNAMIC);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return offline page for navigation requests
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) return offlinePage;

    // Last resort: return the index
    return caches.match('/index.html');
  }
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════ */
function isStaticAsset(url) {
  return (
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.json') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    STATIC_ASSETS.includes(url.pathname)
  );
}

function isImageRequest(request) {
  return request.destination === 'image';
}

function isGoogleFont(url) {
  return (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  );
}

function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

async function trimCache(cache, maxItems) {
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
  }
}

function offlineFallback(request) {
  if (request.destination === 'image') {
    return new Response(
      `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <rect width="200" height="200" fill="#1e293b"/>
        <text x="50%" y="50%" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="14">Offline</text>
      </svg>`,
      { headers: { 'Content-Type': 'image/svg+xml' } }
    );
  }
  return caches.match('/offline.html').then(r => r || new Response('Offline', { status: 503 }));
}

/* ═══════════════════════════════════════════════════════════
   BACKGROUND SYNC (for form submissions while offline)
═══════════════════════════════════════════════════════════ */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-contact-form') {
    event.waitUntil(syncContactForms());
  }
  if (event.tag === 'sync-newsletter') {
    event.waitUntil(syncNewsletter());
  }
});

async function syncContactForms() {
  try {
    const pending = await getPendingFromIDB('pending-contacts');
    for (const data of pending) {
      // In production: POST to your API endpoint
      console.log('[SW] Background sync: contact form', data);
    }
  } catch (err) {
    console.warn('[SW] Background sync failed:', err);
  }
}

async function syncNewsletter() {
  try {
    const pending = await getPendingFromIDB('pending-newsletter');
    for (const data of pending) {
      console.log('[SW] Background sync: newsletter', data);
    }
  } catch (err) {
    console.warn('[SW] Background sync failed:', err);
  }
}

// Placeholder: in production, use real IndexedDB helpers
function getPendingFromIDB(store) {
  return Promise.resolve([]);
}

/* ═══════════════════════════════════════════════════════════
   PUSH NOTIFICATIONS (optional — for future use)
═══════════════════════════════════════════════════════════ */
self.addEventListener('push', event => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: 'Abdusee Tips', body: event.data.text() }; }

  const options = {
    body: data.body || 'New content available!',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-96.png',
    tag: 'abdusee-tips-notif',
    renotify: true,
    data: { url: data.url || '/' },
    actions: [
      { action: 'view', title: 'View Now' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Abdusee Tips', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        const existing = clientList.find(c => c.url === url && 'focus' in c);
        return existing ? existing.focus() : clients.openWindow(url);
      })
  );
});

console.log('[SW] Service worker loaded — Abdusee Tips v2.0.0');
