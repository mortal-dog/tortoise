import { describe, expect, it } from 'vitest'
import { addDays, compareDates, type LocalDate } from '@/lib/dates'
import { currentStreak, type DayFacts, dayStatus, longestDoneRun, longestStreak } from '@/lib/status'

const W0 = '2026-11-23'
const AT = '2026-11-30T12:00:00Z'
const full: DayFacts = { morning: { doneAt: AT }, main: { doneAt: AT } }
const shell: DayFacts = { morning: { doneAt: AT } }
const mainOnly: DayFacts = { main: { doneAt: AT } }
const sick: DayFacts = { paused: 'sick' }

describe('day status (design §5.2)', () => {
  it('is Full with both parts, Shell with either one alone', () => {
    expect(dayStatus(full, '2026-11-24', '2026-11-30', W0)).toBe('full')
    expect(dayStatus(shell, '2026-11-24', '2026-11-30', W0)).toBe('shell')
    expect(dayStatus(mainOnly, '2026-11-24', '2026-11-30', W0)).toBe('shell')
  })

  it('done beats paused; paused beats missed', () => {
    expect(dayStatus({ ...shell, paused: 'sick' }, '2026-11-24', '2026-11-30', W0)).toBe('shell')
    expect(dayStatus(sick, '2026-11-24', '2026-11-30', W0)).toBe('paused')
    expect(dayStatus(undefined, '2026-11-24', '2026-11-30', W0)).toBe('missed')
    expect(dayStatus({ paused: null }, '2026-11-24', '2026-11-30', W0)).toBe('missed')
  })

  it('is Ahead for future days and for today while nothing is done', () => {
    expect(dayStatus(undefined, '2026-11-30', '2026-11-30', W0)).toBe('ahead')
    expect(dayStatus(undefined, '2026-12-01', '2026-11-30', W0)).toBe('ahead')
    expect(dayStatus(shell, '2026-11-30', '2026-11-30', W0)).toBe('shell')
  })

  it('has no status before Week 0', () => {
    expect(dayStatus(full, '2026-11-22', '2026-11-30', W0)).toBe('none')
  })
})

/** Builds a status function from a string, one character a day from Week 0: F full, S shell, M missed, P paused. */
function history(pattern: string, start: LocalDate = W0) {
  const facts = new Map<LocalDate, DayFacts>()
  ;[...pattern].forEach((c, i) => {
    const d = addDays(start, i)
    if (c === 'F') facts.set(d, full)
    if (c === 'S') facts.set(d, shell)
    if (c === 'P') facts.set(d, sick)
  })
  const todayDate = addDays(start, pattern.length - 1)
  return {
    todayDate,
    statusOf: (d: LocalDate) => dayStatus(facts.get(d), d, todayDate, W0),
  }
}

const streak = (pattern: string) => {
  const h = history(pattern)
  return currentStreak(h.statusOf, h.todayDate, W0)
}

describe('the tortoise streak', () => {
  it('counts done days, Full or Shell', () => {
    expect(streak('FFSF')).toBe(4)
  })

  it('counts from yesterday while today has nothing done', () => {
    expect(streak('FFF-')).toBe(3)
  })

  it('bridges one missed day without counting it', () => {
    expect(streak('FFMFF')).toBe(4)
    expect(streak('FFMFM-')).toBe(3) // yesterday missed, today not yet done
  })

  it('ends on two missed days in a row', () => {
    expect(streak('FFFMMFF')).toBe(2)
    expect(streak('FFMM-')).toBe(0)
  })

  it('skips paused days: they add nothing and end nothing', () => {
    expect(streak('FFPPPFF')).toBe(4)
    expect(streak('FFPMF')).toBe(3)
  })

  it('does not let paused days come between two missed days', () => {
    expect(streak('FFMPMFF')).toBe(2)
    expect(streak('FFMPPPMF')).toBe(1)
  })

  it('never reaches back before Week 0', () => {
    const facts = new Map<LocalDate, DayFacts>([
      ['2026-11-20', full],
      ['2026-11-21', full],
      ['2026-11-22', full],
      ['2026-11-23', full],
    ])
    const statusOf = (d: LocalDate) => dayStatus(facts.get(d), d, '2026-11-23', W0)
    expect(currentStreak(statusOf, '2026-11-23', W0)).toBe(1)
  })

  it('is zero on the first day of Week 0 before anything is done', () => {
    expect(streak('-')).toBe(0)
  })
})

describe('the longest streak and the longest run with none missed', () => {
  it('finds the largest count in the history', () => {
    const h = history('FFFFFMMFFMFF-')
    expect(longestStreak(h.statusOf, h.todayDate, W0)).toBe(5)
    expect(currentStreak(h.statusOf, h.todayDate, W0)).toBe(4)
  })

  it('counts days in a row with none missed for the Hatchling', () => {
    const h = history('FFFMFFFFFFFM')
    expect(longestDoneRun(h.statusOf, h.todayDate, W0)).toBe(7)
  })
})

describe('performance', () => {
  it('handles a 22,000-day history (60 years) quickly', () => {
    const pattern = Array.from({ length: 22_000 }, (_, i) =>
      i % 97 === 0 ? 'M' : i % 13 === 0 ? 'P' : 'S',
    ).join('')
    const h = history(pattern)
    const t0 = performance.now()
    const best = longestStreak(h.statusOf, h.todayDate, W0)
    const now = currentStreak(h.statusOf, h.todayDate, W0)
    const ms = performance.now() - t0
    expect(best).toBeGreaterThan(20_000)
    expect(now).toBe(best)
    expect(compareDates(h.todayDate, '2086-01-01')).toBeGreaterThan(0)
    expect(ms).toBeLessThan(1500)
  })
})
