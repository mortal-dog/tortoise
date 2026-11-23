import { describe, expect, it } from 'vitest'
import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type BackupFile,
  importBackup,
  parseBackup,
  readAllStores,
  STORE_NAMES,
  wipeAll,
} from '@/lib/backup'
import { type Db, openDb, SCHEMA_VERSION } from '@/lib/db'
import { SettingsRecord } from '@/lib/records'

let n = 0
const fresh = () => openDb({ name: `tortoise-backup-${++n}-${Math.random().toString(36).slice(2)}` })
// Invented example data.
const T1 = '2026-12-01T12:00:00.000Z'
const T2 = '2026-12-05T12:00:00.000Z'
const EXPORT = new Date('2026-12-10T08:00:00.000Z')

async function seed(db: Db): Promise<void> {
  await db.put(
    'settings',
    SettingsRecord.parse({
      key: 'settings',
      startDate: '2026-11-30',
      dumbbellKg: 12,
      profile: { birthYear: 1970 },
      reminders: { morning: '06:30', main: { mon: '12:00' } },
      updatedAt: T1,
    }),
  )
  await db.put('days', { date: '2026-11-23', morning: { doneAt: T1 }, updatedAt: T1 })
  await db.put('days', {
    date: '2026-11-24',
    main: {
      doneAt: T1,
      sessionId: 'easy-run',
      variant: 'outdoor',
      minutes: 30,
      effort: 4,
      note: 'Wet; windy',
    },
    updatedAt: T1,
  })
  await db.put('logs', {
    id: 'log-aaaa-0001',
    date: '2026-12-01',
    sessionId: 'strength-a',
    exerciseId: 'goblet-squat',
    ladderId: 'squat',
    level: 2,
    sets: [{ reps: 10, kg: 12 }, { reps: 9 }],
    feedback: 'right',
    updatedAt: T1,
  })
  await db.put('levels', {
    ladderId: 'squat',
    level: 2,
    since: '2026-12-01',
    history: [{ level: 2, date: '2026-12-01' }],
    updatedAt: T1,
  })
  await db.put('tests', {
    date: '2026-11-28',
    results: { pushups: 15, sitRise: { sit: 4, rise: 5 } },
    start: { runMin: 10, ropeMin: 2, negative: true },
    computed: { sitRiseScore: 9 },
    updatedAt: T1,
  })
  await db.put('overrides', { monday: '2026-11-30', swaps: [['tue', 'wed']], updatedAt: T1 })
  await db.put('milestones', { id: 'first-week', earnedAt: '2026-11-29', updatedAt: T1 })
  await db.put('photos', {
    id: 'photo-0001-abcd',
    date: '2026-12-01',
    dataUrl: 'data:image/jpeg;base64,AAAA',
    updatedAt: T1,
  })
  await db.put('meta', {
    key: 'meta',
    schemaVersion: SCHEMA_VERSION,
    createdAt: T1,
    appVersion: '0.1.0',
    updatedAt: T1,
  })
}

/** This phone's records as a Google Drive copy holds them (the backup format, D-054), read back as text. */
async function copyOf(db: Db): Promise<BackupFile> {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: EXPORT.toISOString(),
    appVersion: '0.1.0',
    schemaVersion: SCHEMA_VERSION,
    stores: await readAllStores(db),
  }
  return parseBackup(JSON.stringify(file))
}

describe('the backup format on fake-indexeddb', () => {
  it('copy → wipe → merge gives back every record', async () => {
    const db = await fresh()
    await seed(db)
    const before = await readAllStores(db)
    const file = await copyOf(db)

    await wipeAll(db, new Date('2026-12-11T00:00:00Z'), '0.1.0')
    const wiped = await readAllStores(db)
    for (const name of STORE_NAMES) expect(wiped[name]).toHaveLength(name === 'meta' ? 1 : 0)

    await importBackup(db, file, new Date('2026-12-11T00:01:00Z'))
    const after = await readAllStores(db)
    for (const name of STORE_NAMES) if (name !== 'meta') expect(after[name], name).toEqual(before[name])
    // The meta record describes this database, with the copy's earlier creation date.
    expect(after.meta[0]?.createdAt).toBe(T1)
    db.close()
  })

  it('the copy holds every store and its versions', async () => {
    const db = await fresh()
    await seed(db)
    const file = await copyOf(db)
    expect(file.format).toBe('tortoise-backup')
    expect(file.version).toBe(1)
    expect(file.schemaVersion).toBe(SCHEMA_VERSION)
    expect(Object.keys(file.stores).sort()).toEqual([...STORE_NAMES].sort())
    for (const name of STORE_NAMES) expect(file.stores[name].length).toBeGreaterThan(0)
    db.close()
  })

  it('Merge keeps the newer copy of each key and adds what is missing', async () => {
    const db = await fresh()
    await seed(db)
    const file = await copyOf(db)
    // The phone moves on after the backup: one day is newer here, one log is new here.
    await db.put('days', {
      date: '2026-11-23',
      morning: { doneAt: T2 },
      split: { doneAt: T2, kind: 'front' },
      updatedAt: T2,
    })
    await db.put('logs', {
      id: 'log-bbbb-0002',
      date: '2026-12-06',
      sessionId: 'strength-b',
      exerciseId: 'row',
      sets: [{ reps: 8 }],
      updatedAt: T2,
    })
    // The backup has a newer level and a day this phone lost.
    file.stores.levels = [
      { ...file.stores.levels[0], level: 3, updatedAt: '2026-12-09T00:00:00.000Z' },
    ] as typeof file.stores.levels
    await db.delete('days', '2026-11-24')

    const result = await importBackup(db, file, EXPORT)
    const after = await readAllStores(db)
    expect(after.days.find((d) => d.date === '2026-11-23')?.split?.kind).toBe('front') // the phone's newer copy
    expect(after.days.find((d) => d.date === '2026-11-24')?.main?.effort).toBe(4) // restored
    expect(after.logs.map((l) => l.id).sort()).toEqual(['log-aaaa-0001', 'log-bbbb-0002'])
    expect(after.levels[0]?.level).toBe(3)
    expect(result.written).toBe(2) // the restored day and the level
    expect(result.kept).toBeGreaterThan(0)
    db.close()
  })

  it('Merge into an empty phone keeps the earlier creation date', async () => {
    const source = await fresh()
    await seed(source)
    const file = await copyOf(source)
    const db = await fresh()
    await wipeAll(db, EXPORT, '0.1.0')
    await importBackup(db, file, EXPORT)
    const after = await readAllStores(db)
    expect(after.meta[0]?.createdAt).toBe(T1)
    expect(after.days).toHaveLength(2)
    source.close()
    db.close()
  })

  it('a failed merge writes nothing', async () => {
    const db = await fresh()
    await seed(db)
    const before = await readAllStores(db)
    const file = await copyOf(db)
    // A record whose key the store cannot take makes the transaction fail part-way through.
    ;(file.stores.milestones as unknown as Array<Record<string, unknown>>)[0] = {
      earnedAt: '2026-11-29',
      updatedAt: T1,
    }
    await expect(importBackup(db, file, EXPORT)).rejects.toBeTruthy()
    expect(await readAllStores(db)).toEqual(before)
    db.close()
  })
})
