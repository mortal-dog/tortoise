// Progression suggestions (design §5.3, plan §7). The app only suggests; the user confirms every move.
import type { Ladder, LadderLevel } from '@/data/schema'
import { daysBetween, type LocalDate } from './dates'

export type Feedback = 'easy' | 'right' | 'hard'

export interface LadderLog {
  date: LocalDate
  /** The level number the log was done at. */
  level: number
  sets: Array<{ reps?: number; seconds?: number }>
  feedback?: Feedback
}

export type Suggestion =
  | { kind: 'up'; to: LadderLevel }
  | { kind: 'down'; to: LadderLevel; reason: 'too-hard' }
  | { kind: 'down-for-a-week'; to: LadderLevel; reason: 'time-off' }

/** Days with no logs after which one level down for a week is suggested (design §5.3). */
export const TIME_OFF_DAYS = 14
/** Endurance steps: at least this many days on a step before the next (plan §7.8, §7.9). */
export const ENDURANCE_MIN_DAYS = 7

function levelAt(ladder: Ladder, level: number): LadderLevel | undefined {
  return ladder.levels.find((l) => l.level === level)
}

function meetsReps(log: LadderLog, pass: LadderLevel['pass']): boolean {
  if (pass.reps === undefined) return false
  const sets = pass.sets ?? 1
  const good = log.sets.filter((s) => (s.reps ?? 0) >= (pass.reps ?? 0))
  return good.length >= sets && (log.feedback === 'right' || log.feedback === 'easy')
}

function meetsHold(log: LadderLog, pass: LadderLevel['pass']): boolean {
  if (pass.seconds === undefined) return false
  const sets = pass.sets ?? 1
  return log.sets.filter((s) => (s.seconds ?? 0) >= (pass.seconds ?? 0)).length >= sets
}

/**
 * The suggestion for one ladder, or null.
 * - After 14 or more days with no logs: one level down for a week.
 * - Two "too hard" in a row: one level down.
 * - Reps: all sets at the top of the range, logged right or too easy, in two sessions in a row: the next level.
 * - Holds: all sets at the target: the next level.
 * - Endurance steps move only on the user's tap, so they get no suggestion here.
 */
export function suggest(
  ladder: Ladder,
  currentLevel: number,
  logs: readonly LadderLog[],
  todayDate: LocalDate,
): Suggestion | null {
  const current = levelAt(ladder, currentLevel)
  if (!current || ladder.kind === 'endurance') return null
  const sorted = [...logs].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
  const last = sorted.at(-1)
  const below = levelAt(ladder, currentLevel - 1)
  const above = levelAt(ladder, currentLevel + 1)
  if (last && below && daysBetween(last.date, todayDate) >= TIME_OFF_DAYS) {
    return { kind: 'down-for-a-week', to: below, reason: 'time-off' }
  }
  const atLevel = sorted.filter((l) => l.level === currentLevel)
  const latest = atLevel.at(-1)
  const prev = atLevel.at(-2)
  if (prev && latest && prev.feedback === 'hard' && latest.feedback === 'hard' && below) {
    return { kind: 'down', to: below, reason: 'too-hard' }
  }
  if (!above) return null
  const pass = current.pass
  if (pass.reps !== undefined) {
    if (prev && latest && meetsReps(prev, pass) && meetsReps(latest, pass)) return { kind: 'up', to: above }
    return null
  }
  if (pass.seconds !== undefined && latest && meetsHold(latest, pass)) return { kind: 'up', to: above }
  return null
}

/** Whether an endurance step may move up: at least 7 days on the current one. */
export function canStepUp(since: LocalDate, todayDate: LocalDate): boolean {
  return daysBetween(since, todayDate) >= ENDURANCE_MIN_DAYS
}

/** Past the ladders, run and rope time grow by at most 10% a week (plan §2, rule 4; our rule). */
export function maxMinutesThisWeek(lastWeekMinutes: number): number {
  return Math.floor(lastWeekMinutes * 1.1)
}

/** A level's working range starts about a third below its pass number (plan §7): a pass at 12 starts at 8. */
export function rangeStart(passReps: number): number {
  return Math.max(1, Math.round((passReps * 2) / 3))
}
