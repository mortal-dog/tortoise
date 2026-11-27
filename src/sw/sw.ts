/// <reference lib="webworker" />
// The first-party service worker (D-017). The build replaces __PRECACHE__ and __VERSION__ (scripts/vite-pwa-plugin.ts).
// It precaches the whole app at install, serves it cache-first, and takes over when the page tells it to: the page
// does so by itself once the user is not in a session, then reloads (D-075).

declare const self: ServiceWorkerGlobalScope
declare const __PRECACHE__: string[]
declare const __VERSION__: string

const CACHE = `tortoise-${__VERSION__}`

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(__PRECACHE__)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k.startsWith('tortoise-') && k !== CACHE).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') void self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE)
      // Google's silent sign-in lands on this page in a hidden frame (D-055): it must be itself, never the app.
      if (request.mode === 'navigate' && url.pathname !== '/oauth-silent.html') {
        // Every route is the same single-page app.
        const shell = (await cache.match('/index.html')) ?? (await cache.match('/'))
        if (shell) return shell
        return fetch(request)
      }
      const hit = await cache.match(request, { ignoreSearch: true })
      return hit ?? fetch(request)
    })(),
  )
})

export {}
