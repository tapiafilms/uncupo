// UnCupo Service Worker — Web Push + Offline Cache

const CACHE_NAME = 'uncupo-v2'
const OFFLINE_URL = '/offline'

// ── Install ──────────────────────────────────────────────
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ── Push ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let payload = { title: 'UnCupo', body: 'Nueva notificación', url: '/', tag: 'default' }
  try {
    payload = { ...payload, ...event.data.json() }
  } catch {
    payload.body = event.data.text()
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: payload.tag,
    data: { url: payload.url ?? '/' },
    vibrate: [200, 100, 200],
    requireInteraction: false,
    actions: [
      { action: 'open', title: 'Ver' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

// ── Notification click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const path = event.notification.data?.url ?? '/'
  // navigate() requires an absolute URL; openWindow also benefits from it
  const fullUrl = path.startsWith('http') ? path : self.location.origin + path

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.startsWith(self.location.origin))
      if (existing) {
        // postMessage lets the Next.js router handle navigation (works on iOS too)
        existing.postMessage({ type: 'SW_NAVIGATE', url: path })
        return existing.focus()
      }
      return self.clients.openWindow(fullUrl)
    })
  )
})
