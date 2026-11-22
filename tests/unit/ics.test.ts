import { describe, expect, it } from 'vitest'
import {
  buildCalendar,
  CRLF,
  escapeText,
  floatingDateTime,
  foldLine,
  MAX_OCTETS,
  reminderLines,
  remindersOf,
  serialize,
  utcDateTime,
} from '@/lib/ics'

const octets = (s: string) => new TextEncoder().encode(s).length
/** RFC 5545 §3.1 unfolding: a CRLF followed by one space or tab is removed. */
const unfold = (s: string) => s.replace(/\r\n[ \t]/g, '')

describe('text escaping (RFC 5545 §3.3.11)', () => {
  it('escapes backslash, semicolon, comma and line breaks', () => {
    expect(escapeText('a\\b;c,d\ne')).toBe('a\\\\b\\;c\\,d\\ne')
    expect(escapeText('one\r\ntwo\rthree')).toBe('one\\ntwo\\nthree')
  })
  it('escapes the backslash first, so an escape is never doubled', () => {
    expect(escapeText(';')).toBe('\\;')
    expect(escapeText('\\;')).toBe('\\\\\\;')
  })
  it('leaves colons and quotes alone', () => {
    expect(escapeText('Tortoise: "Strength A"')).toBe('Tortoise: "Strength A"')
  })
})

describe('line folding at 75 octets (RFC 5545 §3.1)', () => {
  it('leaves a line of exactly 75 octets alone', () => {
    const line = 'x'.repeat(MAX_OCTETS)
    expect(foldLine(line)).toBe(line)
  })
  it('folds a 76-octet line into 75 octets and a continuation that starts with a space', () => {
    const line = 'x'.repeat(76)
    const folded = foldLine(line)
    const parts = folded.split(CRLF)
    expect(parts).toHaveLength(2)
    expect(octets(parts[0] as string)).toBe(75)
    expect(parts[1]).toBe(' x')
    expect(unfold(folded)).toBe(line)
  })
  it('keeps every physical line, its leading space included, within 75 octets', () => {
    const line = `DESCRIPTION:${'abcdefghij'.repeat(40)}`
    const parts = foldLine(line).split(CRLF)
    expect(parts.length).toBeGreaterThan(5)
    for (const p of parts) expect(octets(p)).toBeLessThanOrEqual(75)
    for (const p of parts.slice(1)) expect(p.startsWith(' ')).toBe(true)
    expect(unfold(foldLine(line))).toBe(line)
  })
  it('counts octets, not characters, and never splits a multi-octet character', () => {
    // "é" is 2 octets and "🐢" 4 in UTF-8.
    const line = `SUMMARY:${'é'.repeat(40)}${'🐢'.repeat(10)}`
    const parts = foldLine(line).split(CRLF)
    for (const p of parts) {
      expect(octets(p)).toBeLessThanOrEqual(75)
      expect(p).not.toContain('�')
      // A lone surrogate would mean a character was cut in half.
      expect(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(p)).toBe(false)
    }
    expect(octets(parts[0] as string)).toBeGreaterThanOrEqual(74)
    expect(unfold(foldLine(line))).toBe(line)
  })
  it('ends every line with CRLF and has no bare LF', () => {
    const text = serialize(['BEGIN:VCALENDAR', `X-LONG:${'y'.repeat(200)}`, 'END:VCALENDAR'])
    expect(text.endsWith(CRLF)).toBe(true)
    expect(text.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  })
})

describe('date-times', () => {
  it('writes floating local times with no zone, and DTSTAMP in UTC', () => {
    expect(floatingDateTime('2026-11-23', '07:05')).toBe('20261123T070500')
    expect(utcDateTime(new Date('2026-11-22T09:03:04Z'))).toBe('20261122T090304Z')
  })
})

describe('the reminders calendar', () => {
  const reminders = remindersOf({ morning: '06:45', main: { mon: '12:00', sat: '09:30' } })
  const NOW = new Date('2026-11-22T12:00:00Z')

  it('turns the settings into the morning block every day and each set weekday', () => {
    expect(reminders.map((r) => [r.id, r.time, r.days.length])).toEqual([
      ['morning', '06:45', 7],
      ['main-mon', '12:00', 1],
      ['main-sat', '09:30', 1],
    ])
    expect(reminderLines(reminders)).toEqual([
      'Every day at 06:45: Morning block',
      'Mon at 12:00: Strength A',
      'Sat at 09:30: Long outdoor',
    ])
  })

  it('has no events without times', () => {
    const text = buildCalendar(remindersOf({ main: {} }), '2026-11-23', NOW)
    expect(text).not.toContain('BEGIN:VEVENT')
    expect(text.startsWith(`BEGIN:VCALENDAR${CRLF}VERSION:2.0${CRLF}`)).toBe(true)
  })

  it('writes weekly repeating events with an alarm, floating times and stable ids', () => {
    // Wednesday 25 November: the morning event starts that day, Monday's on the 30th, Saturday's on the 28th.
    const text = buildCalendar(reminders, '2026-11-25', NOW)
    const lines = unfold(text).split(CRLF).filter(Boolean)
    expect(lines[0]).toBe('BEGIN:VCALENDAR')
    expect(lines.at(-1)).toBe('END:VCALENDAR')
    expect(lines).toContain('VERSION:2.0')
    expect(lines.filter((l) => l === 'BEGIN:VEVENT')).toHaveLength(3)
    expect(lines.filter((l) => l === 'BEGIN:VALARM')).toHaveLength(3)
    expect(lines.filter((l) => l === 'TRIGGER:PT0S')).toHaveLength(3)
    expect(lines.filter((l) => l === 'ACTION:DISPLAY')).toHaveLength(3)
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU')
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO')
    expect(lines).toContain('RRULE:FREQ=WEEKLY;BYDAY=SA')
    expect(lines).toContain('DTSTART:20261125T064500')
    expect(lines).toContain('DTSTART:20261130T120000')
    expect(lines).toContain('DTSTART:20261128T093000')
    expect(lines).toContain('UID:main-mon@tortoise.doctornova.net')
    expect(lines.filter((l) => l === 'DTSTAMP:20261122T120000Z')).toHaveLength(3)
    // Floating: no DTSTART carries a zone.
    for (const l of lines.filter((x) => x.startsWith('DTSTART'))) expect(l).toMatch(/^DTSTART:\d{8}T\d{6}$/)
    expect(lines).toContain('SUMMARY:Tortoise: Long outdoor')
    // TEXT values are escaped: the description's commas carry a backslash.
    expect(lines.find((l) => l.startsWith('DESCRIPTION:Open'))).toContain('swapped days\\, test weekends')
    // Every BEGIN has its END.
    for (const what of ['VCALENDAR', 'VEVENT', 'VALARM']) {
      expect(lines.filter((l) => l === `BEGIN:${what}`).length).toBe(
        lines.filter((l) => l === `END:${what}`).length,
      )
    }
    for (const p of text.split(CRLF)) expect(octets(p)).toBeLessThanOrEqual(75)
  })
})
