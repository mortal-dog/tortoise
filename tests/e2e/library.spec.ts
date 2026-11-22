import { expect, type Page, test } from '@playwright/test'

// The library with the network off (implementation Phase 5): search, filter, open an exercise page and a source, and
// see that video links leave the app instead of embedding anything. Screenshots in the iPhone profile, light and dark.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

async function goOffline(page: Page) {
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true)
  await page.context().setOffline(true)
  // Proof that the network is really off: a file outside the precache cannot be fetched.
  const probe = await page.evaluate(() =>
    fetch(`/not-cached-${Date.now()}.txt`).then(
      () => 'reached',
      () => 'failed',
    ),
  )
  expect(probe).toBe('failed')
}

test('the library searches and opens an exercise page offline', async ({ page }) => {
  const external: string[] = []
  page.on('request', (r) => {
    const url = new URL(r.url())
    if (url.hostname !== 'localhost') external.push(r.url())
  })
  await goOffline(page)

  await page.goto('/library')
  await expect(page.getByTestId('library-count')).toHaveText('78 exercises')
  await page.getByRole('textbox', { name: 'Search exercises' }).fill('chest wall')
  const list = page.getByRole('list', { name: 'Exercises' })
  await expect(list.getByRole('link').first()).toContainText('Chest-to-wall handstand')
  await page.getByRole('button', { name: 'Handstand' }).click()
  await expect(page).toHaveURL(/area=handstand/)

  await list.getByRole('link', { name: /Chest-to-wall handstand/ }).click()
  await expect(page.getByRole('heading', { name: 'Chest-to-wall handstand' })).toBeVisible()
  await expect(page.getByText('Look at the floor between the hands')).toBeVisible()
  await expect(
    page.getByTestId('ladder-handstand-skill').getByText('Your level', { exact: true }),
  ).toBeVisible()
  const video = page.getByRole('link', { name: /3 Ways to get into a Chest-To-Wall Handstand/ })
  await expect(video).toHaveAttribute('target', '_blank')
  await expect(video).toHaveAttribute('href', /^https:\/\/www\.youtube\.com\/watch\?v=/)
  await expect(page.locator('iframe')).toHaveCount(0)

  // Back returns to the filtered list.
  await page.getByRole('link', { name: 'Back to the library' }).click()
  await expect(page).toHaveURL(/q=chest/)
  await expect(page.getByRole('textbox', { name: 'Search exercises' })).toHaveValue('chest wall')

  // A source chip opens the finding.
  await page.goto('/library/farmer-carry')
  await page.getByRole('link', { name: 'leong2015' }).click()
  await expect(page.getByText(/Each 5 kg less grip strength/)).toBeVisible()

  expect(external).toEqual([])
  await page.context().setOffline(false)
})

for (const scheme of ['light', 'dark'] as const) {
  test(`library screens in the ${scheme} theme`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/library')
    await expect(page.getByTestId('library-count')).toBeVisible()
    await page.screenshot({ path: info.outputPath(`${scheme}-1-library.png`) })
    await page.getByRole('button', { name: 'Splits' }).click()
    await page.getByRole('button', { name: /With video/ }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-2-filtered.png`) })
    await page.goto('/library/prone-chest-lift')
    await expect(page.getByRole('heading', { name: 'Prone chest lift' })).toBeVisible()
    await page.screenshot({ path: info.outputPath(`${scheme}-3-exercise.png`), fullPage: true })
    await page.goto('/library/goblet-squat')
    await page.getByRole('button', { name: 'Set 3 as my level' }).click()
    await page.screenshot({ path: info.outputPath(`${scheme}-4-ladder.png`), fullPage: true })
    await page.goto('/library/sources/sinaki2002')
    await page.screenshot({ path: info.outputPath(`${scheme}-5-source.png`), fullPage: true })
  })
}
