// Check-ins (D-069, plan §7): the doses are fixed in the session; after a session the app asks, for each ladder whose
// turn has come, "one level harder, keep, or one level easier?". It never changes a level by itself.
import type { Ladder, LadderLevel } from '@/data/schema'
import { compareDates, daysBetween, type LocalDate } from './dates'
import type { LevelRecord } from './records'

export type Answer = 'harder' | 'keep' | 'easier'

/** After "one level easier", the next check-in comes after this many days, to step back up after a recovery. */
export const EASED_DAYS = 7
/** A ladder not done for this many days is asked about at once, "easier" first. */
export const TIME_OFF_DAYS = 14

export interface CheckIn {
  ladder: Ladder
  current: LadderLevel
  /** The next level up; none at the ladder's top. */
  harder?: LadderLevel
  /** The level below; none at level 1. */
  easier?: LadderLevel
  /** Back after two weeks or more without this ladder: "easier" comes first. */
  afterTimeOff: boolean
}

function levelAt(ladder: Ladder, level: number): LadderLevel | undefined {
  return ladder.levels.find((l) => l.level === level)
}

function latest(dates: Array<LocalDate | undefined>): LocalDate | undefined {
  return dates
    .filter((d): d is LocalDate => !!d)
    .sort(compareDates)
    .at(-1)
}

/**
 * The check-ins due today for the ladders of a session. A ladder's turn comes `askEveryDays` after its last check-in
 * or level change (a week after an "easier"), counted from Week 1's Monday; none in Week 0. A ladder not done for
 * `TIME_OFF_DAYS` is due at once.
 */
export function checkInsDue(
  ladders: readonly Ladder[],
  levels: ReadonlyMap<string, LevelRecord>,
  /** The last day before today each ladder was done. */
  lastDone: ReadonlyMap<string, LocalDate>,
  today: LocalDate,
  week1: LocalDate,
): CheckIn[] {
  if (compareDates(today, week1) < 0) return []
  const out: CheckIn[] = []
  for (const ladder of ladders) {
    const rec = levels.get(ladder.id)
    const current = levelAt(ladder, rec?.level ?? 1)
    if (!current) continue
    const harder = levelAt(ladder, current.level + 1)
    const easier = levelAt(ladder, current.level - 1)
    if (!harder && !easier) continue
    const last = lastDone.get(ladder.id)
    const afterTimeOff = last !== undefined && daysBetween(last, today) >= TIME_OFF_DAYS
    const from = latest([week1, rec?.askedAt, rec?.since]) ?? week1
    const every = rec?.eased ? EASED_DAYS : ladder.askEveryDays
    if (!afterTimeOff && daysBetween(from, today) < every) continue
    out.push({ ladder, current, ...(harder ? { harder } : {}), ...(easier ? { easier } : {}), afterTimeOff })
  }
  return out
}

/** The level an answer moves to. */
export function levelAfter(check: CheckIn, answer: Answer): number {
  if (answer === 'harder' && check.harder) return check.harder.level
  if (answer === 'easier' && check.easier) return check.easier.level
  return check.current.level
}

/** Past the ladders, run and rope time grow by at most 10% a week (plan §2, rule 4; our rule). */
export function maxMinutesThisWeek(lastWeekMinutes: number): number {
  return Math.floor(lastWeekMinutes * 1.1)
}

/** A level's working range starts about a third below its pass number (plan §7): a pass at 12 starts at 8. */
export function rangeStart(passReps: number): number {
  return Math.max(1, Math.round((passReps * 2) / 3))
}
