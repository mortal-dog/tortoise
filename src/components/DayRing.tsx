/** The day ring (design §3.1): empty, shell or full, with the count shown as well as the colour (design §13). */
export function DayRing({ done, total = 2 }: { done: number; total?: number }) {
  const size = 52
  const r = 21
  const c = 2 * Math.PI * r
  const frac = Math.min(1, done / total)
  const colour = done >= total ? 'var(--primary)' : 'var(--shell)'
  return (
    <div className="relative size-13 shrink-0" role="img" aria-label={`${done} of ${total} parts done`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="6" />
        {/* The arc fills smoothly as a part is done (D-048); it is always drawn, so the change can glide. */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={colour}
          strokeWidth="6"
          strokeLinecap="round"
          className="ring-arc"
          style={{ strokeDasharray: `${c * frac} ${c}`, opacity: frac > 0 ? 1 : 0 }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-sm font-semibold"
        data-testid="day-ring"
      >
        {done}/{total}
      </span>
    </div>
  )
}
