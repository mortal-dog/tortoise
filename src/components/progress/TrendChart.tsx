// A small single-series trend chart (design §3.4): a 2-px line with markers, an optional dashed aim line labelled in
// text ink, recessive axes, a tap-to-read value, and the numbers as a table for screen readers and checking. One
// series per chart, so no legend: the title names it. Dates are spaced by time, so a gap of years reads as one.
import { useId, useState } from 'react'
import { dayNumber, formatShort, type LocalDate } from '@/lib/dates'

export interface ChartPoint {
  date: LocalDate
  value: number
}

const W = 320
const H = 132
const PAD = { left: 34, right: 12, top: 14, bottom: 22 }

function fmt(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export function TrendChart({
  title,
  unit,
  points,
  aim,
  step = false,
  valueLabel = (v: number) => `${fmt(v)} ${unit}`,
  testId,
}: {
  title: string
  unit: string
  points: ChartPoint[]
  aim?: number
  /** A step chart (levels): the value holds until the next point. */
  step?: boolean
  valueLabel?: (v: number) => string
  testId?: string
}) {
  const [picked, setPicked] = useState<number | null>(null)
  const id = useId()
  if (points.length === 0) {
    return (
      <figure className="glass rounded-2xl border border-edge p-4" data-testid={testId}>
        <figcaption className="font-semibold">{title}</figcaption>
        <p className="mt-1 text-sm">No result yet.</p>
      </figure>
    )
  }
  const xs = points.map((p) => dayNumber(p.date))
  const ys = points.map((p) => p.value)
  const x0 = Math.min(...xs)
  const x1 = Math.max(...xs)
  const lo = Math.min(...ys, aim ?? Number.POSITIVE_INFINITY)
  const hi = Math.max(...ys, aim ?? Number.NEGATIVE_INFINITY)
  const span = hi - lo || Math.max(1, Math.abs(hi) * 0.2)
  // Whole-number axis ends once the values are 10 or more, so the labels read as numbers people measure.
  const whole = step || Math.max(Math.abs(lo), Math.abs(hi)) >= 10
  const yMin = whole ? Math.floor(step ? lo : lo - span * 0.1) : lo - span * 0.1
  const yMax = whole ? Math.ceil(step ? hi : hi + span * 0.1) : hi + span * 0.1
  const sx = (x: number) =>
    x1 === x0
      ? (PAD.left + W - PAD.right) / 2
      : PAD.left + ((x - x0) / (x1 - x0)) * (W - PAD.left - PAD.right)
  const sy = (y: number) =>
    yMax === yMin
      ? (PAD.top + H - PAD.bottom) / 2
      : PAD.top + (1 - (y - yMin) / (yMax - yMin)) * (H - PAD.top - PAD.bottom)

  let d = ''
  points.forEach((p, i) => {
    const x = sx(xs[i] as number)
    const y = sy(p.value)
    if (i === 0) d = `M${x},${y}`
    else if (step) d += `H${x}V${y}`
    else d += `L${x},${y}`
  })
  const showMarkers = points.length <= 40
  const last = points.at(-1) as ChartPoint
  const sel = picked !== null ? points[picked] : undefined

  const pick = (clientX: number, rect: DOMRect) => {
    const vx = ((clientX - rect.left) / rect.width) * W
    let best = 0
    let dist = Number.POSITIVE_INFINITY
    xs.forEach((x, i) => {
      const dd = Math.abs(sx(x) - vx)
      if (dd < dist) {
        dist = dd
        best = i
      }
    })
    setPicked(best)
  }

  return (
    <figure className="glass rounded-2xl border border-edge p-4" data-testid={testId}>
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="font-semibold">{title}</span>
        <span className="shrink-0 text-sm tabular-nums" aria-live="polite">
          {sel ? `${formatShort(sel.date)}: ${valueLabel(sel.value)}` : `Latest: ${valueLabel(last.value)}`}
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 w-full touch-pan-y"
        role="img"
        aria-describedby={`${id}-desc`}
        onPointerDown={(e) => pick(e.clientX, e.currentTarget.getBoundingClientRect())}
        onPointerMove={(e) => e.buttons > 0 && pick(e.clientX, e.currentTarget.getBoundingClientRect())}
      >
        <title>{title}</title>
        <desc id={`${id}-desc`}>
          {title}: {points.length} {points.length === 1 ? 'result' : 'results'}, latest{' '}
          {valueLabel(last.value)}
          {aim !== undefined ? `, aim ${valueLabel(aim)}` : ''}
        </desc>
        <line
          x1={PAD.left}
          x2={W - PAD.right}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          className="stroke-line"
          strokeWidth={1}
        />
        <text x={PAD.left - 4} y={sy(yMax) + 4} textAnchor="end" className="fill-text text-[10px]">
          {fmt(yMax)}
        </text>
        <text x={PAD.left - 4} y={sy(yMin) + 4} textAnchor="end" className="fill-text text-[10px]">
          {fmt(yMin)}
        </text>
        <text x={PAD.left} y={H - 6} className="fill-text text-[10px]">
          {formatShort(points[0]?.date ?? last.date)}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} textAnchor="end" className="fill-text text-[10px]">
            {formatShort(last.date)}
          </text>
        )}
        {aim !== undefined && (
          <g data-testid="aim-line">
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={sy(aim)}
              y2={sy(aim)}
              className="stroke-shell"
              strokeWidth={1.5}
              strokeDasharray="5 4"
            />
            <text x={W - PAD.right} y={sy(aim) - 4} textAnchor="end" className="fill-text text-[10px]">
              Aim {valueLabel(aim)}
            </text>
          </g>
        )}
        {points.length > 1 && (
          <path
            d={step ? `${d}H${W - PAD.right}` : d}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinejoin="round"
          />
        )}
        {(showMarkers ? points : [last]).map((p) => {
          const i = points.indexOf(p)
          return (
            <circle
              key={`${p.date}-${i}`}
              cx={sx(xs[i] as number)}
              cy={sy(p.value)}
              r={4}
              className="fill-primary stroke-surface"
              strokeWidth={2}
            />
          )
        })}
        {sel && picked !== null && (
          <circle
            cx={sx(xs[picked] as number)}
            cy={sy(sel.value)}
            r={6}
            fill="none"
            className="stroke-text"
            strokeWidth={2}
          />
        )}
      </svg>
      <details className="mt-1 text-sm">
        <summary className="cursor-pointer font-semibold text-primary">The numbers</summary>
        <table className="mt-1 w-full text-left">
          <thead>
            <tr>
              <th className="font-semibold">Date</th>
              <th className="font-semibold">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={`${p.date}-${p.value}`}>
                <td>
                  {formatShort(p.date)} {p.date.slice(0, 4)}
                </td>
                <td className="tabular-nums">{valueLabel(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}
