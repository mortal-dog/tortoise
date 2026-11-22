import { readFile } from 'node:fs/promises'
import { expect, type Page, test } from '@playwright/test'

// Phase 7: settings, backup and reminders. Greenwich's zone and invented values: neutral example data.
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
      results: { pushups: 14, hangS: 30 },
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

/** Hides the share sheet, so files go out by the download fallback. */
async function noShareSheet(page: Page) {
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true })
    Object.defineProperty(Navigator.prototype, 'canShare', { value: undefined, configurable: true })
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

test('export → wipe → import gives identical data', async ({ page }) => {
  await noShareSheet(page)
  await startPlan(page)
  await page
    .getByTestId('card-morning')
    .getByRole('button', { name: /Done as planned/ })
    .click()
  await page.getByLabel('Steps').fill('8000')
  await page.getByLabel('Steps').blur()
  await seedRecords(page)

  await openSettings(page)
  await page.getByLabel('Dumbbell weight, each (kg)').fill('12')
  await page.getByLabel('Birth year').fill('1970')
  await page.getByLabel('Birth year').blur()
  await page.getByLabel('Morning block, every day').fill('06:45')
  await expect(page.getByTestId('reminder-lines')).toContainText('Every day at 06:45: Morning block')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Back up now' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('tortoise-backup-2026-11-23.json')
  await expect(page.getByText('Backup file saved to the downloads.')).toBeVisible()
  await expect(page.getByTestId('last-backup')).toContainText('Last backup: Mon 23 Nov 2026.')
  const text = await readFile(await download.path(), 'utf8')
  const before = await dump(page)
  for (const name of ['days', 'logs', 'levels', 'tests', 'milestones', 'overrides', 'settings', 'meta']) {
    expect(before[name]?.length, name).toBeGreaterThan(0)
  }

  // Reset: everything goes, and the app is back at its first run.
  await page.getByRole('button', { name: 'Delete all data' }).click()
  await page.getByLabel('Type DELETE to confirm').fill('DELETE')
  await page.getByRole('button', { name: 'Delete everything' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to Tortoise' })).toBeVisible()
  const wiped = await dump(page)
  expect(wiped.days).toEqual([])
  expect(wiped.settings).toEqual([])
  expect(wiped.logs).toEqual([])

  // Import: the preview, then Replace.
  await openSettings(page)
  await page.getByLabel('Backup file to import').setInputFiles({
    name: download.suggestedFilename(),
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  })
  const preview = page.getByTestId('import-preview')
  await expect(preview).toContainText('Backup of Mon 23 Nov 2026')
  await expect(preview).toContainText(
    '1 day, 1 exercise log, 1 ladder level, 1 test, 1 week with swaps, 1 milestone',
  )
  await expect(preview).toContainText('From Mon 23 Nov 2026 to Sat 28 Nov 2026.')
  await preview.getByRole('button', { name: 'Replace' }).click()
  await expect(page.getByText(/^Replaced:/)).toBeVisible()
  expect(await dump(page)).toEqual(before)

  // Merging the same file again changes nothing.
  await page.getByLabel('Backup file to import').setInputFiles({
    name: 'again.json',
    mimeType: 'application/json',
    buffer: Buffer.from(text),
  })
  await page.getByTestId('import-preview').getByRole('button', { name: 'Merge' }).click()
  await expect(page.getByText(/^Merged: 0 records taken from the backup/)).toBeVisible()
  expect(await dump(page)).toEqual(before)

  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByTestId('day-ring')).toHaveText('1/2')
})

test('a malformed file is refused with a clear message, and nothing changes', async ({ page }) => {
  await startPlan(page)
  await openSettings(page)
  const before = await dump(page)
  const input = page.getByLabel('Backup file to import')

  await input.setInputFiles({
    name: 'notes.json',
    mimeType: 'application/json',
    buffer: Buffer.from('not json {'),
  })
  await expect(page.getByRole('alert')).toHaveText(
    'This file is not a Tortoise backup: it is not readable JSON.',
  )

  await input.setInputFiles({
    name: 'other.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ hello: 'world' })),
  })
  await expect(page.getByRole('alert')).toHaveText('This file is not a Tortoise backup.')

  const damaged = {
    format: 'tortoise-backup',
    version: 1,
    exportedAt: '2026-11-23T09:00:00.000Z',
    appVersion: '0.1.0',
    schemaVersion: 1,
    stores: {
      settings: [],
      days: [{ date: 'yesterday', updatedAt: '2026-11-23T09:00:00.000Z' }],
      logs: [],
      levels: [],
      tests: [],
      overrides: [],
      milestones: [],
      meta: [],
    },
  }
  await input.setInputFiles({
    name: 'damaged.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(damaged)),
  })
  await expect(page.getByRole('alert')).toContainText(
    'This backup is damaged, so nothing was imported (days › record 1 › date',
  )
  await expect(page.getByTestId('import-preview')).toHaveCount(0)

  await input.setInputFiles({
    name: 'future.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...damaged, version: 2 })),
  })
  await expect(page.getByRole('alert')).toHaveText(
    'This backup comes from a newer version of Tortoise. Update the app, then import it again.',
  )
  expect(await dump(page)).toEqual(before)
})

test('the backup goes through the share sheet when it takes files', async ({ page }) => {
  await page.addInitScript(() => {
    const shared: Array<{ name: string; type: string; size: number }> = []
    ;(window as unknown as { __shared: typeof shared }).__shared = shared
    Object.defineProperty(Navigator.prototype, 'canShare', {
      value: (data: { files?: File[] }) => !!data.files?.length,
      configurable: true,
    })
    Object.defineProperty(Navigator.prototype, 'share', {
      value: async (data: { files: File[] }) => {
        for (const f of data.files) shared.push({ name: f.name, type: f.type, size: f.size })
      },
      configurable: true,
    })
  })
  await startPlan(page)
  await openSettings(page)
  await page.getByRole('button', { name: 'Back up now' }).click()
  await expect(page.getByText('Backup shared.')).toBeVisible()
  const shared = await page.evaluate(() => (window as unknown as { __shared: unknown[] }).__shared)
  expect(shared).toEqual([
    { name: 'tortoise-backup-2026-11-23.json', type: 'application/json', size: expect.any(Number) },
  ])
  await expect(page.getByTestId('last-backup')).toContainText('Last backup: Mon 23 Nov 2026.')
})

test('the reminders become a calendar file, and the backup reminder shows on Today', async ({ page }) => {
  await noShareSheet(page)
  await startPlan(page)
  await openSettings(page)
  await page.getByLabel('Morning block, every day').fill('06:45')
  await page.getByLabel('Mon: Strength A').fill('12:15')
  await expect(page.getByTestId('reminder-lines')).toHaveText(
    /Every day at 06:45: Morning block\s*Mon at 12:15: Strength A/,
  )

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Add to Calendar' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('tortoise-reminders.ics')
  const ics = await readFile(await download.path(), 'utf8')
  expect(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n')).toBe(true)
  expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true)
  expect(ics.replace(/\r\n/g, '')).not.toMatch(/[\r\n]/)
  expect(ics).toContain('DTSTART:20261123T064500\r\n')
  expect(ics).toContain('DTSTART:20261123T121500\r\n')
  expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO\r\n')
  expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(2)

  // No backup by Week 0's thirtieth day: the reminder shows on Today, and a backup clears it.
  await page.clock.setFixedTime(new Date('2026-12-23T09:00:00Z'))
  await page.goto('/')
  await expect(page.getByTestId('backup-reminder')).toHaveText(/^No backup yet\./)
  await page.getByRole('link', { name: 'Back up now' }).click()
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Back up now' }).click(),
  ])
  await expect(page.getByTestId('last-backup')).toContainText('Last backup: Wed 23 Dec 2026.')
  await page.getByRole('link', { name: 'Today', exact: true }).click()
  await expect(page.getByTestId('today-label')).toBeVisible()
  await expect(page.getByTestId('backup-reminder')).toHaveCount(0)
})

for (const scheme of ['light', 'dark'] as const) {
  test(`settings screens in the ${scheme} theme`, async ({ page }, info) => {
    await noShareSheet(page)
    await page.emulateMedia({ colorScheme: scheme })
    await startPlan(page)
    await page.clock.setFixedTime(new Date('2026-12-23T09:00:00Z'))
    await page.goto('/')
    await expect(page.getByTestId('backup-reminder')).toBeVisible()
    await page.screenshot({ path: info.outputPath(`${scheme}-1-today-backup-reminder.png`) })

    await openSettings(page)
    await page.getByLabel('Morning block, every day').fill('06:45')
    await page.getByLabel('Tue: Easy run').fill('12:15')
    await page.getByLabel('Birth year').fill('20')
    await page.getByLabel('Birth year').blur()
    await page.screenshot({ path: info.outputPath(`${scheme}-2-settings.png`), fullPage: true })
    await page.locator('#reminders').screenshot({ path: info.outputPath(`${scheme}-2b-reminders.png`) })

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Back up now' }).click(),
    ])
    await page.getByLabel('Backup file to import').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(await readFile(await download.path(), 'utf8')),
    })
    await page.getByRole('button', { name: 'Delete all data' }).click()
    await page.getByLabel('Type DELETE to confirm').fill('DEL')
    await page.getByTestId('import-preview').scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`${scheme}-3-backup.png`) })
    await page.getByRole('button', { name: 'Delete everything' }).scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`${scheme}-4-reset.png`) })
  })
}
