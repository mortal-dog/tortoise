import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import type { TestRecord } from '@/lib/records'
import { aimValue, computeResults, heightDue, SERIES, seriesPoints, startingLevels } from '@/lib/test-results'

const AT = '2026-11-28T10:00:00Z'
const rec = (
  date: string,
  results: TestRecord['results'],
  computed: TestRecord['computed'] = {},
): TestRecord => ({
  date,
  results,
  computed,
  updatedAt: AT,
})
const code = (ladderId: string, level: number | undefined) =>
  plan.ladders.find((l) => l.id === ladderId)?.levels.find((l) => l.level === level)?.code

describe('starting levels from Week 0 (plan §8)', () => {
  const levels = (inputs: Parameters<typeof startingLevels>[2]) => {
    const m = startingLevels(plan.startRules, plan.ladders, inputs)
    return Object.fromEntries([...m].map(([id, lv]) => [id, code(id, lv)]))
  }

  it('reads half-open bands, so a value on a boundary takes the upper band', () => {
    expect(levels({ pushups: 4 })).toEqual({ push: '1' })
    expect(levels({ pushups: 5 })).toEqual({ push: '2' })
    expect(levels({ pushups: 19.5 })).toEqual({ push: '3' })
    expect(levels({ pushups: 30 })).toEqual({ push: '5' })
  })

  it('sets run, rope and pull from the start answers and the hang', () => {
    expect(levels({ runMin: 15, ropeMin: 2, deadHangS: 20, negative: false })).toEqual({
      run: 'R4',
      rope: 'J2',
      pull: 'P1',
    })
  })

  it('counts the negative only with a 30-s hang, and the highest level wins', () => {
    expect(levels({ deadHangS: 25, negative: true })).toEqual({ pull: 'P1' })
    expect(levels({ deadHangS: 30, negative: true })).toEqual({ pull: 'P3' })
    expect(levels({ deadHangS: 30, negative: false })).toEqual({ pull: 'P2' })
  })

  it('sets nothing for an input that was not given', () => {
    expect(levels({})).toEqual({})
  })
})

describe('the yearly height', () => {
  it('is due with no record, and again once the last is 48 weeks old', () => {
    expect(heightDue([], '2026-11-28')).toBe(true)
    const tests = [rec('2026-11-28', { heightCm: 175 })]
    expect(heightDue(tests, '2027-02-20')).toBe(false)
    expect(heightDue(tests, '2027-10-29')).toBe(false) // 335 days
    expect(heightDue(tests, '2027-10-30')).toBe(true) // 336 days: 48 weeks
  })
})

describe('computed results', () => {
  it('estimates VO2max only with age, sex and weight, and scores sit-to-rise', () => {
    const results = { rockport: { minutes: 15, heartRate: 120, weightKg: 70 }, sitRise: { sit: 1, rise: 2 } }
    const none = computeResults(results, {}, '2026-11-28')
    expect(none.vo2max).toBeUndefined()
    expect(none.sitRiseScore).toBe(7)
    const c = computeResults(results, { birthYear: 1980, sex: 'male' }, '2026-11-28')
    // 6.9652 + 0.0091 × 154.32 − 0.0257 × 46 + 0.5955 − 0.224 × 15 − 0.0115 × 120 = 3.0429 L/min → 43.5 mL/kg/min
    expect(c.vo2max).toBeCloseTo(43.5, 1)
    expect(c.ageInRange).toBe(true)
  })
})

describe('trend series', () => {
  it('skip tests without the value, in date order', () => {
    const tests = [
      rec('2027-02-20', { pushups: 14 }),
      rec('2026-11-29', { pushups: 9 }),
      rec('2027-05-15', { wallCm: 2 }),
    ]
    const push = SERIES.find((s) => s.id === 'push-ups')
    expect(push && seriesPoints(push, tests)).toEqual([
      { date: '2026-11-29', value: 9 },
      { date: '2027-02-20', value: 14 },
    ])
  })

  it('take the weaker leg for one-leg stance and the farther side for the front split', () => {
    const t = rec('2026-11-29', {
      oneLeg: { closedL: 12, closedR: 20 },
      splits: { frontL: 20, frontR: 25, side: 30 },
    })
    expect(SERIES.find((s) => s.id === 'one-leg')?.value(t)).toBe(12)
    expect(SERIES.find((s) => s.id === 'front-split')?.value(t)).toBe(25)
  })

  it('cover every test of the plan', () => {
    for (const t of plan.tests)
      expect(
        SERIES.some((s) => s.testId === t.id),
        t.id,
      ).toBe(true)
  })

  it('draw the aim from the test data, and the broad jump at the height', () => {
    expect(
      aimValue(
        plan.tests.find((t) => t.id === 'dead-hang'),
        175,
      ),
    ).toBe(120)
    expect(
      aimValue(
        plan.tests.find((t) => t.id === 'broad-jump'),
        175,
      ),
    ).toBe(175)
    expect(
      aimValue(
        plan.tests.find((t) => t.id === 'farmer'),
        175,
      ),
    ).toBeUndefined()
  })
})

describe('photo size', () => {
  it('shrinks to 1280 px on the long side and keeps the shape; a small photo stays', async () => {
    const { fitWithin } = await import('@/lib/photos')
    expect(fitWithin(4032, 3024)).toEqual({ width: 1280, height: 960 })
    expect(fitWithin(3024, 4032)).toEqual({ width: 960, height: 1280 })
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 })
  })
})
