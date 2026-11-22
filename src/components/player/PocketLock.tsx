import { Lock } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

/** How long the unlock button must be held, in milliseconds. */
export const UNLOCK_HOLD_MS = 1500

/**
 * The pocket lock (design §3.2): a layer over the player that swallows every touch until a long press, so the phone can
 * ride in a pocket on an outdoor run. The timers keep running underneath and stay readable through it.
 */
export function PocketLock({ onUnlock }: { onUnlock: () => void }) {
  const [holding, setHolding] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current)
    },
    [],
  )

  const start = () => {
    setHolding(true)
    timer.current = window.setTimeout(onUnlock, UNLOCK_HOLD_MS)
  }
  const cancel = () => {
    setHolding(false)
    if (timer.current !== null) window.clearTimeout(timer.current)
    timer.current = null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex touch-none select-none flex-col [-webkit-touch-callout:none] items-center justify-end bg-background/70 pb-[calc(env(safe-area-inset-bottom)+2rem)]"
      data-testid="pocket-lock"
    >
      <button
        type="button"
        aria-label="Hold to unlock"
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        className="relative flex size-28 select-none flex-col items-center justify-center rounded-full border-4 border-primary bg-surface text-primary"
      >
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-primary/25"
          style={{
            transform: holding ? 'scale(1)' : 'scale(0)',
            transition: holding ? `transform ${UNLOCK_HOLD_MS}ms linear` : 'none',
          }}
        />
        <Lock aria-hidden className="relative size-8" />
        <span className="relative mt-1 text-xs font-semibold">Hold to unlock</span>
      </button>
    </div>
  )
}
