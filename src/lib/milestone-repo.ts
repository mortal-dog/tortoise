// Awarding milestones (plan §11) and reading the metrics they need. Since D-067 there is no test: the metrics come
// from the day records and the ladder levels.
import { plan } from '@/data/plan'
import { addDays, type LocalDate } from './dates'
import { notifyChange } from './live'
import { computeMetrics, type Metrics, newlyEarned } from './milestones'
import { kindOf } from './plan-view'
import { type MilestoneRecord, nowIso } from './records'
import { getAllDays, getDb, getLevels, getSettings } from './repo'
import { dayStatus, longestDoneRun, longestStreak } from './status'

export async function getEarnedMilestones(): Promise<Map<string, MilestoneRecord>> {
  const list = await (await getDb()).getAll('milestones')
  return new Map(list.map((m) => [m.id, m]))
}

/** The milestone metrics from the whole history (plan §11), or null before the plan starts. */
export async function loadMetrics(today: LocalDate): Promise<Metrics | null> {
  const settings = await getSettings()
  if (!settings.startDate) return null
  const week0 = addDays(settings.startDate, -7)
  const [days, levels] = await Promise.all([getAllDays(), getLevels()])
  const statusOf = (d: LocalDate) => dayStatus(days.get(d), d, today, week0)
  return computeMetrics({
    days: [...days.values()],
    levels: [...levels.values()],
    longestStreak: longestStreak(statusOf, today, week0),
    longestDoneRun: longestDoneRun(statusOf, today, week0),
    kindOf,
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
