import { expect, test } from '@playwright/test'

test('the app loads with its manifest, icons and security policy', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Tortoise' })).toBeVisible()
  const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content')
  expect(csp).toContain("default-src 'self'")
  // Google only for the Drive sync (D-054), and nothing else from outside; frames from Google and from the app's
  // own silent sign-in page (D-055).
  expect(csp).toContain("connect-src 'self' https://www.googleapis.com https://accounts.google.com")
  expect(csp).toContain("script-src 'self' https://accounts.google.com")
  expect(csp).toContain("frame-src 'self' https://accounts.google.com")
  const manifest = await (await page.request.get('/manifest.webmanifest')).json()
  expect(manifest.display).toBe('standalone')
  // The installed-app check (desktop Chrome needs the app's id) and a launch that focuses a running window (D-047).
  expect(manifest.related_applications).toEqual([
    { platform: 'webapp', url: '/manifest.webmanifest', id: 'https://tortoise.doctornova.net/' },
  ])
  expect(manifest.launch_handler.client_mode).toEqual(['focus-existing', 'auto'])
  // WebKit's iPhone profile is Safari on an iPhone: written directions, no install button.
  await expect(page.getByText('In Safari, tap Share. No Share button? Tap ⋯ first.')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Install Tortoise' })).toHaveCount(0)
  for (const icon of manifest.icons) {
    expect((await page.request.get(icon.src)).ok()).toBe(true)
  }
  expect((await page.request.get('/apple-touch-icon.png')).ok()).toBe(true)
  expect(errors).toEqual([])
})

test('the app works with the network off once the service worker is installed', async ({ page, context }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready
    return reg.active?.state
  })
  // The first load registers the worker; a reload puts the page under its control.
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await context.setOffline(true)
  // Proof that the network is really off: a file outside the precache cannot be fetched.
  const probe = await page.evaluate(() =>
    fetch(`/not-cached-${Date.now()}.txt`).then(
      () => 'reached',
      () => 'failed',
    ),
  )
  expect(probe).toBe('failed')
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Tortoise' })).toBeVisible()
  await page.goto('/week')
  await expect(page.locator('#root')).not.toBeEmpty()
  await context.setOffline(false)
})

test('the silent sign-in page is itself under the service worker, and answers the app that frames it', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  // The worker answers every other page with the app; this one must reach the frame as it is (D-055).
  const params = await page.evaluate(
    () =>
      new Promise<unknown>((resolve) => {
        window.addEventListener('message', (e) => {
          if (e.origin === location.origin && e.data?.source === 'tortoise/oauth-silent')
            resolve(e.data.params)
        })
        const frame = document.createElement('iframe')
        frame.src = '/oauth-silent.html#access_token=example-token&state=example-state'
        document.body.append(frame)
      }),
  )
  expect(params).toEqual({ access_token: 'example-token', state: 'example-state' })
  expect(errors).toEqual([])
})
