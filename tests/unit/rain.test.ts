// The raindrops of the backdrop (D-048): slow, few, always the same count, and replayable from a seed.
import { describe, expect, it } from 'vitest'
import { activeTab } from '@/components/TabBar'
import {
  createField,
  dropCount,
  parseRgb,
  RAIN,
  type RainField,
  resizeField,
  seeded,
  stepField,
} from '@/lib/rain'

// An iPhone 15's screen in CSS pixels.
const W = 393
const H = 852
const DT = 1 / RAIN.frameRate

function inside(f: RainField) {
  for (const d of f.drops) {
    expect(d.x).toBeGreaterThanOrEqual(0)
    expect(d.x).toBeLessThanOrEqual(f.width)
    expect(d.y).toBeGreaterThanOrEqual(0)
    expect(d.r).toBeGreaterThan(0)
    expect(d.r).toBeLessThanOrEqual(RAIN.capR)
    expect(d.alpha).toBeLessThanOrEqual(1)
  }
}

describe('a rain field', () => {
  it('holds a few dozen drops on a phone, at least a handful on any pane', () => {
    expect(dropCount(W, H)).toBe(24)
    expect(dropCount(10, 10)).toBe(RAIN.minDrops)
    const f = createField(W, H, seeded(1))
    expect(f.drops).toHaveLength(24)
    expect(f.beads).toHaveLength(0)
    inside(f)
  })

  it('replays the same from the same seed', () => {
    const a = createField(W, H, seeded(7))
    const b = createField(W, H, seeded(7))
    const ra = seeded(8)
    const rb = seeded(8)
    for (let i = 0; i < 2000; i++) {
      stepField(a, DT, ra)
      stepField(b, DT, rb)
    }
    expect(a).toEqual(b)
  })

  it('moves slowly over ten minutes, keeps its count and stays on the pane', () => {
    const rand = seeded(42)
    const f = createField(W, H, rand)
    let slides = 0
    let fastest = 0
    for (let i = 0; i < 10 * 60 * RAIN.frameRate; i++) {
      const before = new Map(f.drops.map((d) => [d.id, { x: d.x, y: d.y, sliding: d.sliding }]))
      stepField(f, DT, rand)
      for (const d of f.drops) {
        const b = before.get(d.id)
        if (!b) continue
        if (b.sliding === 0 && d.sliding > 0) slides++
        // Never upward, and never faster than the fastest slide.
        expect(d.y).toBeGreaterThanOrEqual(b.y)
        fastest = Math.max(fastest, Math.hypot(d.x - b.x, d.y - b.y) / DT)
      }
      expect(f.drops).toHaveLength(24)
    }
    inside(f)
    // Something happens, but rarely: a slide every few seconds across the whole pane.
    expect(slides).toBeGreaterThan(20)
    expect(slides).toBeLessThan(600)
    expect(fastest).toBeLessThanOrEqual(RAIN.maxSpeed + RAIN.wander)
    // The beads fade within their life.
    for (const b of f.beads) expect(b.life).toBeLessThanOrEqual(RAIN.beadLife)
  })

  it('reports no change on a still pane, so nothing is redrawn', () => {
    const f = createField(W, H, seeded(3))
    // A random source that never fires: no drop slides or evaporates.
    expect(stepField(f, DT, () => 0.999_999)).toBe(false)
    expect(stepField(f, 0, seeded(4))).toBe(false)
  })

  it('fits a new pane size: keeps the drops that still fit, lands or removes some', () => {
    const rand = seeded(5)
    const f = createField(W, H, rand)
    resizeField(f, H, W, rand)
    expect(f.drops).toHaveLength(dropCount(H, W))
    for (const d of f.drops) expect(d.y - d.r).toBeLessThan(W)
    resizeField(f, 200, 200, rand)
    expect(f.drops).toHaveLength(dropCount(200, 200))
    resizeField(f, 1024, 1366, rand)
    expect(f.drops).toHaveLength(dropCount(1024, 1366))
    inside(f)
  })
})

describe('the colours of a drop', () => {
  it('reads both ways of writing a colour', () => {
    expect(parseRgb('rgb(30 43 30 / 0.2)')).toEqual([30, 43, 30, 0.2])
    expect(parseRgb(' rgba(255, 255, 255, 0.95)')).toEqual([255, 255, 255, 0.95])
    expect(parseRgb('rgb(1 2 3)')).toEqual([1, 2, 3, 1])
    expect(parseRgb('')).toBeNull()
  })
})

describe('the tab bar pill', () => {
  it('sits on the tab the screen belongs to, and on none for a day or a test', () => {
    expect(activeTab('/')).toBe(0)
    expect(activeTab('/week')).toBe(1)
    expect(activeTab('/progress')).toBe(2)
    expect(activeTab('/library/hollow-hold')).toBe(3)
    expect(activeTab('/settings')).toBe(4)
    expect(activeTab('/day/2026-12-03')).toBe(-1)
    expect(activeTab('/test/2026-12-05')).toBe(-1)
  })
})
