// Registers the service worker in production and updates the app by itself (D-075): a new version downloads in the
// background and takes over, with a reload, at the first moment the user is not in a session. There is no banner.

let waitingWorker: ServiceWorker | null = null
// False while a session player is open: a reload would end the session (its timers and sets live in memory).
let idle = true

function applyIfIdle() {
  if (waitingWorker && idle) waitingWorker.postMessage({ type: 'SKIP_WAITING' })
}

/** Tells the updater whether a reload is safe now; a waiting version is applied as soon as it is. */
export function setUpdateIdle(value: boolean): void {
  idle = value
  applyIfIdle()
}

function setWaiting(worker: ServiceWorker) {
  waitingWorker = worker
  applyIfIdle()
}

function track(reg: ServiceWorkerRegistration) {
  // A waiting worker only means an update when a version already controls the page.
  if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting)
  reg.addEventListener('updatefound', () => {
    const installing = reg.installing
    if (!installing) return
    installing.addEventListener('statechange', () => {
      if (installing.state === 'installed' && navigator.serviceWorker.controller) setWaiting(installing)
    })
  })
}

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return
  let reloading = false
  // The new version controls the page only after the waiting worker was told to take over: reload onto it at once, so
  // the old page never asks the new cache for files it no longer holds.
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

/** Test seam: forget the waiting version and mark the app idle. */
export function resetUpdaterForTests(): void {
  waitingWorker = null
  idle = true
}

/** Test seam: a version finished installing while another controls the page. */
export function setWaitingForTests(worker: ServiceWorker): void {
  setWaiting(worker)
}
