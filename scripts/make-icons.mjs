// Draws the app icon (a geometric tortoise whose shell is made of hexagons, design §12) as SVG, then renders the PNG
// sizes with Playwright's Chromium. Run: pnpm icons
import { writeFileSync } from 'node:fs'
import { chromium } from '@playwright/test'

const MOSS = '#3E6B3F'
const MOSS_DARK = '#2E5230'
const AMBER = '#9A6212'
const AMBER_LIGHT = '#E0A955'
const CREAM = '#FBF7EE'

function hexagon(cx, cy, r) {
  const pts = []
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 90)
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`)
  }
  return pts.join(' ')
}

/** The tortoise seen from above, centred on (256, 256), scaled by s. */
function tortoise(s) {
  const r = 44
  const d = Math.sqrt(3) * r + 6
  const cells = [[0, 0]]
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i)
    cells.push([d * Math.cos(a), d * Math.sin(a)])
  }
  const shell = cells
    .map(([x, y], i) => `<polygon points="${hexagon(x, y, r)}" fill="${i === 0 ? AMBER_LIGHT : AMBER}"/>`)
    .join('')
  const legs = [
    [-118, -92, -35],
    [118, -92, 35],
    [-118, 92, 35],
    [118, 92, -35],
  ]
    .map(
      ([x, y, rot]) =>
        `<ellipse cx="${x}" cy="${y}" rx="30" ry="44" transform="rotate(${rot} ${x} ${y})" fill="${MOSS}"/>`,
    )
    .join('')
  return `<g transform="translate(256 262) scale(${s})">
    ${legs}
    <path d="M -14 150 L 0 182 L 14 150 Z" fill="${MOSS}"/>
    <ellipse cx="0" cy="-170" rx="40" ry="46" fill="${MOSS}"/>
    <circle cx="-15" cy="-180" r="6" fill="${CREAM}"/>
    <circle cx="15" cy="-180" r="6" fill="${CREAM}"/>
    <ellipse cx="0" cy="0" rx="150" ry="158" fill="${MOSS_DARK}"/>
    ${shell}
  </g>`
}

function svg({ scale, background, rounded }) {
  const bg = background ? `<rect width="512" height="512" ${rounded ? 'rx="112"' : ''} fill="${CREAM}"/>` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><title>Tortoise</title>${bg}${tortoise(scale)}</svg>\n`
}

const any = svg({ scale: 1, background: true, rounded: true })
// Maskable icons keep the subject inside the central 80% circle.
const maskable = svg({ scale: 0.72, background: true, rounded: false })
// The Apple touch icon must be opaque; iOS rounds the corners itself.
const apple = svg({ scale: 0.86, background: true, rounded: false })

writeFileSync('public/icon.svg', any)

const browser = await chromium.launch()
const page = await browser.newPage()
async function render(markup, size, file) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(
    `<html><body style="margin:0;background:transparent">${markup.replace('width="512" height="512"', `width="${size}" height="${size}"`)}</body></html>`,
  )
  await page.locator('svg').screenshot({ path: file, omitBackground: true })
}
await render(any, 192, 'public/icon-192.png')
await render(any, 512, 'public/icon-512.png')
await render(maskable, 512, 'public/icon-maskable-512.png')
await render(apple, 180, 'public/apple-touch-icon.png')
await browser.close()
console.log('icons written to public/')
