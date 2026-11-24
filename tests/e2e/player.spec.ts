import { expect, type Page, test } from '@playwright/test'

// Greenwich's zone: neutral example data. Week 0 begins on Monday 23 November 2026, so Week 1 begins on 30 November.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

/** Installs a clock that runs only when the test moves it, starts the plan in Week 0, then goes to `date`. */
async function startPlanThenGoTo(page: Page, date: string) {
  await page.clock.install({ time: new Date('2026-11-23T08:00:00Z') })
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await expect(page.getByTestId('today-label')).toContainText('Week 0')
  await page.clock.setSystemTime(new Date(`${date}T08:00:00Z`))
  await page.reload()
}

const visible = (page: Page, name: string | RegExp) =>
  page
    .getByRole('button', { name, exact: typeof name === 'string' })
    .first()
    .isVisible()
    .catch(() => false)

/** Answers "Keep" in every check-in on the summary that has no answer yet (D-069). */
async function keepTheRest(page: Page) {
  for (const card of await page.locator('[data-testid^="check-in-"]').all()) {
    if ((await card.locator('[aria-pressed="true"]').count()) === 0)
      await card.getByRole('button', { name: /^Keep/ }).click()
  }
}

/** Plays whatever step is on screen until the summary; the doses are fixed, nothing is counted (D-069). */
async function playToSummary(page: Page) {
  for (let i = 0; i < 200; i++) {
    if (await page.getByTestId('summary').isVisible()) return
    if (await visible(page, 'Skip the rest')) {
      await page.getByRole('button', { name: 'Skip the rest' }).click()
      continue
    }
    if (await visible(page, 'Set done')) {
      await page.getByRole('button', { name: 'Set done' }).click()
      continue
    }
    if (await visible(page, 'Done')) {
      await page.getByRole('button', { name: 'Done', exact: true }).click()
      continue
    }
    if (await visible(page, 'Stop')) {
      await page.clock.runFor(20_000)
      await page.getByRole('button', { name: 'Stop', exact: true }).click()
      continue
    }
    if (await visible(page, 'Finish')) {
      await page.getByRole('button', { name: 'Finish' }).click()
      continue
    }
    if (await visible(page, 'Start')) {
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      // A timeline runs by itself; a timed step waits for Finish. A long jump also stands in for the background.
      await page.clock.fastForward(45 * 60_000)
      await page.clock.runFor(1_000)
      continue
    }
    await page.clock.runFor(500)
  }
  throw new Error('the session did not reach its summary')
}

test('Strength A runs pair by pair with the rest timer, and saving marks the card done', async ({ page }) => {
  // Monday of Week 5 (Block 2, a build week): 3 sets.
  await startPlanThenGoTo(page, '2026-12-28')
  await page.getByRole('link', { name: 'Start Strength A' }).click()
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0) // full screen
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  // The warm-up: the timed rope, then the drills.
  await expect(page.getByTestId('unit-title')).toHaveText('Jump rope')
  while (!(await page.getByTestId('unit-title').textContent())?.includes('Jumps')) {
    if (await visible(page, 'Start')) {
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      await page.clock.runFor(2 * 60_000)
      await page.getByRole('button', { name: 'Finish' }).click()
    } else {
      await page.getByRole('button', { name: /Set done|Done/ }).click()
    }
  }

  // A0: 3 × 5 squat jumps, 60 s rest after each set; no feedback question and nothing to count (D-069).
  for (let set = 1; set <= 3; set++) {
    await expect(page.getByTestId('set-count')).toContainText(`Set ${set} of 3`)
    await page.getByRole('button', { name: 'Set done' }).click()
    if (set < 3) {
      await expect(page.getByTestId('rest')).toBeVisible()
      await page.clock.runFor(61_000) // the rest timer ends by itself
      await expect(page.getByTestId('rest')).toHaveCount(0)
    }
  }
  await expect(page.getByRole('button', { name: 'Too easy' })).toHaveCount(0)

  // A1 + A2: alternate, and rest only after the pair.
  await expect(page.getByTestId('unit-title')).toHaveText('Squat · L1 + Push · L1')
  await expect(page.getByRole('button', { name: 'More reps' })).toHaveCount(0)
  await page.getByRole('button', { name: 'Set done' }).click()
  await expect(page.getByTestId('rest')).toHaveCount(0)
  await page.getByRole('button', { name: 'Set done' }).click()
  await expect(page.getByTestId('rest')).toBeVisible()
  // The rest timer runs out on its own.
  await page.clock.runFor(76_000)
  await expect(page.getByTestId('rest')).toHaveCount(0)

  await playToSummary(page)
  await expect(page.getByTestId('summary-sets')).not.toHaveText('0')
  // Four weeks into Week 1: the check-ins are due (D-069). Save waits for every answer.
  const push = page.getByTestId('check-in-push')
  await expect(push).toContainText('Push')
  await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled()
  await push.getByRole('button', { name: /^Harder/ }).click()
  await keepTheRest(page)
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByTestId('card-main')).toBeVisible()
  await expect(page.getByTestId('card-main').getByLabel('done')).toBeVisible()
  // The sets went into the logs, where the check-ins read when a ladder was last done.
  const logs = await page.evaluate(
    () =>
      new Promise<number>((resolve) => {
        const open = indexedDB.open('tortoise')
        open.onsuccess = () => {
          const count = open.result.transaction('logs').objectStore('logs').count()
          count.onsuccess = () => resolve(count.result)
        }
      }),
  )
  expect(logs).toBeGreaterThanOrEqual(5)
  // "Harder" moved Push up one level, dated today.
  const level = await page.evaluate(
    () =>
      new Promise<{ level: number; askedAt?: string }>((resolve) => {
        const open = indexedDB.open('tortoise')
        open.onsuccess = () => {
          const get = open.result.transaction('levels').objectStore('levels').get('push')
          get.onsuccess = () => resolve(get.result)
        }
      }),
  )
  expect(level).toMatchObject({ level: 2, askedAt: '2026-12-28' })
  await page.reload()
  await expect(page.getByTestId('card-main')).toContainText('Push L2')
})

test('the 4 × 4 runs from timestamps through work and rest, and catches up after a jump', async ({
  page,
}) => {
  // Thursday of Week 13, the first week of Block 4: the 4 × 4 stage.
  await startPlanThenGoTo(page, '2027-02-25')
  await expect(page.getByTestId('card-main')).toContainText('Intervals')
  await page.getByRole('link', { name: 'Start Intervals' }).click()
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  // Skip ahead to the main set.
  while ((await page.getByTestId('unit-title').textContent()) !== 'Intervals') {
    await page.getByRole('button', { name: 'Skip this' }).click()
  }
  await expect(page.getByTestId('unit-target')).toHaveText('4 × (4 min hard, 3 min easy)')
  await page.getByRole('button', { name: 'Start', exact: true }).click()
  await expect(page.getByTestId('segment')).toHaveText('Get ready')
  await page.clock.runFor(3_500)
  await expect(page.getByTestId('segment')).toHaveText('Hard')
  await expect(page.getByTestId('segment-count')).toHaveText('Round 1 of 4')
  await page.clock.runFor(240_000)
  await expect(page.getByTestId('segment')).toHaveText('Easy')

  // The phone sleeps for 10 minutes: on return the timeline stands where the clock says, in round 3.
  await page.clock.fastForward(600_000)
  await page.clock.runFor(500)
  await expect(page.getByTestId('segment-count')).toHaveText('Round 3 of 4')

  // Pause holds the time.
  await page.getByRole('button', { name: 'Pause' }).click()
  const held = await page.getByTestId('timer').textContent()
  await page.clock.runFor(30_000)
  await expect(page.getByTestId('timer')).toHaveText(held ?? '')
  await page.getByRole('button', { name: 'Resume' }).click()

  await page.clock.runFor(20 * 60_000)
  await playToSummary(page)
  await keepTheRest(page)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('card-main').getByLabel('done')).toBeVisible()
})
