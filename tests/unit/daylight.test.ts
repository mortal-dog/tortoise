import { describe, expect, it } from 'vitest'
import { daylight, deviceUtcOffset, formatClock, formatDuration } from '@/lib/daylight'

/**
 * Published NOAA values: the "NOAA_Solar_Calculations_year.xls" spreadsheet of NOAA's Global Monitoring Laboratory
 * (gml.noaa.gov/grad/solcalc), as distributed with its own example inputs: latitude 40 N, longitude 105 W, time zone
 * −7 (local standard time), year 2010, computed at local noon. Values read from its cells on 2026-11-22, in minutes
 * past local midnight. The spreadsheet makes one pass at noon, while the calculator refines sunrise and sunset at their
 * own times, so they agree to within a minute.
 */
const NOAA_2010 = [
  { date: '2010-01-01', noon: 723.69, sunrise: 441.95, sunset: 1005.42, dayMinutes: 563.47 },
  { date: '2010-02-28', noon: 732.5, sunrise: 394.44, sunset: 1070.55, dayMinutes: 676.11 },
  { date: '2010-03-01', noon: 732.3, sunrise: 392.94, sunset: 1071.66, dayMinutes: 678.71 },
  { date: '2010-03-20', noon: 727.39, sunrise: 362.96, sunset: 1091.83, dayMinutes: 728.87 },
  { date: '2010-06-21', noon: 721.82, sunrise: 271.38, sunset: 1172.26, dayMinutes: 900.88 },
  { date: '2010-09-23', noon: 712.32, sunrise: 348.83, sunset: 1075.81, dayMinutes: 726.98 },
  { date: '2010-11-07', noon: 703.66, sunrise: 396.23, sunset: 1011.09, dayMinutes: 614.86 },
  { date: '2010-12-21', noon: 718.2, sunrise: 438.46, sunset: 997.94, dayMinutes: 559.48 },
  { date: '2010-12-31', noon: 723.1, sunrise: 441.78, sunset: 1004.41, dayMinutes: 562.63 },
]

describe("daylight from NOAA's solar equations", () => {
  it.each(NOAA_2010)("matches NOAA's published values on $date", (row) => {
    const d = daylight(row.date, 40, -105, -7 * 60)
    expect(Math.abs((d.sunrise ?? 0) - row.sunrise)).toBeLessThan(1)
    expect(Math.abs((d.sunset ?? 0) - row.sunset)).toBeLessThan(1)
    expect(Math.abs(d.solarNoon - row.noon)).toBeLessThan(0.5)
    expect(Math.abs(d.dayMinutes - row.dayMinutes)).toBeLessThan(1.5)
  })

  it("gives the design mock's Greenwich day: 07:31 – 16:01, 8 h 30 min on Mon 23 Nov 2026", () => {
    const d = daylight('2026-11-23', 51.4769, -0.0005, 0)
    expect(formatClock(d.sunrise ?? 0)).toBe('07:31')
    expect(formatClock(d.sunset ?? 0)).toBe('16:01')
    expect(formatDuration(d.dayMinutes)).toBe('8 h 30 min')
  })

  it('shifts the clock times by the offset on daylight-saving days, not the day length', () => {
    const winter = daylight('2026-03-29', 51.4769, -0.0005, 0)
    const summer = daylight('2026-03-29', 51.4769, -0.0005, 60)
    expect((summer.sunrise ?? 0) - (winter.sunrise ?? 0)).toBeCloseTo(60, 6)
    expect(summer.dayMinutes).toBeCloseTo(winter.dayMinutes, 6)
  })

  it('reads the device offset at local noon (Europe/London in the tests)', () => {
    expect(deviceUtcOffset('2026-03-28')).toBe(0)
    expect(deviceUtcOffset('2026-03-29')).toBe(60)
    expect(deviceUtcOffset('2026-10-25')).toBe(0)
  })

  it('handles a polar day and a polar night', () => {
    const summer = daylight('2026-06-21', 78, 15, 120)
    expect(summer.sunrise).toBeNull()
    expect(summer.dayMinutes).toBe(1440)
    const winter = daylight('2026-12-21', 78, 15, 60)
    expect(winter.sunset).toBeNull()
    expect(winter.dayMinutes).toBe(0)
  })

  it('formats clock times and durations', () => {
    expect(formatClock(451.4)).toBe('07:31')
    expect(formatClock(-30)).toBe('23:30')
    expect(formatClock(1450)).toBe('00:10')
    expect(formatDuration(510)).toBe('8 h 30 min')
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(120)).toBe('2 h')
  })
})
