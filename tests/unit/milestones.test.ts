import { describe, expect, it } from 'vitest'
import type { Milestone } from '@/data/schema'
import { computeMetrics, newlyEarned, progress, reached } from '@/lib/milestones'
import type { DayRecord, TestRecord } from '@/lib/records'

const m = (
  id: string,
  metric: Milestone['metric'],
  threshold: number,
  direction: Milestone['direction'] = 'atLeast',
): Milestone => ({
  id,
  name: id,
  group: 'ability',
  kind: 'test',
  metric,
  direction,
  threshold,
  sources: [],
  ourRule: true,
})

const AT = '2026-12-01T12:00:00Z'
const test = (
  date: string,
  results: TestRecord['results'],
  computed: TestRecord['computed'] = {},
): TestRecord => ({
  date,
  results,
  computed,
  updatedAt: AT,
})

describe('the milestone engine', () => {
  it('reaches atLeast and atMost thresholds', () => {
    expect(reached(m('push-10', 'pushups', 10), { pushups: 10 })).toBe(true)
    expect(reached(m('push-10', 'pushups', 10), { pushups: 9 })).toBe(false)
    expect(reached(m('front-20', 'frontSplitCm', 20, 'atMost'), { frontSplitCm: 19 })).toBe(true)
    expect(reached(m('front-20', 'frontSplitCm', 20, 'atMost'), {})).toBe(false)
  })

  it('earns each milestone once', () => {
    const list = [m('a', 'pushups', 10), m('b', 'pushups', 20)]
    expect(newlyEarned(list, { pushups: 25 }, new Set(['a'])).map((x) => x.id)).toEqual(['b'])
  })

  it('measures progress, with the first measurement as the start for split distances', () => {
    expect(progress(m('p', 'pushups', 40), { pushups: 10 })).toBe(0.25)
    expect(progress(m('f', 'frontSplitCm', 10, 'atMost'), { frontSplitCm: 20 }, 30)).toBe(0.5)
  })

  it('computes metrics from days and tests', () => {
    const days: DayRecord[] = [
      {
        date: '2026-12-05',
        main: { doneAt: AT, sessionId: 'long', variant: 'outdoor', minutes: 50, distanceKm: 7 },
        updatedAt: AT,
      },
      {
        date: '2026-12-08',
        main: { doneAt: AT, sessionId: 'easy-run', variant: 'indoor', minutes: 35 },
        updatedAt: AT,
      },
      {
        date: '2026-12-09',
        main: { doneAt: AT, sessionId: 'strength-b', variant: 'outdoor' },
        updatedAt: AT,
      },
    ]
    const tests = [
      test(
        '2026-11-28',
        {
          pushups: 12,
          wallCm: 0,
          jumpReachCm: 40,
          heightCm: 178,
          splits: { frontL: 30, frontR: 35, side: 40 },
        },
        { vo2max: 40 },
      ),
      test(
        '2027-02-20',
        { pushups: 18, wallCm: 0, jumpReachCm: 44, oneLeg: { closedL: 12, closedR: 8 } },
        { vo2max: 44, sitRiseScore: 9 },
      ),
    ]
    const kinds: Record<string, 'long' | 'run' | 'strength'> = {
      long: 'long',
      'easy-run': 'run',
      'strength-b': 'strength',
    }
    const metrics = computeMetrics({
      days,
      tests,
      logs: [],
      longestStreak: 12,
      longestDoneRun: 7,
      kindOf: (id) => kinds[id],
    })
    expect(metrics).toMatchObject({
      streak: 12,
      noMissDays: 7,
      outdoorSessions: 2,
      runKm: 7,
      longRunMin: 50,
      pushups: 18,
      frontSplitCm: 35,
      sideSplitCm: 40,
      oneLegClosedS: 8,
      sitRise: 9,
      jumpReachCm: 44,
      wallZeroTests: 2,
    })
    expect(metrics.vo2maxGainPct).toBeCloseTo(10, 10)
  })
})
