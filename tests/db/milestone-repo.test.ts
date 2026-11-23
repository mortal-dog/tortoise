import { beforeEach, describe, expect, it } from 'vitest'
import { awardMilestones, getEarnedMilestones } from '@/lib/milestone-repo'
import { getLevels, resetDbForTests, setLevel, startPlan, updateDay } from '@/lib/repo'

// Week 0 begins on Monday 23 November 2026; Week 1 on 30 November.
const WEEK0 = '2026-11-23'
const AT = '2026-12-01T12:00:00Z'

beforeEach(async () => {
  resetDbForTests()
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('tortoise')
    req.onsuccess = req.onerror = req.onblocked = () => resolve()
  })
})

describe('starting the plan (D-067: no test)', () => {
  it('sets the run–walk level from the start question, dated Week 1, and leaves every other ladder at level 1', async () => {
    await startPlan(WEEK0, { runMin: 12 })
    const levels = await getLevels()
    expect(levels.get('run')?.level).toBe(4) // 10–29 min: R4
    expect(levels.get('run')?.since).toBe('2026-11-30')
    expect([...levels.keys()]).toEqual(['run'])
  })

  it('sets no level without an answer, and R1 for an answer in the first band', async () => {
    await startPlan(WEEK0)
    expect((await getLevels()).size).toBe(0)
    await startPlan(WEEK0, { runMin: 5 })
    expect((await getLevels()).get('run')?.level).toBe(1)
  })
})

describe('milestones', () => {
  it('are awarded once from the ladder levels and split blocks, dated the day they were reached', async () => {
    await startPlan(WEEK0)
    await setLevel('push', 4, '2026-12-20')
    for (const date of ['2026-12-01', '2026-12-02'])
      await updateDay(date, (d) => ({ ...d, split: { doneAt: AT, kind: 'front' } }))
    expect(await awardMilestones('2026-12-20')).toEqual(expect.arrayContaining(['push-3', 'push-4']))
    const earned = await getEarnedMilestones()
    expect(earned.get('push-4')?.earnedAt).toBe('2026-12-20')
    expect(earned.has('push-5')).toBe(false)
    expect(earned.has('splits-10')).toBe(false)
    // A step back keeps the badge, and nothing new is awarded.
    await setLevel('push', 3, '2027-01-05')
    expect(await awardMilestones('2027-01-05')).toEqual([])
    expect((await getEarnedMilestones()).get('push-4')?.earnedAt).toBe('2026-12-20')
  })
})
