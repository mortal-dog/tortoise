import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import type { Milestone } from '@/data/schema'
import { computeMetrics, metricKey, newlyEarned, progress, reached } from '@/lib/milestones'
import type { DayRecord, LevelRecord } from '@/lib/records'

const m = (id: string, metric: Milestone['metric'], threshold: number, ladderId?: string): Milestone => ({
  id,
  name: id,
  group: 'ability',
  kind: metric === 'level' ? 'level' : 'count',
  metric,
  ...(ladderId ? { ladderId } : {}),
  direction: 'atLeast',
  threshold,
  sources: [],
  ourRule: true,
})

const AT = '2026-12-01T12:00:00Z'

describe('the milestone engine', () => {
  it('reads a level milestone from its own ladder', () => {
    const push3 = m('push-3', 'level', 3, 'push')
    expect(metricKey(push3)).toBe('level:push')
    expect(reached(push3, { 'level:push': 3 })).toBe(true)
    expect(reached(push3, { 'level:push': 2, 'level:squat': 5 })).toBe(false)
    expect(reached(push3, {})).toBe(false)
  })

  it('earns each milestone once', () => {
    const list = [m('a', 'splitBlocks', 10), m('b', 'splitBlocks', 20)]
    expect(newlyEarned(list, { splitBlocks: 25 }, new Set(['a'])).map((x) => x.id)).toEqual(['b'])
  })

  it('measures progress toward a threshold', () => {
    expect(progress(m('p', 'level', 4, 'push'), { 'level:push': 1 })).toBe(0)
    expect(progress(m('p', 'level', 4, 'push'), { 'level:push': 2 })).toBeCloseTo(1 / 3, 10)
    expect(progress(m('s', 'splitBlocks', 50), {})).toBe(0)
  })

  it('computes metrics from days and levels; a level once reached still counts after a step back', () => {
    const days: DayRecord[] = [
      {
        date: '2026-12-05',
        main: { doneAt: AT, sessionId: 'long', variant: 'outdoor', minutes: 50, distanceKm: 7 },
        split: { doneAt: AT, kind: 'both' },
        updatedAt: AT,
      },
      {
        date: '2026-12-08',
        main: { doneAt: AT, sessionId: 'easy-run', variant: 'indoor', minutes: 35 },
        split: { doneAt: AT, kind: 'front' },
        updatedAt: AT,
      },
      {
        date: '2026-12-09',
        main: { doneAt: AT, sessionId: 'strength-b', variant: 'outdoor' },
        updatedAt: AT,
      },
    ]
    const levels: LevelRecord[] = [
      {
        ladderId: 'push',
        level: 2,
        since: '2027-01-10',
        history: [
          { level: 3, date: '2026-12-20' },
          { level: 2, date: '2027-01-10' },
        ],
        updatedAt: AT,
      },
      {
        ladderId: 'squat',
        level: 4,
        since: '2027-01-03',
        history: [{ level: 4, date: '2027-01-03' }],
        updatedAt: AT,
      },
    ]
    const kinds: Record<string, 'long' | 'run' | 'strength'> = {
      long: 'long',
      'easy-run': 'run',
      'strength-b': 'strength',
    }
    const metrics = computeMetrics({
      days,
      levels,
      longestStreak: 12,
      longestDoneRun: 7,
      kindOf: (id) => kinds[id],
    })
    expect(metrics).toMatchObject({
      streak: 12,
      noMissDays: 7,
      outdoorSessions: 2,
      runKm: 7,
      continuousRunKm: 7,
      longRunMin: 50,
      splitBlocks: 2,
      'level:push': 3,
      'level:squat': 4,
    })
  })

  it('give every level milestone a ladder and a level that exist (D-067)', () => {
    for (const ms of plan.milestones.filter((x) => x.metric === 'level')) {
      const ladder = plan.ladders.find((l) => l.id === ms.ladderId)
      expect(ladder, ms.id).toBeDefined()
      expect(
        ladder?.levels.some((l) => l.level === ms.threshold),
        ms.id,
      ).toBe(true)
    }
    for (const ms of plan.milestones.filter((x) => x.metric !== 'level'))
      expect(ms.ladderId, ms.id).toBeUndefined()
  })
})
