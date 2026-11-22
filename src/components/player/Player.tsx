// The session player (design §3.2): full screen, one unit at a time, feedback after each exercise, and a summary that
// saves the logs and marks the card done.
import { Link, useNavigate } from '@tanstack/react-router'
import { Lock, Volume2, VolumeX, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Banner, Button, Card } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LocalDate } from '@/lib/dates'
import { clockText, coachingText, type Unit } from '@/lib/player'
import type { Variant } from '@/lib/records'
import { type PlayedSession, type Slot, savePlayedSession } from '@/lib/repo'
import { canSpeak, setSpokenCues, speak, spokenCuesOn, unlockAudio } from '@/lib/sound'
import { useWakeLock } from '@/lib/wake-lock'
import { PocketLock } from './PocketLock'
import { type UnitResult, UnitRunner } from './runners'

type Feedback = 'easy' | 'right' | 'hard'

interface Done {
  unit: Unit
  result: UnitResult
  feedback: Array<Feedback | undefined>
}

export interface PlayerProps {
  date: LocalDate
  slot: Slot
  sessionId: string
  title: string
  units: Unit[]
  variant?: Variant
  splitKind?: PlayedSession['splitKind']
  /** Runs and long sessions ask for the distance. */
  asksDistance: boolean
}

const FEEDBACK: Array<{ value: Feedback; label: string }> = [
  { value: 'easy', label: 'Too easy' },
  { value: 'right', label: 'Right' },
  { value: 'hard', label: 'Too hard' },
]

export function Player(props: PlayerProps) {
  const { units, title } = props
  const navigate = useNavigate()
  const [startedAt, setStartedAt] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const [done, setDone] = useState<Done[]>([])
  const [pending, setPending] = useState<Done | null>(null)
  const [locked, setLocked] = useState(false)
  const [spoken, setSpoken] = useState(() => spokenCuesOn())
  const finished = startedAt !== null && index >= units.length && !pending
  const wake = useWakeLock(startedAt !== null && !finished)
  const unit = units[index]

  // Spoken coaching (Phase 9): with spoken cues on, each step is announced with its target and key cue.
  useEffect(() => {
    if (spoken && startedAt !== null && unit && !pending) speak(coachingText(unit))
  }, [spoken, startedAt, unit, pending])

  const complete = (result: UnitResult) => {
    if (!unit) return
    const entry: Done = { unit, result, feedback: unit.exercises.map(() => undefined) }
    if (unit.askFeedback && result.some((s) => s.length > 0)) setPending(entry)
    else advance(entry)
  }
  const advance = (entry: Done) => {
    setDone((d) => [...d, entry])
    setPending(null)
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
              setSpoken(!spoken)
              setSpokenCues(!spoken)
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

      {(wake === 'unsupported' || wake === 'refused') && startedAt !== null && !finished && (
        <div className="mt-3">
          <Banner tone="shell">
            The screen may turn off by itself. For the session, set Auto-Lock to Never (Settings, Display
            &amp; Brightness).
          </Banner>
        </div>
      )}

      <div className="glass mt-4 flex-1 rounded-3xl border border-edge p-4">
        {startedAt === null ? (
          <Intro
            units={units}
            onStart={() => {
              unlockAudio()
              setStartedAt(Date.now())
            }}
          />
        ) : pending ? (
          <FeedbackStep entry={pending} onAnswer={(fb) => advance({ ...pending, feedback: fb })} />
        ) : finished ? (
          <Summary {...props} startedAt={startedAt} done={done} onSaved={() => void navigate({ to: '/' })} />
        ) : unit ? (
          <UnitView unit={unit} key={`${unit.id}-${index}`}>
            <UnitRunner unit={unit} spoken={spoken} onComplete={complete} />
          </UnitView>
        ) : null}
      </div>

      {startedAt !== null && !finished && !pending && (
        <div className="mt-4 flex justify-between gap-2">
          <Button variant="quiet" onClick={() => advance({ unit: unit as Unit, result: [], feedback: [] })}>
            Skip this
          </Button>
          <Button variant="quiet" onClick={() => setLocked(true)}>
            <Lock aria-hidden className="size-4" /> Pocket lock
          </Button>
        </div>
      )}
      {locked && <PocketLock onUnlock={() => setLocked(false)} />}
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
  const [showHow, setShowHow] = useState(false)
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
                : unit.part === 'playground'
                  ? 'Playground'
                  : 'Main'}
          {first?.label ? ` · ${unit.exercises.map((e) => e.label).join(' + ')}` : ''}
        </p>
        <h2 className="mt-1 font-semibold text-2xl" data-testid="unit-title">
          {unit.exercises.map((e) => e.title).join(' + ')}
        </h2>
        {unit.exercises.map((e) =>
          e.name !== e.title ? (
            <p key={e.stepId} className="text-sm text-primary-strong">
              {e.name}
            </p>
          ) : null,
        )}
        <p className="mt-1 font-semibold text-lg text-primary" data-testid="unit-target">
          {unit.target}
        </p>
        {unit.exercises.map((e) =>
          e.cue ? (
            <p key={`${e.stepId}-cue`} className="mt-1 text-sm">
              {unit.exercises.length > 1 ? `${e.title}: ` : ''}
              {e.cue}
            </p>
          ) : null,
        )}
        {first?.note && <p className="mt-1 text-sm text-primary-strong">{first.note}</p>}
        {unit.exercises.some((e) => e.how) && (
          <button
            type="button"
            onClick={() => setShowHow(!showHow)}
            className="mt-1 text-sm font-semibold text-primary underline"
            aria-expanded={showHow}
          >
            {showHow ? 'Hide how' : 'How'}
          </button>
        )}
        {showHow &&
          unit.exercises.map((e) => (
            <p key={`${e.stepId}-how`} className="mt-1 text-sm">
              {e.how}
            </p>
          ))}
      </div>
      <Card>{children}</Card>
    </div>
  )
}

function FeedbackStep({
  entry,
  onAnswer,
}: {
  entry: Done
  onAnswer: (fb: Array<Feedback | undefined>) => void
}) {
  const [answers, setAnswers] = useState<Array<Feedback | undefined>>(entry.feedback)
  const asked = entry.unit.exercises
    .map((e, i) => ({ e, i }))
    .filter(({ i }) => (entry.result[i]?.length ?? 0) > 0)
  useEffect(() => {
    if (asked.every(({ i }) => answers[i])) onAnswer(answers)
  })
  return (
    <div className="space-y-5">
      {asked.map(({ e, i }) => (
        <fieldset key={e.stepId} className="space-y-2">
          <legend className="font-semibold text-lg">How was {e.title}?</legend>
          <div className="grid grid-cols-3 gap-2">
            {FEEDBACK.map((f) => (
              <Button
                key={f.value}
                variant={answers[i] === f.value ? 'primary' : 'quiet'}
                className="min-h-14"
                onClick={() => setAnswers(answers.map((a, j) => (j === i ? f.value : a)))}
              >
                {f.label}
              </Button>
            ))}
          </div>
        </fieldset>
      ))}
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
  startedAt,
  done,
  onSaved,
}: PlayerProps & { startedAt: number; done: Done[]; onSaved: () => void }) {
  const [endedAt] = useState(() => Date.now())
  const [effort, setEffort] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [distance, setDistance] = useState('')
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
          ...(d.feedback[i] ? { feedback: d.feedback[i] } : {}),
        })
      })
    }
    const km = Number(distance.replace(',', '.'))
    await savePlayedSession({
      date,
      slot,
      sessionId,
      variant,
      splitKind,
      minutes: ms / 60_000,
      ...(effort ? { effort } : {}),
      ...(note.trim() ? { note: note.trim() } : {}),
      ...(asksDistance && km > 0 ? { distanceKm: km } : {}),
      logs,
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
      {slot === 'main' && (
        <fieldset>
          <legend className="font-semibold">Effort, 1 to 10</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <Button
                key={n}
                variant={effort === n ? 'primary' : 'quiet'}
                aria-pressed={effort === n}
                onClick={() => setEffort(n)}
              >
                {n}
              </Button>
            ))}
          </div>
        </fieldset>
      )}
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
      <label className="block">
        <span className="font-semibold">Note (optional)</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-xl border border-edge bg-field px-3 py-2 text-text"
        />
      </label>
      <Button className="min-h-14 w-full text-lg" disabled={saving} onClick={() => void save()}>
        Save
      </Button>
    </div>
  )
}
