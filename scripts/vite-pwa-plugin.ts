// A small first-party Vite plugin for the PWA (D-017): it gives the service worker its precache list and version,
// adds the Content Security Policy to the production HTML only, and writes 404.html for deep links on GitHub Pages.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import type { Plugin } from 'vite'

/**
 * The policy of design §11: the app's own origin, and Google's sign-in and Drive hosts for the backup (D-054). The app
 * loads Google's script only when the user taps to sign in, and calls Drive only while signed in.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' https://accounts.google.com",
  "connect-src 'self' https://www.googleapis.com https://accounts.google.com",
  'frame-src https://accounts.google.com',
  "img-src 'self' data: blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

function listFiles(dir: string): string[] {
  let out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out = out.concat(listFiles(full))
    else out.push(full)
  }
  return out
}

export function pwaPlugin(): Plugin {
  let publicDir = ''
  return {
    name: 'tortoise-pwa',
    enforce: 'post',
    configResolved(config) {
      publicDir = config.publicDir
    },
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        // The dev server needs inline scripts, so the policy is added to the production build only.
        if (ctx.server) return []
        return [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ]
      },
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html']
      if (index && index.type === 'asset') {
        this.emitFile({ type: 'asset', fileName: '404.html', source: index.source })
      }
      const sw = Object.values(bundle).find((f) => f.type === 'chunk' && f.fileName === 'sw.js')
      if (sw?.type !== 'chunk') throw new Error('tortoise-pwa: sw.js chunk missing')

      const hash = createHash('sha256')
      const urls = new Set<string>(['/'])
      for (const file of Object.values(bundle)) {
        if (file.fileName === 'sw.js' || file.fileName === '404.html' || file.fileName.endsWith('.map'))
          continue
        urls.add(`/${file.fileName}`)
        hash.update(file.fileName)
        hash.update(file.type === 'chunk' ? file.code : file.source)
      }
      if (publicDir) {
        for (const full of listFiles(publicDir)) {
          const rel = relative(publicDir, full).split(sep).join('/')
          if (rel === 'robots.txt' || rel.startsWith('.')) continue
          urls.add(`/${rel}`)
          hash.update(rel)
          hash.update(readFileSync(full))
        }
      }
      const list = [...urls].sort()
      const version = hash.digest('hex').slice(0, 12)
      if (!sw.code.includes('__PRECACHE__') || !sw.code.includes('__VERSION__')) {
        throw new Error('tortoise-pwa: placeholders not found in sw.js')
      }
      sw.code = sw.code
        .replaceAll('__PRECACHE__', JSON.stringify(list))
        .replaceAll('__VERSION__', JSON.stringify(version))
    },
  }
}
