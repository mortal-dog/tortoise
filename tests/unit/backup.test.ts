import { describe, expect, it } from 'vitest'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupError,
  type BackupFile,
  backupDue,
  backupFileName,
  isNewer,
  parseBackup,
  previewBackup,
} from '@/lib/backup'
import { SCHEMA_VERSION } from '@/lib/db'
import { SettingsRecord } from '@/lib/records'

// Invented example data.
const AT = '2026-12-01T12:00:00.000Z'

function sample(): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: AT,
    appVersion: '0.1.0',
    schemaVersion: SCHEMA_VERSION,
    stores: {
      settings: [SettingsRecord.parse({ key: 'settings', startDate: '2026-11-30', updatedAt: AT })],
      days: [
        { date: '2026-11-24', morning: { doneAt: AT }, updatedAt: AT },
        { date: '2026-11-23', main: { doneAt: AT, sessionId: 'strength-a', asPlanned: true }, updatedAt: AT },
      ],
      logs: [
        {
          id: 'log-0001-abcd',
          date: '2026-12-02',
          sessionId: 'strength-a',
          exerciseId: 'goblet-squat',
          sets: [{ reps: 10, kg: 12 }],
          updatedAt: AT,
        },
      ],
      levels: [{ ladderId: 'squat', level: 2, since: '2026-12-01', history: [], updatedAt: AT }],
      tests: [{ date: '2026-11-28', results: { pushups: 12 }, computed: {}, updatedAt: AT }],
      overrides: [],
      milestones: [{ id: 'first-week', earnedAt: '2026-11-29', updatedAt: AT }],
      photos: [
        { id: 'photo-0001-abcd', date: '2026-12-01', dataUrl: 'data:image/jpeg;base64,AAAA', updatedAt: AT },
      ],
      meta: [
        { key: 'meta', schemaVersion: SCHEMA_VERSION, createdAt: AT, appVersion: '0.1.0', updatedAt: AT },
      ],
    },
  }
}

const text = (o: unknown) => JSON.stringify(o)

function refused(input: string): string {
  try {
    parseBackup(input)
  } catch (e) {
    expect(e).toBeInstanceOf(BackupError)
    return (e as Error).message
  }
  throw new Error('the file was accepted')
}

describe('reading a backup file', () => {
  it('accepts a valid file and returns the same records', () => {
    const file = sample()
    expect(parseBackup(text(file))).toEqual(file)
  })

  it('refuses a file that is not JSON', () => {
    expect(refused('{"format": "tortoise-backup", ')).toBe(
      'This file is not a Tortoise backup: it is not readable JSON.',
    )
    expect(refused('')).toMatch(/not readable JSON/)
  })

  it('refuses JSON that is not a Tortoise backup', () => {
    expect(refused('[1, 2, 3]')).toBe('This file is not a Tortoise backup.')
    expect(refused(text({ format: 'other-app', version: 1 }))).toBe('This file is not a Tortoise backup.')
    expect(refused('null')).toBe('This file is not a Tortoise backup.')
  })

  it('refuses a file from a newer app, by file version or by database version', () => {
    expect(refused(text({ ...sample(), version: BACKUP_VERSION + 1 }))).toMatch(/newer version of Tortoise/)
    expect(refused(text({ ...sample(), schemaVersion: SCHEMA_VERSION + 1 }))).toMatch(
      /newer version of Tortoise/,
    )
  })

  it('refuses a file without a valid version', () => {
    const { version: _, ...rest } = sample()
    expect(refused(text(rest))).toMatch(/no valid version/)
    expect(refused(text({ ...sample(), version: 0 }))).toMatch(/no valid version/)
  })

  it('names where a damaged record is', () => {
    const file = sample() as unknown as { stores: { days: Array<Record<string, unknown>> } }
    ;(file.stores.days[1] as Record<string, unknown>).date = '23 November'
    expect(refused(text(file))).toContain(
      'This backup is damaged, so nothing was imported (days › record 2 › date',
    )
  })

  it('refuses a missing store and a record without updatedAt', () => {
    const noLogs = sample() as unknown as { stores: Record<string, unknown> }
    delete noLogs.stores.logs
    expect(refused(text(noLogs))).toMatch(/^This backup is damaged.*logs/)
    const noStamp = sample() as unknown as { stores: { levels: Array<Record<string, unknown>> } }
    delete noStamp.stores.levels[0]?.updatedAt
    expect(refused(text(noStamp))).toMatch(/levels › record 1 › updatedAt/)
  })

  it('refuses two records with the same key', () => {
    const file = sample()
    file.stores.days.push({ ...file.stores.days[0], date: '2026-11-24', updatedAt: AT })
    expect(refused(text(file))).toMatch(/days › record 3: a second record for 2026-11-24/)
  })
})

describe('the import preview', () => {
  it('counts the records and finds the date range over days, logs and tests', () => {
    const p = previewBackup(sample())
    expect(p.counts).toEqual({
      settings: 1,
      days: 2,
      logs: 1,
      levels: 1,
      tests: 1,
      overrides: 0,
      milestones: 1,
      photos: 1,
    })
    expect(p.range).toEqual({ from: '2026-11-23', to: '2026-12-02' })
    expect(p.exportedAt).toBe(AT)
  })
  it('has no range for an empty backup', () => {
    const file = sample()
    file.stores.days = []
    file.stores.logs = []
    file.stores.tests = []
    expect(previewBackup(file).range).toBeNull()
  })
})

describe('the merge rule (D-032)', () => {
  it('takes the incoming record only when it is strictly newer', () => {
    expect(isNewer({ updatedAt: '2026-12-02T00:00:00Z' }, { updatedAt: '2026-12-01T23:59:59.999Z' })).toBe(
      true,
    )
    expect(isNewer({ updatedAt: '2026-12-01T00:00:00Z' }, { updatedAt: '2026-12-01T00:00:00.000Z' })).toBe(
      false,
    )
    expect(isNewer({ updatedAt: '2026-11-30T00:00:00Z' }, { updatedAt: '2026-12-01T00:00:00Z' })).toBe(false)
    expect(isNewer({ updatedAt: '2026-11-30T00:00:00Z' }, undefined)).toBe(true)
  })
})

describe('the backup file name and the reminder', () => {
  it('names the file by the local date', () => {
    expect(backupFileName(new Date('2026-12-01T23:30:00Z'))).toBe('tortoise-backup-2026-12-01.json')
    // London is an hour ahead in summer.
    expect(backupFileName(new Date('2026-07-01T23:30:00Z'))).toBe('tortoise-backup-2026-07-02.json')
  })

  const settings = (patch: Partial<SettingsRecord>) =>
    SettingsRecord.parse({ key: 'settings', updatedAt: AT, ...patch })

  it('is never due before the plan starts', () => {
    expect(backupDue(settings({}), '2027-06-01').due).toBe(false)
  })
  it('counts from Week 0 when there is no backup yet', () => {
    // Week 1 starts 30 November, so Week 0 began on 23 November.
    const s = settings({ startDate: '2026-11-30' })
    expect(backupDue(s, '2026-12-22')).toEqual({ due: false, daysSince: null })
    expect(backupDue(s, '2026-12-23')).toEqual({ due: true, daysSince: null })
  })
  it('is due once the last backup is as old as the interval', () => {
    const s = settings({ startDate: '2026-11-30', backup: { lastAt: '2026-12-01T10:00:00Z', everyDays: 30 } })
    expect(backupDue(s, '2026-12-30')).toEqual({ due: false, daysSince: 29 })
    expect(backupDue(s, '2026-12-31')).toEqual({ due: true, daysSince: 30 })
    const weekly = settings({
      startDate: '2026-11-30',
      backup: { lastAt: '2026-12-01T10:00:00Z', everyDays: 7 },
    })
    expect(backupDue(weekly, '2026-12-08').due).toBe(true)
  })
})

describe('backups from schema 1', () => {
  it('parse without a photos store, which reads as empty', () => {
    const { photos: _, ...stores } = sample().stores
    const file = parseBackup(text({ ...sample(), schemaVersion: 1, stores }))
    expect(file.stores.photos).toEqual([])
  })
})
