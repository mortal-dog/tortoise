// The Google Drive sync (D-054, D-055, D-071) against a fake Drive: one shared file synced both ways; the first sync
// after signing in compares the two sides (Drive's progress replaces a new phone's plan, a conflict waits for the
// user's choice); older per-device files merged and deleted; no upload from an empty phone; the hour-long sign-in
// renewed in a hidden frame or on the next tap; no network is not an error. Invented values only.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { losesMore, summarize } from '@/lib/backup'
import {
  getAllDays,
  getLevels,
  getSettings,
  resetDbForTests,
  saveSettings,
  startPlan,
  updateDay,
} from '@/lib/repo'
import type { DriveFile } from '@/lib/sync/drive'
import { AuthError } from '@/lib/sync/drive'
import { DRIVE_SCOPE, FRAME_MESSAGE, liveToken, resetGoogleForTests, SILENT_PATH } from '@/lib/sync/google'
import {
  autoSync,
  type Drive,
  driveSignOut,
  driveState,
  exchange,
  firstSync,
  noteChangeForTests,
  resetSyncForTests,
  resolveConflict,
  SHARED_NAME,
  SYNC_CONTROLS,
  syncNow,
} from '@/lib/sync/sync'

const AT = '2026-12-01T12:00:00.000Z'

type FakeFile = { name: string; text: string; modifiedTime: string }

/** A Drive in memory: files by id, each write moving its modified time on. */
function fakeDrive(): Drive & { files: Map<string, FakeFile>; writes: number; deletes: string[] } {
  const files = new Map<string, FakeFile>()
  let next = 0
  let clock = 0
  const stamp = () => new Date(Date.parse(AT) + ++clock * 1000).toISOString()
  const drive = {
    files,
    writes: 0,
    deletes: [] as string[],
    async listFiles(): Promise<DriveFile[]> {
      return [...files.entries()].map(([id, f]) => ({ id, name: f.name, modifiedTime: f.modifiedTime }))
    },
    async readText(_token: string, id: string): Promise<string> {
      const f = files.get(id)
      if (!f) throw new Error('not found')
      return f.text
    },
    async writeText(_token: string, name: string, text: string, id?: string): Promise<DriveFile> {
      drive.writes++
      if (id && !files.has(id)) throw new Error('Google Drive said 404.')
      const fileId = id ?? `file-${++next}`
      const modifiedTime = stamp()
      files.set(fileId, { name: id ? (files.get(id)?.name ?? name) : name, text, modifiedTime })
      return { id: fileId, name, modifiedTime }
    },
    async deleteFile(_token: string, id: string): Promise<void> {
      drive.deletes.push(id)
      files.delete(id)
    },
  }
  return drive
}

/** The shared file's content. */
function sharedFile(drive: ReturnType<typeof fakeDrive>) {
  const f = [...drive.files.values()].find((x) => x.name === SHARED_NAME)
  if (!f) throw new Error('no shared file')
  return JSON.parse(f.text)
}

/** Another device edits the shared file. */
function editShared(
  drive: ReturnType<typeof fakeDrive>,
  edit: (file: ReturnType<typeof sharedFile>) => void,
) {
  const entry = [...drive.files.entries()].find(([, x]) => x.name === SHARED_NAME)
  if (!entry) throw new Error('no shared file')
  const file = JSON.parse(entry[1].text)
  edit(file)
  drive.files.set(entry[0], {
    ...entry[1],
    text: JSON.stringify(file),
    modifiedTime: new Date().toISOString(),
  })
}

async function wipeDb() {
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
}

/** This test's phone becomes another device: a new database and no sync state, as after signing in elsewhere. */
async function anotherDevice(drive: Drive) {
  localStorage.removeItem('tortoise.drive')
  await wipeDb()
  resetSyncForTests(drive)
}

const done = (date: string) => updateDay(date, (d) => ({ ...d, morning: { doneAt: AT } }))

function signedIn(expiresAt = Date.now() + 3_600_000) {
  localStorage.setItem(
    'tortoise.google',
    JSON.stringify({ email: 'someone@example.com', accessToken: 'token', expiresAt }),
  )
}

/** Answers the hidden frame's silent renew as oauth-silent.html would, with this ask's own state. */
async function answerFrame(answer: Record<string, string>): Promise<URL> {
  const frame = await vi.waitFor(() => {
    const f = document.querySelector('iframe')
    if (!f) throw new Error('no frame yet')
    return f
  })
  const url = new URL(frame.src)
  const state = url.searchParams.get('state') ?? ''
  window.dispatchEvent(
    new MessageEvent('message', {
      origin: window.location.origin,
      data: { source: FRAME_MESSAGE, params: { ...answer, state } },
    }),
  )
  return url
}

/** Google's script, faked: every token request is granted at once. Returns the requests. */
function fakeGoogle(): unknown[] {
  const asks: unknown[] = []
  ;(window as unknown as { google: unknown }).google = {
    accounts: {
      oauth2: {
        initTokenClient: (config: { callback: (r: object) => void }) => ({
          requestAccessToken: (options: unknown) => {
            asks.push(options)
            config.callback({ access_token: 'tapped', expires_in: 3600, scope: `${DRIVE_SCOPE} email` })
          },
        }),
        revoke: () => undefined,
      },
    },
  }
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ email: 'someone@example.com' }), { status: 200 }),
  )
  return asks
}

afterEach(() => {
  delete (window as unknown as { google?: unknown }).google
  for (const f of document.querySelectorAll('iframe')) f.remove()
})

beforeEach(async () => {
  localStorage.clear()
  resetSyncForTests()
  resetGoogleForTests()
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('the first sync after signing in (D-071)', () => {
  it('ranks progress over a plan over nothing', () => {
    const none = { activeDays: 0, badges: 0, progress: false }
    const plan = { ...none, startDate: '2026-11-30' }
    const progress = { ...plan, activeDays: 3, firstDay: '2026-11-24', lastDay: '2026-11-26', progress: true }
    expect(firstSync(none, null)).toBe('nothing')
    expect(firstSync(plan, null)).toBe('upload')
    expect(firstSync(plan, none)).toBe('upload')
    expect(firstSync(plan, progress)).toBe('take-remote')
    expect(firstSync(none, plan)).toBe('take-remote')
    expect(firstSync(progress, plan)).toBe('upload')
    expect(firstSync(plan, { ...plan, startDate: '2026-12-07' })).toBe('merge')
    expect(firstSync(progress, { ...progress, activeDays: 9 })).toBe('merge')
    expect(firstSync(progress, { ...progress, startDate: '2026-12-07' })).toBe('ask')
  })

  it('asks for the typed confirmation when the replaced side holds more or older history', () => {
    const base = {
      startDate: '2026-11-30',
      activeDays: 5,
      firstDay: '2026-11-24',
      lastDay: '2026-12-01',
      badges: 2,
      progress: true,
    }
    expect(losesMore(base, base)).toBe(false)
    expect(losesMore({ ...base, activeDays: 6 }, base)).toBe(true)
    expect(losesMore({ ...base, badges: 3 }, base)).toBe(true)
    expect(losesMore({ ...base, firstDay: '2026-11-23' }, base)).toBe(true)
    expect(losesMore(base, { ...base, activeDays: 40, firstDay: '2026-01-05' })).toBe(false)
  })

  it('writes one shared file with a generation, then updates the same file', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    const first = await exchange('token', drive)
    expect(first).toMatchObject({ outcome: 'replaced-remote', uploaded: true })
    expect([...drive.files.values()].map((f) => f.name)).toEqual([SHARED_NAME])
    const saved = sharedFile(drive)
    expect(saved.format).toBe('tortoise-backup')
    expect(saved.generation).toEqual(expect.any(String))
    expect(saved.stores.settings[0].startDate).toBe('2026-11-30')
    noteChangeForTests()
    const second = await exchange('token', drive)
    expect(second).toMatchObject({ outcome: 'synced', uploaded: true })
    expect(drive.files.size).toBe(1)
    expect(sharedFile(drive).generation).toBe(saved.generation)
  })

  it('never uploads from an empty phone, so a wiped phone cannot overwrite its copy', async () => {
    const drive = fakeDrive()
    const r = await exchange('token', drive)
    expect(r).toMatchObject({ outcome: 'nothing', uploaded: false })
    expect(drive.writes).toBe(0)
  })

  it("replaces a new phone's just-chosen plan with Drive's whole state", async () => {
    const drive = fakeDrive()
    // The first phone: a plan, levels moved, days done, a unit setting, spoken cues on.
    await startPlan('2026-11-02', { pushups: 20, trains: 1 })
    await done('2026-11-03')
    await done('2026-11-10')
    await saveSettings((s) => ({ units: { ...s.units, mass: 'lb' }, spokenCues: true }))
    await exchange('token', drive)
    const firstLevels = await getLevels()
    // A new phone: the first run picks another Monday and other start answers, then signs in.
    await anotherDevice(drive)
    await startPlan('2026-11-23', { pushups: 2, runMin: 40 })
    const writes = drive.writes
    const r = await exchange('token', drive)
    expect(r.outcome).toBe('took-remote')
    const settings = await getSettings()
    expect(settings.startDate).toBe('2026-11-09')
    expect(settings.units.mass).toBe('lb')
    expect(settings.spokenCues).toBe(true)
    expect([...(await getAllDays()).keys()].sort()).toEqual(['2026-11-03', '2026-11-10'])
    expect(await getLevels()).toEqual(firstLevels)
    // Nothing of the new phone went to Drive.
    expect(drive.writes).toBe(writes)
    expect(sharedFile(drive).stores.settings[0].startDate).toBe('2026-11-09')
  })

  it("replaces Drive's plan without progress with this phone's progress", async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-23')
    await exchange('token', drive)
    const oldGeneration = sharedFile(drive).generation
    await anotherDevice(drive)
    await startPlan('2026-11-02')
    await done('2026-11-03')
    const r = await exchange('token', drive)
    expect(r.outcome).toBe('replaced-remote')
    const saved = sharedFile(drive)
    expect(saved.stores.settings[0].startDate).toBe('2026-11-09')
    expect(saved.generation).not.toBe(oldGeneration)
  })

  it('merges two phones on the same plan', async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    await anotherDevice(drive)
    await startPlan('2026-11-02')
    await done('2026-11-04')
    const r = await exchange('token', drive)
    expect(r).toMatchObject({ outcome: 'merged', uploaded: true })
    expect([...(await getAllDays()).keys()].sort()).toEqual(['2026-11-03', '2026-11-04'])
    expect(
      sharedFile(drive)
        .stores.days.map((d: { date: string }) => d.date)
        .sort(),
    ).toEqual(['2026-11-03', '2026-11-04'])
  })

  it('asks when both sides hold progress on different plans, and changes nothing until the answer', async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await done('2026-11-05')
    await exchange('token', drive)
    const before = drive.files.get('file-1')?.text
    await anotherDevice(drive)
    await startPlan('2026-11-23')
    await done('2026-11-24')
    signedIn()
    await syncNow()
    const s = driveState()
    expect(s.status).toBe('conflict')
    expect(s.conflict?.remote).toMatchObject({
      startDate: '2026-11-09',
      activeDays: 2,
      firstDay: '2026-11-03',
    })
    expect(s.conflict?.local).toMatchObject({
      startDate: '2026-11-30',
      activeDays: 1,
      firstDay: '2026-11-24',
    })
    expect(drive.files.get('file-1')?.text).toBe(before)
    expect((await getSettings()).startDate).toBe('2026-11-30')
    // The automatic sync waits for the answer.
    await autoSync()
    expect(driveState().status).toBe('conflict')
  })

  it("the answer 'use Google Drive's' replaces this phone; 'keep this device's' replaces Drive with a new generation", async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    const generation = sharedFile(drive).generation
    await anotherDevice(drive)
    await startPlan('2026-11-23')
    await done('2026-11-24')
    signedIn()
    await syncNow()
    expect(driveState().status).toBe('conflict')
    await resolveConflict('local')
    expect(driveState().status).toBe('ok')
    const saved = sharedFile(drive)
    expect(saved.stores.settings[0].startDate).toBe('2026-11-30')
    expect(saved.stores.days.map((d: { date: string }) => d.date)).toEqual(['2026-11-24'])
    expect(saved.generation).not.toBe(generation)

    // The first phone, still under the old generation, now finds Drive replaced: it asks too, and takes Drive's.
    localStorage.setItem('tortoise.drive', JSON.stringify({ fileId: 'file-1', seen: 'old', generation }))
    await wipeDb()
    resetSyncForTests(drive)
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await syncNow()
    expect(driveState().status).toBe('conflict')
    await resolveConflict('remote')
    expect(driveState().status).toBe('ok')
    expect((await getSettings()).startDate).toBe('2026-11-30')
    expect([...(await getAllDays()).keys()]).toEqual(['2026-11-24'])
    expect(sharedFile(drive).generation).toBe(saved.generation)
  })

  it('a sign-out answers the conflict by stopping the sync', async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    await anotherDevice(drive)
    await startPlan('2026-11-23')
    await done('2026-11-24')
    signedIn()
    await syncNow()
    await driveSignOut(false)
    expect(driveState()).toMatchObject({ status: 'signed-out', conflict: undefined })
    expect(localStorage.getItem('tortoise.drive')).not.toContain('generation')
  })

  it('merges the older per-device files into the shared file and deletes them', async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    // As the D-054 sync wrote it: a device file without a generation.
    const legacy = sharedFile(drive)
    delete legacy.generation
    drive.files.clear()
    drive.files.set('old', { name: 'device-abc.json', text: JSON.stringify(legacy), modifiedTime: AT })
    await anotherDevice(drive)
    await startPlan('2026-11-23')
    const r = await exchange('token', drive)
    expect(r.outcome).toBe('took-remote')
    expect(drive.deletes).toEqual(['old'])
    expect([...drive.files.values()].map((f) => f.name)).toEqual([SHARED_NAME])
    expect(sharedFile(drive).generation).toEqual(expect.any(String))
    expect((await getSettings()).startDate).toBe('2026-11-09')
  })

  it('leaves a damaged Drive copy as it is and says so', async () => {
    const drive = fakeDrive()
    drive.files.set('bad', { name: SHARED_NAME, text: '{"format":"tortoise-backup"', modifiedTime: AT })
    await startPlan('2026-11-23')
    signedIn()
    resetSyncForTests(drive)
    await syncNow()
    expect(driveState().status).toBe('error')
    expect(driveState().error).toMatch(/could not be read/)
    expect(drive.writes).toBe(0)
  })
})

describe('the Google Drive sync after the first', () => {
  it("brings in another device's changes and writes only what this device adds", async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    const writes = drive.writes
    // Nothing new on either side: nothing read beyond the list, nothing written.
    await exchange('token', drive)
    expect(drive.writes).toBe(writes)
    // Another device logs a day and moves a level.
    editShared(drive, (file) => {
      file.stores.days.push({
        date: '2026-11-04',
        morning: { doneAt: AT },
        updatedAt: '2030-01-01T00:00:00.000Z',
      })
    })
    const r = await exchange('token', drive)
    expect(r).toMatchObject({ outcome: 'synced', uploaded: false })
    expect((await getAllDays()).get('2026-11-04')?.morning?.doneAt).toBe(AT)
    // This device logs one too: it goes up, and the other device's day stays.
    await done('2026-11-05')
    noteChangeForTests()
    await exchange('token', drive)
    expect(
      sharedFile(drive)
        .stores.days.map((d: { date: string }) => d.date)
        .sort(),
    ).toEqual(['2026-11-03', '2026-11-04', '2026-11-05'])
  })

  it("heals a lost write: a copy that lacks this device's records is written again", async () => {
    const drive = fakeDrive()
    await startPlan('2026-11-02')
    await done('2026-11-03')
    await exchange('token', drive)
    // Another device wrote over the copy from a state without 2026-11-03.
    editShared(drive, (file) => {
      file.stores.days = []
    })
    const r = await exchange('token', drive)
    expect(r.uploaded).toBe(true)
    expect(sharedFile(drive).stores.days.map((d: { date: string }) => d.date)).toEqual(['2026-11-03'])
  })

  it('summarizes a side by its done days, first and last day and badges', async () => {
    await startPlan('2026-11-02')
    await done('2026-11-05')
    await done('2026-11-03')
    await updateDay('2026-11-04', (d) => ({ ...d, folded: true }))
    const { readAllStores } = await import('@/lib/backup')
    const { getDb } = await import('@/lib/repo')
    const s = summarize(await readAllStores(await getDb()))
    expect(s).toMatchObject({
      startDate: '2026-11-09',
      activeDays: 2,
      firstDay: '2026-11-03',
      lastDay: '2026-11-05',
      progress: true,
    })
  })
})

describe('the Google Drive sign-in', () => {
  it('waits for a tap once the sign-in has run out and the frame is refused, and when Google refuses the token', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    signedIn(Date.now() - 1000)
    const run = syncNow({}, drive)
    await answerFrame({ error: 'login_required' })
    await run
    expect(driveState().status).toBe('needs-tap')
    expect(drive.writes).toBe(0)
    expect(document.querySelector('iframe')).toBeNull()

    signedIn()
    const refusing: Drive = {
      ...drive,
      listFiles: async () => {
        throw new AuthError('Google Drive said 401.')
      },
    }
    await syncNow({}, refusing)
    expect(driveState().status).toBe('needs-tap')
    expect(JSON.parse(localStorage.getItem('tortoise.google') ?? '{}').accessToken).toBeUndefined()
  })

  it('syncs with a live sign-in and records the time', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    signedIn()
    await syncNow({}, drive)
    expect(driveState().status).toBe('ok')
    expect(driveState().lastSync).toBeGreaterThan(0)
    expect(JSON.parse(localStorage.getItem('tortoise.drive') ?? '{}').dirty).toBe(false)
    expect(drive.files.size).toBe(1)
  })

  it('renews a run-out sign-in in a hidden frame, with no tap, and syncs', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    resetSyncForTests(drive)
    signedIn(Date.now() - 1000)
    const run = syncNow()
    const url = await answerFrame({
      access_token: 'silent',
      expires_in: '3600',
      scope: `${DRIVE_SCOPE} email`,
    })
    await run
    expect(url.origin).toBe('https://accounts.google.com')
    expect(url.searchParams.get('prompt')).toBe('none')
    expect(url.searchParams.get('response_type')).toBe('token')
    expect(url.searchParams.get('redirect_uri')).toBe(`${window.location.origin}${SILENT_PATH}`)
    expect(url.searchParams.get('login_hint')).toBe('someone@example.com')
    expect(liveToken()).toBe('silent')
    expect(driveState().status).toBe('ok')
    expect(drive.files.size).toBe(1)
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('ignores a frame answer with another state', async () => {
    await startPlan('2026-11-23')
    resetSyncForTests(fakeDrive())
    signedIn(Date.now() - 1000)
    const run = syncNow()
    await vi.waitFor(() => {
      if (!document.querySelector('iframe')) throw new Error('no frame yet')
    })
    window.dispatchEvent(
      new MessageEvent('message', {
        origin: window.location.origin,
        data: { source: FRAME_MESSAGE, params: { access_token: 'forged', state: 'not-this-ask' } },
      }),
    )
    await answerFrame({ error: 'login_required' })
    await run
    expect(liveToken()).toBeNull()
  })

  it("renews on the user's next tap anywhere, but not on the sync card's own buttons", async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    resetSyncForTests(drive)
    signedIn(Date.now() - 1000)
    const run = syncNow()
    await answerFrame({ error: 'login_required' })
    await run
    expect(driveState().status).toBe('needs-tap')

    const asks = fakeGoogle()
    const controls = document.createElement('div')
    controls.className = SYNC_CONTROLS
    const button = document.createElement('button')
    controls.append(button)
    document.body.append(controls)
    button.click()
    expect(asks).toHaveLength(0)

    document.body.click()
    await vi.waitFor(() => expect(driveState().status).toBe('ok'))
    expect(asks).toHaveLength(1)
    expect(liveToken()).toBe('tapped')
    expect(drive.files.size).toBe(1)
    // Armed once: a second tap opens nothing.
    document.body.click()
    expect(asks).toHaveLength(1)
    controls.remove()
  })

  it('a tap opens Google only while a change waits, and at most once per opening of the app (D-074)', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    resetSyncForTests(drive)
    signedIn()
    await syncNow()
    expect(drive.writes).toBe(1)

    // The sign-in runs out with nothing to upload: no tap is armed.
    signedIn(Date.now() - 1000)
    const quiet = syncNow()
    await answerFrame({ error: 'login_required' })
    await quiet
    expect(driveState().status).toBe('needs-tap')
    const asks = fakeGoogle()
    document.body.click()
    await new Promise((r) => setTimeout(r, 50))
    expect(asks).toHaveLength(0)
    expect(driveState().status).toBe('needs-tap')

    // A change waits: the next tap opens the popup once.
    noteChangeForTests()
    resetGoogleForTests()
    const changed = syncNow()
    await answerFrame({ error: 'login_required' })
    await changed
    const asks2 = fakeGoogle()
    document.body.click()
    await vi.waitFor(() => expect(driveState().status).toBe('ok'))
    expect(asks2).toHaveLength(1)

    // Run out again with another change, in the same opening: no second popup.
    signedIn(Date.now() - 1000)
    noteChangeForTests()
    resetGoogleForTests()
    const again = syncNow()
    await answerFrame({ error: 'login_required' })
    await again
    const asks3 = fakeGoogle()
    document.body.click()
    await new Promise((r) => setTimeout(r, 50))
    expect(asks3).toHaveLength(0)
    expect(driveState().status).toBe('needs-tap')
  })

  it('a sign-out cancels the waiting tap', async () => {
    await startPlan('2026-11-23')
    resetSyncForTests(fakeDrive())
    signedIn(Date.now() - 1000)
    const run = syncNow()
    await answerFrame({ error: 'login_required' })
    await run
    await driveSignOut(false)
    const asks = fakeGoogle()
    document.body.click()
    expect(asks).toHaveLength(0)
    expect(driveState().status).toBe('signed-out')
  })

  it('with no network, waits without an error and keeps the change to upload', async () => {
    await startPlan('2026-11-23')
    const offline: Drive = {
      ...fakeDrive(),
      listFiles: async () => {
        throw new TypeError('Failed to fetch')
      },
    }
    resetSyncForTests(offline)
    signedIn()
    localStorage.setItem('tortoise.drive', JSON.stringify({ fileId: 'f', lastSync: 1, dirty: true }))
    await syncNow()
    expect(driveState().status).toBe('offline')
    expect(driveState().error).toBeUndefined()
    expect(JSON.parse(localStorage.getItem('tortoise.drive') ?? '{}').dirty).toBe(true)
  })

  it('an automatic sync uploads only when something changed', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    resetSyncForTests(drive)
    signedIn()
    await syncNow()
    expect(drive.writes).toBe(1)
    await autoSync()
    expect(drive.writes).toBe(1)
    localStorage.setItem(
      'tortoise.drive',
      JSON.stringify({ ...JSON.parse(localStorage.getItem('tortoise.drive') ?? '{}'), dirty: true }),
    )
    await autoSync()
    expect(drive.writes).toBe(2)
  })
})
