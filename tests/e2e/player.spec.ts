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

/** Plays whatever step is on screen until the summary, answering "Right" to every feedback question. */
async function playToSummary(page: Page) {
  for (let i = 0; i < 200; i++) {
    if (await page.getByTestId('summary').isVisible()) return
    if (await visible(page, 'Right')) {
      for (const b of await page.getByRole('button', { name: 'Right', exact: true }).all()) await b.click()
      continue
    }
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
  await expect(page.getByTestId('pocket-lock')).toHaveCount(0)
  await expect(page.getByRole('navigation', { name: 'Main' })).toHaveCount(0) // full screen
  await page.getByRole('button', { name: 'Start', exact: true }).click()

  // The warm-up: the timed rope, then the drills.
  await expect(page.getByTestId('unit-title')).toHaveText('Rope basics')
  while (!(await page.getByTestId('unit-title').textContent())?.includes('Jumps')) {
    if (await visible(page, 'Start')) {
      await page.getByRole('button', { name: 'Start', exact: true }).click()
      await page.clock.runFor(2 * 60_000)
      await page.getByRole('button', { name: 'Finish' }).click()
    } else {
      await page.getByRole('button', { name: /Set done|Done/ }).click()
    }
  }

  // A0: 4 × 3 jumps, 60 s rest after each set, then feedback.
  for (let set = 1; set <= 4; set++) {
    await expect(page.getByTestId('set-count')).toContainText(`Set ${set} of 4`)
    await page.getByRole('button', { name: 'Set done' }).click()
    if (set < 4) {
      await expect(page.getByTestId('rest')).toBeVisible()
      await page.clock.runFor(61_000) // the rest timer ends by itself
      await expect(page.getByTestId('rest')).toHaveCount(0)
    }
  }
  await page.getByRole('button', { name: 'Right', exact: true }).click()

  // A1 + A2: alternate, and rest only after the pair.
  await expect(page.getByTestId('unit-title')).toHaveText('Squat · L1 + Push · L1')
  await page.getByRole('button', { name: 'More reps' }).click()
  await page.getByRole('button', { name: 'Set done' }).click()
  await expect(page.getByTestId('rest')).toHaveCount(0)
  await page.getByRole('button', { name: 'Set done' }).click()
  await expect(page.getByTestId('rest')).toBeVisible()
  // Locked in a pocket, taps do nothing until a long press; the rest timer keeps running underneath.
  await page.getByRole('button', { name: 'Pocket lock' }).click()
  await expect(page.getByTestId('pocket-lock')).toBeVisible()
  await page.clock.runFor(76_000)
  await expect(page.getByTestId('rest')).toHaveCount(0)
  const unlock = page.getByRole('button', { name: 'Hold to unlock' })
  await unlock.hover()
  await page.mouse.down()
  await page.clock.runFor(1_600)
  await page.mouse.up()
  await expect(page.getByTestId('pocket-lock')).toHaveCount(0)

  await playToSummary(page)
  await expect(page.getByTestId('summary-sets')).not.toHaveText('0')
  await page.getByRole('button', { name: '6', exact: true }).click()
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByTestId('card-main')).toBeVisible()
  await expect(page.getByTestId('card-main').getByLabel('done')).toBeVisible()
  await expect(page.getByTestId('day-ring')).toHaveText('1/2')
  // The sets went into the logs, where the level-up suggestions read them.
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
  await expect(page.getByRole('button', { name: 'Right', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Right', exact: true }).click()
  await playToSummary(page)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByTestId('card-main').getByLabel('done')).toBeVisible()
})
