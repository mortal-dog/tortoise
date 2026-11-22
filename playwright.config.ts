import { defineConfig, devices } from '@playwright/test'

// TORTOISE_E2E_PORT lets two worktrees run the e2e tests at once.
const PORT = Number(process.env.TORTOISE_E2E_PORT ?? 4173)

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    serviceWorkers: 'allow',
  },
  projects: [{ name: 'webkit-iphone', use: { ...devices['iPhone 15'] } }],
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never reuse a server: on a shared port it could be another worktree's build.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
