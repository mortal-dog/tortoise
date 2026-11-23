// The Google Drive sync (D-054, D-055), after the French app's src/features/sync/sync.ts. It is the app's only backup:
// the backup file, its import and the Today reminder went with D-055.
//
// ONE FILE PER DEVICE. Each device writes only `device-<its id>.json` in the app's hidden Drive folder: a whole backup
// in the backup format (backup.ts). Two devices can never overwrite each other's copy.
//
// WHEN IT RUNS, BY ITSELF (the owner: "make sure google drive sync is automatic"). It uploads only when something
// changed since the last upload: 20 s after the last change, when the app goes to the background, when it opens or
// comes back on screen, when the connection returns, and every five minutes while on screen. "Sync now" uploads at
// any time. The hour-long Google token does not stop it: it is renewed in a hidden frame, or on the user's next tap
// anywhere in the app (`google.ts`, `armNextTap` below). With no network the change stays to upload, and the
// `online` event sends it.
//
// RESTORE. Signing in on a device for the first time (a new phone, or this one after "Delete all data") merges every
// device file into this phone first: for each record the newer `updatedAt` wins (D-032). An ordinary sync only
// uploads, so a photo deleted here does not come back from the Drive copy.
//
// SAFETY. A phone with no plan and no days never uploads, so a wiped phone cannot overwrite its Drive copy with
// nothing; "Delete all data" also forgets the sign-in on this phone. The Drive files stay until the user removes them
// (Google Drive → Settings → Manage apps).
import { useSyncExternalStore } from 'react'
import { BACKUP_FORMAT, BACKUP_VERSION, type BackupFile, parseBackup, readAllStores } from '@/lib/backup'
import { SCHEMA_VERSION } from '@/lib/db'
import { onChange } from '@/lib/live'
import { appVersion, getDb, mergeBackup } from '@/lib/repo'
import { AuthError, type DriveFile, listFiles, readText, writeText } from './drive'
import {
  dropToken,
  liveToken,
  preloadGis,
  readSession,
  signIn,
  signOut,
  silentToken,
  silentWorks,
} from './google'

export const FILE_PREFIX = 'device-'
const DEVICE_KEY = 'tortoise.deviceId'
const CACHE_KEY = 'tortoise.drive'
/** After a change, upload once nothing has changed for this long. */
const QUIET_MS = 20_000
/** While the app is on screen, look this often for a change still to upload. */
const PERIOD_MS = 5 * 60_000
/** The sync card's buttons do their own signing in; a tap on them does not answer the armed tap. */
export const SYNC_CONTROLS = 'js-sync-controls'

interface Cache {
  fileId?: string
  /** Unix ms of the last upload. */
  lastSync?: number
  /** Something changed since the last upload. */
  dirty?: boolean
}

/** `offline` is not a fault: the change stays to upload and goes when the connection is back. */
export type DriveStatus = 'signed-out' | 'needs-tap' | 'syncing' | 'ok' | 'offline' | 'error'

export interface DriveState {
  status: DriveStatus
  email?: string
  lastSync?: number
  error?: string
}

export interface Drive {
  listFiles: (token: string, prefix: string) => Promise<DriveFile[]>
  readText: (token: string, id: string) => Promise<string>
  writeText: (token: string, name: string, text: string, id?: string) => Promise<string>
}
const DRIVE: Drive = { listFiles, readText, writeText }
/** The Drive every sync talks to; the tests put a fake one here. */
let currentDrive: Drive = DRIVE

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

// A small store for the Settings card.
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
  drive: Drive = currentDrive,
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
      written += (await mergeBackup(backup)).written
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

let signingIn: Promise<string> | null = null

/**
 * One sign-in at a time: "Sync now" pressed while the armed tap's popup is still open would be a second popup.
 */
function askForToken(): Promise<string> {
  signingIn ??= signIn().finally(() => {
    signingIn = null
  })
  return signingIn
}

/** The popup. Sets the state itself on refusal, so the caller sees a token or null. */
async function popupToken(): Promise<string | null> {
  try {
    const token = await askForToken()
    tapRefused = false
    return token
  } catch (e) {
    setState({ status: readSession()?.email ? 'needs-tap' : 'signed-out', error: (e as Error).message })
    return null
  }
}

/**
 * A live token: the stored one while it lasts, else the hidden-frame renew, else, from a tap, the popup. With nothing
 * left to try it arms the next tap and resolves null.
 */
async function ensureToken(fromTap: boolean): Promise<string | null> {
  const live = liveToken()
  if (live) return live
  const email = readSession()?.email
  // Signed out: nothing to renew, and consent needs a screen.
  if (!email) {
    if (!fromTap) return null
    setState({ status: 'syncing', error: undefined })
    return popupToken()
  }
  // The invisible path. On a tap it is skipped where it has never worked, because the popup must open inside the
  // gesture (google.ts, `silentWorks`).
  if (!fromTap || silentWorks()) {
    setState({ status: 'syncing', error: undefined, email })
    const silent = await silentToken()
    if (silent) return silent
  }
  if (fromTap) return popupToken()
  armNextTap()
  setState({ status: 'needs-tap', email })
  return null
}

/** The armed tap's listener, while one waits. */
let armed: ((event: Event) => void) | null = null
/** A popup the user closed or Google refused: no other popup on an ordinary tap in this visit. */
let tapRefused = false

/**
 * The fallback (D-055): when the token is gone and the hidden frame cannot replace it, the user's next tap anywhere in
 * the app does. A tap may open a popup, and with consent already given Google's popup closes by itself. `signIn()` is
 * called straight from the gesture, with no `await` before it, because Safari allows a popup only in the same turn as
 * the tap. It listens for `click`, not `pointerdown`: a touch's pointerdown does not count as a user activation (only
 * its pointerup, touchend and click do), so a popup opened from it is blocked on a phone. Armed once at a time.
 */
function armNextTap(): void {
  if (armed || tapRefused || typeof window === 'undefined') return
  const onGesture = (event: Event) => {
    const target = event.target
    if (target instanceof Element && target.closest(`.${SYNC_CONTROLS}`)) return
    disarm()
    // Signed out since it was armed: a tap is no reason to sign in.
    if (!readSession()?.email) return
    setState({ status: 'syncing', error: undefined })
    askForToken().then(
      () => {
        tapRefused = false
        void syncNow()
      },
      (e: Error) => {
        tapRefused = true
        setState({ status: readSession()?.email ? 'needs-tap' : 'signed-out', error: e.message })
      },
    )
  }
  armed = onGesture
  window.addEventListener('click', onGesture, true)
  window.addEventListener('keydown', onGesture, true)
}

function disarm(): void {
  if (!armed) return
  window.removeEventListener('click', armed, true)
  window.removeEventListener('keydown', armed, true)
  armed = null
}

/** A request that never reached Google rejects with a TypeError ("Failed to fetch"). */
function isOffline(e: unknown): boolean {
  return e instanceof TypeError || (typeof navigator !== 'undefined' && navigator.onLine === false)
}

let running: Promise<void> | null = null

/**
 * Syncs once. `fromTap`: the call comes from a tap, so a missing token may be asked for with a popup. A device's
 * first sync after signing in restores the Drive copies first. Concurrent calls share the one in flight.
 */
export function syncNow(opts: { fromTap?: boolean } = {}, drive: Drive = currentDrive): Promise<void> {
  running ??= run(opts.fromTap ?? false, drive).finally(() => {
    running = null
  })
  return running
}

async function run(fromTap: boolean, drive: Drive): Promise<void> {
  const token = await ensureToken(fromTap)
  if (!token) return
  const cache = readCache()
  const firstTime = !cache.fileId && !cache.lastSync
  setState({ status: 'syncing', error: undefined, email: readSession()?.email })
  try {
    const result = await exchange(token, firstTime, drive)
    const lastSync = result.uploaded ? Date.now() : readCache().lastSync
    // A change made after this phone's file was read is not in the upload, so it stays to upload.
    writeCache({ fileId: result.fileId, lastSync, dirty: !result.uploaded || changes !== result.snapshot })
    setState({ status: 'ok', lastSync, error: undefined })
  } catch (e) {
    if (e instanceof AuthError) {
      dropToken()
      armNextTap()
      setState({ status: 'needs-tap', error: undefined })
    } else if (isOffline(e)) {
      setState({ status: 'offline', error: undefined })
    } else {
      setState({ status: 'error', error: (e as Error).message })
    }
  }
}

/** Signs out on this phone (and with Google); the Drive files stay. */
export async function driveSignOut(revoke = true): Promise<void> {
  disarm()
  await signOut(revoke)
  writeCache({ fileId: undefined, lastSync: undefined, dirty: false })
  setState({ status: 'signed-out', email: undefined, lastSync: undefined, error: undefined })
}

/**
 * An automatic sync: uploads when something waits to be uploaded (a change, or a sign-in whose first sync has not
 * finished). With nothing to upload, an opening or a return to the screen still renews a dead token, so the visit's
 * changes find a live one.
 */
export function autoSync(drive: Drive = currentDrive): Promise<void> {
  if (!readSession()?.email) return Promise.resolve()
  const cache = readCache()
  if (cache.dirty || !cache.lastSync) return syncNow({}, drive)
  if (liveToken()) return Promise.resolve()
  return ensureToken(false).then(() => {
    if (liveToken() && state.status === 'syncing') setState({ status: 'ok' })
  })
}

let started = false
let quietTimer: number | undefined

/** Starts the automatic sync; main.tsx calls it once. None of these is a tap, so none opens a popup. */
export function startAutoSync(): void {
  if (started || typeof window === 'undefined') return
  started = true
  state = initialState()
  preloadGis()
  onChange(() => {
    changes++
    writeCache({ dirty: true })
    window.clearTimeout(quietTimer)
    quietTimer = window.setTimeout(() => void autoSync(), QUIET_MS)
  })
  void autoSync()
  document.addEventListener('visibilitychange', () => void autoSync())
  window.addEventListener('online', () => void autoSync())
  window.setInterval(() => {
    if (document.visibilityState === 'visible') void autoSync()
  }, PERIOD_MS)
}

/** For tests: forget the module's state, read it again from storage, and talk to `drive` from now on. */
export function resetSyncForTests(drive: Drive = DRIVE): void {
  currentDrive = drive
  state = initialState()
  running = null
  signingIn = null
  if (typeof window !== 'undefined') disarm()
  tapRefused = false
  changes = 0
}
