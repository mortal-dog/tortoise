import { expect, type Page, test } from '@playwright/test'

// Greenwich's zone: neutral example data. Week 0 begins on Monday 23 November 2026; its test days are 28 and 29 November.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function at(page: Page, isoDate: string) {
  await page.clock.setFixedTime(new Date(`${isoDate}T09:00:00Z`))
  await page.goto('/')
}

test('a completed Week 0 test sets the starting levels, and Progress shows the results', async ({
  page,
}, info) => {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()

  // Saturday: Day 1, outdoors, with the start question.
  await at(page, '2026-11-28')
  await page.getByRole('link', { name: 'Start Tortoise Test · Day 1' }).click()
  await expect(page.getByRole('tab', { name: /Day 1/ })).toHaveAttribute('aria-selected', 'true')
  const start = page.getByTestId('start-questions')
  await start.getByLabel('How long is an easy run comfortable?').fill('15')
  await start.getByRole('button', { name: 'Save' }).click()
  await expect(start.getByLabel('saved')).toBeVisible()
  await page.screenshot({ path: info.outputPath('wizard-day1.png'), fullPage: true })
  await page.getByRole('button', { name: 'Finish Day 1' }).click()
  await expect(page.getByTestId('start-levels')).toContainText('Run–walk: R4')

  // Sunday: Day 2 resumes the same test record.
  await at(page, '2026-11-29')
  await expect(page.getByTestId('card-main')).toContainText('Tortoise Test · Day 2')
  await page.getByRole('link', { name: 'Start Tortoise Test · Day 2' }).click()
  await expect(page.getByRole('tab', { name: /Day 2/ })).toHaveAttribute('aria-selected', 'true')
  const push = page.getByTestId('test-push-ups')
  await push.getByLabel('Push-ups').fill('12')
  await push.getByRole('button', { name: 'Save' }).click()
  const sit = page.getByTestId('test-sit-to-rise')
  await sit.getByRole('button', { name: 'Standing up: one more support' }).click()
  await expect(sit.getByTestId('sit-rise-score')).toHaveText('Score: 9 of 10')
  await sit.getByRole('button', { name: 'Save' }).click()
  await page.getByRole('button', { name: 'Finish Day 2' }).click()
  await expect(page.getByTestId('start-levels')).toContainText('Push: 3')

  // Week 1: the cards show the starting levels.
  await at(page, '2026-11-30')
  await expect(page.getByTestId('card-main')).toContainText('Push L3')
  await expect(page.getByTestId('card-main')).toContainText('Squat L1')

  // Progress: the trends, the milestone and the At-99 board.
  await page.getByRole('link', { name: 'Progress', exact: true }).click()
  await expect(page.getByTestId('trend-push-ups')).toContainText('Latest: 12 reps')
  await expect(page.getByTestId('trend-push-ups').getByTestId('aim-line')).toContainText('Aim 40 reps')
  await expect(page.getByTestId('trend-sit-to-rise')).toContainText('Latest: 9 points')
  // Badges (D-058): the reached one shines, a locked one tells how to earn it.
  await expect(page.getByRole('button', { name: '10 push-ups, earned' })).toBeVisible()
  await page.getByRole('button', { name: 'Ancient, locked' }).click()
  await expect(page.getByTestId('badge-detail')).toContainText(
    'To earn it: Reach a tortoise streak of 1000 days',
  )
  await expect(page.getByTestId('at99')).toContainText('9 points')
  await expect(page.getByTestId('honeycomb')).toBeVisible()
  await page.screenshot({ path: info.outputPath('progress.png'), fullPage: true })
})
