import { expect, test } from '@playwright/test'

// Screenshots in the iPhone profile for review (implementation Phase 3). Greenwich: neutral example data.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

for (const scheme of ['light', 'dark'] as const) {
  test(`screens in the ${scheme} theme`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
    await page.goto('/')
    await page.screenshot({ path: info.outputPath(`${scheme}-1-install.png`) })
    await page.getByRole('button', { name: 'Start in this browser instead' }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-2-start.png`) })
    await page.getByRole('button', { name: 'Start the plan' }).click()

    await page.getByRole('link', { name: 'Settings', exact: true }).click()
    await page.getByLabel('Latitude').fill('51.4769')
    await page.getByLabel('Longitude').fill('-0.0005')
    await page.getByRole('button', { name: 'Save location' }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-6-settings.png`), fullPage: true })

    // Week 1, Thursday: a run-type day with a done morning block.
    await page.clock.setFixedTime(new Date('2026-12-03T09:00:00Z'))
    await page.goto('/')
    await expect(page.getByTestId('daylight')).toBeVisible()
    await page
      .getByTestId('card-morning')
      .getByRole('button', { name: /Done as planned/ })
      .click()
    await page.screenshot({ path: info.outputPath(`${scheme}-3-today.png`), fullPage: true })

    await page.getByRole('link', { name: 'Week', exact: true }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-4-week.png`), fullPage: true })
    await page.getByTestId('week-row-thu').click()
    await page.screenshot({ path: info.outputPath(`${scheme}-5-day.png`), fullPage: true })

    // The player (Phase 4): the intro, a reps step, a rest, and a timeline.
    await page.goto('/play/2026-12-03/main')
    await page.screenshot({ path: info.outputPath(`${scheme}-7-player-intro.png`), fullPage: true })
    await page.goto('/play/2026-11-30/main')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    while (!(await page.getByTestId('unit-title').textContent())?.includes('+')) {
      await page.getByRole('button', { name: 'Skip this' }).click()
    }
    await page.screenshot({ path: info.outputPath(`${scheme}-8-player-pair.png`), fullPage: true })
    await page.getByRole('button', { name: 'Set done' }).click()
    await page.getByRole('button', { name: 'Set done' }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-9-player-rest.png`), fullPage: true })
    await page.goto('/play/2026-11-30/split')
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.getByRole('button', { name: 'Start', exact: true }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-10-player-hold.png`), fullPage: true })
    await page.getByRole('button', { name: 'Pocket lock' }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-11-player-lock.png`), fullPage: true })
  })
}
