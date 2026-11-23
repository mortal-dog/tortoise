// Keeps the screen on while the app is open (design §2, D-050). Safari releases the lock when the app goes to the
// background, so it is asked for again when the app returns. Where the API is missing or refuses, the player shows a
// notice instead. The root layout holds the lock and shares its state through WakeLockContext.
import { createContext, useEffect, useState } from 'react'

export type WakeState = 'on' | 'unsupported' | 'refused' | 'off'

export const WakeLockContext = createContext<WakeState>('off')

export function useWakeLock(active: boolean): WakeState {
  const [state, setState] = useState<WakeState>('off')
  useEffect(() => {
    if (!active) return
    const wl = (navigator as Navigator & { wakeLock?: WakeLock }).wakeLock
    if (!wl) {
      setState('unsupported')
      return
    }
    let sentinel: WakeLockSentinel | null = null
    let cancelled = false
    const request = async () => {
      try {
        sentinel = await wl.request('screen')
        if (cancelled) void sentinel.release()
        else setState('on')
      } catch {
        if (!cancelled) setState('refused')
      }
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') void request()
    }
    void request()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisible)
      void sentinel?.release().catch(() => undefined)
      setState('off')
    }
  }, [active])
  return state
}
