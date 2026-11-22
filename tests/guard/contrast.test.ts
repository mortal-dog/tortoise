// Theme contrast (design §12): every text-capable token reaches 4.5:1 on the background and the surface, both themes,
// and on every glass panel composited over every overlap of the backdrop's glows (D-048).
import { describe, expect, it } from 'vitest'
import { readRepoFile } from './repo'

function tokens(block: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/--([a-z-]+):\s*(#[0-9a-f]{6})/gi))
    out[m[1] ?? ''] = (m[2] ?? '').toLowerCase()
  return out
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r, g, b] = c.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)) as [
    number,
    number,
    number,
  ]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number]
  return (x + 0.05) / (y + 0.05)
}

const css = readRepoFile('src/styles.css')
const light = tokens(/:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '')
const dark = tokens(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '')

describe.each([
  ['light', light],
  ['dark', dark],
])('the %s theme', (_name, t) => {
  it.each(['text', 'primary', 'primary-strong', 'shell', 'sky', 'brick'])('%s reaches 4.5:1', (name) => {
    for (const bg of ['background', 'surface']) {
      expect(contrast(t[name] ?? '#000000', t[bg] ?? '#000000')).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('on-primary text reaches 4.5:1 on primary buttons', () => {
    expect(contrast(t['on-primary'] ?? '', t.primary ?? '')).toBeGreaterThanOrEqual(4.5)
  })

  it('matches the design tokens', () => {
    expect(Object.keys(t).length).toBeGreaterThanOrEqual(11)
  })
})

it('the light shell and sky are the darkened D-033 values', () => {
  expect(light.shell).toBe('#9a6212')
  expect(light.sky).toBe('#2a72ab')
})

// Glass (D-048): translucent tokens written `rgb(r g b / a)`. A panel's colour is the backdrop under it with the panel
// laid over it; the blur only averages that backdrop, so the worst case is a glow's centre, or several glows at once.
type Rgba = [number, number, number, number]

function rgba(block: string): Record<string, Rgba> {
  const out: Record<string, Rgba> = {}
  for (const m of block.matchAll(/--([a-z-]+):\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g))
    out[m[1] ?? ''] = [Number(m[2]), Number(m[3]), Number(m[4]), Number(m[5])]
  return out
}

function toRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function toHex(c: number[]): string {
  return `#${c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`
}

function over(under: [number, number, number], layer: Rgba): [number, number, number] {
  const a = layer[3]
  return [0, 1, 2].map((i) => (under[i] ?? 0) * (1 - a) + (layer[i] ?? 0) * a) as [number, number, number]
}

const lightGlass = rgba(/:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '')
const darkGlass = rgba(/prefers-color-scheme:\s*dark\)\s*\{\s*:root\s*\{([^}]*)\}/.exec(css)?.[1] ?? '')
const GLOWS = ['glow-moss', 'glow-sky', 'glow-amber', 'glow-light']
const PANELS = ['glass', 'glass-strong', 'glass-active', 'field']

describe.each([
  ['light', light, lightGlass],
  ['dark', dark, darkGlass],
])('the %s glass', (_name, t, g) => {
  it('defines every glass token', () => {
    for (const name of [...GLOWS, ...PANELS]) expect(g[name], name).toBeDefined()
  })

  it.each(['text', 'primary', 'primary-strong', 'shell', 'sky', 'brick'])(
    '%s reaches 4.5:1 on every panel over every overlap of glows',
    (name) => {
      const layer = (k: string) => g[k] as Rgba
      for (let mask = 0; mask < 1 << GLOWS.length; mask++) {
        let page = toRgb(t.background ?? '#000000')
        GLOWS.forEach((k, i) => {
          if (mask & (1 << i)) page = over(page, layer(k))
        })
        const glass = over(page, layer('glass'))
        const strong = over(page, layer('glass-strong'))
        const grounds = {
          page,
          glass,
          'field on the page': over(page, layer('field')),
          'field on glass': over(glass, layer('field')),
          'glass-strong': strong,
          'the open tab': over(strong, layer('glass-active')),
        }
        for (const [where, rgb] of Object.entries(grounds)) {
          expect(
            contrast(t[name] ?? '#000000', toHex(rgb)),
            `${where}, glows ${mask}`,
          ).toBeGreaterThanOrEqual(4.5)
        }
      }
    },
  )
})
