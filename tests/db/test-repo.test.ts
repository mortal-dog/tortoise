import { beforeEach, describe, expect, it } from 'vitest'
import { getDay, getLevels, resetDbForTests, saveSettings } from '@/lib/repo'
import {
  awardMilestones,
  finishTestDay,
  getEarnedMilestones,
  getTest,
  saveTestResults,
} from '@/lib/test-repo'

// Week 0 begins on Monday 23 November 2026; its test days are 28 and 29 November.
const START = '2026-11-30'

beforeEach(async () => {
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
  await saveSettings({ startDate: START })
})

describe('the Tortoise Test records', () => {
  it('merge each card into the record of its Day 1 date, and compute the scores', async () => {
    await saveTestResults('2026-11-28', { results: { jumpReachCm: 35 } })
    await saveTestResults('2026-11-28', { results: { sitRise: { sit: 0, rise: 1 }, pushups: 12 } })
    const t = await getTest('2026-11-28')
    expect(t?.results).toMatchObject({ jumpReachCm: 35, pushups: 12 })
    expect(t?.computed.sitRiseScore).toBe(9)
  })

  it("set Week 0's starting levels when a day is finished, and mark the day done", async () => {
    await saveTestResults('2026-11-28', {
      results: { jumpReachCm: 35, pushups: 12 },
      start: { runMin: 15 },
    })
    const set = await finishTestDay('2026-11-28', 2, { week0: true, today: '2026-11-29' })
    expect(Object.fromEntries(set)).toEqual({ push: 3, run: 4 })
    const levels = await getLevels()
    expect(levels.get('push')?.level).toBe(3)
    expect(levels.get('push')?.history).toEqual([{ level: 3, date: '2026-11-29' }])
    expect((await getDay('2026-11-29'))?.main?.sessionId).toBe('test-day-2')
  })

  it('set no levels after Week 0', async () => {
    await saveTestResults('2027-02-20', { results: { pushups: 25 } })
    const set = await finishTestDay('2027-02-20', 1, { week0: false, today: '2027-02-20' })
    expect(set.size).toBe(0)
    expect((await getLevels()).size).toBe(0)
  })
})

describe('milestones', () => {
  it('are awarded once from the results, dated the day they were reached', async () => {
    await saveTestResults('2026-11-28', { results: { pushups: 21 } })
    expect(await awardMilestones('2026-11-29')).toEqual(
      expect.arrayContaining(['push-ups-10', 'push-ups-20']),
    )
    const earned = await getEarnedMilestones()
    expect(earned.get('push-ups-20')?.earnedAt).toBe('2026-11-29')
    expect(earned.has('push-ups-30')).toBe(false)
    // Already earned: nothing new, and the date stays.
    expect(await awardMilestones('2026-12-05')).toEqual([])
    expect((await getEarnedMilestones()).get('push-ups-20')?.earnedAt).toBe('2026-11-29')
  })
})
