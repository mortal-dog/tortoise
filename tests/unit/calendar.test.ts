import { describe, expect, it } from 'vitest'
import type { Session, Step, WeekTemplate } from '@/data/schema'
import { adjustDose, dayTemplate, planDay, swapWarnings, weekWithSwaps } from '@/lib/calendar'
import { addDays } from '@/lib/dates'
import { rules } from '../fixtures/rules'

const START = '2026-11-30' // Monday of Week 1; Week 0 begins 2026-11-23.

const week = (n: number, offset = 0) => planDay(START, addDays(START, (n - 1) * 7 + offset), rules)

describe('the plan calendar (design §5.1)', () => {
  it('numbers weeks from the start Monday, with Week 0 the seven days before', () => {
    expect(planDay(START, '2026-11-30', rules).week).toBe(1)
    expect(planDay(START, '2026-12-06', rules).week).toBe(1)
    expect(planDay(START, '2026-11-23', rules).kind).toBe('week0')
    expect(planDay(START, '2026-11-29', rules).week).toBe(0)
    expect(planDay(START, '2026-11-22', rules).kind).toBe('before')
  })

  it('gives blocks of four weeks with the fourth light', () => {
    expect([1, 2, 3, 4, 5, 8, 9].map((n) => [week(n).block, week(n).weekInBlock])).toEqual([
      [1, 1],
      [1, 2],
      [1, 3],
      [1, 4],
      [2, 1],
      [2, 4],
      [3, 1],
    ])
    expect(week(4).isLight).toBe(true)
    expect(week(4).kind).toBe('light')
    expect(week(3).isLight).toBe(false)
  })

  it('has no test weeks: every fourth week is light, Week 0 is its own kind (D-067)', () => {
    expect(week(0).kind).toBe('week0')
    expect(week(12).kind).toBe('light')
    expect(week(24).kind).toBe('light')
    expect(week(8).kind).toBe('light')
  })

  it('moves through the interval stages by block, staying at the 4 × 4 from Block 4', () => {
    expect([1, 5, 9, 13, 40, 400].map((n) => week(n).intervalStage)).toEqual([1, 2, 3, 4, 4, 4])
    expect(week(0).intervalStage).toBe(1)
  })

  it('marks the ramp weeks', () => {
    expect([1, 2, 3].map((n) => week(n).isRamp)).toEqual([true, true, false])
  })

  it('keeps counting weeks across years, leap days and daylight-saving changes', () => {
    const d = planDay(START, '2028-02-29', rules)
    expect(d.week).toBe(Math.floor((Date.UTC(2028, 1, 29) - Date.UTC(2026, 10, 30)) / 86_400_000 / 7) + 1)
    expect(planDay(START, '2027-03-28', rules).weekday).toBe('sun')
    expect(planDay(START, '2027-03-29', rules).weekday).toBe('mon')
    expect(planDay(START, '2027-03-29', rules).week).toBe(planDay(START, '2027-03-28', rules).week + 1)
  })
})

const template: WeekTemplate = {
  mon: {
    morning: 'morning',
    main: 'strength-a',
    split: 'split-front',
    expectedMinutes: { min: 55, max: 65 },
  },
  tue: { morning: 'morning', main: 'easy-run', split: 'split-side', expectedMinutes: { min: 65, max: 75 } },
  wed: {
    morning: 'morning',
    main: 'strength-b',
    split: 'split-front',
    expectedMinutes: { min: 55, max: 65 },
  },
  thu: { morning: 'morning', main: 'intervals', split: 'split-side', expectedMinutes: { min: 55, max: 65 } },
  fri: {
    morning: 'morning',
    main: 'strength-c',
    split: 'split-short',
    expectedMinutes: { min: 55, max: 65 },
  },
  sat: { morning: 'morning', main: 'long', split: 'split-short', expectedMinutes: { min: 90, max: 120 } },
  sun: { morning: 'morning', main: 'light', split: null, expectedMinutes: { min: 45, max: 45 } },
}
const kinds: Record<string, Session['kind']> = {
  'strength-a': 'strength',
  'strength-b': 'strength',
  'strength-c': 'strength',
  'easy-run': 'run',
  intervals: 'intervals',
  long: 'long',
  light: 'light',
}

describe('swaps and their warnings', () => {
  it('swap main sessions with their split blocks, never the template', () => {
    const w = weekWithSwaps(template, [['mon', 'tue']])
    expect(w.mon.main).toBe('easy-run')
    expect(w.mon.split).toBe('split-side')
    expect(w.tue.main).toBe('strength-a')
    expect(template.mon.main).toBe('strength-a')
  })

  it('warn on two strength days in a row and on intervals before the long run', () => {
    expect(swapWarnings(template, (id) => kinds[id])).toEqual([])
    const w1 = weekWithSwaps(template, [['tue', 'wed']])
    expect(swapWarnings(w1, (id) => kinds[id]).map((x) => x.days)).toContainEqual(['mon', 'tue'])
    const w2 = weekWithSwaps(template, [['thu', 'fri']])
    expect(swapWarnings(w2, (id) => kinds[id]).map((x) => x.message)).toContain(
      'Two strength days in a row: keep a day between strength sessions.',
    )
    const w3 = weekWithSwaps(template, [
      ['fri', 'sun'],
      ['thu', 'fri'],
    ])
    expect(w3.fri.main).toBe('intervals')
    expect(swapWarnings(w3, (id) => kinds[id]).some((x) => x.message.startsWith('Intervals'))).toBe(true)
  })

  it('give every day of Week 0 and after its template, the weekend too (D-067: no test days)', () => {
    expect(dayTemplate(week(12, 5), template)).toEqual(template.sat)
    expect(dayTemplate(week(0, 6), template)).toEqual(template.sun)
    expect(dayTemplate(planDay(START, '2026-11-01', rules), template)).toBeNull()
  })
})

const strength = { kind: 'strength' } as Session
const run = { kind: 'run' } as Session
const step = (s: Partial<Step>): Step => ({ id: 'x', part: 'main', dose: '', sources: [], ...s }) as Step

describe('the week changes to a dose', () => {
  it('strength: 2 sets in the ramp, −1 in light weeks (never below 2), halved and rounded up in Week 0', () => {
    const s = step({ sets: 3, exerciseId: 'goblet-squat' })
    expect(adjustDose(s, strength, week(1), rules).sets).toBe(2)
    expect(adjustDose(s, strength, week(3), rules).sets).toBe(3)
    expect(adjustDose(s, strength, week(8), rules).sets).toBe(2)
    expect(adjustDose(step({ sets: 2 }), strength, week(8), rules).sets).toBe(2)
    expect(adjustDose(s, strength, week(0), rules).sets).toBe(2)
    expect(adjustDose(step({ sets: 4 }), strength, week(0), rules).sets).toBe(2)
  })

  it('leaves warm-ups unchanged', () => {
    expect(adjustDose(step({ sets: 3, part: 'warmup' }), strength, week(8), rules).sets).toBe(3)
  })

  it('runs: × 0.7 in light weeks, halved in Week 0', () => {
    const s = step({ minutes: { min: 30, max: 40 } })
    expect(adjustDose(s, run, week(4), rules).minutes).toEqual({ min: 21, max: 28 })
    expect(adjustDose(s, run, week(0, 1), rules).minutes).toEqual({ min: 15, max: 20 })
    expect(adjustDose(s, run, week(5), rules).minutes).toEqual({ min: 30, max: 40 })
  })

  it('intervals: repeats halved, rounded up, in light weeks and Week 0', () => {
    const s = step({ intervalStage: true })
    const intervals = { kind: 'intervals' } as Session
    expect(adjustDose(s, intervals, week(4, 3), rules, 10).repeats).toBe(5)
    expect(adjustDose(s, intervals, week(16, 3), rules, 4).repeats).toBe(2)
    expect(adjustDose(s, intervals, week(8, 3), rules, 6).repeats).toBe(3)
    expect(adjustDose(s, intervals, week(12, 3), rules, 5).repeats).toBe(3)
    expect(adjustDose(s, intervals, week(10, 3), rules, 5).repeats).toBe(5)
  })
})
