import { useSyncExternalStore } from 'react'

// The moving backdrop (D-048): slow light behind every screen. Always on since D-053 (the Settings switch is gone),
// and never moving when the system asks for reduced motion.

const REDUCED = '(prefers-reduced-motion: reduce)'

function media(query: string): MediaQueryList | null {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query)
    : null
}

export function reducedMotion(): boolean {
  return media(REDUCED)?.matches ?? false
}

function subscribe(listener: () => void): () => void {
  const mq = media(REDUCED)
  mq?.addEventListener('change', listener)
  return () => mq?.removeEventListener('change', listener)
}

/** Whether the backdrop moves: unless the system asks for reduced motion. */
export function useMovingBackdrop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => !reducedMotion(),
    () => false,
  )
}
