// ════════════════════════════════════════════════════════════════════════
//  sw.js — easyTenancy Workbox-backed Pro-Grade Offline Service Worker
// ════════════════════════════════════════════════════════════════════════

const WORKBOX_VERSION = '7.0.0'
const CACHE_PREFIX = 'easytenancy'
const CACHE_VERSION = 'v4.5'

// Import Workbox CDN
try {
  importScripts(`https://storage.googleapis.com/workbox-cdn/releases/${WORKBOX_VERSION}/workbox-sw.js`)
} catch (e) {
  console.warn('[SW] Workbox CDN load fallback:', e)
}

if (typeof workbox !== 'undefined' && workbox) {
  workbox.setConfig({ debug: false })

  // Force instant activation & client takeover
  workbox.core.skipWaiting()
  workbox.core.clientsClaim()

  // 1. Precache Core App Shell & Essential Static Assets
  workbox.precaching.precacheAndRoute([
    { url: '/', revision: `${CACHE_VERSION}-shell` },
    { url: '/manifest.json', revision: `${CACHE_VERSION}-manifest` },
    { url: '/favicon.png', revision: `${CACHE_VERSION}-favicon` },
    { url: '/d3.min.js', revision: `${CACHE_VERSION}-d3` },
  ])

  workbox.precaching.cleanupOutdatedCaches()

  // 2. Navigation Routes (HTML Pages) — NetworkFirst with fallbacks
  workbox.routing.registerRoute(
    ({ request }) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: `${CACHE_PREFIX}-pages-${CACHE_VERSION}`,
      networkTimeoutSeconds: 3,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  )

  // 3. Static Bundles, Scripts & Styles (Vite JS/CSS, /assets/*, /static/*) — CacheFirst
  workbox.routing.registerRoute(
    ({ request, url }) =>
      request.destination === 'script' ||
      request.destination === 'style' ||
      request.destination === 'worker' ||
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/static/'),
    new workbox.strategies.CacheFirst({
      cacheName: `${CACHE_PREFIX}-assets-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  )

  // 4. Images & Media — CacheFirst
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: `${CACHE_PREFIX}-images-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 80,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        }),
      ],
    })
  )

  // 5. Dashboard Data & API Snapshots — StaleWhileRevalidate for instant offline availability
  workbox.routing.registerRoute(
    ({ url }) => url.pathname.startsWith('/api/'),
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE_PREFIX}-api-${CACHE_VERSION}`,
      plugins: [
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        }),
      ],
    })
  )

  // 6. External Web Fonts & Static CDNs — StaleWhileRevalidate
  workbox.routing.registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE_PREFIX}-fonts-${CACHE_VERSION}`,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        }),
      ],
    })
  )

} else {
  // ── Vanilla SW Fallback (if Workbox CDN unavailable) ──
  const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`
  const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-${CACHE_VERSION}`
  const SHELL_URLS = ['/', '/manifest.json', '/favicon.png', '/d3.min.js']

  self.addEventListener('install', (e) => {
    e.waitUntil(
      caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL_URLS)).catch(() => {})
    )
    self.skipWaiting()
  })

  self.addEventListener('activate', (e) => {
    e.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((k) => !k.includes(CACHE_VERSION)).map((k) => caches.delete(k))
        )
      )
    )
    self.clients.claim()
  })

  self.addEventListener('fetch', (e) => {
    const { request } = e
    if (request.method !== 'GET') return

    if (request.mode === 'navigate') {
      e.respondWith(
        fetch(request)
          .then((res) => {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
            return res
          })
          .catch(() => caches.match(request).then((r) => r || caches.match('/')))
      )
      return
    }

    e.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, copy))
          }
          return res
        })
      })
    )
  })
}
