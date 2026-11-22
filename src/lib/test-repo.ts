// Reading and writing Tortoise Test records, setting Week 0's starting levels, and awarding milestones.
import { plan } from '@/data/plan'
import { addDays, type LocalDate } from './dates'
import { notifyChange } from './live'
import { computeMetrics, type Metrics, newlyEarned } from './milestones'
import { kindOf, TEST_SESSION_ID } from './plan-view'
import { type MilestoneRecord, nowIso, type TestRecord } from './records'
import { getAllDays, getAllLogs, getDb, getSettings, setLevel, updateDay } from './repo'
import { dayStatus, longestDoneRun, longestStreak } from './status'
import { computeResults, type Results, startInputsOf, startingLevels } from './test-results'

export async function getTests(): Promise<TestRecord[]> {
  const list = await (await getDb()).getAll('tests')
  return list.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export async function getTest(date: LocalDate): Promise<TestRecord | undefined> {
  return (await getDb()).get('tests', date)
}

/**
 * Merges results into the test keyed by its Day 1 date and recomputes the derived values. Each card saves on its
 * own, so the wizard can be left and resumed across the two days (design §3.5).
 */
export async function saveTestResults(
  date: LocalDate,
  patch: { results?: Partial<Results>; start?: TestRecord['start'] },
): Promise<TestRecord> {
  const db = await getDb()
  const settings = await getSettings()
  const current = (await db.get('tests', date)) ?? { date, results: {}, computed: {}, updatedAt: nowIso() }
  const results = { ...current.results, ...patch.results }
  const { ageInRange: _, ...computed } = computeResults(results, settings.profile, date)
  const next: TestRecord = {
    ...current,
    date,
    results,
    ...(patch.start ? { start: patch.start } : {}),
    computed,
    updatedAt: nowIso(),
  }
  await db.put('tests', next)
  notifyChange()
  return next
}

/**
 * Finishes one day of the test: the day's main card is marked done, Week 0's results set the starting levels
 * (plan §8), and milestones are awarded. Returns the ladders whose level was set.
 */
export async function finishTestDay(
  testDate: LocalDate,
  day: 1 | 2,
  opts: { week0: boolean; today: LocalDate },
): Promise<Map<string, number>> {
  const dayDate = day === 1 ? testDate : addDays(testDate, 1)
  await updateDay(dayDate, (d) => ({
    ...d,
    main: { doneAt: nowIso(), sessionId: TEST_SESSION_ID[day], asPlanned: false },
  }))
  let set = new Map<string, number>()
  const test = await getTest(testDate)
  if (opts.week0 && test) {
    set = startingLevels(plan.startRules, plan.ladders, startInputsOf(test))
    for (const [ladderId, level] of set) await setLevel(ladderId, level, opts.today)
  }
  await awardMilestones(opts.today)
  return set
}

export async function getEarnedMilestones(): Promise<Map<string, MilestoneRecord>> {
  const list = await (await getDb()).getAll('milestones')
  return new Map(list.map((m) => [m.id, m]))
}

/** The milestone metrics from the whole history (plan §11), or null before the plan starts. */
export async function loadMetrics(today: LocalDate): Promise<Metrics | null> {
  const settings = await getSettings()
  if (!settings.startDate) return null
  const week0 = addDays(settings.startDate, -7)
  const [days, tests, logs] = await Promise.all([getAllDays(), getTests(), getAllLogs()])
  const statusOf = (d: LocalDate) => dayStatus(days.get(d), d, today, week0)
  const pull = plan.ladders.find((l) => l.id === 'pull')
  const firstPullUp = pull?.levels.find((l) => l.code === 'P4')?.level
  return computeMetrics({
    days: [...days.values()],
    tests,
    logs,
    longestStreak: longestStreak(statusOf, today, week0),
    longestDoneRun: longestDoneRun(statusOf, today, week0),
    kindOf,
    profileHeightCm: settings.profile.heightCm,
    ...(pull && firstPullUp ? { pull: { ladderId: pull.id, firstPullUpLevel: firstPullUp } } : {}),
  })
}

/** Stores every milestone newly reached, dated today. An earned milestone stays earned. */
export async function awardMilestones(today: LocalDate): Promise<string[]> {
  const [metrics, earned] = await Promise.all([loadMetrics(today), getEarnedMilestones()])
  if (!metrics) return []
  const fresh = newlyEarned(plan.milestones, metrics, new Set(earned.keys()))
  if (fresh.length === 0) return []
  const db = await getDb()
  const at = nowIso()
  for (const m of fresh) await db.put('milestones', { id: m.id, earnedAt: today, updatedAt: at })
  notifyChange()
  return fresh.map((m) => m.id)
}
