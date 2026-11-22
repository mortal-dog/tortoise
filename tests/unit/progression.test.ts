import { describe, expect, it } from 'vitest'
import { canStepUp, type LadderLog, maxMinutesThisWeek, rangeStart, suggest } from '@/lib/progression'
import { coreLadder, pushLadder } from '../fixtures/rules'

const log = (
  date: string,
  level: number,
  reps: number[],
  feedback: LadderLog['feedback'] = 'right',
): LadderLog => ({
  date,
  level,
  sets: reps.map((r) => ({ reps: r })),
  feedback,
})

describe('progression suggestions (design §5.3)', () => {
  it('suggests the next level after two sessions in a row at the top of the range', () => {
    const logs = [log('2026-12-01', 1, [15, 15, 15]), log('2026-12-03', 1, [15, 15, 15], 'easy')]
    expect(suggest(pushLadder, 1, logs, '2026-12-04')).toMatchObject({ kind: 'up', to: { level: 2 } })
  })

  it('does not suggest it after one such session, a short set, or a "too hard"', () => {
    expect(suggest(pushLadder, 1, [log('2026-12-03', 1, [15, 15, 15])], '2026-12-04')).toBeNull()
    expect(
      suggest(
        pushLadder,
        1,
        [log('2026-12-01', 1, [15, 15, 15]), log('2026-12-03', 1, [15, 15, 14])],
        '2026-12-04',
      ),
    ).toBeNull()
    expect(
      suggest(
        pushLadder,
        1,
        [log('2026-12-01', 1, [15, 15, 15]), log('2026-12-03', 1, [15, 15, 15], 'hard')],
        '2026-12-04',
      ),
    ).toBeNull()
  })

  it('suggests one level down after two "too hard" in a row', () => {
    const logs = [log('2026-12-01', 2, [8, 7, 6], 'hard'), log('2026-12-03', 2, [8, 7, 6], 'hard')]
    expect(suggest(pushLadder, 2, logs, '2026-12-04')).toMatchObject({ kind: 'down', to: { level: 1 } })
    expect(
      suggest(
        pushLadder,
        1,
        logs.map((l) => ({ ...l, level: 1 })),
        '2026-12-04',
      ),
    ).toBeNull()
  })

  it('suggests one level down for a week after 14 days with no logs', () => {
    const logs = [log('2026-12-01', 3, [10, 10, 10])]
    expect(suggest(pushLadder, 3, logs, '2026-12-14')).toBeNull()
    expect(suggest(pushLadder, 3, logs, '2026-12-15')).toMatchObject({
      kind: 'down-for-a-week',
      to: { level: 2 },
    })
  })

  it('moves holds up when all sets reach the target time', () => {
    const hold = (s: number[]): LadderLog => ({
      date: '2026-12-02',
      level: 1,
      sets: s.map((x) => ({ seconds: x })),
    })
    expect(suggest(coreLadder, 1, [hold([30, 30, 30])], '2026-12-03')).toMatchObject({ kind: 'up' })
    expect(suggest(coreLadder, 1, [hold([30, 30, 25])], '2026-12-03')).toBeNull()
  })

  it('never suggests past the top level', () => {
    const logs = [log('2026-12-01', 3, [12, 12, 12]), log('2026-12-03', 3, [12, 12, 12])]
    expect(suggest(pushLadder, 3, logs, '2026-12-04')).toBeNull()
  })

  it('moves endurance steps only after 7 days, and caps weekly growth at 10%', () => {
    expect(canStepUp('2026-12-01', '2026-12-07')).toBe(false)
    expect(canStepUp('2026-12-01', '2026-12-08')).toBe(true)
    expect(maxMinutesThisWeek(60)).toBe(66)
    expect(maxMinutesThisWeek(45)).toBe(49)
  })

  it('starts a new level about a third below its pass number', () => {
    expect(rangeStart(12)).toBe(8)
    expect(rangeStart(15)).toBe(10)
  })
})
