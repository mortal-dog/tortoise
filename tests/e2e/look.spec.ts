import { expect, type Page, test } from '@playwright/test'

// The glass look (D-048): raindrops on the calm screens only, drawn on a canvas; the switch in Settings and the
// system's reduced motion keep the backdrop still.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function startPlan(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await expect(page.getByRole('link', { name: 'Today', exact: true })).toBeVisible()
}

/** How many of the canvas's pixels are not fully transparent. */
async function drawnPixels(page: Page): Promise<number> {
  return page.getByTestId('rain').evaluate((el) => {
    const c = el as HTMLCanvasElement
    const data = c.getContext('2d')?.getImageData(0, 0, c.width, c.height).data ?? []
    let n = 0
    for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) > 0) n++
    return n
  })
}

test('raindrops fall on Today, Week and Progress, and nowhere else', async ({ page }) => {
  await startPlan(page)
  await expect(page.getByTestId('rain')).toBeAttached()
  await expect.poll(() => drawnPixels(page)).toBeGreaterThan(100)
  await expect(page.getByTestId('backdrop')).not.toHaveAttribute('data-still')
  for (const [tab, rain] of [
    ['Week', true],
    ['Progress', true],
    ['Library', false],
    ['Settings', false],
  ] as const) {
    await page.getByRole('link', { name: tab, exact: true }).click()
    await expect(page.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('rain')).toHaveCount(rain ? 1 : 0)
  }
})

test('the Moving background switch stops the drift and the rain, and keeps that on the phone', async ({
  page,
}) => {
  await startPlan(page)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  const toggle = page.getByRole('switch', { name: 'Moving background' })
  await expect(toggle).toBeChecked()
  await toggle.uncheck()
  await expect(page.getByTestId('backdrop')).toHaveAttribute('data-still', '')
  await page.reload()
  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByTestId('rain')).toHaveCount(0)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await page.getByRole('switch', { name: 'Moving background' }).check()
  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByTestId('rain')).toBeAttached()
})

test('reduced motion keeps the backdrop still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startPlan(page)
  await expect(page.getByTestId('backdrop')).toHaveAttribute('data-still', '')
  await expect(page.getByTestId('rain')).toHaveCount(0)
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(
    page.getByText('Still while the phone asks for reduced motion.', { exact: false }),
  ).toBeVisible()
})
