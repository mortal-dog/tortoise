import { beforeEach, describe, expect, it } from 'vitest'
import { getSettings, resetDbForTests, saveSettings } from '@/lib/repo'

beforeEach(async () => {
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('saving settings', () => {
  it('keeps both of two saves started at once', async () => {
    await Promise.all([
      saveSettings({ startDate: '2026-11-30' }),
      saveSettings({ units: { mass: 'lb', distance: 'km' } }),
    ])
    const s = await getSettings()
    expect(s.startDate).toBe('2026-11-30')
    expect(s.units.mass).toBe('lb')
  })

  it('builds a nested field from the stored record, so two quick edits both land', async () => {
    // Two profile fields typed in a row, before the screen re-rendered with the first one.
    await Promise.all([
      saveSettings((s) => ({ profile: { ...s.profile, heightCm: 180 } })),
      saveSettings((s) => ({ profile: { ...s.profile, birthYear: 1990 } })),
    ])
    expect((await getSettings()).profile).toEqual({ heightCm: 180, birthYear: 1990 })
  })

  it('leaves a cleared field out of the record', async () => {
    await saveSettings({ startDate: '2026-11-30' })
    await saveSettings({ startDate: undefined })
    expect('startDate' in (await getSettings())).toBe(false)
  })

  it('drops the fields that are gone (D-053) from an older record', async () => {
    const { SettingsRecord } = await import('@/lib/records')
    const old = SettingsRecord.parse({
      key: 'settings',
      dumbbellKg: 10,
      runDefault: 'indoor',
      location: { lat: 51.48, lon: 0 },
      reminders: { morning: '06:45', main: {} },
      updatedAt: '2026-11-22T12:00:00Z',
    })
    for (const k of ['dumbbellKg', 'runDefault', 'location', 'reminders']) expect(k in old, k).toBe(false)
  })
})
