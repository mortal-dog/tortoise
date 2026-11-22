import { describe, expect, it } from 'vitest'
import { MIGRATIONS, type Migration, openDb, request } from '@/lib/db'
import type { DayRecord, LogRecord } from '@/lib/records'
import { DayRecord as DaySchema, newId } from '@/lib/records'

let n = 0
const fresh = () => `tortoise-test-${++n}-${Math.random().toString(36).slice(2)}`
const AT = '2026-12-01T12:00:00Z'

describe('the IndexedDB wrapper on fake-indexeddb', () => {
  it('creates the stores of design §6', async () => {
    const db = await openDb({ name: fresh() })
    expect([...db.raw.objectStoreNames].sort()).toEqual(
      ['days', 'levels', 'logs', 'meta', 'milestones', 'overrides', 'settings', 'tests'].sort(),
    )
    db.close()
  })

  it('puts, gets, queries by index, counts and deletes', async () => {
    const db = await openDb({ name: fresh() })
    const day: DayRecord = { date: '2026-12-01', morning: { doneAt: AT }, updatedAt: AT }
    await db.put('days', day)
    expect(await db.get('days', '2026-12-01')).toEqual(day)
    const logs: LogRecord[] = ['2026-12-01', '2026-12-01', '2026-12-02'].map((date) => ({
      id: newId(),
      date,
      sessionId: 'strength-a',
      exerciseId: 'goblet-squat',
      ladderId: 'squat',
      level: 1,
      sets: [{ reps: 10 }],
      updatedAt: AT,
    }))
    for (const l of logs) await db.put('logs', l)
    expect(await db.getAllByIndex('logs', 'date', '2026-12-01')).toHaveLength(2)
    expect(await db.getAllByIndex('logs', 'ladderId', 'squat')).toHaveLength(3)
    expect(new Set(logs.map((l) => l.id)).size).toBe(3)
    expect(await db.count('logs')).toBe(3)
    await db.delete('days', '2026-12-01')
    expect(await db.get('days', '2026-12-01')).toBeUndefined()
    db.close()
  })

  it('writes a transaction completely or not at all', async () => {
    const db = await openDb({ name: fresh() })
    await expect(
      db.transaction(['days', 'meta'], 'readwrite', async (tx) => {
        tx.objectStore('days').put({ date: '2026-12-01', updatedAt: AT })
        throw new Error('stop')
      }),
    ).rejects.toThrow('stop')
    expect(await db.count('days')).toBe(0)
    await db.transaction(['days'], 'readwrite', (tx) => {
      tx.objectStore('days').put({ date: '2026-12-01', updatedAt: AT })
      tx.objectStore('days').put({ date: '2026-12-02', updatedAt: AT })
    })
    expect(await db.count('days')).toBe(2)
    db.close()
  })

  it('upgrades a version-1 database through a later migration and keeps its data (fixture)', async () => {
    const name = fresh()
    // The fixture: a version-1 database holding records in the version-1 shape.
    const v1 = await openDb({ name, migrations: MIGRATIONS })
    await v1.put('days', {
      date: '2026-12-01',
      main: { doneAt: AT, sessionId: 'long', minutes: 40 },
      updatedAt: AT,
    })
    await v1.put('logs', {
      id: 'fixture-log-1',
      date: '2026-12-01',
      sessionId: 'strength-a',
      exerciseId: 'goblet-squat',
      sets: [{ reps: 12 }],
      updatedAt: AT,
    })
    v1.close()

    // A test migration in the shape later versions will take: a new index, and a field filled in for old records.
    const v2: Migration = {
      version: 2,
      upgrade(_db, tx) {
        const logs = tx.objectStore('logs')
        logs.createIndex('exerciseId', 'exerciseId')
        const days = tx.objectStore('days')
        days.openCursor().onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue | null>).result
          if (!cursor) return
          cursor.update({ ...cursor.value, folded: false })
          cursor.continue()
        }
      },
    }
    const db = await openDb({ name, migrations: [...MIGRATIONS, v2] })
    expect(db.version).toBe(2)
    const day = await db.get('days', '2026-12-01')
    expect(day).toMatchObject({ main: { minutes: 40 }, folded: false })
    expect(DaySchema.safeParse(day).success).toBe(true)
    const byExercise = await db.transaction(['logs'], 'readonly', (tx) =>
      request(tx.objectStore('logs').index('exerciseId').getAll('goblet-squat')),
    )
    expect(byExercise).toHaveLength(1)
    db.close()
  })

  it('stores and reads 60 years of days (about 22,000 records)', async () => {
    const db = await openDb({ name: fresh() })
    const t0 = performance.now()
    await db.transaction(['days'], 'readwrite', (tx) => {
      const store = tx.objectStore('days')
      const start = Date.UTC(2026, 10, 23)
      for (let i = 0; i < 22_000; i++) {
        const date = new Date(start + i * 86_400_000).toISOString().slice(0, 10)
        store.put({ date, morning: { doneAt: AT }, updatedAt: AT })
      }
    })
    const all = await db.getAll('days')
    expect(all).toHaveLength(22_000)
    expect(all[0]?.date).toBe('2026-11-23')
    const range = await db.getAll('days', IDBKeyRange.bound('2030-01-01', '2030-12-31'))
    expect(range).toHaveLength(365)
    expect(performance.now() - t0).toBeLessThan(20_000)
    db.close()
  })
})
