import { expect, type Page, test } from '@playwright/test'

// Phase 7: settings, and the Google Drive sync as the only backup (D-055). Greenwich's zone and invented values: neutral example data.
test.use({ timezoneId: 'Europe/London', locale: 'en-GB' })

/** Every store of the app's database, read straight from IndexedDB. */
function dump(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('tortoise')
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    const out: Record<string, unknown[]> = {}
    for (const name of [...db.objectStoreNames].sort()) {
      out[name] = await new Promise<unknown[]>((resolve, reject) => {
        const r = db.transaction(name).objectStore(name).getAll()
        r.onsuccess = () => resolve(r.result)
        r.onerror = () => reject(r.error)
      })
    }
    db.close()
    return out
  })
}

/** Writes records the screens of later phases will write (logs, levels, tests, milestones). */
function seedRecords(page: Page) {
  return page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open('tortoise')
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
    const at = '2026-11-25T10:00:00.000Z'
    const tx = db.transaction(['logs', 'levels', 'tests', 'milestones', 'overrides'], 'readwrite')
    tx.objectStore('logs').put({
      id: 'log-e2e-0001',
      date: '2026-11-23',
      sessionId: 'strength-a',
      exerciseId: 'goblet-squat',
      ladderId: 'squat',
      level: 1,
      sets: [{ reps: 10, kg: 12 }],
      feedback: 'easy',
      updatedAt: at,
    })
    tx.objectStore('levels').put({
      ladderId: 'squat',
      level: 2,
      since: '2026-11-25',
      history: [{ level: 2, date: '2026-11-25' }],
      updatedAt: at,
    })
    tx.objectStore('tests').put({
      date: '2026-11-28',
      results: { pushups: 14, jumpReachCm: 30 },
      computed: {},
      updatedAt: at,
    })
    tx.objectStore('milestones').put({ id: 'first-week', earnedAt: '2026-11-29', updatedAt: at })
    tx.objectStore('overrides').put({ monday: '2026-11-30', swaps: [['tue', 'wed']], updatedAt: at })
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  })
}

async function startPlan(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-23T09:00:00Z'))
  await page.goto('/')
  await page.getByRole('button', { name: 'Start in this browser instead' }).click()
  await page.getByRole('button', { name: 'Start the plan' }).click()
  await expect(page.getByTestId('today-label')).toContainText('Week 0')
}

async function openSettings(page: Page) {
  await page.getByRole('link', { name: 'Settings', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
}

test('Settings keeps the data only through the Google Drive sync: no backup file, no reminder', async ({
  page,
}) => {
  await startPlan(page)
  // A month on with no sign-in: Today shows no backup reminder.
  await page.clock.setFixedTime(new Date('2026-12-23T09:00:00Z'))
  await page.goto('/')
  await expect(page.getByTestId('today-label')).toBeVisible()
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0)

  await openSettings(page)
  const sync = page.locator('#drive')
  await expect(sync.getByRole('heading', { name: 'Google Drive sync' })).toBeVisible()
  await expect(sync.getByRole('button', { name: 'Sign in with Google' })).toBeVisible()
  // Signed out, the card is its title and its button: nothing else to read.
  await expect(sync.locator('p')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Backup file' })).toHaveCount(0)
  await expect(page.getByLabel('Backup file to import')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Back up now' })).toHaveCount(0)
  // About names the three things to have (D-063).
  await expect(page.getByTestId('equipment').getByRole('listitem')).toHaveText([
    'A yoga mat',
    'A jump rope',
    'One pair of fixed dumbbells, 7–15 kg each',
  ])
})

test('Delete all data empties every store and returns to the first run', async ({ page }) => {
  await startPlan(page)
  await page
    .getByTestId('card-morning')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await seedRecords(page)
  await openSettings(page)
  const before = await dump(page)
  for (const name of ['days', 'logs', 'levels', 'tests', 'milestones', 'overrides', 'settings', 'meta']) {
    expect(before[name]?.length, name).toBeGreaterThan(0)
  }
  await page.getByRole('button', { name: 'Delete all data' }).click()
  await expect(page.getByText('It cannot be undone.')).toBeVisible()
  await page.getByLabel('Type DELETE to confirm').fill('DELETE')
  await page.getByRole('button', { name: 'Delete everything' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to Tortoise' })).toBeVisible()
  const wiped = await dump(page)
  for (const name of ['days', 'logs', 'levels', 'tests', 'milestones', 'overrides', 'settings']) {
    expect(wiped[name], name).toEqual([])
  }
})

for (const scheme of ['light', 'dark'] as const) {
  test(`settings screens in the ${scheme} theme`, async ({ page }, info) => {
    await page.emulateMedia({ colorScheme: scheme })
    await startPlan(page)
    await openSettings(page)
    await page.getByLabel('Birth year').fill('20')
    await page.getByLabel('Birth year').blur()
    await page.screenshot({ path: info.outputPath(`${scheme}-1-settings.png`), fullPage: true })
    await page.locator('#drive').scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`${scheme}-2-sync.png`) })
    await page.getByRole('button', { name: 'Delete all data' }).click()
    await page.getByLabel('Type DELETE to confirm').fill('DEL')
    await page.getByRole('button', { name: 'Delete everything' }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`${scheme}-3-reset.png`) })
  })
}
