import { useEffect, useRef } from 'react'
import { useMovingBackdrop } from '@/lib/effects'
import { createField, parseRgb, RAIN, type RainField, resizeField, stepField } from '@/lib/rain'

/**
 * The backdrop behind every screen (D-048): soft colour fields that drift over minutes, seen through the glass
 * panels; raindrops on the screens that ask for them. Still when the switch in Settings is off or the system asks
 * for reduced motion.
 */
export function Backdrop({ rain }: { rain: boolean }) {
  const moving = useMovingBackdrop()
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-still={moving ? undefined : ''}
      data-testid="backdrop"
    >
      <div className="backdrop-glow backdrop-glow-moss" />
      <div className="backdrop-glow backdrop-glow-sky" />
      <div className="backdrop-glow backdrop-glow-amber" />
      <div className="backdrop-glow backdrop-glow-light" />
      {rain && moving && <Rain />}
    </div>
  )
}

const SPRITE = 64
/** The drop's body fills this share of the sprite's half-width; its shadow uses the rest. */
const BODY = 0.8

/** One drop drawn once, large; every drop and bead is this image scaled. Colours from the theme tokens. */
function makeSprite(): HTMLCanvasElement {
  const sprite = document.createElement('canvas')
  sprite.width = SPRITE
  sprite.height = SPRITE
  const g = sprite.getContext('2d')
  if (!g) return sprite
  const css = getComputedStyle(document.documentElement)
  const [rr, rg, rb, ra] = parseRgb(css.getPropertyValue('--drop-rim')) ?? [30, 43, 30, 0.2]
  const [sr, sg, sb, sa] = parseRgb(css.getPropertyValue('--drop-shine')) ?? [255, 255, 255, 0.9]
  const rim = (a: number) => `rgb(${rr} ${rg} ${rb} / ${ra * a})`
  const shine = (a: number) => `rgb(${sr} ${sg} ${sb} / ${sa * a})`
  const c = SPRITE / 2
  const r = c * BODY

  // A soft shadow just below the drop, where it bends the light away.
  const shadow = g.createRadialGradient(c, c + r * 0.2, r * 0.6, c, c + r * 0.2, r)
  shadow.addColorStop(0, rim(0.55))
  shadow.addColorStop(1, rim(0))
  g.fillStyle = shadow
  g.beginPath()
  g.arc(c, c + r * 0.2, r, 0, Math.PI * 2)
  g.fill()

  // The body: a lens, clear in the middle, a little darker toward its rim.
  const body = g.createRadialGradient(c - r * 0.2, c - r * 0.25, r * 0.1, c, c, r)
  body.addColorStop(0, shine(0.25))
  body.addColorStop(0.7, rim(0.2))
  body.addColorStop(1, rim(0.75))
  g.fillStyle = body
  g.beginPath()
  g.arc(c, c, r, 0, Math.PI * 2)
  g.fill()

  // The caustic: light gathered in the lower part of the drop.
  const low = g.createRadialGradient(c + r * 0.1, c + r * 0.45, 0, c + r * 0.1, c + r * 0.45, r * 0.55)
  low.addColorStop(0, shine(0.7))
  low.addColorStop(1, shine(0))
  g.fillStyle = low
  g.beginPath()
  g.arc(c, c, r * 0.95, 0, Math.PI * 2)
  g.fill()

  // The highlight: a small bright spot at the top left.
  g.fillStyle = shine(1)
  g.beginPath()
  g.ellipse(c - r * 0.35, c - r * 0.4, r * 0.22, r * 0.14, -0.7, 0, Math.PI * 2)
  g.fill()
  return sprite
}

function draw(ctx: CanvasRenderingContext2D, f: RainField, sprite: HTMLCanvasElement, dpr: number) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
  for (const b of f.beads) {
    ctx.globalAlpha = Math.min(1, b.life / RAIN.beadLife) * 0.8
    const half = b.r / BODY
    ctx.drawImage(sprite, (b.x - half) * dpr, (b.y - half) * dpr, 2 * half * dpr, 2 * half * dpr)
  }
  for (const d of f.drops) {
    ctx.globalAlpha = Math.max(0, d.alpha)
    // A sliding drop stretches a little along its path.
    const rx = d.r / BODY
    const ry = rx * (d.sliding > 0 ? 1.2 : 1.05)
    ctx.drawImage(sprite, (d.x - rx) * dpr, (d.y - ry) * dpr, 2 * rx * dpr, 2 * ry * dpr)
  }
  ctx.globalAlpha = 1
}

/** The raindrops: a canvas over the colour fields, drawn at a low frame rate and only when a drop has moved. */
function Rain() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const rand = Math.random
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const size = () => {
      canvas.width = Math.round(window.innerWidth * dpr)
      canvas.height = Math.round(window.innerHeight * dpr)
    }
    size()
    const field = createField(window.innerWidth, window.innerHeight, rand)
    let sprite = makeSprite()
    let raf = 0
    let last = 0
    draw(ctx, field, sprite, dpr)

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (last !== 0 && now - last < 1000 / RAIN.frameRate) return
      // After a pause (the app in the background), carry on from where it was, not with one long jump.
      const dt = last === 0 ? 0 : Math.min(0.25, (now - last) / 1000)
      last = now
      if (stepField(field, dt, rand)) draw(ctx, field, sprite, dpr)
    }
    const start = () => {
      if (raf === 0 && !document.hidden) {
        last = 0
        raf = requestAnimationFrame(frame)
      }
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    const onResize = () => {
      size()
      resizeField(field, window.innerWidth, window.innerHeight, rand)
      draw(ctx, field, sprite, dpr)
    }
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    const onScheme = () => {
      sprite = makeSprite()
      draw(ctx, field, sprite, dpr)
    }
    start()
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', onResize)
    scheme.addEventListener('change', onScheme)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', onResize)
      scheme.removeEventListener('change', onScheme)
    }
  }, [])
  return <canvas ref={ref} className="absolute inset-0 size-full" data-testid="rain" />
}
