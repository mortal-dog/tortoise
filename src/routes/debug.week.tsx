// A read-only debug screen (Phase 1): the full week drawn from the plan data, to check by hand against the plan's
// tables (docs/2-exercise-plan.md §5–§6).
import { createFileRoute } from '@tanstack/react-router'
import { exerciseById, ladderById, plan, sessionById } from '@/data/plan'
import { type Range, type Session, type Step, WEEKDAYS, type Weekday } from '@/data/schema'

export const Route = createFileRoute('/debug/week')({
  component: DebugWeek,
})

const DAY_NAMES: Record<Weekday, string> = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
}

function minutes(r: Range): string {
  return r.min === r.max ? `${r.min} min` : `${r.min}–${r.max} min`
}

function stepName(step: Step): string {
  if (step.intervalStage) return 'Interval main set (by block)'
  if (step.ladderId) return `${ladderById.get(step.ladderId)?.name ?? step.ladderId} (ladder)`
  return exerciseById.get(step.exerciseId ?? '')?.name ?? step.exerciseId ?? ''
}

function DebugWeek() {
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <h1 className="text-2xl font-semibold text-primary">The week, from the data</h1>
      <p className="mt-1 text-sm text-primary-strong">Plan version {plan.version}. Read-only.</p>
      <div className="mt-6 flex flex-col gap-6">
        {WEEKDAYS.map((day) => (
          <DayCard key={day} day={day} />
        ))}
      </div>
    </main>
  )
}

function DayCard({ day }: { day: Weekday }) {
  const d = plan.week[day]
  const parts = [d.morning, d.main, d.split].flatMap((id) => {
    const s = id ? sessionById.get(id) : undefined
    return s ? [s] : []
  })
  const total = parts.reduce((a, s) => ({ min: a.min + s.minutes.min, max: a.max + s.minutes.max }), {
    min: 0,
    max: 0,
  })
  return (
    <section className="rounded-xl border border-line bg-surface p-4" aria-labelledby={`day-${day}`}>
      <h2 id={`day-${day}`} className="text-xl font-semibold text-primary">
        {DAY_NAMES[day]}
      </h2>
      <p className="text-sm text-primary-strong">
        Planned {minutes(total)}; the week table says {minutes(d.expectedMinutes)}
      </p>
      {parts.map((s) => (
        <SessionBlock key={s.id} session={s} />
      ))}
      {d.split === null && <p className="mt-3 text-sm text-primary-strong">Split block: in the session.</p>}
    </section>
  )
}

function SessionBlock({ session }: { session: Session }) {
  return (
    <div className="mt-4 border-t border-line pt-3">
      <h3 className="font-semibold text-text">
        {session.name} <span className="font-normal text-primary-strong">· {minutes(session.minutes)}</span>
      </h3>
      <p className="text-xs text-primary-strong">
        §{session.section} · pillars{' '}
        {Object.entries(session.pillars)
          .filter(([, n]) => n > 0)
          .map(([p, n]) => `${p} ${n}`)
          .join(', ')}
      </p>
      <ol className="mt-2 flex flex-col gap-2">
        {session.steps.map((step) => (
          <li key={step.id} className="text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2">
              {step.label && <span className="font-semibold text-primary">{step.label}</span>}
              <span className="text-text">{stepName(step)}</span>
              <span className="text-primary-strong">{step.dose}</span>
              {step.part !== 'main' && <span className="text-xs text-shell">{step.part}</span>}
              {step.variant && <span className="text-xs text-sky">{step.variant}</span>}
              {step.fromBlock && <span className="text-xs text-brick">from Block {step.fromBlock}</span>}
              {step.restS !== undefined && (
                <span className="text-xs text-primary-strong">rest {step.restS} s</span>
              )}
            </div>
            {step.note && <p className="text-xs text-primary-strong">{step.note}</p>}
          </li>
        ))}
      </ol>
    </div>
  )
}
