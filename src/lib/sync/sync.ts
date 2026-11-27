// The Google Drive sync (D-054, D-055, D-071), after the French app's src/features/sync/sync.ts. It is the app's only
// backup, and it carries every record (days, logs, levels, badges, check-ins, settings) from one device to another.
//
// ONE SHARED FILE (D-071). Every device signed in to the same Google account syncs `tortoise.json` in the app's hidden
// Drive folder: a whole backup in the backup format (backup.ts) plus a `generation`, the copy's lineage. The
// per-device files of D-054 (`device-<id>.json`) are merged into it once and deleted.
//
// EACH SYNC, BOTH WAYS. When the Drive copy changed since this device last read or wrote it, it is read and merged
// into this device (for each record the newer `updatedAt` wins, D-032); then this device writes the copy when it holds
// something the copy lacks. So a session done on one phone shows on the other at its next sync.
//
// THE FIRST SYNC AFTER SIGNING IN (the owner, 2026-11-27) compares the two sides instead of merging blindly. Progress
// (a day with a done part, or a logged set) outranks a plan alone, which outranks nothing:
// - only Drive has progress (a new phone where the plan was just chosen): Drive's whole state replaces this device's;
// - only this device has progress: it replaces the Drive copy;
// - both, on the same plan (the same Week 1 Monday), or both with a plan and no progress: merged;
// - both, on different plans: the user chooses which side replaces the other (SyncConflictDialog), with a second,
//   typed confirmation when the side to be replaced holds more or older history (backup.ts `losesMore`).
// A replacement gives the copy a new generation; a device that synced under the old one compares the same way at its
// next sync instead of merging its records back into the copy.
//
// WHEN IT RUNS, BY ITSELF (the owner: "make sure google drive sync is automatic"): 20 s after the last change, when
// the app goes to the background, when it opens or comes back on screen, when the connection returns, and every five
// minutes while on screen. "Sync now" runs it at any time. The hour-long Google token is renewed in a hidden frame,
// or on the user's next tap anywhere in the app (`google.ts`, `armNextTap` below), at most once per opening of the app
// and only while a change waits to upload (D-074). With no network the change stays to upload, and the `online` event
// sends it.
//
// SAFETY. A phone with no plan and no days never uploads, so a wiped phone cannot overwrite its Drive copy with
// nothing; "Delete all data" also forgets the sign-in on this phone. The Drive file stays until the user removes it
// (Google Drive → Settings → Manage apps).
import { useSyncExternalStore } from 'react'
import {
  aheadOf,
  BACKUP_FORMAT,
  BACKUP_VERSION,
  BackupError,
  type BackupFile,
  mergeStores,
  parseBackup,
  readAllStores,
  type StateSummary,
  summarize,
} from '@/lib/backup'
import { SCHEMA_VERSION } from '@/lib/db'
import { onChange } from '@/lib/live'
import { appVersion, getDb, mergeBackup, replaceWithBackup } from '@/lib/repo'
import { AuthError, type DriveFile, deleteFile, listFiles, readText, writeText } from './drive'
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

/** The one file every device syncs (D-071). */
export const SHARED_NAME = 'tortoise.json'
/** The per-device files of D-054, merged into the shared file and deleted. */
export const LEGACY_PREFIX = 'device-'
const CACHE_KEY = 'tortoise.drive'
/** After a change, sync once nothing has changed for this long. */
const QUIET_MS = 20_000
/** While the app is on screen, sync this often. */
const PERIOD_MS = 5 * 60_000
/** The sync card's buttons do their own signing in; a tap on them does not answer the armed tap. */
export const SYNC_CONTROLS = 'js-sync-controls'

interface Cache {
  /** The shared file's id. */
  fileId?: string
  /** Its modified time when this device last read or wrote it: the same time means nothing new to read. */
  seen?: string
  /** The copy's generation this device synced under; unset until the first sync after signing in has finished. */
  generation?: string
  /** Unix ms of the last finished sync. */
  lastSync?: number
  /** Something changed since the last upload. */
  dirty?: boolean
}

/** `offline` is not a fault: the change stays to upload and goes when the connection is back. */
export type DriveStatus = 'signed-out' | 'needs-tap' | 'syncing' | 'ok' | 'offline' | 'error' | 'conflict'

/** The two sides of a first sync that cannot be merged (D-071). */
export interface Conflict {
  local: StateSummary
  remote: StateSummary
}

export interface DriveState {
  status: DriveStatus
  email?: string
  lastSync?: number
  error?: string
  /** Set while the status is `conflict`: the user has to choose. */
  conflict?: Conflict
}

export interface Drive {
  listFiles: (token: string) => Promise<DriveFile[]>
  readText: (token: string, id: string) => Promise<string>
  writeText: (token: string, name: string, text: string, id?: string) => Promise<DriveFile>
  deleteFile: (token: string, id: string) => Promise<void>
}
const DRIVE: Drive = { listFiles, readText, writeText, deleteFile }
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
    // Storage refused: the next sync compares again, which is safe.
  }
}

const readCache = () => readJsonKey<Cache>(CACHE_KEY, {})
const writeCache = (patch: Partial<Cache>) => writeJsonKey(CACHE_KEY, { ...readCache(), ...patch })

// A small store for the Settings card and the conflict dialog.
let state: DriveState = { status: 'signed-out' }
/** This device's own changes seen since the app started (live.ts); writes from Drive are not counted. */
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

type Stores = BackupFile['stores']

/** A phone with no plan and no day has nothing to keep and never uploads. */
function isEmpty(stores: Stores): boolean {
  return !stores.settings[0]?.startDate && stores.days.length === 0
}

function fileText(stores: Stores, generation: string, now: Date = new Date()): string {
  const file: BackupFile = {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    appVersion: appVersion(),
    schemaVersion: SCHEMA_VERSION,
    generation,
    stores,
  }
  return JSON.stringify(file)
}

/** What the first sync after signing in does with the two sides (D-071; the header above). */
export type FirstSync = 'nothing' | 'upload' | 'take-remote' | 'merge' | 'ask'

export function firstSync(local: StateSummary, remote: StateSummary | null): FirstSync {
  const rank = (s: StateSummary) => (s.progress ? 2 : s.startDate ? 1 : 0)
  const l = rank(local)
  const r = remote ? rank(remote) : 0
  if (r === 0) return l === 0 ? 'nothing' : 'upload'
  if (r > l) return 'take-remote'
  if (l > r) return 'upload'
  if (l === 1 || local.startDate === remote?.startDate) return 'merge'
  return 'ask'
}

/** The user's answer to a conflict: which side's records stay. */
export type Choice = 'local' | 'remote'

export interface ExchangeResult {
  outcome: 'synced' | 'nothing' | 'took-remote' | 'replaced-remote' | 'merged' | 'conflict'
  uploaded: boolean
  /** Something of this device's is still not in the Drive copy. */
  dirty: boolean
  conflict?: Conflict
}

function readError(e: unknown): Error {
  if (e instanceof BackupError && /newer version/.test(e.message)) {
    return new Error(
      'Google Drive holds a copy from a newer version of Tortoise. Close the app and open it again.',
    )
  }
  return new Error("Google Drive's copy could not be read, so it was left as it is.")
}

/**
 * One exchange with Drive (the header above). `choice` is the user's answer to a conflict. `drive` is for the tests.
 */
export async function exchange(
  token: string,
  drive: Drive = currentDrive,
  choice?: Choice,
): Promise<ExchangeResult> {
  const cache = readCache()
  const files = await drive.listFiles(token)
  const shared = files.filter((f) => f.name === SHARED_NAME)
  const primary =
    shared.find((f) => f.id === cache.fileId) ??
    [...shared].sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime))[0]
  // Older per-device files, and a second shared file two devices created at once: merged in, then deleted.
  const extras = files.filter(
    (f) =>
      f !== primary &&
      (f.name === SHARED_NAME || (f.name.startsWith(LEGACY_PREFIX) && f.name.endsWith('.json'))),
  )
  const joined = cache.generation !== undefined
  const changed = !!primary && (primary.id !== cache.fileId || primary.modifiedTime !== cache.seen)

  let remote: Stores | null = null
  let remoteGen: string | undefined
  if (primary && (changed || !joined || choice)) {
    let file: BackupFile
    try {
      file = parseBackup(await drive.readText(token, primary.id))
    } catch (e) {
      if (e instanceof AuthError || e instanceof TypeError) throw e
      throw readError(e) // never written over: it may hold what this device lacks
    }
    remote = file.stores
    remoteGen = file.generation
  }
  const merged: string[] = []
  for (const f of extras) {
    try {
      const file = parseBackup(await drive.readText(token, f.id))
      remote = remote ? mergeStores(remote, file.stores) : file.stores
      merged.push(f.id)
    } catch (e) {
      if (e instanceof AuthError || e instanceof TypeError) throw e
      // A damaged or newer extra file is left alone, never half-read.
    }
  }

  const db = await getDb()
  const local = await readAllStores(db)
  let outcome: ExchangeResult['outcome']
  let generation: string
  let upload: boolean
  const lineageBroken = joined && primary !== undefined && remote !== null && remoteGen !== cache.generation
  if (!joined || lineageBroken || choice) {
    const localSum = summarize(local)
    const remoteSum = remote ? summarize(remote) : null
    let action = firstSync(localSum, remoteSum)
    if (choice) action = choice === 'remote' && remote ? 'take-remote' : 'upload'
    if (action === 'ask' && remoteSum) {
      return {
        outcome: 'conflict',
        uploaded: false,
        dirty: !!cache.dirty,
        conflict: { local: localSum, remote: remoteSum },
      }
    }
    if (action === 'nothing') return { outcome: 'nothing', uploaded: false, dirty: false }
    if (action === 'take-remote' && remote) {
      await replaceWithBackup({ stores: remote })
      outcome = 'took-remote'
      generation = remoteGen ?? crypto.randomUUID()
      upload = !primary || remoteGen === undefined || merged.length > 0
    } else if (action === 'merge' && remote) {
      await mergeBackup({ stores: remote })
      outcome = 'merged'
      generation = remoteGen ?? crypto.randomUUID()
      upload = !primary || remoteGen === undefined || merged.length > 0 || aheadOf(local, remote)
    } else {
      outcome = 'replaced-remote'
      generation = crypto.randomUUID()
      upload = true
    }
  } else {
    generation = cache.generation as string
    if (remote) await mergeBackup({ stores: remote })
    outcome = 'synced'
    upload = !!cache.dirty || !primary || merged.length > 0 || (remote !== null && aheadOf(local, remote))
  }

  const snapshot = changes
  const after = await readAllStores(db)
  if (!upload || isEmpty(after)) {
    writeCache({ fileId: primary?.id, seen: primary?.modifiedTime, generation })
    return { outcome, uploaded: false, dirty: false }
  }
  const text = fileText(after, generation)
  let written: DriveFile | undefined
  if (primary) {
    try {
      written = await drive.writeText(token, SHARED_NAME, text, primary.id)
    } catch (e) {
      // Gone since it was listed (deleted in Drive): written anew below.
      if (e instanceof AuthError || e instanceof TypeError) throw e
    }
  }
  written ??= await drive.writeText(token, SHARED_NAME, text)
  writeCache({ fileId: written.id, seen: written.modifiedTime, generation })
  for (const id of merged) {
    try {
      await drive.deleteFile(token, id)
    } catch (e) {
      if (e instanceof AuthError) throw e
      // Left for the next sync, which merges it again (no harm: the newer record wins).
    }
  }
  return { outcome, uploaded: true, dirty: changes !== snapshot }
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
/** The armed tap has opened its popup in this opening of the app: no second one until the app is opened again. */
let tapUsed = false

/**
 * Something of this device's waits for Drive: a change since the last upload, or the first sync after signing in. Only
 * then may an ordinary tap open Google's popup (the owner, 2026-11-27: "at most one flash per app opening, and only
 * when there are changes waiting to sync").
 */
function waiting(): boolean {
  const cache = readCache()
  return !!cache.dirty || cache.generation === undefined
}

/**
 * The fallback (D-055): when the token is gone and the hidden frame cannot replace it, the user's next tap anywhere in
 * the app does. A tap may open a popup, and with consent already given Google's popup closes by itself. `signIn()` is
 * called straight from the gesture, with no `await` before it, because Safari allows a popup only in the same turn as
 * the tap. It listens for `click`, not `pointerdown`: a touch's pointerdown does not count as a user activation (only
 * its pointerup, touchend and click do), so a popup opened from it is blocked on a phone. Armed once at a time, at
 * most once per opening of the app (a launch, or a return from the background), and only while something waits to
 * upload (`waiting`): with nothing to send, a run-out sign-in waits for the next change, "Sync now" or the next opening.
 */
function armNextTap(): void {
  if (armed || tapRefused || tapUsed || !waiting() || typeof window === 'undefined') return
  const onGesture = (event: Event) => {
    const target = event.target
    if (target instanceof Element && target.closest(`.${SYNC_CONTROLS}`)) return
    disarm()
    tapUsed = true
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
/** The user's answer to the conflict, for the next run. */
let pendingChoice: Choice | undefined

/**
 * Syncs once. `fromTap`: the call comes from a tap, so a missing token may be asked for with a popup. Concurrent
 * calls share the one in flight.
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
  const choice = pendingChoice
  pendingChoice = undefined
  setState({ status: 'syncing', error: undefined, conflict: undefined, email: readSession()?.email })
  try {
    const result = await exchange(token, drive, choice)
    if (result.outcome === 'conflict') {
      setState({ status: 'conflict', conflict: result.conflict })
      return
    }
    const lastSync = Date.now()
    writeCache({ lastSync, dirty: result.dirty })
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

/**
 * The user's answer to a conflict (D-071): `local` keeps this device's records and replaces the Drive copy with them;
 * `remote` replaces this device's records with the Drive copy. Called from the dialog's button.
 */
export async function resolveConflict(choice: Choice, drive: Drive = currentDrive): Promise<void> {
  if (running) await running
  pendingChoice = choice
  return syncNow({ fromTap: true }, drive)
}

/** Signs out on this phone (and with Google); the Drive file stays. */
export async function driveSignOut(revoke = true): Promise<void> {
  disarm()
  pendingChoice = undefined
  await signOut(revoke)
  writeCache({ fileId: undefined, seen: undefined, generation: undefined, lastSync: undefined, dirty: false })
  setState({
    status: 'signed-out',
    email: undefined,
    lastSync: undefined,
    error: undefined,
    conflict: undefined,
  })
}

/**
 * An automatic sync: reads what other devices wrote and writes what this one changed. Nothing while signed out or
 * while a conflict waits for the user's answer.
 */
export function autoSync(drive: Drive = currentDrive): Promise<void> {
  if (!readSession()?.email || state.status === 'conflict') return Promise.resolve()
  return syncNow({}, drive)
}

let started = false
let quietTimer: number | undefined

/** Starts the automatic sync; main.tsx calls it once. None of these is a tap, so none opens a popup. */
export function startAutoSync(): void {
  if (started || typeof window === 'undefined') return
  started = true
  state = initialState()
  preloadGis()
  onChange((fromSync) => {
    if (fromSync) return
    changes++
    writeCache({ dirty: true })
    window.clearTimeout(quietTimer)
    quietTimer = window.setTimeout(() => void autoSync(), QUIET_MS)
  })
  void autoSync()
  document.addEventListener('visibilitychange', () => {
    // Back on screen is a new opening of the app: the armed tap may open its popup once more.
    if (document.visibilityState === 'visible') tapUsed = false
    void autoSync()
  })
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
  pendingChoice = undefined
  if (typeof window !== 'undefined') disarm()
  tapRefused = false
  tapUsed = false
  changes = 0
}

/** For tests: count a change of this device's, as startAutoSync's listener does. */
export function noteChangeForTests(): void {
  changes++
  writeCache({ dirty: true })
}
