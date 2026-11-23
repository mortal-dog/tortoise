import { expect, type Page, test } from '@playwright/test'

// Greenwich's zone: neutral example data. Week 0 begins on Monday 23 November 2026; Week 1 on 30 November.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function at(page: Page, isoDate: string) {
  await page.clock.setFixedTime(new Date(`${isoDate}T09:00:00Z`))
  await page.goto('/')
}

test('the start question sets the run–walk step, and Progress shows the badges, each with its card', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByLabel('How long is an easy run comfortable?').fill('15')
  await page.getByRole('button', { name: 'Start the plan' }).click()

  // Week 1: the run starts at R4 (10–29 min), every other ladder at level 1 (D-067). No test anywhere.
  await at(page, '2026-12-01')
  await expect(page.getByTestId('card-main')).toContainText('Run–walk R4')
  await at(page, '2026-11-30')
  await expect(page.getByTestId('card-main')).toContainText('Push L1')
  await expect(page.getByText(/Tortoise Test/)).toHaveCount(0)

  // Progress: the badges; no Shell, photos, trends, level charts (D-062), test or At-99 board (D-067).
  await page.getByRole('link', { name: 'Progress', exact: true }).click()
  for (const gone of [
    'The Shell, 2026',
    'Photos',
    'Test trends',
    'Levels over time',
    'Outdoor sessions',
    'At 99',
  ])
    await expect(page.getByText(gone, { exact: true })).toHaveCount(0)
  // Badges (D-058, D-066): the reached one shines; a tap opens a card that tells how to earn a locked one, closed by ✕.
  // No hover tooltips, and every label under a medal is one line that fits, not cut off.
  await expect(page.getByRole('link', { name: /Tortoise Test/ })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Run–walk R4, earned' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Run–walk R8, locked' })).toBeVisible()
  const labels = page.getByTestId('badge-label')
  await expect(labels).toHaveCount(41)
  const fits = await labels.evaluateAll((els) =>
    els.map((el) => {
      const h = Number.parseFloat(getComputedStyle(el).lineHeight)
      return { text: el.textContent, ok: el.scrollWidth <= el.clientWidth && el.clientHeight <= h + 1 }
    }),
  )
  expect(fits.filter((f) => !f.ok)).toEqual([])
  await expect(page.locator('[data-testid^="badges-"] [title]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Ancient, locked' }).click()
  const card = page.getByRole('dialog', { name: 'Ancient' })
  await expect(card).toContainText('How to earn it')
  await expect(card).toContainText('Reach a tortoise streak of 1000 days')
  await expect(card).toContainText('Locked')
  await page.screenshot({ path: info.outputPath('badge-card.png') })
  await card.getByRole('button', { name: 'Close' }).click()
  await expect(card).toHaveCount(0)
  await page.getByRole('button', { name: 'Run–walk R4, earned' }).click()
  await expect(page.getByRole('dialog', { name: 'Run–walk R4' })).toContainText('What it took')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.screenshot({ path: info.outputPath('progress.png'), fullPage: true })
})
