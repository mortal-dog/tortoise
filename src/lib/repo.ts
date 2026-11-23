// Reading and writing the app's records. Every write stamps updatedAt (D-032) and tells the UI to refresh.
import { plan } from '@/data/plan'
import type { Weekday } from '@/data/schema'
import { type BackupFile, type ImportResult, importBackup, wipeAll } from './backup'
import type { Swap } from './calendar'
import { addDays, type LocalDate } from './dates'
import { type Db, openDb, request, requestPersistentStorage, SCHEMA_VERSION } from './db'
import { notifyChange } from './live'
import {
  type DayRecord,
  type LevelRecord,
  type LogRecord,
  newId,
  nowIso,
  type OverrideRecord,
  type SettingsRecord,
  SettingsRecord as SettingsSchema,
  type Variant,
} from './records'
import { type StartAnswers, startingLevels } from './start-levels'

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

export function appVersion(): string {
  return typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'
}

export function defaultSettings(): SettingsRecord {
  return SettingsSchema.parse({ key: 'settings', updatedAt: nowIso() })
}

export async function getSettings(): Promise<SettingsRecord> {
  const db = await getDb()
  return (await db.get('settings', 'settings')) ?? defaultSettings()
}

export type SettingsPatch = Partial<Omit<SettingsRecord, 'key' | 'updatedAt'>>

/**
 * Saves a patch to the settings record. The read and the write share one transaction, so two saves started at once
 * cannot both begin from the same old record. A patch to a nested field (profile, units) is given
 * as a function of the stored record: a screen that has not re-rendered since the last save would otherwise write its
 * old copy back and undo that save (two time fields typed in a row).
 */
export async function saveSettings(
  patch: SettingsPatch | ((stored: SettingsRecord) => SettingsPatch),
): Promise<SettingsRecord> {
  const db = await getDb()
  const next = await db.transaction(['settings'], 'readwrite', async (tx) => {
    const store = tx.objectStore('settings')
    const stored = ((await request(store.get('settings'))) as SettingsRecord | undefined) ?? defaultSettings()
    const changes = typeof patch === 'function' ? patch(stored) : patch
    const record = { ...stored, ...changes, key: 'settings' as const, updatedAt: nowIso() }
    // A cleared field is left out, not stored as undefined, so the record matches its backup copy exactly.
    for (const k of Object.keys(record) as Array<keyof typeof record>) {
      if (record[k] === undefined) delete record[k]
    }
    store.put(record)
    return record
  })
  notifyChange()
  return next
}

/** Starts the plan: Week 0 begins on the chosen Monday, so Week 1 (the stored start date) is seven days later. */
/**
 * Starts the plan: Week 0 begins on the given Monday. The start answers set the starting levels, dated Week 1's Monday
 * (Week 0 runs every ladder at level 1 anyway); every other ladder starts at level 1 (plan §8, D-067).
 */
export async function startPlan(week0Monday: LocalDate, answers: StartAnswers = {}): Promise<void> {
  const week1 = addDays(week0Monday, 7)
  await saveSettings({ startDate: week1 })
  for (const [ladderId, level] of startingLevels(plan.startRules, plan.ladders, answers))
    await setLevel(ladderId, level, week1)
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

export type Slot = 'morning' | 'main' | 'split'

export interface PlayedSession {
  date: LocalDate
  slot: Slot
  sessionId: string
  variant?: Variant
  /** The split kind for a split block, and for the Sunday session that holds the split work. */
  splitKind?: 'front' | 'side' | 'both' | 'long'
  minutes: number
  effort?: number
  note?: string
  distanceKm?: number
  /** The step ids finished in the player; skipped steps are left out (D-057). */
  steps: string[]
  logs: Array<Omit<LogRecord, 'id' | 'updatedAt' | 'date' | 'sessionId'>>
}

/** Saves a session the player ran: its logs and the day's card, in one transaction (design §3.2). */
export async function savePlayedSession(p: PlayedSession): Promise<void> {
  const db = await getDb()
  const at = nowIso()
  await db.transaction(['days', 'logs'], 'readwrite', async (tx) => {
    const logs = tx.objectStore('logs')
    for (const l of p.logs) {
      logs.put({ ...l, id: newId(), date: p.date, sessionId: p.sessionId, updatedAt: at } satisfies LogRecord)
    }
    const days = tx.objectStore('days')
    const current = ((await request(days.get(p.date))) as DayRecord | undefined) ?? {
      date: p.date,
      updatedAt: at,
    }
    const next: DayRecord = { ...current, date: p.date, updatedAt: at }
    if (p.slot === 'morning') next.morning = { doneAt: at, steps: p.steps }
    else if (p.slot === 'split') next.split = { doneAt: at, kind: p.splitKind ?? 'both', steps: p.steps }
    else {
      next.main = {
        doneAt: at,
        sessionId: p.sessionId,
        minutes: Math.round(p.minutes),
        ...(p.variant ? { variant: p.variant } : {}),
        ...(p.effort ? { effort: p.effort } : {}),
        ...(p.note ? { note: p.note } : {}),
        ...(p.distanceKm ? { distanceKm: p.distanceKm } : {}),
        steps: p.steps,
      }
      if (p.splitKind) next.split = { doneAt: at, kind: p.splitKind, steps: p.steps }
    }
    days.put(next)
  })
  notifyChange()
}

/** Merges a Google Drive copy into this phone (D-032): for each record the newer one is kept. */
export async function mergeBackup(file: BackupFile): Promise<ImportResult> {
  const result = await importBackup(await getDb(), file, new Date())
  notifyChange()
  return result
}

/** Deletes all data (design §3.7, Reset); the app returns to its first run. */
export async function resetAll(): Promise<void> {
  await wipeAll(await getDb(), new Date(), appVersion())
  notifyChange()
}
