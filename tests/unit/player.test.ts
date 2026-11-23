import { describe, expect, it } from 'vitest'
import { plan, sessionById } from '@/data/plan'
import { planDay } from '@/lib/calendar'
import {
  buildUnits,
  clockText,
  elapsedMs,
  holdSegments,
  pauseClock,
  position,
  repeatSegments,
  resumeClock,
  startClock,
  totalSeconds,
  type Unit,
  workingRange,
} from '@/lib/player'
import type { LevelRecord, Variant } from '@/lib/records'

// Week 1 begins on Monday 30 November 2026, so Week 0 is the week of 23 November.
const START = '2026-11-30'
const rules = plan.blockRules

function units(
  sessionId: string,
  date: string,
  levels: Record<string, number> = {},
  variant: Variant = 'outdoor',
) {
  const session = sessionById.get(sessionId)
  if (!session) throw new Error(sessionId)
  const map = new Map<string, LevelRecord>(
    Object.entries(levels).map(([ladderId, level]) => [
      ladderId,
      { ladderId, level, since: START, history: [], updatedAt: '2026-11-30T00:00:00Z' },
    ]),
  )
  return buildUnits({ session, variant, day: planDay(START, date, rules), levels: map, rules })
}

function byStep(list: Unit[], stepId: string): Unit {
  const u = list.find((x) => x.exercises.some((e) => e.stepId === stepId))
  if (!u) throw new Error(`no unit for ${stepId}`)
  return u
}

describe('the step engine', () => {
  it('pairs A1 with A2 and rests after each pair, as the plan says', () => {
    // Week 5: Block 2, a build week.
    const list = units('strength-a', '2026-12-28', { squat: 3, push: 3 })
    const pair = byStep(list, 'a1')
    expect(pair.exercises.map((e) => e.stepId)).toEqual(['a1', 'a2'])
    expect(pair.kind).toBe('reps')
    expect(pair.sets).toBe(3)
    expect(pair.restS).toBe(75)
    // The working range runs from about a third below the level's pass number up to it.
    const squat = sessionById.get('strength-a') && plan.ladders.find((l) => l.id === 'squat')
    const pass = squat?.levels.find((l) => l.level === 3)?.pass.reps ?? 0
    expect(pair.exercises[0]?.reps).toEqual(workingRange(pass))
    expect(pair.exercises[0]?.title).toBe('Squat · L3')
  })

  it('starts with the warm-up and logs only the main work', () => {
    const list = units('strength-a', '2026-12-28')
    expect(list[0]?.part).toBe('warmup')
    expect(list[0]?.kind).toBe('timed')
    expect(list[0]?.logged).toBe(false)
    expect(byStep(list, 'a0').logged).toBe(true)
    expect(byStep(list, 'a0').askFeedback).toBe(true)
  })

  it("runs the morning handstand as the level's holds, and asks after the ladder steps only", () => {
    const list = units('morning', '2026-12-28')
    const handstand = byStep(list, 'handstand')
    expect(handstand.kind).toBe('hold')
    expect(handstand.target).toBe('3 × 20 s')
    expect(handstand.restS).toBe(30)
    expect(handstand.exercises[0]?.title).toBe('Handstand: skill track · H1')
    expect(handstand.askFeedback).toBe(true)
    expect(byStep(list, 'cat-camel').askFeedback).toBe(false)
    expect(byStep(units('morning', '2026-12-28', { 'handstand-skill': 7 }), 'handstand').kind).toBe('reps')
  })

  it('applies Week 0, the ramp and the light week to strength sets', () => {
    expect(byStep(units('strength-a', '2026-11-23'), 'a1').sets).toBe(2) // 3 halved, rounded up
    expect(byStep(units('strength-a', '2026-11-30'), 'a1').sets).toBe(2) // the ramp
    expect(byStep(units('strength-a', '2026-12-21'), 'a1').sets).toBe(2) // light: 3 − 1
    expect(byStep(units('strength-a', '2026-12-28'), 'a1').sets).toBe(3)
  })

  it('keeps every ladder at level 1 in Week 0', () => {
    const list = units('strength-a', '2026-11-23', { squat: 5 })
    expect(byStep(list, 'a1').exercises[0]?.level).toBe(1)
  })

  it('runs the core ladder as reps at level 1 and as a hold at level 2', () => {
    expect(byStep(units('strength-a', '2026-12-28', { core: 1 }), 'c1').kind).toBe('reps')
    const hold = byStep(units('strength-a', '2026-12-28', { core: 2 }), 'c1')
    expect(hold.kind).toBe('hold')
    expect(hold.holdS).toBe(30)
    expect(hold.segments?.filter((s) => s.kind === 'work')).toHaveLength(hold.sets)
  })

  it("does Friday's push-up one level above Monday's, capped at the top", () => {
    expect(
      byStep(units('strength-c', '2027-01-01', { push: 2 }), 'a2').exercises.find((e) => e.stepId === 'a2')
        ?.level,
    ).toBe(3)
    const top = plan.ladders.find((l) => l.id === 'push')?.levels.length ?? 0
    expect(
      byStep(units('strength-c', '2027-01-01', { push: top }), 'a2').exercises.find((e) => e.stepId === 'a2')
        ?.level,
    ).toBe(top)
  })

  it('runs the 4 × 4 from Block 4 and halves it in a light week', () => {
    // Week 13 is the first week of Block 4; its Thursday is 25 February 2027.
    const main = byStep(units('intervals', '2027-02-25'), 'main-set')
    expect(main.kind).toBe('interval')
    expect(main.target).toBe('4 × (4 min hard, 3 min easy)')
    expect(main.segments?.filter((s) => s.kind === 'work')).toHaveLength(4)
    expect(main.segments?.filter((s) => s.kind === 'rest')).toHaveLength(3)
    // Week 16 is Block 4's light week.
    const light = byStep(units('intervals', '2027-03-18'), 'main-set')
    expect(light.segments?.filter((s) => s.kind === 'work')).toHaveLength(2)
  })

  it('uses stage 1 in Week 0, halved', () => {
    const main = byStep(units('intervals', '2026-11-26'), 'main-set')
    expect(main.segments?.filter((s) => s.kind === 'work')).toHaveLength(5)
  })

  it('follows the run–walk level on run days, halved in Week 0', () => {
    const run = byStep(units('easy-run', '2026-12-29', { run: 1 }), 'run')
    expect(run.kind).toBe('interval')
    expect(run.target).toBe('8 × (1 min run, 2 min walk)')
    const week0 = byStep(units('easy-run', '2026-11-24'), 'run')
    expect(week0.segments?.filter((s) => s.kind === 'work')).toHaveLength(4)
  })

  it('walks indoors instead of running (D-056)', () => {
    const list = units('easy-run', '2026-12-29', {}, 'indoor')
    expect(
      list.some((u) => u.exercises.some((e) => e.stepId === 'indoor-walk' && e.exerciseId === 'walk')),
    ).toBe(true)
    expect(list.some((u) => u.exercises.some((e) => e.ladderId === 'run'))).toBe(false)
  })

  it('makes split blocks stretches, per side where the plan says so', () => {
    const list = units('split-front', '2026-12-28')
    const first = list[0]
    expect(first?.kind).toBe('stretch')
    expect(first?.perSide).toBe(true)
    expect(first?.segments?.map((s) => s.side).filter(Boolean)).toEqual(['left', 'right'])
  })

  it('gives every exercise its video link, except the everyday ones (D-056)', () => {
    const list = units('strength-a', '2026-12-28')
    for (const u of list)
      for (const e of u.exercises)
        if (e.exerciseId === 'rope-basics') expect(e.videoUrl, e.stepId).toBeUndefined()
        else expect(e.videoUrl, e.stepId).toMatch(/^https:\/\/www\.youtube\.com\/watch\?v=/)
  })

  it('gives every session of the plan units with a target', () => {
    for (const s of plan.sessions) {
      for (const v of ['outdoor', 'indoor'] as const) {
        const list = units(s.id, '2027-02-25', {}, v)
        expect(list.length, s.id).toBeGreaterThan(0)
        for (const u of list) expect(u.target, `${s.id} ${u.id}`).not.toBe('')
      }
    }
  })
})

describe('timelines', () => {
  const segs = repeatSegments({ repeats: 2, workS: 60, restS: 30, workLabel: 'run', restLabel: 'walk' })

  it('lead in with 3 s, then alternate work and rest, without a rest after the last', () => {
    expect(segs.map((s) => `${s.kind}:${s.seconds}`)).toEqual(['ready:3', 'work:60', 'rest:30', 'work:60'])
    expect(segs[1]?.label).toBe('Run')
    expect(totalSeconds(segs)).toBe(153)
  })

  it('find the position from elapsed time alone, so a phone back from the background lands right', () => {
    expect(position(segs, 0).index).toBe(0)
    const p = position(segs, 3_000 + 70_000) // 70 s after the lead-in: 10 s into the walk
    expect(p.segment.kind).toBe('rest')
    expect(p.remainingMs).toBe(20_000)
    expect(p.workS).toBe(60)
    const end = position(segs, 1_000_000)
    expect(end.done).toBe(true)
    expect(end.workS).toBe(120)
  })

  it('hold each side in turn with a change between', () => {
    const h = holdSegments(2, 30, true, 20)
    expect(h.map((s) => s.kind)).toEqual([
      'ready',
      'work',
      'switch',
      'work',
      'rest',
      'work',
      'switch',
      'work',
    ])
  })

  it('pause without losing time', () => {
    let c = startClock(1_000)
    c = pauseClock(c, 6_000)
    expect(elapsedMs(c, 60_000)).toBe(5_000)
    c = resumeClock(c, 60_000)
    expect(elapsedMs(c, 62_000)).toBe(7_000)
  })

  it('read as a clock', () => {
    expect(clockText(0)).toBe('0:00')
    expect(clockText(59_001)).toBe('1:00')
    expect(clockText(65_000)).toBe('1:05')
    expect(clockText(3_723_000)).toBe('1:02:03')
  })
})

describe('spoken coaching', () => {
  it('says the step and its target in words', async () => {
    const { coachingText } = await import('@/lib/player')
    const list = units('strength-a', '2026-12-28', { squat: 3, push: 3 })
    const text = coachingText(byStep(list, 'a1'))
    expect(text).toMatch(
      /^Squat, L3, then Push, L3\. 3 times \d+ to \d+( per side)?, and 3 times \d+ to \d+\./,
    )
    expect(coachingText(byStep(units('split-front', '2026-12-28'), 'front-1'))).toContain(
      '45 seconds per side',
    )
  })
})
