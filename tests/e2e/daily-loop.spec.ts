import { expect, type Page, test } from '@playwright/test'

// Greenwich's zone: neutral example data. Week 0 begins on Monday 23 November 2026.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function at(page: Page, isoDate: string) {
  await page.clock.setFixedTime(new Date(`${isoDate}T09:00:00Z`))
  await page.reload()
}

async function streak(page: Page) {
  return Number(await page.getByTestId('streak').textContent())
}

test('a full day, a Shell day and a sick day follow the streak rules, offline', async ({ page, context }) => {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  // Let the service worker take control, then cut the network: everything below runs offline.
  await page.evaluate(() => navigator.serviceWorker.ready)
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await context.setOffline(true)
  await page.reload()

  // First run: the install hint, then the start Monday (today, a Monday, by default).
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await expect(page.getByLabel('Week 0 begins on')).toHaveValue('2026-11-23')
  await page.getByRole('button', { name: 'Start the plan' }).click()

  // Monday: a full day.
  await expect(page.getByTestId('today-label')).toContainText('Mon 23 Nov · Week 0')
  await expect(page.getByTestId('day-ring')).toHaveText('0/2')
  expect(await streak(page)).toBe(0)
  await page
    .getByTestId('card-morning')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await expect(page.getByTestId('day-ring')).toHaveText('1/2')
  await page
    .getByTestId('card-main')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await expect(page.getByTestId('day-ring')).toHaveText('2/2')
  expect(await streak(page)).toBe(1)

  // Tuesday: a Shell day, the morning block alone, with the open cards folded.
  await at(page, '2026-11-24')
  await expect(page.getByTestId('streak')).toHaveText('1') // counted from yesterday while today is open
  await page
    .getByTestId('card-morning')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await page.getByRole('button', { name: 'Make it a Shell day' }).click()
  await expect(page.getByTestId('card-main')).toHaveCount(0)
  await expect(page.getByTestId('day-ring')).toHaveText('1/2')
  await expect(page.getByTestId('streak')).toHaveText('2')

  // Wednesday: nothing. Thursday: Wednesday was a sick day, so it pauses the streak instead of breaking it.
  await at(page, '2026-11-26')
  await page.getByRole('button', { name: 'It was a sick day' }).click()
  await expect(page.getByRole('button', { name: 'It was a sick day' })).toHaveCount(0)
  await expect(page.getByTestId('streak')).toHaveText('2')
  await page
    .getByTestId('card-morning')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await expect(page.getByTestId('streak')).toHaveText('3')

  // Friday: nothing. Saturday is the Week 0 test day; one missed day does not end the run.
  await at(page, '2026-11-28')
  await expect(page.getByText('Test weekend: the Tortoise Test, Day 1.')).toBeVisible()
  await expect(page.getByTestId('card-main')).toContainText('Tortoise Test · Day 1')
  await expect(page.getByTestId('card-split')).toHaveCount(0)
  await expect(page.getByTestId('streak')).toHaveText('3')

  // Sunday, with Saturday missed as well: two missed days in a row end the run.
  await at(page, '2026-11-29')
  await expect(page.getByTestId('streak')).toHaveText('0')

  // The Week tab shows each day's status by its mark.
  await page.getByRole('link', { name: 'Week', exact: true }).click()
  const statuses = await Promise.all(
    ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((d) =>
      page.getByTestId(`week-row-${d}`).getAttribute('data-status'),
    ),
  )
  expect(statuses).toEqual(['full', 'shell', 'paused', 'shell', 'missed', 'missed', 'ahead'])

  // Progress keeps the longest streak.
  await page.getByRole('link', { name: 'Progress', exact: true }).click()
  await expect(page.getByText('Longest streak').locator('..').getByText('3')).toBeVisible()
  await context.setOffline(false)
})

test('a past day can be edited from the Week tab, and swaps warn when they break a rule', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await at(page, '2026-12-02') // Wednesday of Week 1

  await page.getByRole('link', { name: 'Week', exact: true }).click()
  await expect(page.getByTestId('week-label')).toContainText('Week 1 · Block 1 · build')
  await page.getByTestId('week-row-mon').click()
  await page.getByLabel('Morning block done').check()
  await page.getByRole('button', { name: 'Injured' }).click()
  await expect(page.getByTestId('day-status')).toContainText('Shell day') // done beats paused
  await page.getByRole('link', { name: 'Week', exact: true }).click()
  await expect(page.getByTestId('week-row-mon')).toHaveAttribute('data-status', 'shell')
  await expect(page.getByTestId('week-row-tue')).toHaveAttribute('data-status', 'missed')

  // Swapping Tuesday and Wednesday puts two strength days in a row.
  await page.getByRole('button', { name: 'Swap days' }).click()
  await page.getByTestId('week-row-tue').click()
  await page.getByTestId('week-row-wed').click()
  await expect(page.getByText(/Two strength days in a row/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Save the swap' }).click()
  await expect(page.getByTestId('week-row-tue')).toContainText('Strength B')
  await page.getByRole('button', { name: 'Undo the swaps' }).click()
  await expect(page.getByTestId('week-row-tue')).not.toContainText('Strength B')
})
