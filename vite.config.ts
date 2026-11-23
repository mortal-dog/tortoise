import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { pwaPlugin } from './scripts/vite-pwa-plugin.ts'

const pkg = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync('package.json', 'utf8')))

// The version comes from git at build time (D-065): package.json's major.minor, then the number of commits on HEAD,
// so every commit builds a higher number with no step to remember. Without git it falls back to package.json.
function git(args: string): string | undefined {
  try {
    return (
      execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] })
        .toString()
        .trim() || undefined
    )
  } catch {
    return undefined
  }
}
const count = git('rev-list --count HEAD')
const appVersion = count ? `${pkg.version.split('.').slice(0, 2).join('.')}.${count}` : pkg.version
const appCommit = git('rev-parse --short=7 HEAD') ?? 'unknown'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  define: { __APP_VERSION__: JSON.stringify(appVersion), __APP_COMMIT__: JSON.stringify(appCommit) },
  plugins: [
    tanstackRouter({ target: 'react', autoCodeSplitting: false }),
    react(),
    tailwindcss(),
    pwaPlugin(),
  ],
  build: {
    target: 'safari16',
    sourcemap: false,
    rolldownOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        sw: fileURLToPath(new URL('./src/sw/sw.ts', import.meta.url)),
      },
      output: {
        entryFileNames: (chunk) => (chunk.name === 'sw' ? 'sw.js' : 'assets/[name]-[hash].js'),
      },
    },
  },
  preview: { port: 4173, strictPort: true },
})
