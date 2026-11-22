import { describe, expect, it } from 'vitest'
import {
  importBackup,
  markBackedUp,
  parseBackup,
  prepareBackup,
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
    habits: { steps: 9000, snacks: 2 },
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
  await db.put('meta', {
    key: 'meta',
    schemaVersion: SCHEMA_VERSION,
    createdAt: T1,
    appVersion: '0.1.0',
    updatedAt: T1,
  })
}

describe('backup round trip on fake-indexeddb', () => {
  it('export → wipe → import (Replace) gives identical data', async () => {
    const db = await fresh()
    await seed(db)
    const prepared = await prepareBackup(db, EXPORT, '0.1.0')
    await markBackedUp(db, prepared)
    const before = await readAllStores(db)
    expect(before.settings[0]?.backup.lastAt).toBe(EXPORT.toISOString())

    await wipeAll(db, new Date('2026-12-11T00:00:00Z'), '0.1.0')
    const wiped = await readAllStores(db)
    for (const name of STORE_NAMES) expect(wiped[name]).toHaveLength(name === 'meta' ? 1 : 0)

    const file = parseBackup(prepared.text)
    await importBackup(db, file, 'replace', new Date('2026-12-11T00:01:00Z'), '0.1.0')
    expect(await readAllStores(db)).toEqual(before)
    db.close()
  })

  it('the file holds every store and its versions', async () => {
    const db = await fresh()
    await seed(db)
    const { file, name } = await prepareBackup(db, EXPORT, '0.1.0')
    expect(name).toBe('tortoise-backup-2026-12-10.json')
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
    const file = parseBackup((await prepareBackup(db, EXPORT, '0.1.0')).text)
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

    const result = await importBackup(db, file, 'merge', EXPORT, '0.1.0')
    const after = await readAllStores(db)
    expect(after.days.find((d) => d.date === '2026-11-23')?.split?.kind).toBe('front') // the phone's newer copy
    expect(after.days.find((d) => d.date === '2026-11-24')?.habits?.steps).toBe(9000) // restored
    expect(after.logs.map((l) => l.id).sort()).toEqual(['log-aaaa-0001', 'log-bbbb-0002'])
    expect(after.levels[0]?.level).toBe(3)
    expect(result.written).toBeGreaterThanOrEqual(3) // the restored day, the level, the settings with its backup date
    expect(result.kept).toBeGreaterThan(0)
    db.close()
  })

  it('Merge into an empty phone keeps the earlier creation date', async () => {
    const source = await fresh()
    await seed(source)
    const file = parseBackup((await prepareBackup(source, EXPORT, '0.1.0')).text)
    const db = await fresh()
    await wipeAll(db, EXPORT, '0.1.0')
    await importBackup(db, file, 'merge', EXPORT, '0.1.0')
    const after = await readAllStores(db)
    expect(after.meta[0]?.createdAt).toBe(T1)
    expect(after.days).toHaveLength(2)
    source.close()
    db.close()
  })

  it('Replace removes what the backup does not hold', async () => {
    const db = await fresh()
    await seed(db)
    const file = parseBackup((await prepareBackup(db, EXPORT, '0.1.0')).text)
    await db.put('days', { date: '2026-12-08', morning: { doneAt: T2 }, updatedAt: T2 })
    await importBackup(db, file, 'replace', EXPORT, '0.1.0')
    expect(await db.get('days', '2026-12-08')).toBeUndefined()
    db.close()
  })

  it('a failed import writes nothing', async () => {
    const db = await fresh()
    await seed(db)
    const before = await readAllStores(db)
    const file = parseBackup((await prepareBackup(db, EXPORT, '0.1.0')).text)
    // A record whose key the store cannot take makes the transaction fail part-way through.
    ;(file.stores.milestones as unknown as Array<Record<string, unknown>>)[0] = {
      earnedAt: '2026-11-29',
      updatedAt: T1,
    }
    await expect(importBackup(db, file, 'replace', EXPORT, '0.1.0')).rejects.toBeTruthy()
    expect(await readAllStores(db)).toEqual(before)
    db.close()
  })
})
