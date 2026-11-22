import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `ms` while active and at once when the app returns to the foreground. Timers read
 * it against their start timestamps, so a phone that slept in a pocket shows the right time on return (design §2).
 */
export function useNow(active: boolean, ms = 250): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return
    const tick = () => setNow(Date.now())
    tick()
    const id = window.setInterval(tick, ms)
    document.addEventListener('visibilitychange', tick)
    return () => {
      window.clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [active, ms])
  return now
}
