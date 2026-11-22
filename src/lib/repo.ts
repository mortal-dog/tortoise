// Reading and writing the app's records. Every write stamps updatedAt (D-032) and tells the UI to refresh.
import type { Weekday } from '@/data/schema'
import type { Swap } from './calendar'
import { addDays, type LocalDate } from './dates'
import { type Db, openDb, requestPersistentStorage, SCHEMA_VERSION } from './db'
import { notifyChange } from './live'
import {
  type DayRecord,
  type LevelRecord,
  nowIso,
  type OverrideRecord,
  type SettingsRecord,
  SettingsRecord as SettingsSchema,
} from './records'

let dbPromise: Promise<Db> | null = null

export function getDb(): Promise<Db> {
  if (!dbPromise) {
    dbPromise = openDb().then(async (db) => {
      if (!(await db.get('meta', 'meta'))) {
        const at = nowIso()
        await db.put('meta', {
          key: 'meta',
          schemaVersion: SCHEMA_VERSION,
          createdAt: at,
          appVersion: appVersion(),
          updatedAt: at,
        })
      }
      return db
    })
  }
  return dbPromise
}

/** For tests: forget the open database. */
export function resetDbForTests(): void {
  dbPromise = null
}

function appVersion(): string {
  return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
}

export function defaultSettings(): SettingsRecord {
  return SettingsSchema.parse({ key: 'settings', updatedAt: nowIso() })
}

export async function getSettings(): Promise<SettingsRecord> {
  const db = await getDb()
  return (await db.get('settings', 'settings')) ?? defaultSettings()
}

export async function saveSettings(
  patch: Partial<Omit<SettingsRecord, 'key' | 'updatedAt'>>,
): Promise<SettingsRecord> {
  const db = await getDb()
  const next = { ...(await getSettings()), ...patch, key: 'settings' as const, updatedAt: nowIso() }
  await db.put('settings', next)
  notifyChange()
  return next
}

/** Starts the plan: Week 0 begins on the chosen Monday, so Week 1 (the stored start date) is seven days later. */
export async function startPlan(week0Monday: LocalDate): Promise<void> {
  await saveSettings({ startDate: addDays(week0Monday, 7) })
  // Ask once, at the moment the data starts to matter (design §2).
  await requestPersistentStorage().catch(() => null)
}

export async function getDay(date: LocalDate): Promise<DayRecord | undefined> {
  return (await getDb()).get('days', date)
}

export async function getDaysBetween(from: LocalDate, to: LocalDate): Promise<Map<LocalDate, DayRecord>> {
  const db = await getDb()
  const list = await db.getAll('days', IDBKeyRange.bound(from, to))
  return new Map(list.map((d) => [d.date, d]))
}

export async function getAllDays(): Promise<Map<LocalDate, DayRecord>> {
  const list = await (await getDb()).getAll('days')
  return new Map(list.map((d) => [d.date, d]))
}

/** Applies a change to one day's record (creating it if needed) and saves it. */
export async function updateDay(date: LocalDate, change: (day: DayRecord) => DayRecord): Promise<DayRecord> {
  const db = await getDb()
  const current = (await db.get('days', date)) ?? { date, updatedAt: nowIso() }
  const next = { ...change({ ...current }), date, updatedAt: nowIso() }
  await db.put('days', next)
  notifyChange()
  return next
}

export async function getLevels(): Promise<Map<string, LevelRecord>> {
  const list = await (await getDb()).getAll('levels')
  return new Map(list.map((l) => [l.ladderId, l]))
}

/** Sets a ladder's level; the history keeps every change with its date (design §5.3). */
export async function setLevel(ladderId: string, level: number, date: LocalDate): Promise<void> {
  const db = await getDb()
  const current = await db.get('levels', ladderId)
  if (current?.level === level) return
  const history = [...(current?.history ?? []), { level, date }]
  await db.put('levels', { ladderId, level, since: date, history, updatedAt: nowIso() })
  notifyChange()
}

export async function getOverride(monday: LocalDate): Promise<OverrideRecord | undefined> {
  return (await getDb()).get('overrides', monday)
}

export async function saveSwaps(monday: LocalDate, swaps: Swap[]): Promise<void> {
  const db = await getDb()
  if (swaps.length === 0) await db.delete('overrides', monday)
  else await db.put('overrides', { monday, swaps: swaps as Array<[Weekday, Weekday]>, updatedAt: nowIso() })
  notifyChange()
}

export async function getLogsForLadder(ladderId: string) {
  return (await getDb()).getAllByIndex('logs', 'ladderId', ladderId)
}

export async function getAllLogs() {
  return (await getDb()).getAll('logs')
}
