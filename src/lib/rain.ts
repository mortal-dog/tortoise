// Raindrops on a window pane, for the backdrop of a few screens (D-048). Pure: the field is plain data, `stepField`
// moves it by a time step with an injected random source, and the component only draws it. Sizes are CSS pixels.
//
// Most drops sit still. Now and then one slides a short way, slowly, wandering a little sideways, leaving tiny beads
// that fade; a sliding drop takes in the still drops it touches. Drops that leave the pane, or evaporate, land again
// elsewhere and fade in, so the count stays the same.

export interface Drop {
  /** Changes when the drop lands again, so a jump in position is a new drop, not a fast one. */
  id: number
  x: number
  y: number
  r: number
  /** 0 to 1: fading in after landing, or out while evaporating. */
  alpha: number
  /** Seconds of sliding left; 0 when still. */
  sliding: number
  /** Sliding speed, px per second. */
  speed: number
  /** The sideways wander's phase. */
  phase: number
  /** Travel since the last bead, px. */
  travelled: number
  fading: boolean
}

export interface Bead {
  x: number
  y: number
  r: number
  /** Seconds left. */
  life: number
}

export interface RainField {
  width: number
  height: number
  drops: Drop[]
  beads: Bead[]
  nextId: number
}

export type Random = () => number

/** The tuning. "Almost unnoticeable" (the owner): small drops, slow slides, a few at a time. */
export const RAIN = {
  /** Pane area per drop, px²: about 24 drops on a phone. */
  areaPerDrop: 14_000,
  minDrops: 6,
  minR: 1.6,
  maxR: 6,
  /** Merged drops grow up to this. */
  capR: 8.5,
  /** Chance per second that the largest still drop starts to slide; smaller drops slide less often. */
  slideChance: 0.04,
  /** Sliding speeds, px per second. */
  minSpeed: 5,
  maxSpeed: 22,
  /** Seconds a slide lasts. */
  minSlide: 1.5,
  maxSlide: 4.5,
  /** Sideways wander, px per second at most. */
  wander: 3,
  /** A bead is left behind every this many px of travel. */
  beadEvery: 6,
  /** Seconds a bead takes to fade. */
  beadLife: 9,
  /** Seconds to fade in after landing, or out when evaporating. */
  fade: 3,
  /** Drops that evaporate per second, over the whole pane. */
  evaporation: 0.06,
  /** The component draws at most this many frames per second. */
  frameRate: 24,
} as const

/** A small seeded random source (mulberry32), so tests can replay a field. */
export function seeded(seed: number): Random {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4_294_967_296
  }
}

export function dropCount(width: number, height: number): number {
  return Math.max(RAIN.minDrops, Math.round((width * height) / RAIN.areaPerDrop))
}

function land(f: RainField, rand: Random, alpha: number): Drop {
  // Mostly small drops: the square leans the sizes toward minR.
  const r = RAIN.minR + (RAIN.maxR - RAIN.minR) * rand() ** 2
  return {
    id: f.nextId++,
    x: r + rand() * Math.max(0, f.width - 2 * r),
    y: r + rand() * Math.max(0, f.height - 2 * r),
    r,
    alpha,
    sliding: 0,
    speed: 0,
    phase: rand() * Math.PI * 2,
    travelled: 0,
    fading: false,
  }
}

/** A pane of `width` × `height` px with drops already on it. */
export function createField(width: number, height: number, rand: Random): RainField {
  const f: RainField = { width, height, drops: [], beads: [], nextId: 0 }
  const n = dropCount(width, height)
  for (let i = 0; i < n; i++) f.drops.push(land(f, rand, 1))
  return f
}

/** The pane changed size (a rotation, a toolbar): keep the drops, land or remove some to fit the new area. */
export function resizeField(f: RainField, width: number, height: number, rand: Random): void {
  f.width = width
  f.height = height
  f.drops = f.drops.filter((d) => d.x - d.r < width && d.y - d.r < height)
  f.beads = f.beads.filter((b) => b.x < width && b.y < height)
  const n = dropCount(width, height)
  while (f.drops.length > n) f.drops.pop()
  while (f.drops.length < n) f.drops.push(land(f, rand, 0))
}

function slideSpeed(r: number, rand: Random): number {
  const size = Math.min(1, (r - RAIN.minR) / (RAIN.maxR - RAIN.minR))
  return RAIN.minSpeed + (RAIN.maxSpeed - RAIN.minSpeed) * size * (0.6 + 0.4 * rand())
}

/**
 * Moves the field on by `dt` seconds. Returns whether anything visible changed, so a still pane is not redrawn.
 */
export function stepField(f: RainField, dt: number, rand: Random): boolean {
  if (dt <= 0) return false
  let changed = false

  // Evaporation: now and then a still drop fades away, to land again elsewhere.
  if (rand() < RAIN.evaporation * dt) {
    const still = f.drops.filter((d) => d.sliding === 0 && !d.fading && d.alpha >= 1)
    const d = still[Math.floor(rand() * still.length)]
    if (d) d.fading = true
  }

  for (let i = 0; i < f.drops.length; i++) {
    const d = f.drops[i] as Drop
    if (d.fading) {
      d.alpha -= dt / RAIN.fade
      changed = true
      if (d.alpha <= 0) f.drops[i] = land(f, rand, 0)
      continue
    }
    if (d.alpha < 1) {
      d.alpha = Math.min(1, d.alpha + dt / RAIN.fade)
      changed = true
    }
    if (d.sliding > 0) {
      const dy = d.speed * dt
      d.y += dy
      d.phase += dt * 2
      d.x = Math.min(f.width - d.r, Math.max(d.r, d.x + Math.sin(d.phase) * RAIN.wander * dt))
      d.sliding = Math.max(0, d.sliding - dt)
      d.travelled += dy
      if (d.travelled >= RAIN.beadEvery) {
        d.travelled = 0
        f.beads.push({ x: d.x, y: d.y - d.r, r: d.r * (0.25 + 0.15 * rand()), life: RAIN.beadLife })
        d.r *= 0.985
      }
      // A sliding drop takes in the still drops it touches, and keeps the water (area) of both.
      for (let j = 0; j < f.drops.length; j++) {
        const o = f.drops[j] as Drop
        if (j === i || o.sliding > 0 || o.fading) continue
        if (Math.hypot(o.x - d.x, o.y - d.y) < o.r + d.r) {
          d.r = Math.min(RAIN.capR, Math.hypot(d.r, o.r))
          d.speed = Math.max(d.speed, slideSpeed(d.r, rand))
          d.sliding = Math.max(d.sliding, RAIN.minSlide)
          f.drops[j] = land(f, rand, 0)
        }
      }
      changed = true
      if (d.y - d.r > f.height || d.r < RAIN.minR * 0.8) f.drops[i] = land(f, rand, 0)
    } else if (d.alpha >= 1) {
      const size = Math.min(1, d.r / RAIN.maxR)
      if (rand() < RAIN.slideChance * size * size * dt) {
        d.sliding = RAIN.minSlide + (RAIN.maxSlide - RAIN.minSlide) * rand()
        d.speed = slideSpeed(d.r, rand)
        changed = true
      }
    }
  }

  if (f.beads.length > 0) {
    for (const b of f.beads) b.life -= dt
    f.beads = f.beads.filter((b) => b.life > 0)
    changed = true
  }
  return changed
}

/** The red, green, blue and alpha of a CSS colour written `rgb(r g b / a)` or `rgba(r, g, b, a)`. */
export function parseRgb(css: string): [number, number, number, number] | null {
  const m = /rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)(?:[\s,/]+([\d.]+))?\s*\)/.exec(css)
  if (!m) return null
  return [Number(m[1]), Number(m[2]), Number(m[3]), m[4] === undefined ? 1 : Number(m[4])]
}
