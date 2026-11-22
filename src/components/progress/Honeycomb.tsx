// The Shell (design §3.4): the year as a honeycomb, one hexagon a day, coloured by status. Two weeks to a row, Monday
// first, so a year is 27 rows that fit a phone. Colour is never the only signal: each hexagon is a link named with its
// date and status, and the key below repeats the Week tab's marks.
import { useNavigate } from '@tanstack/react-router'
import { statusLabel } from '@/components/StatusMark'
import { addDays, compareDates, formatShort, type LocalDate, mondayOf } from '@/lib/dates'
import type { DayStatus } from '@/lib/status'

const COLS = 14
const R = 13
const HW = Math.sqrt(3) * R

const FILL: Record<DayStatus, string> = {
  full: 'fill-primary stroke-primary',
  shell: 'fill-shell stroke-shell',
  missed: 'fill-surface stroke-brick',
  paused: 'fill-sky stroke-sky',
  ahead: 'fill-surface stroke-line',
  none: 'fill-surface stroke-line',
}

function hexPath(cx: number, cy: number, r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (60 * i - 90)
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`
  })
  return `M${pts.join('L')}Z`
}

export function Honeycomb({
  year,
  statusOf,
  week0,
  today,
}: {
  year: number
  statusOf: (d: LocalDate) => DayStatus
  week0: LocalDate
  today: LocalDate
}) {
  const navigate = useNavigate()
  const first = `${year}-01-01`
  const start = mondayOf(first)
  const cells: Array<{ date: LocalDate; col: number; row: number }> = []
  for (let i = 0; ; i++) {
    const date = addDays(start, i)
    if (date > `${year}-12-31`) break
    if (date < first) continue
    cells.push({ date, col: i % COLS, row: Math.floor(i / COLS) })
  }
  const rows = (cells.at(-1)?.row ?? 0) + 1
  const width = COLS * HW + HW / 2 + 2
  const height = rows * R * 1.5 + R / 2 + 2
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" data-testid="honeycomb">
      <title>The Shell, {year}</title>
      {cells.map(({ date, col, row }) => {
        const cx = 1 + HW / 2 + col * HW + (row % 2 ? HW / 2 : 0)
        const cy = 1 + R + row * R * 1.5
        const status = statusOf(date)
        const open = compareDates(date, week0) >= 0 && compareDates(date, today) <= 0
        const label = `${formatShort(date)}: ${statusLabel(status)}`
        const hex = (
          <path
            key={`${date}-hex`}
            d={hexPath(cx, cy, R - 1.5)}
            className={`${FILL[status]} ${date === today ? 'stroke-text' : ''}`}
            strokeWidth={date === today ? 2.5 : 1.5}
            data-status={status}
          >
            <title>{label}</title>
          </path>
        )
        return open ? (
          <a
            key={date}
            href={`/day/${date}`}
            aria-label={label}
            onClick={(e) => {
              e.preventDefault()
              void navigate({ to: '/day/$date', params: { date } })
            }}
          >
            {hex}
          </a>
        ) : (
          <g key={date}>{hex}</g>
        )
      })}
    </svg>
  )
}
