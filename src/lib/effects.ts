import { useSyncExternalStore } from 'react'

// The moving backdrop (D-048): slow light and raindrops. A per-phone convenience kept in localStorage, like the
// spoken-cue switch (D-040); on by default, and never moving when the system asks for reduced motion.

const KEY = 'tortoise.movingBackdrop'
const REDUCED = '(prefers-reduced-motion: reduce)'
const listeners = new Set<() => void>()

function media(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null
}

export function movingBackdropSwitch(): boolean {
  try {
    return localStorage.getItem(KEY) !== '0'
  } catch {
    return true
  }
}

export function setMovingBackdrop(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // private mode: the switch lasts for this session only
  }
  for (const l of listeners) l()
}

export function reducedMotion(): boolean {
  return media(REDUCED)?.matches ?? false
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  const mq = media(REDUCED)
  mq?.addEventListener('change', listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    mq?.removeEventListener('change', listener)
    window.removeEventListener('storage', onStorage)
  }
}

/** Whether the backdrop moves: the switch is on and the system does not ask for reduced motion. */
export function useMovingBackdrop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => movingBackdropSwitch() && !reducedMotion(),
    () => false,
  )
}

/** The switch itself, and whether reduced motion overrides it, for Settings. */
export function useMovingBackdropSwitch(): { on: boolean; reduced: boolean } {
  const on = useSyncExternalStore(subscribe, movingBackdropSwitch, () => true)
  const reduced = useSyncExternalStore(subscribe, reducedMotion, () => false)
  return { on, reduced }
}
