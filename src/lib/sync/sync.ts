// The Google Drive backup (D-054), after the French app's src/features/sync/sync.ts.
//
// ONE FILE PER DEVICE. Each device writes only `device-<its id>.json` in the app's hidden Drive folder: a whole backup
// in the format of the backup file (backup.ts), so the two backups are one format. Two devices can never overwrite each
// other's copy.
//
// WHEN IT RUNS (the owner: "sync by itself, at a suitable time"). With a live token, and only when something changed
// since the last upload: 20 s after the last change, when the app goes to the background, and when it opens or comes
// back after a few minutes. Without a live token (Google's token lasts an hour, and asking for a new one needs a tap)
// it waits for "Sync now".
//
// RESTORE. Signing in on a device for the first time, and "Restore from Google Drive", merge every device file into
// this phone first: for each record the newer `updatedAt` wins, as a backup import does (D-032). So a new phone, or
// this one after "Delete all data", gets everything back. An ordinary sync only uploads, so a photo deleted here does
// not come back from the Drive copy.
//
// SAFETY. A phone with no plan and no days never uploads, so a wiped phone cannot overwrite its Drive copy with
// nothing; "Delete all data" also forgets the sign-in on this phone. The Drive files stay until the user removes them
// (Google Drive → Settings → Manage apps).
import { useSyncExternalStore } from 'react'
import { BACKUP_FORMAT, BACKUP_VERSION, type BackupFile, parseBackup, readAllStores } from '@/lib/backup'
import { SCHEMA_VERSION } from '@/lib/db'
import { onChange } from '@/lib/live'
import { appVersion, getDb, importBackupFile } from '@/lib/repo'
import { AuthError, type DriveFile, listFiles, readText, writeText } from './drive'
import { dropToken, liveToken, readSession, signIn, signOut } from './google'

export const FILE_PREFIX = 'device-'
const DEVICE_KEY = 'tortoise.deviceId'
const CACHE_KEY = 'tortoise.drive'
/** On returning to the app, look again once this long has passed. */
const RESYNC_MS = 3 * 60_000
/** After a change, upload once nothing has changed for this long. */
const QUIET_MS = 20_000

interface Cache {
  fileId?: string
  /** Unix ms of the last upload. */
  lastSync?: number
  /** Something changed since the last upload. */
  dirty?: boolean
}

export type DriveStatus = 'signed-out' | 'needs-tap' | 'syncing' | 'ok' | 'error'

export interface DriveState {
  status: DriveStatus
  email?: string
  lastSync?: number
  error?: string
  /** What the last restore did, for the Settings card. */
  restored?: string
}

export interface Drive {
  listFiles: (token: string, prefix: string) => Promise<DriveFile[]>
  readText: (token: string, id: string) => Promise<string>
  writeText: (token: string, name: string, text: string, id?: string) => Promise<string>
}
const DRIVE: Drive = { listFiles, readText, writeText }

function readJsonKey<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function writeJsonKey(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage refused: the next sync starts over, which is safe.
  }
}

const readCache = () => readJsonKey<Cache>(CACHE_KEY, {})
const writeCache = (patch: Partial<Cache>) => writeJsonKey(CACHE_KEY, { ...readCache(), ...patch })

/** This device's id, made once and kept. */
export function deviceId(): string {
  let id = readJsonKey<string | null>(DEVICE_KEY, null)
  if (!id) {
    id = crypto.randomUUID()
    writeJsonKey(DEVICE_KEY, id)
  }
  return id
}

// A small store for the Settings card and the Today reminder.
let state: DriveState = { status: 'signed-out' }
/** Changes seen since the app started (live.ts). */
let changes = 0
const listeners = new Set<() => void>()

function setState(patch: Partial<DriveState>): void {
  state = { ...state, ...patch }
  for (const l of listeners) l()
}

function initialState(): DriveState {
  const session = readSession()
  const cache = readCache()
  if (!session?.email && !session?.accessToken) return { status: 'signed-out', lastSync: cache.lastSync }
  return {
    status: liveToken() ? 'ok' : 'needs-tap',
    email: session.email,
    lastSync: cache.lastSync,
  }
}

export function useDriveSync(): DriveState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

export function driveState(): DriveState {
  return state
}

/** This phone's backup, as it would be written now; `empty` when there is no plan and no day to keep. */
export async function ownFile(now: Date = new Date()): Promise<{ text: string; empty: boolean }> {
  const stores = await readAllStores(await getDb())
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    appVersion: appVersion(),
    schemaVersion: SCHEMA_VERSION,
    stores,
  }
  const empty = !stores.settings[0]?.startDate && stores.days.length === 0
  return { text: JSON.stringify(file), empty }
}

export interface ExchangeResult {
  fileId?: string
  uploaded: boolean
  /** The change count when this phone's file was read: a later change is not in the upload. */
  snapshot: number
  /** Records written by the restore, and the device files it read. */
  restored?: { written: number; files: number }
}

/**
 * One exchange with Drive: with `restore`, merge every device file into this phone first; then write this device's
 * file, unless the phone is empty. `drive` is for the tests.
 */
export async function exchange(
  token: string,
  restore: boolean,
  drive: Drive = DRIVE,
): Promise<ExchangeResult> {
  const me = `${FILE_PREFIX}${deviceId()}.json`
  const files = await drive.listFiles(token, FILE_PREFIX)
  let fileId = files.find((f) => f.name === me)?.id ?? readCache().fileId
  let restored: ExchangeResult['restored']
  if (restore) {
    let written = 0
    let read = 0
    for (const f of files) {
      let backup: BackupFile
      try {
        backup = parseBackup(await drive.readText(token, f.id))
      } catch (e) {
        if (e instanceof AuthError) throw e
        continue // a damaged or newer file is skipped, never half-read
      }
      written += (await importBackupFile(backup, 'merge')).written
      read++
    }
    restored = { written, files: read }
  }
  const snapshot = changes
  const own = await ownFile()
  if (own.empty) return { fileId, uploaded: false, snapshot, restored }
  if (fileId) {
    try {
      await drive.writeText(token, me, own.text, fileId)
      return { fileId, uploaded: true, snapshot, restored }
    } catch (e) {
      // Gone since the last sync (deleted in Drive): write it anew below.
      if (e instanceof AuthError) throw e
    }
  }
  fileId = await drive.writeText(token, me, own.text)
  return { fileId, uploaded: true, snapshot, restored }
}

let running: Promise<void> | null = null

/**
 * Syncs once. `fromTap`: the user pressed a button, so a missing token may be asked for (a popup); otherwise a sync
 * without a live token stops at "needs-tap". `restore` merges the Drive copies first; a device's first sign-in always
 * restores. Concurrent calls share the one in flight.
 */
export function syncNow(
  opts: { fromTap?: boolean; restore?: boolean } = {},
  drive: Drive = DRIVE,
): Promise<void> {
  running ??= run(opts.fromTap ?? false, opts.restore ?? false, drive).finally(() => {
    running = null
  })
  return running
}

async function run(fromTap: boolean, restore: boolean, drive: Drive): Promise<void> {
  let token = liveToken()
  let firstTime = !readCache().fileId && !readCache().lastSync
  if (!token) {
    if (!fromTap) {
      if (readSession()?.email) setState({ status: 'needs-tap' })
      return
    }
    setState({ status: 'syncing', error: undefined })
    try {
      token = await signIn()
    } catch (e) {
      setState({ status: readSession()?.email ? 'needs-tap' : 'signed-out', error: (e as Error).message })
      return
    }
    firstTime = firstTime || !readCache().lastSync
  }
  setState({ status: 'syncing', error: undefined, email: readSession()?.email })
  try {
    const result = await exchange(token, restore || firstTime, drive)
    const lastSync = result.uploaded ? Date.now() : readCache().lastSync
    // A change made after this phone's file was read is not in the upload, so it stays to upload.
    writeCache({ fileId: result.fileId, lastSync, dirty: !result.uploaded || changes !== result.snapshot })
    setState({
      status: 'ok',
      lastSync,
      error: undefined,
      restored: result.restored
        ? `Restored: ${result.restored.written} record${result.restored.written === 1 ? '' : 's'} taken from ${result.restored.files} Drive cop${result.restored.files === 1 ? 'y' : 'ies'}.`
        : state.restored,
    })
  } catch (e) {
    if (e instanceof AuthError) {
      dropToken()
      setState({ status: 'needs-tap', error: `Google asked to sign in again. ${(e as Error).message}` })
    } else {
      setState({ status: 'error', error: (e as Error).message })
    }
  }
}

/** Signs out on this phone (and with Google); the Drive files stay. */
export async function driveSignOut(revoke = true): Promise<void> {
  await signOut(revoke)
  writeCache({ fileId: undefined, lastSync: undefined, dirty: false })
  setState({
    status: 'signed-out',
    email: undefined,
    lastSync: undefined,
    error: undefined,
    restored: undefined,
  })
}

let started = false
let quietTimer: number | undefined

function uploadIfDirty(): void {
  if (liveToken() && readCache().dirty) void syncNow()
}

/** Starts the automatic uploads; main.tsx calls it once. None of these is a tap, so none opens a popup. */
export function startAutoSync(): void {
  if (started || typeof window === 'undefined') return
  started = true
  state = initialState()
  onChange(() => {
    changes++
    writeCache({ dirty: true })
    window.clearTimeout(quietTimer)
    quietTimer = window.setTimeout(uploadIfDirty, QUIET_MS)
  })
  uploadIfDirty()
  document.addEventListener('visibilitychange', () => {
    if (!liveToken()) {
      if (readSession()?.email && state.status === 'ok') setState({ status: 'needs-tap' })
      return
    }
    const since = Date.now() - (readCache().lastSync ?? 0)
    if (document.visibilityState === 'hidden' || since > RESYNC_MS) uploadIfDirty()
  })
}

/** For tests: forget the module's state. */
export function resetSyncForTests(): void {
  state = { status: 'signed-out' }
  running = null
  changes = 0
}
