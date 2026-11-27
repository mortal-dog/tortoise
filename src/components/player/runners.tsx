// The runners of the player's step kinds (design §3.2): reps with a set tracker and rest timer, timelines for holds,
// stretches and intervals, a stopwatch for holds to the maximum, and an elapsed timer for runs and walks.
import { Pause, Play, SkipForward } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui'
import { cn } from '@/lib/cn'
import {
  type Clock,
  clockText,
  elapsedMs,
  pauseClock,
  position,
  resumeClock,
  type Segment,
  startClock,
  type Unit,
} from '@/lib/player'
import { playTone, speak } from '@/lib/sound'
import { useNow } from '@/lib/use-now'

export interface SetResult {
  reps?: number
  seconds?: number
  kg?: number
}

/** What a unit hands back: the sets done for each of its exercises (one, or two for a pair). */
export type UnitResult = SetResult[][]

/** The last seconds of every countdown are ticked and, with spoken cues on, read out (D-072). */
const LAST_S = 3
const NUMBER_WORDS = ['', 'One', 'Two', 'Three']

/** One second of a countdown's end: a tick, and its number spoken. */
function countdownCue(secs: number, spoken: boolean): void {
  playTone('tick')
  if (spoken) speak(NUMBER_WORDS[secs] ?? String(secs))
}

/** "30 seconds", "1 minute", "2 minutes". */
export function durationWords(seconds: number): string {
  return seconds % 60 === 0 ? `${seconds / 60} minute${seconds === 60 ? '' : 's'}` : `${seconds} seconds`
}

/**
 * A rest between sets, spoken from start to end (D-072): "Rest, 60 seconds" when it starts, "Three, Two, One" at
 * its end, then "Go". `restLeft` is null while no rest runs.
 */
function useRestCues(restLeft: number | null, spoken: boolean, onEnd: () => void): void {
  const said = useRef(-1)
  useEffect(() => {
    if (restLeft === null) {
      said.current = -1
      return
    }
    if (restLeft <= 0) {
      playTone('start')
      if (spoken) speak('Go')
      onEnd()
      return
    }
    const secs = Math.ceil(restLeft / 1000)
    if (secs <= LAST_S && secs !== said.current) {
      said.current = secs
      countdownCue(secs, spoken)
    }
  })
}

/** Starts a rest: its clock, and the spoken start. */
function restStart(restS: number, spoken: boolean): Clock {
  if (spoken) speak(`Rest, ${durationWords(restS)}`)
  return startClock(Date.now())
}

interface RunnerProps {
  unit: Unit
  spoken: boolean
  onComplete: (result: UnitResult) => void
}

export function UnitRunner(props: RunnerProps) {
  const { unit } = props
  if (unit.kind === 'reps') return <RepsRunner {...props} />
  if (unit.kind === 'timed') return <TimedRunner {...props} />
  if (unit.segments) return <TimelineRunner {...props} segments={unit.segments} />
  return <StopwatchRunner {...props} />
}

function BigTime({ ms, label }: { ms: number; label?: string }) {
  return (
    <p
      className="timer-glow text-center font-semibold text-7xl text-primary tabular-nums"
      data-testid="timer"
      role="timer"
      aria-label={label}
    >
      {clockText(ms)}
    </p>
  )
}

/**
 * Reps: tap each set at the plan's dose (D-069: nothing to count or weigh); the rest timer starts on its own; a pair
 * alternates and rests after each pair.
 */
function RepsRunner({ unit, spoken, onComplete }: RunnerProps) {
  const [done, setDone] = useState<UnitResult>(() => unit.exercises.map(() => []))
  const [active, setActive] = useState(0)
  const [rest, setRest] = useState<Clock | null>(null)
  const now = useNow(rest !== null)
  const restLeft = rest ? unit.restS * 1000 - elapsedMs(rest, now) : 0
  const ex = unit.exercises[active] ?? unit.exercises[0]
  const setNo = Math.min(unit.sets, (done[active]?.length ?? 0) + 1)
  useRestCues(rest ? restLeft : null, spoken, () => setRest(null))

  if (!ex) return null

  const logSet = () => {
    const next = done.map((sets, i) => (i === active ? [...sets, {}] : sets))
    setDone(next)
    const finished = next.every((s) => s.length >= unit.sets)
    if (finished) {
      onComplete(next)
      return
    }
    // In a pair, go to the other exercise; after both (or for a single exercise), rest.
    const other = (active + 1) % unit.exercises.length
    const otherLeft = (next[other]?.length ?? 0) < unit.sets
    if (unit.exercises.length > 1 && other !== 0 && otherLeft) {
      setActive(other)
      return
    }
    setActive(next.findIndex((s) => s.length < unit.sets))
    if (unit.restS > 0) setRest(restStart(unit.restS, spoken))
  }

  if (rest) {
    return (
      <div className="space-y-4" data-testid="rest">
        <p className="text-center font-semibold text-sky uppercase">Rest</p>
        <BigTime ms={restLeft} label="Rest left" />
        <p className="text-center text-sm">Next: {ex.title}</p>
        <Button
          variant="quiet"
          className="w-full"
          onClick={() => {
            if (spoken) speak('Go')
            setRest(null)
          }}
        >
          <SkipForward aria-hidden className="size-4" /> Skip the rest
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {unit.exercises.length > 1 && (
        <ol className="flex gap-2" aria-label="The pair">
          {unit.exercises.map((e, i) => (
            <li
              key={e.stepId}
              className={cn(
                'flex-1 rounded-xl border px-3 py-2 text-sm',
                i === active ? 'border-primary font-semibold text-primary' : 'border-line',
              )}
            >
              {e.label ? `${e.label} · ` : ''}
              {e.title}
              <span className="block text-xs text-primary-strong">
                {done[i]?.length ?? 0}/{unit.sets} sets
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="text-center font-semibold text-primary-strong" data-testid="set-count">
        Set {setNo} of {unit.sets}
        {ex.reps
          ? ` · ${ex.reps.min === ex.reps.max ? ex.reps.max : `${ex.reps.min}–${ex.reps.max}`} reps`
          : ''}
        {unit.perSide ? ' per side' : ''}
      </p>
      <Button className="min-h-14 w-full text-lg" onClick={logSet}>
        {unit.sets > 1 ? 'Set done' : 'Done'}
      </Button>
    </div>
  )
}

/** Holds, stretches and intervals: a timeline of segments with a 3-2-1 lead-in and tones at each change. */
function TimelineRunner({ unit, spoken, onComplete, segments }: RunnerProps & { segments: Segment[] }) {
  const [clock, setClock] = useState<Clock | null>(null)
  const running = clock !== null && clock.pausedAt === null
  const now = useNow(running)
  const pos = clock ? position(segments, elapsedMs(clock, now)) : null
  const cued = useRef<{ index: number; tick: number }>({ index: -1, tick: -1 })
  const finished = useRef(false)

  useEffect(() => {
    if (!pos || !clock || clock.pausedAt !== null) return
    if (pos.done) {
      if (!finished.current) {
        finished.current = true
        playTone('done')
        if (spoken) speak('Done')
        onComplete([workSets(segments, unit)])
      }
      return
    }
    const c = cued.current
    if (pos.index !== c.index) {
      // A new segment. After the background, only the current one is cued, never a burst of old ones.
      const prev = c.index >= 0 ? segments[c.index] : undefined
      c.index = pos.index
      c.tick = -1
      if (pos.segment.kind === 'work') playTone('start')
      else if (prev?.kind === 'work') playTone('end')
      const text = cueText(pos.segment, prev)
      if (spoken && text) speak(text)
    }
    // The last seconds of every segment, read out (D-072).
    const secs = Math.ceil(pos.remainingMs / 1000)
    if (secs <= LAST_S && secs >= 1 && secs !== c.tick) {
      c.tick = secs
      countdownCue(secs, spoken)
    }
  })

  /** Jumps to the next segment: every rest, side change and lead-in can be skipped (D-072). */
  const skipSegment = () => {
    if (!clock || !pos) return
    setClock({ ...clock, startedAt: clock.startedAt - pos.remainingMs })
  }

  if (!clock || !pos) {
    return (
      <div className="space-y-4">
        <p className="text-center text-sm">{segmentsSummary(segments)}</p>
        <Button className="min-h-14 w-full text-lg" onClick={() => setClock(startClock(Date.now()))}>
          <Play aria-hidden className="size-5" /> Start
        </Button>
      </div>
    )
  }

  const works = segments.filter((s) => s.kind === 'work').length
  const workNo = segments.slice(0, pos.index + 1).filter((s) => s.kind === 'work').length
  return (
    <div className="space-y-4">
      <p
        className={cn(
          'text-center font-semibold text-2xl uppercase',
          pos.segment.kind === 'work' ? 'text-primary' : 'text-sky',
        )}
        data-testid="segment"
        aria-live="polite"
      >
        {pos.segment.label}
      </p>
      <BigTime ms={pos.remainingMs} label="Time left" />
      <p className="text-center text-sm" data-testid="segment-count">
        {unit.kind === 'interval' ? 'Round' : 'Set'} {Math.max(1, workNo)} of {works}
      </p>
      {pos.segment.kind !== 'work' && (
        <Button variant="quiet" className="w-full" onClick={skipSegment}>
          <SkipForward aria-hidden className="size-4" />
          {pos.segment.kind === 'rest' ? `Skip the ${pos.segment.label.toLowerCase()}` : 'Skip'}
        </Button>
      )}
      <div className="flex gap-2">
        <Button
          variant="quiet"
          className="flex-1"
          onClick={() => setClock(running ? pauseClock(clock, Date.now()) : resumeClock(clock, Date.now()))}
        >
          {running ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
          {running ? 'Pause' : 'Resume'}
        </Button>
        <Button
          variant="quiet"
          className="flex-1"
          onClick={() => {
            finished.current = true
            onComplete([workSets(segments, unit, pos.index, pos.segment.seconds * 1000 - pos.remainingMs)])
          }}
        >
          <SkipForward aria-hidden className="size-4" /> End here
        </Button>
      </div>
    </div>
  )
}

/**
 * What a segment's start says (D-072): "Go. Hold, 30 seconds"; after a work segment "Stop. Rest, 30 seconds" or
 * "Stop. Change sides". The lead-in says nothing: its three seconds are counted out.
 */
export function cueText(s: Segment, prev?: Segment): string {
  if (s.kind === 'ready') return ''
  const stop = prev?.kind === 'work' ? 'Stop. ' : ''
  if (s.kind === 'switch') return `${stop}${s.label}`
  return `${s.kind === 'work' ? 'Go. ' : stop}${s.label}, ${durationWords(s.seconds)}`
}

function segmentsSummary(segments: Segment[]): string {
  const work = segments.filter((s) => s.kind === 'work')
  const total = segments.reduce((n, s) => n + s.seconds, 0)
  return `${work.length} timed ${work.length === 1 ? 'part' : 'parts'} · about ${Math.max(1, Math.round(total / 60))} min`
}

/** The sets of a timeline: one per set number, its seconds the work done (both sides of a per-side hold counted once). */
function workSets(segments: Segment[], unit: Unit, stopIndex?: number, stopMs?: number): SetResult[] {
  const bySet = new Map<number, number>()
  segments.forEach((s, i) => {
    if (s.kind !== 'work') return
    if (stopIndex !== undefined && i > stopIndex) return
    const secs = stopIndex === i ? Math.round((stopMs ?? 0) / 1000) : s.seconds
    const key = s.set ?? 1
    // Per side: the set's seconds are the shorter side, so a set reads as held on both sides.
    const prev = bySet.get(key)
    bySet.set(key, prev === undefined ? secs : unit.perSide ? Math.min(prev, secs) : prev + secs)
  })
  return [...bySet.values()].filter((n) => n > 0).map((seconds) => ({ seconds }))
}

/** A hold to the maximum ("3 × max"): a stopwatch per set, then the rest timer. */
function StopwatchRunner({ unit, spoken, onComplete }: RunnerProps) {
  const [sets, setSets] = useState<SetResult[]>([])
  const [clock, setClock] = useState<Clock | null>(null)
  const [rest, setRest] = useState<Clock | null>(null)
  const now = useNow(clock !== null || rest !== null)
  const restLeft = rest ? unit.restS * 1000 - elapsedMs(rest, now) : 0
  useRestCues(rest ? restLeft : null, spoken, () => setRest(null))

  const stop = () => {
    if (!clock) return
    const next = [...sets, { seconds: Math.round(elapsedMs(clock, Date.now()) / 1000) }]
    setSets(next)
    setClock(null)
    playTone('end')
    if (next.length >= unit.sets) {
      if (spoken) speak('Done')
      onComplete([next])
    } else if (unit.restS > 0) setRest(restStart(unit.restS, spoken))
    else if (spoken) speak('Stop')
  }

  return (
    <div className="space-y-4">
      <p className="text-center font-semibold text-primary-strong" data-testid="set-count">
        Set {Math.min(unit.sets, sets.length + 1)} of {unit.sets} · as long as you can
      </p>
      {rest ? (
        <>
          <p className="text-center font-semibold text-sky uppercase">Rest</p>
          <BigTime ms={restLeft} label="Rest left" />
          <Button
            variant="quiet"
            className="w-full"
            onClick={() => {
              if (spoken) speak('Go')
              setRest(null)
            }}
          >
            <SkipForward aria-hidden className="size-4" /> Skip the rest
          </Button>
        </>
      ) : (
        <>
          <BigTime ms={clock ? elapsedMs(clock, now) : 0} label="Time held" />
          {clock ? (
            <Button className="min-h-14 w-full text-lg" onClick={stop}>
              Stop
            </Button>
          ) : (
            <Button
              className="min-h-14 w-full text-lg"
              onClick={() => {
                playTone('start')
                if (spoken) speak('Go')
                setClock(startClock(Date.now()))
              }}
            >
              <Play aria-hidden className="size-5" /> Start
            </Button>
          )}
        </>
      )}
      {sets.length > 0 && (
        <p className="text-center text-sm">Held: {sets.map((s) => `${s.seconds} s`).join(', ')}</p>
      )}
    </div>
  )
}

/** A run or walk: elapsed time, with tones when the planned minutes are reached. */
function TimedRunner({ unit, spoken, onComplete }: RunnerProps) {
  const [clock, setClock] = useState<Clock | null>(null)
  const running = clock !== null && clock.pausedAt === null
  const now = useNow(running, 500)
  const ms = clock ? elapsedMs(clock, now) : 0
  const cued = useRef({ min: false, max: false })
  const minMs = (unit.minutes?.min ?? 0) * 60_000
  const maxMs = (unit.minutes?.max ?? 0) * 60_000

  useEffect(() => {
    if (!running || !unit.minutes) return
    if (!cued.current.min && ms >= minMs) {
      cued.current.min = true
      playTone(minMs === maxMs ? 'done' : 'end')
      if (spoken) speak(minMs === maxMs ? 'Time' : `${unit.minutes.min} minutes`)
    }
    if (minMs !== maxMs && !cued.current.max && ms >= maxMs) {
      cued.current.max = true
      playTone('done')
      if (spoken) speak('Time')
    }
  })

  const finish = () => onComplete([[{ seconds: Math.round(ms / 1000) }]])

  return (
    <div className="space-y-4">
      <BigTime ms={ms} label="Elapsed" />
      {unit.minutes && (
        <p className="text-center text-sm" data-testid="timed-target">
          Planned: {unit.target}
          {ms >= minMs && clock ? ' · reached' : ''}
        </p>
      )}
      {!clock ? (
        <div className="flex gap-2">
          <Button
            className="min-h-14 flex-1 text-lg"
            onClick={() => {
              playTone('start')
              if (spoken) speak(unit.minutes ? `Go. ${unit.minutes.min} minutes` : 'Go')
              setClock(startClock(Date.now()))
            }}
          >
            <Play aria-hidden className="size-5" /> Start
          </Button>
          <Button variant="quiet" className="min-h-14" onClick={() => onComplete([[]])}>
            Skip
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="quiet"
            className="flex-1"
            onClick={() => setClock(running ? pauseClock(clock, Date.now()) : resumeClock(clock, Date.now()))}
          >
            {running ? <Pause aria-hidden className="size-4" /> : <Play aria-hidden className="size-4" />}
            {running ? 'Pause' : 'Resume'}
          </Button>
          <Button className="flex-1" onClick={finish}>
            Finish
          </Button>
        </div>
      )}
    </div>
  )
}
