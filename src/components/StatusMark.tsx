import { cn } from '@/lib/cn'
import type { DayStatus } from '@/lib/status'

const LABEL: Record<DayStatus, string> = {
  full: 'Full day',
  shell: 'Shell day',
  missed: 'Missed',
  ahead: 'Ahead',
  none: 'Before Week 0',
}

export function statusLabel(s: DayStatus): string {
  return LABEL[s]
}

/** Each status has its own shape as well as its colour (D-033): filled, half filled, outline, faint. */
export function StatusMark({
  status,
  size = 18,
  className,
}: {
  status: DayStatus
  size?: number
  className?: string
}) {
  const r = size / 2 - 1.5
  const c = size / 2
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={LABEL[status]}
      className={cn('shrink-0', className)}
      data-status={status}
    >
      {status === 'full' && (
        <circle cx={c} cy={c} r={r} fill="var(--primary)" stroke="var(--primary)" strokeWidth="2" />
      )}
      {status === 'shell' && (
        <>
          <circle cx={c} cy={c} r={r} fill="none" stroke="var(--shell)" strokeWidth="2" />
          <path d={`M ${c} ${c - r} A ${r} ${r} 0 0 0 ${c} ${c + r} Z`} fill="var(--shell)" />
        </>
      )}
      {status === 'missed' && (
        <circle cx={c} cy={c} r={r} fill="none" stroke="var(--brick)" strokeWidth="2" />
      )}
      {status === 'ahead' && (
        <circle cx={c} cy={c} r={r} fill="var(--line)" stroke="var(--line)" strokeWidth="2" />
      )}
    </svg>
  )
}
