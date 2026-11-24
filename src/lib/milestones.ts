// The milestone engine (plan §11): metrics computed from the history, and the milestones they reach. Since D-067 there
// is no test: ability milestones read the highest ladder level ever reached, the split blocks done and the run logs.
import type { Milestone, SessionKind } from '@/data/schema'
import type { DayRecord, LevelRecord } from './records'

/** Metric values by key: a metric's name, or `level:<ladderId>` for a ladder's highest level. */
export type Metrics = Partial<Record<string, number>>

/** The key a milestone reads in the metrics. */
export function metricKey(m: Pick<Milestone, 'metric' | 'ladderId'>): string {
  return m.metric === 'level' ? `level:${m.ladderId}` : m.metric
}

export function reached(m: Milestone, metrics: Metrics): boolean {
  const v = metrics[metricKey(m)]
  if (v === undefined || Number.isNaN(v)) return false
  return m.direction === 'atLeast' ? v >= m.threshold : v <= m.threshold
}

/** Milestones reached now that were not earned before. An earned milestone stays earned. */
export function newlyEarned(
  milestones: readonly Milestone[],
  metrics: Metrics,
  earned: ReadonlySet<string>,
): Milestone[] {
  return milestones.filter((m) => !earned.has(m.id) && reached(m, metrics))
}

/** Progress toward a milestone, 0 to 1, for the "next up" bars and the badge card. */
export function progress(m: Milestone, metrics: Metrics): number {
  const v = metrics[metricKey(m)]
  if (v === undefined) return 0
  // A ladder starts at level 1, so level 1 is no progress yet: L2 of a goal at L4 is a third of the way.
  if (m.metric === 'level') return m.threshold <= 1 ? 1 : clamp01((v - 1) / (m.threshold - 1))
  if (m.direction === 'atLeast')
    return m.threshold <= 0 ? (v >= m.threshold ? 1 : 0) : clamp01(v / m.threshold)
  return v <= m.threshold ? 1 : 0
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

export interface HistoryInput {
  days: readonly DayRecord[]
  levels: readonly LevelRecord[]
  /** The longest tortoise streak and the longest run with none missed (status.ts). */
  longestStreak: number
  longestDoneRun: number
  /** The session kind of a session id, from the plan data. */
  kindOf: (sessionId: string) => SessionKind | undefined
}

function max(values: Array<number | undefined>): number | undefined {
  const xs = values.filter((v): v is number => v !== undefined && !Number.isNaN(v))
  return xs.length ? Math.max(...xs) : undefined
}

export function computeMetrics(h: HistoryInput): Metrics {
  const runDays = h.days.filter((d) => {
    const k = d.main ? h.kindOf(d.main.sessionId) : undefined
    return k === 'run' || k === 'long'
  })
  const out: Metrics = {
    streak: h.longestStreak,
    noMissDays: h.longestDoneRun,
    outdoorSessions: h.days.filter((d) => d.main?.doneAt && d.main.variant === 'outdoor').length,
    runKm: runDays.reduce((s, d) => s + (d.main?.distanceKm ?? 0), 0),
    continuousRunKm: max(runDays.map((d) => d.main?.distanceKm)),
    longRunMin: max(
      h.days.filter((d) => d.main && h.kindOf(d.main.sessionId) === 'long').map((d) => d.main?.minutes),
    ),
    splitBlocks: h.days.filter((d) => d.split?.doneAt).length,
  }
  // A level once reached counts, even after the ladder was moved back down.
  for (const l of h.levels) out[`level:${l.ladderId}`] = max([l.level, ...l.history.map((x) => x.level)])
  return out
}
