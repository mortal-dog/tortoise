// The Google Drive sync (D-054, D-055) against a fake Drive: one file per device, restore by merge, no upload from an
// empty phone; the hour-long sign-in renewed in a hidden frame or on the next tap; no network is not an error.
// Invented values only.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getAllDays, getSettings, resetDbForTests, startPlan, updateDay } from '@/lib/repo'
import type { DriveFile } from '@/lib/sync/drive'
import { AuthError } from '@/lib/sync/drive'
import { DRIVE_SCOPE, FRAME_MESSAGE, liveToken, resetGoogleForTests, SILENT_PATH } from '@/lib/sync/google'
import {
  autoSync,
  type Drive,
  deviceId,
  driveSignOut,
  driveState,
  exchange,
  resetSyncForTests,
  SYNC_CONTROLS,
  syncNow,
} from '@/lib/sync/sync'

const AT = '2026-12-01T12:00:00.000Z'

/** A Drive in memory: files by id, with names. */
function fakeDrive(): Drive & { files: Map<string, { name: string; text: string }>; writes: number } {
  const files = new Map<string, { name: string; text: string }>()
  let next = 0
  const drive = {
    files,
    writes: 0,
    async listFiles(_token: string, prefix: string): Promise<DriveFile[]> {
      return [...files.entries()]
        .filter(([, f]) => f.name.startsWith(prefix))
        .map(([id, f]) => ({ id, name: f.name, modifiedTime: AT }))
    },
    async readText(_token: string, id: string): Promise<string> {
      const f = files.get(id)
      if (!f) throw new Error('not found')
      return f.text
    },
    async writeText(_token: string, name: string, text: string, id?: string): Promise<string> {
      drive.writes++
      if (id && !files.has(id)) throw new Error('Google Drive said 404.')
      const fileId = id ?? `file-${++next}`
      files.set(fileId, { name, text })
      return fileId
    },
  }
  return drive
}

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

describe('the Google Drive sync', () => {
  it("writes this device's file, then updates the same file", async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    const first = await exchange('token', false, drive)
    expect(first.uploaded).toBe(true)
    expect([...drive.files.values()].map((f) => f.name)).toEqual([`device-${deviceId()}.json`])
    const second = await exchange('token', false, drive)
    expect(second.fileId).toBe(first.fileId)
    expect(drive.files.size).toBe(1)
    const saved = JSON.parse(drive.files.get(first.fileId ?? '')?.text ?? '{}')
    expect(saved.format).toBe('tortoise-backup')
    expect(saved.stores.settings[0].startDate).toBe('2026-11-30')
  })

  it('never uploads from an empty phone, so a wiped phone cannot overwrite its copy', async () => {
    const drive = fakeDrive()
    const r = await exchange('token', false, drive)
    expect(r.uploaded).toBe(false)
    expect(drive.writes).toBe(0)
  })

  it("restores by merging every device's copy into an empty phone", async () => {
    const drive = fakeDrive()
    // Another phone's copy.
    await startPlan('2026-11-23')
    await updateDay('2026-11-24', (d) => ({ ...d, morning: { doneAt: AT } }))
    await exchange('token', false, drive)
    const [[id, file]] = [...drive.files.entries()] as [[string, { name: string; text: string }]]
    drive.files.set(id, { ...file, name: 'device-another-phone.json' })
    // This phone, wiped: a new database and a new device id.
    localStorage.clear()
    resetDbForTests()
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase('tortoise')
      req.onsuccess = req.onerror = req.onblocked = () => resolve()
    })
    const r = await exchange('token', true, drive)
    expect(r.restored?.files).toBe(1)
    expect(r.restored?.written).toBeGreaterThan(0)
    expect((await getSettings()).startDate).toBe('2026-11-30')
    expect((await getAllDays()).get('2026-11-24')?.morning?.doneAt).toBe(AT)
    // And now this phone has its own copy too.
    expect([...drive.files.values()].map((f) => f.name).sort()).toEqual(
      ['device-another-phone.json', `device-${deviceId()}.json`].sort(),
    )
  })

  it('skips a damaged copy instead of half-reading it', async () => {
    const drive = fakeDrive()
    drive.files.set('bad', { name: 'device-broken.json', text: '{"format":"tortoise-backup"' })
    await startPlan('2026-11-23')
    const r = await exchange('token', true, drive)
    expect(r.restored).toEqual({ written: 0, files: 0 })
    expect(r.uploaded).toBe(true)
  })

  it('writes a new file when its own was deleted in Drive', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    const first = await exchange('token', false, drive)
    drive.files.clear()
    localStorage.setItem('tortoise.drive', JSON.stringify({ fileId: first.fileId }))
    const again = await exchange('token', false, drive)
    expect(again.fileId).not.toBe(first.fileId)
    expect(drive.files.size).toBe(1)
  })

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
