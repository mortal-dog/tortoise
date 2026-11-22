// Registers the service worker in production and tells the app when a new version is waiting (the update banner).

type Listener = (waiting: boolean) => void

let waitingWorker: ServiceWorker | null = null
const listeners = new Set<Listener>()

function notify() {
  for (const l of listeners) l(waitingWorker !== null)
}

export function onUpdateReady(listener: Listener): () => void {
  listeners.add(listener)
  listener(waitingWorker !== null)
  return () => listeners.delete(listener)
}

/** Activates the waiting version; the page reloads once it takes control. */
export function applyUpdate(): void {
  waitingWorker?.postMessage({ type: 'SKIP_WAITING' })
}

function track(reg: ServiceWorkerRegistration) {
  // A waiting worker only means an update when a version already controls the page.
  if (reg.waiting && navigator.serviceWorker.controller) {
    waitingWorker = reg.waiting
    notify()
  }
  reg.addEventListener('updatefound', () => {
    const installing = reg.installing
    if (!installing) return
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) {
        waitingWorker = installing
        notify()
      }
    })
  })
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading || !waitingWorker) return
    reloading = true
    window.location.reload()
  })
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        track(reg)
        // Look for a new version when the app comes back to the foreground.
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') void reg.update()
        })
      })
      .catch(() => {
        // Offline support is missing, but the app still works online.
      })
  })
}
