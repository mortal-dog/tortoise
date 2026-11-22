// Inputs for the Tortoise Test wizard: a number field with an optional built-in stopwatch, and a countdown stepper.
import { Minus, Play, Plus, Square } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import { type Clock, clockText, elapsedMs, startClock } from '@/lib/player'
import { playTone } from '@/lib/sound'
import { useNow } from '@/lib/use-now'

export function parseNumber(s: string): number | undefined {
  const n = Number(s.replace(',', '.'))
  return s.trim() === '' || Number.isNaN(n) ? undefined : n
}

export function NumberField({
  label,
  unit,
  value,
  onChange,
  previous,
  stopwatch,
}: {
  label: string
  unit: string
  value: string
  onChange: (v: string) => void
  previous?: number
  /** A built-in stopwatch; `capS` stops it by itself (one-leg stance at 60 s). */
  stopwatch?: { capS?: number; minutes?: boolean }
}) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <div className="mt-1 flex items-center gap-2">
        <input
          id={id}
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-11 w-28 rounded-xl border border-line bg-background px-3 text-text"
        />
        <span className="text-sm text-primary-strong">{unit}</span>
        {stopwatch && (
          <Stopwatch
            {...stopwatch}
            onStop={(s) => onChange(String(stopwatch.minutes ? Math.round((s / 60) * 100) / 100 : s))}
          />
        )}
      </div>
      {previous !== undefined && (
        <p className="mt-1 text-xs text-primary-strong">
          Last time: {previous} {unit}
        </p>
      )}
    </div>
  )
}

function Stopwatch({
  capS,
  onStop,
}: {
  capS?: number
  minutes?: boolean
  onStop: (seconds: number) => void
}) {
  const [clock, setClock] = useState<Clock | null>(null)
  const now = useNow(clock !== null)
  const ms = clock ? elapsedMs(clock, now) : 0
  const stop = (at: number) => {
    if (!clock) return
    const s = Math.round(elapsedMs(clock, at) / 1000)
    setClock(null)
    playTone('end')
    onStop(capS ? Math.min(capS, s) : s)
  }
  useEffect(() => {
    if (clock && capS && ms >= capS * 1000) stop(clock.startedAt + capS * 1000)
  })
  return clock ? (
    <button
      type="button"
      onClick={() => stop(Date.now())}
      className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-semibold text-on-primary tabular-nums"
    >
      <Square aria-hidden className="size-4" /> {clockText(ms)} · Stop
    </button>
  ) : (
    <button
      type="button"
      onClick={() => {
        playTone('start')
        setClock(startClock(Date.now()))
      }}
      className="ml-auto inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-3 text-sm font-semibold text-primary"
    >
      <Play aria-hidden className="size-4" /> Stopwatch
    </button>
  )
}

/** A 15-second pulse count: the countdown, then the beats counted are multiplied by 4. */
export function PulseCount({ onBpm }: { onBpm: (bpm: number) => void }) {
  const [clock, setClock] = useState<Clock | null>(null)
  const [beats, setBeats] = useState('')
  const now = useNow(clock !== null)
  const left = clock ? 15_000 - elapsedMs(clock, now) : 0
  const over = clock !== null && left <= 0
  useEffect(() => {
    if (over) playTone('done')
  }, [over])
  return (
    <div className="rounded-xl border border-line p-3">
      <p className="text-sm font-semibold">Count the pulse for 15 s</p>
      {!clock ? (
        <button
          type="button"
          onClick={() => {
            playTone('start')
            setClock(startClock(Date.now()))
          }}
          className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-3 text-sm font-semibold text-primary"
        >
          <Play aria-hidden className="size-4" /> Start 15 s
        </button>
      ) : !over ? (
        <p className="mt-2 font-semibold text-4xl text-primary tabular-nums">{clockText(left)}</p>
      ) : (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm">
            Beats counted{' '}
            <input
              inputMode="numeric"
              value={beats}
              onChange={(e) => {
                setBeats(e.target.value)
                const n = parseNumber(e.target.value)
                if (n !== undefined) onBpm(n * 4)
              }}
              className="ml-1 min-h-11 w-20 rounded-xl border border-line bg-background px-3 text-text"
            />
          </label>
          <span className="text-sm">× 4</span>
        </div>
      )}
    </div>
  )
}

/** Sit-to-rise: each way starts at 5 points and loses one per support (design §3.5). Stores the supports. */
export function PointsStepper({
  label,
  supports,
  onChange,
}: {
  label: string
  supports: number
  onChange: (supports: number) => void
}) {
  const points = Math.max(0, 5 - supports)
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={`${label}: one more support`}
          onClick={() => onChange(Math.min(5, supports + 1))}
          className="flex size-11 items-center justify-center rounded-full border border-primary text-primary"
        >
          <Minus aria-hidden className="size-5" />
        </button>
        <span className="w-16 text-center font-semibold text-2xl tabular-nums">{points}</span>
        <button
          type="button"
          aria-label={`${label}: one support fewer`}
          onClick={() => onChange(Math.max(0, supports - 1))}
          className="flex size-11 items-center justify-center rounded-full border border-primary text-primary"
        >
          <Plus aria-hidden className="size-5" />
        </button>
      </div>
    </div>
  )
}
