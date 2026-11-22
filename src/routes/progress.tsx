import { createFileRoute, Link } from '@tanstack/react-router'
import { ClipboardList } from 'lucide-react'
import { useEffect } from 'react'
import { Honeycomb } from '@/components/progress/Honeycomb'
import { type ChartPoint, TrendChart } from '@/components/progress/TrendChart'
import { StatusMark, statusLabel } from '@/components/StatusMark'
import { Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import type { Metric, Milestone } from '@/data/schema'
import { dayTemplate } from '@/lib/calendar'
import { addDays, compareDates, daysBetween, formatShort, type LocalDate, mondayOf } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { type Metrics, progress } from '@/lib/milestones'
import { addPillars, donePillars, PILLARS, plannedPillars, zeroPillars } from '@/lib/pillars'
import { sessionsById } from '@/lib/plan-view'
import type { LevelRecord, TestRecord } from '@/lib/records'
import { getLevels } from '@/lib/repo'
import { longestStreak } from '@/lib/status'
import { awardMilestones, getEarnedMilestones, getTests, loadMetrics } from '@/lib/test-repo'
import { aimValue, SERIES, seriesPoints } from '@/lib/test-results'
import { type History, planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/progress')({
  component: Progress,
})

function Progress() {
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const tests = useLive(getTests, [])
  const levels = useLive(getLevels, [])
  const earned = useLive(getEarnedMilestones, [])
  const metrics = useLive(() => loadMetrics(t), [t])

  // Streak and count milestones are earned by daily use, so they are checked whenever Progress opens.
  useEffect(() => {
    if (settings?.startDate) void awardMilestones(t)
  }, [settings?.startDate, t])

  if (!settings || !history || !tests || !levels || !earned) {
    return (
      <Screen title="Progress">
        <p>{settings && !settings.startDate ? 'Start the plan on the Today tab first.' : null}</p>
      </Screen>
    )
  }
  const longest = longestStreak(history.statusOf, t, history.week0)
  const testKey = tests.length && daysBetween(tests.at(-1)?.date ?? t, t) < 7 ? (tests.at(-1)?.date ?? t) : t
  const heightCm =
    tests.findLast((x) => x.results.heightCm !== undefined)?.results.heightCm ?? settings.profile.heightCm

  return (
    <Screen
      title="Progress"
      action={
        <Link
          to="/test/$date"
          params={{ date: testKey }}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary px-3 text-sm font-semibold text-primary"
        >
          <ClipboardList aria-hidden className="size-4" /> Tortoise Test
        </Link>
      }
    >
      <Numbers history={history} longest={longest} t={t} startDate={settings.startDate as LocalDate} />

      <Section title={`The Shell, ${t.slice(0, 4)}`}>
        <Card>
          <Honeycomb
            year={Number(t.slice(0, 4))}
            statusOf={history.statusOf}
            week0={history.week0}
            today={t}
          />
          <ul className="mt-3 grid grid-cols-2 gap-1 text-sm" aria-label="Status key">
            {(['full', 'shell', 'missed', 'paused'] as const).map((s) => (
              <li key={s} className="flex items-center gap-2">
                <StatusMark status={s} />
                {statusLabel(s)}
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title="Milestones">
        <Milestones earned={earned} metrics={metrics ?? {}} tests={tests} />
      </Section>

      <Section title="At 99">
        <At99 metrics={metrics ?? {}} />
      </Section>

      <Section title="Test trends">
        <ChartList
          empty="No result yet"
          items={SERIES.map((s) => ({
            key: s.id,
            title: s.name,
            points: seriesPoints(s, tests),
            render: (points: ChartPoint[]) => (
              <TrendChart
                key={s.id}
                testId={`trend-${s.id}`}
                title={s.name}
                unit={s.unit}
                points={points}
                aim={aimValue(
                  plan.tests.find((x) => x.id === s.testId),
                  heightCm,
                )}
              />
            ),
          }))}
        />
      </Section>

      <Section title="Levels over time">
        <ChartList
          empty="No level set yet"
          items={plan.ladders.map((ladder) => ({
            key: ladder.id,
            title: ladder.name,
            points: levelPoints(levels.get(ladder.id), t),
            render: (points: ChartPoint[]) => (
              <TrendChart
                key={ladder.id}
                title={ladder.name}
                unit="level"
                step
                points={points}
                valueLabel={(v) => ladder.levels.find((l) => l.level === v)?.code ?? String(v)}
              />
            ),
          }))}
        />
      </Section>
    </Screen>
  )
}

/** The charts with data, then the names of those still empty in one line, so the page stays short. */
function ChartList({
  items,
  empty,
}: {
  items: Array<{
    key: string
    title: string
    points: ChartPoint[]
    render: (p: ChartPoint[]) => React.ReactNode
  }>
  empty: string
}) {
  const withData = items.filter((i) => i.points.length > 0)
  const without = items.filter((i) => i.points.length === 0)
  return (
    <div className="space-y-3">
      {withData.map((i) => i.render(i.points))}
      {without.length > 0 && (
        <p className="text-sm">
          {empty}: {without.map((i) => i.title).join(', ')}.
        </p>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-semibold text-lg text-primary">{title}</h2>
      {children}
    </section>
  )
}

/** A ladder's level history as steps up to today; level 1 from its first record when nothing else is known. */
function levelPoints(rec: LevelRecord | undefined, t: LocalDate): ChartPoint[] {
  if (!rec) return []
  const pts = rec.history.map((h) => ({ date: h.date, value: h.level }))
  if (pts.length && (pts.at(-1)?.date ?? t) < t) pts.push({ date: t, value: rec.level })
  return pts
}

function Numbers({
  history,
  longest,
  t,
  startDate,
}: {
  history: History
  longest: number
  t: LocalDate
  startDate: LocalDate
}) {
  const month = t.slice(0, 7)
  let full = 0
  let shell = 0
  for (let d = `${month}-01`; compareDates(d, t) <= 0; d = addDays(d, 1)) {
    const s = history.statusOf(d)
    if (s === 'full') full++
    if (s === 'shell') shell++
  }
  const outdoor = [...history.days.values()].filter(
    (d) => d.main?.doneAt && d.main.variant === 'outdoor',
  ).length

  // Minutes per pillar this week: planned from the week's sessions, done from the day records (design §8).
  const monday = mondayOf(t)
  let planned = zeroPillars()
  let done = zeroPillars()
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i)
    const pd = planDayOf(startDate, date)
    const tmpl = dayTemplate(pd, plan.week)
    if (!tmpl) continue
    const ids = [tmpl.morning, ...(tmpl.testDay ? [] : [tmpl.main]), ...(tmpl.split ? [tmpl.split] : [])]
    for (const id of ids) {
      const s = sessionsById.get(id)
      if (s) planned = addPillars(planned, plannedPillars(s))
    }
    const rec = history.days.get(date)
    const m = sessionsById.get(tmpl.morning)
    if (rec?.morning?.doneAt && m) done = addPillars(done, donePillars(m))
    const main = rec?.main?.sessionId ? sessionsById.get(rec.main.sessionId) : undefined
    if (rec?.main?.doneAt && main) {
      done = addPillars(done, donePillars(main, rec.main.asPlanned ? undefined : rec.main.minutes))
    }
    const split = tmpl.split ? sessionsById.get(tmpl.split) : undefined
    if (rec?.split?.doneAt && split) done = addPillars(done, donePillars(split))
  }

  const tile = (label: string, value: number, tone = 'text-primary', id?: string) => (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <dt className="text-sm text-primary-strong">{label}</dt>
      <dd className={`font-semibold text-3xl ${tone}`} data-testid={id}>
        {value}
      </dd>
    </div>
  )
  return (
    <>
      <dl className="grid grid-cols-2 gap-3">
        {tile('Tortoise streak', history.streak, 'text-shell', 'progress-streak')}
        {tile('Longest streak', longest, 'text-primary', 'progress-longest')}
        {tile('Full days this month', full)}
        {tile('Shell days this month', shell, 'text-shell')}
        {tile('Outdoor sessions', outdoor, 'text-sky')}
      </dl>
      <Card className="mt-3">
        <h3 className="font-semibold">Minutes this week, against the plan</h3>
        <ul className="mt-2 space-y-2">
          {PILLARS.map((p) => {
            const share = planned[p] > 0 ? Math.min(1, done[p] / planned[p]) : 0
            return (
              <li key={p}>
                <div className="flex justify-between text-sm">
                  <span className="capitalize">{p}</span>
                  <span className="tabular-nums">
                    {Math.round(done[p])} of {Math.round(planned[p])} min
                  </span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-line" aria-hidden>
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${share * 100}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </>
  )
}

function Milestones({
  earned,
  metrics,
  tests,
}: {
  earned: ReadonlyMap<string, { earnedAt: LocalDate }>
  metrics: Metrics
  tests: TestRecord[]
}) {
  const got = plan.milestones.filter((m) => earned.has(m.id))
  const first = tests[0]
  const startOf = (m: Milestone): number | undefined => {
    if (m.direction !== 'atMost' || !first) return undefined
    if (m.metric === 'sideSplitCm') return first.results.splits?.side
    if (m.metric === 'frontSplitCm') {
      const s = first.results.splits
      return s?.frontL === undefined || s.frontR === undefined ? undefined : Math.max(s.frontL, s.frontR)
    }
    return undefined
  }
  const next = plan.milestones
    .filter((m) => !earned.has(m.id))
    .map((m) => ({ m, p: progress(m, metrics, startOf(m)) }))
    .sort((a, b) => b.p - a.p)
    .slice(0, 3)
  return (
    <div className="space-y-3">
      <Card>
        <h3 className="font-semibold">Next up</h3>
        <ul className="mt-2 space-y-2" data-testid="next-milestones">
          {next.map(({ m, p }) => (
            <li key={m.id}>
              <div className="flex justify-between text-sm">
                <span>{m.name}</span>
                <span className="tabular-nums">{Math.round(p * 100)}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-line" aria-hidden>
                <div className="h-2 rounded-full bg-shell" style={{ width: `${p * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <h3 className="font-semibold">
          Earned · {got.length} of {plan.milestones.length}
        </h3>
        {got.length === 0 ? (
          <p className="mt-1 text-sm">None yet: the first comes after a week with no day missed.</p>
        ) : (
          <ul className="mt-2 grid grid-cols-2 gap-2" data-testid="earned-milestones">
            {got.map((m) => (
              <li key={m.id} className="rounded-xl border border-shell px-3 py-2">
                <p className="font-semibold text-sm">{m.name}</p>
                <p className="text-xs">{formatShort(earned.get(m.id)?.earnedAt ?? '')}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

const METRIC_UNIT: Partial<Record<Metric, string>> = {
  wallCm: 'cm',
  sitRise: 'points',
  broadJumpCm: 'cm',
  continuousRunKm: 'km',
  oneLegClosedS: 's',
  farmerS: 's',
  deadHangS: 's',
  vo2max: 'mL/kg/min',
  handstandFreeS: 's',
  frontSplitCm: 'cm',
  sideSplitCm: 'cm',
}

function At99({ metrics }: { metrics: Metrics }) {
  return (
    <Card>
      <ul className="divide-y divide-line" data-testid="at99">
        {plan.at99.map((line) => {
          const v = metrics[line.metric]
          return (
            <li
              key={`${line.ability}-${line.metric}`}
              className="flex items-baseline justify-between gap-3 py-2"
            >
              <span>
                <span className="font-semibold">{line.ability}</span>
                <span className="block text-sm text-primary-strong">{line.line}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                {v === undefined ? '—' : `${Math.round(v * 10) / 10} ${METRIC_UNIT[line.metric] ?? ''}`}
              </span>
            </li>
          )
        })}
      </ul>
    </Card>
  )
}
