import { expect, test } from '@playwright/test'

test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

// A 2 × 2 PNG, drawn here: neutral test data.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAAFklEQVR4nGNgYGD4z8DAwMDAwMDAAAANAAH+S5UlAAAAAElFTkSuQmCC',
  'base64',
)

test('a progress photo is added, kept, opened and deleted, offline', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await context.setOffline(true)
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await page.getByRole('link', { name: 'Progress', exact: true }).click()

  await page.getByTestId('photo-input').setInputFiles({ name: 'p.png', mimeType: 'image/png', buffer: PNG })
  await expect(page.getByTestId('photos').getByRole('button')).toHaveCount(1)
  const src = await page.getByTestId('photos').locator('img').getAttribute('src')
  expect(src?.startsWith('data:image/jpeg;base64,')).toBe(true)

  await page.reload()
  await page.getByRole('button', { name: /Photo of Mon 23 Nov/ }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  page.once('dialog', (d) => void d.accept())
  await page.getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByTestId('photos')).toHaveCount(0)
})
