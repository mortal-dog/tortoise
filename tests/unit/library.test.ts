import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import {
  citedBy,
  historyOf,
  laddersOf,
  normalize,
  searchExercises,
  setsText,
  withoutCitations,
} from '@/lib/library'
import type { LogRecord } from '@/lib/records'

const ids = (filter: Parameters<typeof searchExercises>[1]) =>
  searchExercises(plan.exercises, filter).map((e) => e.id)

function log(over: Partial<LogRecord>): LogRecord {
  return {
    id: 'log-00000',
    date: '2026-01-05',
    sessionId: 'strength-a',
    exerciseId: 'goblet-squat',
    sets: [],
    updatedAt: '2026-01-05T10:00:00.000Z',
    ...over,
  }
}

describe('search', () => {
  it('ignores case, dashes and accents', () => {
    expect(normalize('Cat–camel')).toBe('cat camel')
    expect(ids({ query: 'CAT CAMEL' })).toEqual(['cat-camel'])
  })

  it('needs every word, and puts name matches first', () => {
    const found = ids({ query: 'plank' })
    expect(found.slice(0, 4)).toEqual(['hand-plank', 'wall-plank', 'copenhagen-plank', 'side-plank'])
    // "Plank" also appears in other exercises' texts (the push-up's "body a plank"); those come after.
    expect(found).toContain('push-up')
    const named = found.map((id) => /plank/i.test(plan.exercises.find((e) => e.id === id)?.name ?? ''))
    expect(named.indexOf(false)).toBeGreaterThan(0)
    expect(named.slice(named.indexOf(false))).not.toContain(true)
    expect(ids({ query: 'plank nothing-like-this' })).toEqual([])
  })

  it('finds a base exercise by a ladder level’s name', () => {
    expect(ids({ query: 'bulgarian' })).toContain('split-squat')
    expect(ids({ query: 'pistol' })[0]).toBe('pistol-squat')
  })

  it('filters by area and by having a link', () => {
    expect(ids({ area: 'playground' })).toEqual([
      'dead-hang',
      'scapular-pull',
      'negative-pull-up',
      'pull-up',
      'hanging-knee-raise',
    ])
    expect(ids({ area: 'playground', video: true })).toEqual(['pull-up'])
    expect(ids({}).length).toBe(plan.exercises.length)
  })
})

describe('exercise pages', () => {
  it('find the ladders an exercise belongs to', () => {
    expect(laddersOf('goblet-squat').map((l) => l.id)).toEqual(['squat'])
    expect(laddersOf('cat-camel')).toEqual([])
  })

  it('show texts without their bracketed citations', () => {
    expect(withoutCitations('Grip [leong2015]; more [a2020, b2021].')).toBe('Grip; more.')
  })

  it('list who cites a source', () => {
    expect(citedBy('leong2015').exercises.map((e) => e.id)).toContain('farmer-carry')
    expect(citedBy('katzman2010').ladders.map((l) => l.id)).toContain('back-extension')
  })

  it('show the last ten logs of the exercise, newest first', () => {
    const logs = Array.from({ length: 12 }, (_, i) =>
      log({ id: `log-${i}`, date: `2026-01-${String(i + 1).padStart(2, '0')}` }),
    )
    logs.push(log({ id: 'other', exerciseId: 'push-up', date: '2026-02-01' }))
    const h = historyOf(logs, 'goblet-squat')
    expect(h).toHaveLength(10)
    expect(h[0]?.date).toBe('2026-01-12')
    expect(h.every((l) => l.exerciseId === 'goblet-squat')).toBe(true)
  })

  it('read sets as the plan writes them', () => {
    expect(setsText(log({ sets: [{ reps: 10 }, { reps: 10 }, { reps: 10 }] }))).toBe('3 × 10')
    expect(setsText(log({ sets: [{ reps: 12 }, { reps: 10 }, { reps: 9 }] }))).toBe('12, 10, 9')
    expect(setsText(log({ sets: [{ seconds: 30 }, { seconds: 30 }] }))).toBe('2 × 30 s')
    expect(setsText(log({ sets: [{ reps: 8, kg: 12 }] }))).toBe('8 @ 12 kg')
    expect(setsText(log({ sets: [] }))).toBe('No sets')
  })
})
