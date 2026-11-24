import { describe, expect, it } from 'vitest'
import { checkInsDue, levelAfter, maxMinutesThisWeek, rangeStart } from '@/lib/progression'
import type { LevelRecord } from '@/lib/records'
import { coreLadder, pushLadder } from '../fixtures/rules'

const WEEK1 = '2026-11-30'
const AT = '2026-12-01T12:00:00Z'
const rec = (level: number, since: string, extra: Partial<LevelRecord> = {}): LevelRecord => ({
  ladderId: 'push',
  level,
  since,
  history: [{ level, date: since }],
  updatedAt: AT,
  ...extra,
})
const due = (levels: Map<string, LevelRecord>, today: string, lastDone = new Map<string, string>()) =>
  checkInsDue([pushLadder], levels, lastDone, today, WEEK1)

describe('check-ins (D-069)', () => {
  it('come every askEveryDays from Week 1, none in Week 0', () => {
    expect(due(new Map(), '2026-11-28')).toEqual([])
    expect(due(new Map(), '2026-12-13')).toEqual([]) // 13 days into Week 1
    const [c] = due(new Map(), '2026-12-14')
    expect(c?.current.level).toBe(1)
    expect(c?.harder?.level).toBe(2)
    expect(c?.easier).toBeUndefined()
    expect(c?.afterTimeOff).toBe(false)
  })

  it('count from the last check-in or level change, and after "easier" from a week', () => {
    const asked = new Map([['push', rec(2, '2026-12-14', { askedAt: '2026-12-28' })]])
    expect(due(asked, '2027-01-10')).toEqual([])
    expect(due(asked, '2027-01-11')).toHaveLength(1)
    const eased = new Map([['push', rec(1, '2026-12-28', { askedAt: '2026-12-28', eased: true })]])
    expect(due(eased, '2027-01-03')).toEqual([])
    expect(due(eased, '2027-01-04')).toHaveLength(1)
  })

  it('come at once, "easier" first, after two weeks without the ladder', () => {
    const levels = new Map([['push', rec(3, '2026-12-28', { askedAt: '2026-12-28' })]])
    const [c] = due(levels, '2027-01-05', new Map([['push', '2026-12-22']]))
    expect(c?.afterTimeOff).toBe(true)
    expect(c?.easier?.level).toBe(2)
  })

  it('offer no "harder" at the top, and move one level for an answer', () => {
    const top = pushLadder.levels.at(-1)?.level ?? 0
    const [c] = due(new Map([['push', rec(top, WEEK1)]]), '2026-12-14')
    expect(c?.harder).toBeUndefined()
    expect(c && levelAfter(c, 'harder')).toBe(top)
    expect(c && levelAfter(c, 'easier')).toBe(top - 1)
    expect(c && levelAfter(c, 'keep')).toBe(top)
  })

  it('skip a ladder with a single level', () => {
    const single = { ...coreLadder, levels: coreLadder.levels.slice(0, 1) }
    expect(checkInsDue([single], new Map(), new Map(), '2026-12-28', WEEK1)).toEqual([])
  })
})

describe('the 10% rule and the working range', () => {
  it('cap the weekly minutes and start a third below the pass', () => {
    expect(maxMinutesThisWeek(60)).toBe(66)
    expect(maxMinutesThisWeek(45)).toBe(49)
    expect(rangeStart(12)).toBe(8)
    expect(rangeStart(15)).toBe(10)
  })
})
