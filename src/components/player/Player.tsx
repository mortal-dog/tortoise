// The session player (design §3.2): full screen, one unit at a time at the plan's fixed dose, and a summary that asks
// the check-ins that are due (D-069), saves the logs and marks the card done.
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowDown, ArrowUp, Equal, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { ExerciseLink } from '@/components/ExerciseLink'
import { Button, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LocalDate } from '@/lib/dates'
import { clockText, coachingText, type Unit } from '@/lib/player'
import { type Answer, type CheckIn, levelAfter } from '@/lib/progression'
import type { Variant } from '@/lib/records'
import { getSettings, type PlayedSession, type Slot, savePlayedSession, saveSettings } from '@/lib/repo'
import { canSpeak, setSpokenCues, speak, spokenCuesOn, unlockAudio } from '@/lib/sound'
import { type UnitResult, UnitRunner } from './runners'

interface Done {
  unit: Unit
  result: UnitResult
  /** Tapped "Skip this": the step does not count as done (D-057). */
  skipped?: boolean
}

export interface PlayerProps {
  date: LocalDate
  slot: Slot
  sessionId: string
  title: string
  units: Unit[]
  /** The ladders whose check-in is due after this session (D-069). */
  checkIns: CheckIn[]
  variant?: Variant
  splitKind?: PlayedSession['splitKind']
  /** Runs and long sessions ask for the distance. */
  asksDistance: boolean
}

export function Player(props: PlayerProps) {
  const { units, title } = props
  const navigate = useNavigate()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState<Done[]>([])
  const [spoken, setSpoken] = useState(() => spokenCuesOn())
  // The switch is a setting, synced with the other devices (D-071); the local copy shows until it is read.
  useEffect(() => {
    let alive = true
    void getSettings().then((s) => {
      if (alive && s.spokenCues !== undefined) setSpoken(s.spokenCues)
    })
    return () => {
      alive = false
    }
  }, [])
  const finished = startedAt !== null && index >= units.length
  const unit = units[index]

  // Spoken coaching (Phase 9): with spoken cues on, each step is announced with its target.
  useEffect(() => {
    if (spoken && startedAt !== null && unit) speak(coachingText(unit))
  }, [spoken, startedAt, unit])

  const complete = (result: UnitResult) => {
    if (unit) advance({ unit, result })
  }
  const advance = (entry: Done) => {
    setDone((d) => [...d, entry])
    setIndex((i) => i + 1)
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <header className="flex items-center justify-between gap-2">
        <Link
          to="/"
          aria-label="Leave the session"
          onClick={(e) => {
            if (startedAt !== null && !window.confirm('Leave the session? Nothing of it is saved.'))
              e.preventDefault()
          }}
          className="glass flex size-11 items-center justify-center rounded-xl border border-edge text-primary"
        >
          <X aria-hidden className="size-5" />
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-center font-semibold text-primary uppercase tracking-wide">
          {title}
        </h1>
        {canSpeak() ? (
          <button
            type="button"
            aria-label="Spoken cues"
            aria-pressed={spoken}
            onClick={() => {
              const next = !spoken
              setSpoken(next)
              setSpokenCues(next)
              void saveSettings({ spokenCues: next })
            }}
            className="glass flex size-11 items-center justify-center rounded-xl border border-edge text-primary"
          >
            {spoken ? <Volume2 aria-hidden className="size-5" /> : <VolumeX aria-hidden className="size-5" />}
          </button>
        ) : (
          <span className="size-11" />
        )}
      </header>

      {startedAt !== null && !finished && <Progress units={units} index={index} />}

      <div className="glass mt-4 flex-1 rounded-3xl border border-edge p-4">
        {startedAt === null ? (
          <Intro
            units={units}
            onStart={() => {
              unlockAudio()
              setStartedAt(Date.now())
            }}
          />
        ) : finished ? (
          <Summary {...props} startedAt={startedAt} done={done} onSaved={() => void navigate({ to: '/' })} />
        ) : unit ? (
          <UnitView unit={unit} key={`${unit.id}-${index}`}>
            <UnitRunner unit={unit} spoken={spoken} onComplete={complete} />
          </UnitView>
        ) : null}
      </div>

      {startedAt !== null && !finished && (
        <div className="mt-4 flex justify-start gap-2">
          <Button variant="quiet" onClick={() => advance({ unit: unit as Unit, result: [], skipped: true })}>
            Skip this
          </Button>
        </div>
      )}
    </main>
  )
}

function Progress({ units, index }: { units: Unit[]; index: number }) {
  return (
    <div className="mt-3">
      <div className="flex gap-1" aria-hidden>
        {units.map((u, i) => (
          <span
            key={u.id}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              i < index ? 'bg-primary' : i === index ? 'bg-shell' : 'bg-line',
            )}
          />
        ))}
      </div>
      <p className="mt-1 text-right text-xs" data-testid="step-count">
        Step {Math.min(index + 1, units.length)} of {units.length}
      </p>
    </div>
  )
}

function Intro({ units, onStart }: { units: Unit[]; onStart: () => void }) {
  return (
    <div className="space-y-3">
      <ol className="space-y-1">
        {units.map((u) => (
          <li key={u.id} className="flex justify-between gap-3 border-b border-line py-2 text-sm">
            <span className="font-semibold">{u.exercises.map((e) => e.title).join(' + ')}</span>
            <span className="shrink-0 text-primary-strong">{u.target}</span>
          </li>
        ))}
      </ol>
      <p className="text-sm">Sound starts with this tap. Every cue is on the screen too.</p>
      <Button className="min-h-14 w-full text-lg" onClick={onStart}>
        Start
      </Button>
    </div>
  )
}

function UnitView({ unit, children }: { unit: Unit; children: React.ReactNode }) {
  const first = unit.exercises[0]
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-primary-strong uppercase">
          {unit.part === 'warmup'
            ? 'Warm-up'
            : unit.part === 'cooldown'
              ? 'Cool-down'
              : unit.part === 'split'
                ? 'Split'
                : 'Main'}
          {first?.label ? ` · ${unit.exercises.map((e) => e.label).join(' + ')}` : ''}
        </p>
        <h2 className="mt-1 font-semibold text-2xl" data-testid="unit-title">
          {unit.exercises.map((e) => e.title).join(' + ')}
        </h2>
        {unit.exercises.map((e) => (
          <p key={e.stepId} className="text-sm">
            <ExerciseLink name={e.name} url={e.videoUrl} />
          </p>
        ))}
        <p className="mt-1 font-semibold text-lg text-primary" data-testid="unit-target">
          {unit.target}
        </p>
        {first?.note && <p className="mt-1 text-sm text-primary-strong">{first.note}</p>}
      </div>
      <Card>{children}</Card>
    </div>
  )
}

function Summary({
  date,
  slot,
  sessionId,
  variant,
  splitKind,
  asksDistance,
  checkIns,
  startedAt,
  done,
  onSaved,
}: PlayerProps & { startedAt: number; done: Done[]; onSaved: () => void }) {
  const [endedAt] = useState(() => Date.now())
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [distance, setDistance] = useState('')
  const answered = checkIns.every((c) => answers[c.ladder.id])
  const [saving, setSaving] = useState(false)
  const sets = done.reduce((n, d) => n + d.result.reduce((m, s) => m + s.length, 0), 0)
  const ms = endedAt - startedAt

  const save = async () => {
    setSaving(true)
    const logs: PlayedSession['logs'] = []
    for (const d of done) {
      if (!d.unit.logged) continue
      d.unit.exercises.forEach((e, i) => {
        const s = d.result[i] ?? []
        if (s.length === 0) return
        logs.push({
          exerciseId: e.exerciseId,
          ...(e.ladderId ? { ladderId: e.ladderId } : {}),
          ...(e.level ? { level: e.level } : {}),
          sets: s,
        })
      })
    }
    // A step counts as done when one of its units was finished, not skipped (a step can span several units).
    const steps = [
      ...new Set(done.filter((d) => !d.skipped).flatMap((d) => d.unit.exercises.map((e) => e.stepId))),
    ]
    const km = Number(distance.replace(',', '.'))
    await savePlayedSession({
      date,
      slot,
      sessionId,
      variant,
      splitKind,
      minutes: ms / 60_000,
      ...(asksDistance && km > 0 ? { distanceKm: km } : {}),
      steps,
      logs,
      checkIns: checkIns.map((c) => {
        const answer = answers[c.ladder.id] ?? 'keep'
        return { ladderId: c.ladder.id, level: levelAfter(c, answer), eased: answer === 'easier' }
      }),
    })
    onSaved()
  }

  return (
    <div className="space-y-4" data-testid="summary">
      <h2 className="font-semibold text-2xl text-primary">Well done</h2>
      <dl className="grid grid-cols-2 gap-3">
        <Card>
          <dt className="text-sm text-primary-strong">Time</dt>
          <dd className="font-semibold text-2xl tabular-nums" data-testid="summary-time">
            {clockText(ms)}
          </dd>
        </Card>
        <Card>
          <dt className="text-sm text-primary-strong">Sets</dt>
          <dd className="font-semibold text-2xl tabular-nums" data-testid="summary-sets">
            {sets}
          </dd>
        </Card>
      </dl>
      {checkIns.map((c) => (
        <CheckInCard
          key={c.ladder.id}
          check={c}
          value={answers[c.ladder.id]}
          onChange={(a) => setAnswers({ ...answers, [c.ladder.id]: a })}
        />
      ))}
      {asksDistance && (
        <label className="block">
          <span className="font-semibold">Distance in km (optional)</span>
          <input
            inputMode="decimal"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="mt-1 min-h-11 w-full rounded-xl border border-edge bg-field px-3 text-text"
          />
        </label>
      )}
      <Button className="min-h-14 w-full text-lg" disabled={saving || !answered} onClick={() => void save()}>
        Save
      </Button>
    </div>
  )
}

/** The level's name with its code: "Floor push-up (L3)". */
function levelText(code: string, name: string): string {
  return `${name} (${/^\d/.test(code) ? `L${code}` : code})`
}

/**
 * One check-in (D-069): "one level harder, keep, or one level easier?" for a ladder whose turn has come. After two
 * weeks or more without the ladder, "easier" comes first.
 */
function CheckInCard({
  check,
  value,
  onChange,
}: {
  check: CheckIn
  value: Answer | undefined
  onChange: (a: Answer) => void
}) {
  const options: Array<{ answer: Answer; label: string; detail?: string; icon: typeof ArrowUp }> = [
    ...(check.harder
      ? [
          {
            answer: 'harder' as const,
            label: 'Harder',
            detail: levelText(check.harder.code, check.harder.name),
            icon: ArrowUp,
          },
        ]
      : []),
    { answer: 'keep', label: 'Keep', detail: levelText(check.current.code, check.current.name), icon: Equal },
    ...(check.easier
      ? [
          {
            answer: 'easier' as const,
            label: 'Easier',
            detail: levelText(check.easier.code, check.easier.name),
            icon: ArrowDown,
          },
        ]
      : []),
  ]
  if (check.afterTimeOff) options.reverse()
  return (
    <fieldset
      className="glass rounded-2xl border border-edge p-4"
      data-testid={`check-in-${check.ladder.id}`}
    >
      <legend className="sr-only">{check.ladder.name}: harder, keep or easier?</legend>
      <p className="font-semibold text-primary">{check.ladder.name}</p>
      <p className="mt-0.5 text-sm">
        {check.afterTimeOff
          ? 'Back after two weeks or more: start one level easier?'
          : 'Time to check in. How did it feel lately?'}
      </p>
      <div className="mt-3 grid gap-2">
        {options.map((o) => (
          <button
            key={o.answer}
            type="button"
            aria-pressed={value === o.answer}
            onClick={() => onChange(o.answer)}
            className={cn(
              'flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left transition-transform active:scale-[0.98]',
              value === o.answer
                ? 'border-primary bg-primary text-on-primary'
                : 'border-edge bg-field text-text',
            )}
          >
            <o.icon aria-hidden className="size-5 shrink-0" />
            <span className="min-w-0">
              <span className="block font-semibold">{o.label}</span>
              {o.detail && <span className="block text-sm">{o.detail}</span>}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  )
}
