import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Dates are tested in a zone with daylight saving: Greenwich's (neutral example data, never a personal place).
process.env.TZ = 'Europe/London'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    include: ['tests/{unit,content,db,component,guard}/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
  },
})
