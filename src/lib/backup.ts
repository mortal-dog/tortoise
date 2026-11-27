// The backup format (design §10): one versioned JSON document holding every store. It is the shared copy every device
// syncs with on Google Drive (D-054, D-071); reading validates it with zod, then merges it (for each key the later
// updatedAt wins, D-032) or, when the user chose it, replaces this device's records with it, in one transaction.
// The backup file, its import screen and the reminder went with D-055.
import { z } from 'zod'
import { type Db, request, SCHEMA_VERSION } from './db'
import {
  DayRecord,
  LevelRecord,
  LogRecord,
  MetaRecord,
  MilestoneRecord,
  OverrideRecord,
  PhotoRecord,
  SettingsRecord,
  type StoreName,
  type Stores,
  TestRecord,
} from './records'

export const BACKUP_FORMAT = 'tortoise-backup'
/** The file format's version. A change to it appends a step to FILE_MIGRATIONS. */
export const BACKUP_VERSION = 1

export const STORE_NAMES = [
  'settings',
  'days',
  'logs',
  'levels',
  'tests',
  'overrides',
  'milestones',
  'photos',
  'meta',
] as const satisfies readonly StoreName[]

/** Each store's key, as its keyPath in db.ts. */
const KEY_OF: { [S in StoreName]: (r: Stores[S]) => string } = {
  settings: (r) => r.key,
  days: (r) => r.date,
  logs: (r) => r.id,
  levels: (r) => r.ladderId,
  tests: (r) => r.date,
  overrides: (r) => r.monday,
  milestones: (r) => r.id,
  photos: (r) => r.id,
  meta: (r) => r.key,
}

function uniqueKeys<S extends StoreName>(store: S, schema: z.ZodType<Stores[S]>) {
  return z.array(schema).superRefine((records, ctx) => {
    const seen = new Set<string>()
    records.forEach((r, i) => {
      const key = KEY_OF[store](r)
      if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `a second record for ${key}`, path: [i] })
      seen.add(key)
    })
  })
}

export const BackupFile = z.object({
  format: z.literal(BACKUP_FORMAT),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string().min(10),
  appVersion: z.string(),
  /** The database schema version (db.ts) the records follow. */
  schemaVersion: z.number().int().positive(),
  /**
   * The Drive copy's lineage (D-071): a new id each time one side replaced the other. A device that synced under
   * another id must compare again before it merges.
   */
  generation: z.string().optional(),
  stores: z.object({
    settings: uniqueKeys('settings', SettingsRecord),
    days: uniqueKeys('days', DayRecord),
    logs: uniqueKeys('logs', LogRecord),
    levels: uniqueKeys('levels', LevelRecord),
    tests: uniqueKeys('tests', TestRecord),
    overrides: uniqueKeys('overrides', OverrideRecord),
    milestones: uniqueKeys('milestones', MilestoneRecord),
    // Schema 2 added the photos; a file from schema 1 has none.
    photos: uniqueKeys('photos', PhotoRecord).default([]),
    meta: uniqueKeys('meta', MetaRecord),
  }),
})
export type BackupFile = z.infer<typeof BackupFile>

/** A backup refused on restore; the message says why. */
export class BackupError extends Error {
  override name = 'BackupError'
}

/** Steps from file version n to n + 1, applied to the raw JSON before validation. None yet. */
const FILE_MIGRATIONS: Record<number, (raw: Record<string, unknown>) => Record<string, unknown>> = {}

/** Steps from database schema version n to n + 1, applied to a validated file's records. None yet. */
const RECORD_MIGRATIONS: Record<number, (stores: BackupFile['stores']) => BackupFile['stores']> = {}

function issuePath(path: readonly PropertyKey[]): string {
  const parts = path[0] === 'stores' ? path.slice(1) : path
  return parts.map((p) => (typeof p === 'number' ? `record ${p + 1}` : String(p))).join(' › ')
}

/** Reads a backup file's text: validates it, migrates it from older versions, or throws a BackupError. */
export function parseBackup(text: string): BackupFile {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new BackupError('This file is not a Tortoise backup: it is not readable JSON.')
  }
  if (typeof raw !== 'object' || raw === null || (raw as { format?: unknown }).format !== BACKUP_FORMAT) {
    throw new BackupError('This file is not a Tortoise backup.')
  }
  let obj = raw as Record<string, unknown>
  const version = obj.version
  if (typeof version !== 'number' || !Number.isInteger(version) || version < 1) {
    throw new BackupError('This backup has no valid version number, so it was not imported.')
  }
  if (version > BACKUP_VERSION) {
    throw new BackupError(
      'This backup comes from a newer version of Tortoise. Update the app, then import it again.',
    )
  }
  for (let v = version; v < BACKUP_VERSION; v++) {
    const step = FILE_MIGRATIONS[v]
    if (!step) throw new BackupError(`This backup's version ${version} cannot be read any more.`)
    obj = { ...step(obj), version: v + 1 }
  }
  if (typeof obj.schemaVersion === 'number' && obj.schemaVersion > SCHEMA_VERSION) {
    throw new BackupError(
      'This backup comes from a newer version of Tortoise. Update the app, then import it again.',
    )
  }
  const parsed = BackupFile.safeParse(obj)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    const where = issue ? issuePath(issue.path) : ''
    throw new BackupError(
      `This backup is damaged, so nothing was imported${where ? ` (${where}: ${issue?.message})` : ''}.`,
    )
  }
  const file = parsed.data
  let stores = file.stores
  for (let v = file.schemaVersion; v < SCHEMA_VERSION; v++) {
    const step = RECORD_MIGRATIONS[v]
    if (step) stores = step(stores)
  }
  return { ...file, stores, schemaVersion: SCHEMA_VERSION }
}

/** True when the incoming record is newer than the stored one (D-032); a tie keeps the stored record. */
export function isNewer(incoming: { updatedAt: string }, stored: { updatedAt: string } | undefined): boolean {
  if (!stored) return true
  const a = Date.parse(incoming.updatedAt)
  const b = Date.parse(stored.updatedAt)
  if (Number.isNaN(a) || Number.isNaN(b)) return incoming.updatedAt > stored.updatedAt
  return a > b
}

type Stores_ = BackupFile['stores']

/** The stores of `base` with every record of `incoming` that is newer or missing in it (D-032); meta stays base's. */
export function mergeStores(base: Stores_, incoming: Stores_): Stores_ {
  const out = { ...base }
  for (const name of STORE_NAMES) {
    if (name === 'meta') continue
    const keyOf = KEY_OF[name] as (r: AnyRecord) => string
    const merged = new Map((base[name] as AnyRecord[]).map((r) => [keyOf(r), r]))
    for (const r of incoming[name] as AnyRecord[]) {
      if (isNewer(r, merged.get(keyOf(r)))) merged.set(keyOf(r), r)
    }
    ;(out as Record<string, AnyRecord[]>)[name] = [...merged.values()]
  }
  return out
}

/** True when `mine` holds a record that `theirs` lacks or holds an older copy of: `theirs` needs an upload. */
export function aheadOf(mine: Stores_, theirs: Stores_): boolean {
  return STORE_NAMES.some((name) => {
    if (name === 'meta') return false
    const keyOf = KEY_OF[name] as (r: AnyRecord) => string
    const other = new Map((theirs[name] as AnyRecord[]).map((r) => [keyOf(r), r]))
    return (mine[name] as AnyRecord[]).some((r) => isNewer(r, other.get(keyOf(r))))
  })
}

/** What one side of a sync holds, to compare this device with the Drive copy (D-071). */
export interface StateSummary {
  /** The Monday of Week 1, when a plan is set. */
  startDate?: string
  /** Days with a done part. */
  activeDays: number
  firstDay?: string
  lastDay?: string
  badges: number
  /** Something was done: a day with a done part or a logged set. A plan and its start answers alone are not. */
  progress: boolean
}

export function summarize(stores: Stores_): StateSummary {
  const active = stores.days
    .filter((d) => d.morning || d.main || d.split)
    .map((d) => d.date)
    .sort()
  return {
    startDate: stores.settings[0]?.startDate,
    activeDays: active.length,
    firstDay: active[0],
    lastDay: active.at(-1),
    badges: stores.milestones.length,
    progress: active.length > 0 || stores.logs.length > 0,
  }
}

/**
 * True when replacing `lost` with `kept` throws away more or older history (D-071): more days done, an earlier first
 * day, or more badges. The choice then needs a second, typed confirmation.
 */
export function losesMore(lost: StateSummary, kept: StateSummary): boolean {
  if (lost.activeDays > kept.activeDays || lost.badges > kept.badges) return true
  return lost.firstDay !== undefined && (kept.firstDay === undefined || lost.firstDay < kept.firstDay)
}

/** Reads every store in one transaction. */
export async function readAllStores(db: Db): Promise<BackupFile['stores']> {
  return db.transaction([...STORE_NAMES], 'readonly', async (tx) => {
    const lists = await Promise.all(STORE_NAMES.map((name) => request(tx.objectStore(name).getAll())))
    return Object.fromEntries(STORE_NAMES.map((name, i) => [name, lists[i]])) as BackupFile['stores']
  })
}

export interface ImportResult {
  written: number
  kept: number
}

type AnyRecord = Stores[StoreName]

/**
 * Merges a validated backup in one transaction: for each key the record with the later updatedAt is kept (D-032). The
 * meta record keeps describing this database and app, with the earlier of the two creation dates.
 */
export async function importBackup(
  db: Db,
  file: Pick<BackupFile, 'stores'>,
  now: Date,
): Promise<ImportResult> {
  const names = STORE_NAMES.filter((n) => n !== 'meta')
  return db.transaction([...STORE_NAMES], 'readwrite', async (tx) => {
    let written = 0
    let kept = 0
    const existing = await Promise.all(
      STORE_NAMES.map((name) => request(tx.objectStore(name).getAll()) as Promise<AnyRecord[]>),
    )
    const localMeta = existing[STORE_NAMES.indexOf('meta')]?.[0] as Stores['meta'] | undefined
    names.forEach((name) => {
      const store = tx.objectStore(name)
      const incoming = file.stores[name] as AnyRecord[]
      const keyOf = KEY_OF[name] as (r: AnyRecord) => string
      const stored = new Map((existing[STORE_NAMES.indexOf(name)] ?? []).map((r) => [keyOf(r), r]))
      for (const r of incoming) {
        if (isNewer(r, stored.get(keyOf(r)))) {
          store.put(r)
          written++
        } else kept++
      }
    })
    const fileMeta = file.stores.meta[0]
    if (fileMeta && localMeta && Date.parse(fileMeta.createdAt) < Date.parse(localMeta.createdAt)) {
      tx.objectStore('meta').put({
        ...localMeta,
        createdAt: fileMeta.createdAt,
        updatedAt: now.toISOString(),
      })
    }
    return { written, kept }
  })
}

/**
 * Replaces every record with the given stores in one transaction (D-071: "use Google Drive's"). The meta record keeps
 * describing this database and app, with the earlier of the two creation dates.
 */
export async function replaceAll(db: Db, stores: Stores_, now: Date): Promise<void> {
  await db.transaction([...STORE_NAMES], 'readwrite', async (tx) => {
    const localMeta = (await request(tx.objectStore('meta').get('meta'))) as Stores['meta'] | undefined
    for (const name of STORE_NAMES) {
      if (name === 'meta') continue
      const store = tx.objectStore(name)
      store.clear()
      for (const r of stores[name] as AnyRecord[]) store.put(r)
    }
    const fileMeta = stores.meta[0]
    if (fileMeta && localMeta && Date.parse(fileMeta.createdAt) < Date.parse(localMeta.createdAt)) {
      tx.objectStore('meta').put({
        ...localMeta,
        createdAt: fileMeta.createdAt,
        updatedAt: now.toISOString(),
      })
    }
  })
}

/** Deletes every record, then writes a fresh meta record (design §3.7, Reset). */
export async function wipeAll(db: Db, now: Date, appVersion: string): Promise<void> {
  await db.transaction([...STORE_NAMES], 'readwrite', (tx) => {
    for (const name of STORE_NAMES) tx.objectStore(name).clear()
    const at = now.toISOString()
    tx.objectStore('meta').put({
      key: 'meta',
      schemaVersion: SCHEMA_VERSION,
      createdAt: at,
      appVersion,
      updatedAt: at,
    })
  })
}
