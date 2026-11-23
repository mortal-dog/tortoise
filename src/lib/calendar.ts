// The plan calendar (design §5.1): week, block, light and test weeks, the interval stage, and the week's changes.
import type { BlockRules, DayTemplate, Session, Step, Weekday, WeekTemplate } from '@/data/schema'
import { addDays, compareDates, daysBetween, type LocalDate, weekday, weekdayIndex } from './dates'

export type WeekKind = 'before' | 'week0' | 'build' | 'light' | 'test'

export interface PlanDay {
  date: LocalDate
  weekday: Weekday
  /** Week 0 is the seven days before Week 1; negative before that. */
  week: number
  /** Block number from Week 1 on; 0 in Week 0 and before. */
  block: number
  weekInBlock: number
  kind: WeekKind
  isLight: boolean
  isTestWeek: boolean
  isTestDay: boolean
  /** Weeks 1 and 2: strength at 2 sets. */
  isRamp: boolean
  /** 1–4 (design §5.1); Week 0 uses stage 1. 0 before Week 0. */
  intervalStage: number
  /** The Monday of this date's week. */
  monday: LocalDate
}

/** startDate is the Monday of Week 1 (design §6, settings). */
export function planDay(startDate: LocalDate, date: LocalDate, rules: BlockRules): PlanDay {
  const offset = daysBetween(startDate, date)
  const week = Math.floor(offset / 7) + 1
  const wd = weekday(date)
  const monday = addDays(startDate, (week - 1) * 7)
  if (week < 0) {
    return {
      date,
      weekday: wd,
      week,
      block: 0,
      weekInBlock: 0,
      kind: 'before',
      isLight: false,
      isTestWeek: false,
      isTestDay: false,
      isRamp: false,
      intervalStage: 0,
      monday,
    }
  }
  if (week === 0) {
    return {
      date,
      weekday: wd,
      week,
      block: 0,
      weekInBlock: 0,
      kind: 'week0',
      isLight: false,
      isTestWeek: true,
      isTestDay: rules.testDays.includes(wd),
      isRamp: false,
      intervalStage: 1,
      monday,
    }
  }
  const block = Math.ceil(week / rules.blockWeeks)
  const weekInBlock = ((week - 1) % rules.blockWeeks) + 1
  const isLight = weekInBlock === rules.lightWeekInBlock
  const isTestWeek = isLight && block % rules.testEveryBlocks === 0
  const stage = [...rules.intervalStages].reverse().find((s) => block >= s.fromBlock)?.stage ?? 1
  return {
    date,
    weekday: wd,
    week,
    block,
    weekInBlock,
    kind: isTestWeek ? 'test' : isLight ? 'light' : 'build',
    isLight,
    isTestWeek,
    isTestDay: isTestWeek && rules.testDays.includes(wd),
    isRamp: rules.ramp.weeks.includes(week),
    intervalStage: stage,
    monday,
  }
}

export function isBeforeWeek0(startDate: LocalDate, date: LocalDate): boolean {
  return compareDates(date, addDays(startDate, -7)) < 0
}

export function week0Monday(startDate: LocalDate): LocalDate {
  return addDays(startDate, -7)
}

export type Swap = [Weekday, Weekday]

/** The week's template after its swaps: each swap exchanges two days' main sessions, each with its split block. */
export function weekWithSwaps(template: WeekTemplate, swaps: readonly Swap[]): WeekTemplate {
  const out = { ...template }
  for (const [a, b] of swaps) {
    const da = out[a]
    const db = out[b]
    out[a] = { ...da, main: db.main, split: db.split }
    out[b] = { ...db, main: da.main, split: da.split }
  }
  return out
}

export interface SwapWarning {
  days: [Weekday, Weekday]
  message: string
}

const ORDER: readonly Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

/** The rules a swap may break (design §3.3, plan §14): strength on two days in a row; intervals the day before the long run. */
export function swapWarnings(
  week: WeekTemplate,
  kindOf: (sessionId: string) => Session['kind'] | undefined,
): SwapWarning[] {
  const out: SwapWarning[] = []
  for (let i = 0; i + 1 < ORDER.length; i++) {
    const a = ORDER[i] as Weekday
    const b = ORDER[i + 1] as Weekday
    const ka = kindOf(week[a].main)
    const kb = kindOf(week[b].main)
    if (ka === 'strength' && kb === 'strength') {
      out.push({ days: [a, b], message: 'Two strength days in a row: keep a day between strength sessions.' })
    }
    if (ka === 'intervals' && kb === 'long') {
      out.push({ days: [a, b], message: 'Intervals the day before the long run.' })
    }
  }
  return out
}

/** The day's template, or null for a day before Week 0. On test days the test part replaces main and split. */
export function dayTemplate(
  day: PlanDay,
  template: WeekTemplate,
  swaps: readonly Swap[] = [],
): (DayTemplate & { testDay: 1 | 2 | null }) | null {
  if (day.kind === 'before') return null
  const week = weekWithSwaps(template, swaps)
  const base = week[day.weekday]
  if (day.isTestDay) {
    const testDay = weekdayIndex(day.weekday) === 5 ? 1 : 2
    return { ...base, split: null, testDay }
  }
  return { ...base, testDay: null }
}

export interface StepDose {
  sets?: number
  minutes?: { min: number; max: number }
  repeats?: number
}

/**
 * The week's changes to a step's dose (design §5.1): Week 0 at half volume from Monday to Friday, the ramp's 2 sets,
 * and the light week. The morning block, the split blocks and the warm-ups are unchanged.
 */
export function adjustDose(
  step: Step,
  session: Session,
  day: PlanDay,
  rules: BlockRules,
  stageRepeats?: number,
): StepDose {
  const out: StepDose = {}
  const changeable = step.part === 'main'
  const halfVolume = day.kind === 'week0' && rules.week0.halfVolumeDays.includes(day.weekday)
  if (step.sets !== undefined) {
    let sets = step.sets
    if (session.kind === 'strength' && changeable) {
      if (halfVolume) sets = Math.ceil(sets * rules.week0.setsFactor)
      else if (day.isRamp) sets = Math.min(sets, rules.ramp.strengthSets)
      else if (day.isLight) sets = Math.max(rules.light.minStrengthSets, sets + rules.light.strengthSetsDelta)
    }
    out.sets = sets
  }
  const endurance = (session.kind === 'run' || session.kind === 'long') && step.part === 'main'
  if (step.minutes) {
    let f = 1
    if (endurance && halfVolume) f = rules.week0.enduranceFactor
    else if (endurance && day.isLight) f = rules.light.enduranceFactor
    out.minutes = { min: round1(step.minutes.min * f), max: round1(step.minutes.max * f) }
  }
  if (step.intervalStage && stageRepeats !== undefined) {
    let r = stageRepeats
    if (halfVolume) r = Math.ceil(r * rules.week0.intervalRepsFactor)
    else if (day.isLight) r = Math.ceil(r * rules.light.intervalRepsFactor)
    out.repeats = r
  }
  return out
}

function round1(n: number): number {
  return Math.round(n * 10) / 10
}
