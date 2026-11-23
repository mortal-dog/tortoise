// The milestone engine (plan §11): metrics computed from the history, and the milestones they reach.
import type { Metric, Milestone, SessionKind } from '@/data/schema'
import type { DayRecord, LogRecord, TestRecord } from './records'

export type Metrics = Partial<Record<Metric, number>>

export function reached(m: Milestone, metrics: Metrics): boolean {
  const v = metrics[m.metric]
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

/**
 * Progress toward a milestone, 0 to 1, for the "next up" bars. For atMost metrics (split distances) the first
 * measurement is the start line.
 */
export function progress(m: Milestone, metrics: Metrics, startValue?: number): number {
  const v = metrics[m.metric]
  if (v === undefined) return 0
  if (m.direction === 'atLeast')
    return m.threshold <= 0 ? (v >= m.threshold ? 1 : 0) : clamp01(v / m.threshold)
  if (startValue === undefined || startValue <= m.threshold) return v <= m.threshold ? 1 : 0
  return clamp01((startValue - v) / (startValue - m.threshold))
}

function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x))
}

export interface HistoryInput {
  days: readonly DayRecord[]
  tests: readonly TestRecord[]
  logs: readonly LogRecord[]
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

function min(values: Array<number | undefined>): number | undefined {
  const xs = values.filter((v): v is number => v !== undefined && !Number.isNaN(v))
  return xs.length ? Math.min(...xs) : undefined
}

function bothSides(a?: number, b?: number): number | undefined {
  return a === undefined || b === undefined ? undefined : Math.max(a, b)
}

function weakerLeg(a?: number, b?: number): number | undefined {
  return a === undefined || b === undefined ? undefined : Math.min(a, b)
}

export function computeMetrics(h: HistoryInput): Metrics {
  const tests = [...h.tests].sort((a, b) => (a.date < b.date ? -1 : 1))
  const runDays = h.days.filter((d) => {
    const k = d.main ? h.kindOf(d.main.sessionId) : undefined
    return k === 'run' || k === 'long'
  })
  const latest = tests.at(-1)
  let wallRun = 0
  let wallBest = 0
  for (const t of tests) {
    if (t.results.wallCm === undefined) continue
    wallRun = t.results.wallCm === 0 ? wallRun + 1 : 0
    wallBest = Math.max(wallBest, wallRun)
  }

  const first = tests.find((t) => t.computed.vo2max !== undefined)?.computed.vo2max
  const bestVo2 = max(tests.map((t) => t.computed.vo2max))

  return {
    streak: h.longestStreak,
    noMissDays: h.longestDoneRun,
    outdoorSessions: h.days.filter((d) => d.main?.doneAt && d.main.variant === 'outdoor').length,
    runKm: runDays.reduce((s, d) => s + (d.main?.distanceKm ?? 0), 0),
    continuousRunKm: max(runDays.map((d) => d.main?.distanceKm)),
    longRunMin: max(
      h.days.filter((d) => d.main && h.kindOf(d.main.sessionId) === 'long').map((d) => d.main?.minutes),
    ),
    pushups: max(tests.map((t) => t.results.pushups)),
    handstandWallS: max(tests.map((t) => t.results.handstand?.wallS)),
    handstandFreeS: max(tests.map((t) => t.results.handstand?.freeS)),
    frontSplitCm: min(tests.map((t) => bothSides(t.results.splits?.frontL, t.results.splits?.frontR))),
    sideSplitCm: min(tests.map((t) => t.results.splits?.side)),
    sitRise: max(tests.map((t) => t.computed.sitRiseScore)),
    oneLegClosedS: max(tests.map((t) => weakerLeg(t.results.oneLeg?.closedL, t.results.oneLeg?.closedR))),
    vo2maxGainPct:
      first !== undefined && bestVo2 !== undefined && tests.length > 1
        ? (bestVo2 / first - 1) * 100
        : undefined,
    wallZeroTests: wallBest,
    wallCm: latest?.results.wallCm,
    farmerS: latest?.results.farmerS,
    jumpReachCm: latest?.results.jumpReachCm,
    vo2max: latest?.computed.vo2max,
  }
}
