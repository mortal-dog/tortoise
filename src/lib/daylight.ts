// Sunrise, sunset, solar noon and day length from NOAA's solar equations (public domain; NOAA Global Monitoring
// Laboratory, Solar Calculator). Computed on the phone, with no network. Times are minutes past local midnight.
import type { LocalDate } from './dates'

const rad = (d: number) => (Math.PI * d) / 180
const deg = (r: number) => (180 * r) / Math.PI

/** Julian day at 0 h UTC of a calendar date. */
function julianDay(y: number, m: number, d: number): number {
  let year = y
  let month = m
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const a = Math.floor(year / 100)
  const b = 2 - a + Math.floor(a / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + d + b - 1524.5
}

const century = (jd: number) => (jd - 2451545) / 36525

function geomMeanLongSun(t: number): number {
  const l = (280.46646 + t * (36000.76983 + t * 0.0003032)) % 360
  return l < 0 ? l + 360 : l
}
const geomMeanAnomalySun = (t: number) => 357.52911 + t * (35999.05029 - 0.0001537 * t)
const eccentricity = (t: number) => 0.016708634 - t * (0.000042037 + 0.0000001267 * t)

function sunEqOfCenter(t: number): number {
  const m = rad(geomMeanAnomalySun(t))
  return (
    Math.sin(m) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(2 * m) * (0.019993 - 0.000101 * t) +
    Math.sin(3 * m) * 0.000289
  )
}

function apparentLong(t: number): number {
  const omega = 125.04 - 1934.136 * t
  return geomMeanLongSun(t) + sunEqOfCenter(t) - 0.00569 - 0.00478 * Math.sin(rad(omega))
}

function obliquity(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813))
  const e0 = 23 + (26 + seconds / 60) / 60
  return e0 + 0.00256 * Math.cos(rad(125.04 - 1934.136 * t))
}

function declination(t: number): number {
  return deg(Math.asin(Math.sin(rad(obliquity(t))) * Math.sin(rad(apparentLong(t)))))
}

/** The equation of time, in minutes. */
function equationOfTime(t: number): number {
  const eps = obliquity(t)
  const l0 = rad(geomMeanLongSun(t))
  const e = eccentricity(t)
  const m = rad(geomMeanAnomalySun(t))
  let y = Math.tan(rad(eps) / 2)
  y *= y
  const v =
    y * Math.sin(2 * l0) -
    2 * e * Math.sin(m) +
    4 * e * y * Math.sin(m) * Math.cos(2 * l0) -
    0.5 * y * y * Math.sin(4 * l0) -
    1.25 * e * e * Math.sin(2 * m)
  return deg(v) * 4
}

/** Hour angle of sunrise in degrees, or NaN when the sun does not rise or set that day. */
function hourAngleSunrise(lat: number, dec: number): number {
  const arg =
    Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(rad(dec))) -
    Math.tan(rad(lat)) * Math.tan(rad(dec))
  return arg < -1 || arg > 1 ? Number.NaN : deg(Math.acos(arg))
}

/** Minutes past 0 h UTC of the date's sunrise (rise) or sunset, refined once at the first estimate's time. */
function riseSetUtc(rise: boolean, jd: number, lat: number, lon: number): number {
  const at = (jdx: number) => {
    const t = century(jdx)
    const ha = hourAngleSunrise(lat, declination(t))
    const delta = lon + (rise ? ha : -ha)
    return 720 - 4 * delta - equationOfTime(t)
  }
  const first = at(jd)
  return Number.isNaN(first) ? Number.NaN : at(jd + first / 1440)
}

export interface Daylight {
  /** Minutes past local midnight; null when the sun does not rise or set. */
  sunrise: number | null
  sunset: number | null
  solarNoon: number
  /** Minutes from sunrise to sunset: 1440 in a polar day, 0 in a polar night. */
  dayMinutes: number
}

/**
 * @param lat degrees, north positive
 * @param lon degrees, east positive (west negative)
 * @param utcOffsetMinutes the local offset from UTC on that date, e.g. −300 for UTC−5
 */
export function daylight(date: LocalDate, lat: number, lon: number, utcOffsetMinutes: number): Daylight {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const jd = julianDay(y, m, d)
  const noonFirst = 720 - 4 * lon - equationOfTime(century(jd - lon / 360))
  const solarNoon = 720 - 4 * lon - equationOfTime(century(jd + noonFirst / 1440)) + utcOffsetMinutes
  const riseUtc = riseSetUtc(true, jd, lat, lon)
  const setUtc = riseSetUtc(false, jd, lat, lon)
  if (Number.isNaN(riseUtc) || Number.isNaN(setUtc)) {
    const dec = declination(century(jd + 0.5))
    const polarDay = lat * dec > 0
    return { sunrise: null, sunset: null, solarNoon, dayMinutes: polarDay ? 1440 : 0 }
  }
  return {
    sunrise: riseUtc + utcOffsetMinutes,
    sunset: setUtc + utcOffsetMinutes,
    solarNoon,
    dayMinutes: setUtc - riseUtc,
  }
}

/** The device's offset from UTC, in minutes, at local noon of a date (so daylight-saving days are right). */
export function deviceUtcOffset(date: LocalDate): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number]
  const offset = -new Date(y, m - 1, d, 12).getTimezoneOffset()
  return offset === 0 ? 0 : offset
}

/** "07:31": minutes past midnight, rounded to the minute and wrapped into one day. */
export function formatClock(minutes: number): string {
  const total = (((Math.round(minutes) % 1440) + 1440) % 1440) as number
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

/** "8 h 30 min". */
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes)
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h} h` : `${h} h ${m} min`
}
