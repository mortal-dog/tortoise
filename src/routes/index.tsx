import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, Sun, Undo2 } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { DayRing } from '@/components/DayRing'
import { FirstRun } from '@/components/FirstRun'
import { Banner, Button, Card } from '@/components/ui'
import { plan } from '@/data/plan'
import type { Session } from '@/data/schema'
import { adjustDose, dayTemplate, type PlanDay } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { addDays, compareDates, daysBetween, formatShort, type LocalDate } from '@/lib/dates'
import { daylight, deviceUtcOffset, formatClock, formatDuration } from '@/lib/daylight'
import { useLive } from '@/lib/live'
import {
  currentLevel,
  laddersIn,
  minutesText,
  sessionOf,
  sessionSummary,
  splitKind,
  stepsFor,
  TEST_SESSION_ID,
  testsForDay,
} from '@/lib/plan-view'
import { type LadderLog, type Suggestion, suggest } from '@/lib/progression'
import { type DayRecord, type LevelRecord, nowIso, type SettingsRecord, type Variant } from '@/lib/records'
import { getAllLogs, getLevels, getOverride, setLevel, updateDay } from '@/lib/repo'
import { type History, planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/')({
  component: Today,
})

function Today() {
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  if (!settings) return <main className="p-4" aria-busy="true" />
  if (!settings.startDate) return <FirstRun />
  if (!history) return <main className="p-4" aria-busy="true" />
  if (compareDates(t, history.week0) < 0) return <BeforeWeek0 week0={history.week0} t={t} />
  return <TodayPlan settings={settings} startDate={settings.startDate} history={history} t={t} />
}

function weekLabel(pd: PlanDay): string {
  if (pd.kind === 'week0') return 'Week 0 · learn and test'
  const extra = pd.kind === 'test' ? ' · test week' : pd.kind === 'light' ? ' · light week' : ''
  return `Block ${pd.block} · Week ${pd.week}${extra}`
}

function BeforeWeek0({ week0, t }: { week0: LocalDate; t: LocalDate }) {
  const n = daysBetween(t, week0)
  const morning = sessionOf(plan.week.mon.morning)
  return (
    <main className="mx-auto max-w-xl space-y-4 px-4 pt-4 pb-28">
      <h1 className="text-2xl font-semibold text-primary">Tortoise</h1>
      <Card>
        <p className="text-lg font-semibold" data-testid="days-left">
          Week 0 begins on {formatShort(week0)}, in {n} {n === 1 ? 'day' : 'days'}.
        </p>
        <p className="mt-2 text-sm text-primary-strong">
          Days before Week 0 have no status and no streak. The morning block can be tried now.
        </p>
      </Card>
      <Card>
        <h2 className="font-semibold tracking-wide text-primary uppercase">{morning.name}</h2>
        <p className="mt-1 text-sm">{sessionSummary(morning, 'outdoor', new Map()).join(' · ')}</p>
      </Card>
    </main>
  )
}

interface TodayProps {
  settings: SettingsRecord
  startDate: LocalDate
  history: History
  t: LocalDate
}

function TodayPlan({ settings, startDate, history, t }: TodayProps) {
  const pd = planDayOf(startDate, t)
  const override = useLive(() => getOverride(pd.monday), [pd.monday])
  const levels = useLive(getLevels, []) ?? new Map<string, LevelRecord>()
  const logs = useLive(getAllLogs, [])
  const tmpl = dayTemplate(pd, plan.week, override?.swaps ?? [])
  const day = history.days.get(t)
  const [dismissed, setDismissed] = useState<string[]>([])
  const [variantChoice, setVariantChoice] = useState<Variant | null>(null)
  if (!tmpl) return null

  const morning = sessionOf(tmpl.morning)
  const main = tmpl.testDay ? null : sessionOf(tmpl.main)
  const split = tmpl.split ? sessionOf(tmpl.split) : null
  const morningDone = !!day?.morning?.doneAt
  const mainDone = !!day?.main?.doneAt
  const splitDone = !!day?.split?.doneAt
  const done = (morningDone ? 1 : 0) + (mainDone ? 1 : 0)
  const folded = !!day?.folded
  const variant: Variant =
    day?.main?.variant ?? variantChoice ?? (settings.runDefault === 'indoor' ? 'indoor' : 'outdoor')

  const yesterday = addDays(t, -1)
  const yesterdayMissed =
    compareDates(yesterday, history.week0) >= 0 && history.statusOf(yesterday) === 'missed'

  const suggestion = levelSuggestion([morning, ...(main ? [main] : [])], levels, logs ?? [], t, pd, dismissed)

  const markMain = (sessionId: string, v?: Variant) =>
    updateDay(t, (d) => {
      const next: DayRecord = {
        ...d,
        main: { doneAt: nowIso(), sessionId, asPlanned: true, ...(v ? { variant: v } : {}) },
      }
      // On Sunday the split work is inside the Light session, so finishing it records the split as well.
      if (!tmpl.split && !tmpl.testDay) next.split = { doneAt: nowIso(), kind: 'long' }
      return next
    })

  return (
    <main className="mx-auto max-w-xl space-y-3 px-4 pt-4 pb-28">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-primary-strong" data-testid="today-label">
            {formatShort(t)} · {weekLabel(pd)}
          </p>
          <p className="mt-1 text-lg font-semibold">
            <span aria-hidden>🐢 </span>Tortoise streak <span data-testid="streak">{history.streak}</span>{' '}
            {history.streak === 1 ? 'day' : 'days'}
          </p>
          <DaylightStrip settings={settings} t={t} />
        </div>
        <DayRing done={done} />
      </header>

      {pd.kind === 'week0' && !tmpl.testDay && (
        <Banner tone="sky">Week 0: learn the movements at half volume, every ladder at level 1.</Banner>
      )}
      {pd.isLight && !pd.isTestWeek && (
        <Banner tone="sky">Light week: 2 sets, runs 30% shorter, half the intervals.</Banner>
      )}
      {pd.isTestWeek && !tmpl.testDay && pd.kind !== 'week0' && (
        <Banner tone="sky">Test week: the Tortoise Test this weekend.</Banner>
      )}
      {tmpl.testDay && <Banner tone="sky">Test weekend: the Tortoise Test, Day {tmpl.testDay}.</Banner>}

      {yesterdayMissed && (
        <Banner tone="brick">
          <p className="font-semibold">Yesterday has nothing logged.</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              to="/day/$date"
              params={{ date: yesterday }}
              className="inline-flex min-h-11 items-center rounded-xl border border-primary px-4 text-sm font-semibold text-primary"
            >
              Log yesterday
            </Link>
            <Button
              variant="quiet"
              onClick={() => void updateDay(yesterday, (d) => ({ ...d, paused: 'sick' }))}
            >
              It was a sick day
            </Button>
          </div>
        </Banner>
      )}

      {suggestion && (
        <Banner tone="primary">
          <p className="font-semibold">
            {suggestion.kind === 'up'
              ? `Ready for ${suggestion.to.name}?`
              : suggestion.kind === 'down'
                ? `Two hard sessions in a row: step back to ${suggestion.to.name}?`
                : `Two weeks off: one level down for a week, to ${suggestion.to.name}?`}
          </p>
          <div className="mt-2 flex gap-2">
            <Button onClick={() => void setLevel(suggestion.ladderId, suggestion.to.level, t)}>
              {suggestion.kind === 'up' ? 'Move up' : 'Step back'}
            </Button>
            <Button variant="quiet" onClick={() => setDismissed((x) => [...x, suggestion.ladderId])}>
              Not yet
            </Button>
          </div>
        </Banner>
      )}

      <PlanCard
        testId="card-morning"
        title={morning.name}
        minutes={minutesText(morning.minutes)}
        lines={[sessionSummary(morning, variant, levels, pd).join(' · ')]}
        done={morningDone}
        onDone={() => void updateDay(t, (d) => ({ ...d, morning: { doneAt: nowIso() } }))}
        onUndo={() => void updateDay(t, (d) => ({ ...d, morning: null }))}
      />

      {!(folded && !mainDone) &&
        (tmpl.testDay ? (
          <PlanCard
            testId="card-main"
            title={`Tortoise Test · Day ${tmpl.testDay}`}
            minutes={tmpl.testDay === 1 ? 'outdoors' : 'indoors'}
            lines={[
              testsForDay(tmpl.testDay)
                .map((x) => x.name)
                .join(' · '),
            ]}
            done={mainDone}
            onDone={() => void markMain(TEST_SESSION_ID[tmpl.testDay as 1 | 2])}
            onUndo={() => void updateDay(t, (d) => ({ ...d, main: null }))}
          />
        ) : (
          main && (
            <PlanCard
              testId="card-main"
              title={main.name}
              minutes={minutesText(sessionMinutes(main, pd, variant))}
              lines={[sessionSummary(main, variant, levels, pd).join(' · ')]}
              done={mainDone}
              onDone={() => void markMain(main.id, main.hasVariants ? variant : undefined)}
              onUndo={() =>
                void updateDay(t, (d) => ({ ...d, main: null, ...(tmpl.split ? {} : { split: null }) }))
              }
            >
              {main.hasVariants && !mainDone && <VariantSwitch value={variant} onChange={setVariantChoice} />}
            </PlanCard>
          )
        ))}

      {split && !(folded && !splitDone) && (
        <PlanCard
          testId="card-split"
          title={split.name}
          minutes={minutesText(split.minutes)}
          lines={[sessionSummary(split, variant, levels, pd).join(' · ')]}
          done={splitDone}
          onDone={() =>
            void updateDay(t, (d) => ({ ...d, split: { doneAt: nowIso(), kind: splitKind(split.id) } }))
          }
          onUndo={() => void updateDay(t, (d) => ({ ...d, split: null }))}
        />
      )}

      <HabitsCard day={day} t={t} />

      {folded && (!mainDone || (split && !splitDone)) ? (
        <Card>
          <p>Shell day: the open cards are folded.</p>
          <Button
            variant="quiet"
            className="mt-2"
            onClick={() => void updateDay(t, (d) => ({ ...d, folded: false }))}
          >
            Unfold the cards
          </Button>
        </Card>
      ) : (
        !mainDone && (
          <Card className="flex items-center justify-between gap-3">
            <span className="text-sm">Short on time?</span>
            <Button variant="quiet" onClick={() => void updateDay(t, (d) => ({ ...d, folded: true }))}>
              Make it a Shell day
            </Button>
          </Card>
        )
      )}

      <p className="pt-1 text-center">
        <Link to="/day/$date" params={{ date: t }} className="text-sm font-semibold text-primary underline">
          Details, sick or injured
        </Link>
      </p>
    </main>
  )
}

function sessionMinutes(session: Session, pd: PlanDay, variant: Variant): { min: number; max: number } {
  // The week's changes shorten runs; the card shows the shortened total.
  const steps = stepsFor(session, variant, pd)
  let delta = { min: 0, max: 0 }
  for (const s of steps) {
    if (!s.minutes) continue
    const adj = adjustDose(s, session, pd, plan.blockRules).minutes
    if (adj) delta = { min: delta.min + adj.min - s.minutes.min, max: delta.max + adj.max - s.minutes.max }
  }
  return {
    min: Math.round(session.minutes.min + delta.min),
    max: Math.round(session.minutes.max + delta.max),
  }
}

function DaylightStrip({ settings, t }: { settings: SettingsRecord; t: LocalDate }) {
  const loc = settings.location
  if (!loc) return null
  const d = daylight(t, loc.lat, loc.lon, deviceUtcOffset(t))
  const text =
    d.sunrise === null || d.sunset === null
      ? d.dayMinutes > 0
        ? 'The sun does not set today'
        : 'The sun does not rise today'
      : `${formatClock(d.sunrise)} – ${formatClock(d.sunset)} · ${formatDuration(d.dayMinutes)} of day`
  return (
    <p className="mt-1 flex items-center gap-1.5 text-sm text-sky" data-testid="daylight">
      <Sun aria-hidden className="size-4" />
      {text}
    </p>
  )
}

interface PlanCardProps {
  testId: string
  title: string
  minutes: string
  lines: string[]
  done: boolean
  onDone: () => void
  onUndo: () => void
  children?: ReactNode
}

function PlanCard({ testId, title, minutes, lines, done, onDone, onUndo, children }: PlanCardProps) {
  return (
    <Card data-testid={testId} className={cn(done && 'border-primary')}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-semibold tracking-wide text-primary uppercase">{title}</h2>
        <span className="flex shrink-0 items-center gap-1 text-sm">
          {minutes}
          {done && <Check aria-label="done" className="size-5 text-primary" strokeWidth={3} />}
        </span>
      </div>
      {lines.map((l) => (
        <p key={l} className="mt-1 text-sm">
          {l}
        </p>
      ))}
      {children}
      <div className="mt-3 flex justify-end gap-2">
        {done ? (
          <Button variant="quiet" onClick={onUndo} aria-label={`Undo ${title}`}>
            <Undo2 aria-hidden className="size-4" /> Undo
          </Button>
        ) : (
          <Button onClick={onDone} aria-label={`Done as planned: ${title}`}>
            Done as planned
          </Button>
        )}
      </div>
    </Card>
  )
}

function VariantSwitch({ value, onChange }: { value: Variant; onChange: (v: Variant) => void }) {
  return (
    <fieldset className="mt-3 flex rounded-xl border border-line p-1" aria-label="Where">
      {(['outdoor', 'indoor'] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'min-h-10 flex-1 rounded-lg text-sm font-semibold',
            value === v
              ? v === 'outdoor'
                ? 'bg-sky text-on-primary'
                : 'bg-primary text-on-primary'
              : 'text-text',
          )}
        >
          {v === 'outdoor' ? 'Outdoor ☀' : 'Indoor'}
        </button>
      ))}
    </fieldset>
  )
}

function HabitsCard({ day, t }: { day: DayRecord | undefined; t: LocalDate }) {
  const habits = day?.habits ?? {}
  const save = (patch: NonNullable<DayRecord['habits']>) =>
    void updateDay(t, (d) => ({ ...d, habits: { ...d.habits, ...patch } }))
  const num = (s: string) => (s.trim() === '' ? undefined : Math.max(0, Math.round(Number(s))))
  return (
    <Card data-testid="card-habits">
      <h2 className="font-semibold tracking-wide text-primary uppercase">Habits</h2>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="text-sm">
          Steps
          <input
            inputMode="numeric"
            defaultValue={habits.steps ?? ''}
            key={`steps-${t}-${habits.steps ?? ''}`}
            onBlur={(e) => save({ steps: num(e.target.value) })}
            className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-background px-3 text-text"
          />
        </label>
        <label className="text-sm">
          Outdoors (min)
          <input
            inputMode="numeric"
            defaultValue={habits.outdoorMin ?? ''}
            key={`out-${t}-${habits.outdoorMin ?? ''}`}
            onBlur={(e) => save({ outdoorMin: num(e.target.value) })}
            className="mt-1 block min-h-11 w-full rounded-xl border border-line bg-background px-3 text-text"
          />
        </label>
      </div>
      <div className="mt-3 flex items-center gap-2 text-sm">
        <span>Snacks</span>
        {[1, 2, 3].map((n) => {
          const on = (habits.snacks ?? 0) >= n
          return (
            <button
              key={n}
              type="button"
              aria-label={`${n} exercise ${n === 1 ? 'snack' : 'snacks'}`}
              aria-pressed={on}
              onClick={() => save({ snacks: habits.snacks === n ? n - 1 : n })}
              className="flex size-11 items-center justify-center"
            >
              <span className={cn('size-5 rounded-full border-2 border-shell', on && 'bg-shell')} />
            </button>
          )
        })}
      </div>
    </Card>
  )
}

function levelSuggestion(
  sessions: Session[],
  levels: ReadonlyMap<string, LevelRecord>,
  logs: ReadonlyArray<{
    ladderId?: string
    date: string
    level?: number
    sets: LadderLog['sets']
    feedback?: LadderLog['feedback']
  }>,
  t: LocalDate,
  pd: PlanDay,
  dismissed: string[],
): (Suggestion & { ladderId: string }) | null {
  if (pd.kind === 'week0') return null
  for (const ladder of laddersIn(sessions)) {
    if (dismissed.includes(ladder.id)) continue
    const mine: LadderLog[] = logs
      .filter((l) => l.ladderId === ladder.id && l.level !== undefined)
      .map((l) => ({
        date: l.date,
        level: l.level as number,
        sets: l.sets,
        ...(l.feedback ? { feedback: l.feedback } : {}),
      }))
    if (mine.length === 0) continue
    const s = suggest(ladder, currentLevel(ladder, levels, pd).level, mine, t)
    if (s) return { ...s, ladderId: ladder.id }
  }
  return null
}
