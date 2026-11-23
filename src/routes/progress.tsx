import { createFileRoute } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { BadgeDialog } from '@/components/progress/BadgeDialog'
import { BadgeMedal } from '@/components/progress/BadgeMedal'
import { Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { badges } from '@/lib/badges'
import { dayTemplate } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { addDays, compareDates, type LocalDate, mondayOf } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { awardMilestones, getEarnedMilestones, loadMetrics } from '@/lib/milestone-repo'
import { type Metrics, progress, reached } from '@/lib/milestones'
import { addPillars, donePillars, PILLARS, plannedPillars, zeroPillars } from '@/lib/pillars'
import { sessionsById } from '@/lib/plan-view'
import { longestStreak } from '@/lib/status'
import { type History, planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/progress')({
  component: Progress,
})

function Progress() {
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const earned = useLive(getEarnedMilestones, [])
  const metrics = useLive(() => loadMetrics(t), [t])

  // Streak and count milestones are earned by daily use, so they are checked whenever Progress opens.
  useEffect(() => {
    if (settings?.startDate) void awardMilestones(t)
  }, [settings?.startDate, t])

  if (!settings || !history || !earned) {
    return (
      <Screen title="Progress">
        <p>{settings && !settings.startDate ? 'Start the plan on the Today tab first.' : null}</p>
      </Screen>
    )
  }
  const longest = longestStreak(history.statusOf, t, history.week0)

  return (
    <Screen title="Progress">
      <Numbers history={history} longest={longest} t={t} startDate={settings.startDate as LocalDate} />

      <Section title="Milestones">
        <Milestones earned={earned} metrics={metrics ?? {}} />
      </Section>
    </Screen>
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

  // Minutes per pillar this week: planned from the week's sessions, done from the day records (design §8).
  const monday = mondayOf(t)
  let planned = zeroPillars()
  let done = zeroPillars()
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i)
    const pd = planDayOf(startDate, date)
    const tmpl = dayTemplate(pd, plan.week)
    if (!tmpl) continue
    const ids = [tmpl.morning, tmpl.main, ...(tmpl.split ? [tmpl.split] : [])]
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
    <div className="glass rounded-2xl border border-edge p-4">
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
}: {
  earned: ReadonlyMap<string, { earnedAt: LocalDate }>
  metrics: Metrics
}) {
  const next = plan.milestones
    .filter((m) => !earned.has(m.id) && !reached(m, metrics))
    .map((m) => ({ m, p: progress(m, metrics) }))
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
      <Badges earned={earned} metrics={metrics} />
    </div>
  )
}

/**
 * Every milestone as a badge (D-058). A tap opens the badge's card (D-066): how to earn it, or when it was earned. The
 * label under each medal is one line; the card holds the full name. No hover tooltips.
 */
function Badges({
  earned,
  metrics,
}: {
  earned: ReadonlyMap<string, { earnedAt: LocalDate }>
  metrics: Metrics
}) {
  const list = badges(plan.milestones, metrics, earned)
  const [open, setOpen] = useState<string | null>(null)
  const close = useCallback(() => setOpen(null), [])
  const shown = list.find((b) => b.milestone.id === open)
  const got = list.filter((b) => b.earned).length
  return (
    <Card>
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">Badges</h3>
        <span className="font-semibold text-primary-strong text-sm tabular-nums">
          {got} of {list.length}
        </span>
      </div>
      {(['habit', 'ability'] as const).map((group) => (
        <div key={group} className="mt-4">
          <h4 className="font-semibold text-primary-strong text-xs uppercase tracking-wide">
            {group === 'habit' ? 'Habit' : 'Ability'}
          </h4>
          <ul
            className="mt-2 grid grid-cols-3 gap-x-1 gap-y-2 sm:grid-cols-4"
            data-testid={`badges-${group}`}
          >
            {list
              .filter((b) => b.milestone.group === group)
              .map((b) => (
                <li key={b.milestone.id} className="min-w-0">
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`${b.milestone.name}, ${b.earned ? 'earned' : 'locked'}`}
                    data-earned={b.earned}
                    onClick={() => setOpen(b.milestone.id)}
                    className="flex w-full min-w-0 flex-col items-center gap-1.5 rounded-2xl px-0.5 pt-1 pb-2 text-center transition-transform duration-150 active:scale-95"
                  >
                    <BadgeMedal badge={b} size={76} />
                    <span
                      className={cn(
                        'block w-full truncate whitespace-nowrap font-semibold text-xs',
                        b.earned ? 'text-primary' : 'text-text',
                      )}
                      data-testid="badge-label"
                    >
                      {b.label}
                    </span>
                  </button>
                </li>
              ))}
          </ul>
        </div>
      ))}
      {shown && <BadgeDialog badge={shown} share={progress(shown.milestone, metrics)} onClose={close} />}
    </Card>
  )
}
