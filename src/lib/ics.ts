// The reminders' calendar file (design §9): iCalendar (RFC 5545) with weekly repeating events, each with an alarm at
// its start. Times are floating local times (no "Z", no TZID), so the events follow the phone's time zone.
import { plan } from '@/data/plan'
import { WEEKDAYS, type Weekday } from '@/data/schema'
import { addDays, dayName, type LocalDate, weekday } from './dates'
import { sessionOf } from './plan-view'
import type { SettingsRecord } from './records'

export const CRLF = '\r\n'
/** RFC 5545 §3.1: a content line should not be longer than 75 octets, excluding the line break. */
export const MAX_OCTETS = 75

const BYDAY: Record<Weekday, string> = {
  mon: 'MO',
  tue: 'TU',
  wed: 'WE',
  thu: 'TH',
  fri: 'FR',
  sat: 'SA',
  sun: 'SU',
}

/** Escapes a TEXT value (RFC 5545 §3.3.11): backslash, semicolon, comma and line breaks. */
export function escapeText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r\n|\r|\n/g, '\\n')
}

const encoder = new TextEncoder()

/**
 * Folds one content line (RFC 5545 §3.1): no physical line is longer than 75 octets, and each continuation starts
 * with one space, which counts toward its 75. A multi-octet UTF-8 character is never split.
 */
export function foldLine(line: string): string {
  if (encoder.encode(line).length <= MAX_OCTETS) return line
  const out: string[] = []
  let current = ''
  let octets = 0
  let limit = MAX_OCTETS
  for (const ch of line) {
    const size = encoder.encode(ch).length
    if (octets + size > limit) {
      out.push(current)
      current = ''
      octets = 0
      limit = MAX_OCTETS - 1 // the leading space of a continuation line
    }
    current += ch
    octets += size
  }
  out.push(current)
  return out.join(`${CRLF} `)
}

/** Joins content lines into a calendar file: every line folded, every line ending in CRLF. */
export function serialize(lines: readonly string[]): string {
  return lines.map((l) => `${foldLine(l)}${CRLF}`).join('')
}

const pad = (n: number) => String(n).padStart(2, '0')

/** A floating DATE-TIME (RFC 5545 §3.3.5, form 1): local time with no zone. */
export function floatingDateTime(date: LocalDate, clock: string): string {
  return `${date.replace(/-/g, '')}T${clock.replace(':', '')}00`
}

/** A UTC DATE-TIME for DTSTAMP. */
export function utcDateTime(at: Date): string {
  return (
    `${at.getUTCFullYear()}${pad(at.getUTCMonth() + 1)}${pad(at.getUTCDate())}` +
    `T${pad(at.getUTCHours())}${pad(at.getUTCMinutes())}${pad(at.getUTCSeconds())}Z`
  )
}

export interface Reminder {
  /** Stable, so the file always names the same events. */
  id: string
  days: readonly Weekday[]
  /** HH:MM, local. */
  time: string
  title: string
  minutes: number
}

/** The reminders the settings ask for: the morning block every day, and each weekday's main session. */
export function remindersOf(reminders: SettingsRecord['reminders']): Reminder[] {
  const list: Reminder[] = []
  if (reminders.morning) {
    const morning = sessionOf(plan.week.mon.morning)
    list.push({
      id: 'morning',
      days: WEEKDAYS,
      time: reminders.morning,
      title: morning.name,
      minutes: morning.minutes.max,
    })
  }
  for (const day of WEEKDAYS) {
    const time = reminders.main[day]
    if (!time) continue
    const main = sessionOf(plan.week[day].main)
    list.push({ id: `main-${day}`, days: [day], time, title: main.name, minutes: main.minutes.max })
  }
  return list
}

/** The reminder times as text, for setting the alarms by hand if the calendar hand-off fails (design §9). */
export function reminderLines(reminders: readonly Reminder[]): string[] {
  return reminders.map((r) => {
    const when = r.days.length === 7 ? 'Every day' : r.days.map(dayName).join(', ')
    return `${when} at ${r.time}: ${r.title}`
  })
}

/** The first date on or after `from` that falls on one of the days. */
function firstOn(from: LocalDate, days: readonly Weekday[]): LocalDate {
  for (let i = 0; i < 7; i++) {
    const d = addDays(from, i)
    if (days.includes(weekday(d))) return d
  }
  return from
}

export const APP_URL = 'https://tortoise.doctornova.net'
const UID_DOMAIN = 'tortoise.doctornova.net'

/**
 * The calendar file for the reminders. Each event repeats weekly with no end, starts on its first day on or after
 * `from`, and rings at its start.
 */
export function buildCalendar(reminders: readonly Reminder[], from: LocalDate, now: Date): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Tortoise//Reminders//EN', 'CALSCALE:GREGORIAN']
  const stamp = utcDateTime(now)
  for (const r of reminders) {
    const summary = escapeText(`Tortoise: ${r.title}`)
    lines.push(
      'BEGIN:VEVENT',
      `UID:${r.id}@${UID_DOMAIN}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${floatingDateTime(firstOn(from, r.days), r.time)}`,
      `DURATION:PT${Math.max(1, Math.round(r.minutes))}M`,
      `RRULE:FREQ=WEEKLY;BYDAY=${r.days.map((d) => BYDAY[d]).join(',')}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${escapeText("Open Tortoise for today's plan: swapped days, test weekends and light weeks show there.")}`,
      `URL:${APP_URL}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      `DESCRIPTION:${summary}`,
      'TRIGGER:PT0S',
      'END:VALARM',
      'END:VEVENT',
    )
  }
  lines.push('END:VCALENDAR')
  return serialize(lines)
}
