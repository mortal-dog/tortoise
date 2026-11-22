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
    await Promise.all([saveSettings({ startDate: '2026-11-30' }), saveSettings({ dumbbellKg: 10 })])
    const s = await getSettings()
    expect(s.startDate).toBe('2026-11-30')
    expect(s.dumbbellKg).toBe(10)
  })

  it('builds a nested field from the stored record, so two quick edits both land', async () => {
    // Two reminder times typed in a row, before the screen re-rendered with the first one.
    await Promise.all([
      saveSettings((s) => ({ reminders: { ...s.reminders, morning: '06:45' } })),
      saveSettings((s) => ({ reminders: { ...s.reminders, main: { ...s.reminders.main, mon: '12:15' } } })),
    ])
    expect((await getSettings()).reminders).toEqual({ morning: '06:45', main: { mon: '12:15' } })
  })

  it('leaves a cleared field out of the record', async () => {
    await saveSettings({ dumbbellKg: 10 })
    await saveSettings({ dumbbellKg: undefined })
    expect('dumbbellKg' in (await getSettings())).toBe(false)
  })
})
