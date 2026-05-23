/* Jolof Stream - Service Worker (Phase 3) */

const CACHE_NAME = "jolofstream-v1"
const OFFLINE_URL = "/offline"

const STATIC_ASSETS = [
  "/",
  "/services",
  "/formations",
  "/portfolio",
  "/a-propos",
  "/contact",
  "/offline",
  "/logos/Logo_JolofStream_couleur.png",
  "/logos/Logo_JolofStream_blancJaune.png",
  "/logos/Logo_JolofStream_blanc.png",
]

const API_CACHE_PREFIXES = ["/api/catalogue", "/api/portfolio"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("[sw] install cache partiel", err)
      })
    )
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

function isApiCacheable(pathname) {
  return API_CACHE_PREFIXES.some((p) => pathname.startsWith(p))
}

function isStaticAsset(pathname) {
  if (pathname.startsWith("/_next/static")) return true
  if (pathname.startsWith("/logos")) return true
  return /\.(png|jpg|jpeg|webp|svg|gif|ico|woff|woff2|css|js)$/.test(pathname)
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }

  if (url.origin !== self.location.origin) return

  // Exclusions : admin, auth, notifications, tracking marketing
  if (
    url.pathname.startsWith("/admin") ||
    url.pathname.startsWith("/api/auth") ||
    url.pathname.startsWith("/api/notifications") ||
    url.pathname.startsWith("/api/marketing/track") ||
    url.pathname.startsWith("/api/marketing/unsubscribe") ||
    url.pathname.startsWith("/api/storage")
  ) {
    return
  }

  // API publique : Stale While Revalidate
  if (isApiCacheable(url.pathname)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((response) => {
            if (response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || fetchPromise
      })
    )
    return
  }

  // Assets statiques : Cache First
  if (isStaticAsset(url.pathname)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request)
            .then((response) => {
              if (response.ok) {
                const clone = response.clone()
                caches.open(CACHE_NAME).then((c) => c.put(request, clone))
              }
              return response
            })
            .catch(() => caches.match(OFFLINE_URL))
      )
    )
    return
  }

  // Pages HTML : Network First avec fallback offline
  const accept = request.headers.get("accept") || ""
  if (accept.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((c) => c.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match(OFFLINE_URL)
          if (offline) return offline
          return new Response("Hors ligne", { status: 503 })
        })
    )
  }
})

// Reception des notifications push
self.addEventListener("push", (event) => {
  if (!event.data) return

  let data = {}
  try {
    data = event.data.json()
  } catch {
    data = { title: "Jolof Stream", body: event.data.text() }
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/logos/Jolof_logo_icon_FRouge.png",
    badge: data.badge || "/logos/Jolof_logo_icon_FRouge.png",
    data: { url: data.url || "/admin" },
    requireInteraction: false,
    silent: false,
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "Jolof Stream", options)
  )
})

// Clic sur une notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || "/admin"

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes("/admin") && "focus" in client) {
            client.navigate(url).catch(() => undefined)
            return client.focus()
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url)
        }
      })
  )
})
