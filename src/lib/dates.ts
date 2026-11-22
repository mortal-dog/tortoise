// Local calendar dates as 'YYYY-MM-DD' strings. All arithmetic runs on whole day numbers, never on instants, so
// daylight-saving changes cannot move a date (implementation Phase 2: "local calendar dates rather than UTC instants").
import type { Weekday } from '@/data/schema'

export type LocalDate = string

const RE = /^(\d{4})-(\d{2})-(\d{2})$/
const MS_PER_DAY = 86_400_000
const WEEKDAYS: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

export function isLocalDate(s: string): boolean {
  const m = RE.exec(s)
  if (!m) return false
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const t = new Date(Date.UTC(y, mo - 1, d))
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d
}

/** Days since 1970-01-01 for a local date. */
export function dayNumber(date: LocalDate): number {
  const m = RE.exec(date)
  if (!m) throw new Error(`not a date: ${date}`)
  return Math.round(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY)
}

export function fromDayNumber(n: number): LocalDate {
  const t = new Date(n * MS_PER_DAY)
  const y = t.getUTCFullYear()
  const mo = String(t.getUTCMonth() + 1).padStart(2, '0')
  const d = String(t.getUTCDate()).padStart(2, '0')
  return `${String(y).padStart(4, '0')}-${mo}-${d}`
}

export function addDays(date: LocalDate, days: number): LocalDate {
  return fromDayNumber(dayNumber(date) + days)
}

/** b − a, in days. */
export function daysBetween(a: LocalDate, b: LocalDate): number {
  return dayNumber(b) - dayNumber(a)
}

export function weekday(date: LocalDate): Weekday {
  // 1970-01-01 was a Thursday.
  const i = (((dayNumber(date) + 3) % 7) + 7) % 7
  return WEEKDAYS[i] as Weekday
}

export function weekdayIndex(day: Weekday): number {
  return WEEKDAYS.indexOf(day)
}

export function mondayOf(date: LocalDate): LocalDate {
  return addDays(date, -weekdayIndex(weekday(date)))
}

/** The local date of an instant, in the device's time zone. */
export function localDateOf(instant: Date): LocalDate {
  const y = instant.getFullYear()
  const mo = String(instant.getMonth() + 1).padStart(2, '0')
  const d = String(instant.getDate()).padStart(2, '0')
  return `${y}-${mo}-${d}`
}

export function today(now: Date = new Date()): LocalDate {
  return localDateOf(now)
}

/** The Monday on which Week 0 begins by default: today on a Monday, else the coming Monday (design §3.8). */
export function defaultWeek0Monday(todayDate: LocalDate): LocalDate {
  const i = weekdayIndex(weekday(todayDate))
  return i === 0 ? todayDate : addDays(todayDate, 7 - i)
}

export function compareDates(a: LocalDate, b: LocalDate): number {
  return a < b ? -1 : a > b ? 1 : 0
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY_NAMES: Record<Weekday, string> = {
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
  sun: 'Sun',
}

/** "Mon 23 Nov", as on the Today screen. */
export function formatShort(date: LocalDate): string {
  const [, mo, d] = date.split('-').map(Number) as [number, number, number]
  return `${DAY_NAMES[weekday(date)]} ${d} ${MONTHS[mo - 1]}`
}

/** "Mon 23 Nov 2026", where the year matters (backups, the plan's start). */
export function formatLong(date: LocalDate): string {
  return `${formatShort(date)} ${date.slice(0, 4)}`
}

export function dayName(day: Weekday): string {
  return DAY_NAMES[day]
}
