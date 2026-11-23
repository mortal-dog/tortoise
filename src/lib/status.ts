// Day status and the tortoise streak (design §5.2, D-014, D-029).
import { addDays, compareDates, type LocalDate } from './dates'

export type DayStatus = 'full' | 'shell' | 'missed' | 'ahead' | 'none'

/** The parts of a day record the status reads. */
export interface DayFacts {
  morning?: { doneAt: string } | null
  /** On a test day the day's part of the Tortoise Test is saved here; on Sunday, the Light session. */
  main?: { doneAt: string } | null
}

/**
 * - Full: morning block and main session both done. Shell: one of the two.
 * - Ahead: a future day, or today while nothing is done yet.
 * - None: a day before Week 0, which has no status.
 */
export function dayStatus(
  facts: DayFacts | undefined,
  date: LocalDate,
  todayDate: LocalDate,
  week0: LocalDate,
): DayStatus {
  if (compareDates(date, week0) < 0) return 'none'
  const done = (facts?.morning?.doneAt ? 1 : 0) + (facts?.main?.doneAt ? 1 : 0)
  if (done === 2) return 'full'
  if (done === 1) return 'shell'
  if (compareDates(date, todayDate) >= 0) return 'ahead'
  return 'missed'
}

export function isDone(s: DayStatus): boolean {
  return s === 'full' || s === 'shell'
}

/**
 * The tortoise streak: the done days (Full or Shell) of the current run. Counted back from today, or from yesterday
 * while today has nothing done. One missed day adds nothing but does not end the run; two missed days in a row end it.
 * The run never reaches back before Week 0. There is no pause (D-057): the app counts what was done, not why not.
 */
export function currentStreak(
  statusOf: (date: LocalDate) => DayStatus,
  todayDate: LocalDate,
  week0: LocalDate,
): number {
  let d = isDone(statusOf(todayDate)) ? todayDate : addDays(todayDate, -1)
  let count = 0
  let missedInARow = 0
  while (compareDates(d, week0) >= 0) {
    const s = statusOf(d)
    if (isDone(s)) {
      count++
      missedInARow = 0
    } else if (s === 'missed') {
      missedInARow++
      if (missedInARow >= 2) break
    }
    d = addDays(d, -1)
  }
  return count
}

/** The largest streak count in the history, from Week 0 to today. */
export function longestStreak(
  statusOf: (date: LocalDate) => DayStatus,
  todayDate: LocalDate,
  week0: LocalDate,
): number {
  let best = 0
  let count = 0
  let missedInARow = 0
  for (let d = week0; compareDates(d, todayDate) <= 0; d = addDays(d, 1)) {
    const s = statusOf(d)
    if (isDone(s)) {
      count++
      missedInARow = 0
      if (count > best) best = count
    } else if (s === 'missed') {
      missedInARow++
      if (missedInARow >= 2) count = 0
    }
  }
  return best
}

/** The longest run of days in a row with none missed: every day Full or Shell (the Hatchling milestone). */
export function longestDoneRun(
  statusOf: (date: LocalDate) => DayStatus,
  todayDate: LocalDate,
  week0: LocalDate,
): number {
  let best = 0
  let run = 0
  for (let d = week0; compareDates(d, todayDate) <= 0; d = addDays(d, 1)) {
    const s = statusOf(d)
    if (isDone(s)) {
      run++
      if (run > best) best = run
    } else if (s !== 'ahead') {
      run = 0
    }
  }
  return best
}
