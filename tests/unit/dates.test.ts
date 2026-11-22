import { describe, expect, it } from 'vitest'
import {
  addDays,
  dayNumber,
  daysBetween,
  defaultWeek0Monday,
  formatShort,
  fromDayNumber,
  isLocalDate,
  localDateOf,
  mondayOf,
  weekday,
} from '@/lib/dates'

describe('local dates', () => {
  it('round-trip through day numbers for every day of 1900–2100', () => {
    for (let n = dayNumber('1900-01-01'); n <= dayNumber('2100-12-31'); n += 1) {
      expect(dayNumber(fromDayNumber(n))).toBe(n)
    }
  })

  it('handle 29 February and year ends', () => {
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2028-02-29', 1)).toBe('2028-03-01')
    expect(addDays('2027-02-28', 1)).toBe('2027-03-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2027-01-01', -1)).toBe('2026-12-31')
    expect(daysBetween('2100-02-28', '2100-03-01')).toBe(1) // 2100 is not a leap year
    expect(isLocalDate('2028-02-29')).toBe(true)
    expect(isLocalDate('2027-02-29')).toBe(false)
  })

  it('know the weekday', () => {
    expect(weekday('2026-11-23')).toBe('mon')
    expect(weekday('2026-11-22')).toBe('sun')
    expect(weekday('1970-01-01')).toBe('thu')
    expect(weekday('2100-01-01')).toBe('fri')
    expect(mondayOf('2026-11-29')).toBe('2026-11-23')
    expect(mondayOf('2026-11-23')).toBe('2026-11-23')
  })

  it('do not move across daylight-saving changes (Europe/London in the tests)', () => {
    // 29 March 2026: clocks go forward at 01:00; 25 October 2026: back at 02:00.
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
    expect(daysBetween('2026-03-01', '2026-04-01')).toBe(31)
    // The local date of an instant follows the local clock, not UTC.
    expect(localDateOf(new Date('2026-06-30T23:30:00Z'))).toBe('2026-07-01')
    expect(localDateOf(new Date('2026-12-31T23:30:00Z'))).toBe('2026-12-31')
  })

  it('choose the Week 0 Monday: today on a Monday, else the coming Monday', () => {
    expect(defaultWeek0Monday('2026-11-23')).toBe('2026-11-23')
    expect(defaultWeek0Monday('2026-11-22')).toBe('2026-11-23')
    expect(defaultWeek0Monday('2026-11-24')).toBe('2026-11-30')
  })

  it('format the Today header date', () => {
    expect(formatShort('2026-11-23')).toBe('Mon 23 Nov')
  })
})
