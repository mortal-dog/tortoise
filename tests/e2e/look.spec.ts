import { expect, type Page, test } from '@playwright/test'

// The glass look (D-048, D-053): the backdrop drifts behind every screen, with no raindrops and no switch; the
// system's reduced motion keeps it still.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function startPlan(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await expect(page.getByRole('link', { name: 'Today', exact: true })).toBeVisible()
}

test('the backdrop drifts on every screen, with no raindrops and no switch', async ({ page }) => {
  await startPlan(page)
  await expect(page.getByTestId('backdrop')).not.toHaveAttribute('data-still')
  for (const tab of ['Week', 'Progress', 'Library', 'Settings']) {
    await page.getByRole('link', { name: tab, exact: true }).click()
    await expect(page.getByRole('link', { name: tab, exact: true })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByTestId('rain')).toHaveCount(0)
  }
  await expect(page.getByRole('switch', { name: 'Moving background' })).toHaveCount(0)
})

test('reduced motion keeps the backdrop still', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await startPlan(page)
  await expect(page.getByTestId('backdrop')).toHaveAttribute('data-still', '')
})
