// Theme contrast (design §12): every text-capable token reaches 4.5:1 on the background and the surface, both themes.
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
