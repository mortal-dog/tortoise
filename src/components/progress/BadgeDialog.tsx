import { Check, Lock, X } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Badge } from '@/lib/badges'
import { formatShort, type LocalDate } from '@/lib/dates'
import { BadgeMedal, TIER_GLOW } from './BadgeMedal'

const TIER_NAME = { bronze: 'Bronze', gold: 'Gold', jade: 'Jade', sapphire: 'Sapphire' } as const

/**
 * A badge's card (D-066): a tap on a badge opens it, the ✕ button, a tap outside it or Escape closes it. It shows the
 * medal large, the milestone's full name, whether it is earned and when, how to earn it and, while locked, how far along
 * the way the person is. There are no hover tooltips; every detail lives here.
 */
export function BadgeDialog({
  badge,
  share,
  onClose,
}: {
  badge: Badge
  /** How far along the way, 0 to 1, when the metric has a value; shown while the badge is locked. */
  share?: number
  onClose: () => void
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    // The page behind stays put while the card is open.
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      opener?.focus()
    }
  }, [onClose])

  const glow = TIER_GLOW[badge.tier]
  const showShare = !badge.earned && share !== undefined && share > 0

  // In a portal: a glass card's backdrop filter would hold a fixed child inside the card (D-048).
  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: the dim backdrop closes on a tap; Escape and ✕ do the same
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape closes it, handled on the window
    <div
      className="badge-scrim fixed inset-0 z-50 flex items-center justify-center p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="badge-detail"
        className="badge-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-edge bg-surface text-center shadow-2xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-48"
          style={{ background: `radial-gradient(circle at 50% 38%, ${glow} 0%, transparent 68%)` }}
        />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-3 right-3 z-10 flex size-11 items-center justify-center rounded-full border border-edge bg-field text-primary transition-transform active:scale-90"
        >
          <X aria-hidden className="size-5" strokeWidth={2.5} />
        </button>

        <div className="relative px-6 pt-8 pb-6">
          <div className="flex justify-center">
            <BadgeMedal badge={badge} size={124} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
            {badge.earned ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-on-primary">
                <Check aria-hidden className="size-3.5" strokeWidth={3} />
                {badge.earnedAt ? `Earned ${formatShort(badge.earnedAt as LocalDate)}` : 'Earned'}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-edge bg-field px-2.5 py-1 text-text">
                <Lock aria-hidden className="size-3.5" strokeWidth={2.5} />
                Locked
              </span>
            )}
            <span className="rounded-full border border-edge bg-field px-2.5 py-1 text-primary-strong">
              {TIER_NAME[badge.tier]} · {badge.milestone.group === 'habit' ? 'Habit' : 'Ability'}
            </span>
          </div>

          <h3 id={titleId} className="mt-3 font-bold text-primary text-xl leading-snug">
            {badge.milestone.name}
          </h3>

          <div className="mt-4 rounded-2xl border border-edge bg-field p-4 text-left">
            <p className="font-semibold text-primary-strong text-xs uppercase tracking-wide">
              {badge.earned ? 'What it took' : 'How to earn it'}
            </p>
            <p className="mt-1 leading-relaxed">{badge.how}</p>
            {showShare && (
              <div className="mt-3" data-testid="badge-share">
                <div className="flex justify-between font-semibold text-primary-strong text-xs">
                  <span>On the way</span>
                  <span className="tabular-nums">{Math.round(share * 100)}%</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-line" aria-hidden>
                  <div className="h-2 rounded-full bg-shell" style={{ width: `${share * 100}%` }} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
