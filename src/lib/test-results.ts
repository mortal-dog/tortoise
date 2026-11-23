// The Tortoise Test's results (design §3.5, plan §8 and §10): the computed values, the trend series for Progress, the
// yearly height rule and the starting levels that Week 0's results set. Pure functions.
import type { Ladder, StartRule, TestDef } from '@/data/schema'
import { ageInYear, rockport, sitRiseScore } from './calc'
import { daysBetween, type LocalDate } from './dates'
import type { SettingsRecord, TestRecord } from './records'

export type Results = TestRecord['results']

/** Height is asked when the last height record is 48 weeks old or more, or there is none (design §3.5). */
export const HEIGHT_EVERY_DAYS = 48 * 7

export function heightDue(tests: readonly TestRecord[], date: LocalDate): boolean {
  const last = [...tests]
    .filter((t) => t.results.heightCm !== undefined && t.date < date)
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .at(-1)
  return !last || daysBetween(last.date, date) >= HEIGHT_EVERY_DAYS
}

/** The computed part of a test record: the Rockport estimate (when age, sex and weight are known) and sit-to-rise. */
export function computeResults(
  results: Results,
  profile: SettingsRecord['profile'],
  date: LocalDate,
): TestRecord['computed'] & { ageInRange?: boolean } {
  const out: TestRecord['computed'] & { ageInRange?: boolean } = {}
  const r = results.rockport
  if (r && profile.birthYear !== undefined && profile.sex) {
    const res = rockport({
      weightKg: r.weightKg,
      age: ageInYear(profile.birthYear, Number(date.slice(0, 4))),
      sex: profile.sex,
      minutes: r.minutes,
      heartRate: r.heartRate,
    })
    out.vo2max = Math.round(res.vo2max * 10) / 10
    out.ageInRange = res.ageInRange
  }
  if (results.sitRise) out.sitRiseScore = sitRiseScore(results.sitRise.sit, results.sitRise.rise)
  return out
}

/** A chart series: one value per test, read from the record. */
export interface Series {
  id: string
  testId: string
  name: string
  unit: string
  value: (t: TestRecord) => number | undefined
  /** Lower is better (the wall gap, the split distance, a resting pulse). */
  lowerIsBetter?: boolean
}

const weaker = (a?: number, b?: number) => (a === undefined || b === undefined ? undefined : Math.min(a, b))
const farther = (a?: number, b?: number) => (a === undefined || b === undefined ? undefined : Math.max(a, b))

/** One series per test, and two for the splits (front and side); the Rockport walk shows the VO2max estimate. */
export const SERIES: readonly Series[] = [
  {
    id: 'vo2max',
    testId: 'rockport',
    name: 'VO2max estimate',
    unit: 'mL/kg/min',
    value: (t) => t.computed.vo2max,
  },
  {
    id: 'jump-reach',
    testId: 'jump-reach',
    name: 'Jump and reach',
    unit: 'cm',
    value: (t) => t.results.jumpReachCm,
  },
  {
    id: 'resting-hr',
    testId: 'resting-hr',
    name: 'Resting heart rate',
    unit: 'bpm',
    value: (t) => t.results.restingHr,
    lowerIsBetter: true,
  },
  { id: 'height', testId: 'height', name: 'Height', unit: 'cm', value: (t) => t.results.heightCm },
  {
    id: 'wall',
    testId: 'wall',
    name: 'Wall test',
    unit: 'cm',
    value: (t) => t.results.wallCm,
    lowerIsBetter: true,
  },
  {
    id: 'sit-to-rise',
    testId: 'sit-to-rise',
    name: 'Sit-to-rise',
    unit: 'points',
    value: (t) => t.computed.sitRiseScore,
  },
  {
    id: 'one-leg',
    testId: 'one-leg',
    name: 'One-leg stance, eyes closed (weaker leg)',
    unit: 's',
    value: (t) => weaker(t.results.oneLeg?.closedL, t.results.oneLeg?.closedR),
  },
  { id: 'push-ups', testId: 'push-ups', name: 'Push-ups', unit: 'reps', value: (t) => t.results.pushups },
  {
    id: 'handstand',
    testId: 'handstand',
    name: 'Handstand at the wall',
    unit: 's',
    value: (t) => t.results.handstand?.wallS,
  },
  { id: 'farmer', testId: 'farmer', name: 'Farmer hold', unit: 's', value: (t) => t.results.farmerS },
  {
    id: 'deep-squat',
    testId: 'deep-squat',
    name: 'Deep squat hold',
    unit: 's',
    value: (t) => t.results.squatHoldS,
  },
  {
    id: 'front-split',
    testId: 'splits',
    name: 'Front split (the farther side)',
    unit: 'cm',
    value: (t) => farther(t.results.splits?.frontL, t.results.splits?.frontR),
    lowerIsBetter: true,
  },
  {
    id: 'side-split',
    testId: 'splits',
    name: 'Side split',
    unit: 'cm',
    value: (t) => t.results.splits?.side,
    lowerIsBetter: true,
  },
]

export interface Point {
  date: LocalDate
  value: number
}

export function seriesPoints(series: Series, tests: readonly TestRecord[]): Point[] {
  return [...tests]
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .flatMap((t) => {
      const v = series.value(t)
      return v === undefined || Number.isNaN(v) ? [] : [{ date: t.date, value: v }]
    })
}

/** The aim line's value for a test, or undefined. */
export function aimValue(test: TestDef | undefined): number | undefined {
  return test?.aimLine?.value
}

/** The inputs the start rules read (plan §8). */
export interface StartInputs {
  pushups?: number
  runMin?: number
}

function inputValue(inputs: StartInputs, key: StartRule['input']): number | undefined {
  return inputs[key]
}

/**
 * The starting level of each ladder that a start rule covers: a band matches when min ≤ v < max (max null: no top);
 * the highest matching level wins.
 */
export function startingLevels(
  rules: readonly StartRule[],
  ladders: readonly Ladder[],
  inputs: StartInputs,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const rule of rules) {
    const v = inputValue(inputs, rule.input)
    if (v === undefined) continue
    const band = rule.bands.find((b) => v >= b.min && (b.max === null || v < b.max))
    if (!band) continue
    const level = ladders.find((l) => l.id === rule.ladderId)?.levels.find((l) => l.code === band.code)?.level
    if (level === undefined) continue
    out.set(rule.ladderId, Math.max(out.get(rule.ladderId) ?? 0, level))
  }
  return out
}

/** The start inputs a test record holds. */
export function startInputsOf(t: TestRecord): StartInputs {
  return {
    pushups: t.results.pushups,
    runMin: t.start?.runMin,
  }
}
