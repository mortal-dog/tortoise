import { describe, expect, it } from 'vitest'
import { plan, sessionById } from '@/data/plan'
import { type Session, WEEKDAYS } from '@/data/schema'
import { badges, LABEL_MAX } from '@/lib/badges'
import { computeMetrics, type Metrics, metricKey } from '@/lib/milestones'
import { dayItems } from '@/lib/plan-view'

const none = new Map<string, { earnedAt: string }>()

/** The metric value that just meets a milestone, and one that just misses it. */
function at(m: (typeof plan.milestones)[number], miss: boolean): Metrics {
  const step = m.direction === 'atLeast' ? -1 : 1
  return { [metricKey(m)]: miss ? m.threshold + step * 0.5 : m.threshold }
}

describe('badges (D-058)', () => {
  it('give every milestone a badge with a way to earn it and an icon', () => {
    const list = badges(plan.milestones, {}, none)
    expect(list.map((b) => b.milestone.id)).toEqual(plan.milestones.map((m) => m.id))
    for (const b of list) {
      expect(b.how.length, b.milestone.id).toBeGreaterThan(20)
      expect(b.icon, b.milestone.id).toBeDefined()
      expect(b.earned, b.milestone.id).toBe(false)
    }
  })

  it('have a real name that fits one line under the medal, each one different, never the rule (D-070)', () => {
    const list = badges(plan.milestones, {}, none)
    for (const b of list) {
      const name = b.milestone.name
      expect(name.length, b.milestone.id).toBeLessThanOrEqual(LABEL_MAX)
      expect(name.length, b.milestone.id).toBeGreaterThan(0)
      // A digit means a threshold or level code leaked into the name: "Push L3", "Road 100 km".
      expect(name, b.milestone.id).not.toMatch(/\d/)
    }
    expect(new Set(list.map((b) => b.milestone.name)).size).toBe(list.length)
  })

  it('can each be earned: the metric is computed, a level exists on a ladder the week uses (D-068)', () => {
    const used = new Set(
      [...WEEKDAYS.flatMap((d) => [plan.week[d].morning, plan.week[d].main, plan.week[d].split])]
        .filter((id): id is string => !!id)
        .flatMap((id) => sessionById.get(id)?.steps.map((st) => st.ladderId) ?? []),
    )
    const computed = new Set(
      Object.keys(
        computeMetrics({
          days: [],
          levels: [],
          longestStreak: 0,
          longestDoneRun: 0,
          kindOf: () => undefined,
        }),
      ),
    )
    for (const m of plan.milestones) {
      if (m.metric === 'level') {
        expect(used.has(m.ladderId), `${m.id}: its ladder is in the week`).toBe(true)
        const top = plan.ladders.find((l) => l.id === m.ladderId)?.levels.at(-1)?.level ?? 0
        expect(m.threshold, `${m.id}: at most the ladder's top`).toBeLessThanOrEqual(top)
        expect(m.threshold, `${m.id}: above the first level`).toBeGreaterThan(1)
      } else {
        expect(computed.has(m.metric), `${m.id}: ${m.metric} is computed`).toBe(true)
        expect(m.threshold, m.id).toBeGreaterThan(0)
      }
    }
  })

  it('are earned the moment the goal is reached, before the award is stored, and not a step before', () => {
    for (const m of plan.milestones) {
      const reached = badges([m], at(m, false), none)[0]
      const short = badges([m], at(m, true), none)[0]
      expect(reached?.earned, `${m.id} at the threshold`).toBe(true)
      expect(short?.earned, `${m.id} just short`).toBe(false)
    }
  })

  it('stay earned once stored, whatever the metrics say now', () => {
    const stored = new Map(plan.milestones.map((m) => [m.id, { earnedAt: '2027-01-01' }]))
    for (const b of badges(plan.milestones, {}, stored)) {
      expect(b.earned, b.milestone.id).toBe(true)
      expect(b.earnedAt).toBe('2027-01-01')
    }
  })

  it('climb the metals along one ladder or metric: bronze, gold, jade, sapphire', () => {
    const tiers = badges(plan.milestones, {}, none)
      .filter((b) => b.milestone.ladderId === 'handstand-skill')
      .map((b) => b.tier)
    expect(tiers).toEqual(['bronze', 'gold', 'jade', 'sapphire'])
    const row = badges(plan.milestones, {}, none).find((b) => b.milestone.id === 'row-3')
    expect(row?.tier).toBe('gold')
    expect(row?.how).toContain('One-arm row, a 2-s squeeze at the top and 3 s down')
    expect(badges(plan.milestones, {}, none).find((b) => b.milestone.id === 'hatchling')?.tier).toBe('bronze')
  })
})

describe('the day page items (D-057)', () => {
  const strengthA = sessionById.get('strength-a') as Session
  const levels = new Map()
  const AT = '2026-12-01T10:00:00Z'

  it('mark nothing on a day still to come', () => {
    for (const i of dayItems(strengthA, 'outdoor', levels, undefined, undefined, false))
      expect(i.done).toBeUndefined()
  })

  it('mark every step done after "Done as planned", and none when the part was not done', () => {
    expect(dayItems(strengthA, 'outdoor', levels, undefined, { doneAt: AT }, true).every((i) => i.done)).toBe(
      true,
    )
    expect(dayItems(strengthA, 'outdoor', levels, undefined, null, true).every((i) => i.done === false)).toBe(
      true,
    )
  })

  it('mark only the steps the player finished', () => {
    const items = dayItems(strengthA, 'outdoor', levels, undefined, { doneAt: AT, steps: ['a1', 'a2'] }, true)
    expect(items.filter((i) => i.done).map((i) => i.stepId)).toEqual(['a1', 'a2'])
    expect(items.find((i) => i.stepId === 'b1')?.done).toBe(false)
  })

  it('name each step with its video, and the walk indoors on a run day', () => {
    const items = dayItems(strengthA, 'outdoor', levels, undefined, undefined, false)
    expect(items.find((i) => i.stepId === 'a1')).toMatchObject({
      name: 'Squat L1',
      exercise: 'Goblet squat (one dumbbell held at the chest)',
    })
    expect(items.find((i) => i.stepId === 'a1')?.videoUrl).toMatch(/youtube\.com/)
    const run = sessionById.get('easy-run') as Session
    expect(dayItems(run, 'indoor', levels, undefined, undefined, false).map((i) => i.stepId)).toContain(
      'indoor-walk',
    )
  })
})
