// The Google Drive backup (D-054) against a fake Drive: one file per device, restore by merge, no upload from an empty
// phone, and "needs a tap" once the hour-long sign-in has run out. Invented values only.
import { beforeEach, describe, expect, it } from 'vitest'
import { getAllDays, getSettings, resetDbForTests, startPlan, updateDay } from '@/lib/repo'
import type { DriveFile } from '@/lib/sync/drive'
import { AuthError } from '@/lib/sync/drive'
import { type Drive, deviceId, driveState, exchange, resetSyncForTests, syncNow } from '@/lib/sync/sync'

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

beforeEach(async () => {
  localStorage.clear()
  resetSyncForTests()
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('the Google Drive backup', () => {
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

  it('waits for a tap once the sign-in has run out, and asks again when Google refuses the token', async () => {
    await startPlan('2026-11-23')
    const drive = fakeDrive()
    signedIn(Date.now() - 1000)
    await syncNow({}, drive)
    expect(driveState().status).toBe('needs-tap')
    expect(drive.writes).toBe(0)

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
})
