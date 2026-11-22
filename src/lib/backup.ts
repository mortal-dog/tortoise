// Backup and restore (design §10): one versioned JSON file holding every store; import validates it with zod, shows
// a preview, then merges (for each key the later updatedAt wins, D-032) or replaces, in one transaction.
import { z } from 'zod'
import { addDays, compareDates, daysBetween, type LocalDate, localDateOf } from './dates'
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

/** A file refused on import; the message is shown to the user as it is. */
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

export interface BackupPreview {
  exportedAt: string
  appVersion: string
  counts: { [S in Exclude<StoreName, 'meta'>]: number }
  /** The earliest and latest date among days, logs and tests; null when there are none. */
  range: { from: LocalDate; to: LocalDate } | null
}

export function previewBackup(file: BackupFile): BackupPreview {
  const s = file.stores
  const dates = [
    ...s.days.map((d) => d.date),
    ...s.logs.map((l) => l.date),
    ...s.tests.map((t) => t.date),
  ].sort(compareDates)
  const from = dates[0]
  const to = dates.at(-1)
  return {
    exportedAt: file.exportedAt,
    appVersion: file.appVersion,
    counts: {
      settings: s.settings.length,
      days: s.days.length,
      logs: s.logs.length,
      levels: s.levels.length,
      tests: s.tests.length,
      overrides: s.overrides.length,
      milestones: s.milestones.length,
      photos: s.photos.length,
    },
    range: from && to ? { from, to } : null,
  }
}

/** True when the incoming record is newer than the stored one (D-032); a tie keeps the stored record. */
export function isNewer(incoming: { updatedAt: string }, stored: { updatedAt: string } | undefined): boolean {
  if (!stored) return true
  const a = Date.parse(incoming.updatedAt)
  const b = Date.parse(stored.updatedAt)
  if (Number.isNaN(a) || Number.isNaN(b)) return incoming.updatedAt > stored.updatedAt
  return a > b
}

/** Reads every store in one transaction. */
export async function readAllStores(db: Db): Promise<BackupFile['stores']> {
  return db.transaction([...STORE_NAMES], 'readonly', async (tx) => {
    const lists = await Promise.all(STORE_NAMES.map((name) => request(tx.objectStore(name).getAll())))
    return Object.fromEntries(STORE_NAMES.map((name, i) => [name, lists[i]])) as BackupFile['stores']
  })
}

export function backupFileName(exportedAt: Date): string {
  return `tortoise-backup-${localDateOf(exportedAt)}.json`
}

export interface PreparedBackup {
  file: BackupFile
  text: string
  name: string
  /** The settings record as it is in the file, with the backup date set; saved once the file has gone out. */
  settings: SettingsRecord | undefined
}

/**
 * Builds the backup file. The settings record inside already carries this backup's date, so that once markBackedUp()
 * saves the same record, the phone and the file hold identical data.
 */
export async function prepareBackup(db: Db, now: Date, appVersion: string): Promise<PreparedBackup> {
  const stores = await readAllStores(db)
  const at = now.toISOString()
  const current = stores.settings[0]
  const settings = current
    ? { ...current, backup: { ...current.backup, lastAt: at }, updatedAt: at }
    : undefined
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: at,
    appVersion,
    schemaVersion: SCHEMA_VERSION,
    stores: { ...stores, settings: settings ? [settings] : [] },
  }
  return { file, text: JSON.stringify(file), name: backupFileName(now), settings }
}

export async function markBackedUp(db: Db, prepared: PreparedBackup): Promise<void> {
  if (prepared.settings) await db.put('settings', prepared.settings)
}

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  written: number
  kept: number
}

type AnyRecord = Stores[StoreName]

/**
 * Writes a validated backup in one transaction: Replace clears every store first; Merge keeps, for each key, the
 * record with the later updatedAt. The meta record always describes this database and app: Replace takes the file's
 * creation date, Merge the earlier of the two.
 */
export async function importBackup(
  db: Db,
  file: BackupFile,
  mode: ImportMode,
  now: Date,
  appVersion: string,
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
      if (mode === 'replace') {
        store.clear()
        for (const r of incoming) store.put(r)
        written += incoming.length
        return
      }
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
    const meta = tx.objectStore('meta')
    if (mode === 'replace' && fileMeta) {
      meta.put({ ...fileMeta, schemaVersion: SCHEMA_VERSION, appVersion })
    } else if (
      mode === 'merge' &&
      fileMeta &&
      localMeta &&
      Date.parse(fileMeta.createdAt) < Date.parse(localMeta.createdAt)
    ) {
      meta.put({ ...localMeta, createdAt: fileMeta.createdAt, updatedAt: now.toISOString() })
    }
    return { written, kept }
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

export interface BackupDue {
  due: boolean
  /** Days since the last backup; null when there has been none. */
  daysSince: number | null
}

/**
 * The backup reminder (design §10): due when the last backup is `everyDays` or more days old; with no backup yet,
 * counted from the Monday Week 0 began. Never due before the plan has started.
 */
export function backupDue(settings: SettingsRecord, todayDate: LocalDate): BackupDue {
  const last = settings.backup.lastAt ? localDateOf(new Date(settings.backup.lastAt)) : null
  const daysSince = last ? daysBetween(last, todayDate) : null
  if (!settings.startDate) return { due: false, daysSince }
  const from = last ?? addDays(settings.startDate, -7)
  return { due: daysBetween(from, todayDate) >= settings.backup.everyDays, daysSince }
}
