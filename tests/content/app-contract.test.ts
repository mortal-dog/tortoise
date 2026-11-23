// What the app's logic and screens rely on in the plan data.
import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import { rules } from '../fixtures/rules'

describe('the plan data and the app', () => {
  it('has the block rules of design §5.1 (the calendar tests use the same values)', () => {
    const { intervalStages, sources: _s, ourRule: _o, ...rest } = plan.blockRules
    const { intervalStages: fixtureStages, sources: _fs, ourRule: _fo, ...fixtureRest } = rules
    expect(rest).toEqual(fixtureRest)
    expect(
      intervalStages.map((s) => [s.stage, s.fromBlock, s.set.repeats, s.set.workS, s.set.restS]),
    ).toEqual(fixtureStages.map((s) => [s.stage, s.fromBlock, s.set.repeats, s.set.workS, s.set.restS]))
  })

  it('names the split sessions the Today screen records by kind', () => {
    const splits = new Set(Object.values(plan.week).map((d) => d.split))
    expect(splits).toEqual(new Set(['split-front', 'split-side', 'split-short', null]))
    expect(plan.week.sun.main).toBe('light')
  })

  it('uses one morning block every day', () => {
    expect(new Set(Object.values(plan.week).map((d) => d.morning)).size).toBe(1)
  })

  it('gives run days their outdoor and indoor variants', () => {
    for (const day of ['tue', 'sat'] as const) {
      const s = plan.sessions.find((x) => x.id === plan.week[day].main)
      expect(s?.hasVariants).toBe(true)
      expect(s?.steps.some((st) => st.variant === 'outdoor')).toBe(true)
      expect(s?.steps.some((st) => st.variant === 'indoor')).toBe(true)
    }
  })
})
