import { defineConfig, devices } from '@playwright/test'

// TORTOISE_E2E_PORT lets two worktrees run the e2e tests at once.
const PORT = Number(process.env.TORTOISE_E2E_PORT ?? 4173)

// TORTOISE_E2E_DPR overrides the iPhone profile's 3x pixel density. CI sets 1 (D-049): its WebKit draws without a
// GPU, and the glass and the backdrop (D-048) cost per pixel, so at 3x every test ran two to three times slower and
// one timed out. A local run keeps 3x, so its screenshots look like the phone.
const DPR = Number(process.env.TORTOISE_E2E_DPR) || undefined

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
  projects: [
    {
      name: 'webkit-iphone',
      use: { ...devices['iPhone 15'], ...(DPR ? { deviceScaleFactor: DPR } : {}) },
    },
  ],
  webServer: {
    command: `pnpm exec vite build && pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    // Never reuse a server: on a shared port it could be another worktree's build.
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
