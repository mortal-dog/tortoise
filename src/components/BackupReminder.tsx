import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { backupDue } from '@/lib/backup'
import type { LocalDate } from '@/lib/dates'
import type { SettingsRecord } from '@/lib/records'
import { useDriveSync } from '@/lib/sync/sync'
import { Banner, Button } from './ui'

/**
 * The backup reminder on Today (design §10): shown when the last backup, a file or the Google Drive copy (D-054), is
 * older than the interval.
 */
export function BackupReminder({ settings, t }: { settings: SettingsRecord; t: LocalDate }) {
  const [hidden, setHidden] = useState(false)
  const drive = useDriveSync().lastSync
  const fileAt = settings.backup.lastAt
  const lastAt = drive && (!fileAt || drive > Date.parse(fileAt)) ? new Date(drive).toISOString() : fileAt
  const { due, daysSince } = backupDue({ ...settings, backup: { ...settings.backup, lastAt } }, t)
  if (!due || hidden) return null
  return (
    <Banner tone="shell">
      <p className="font-semibold" data-testid="backup-reminder">
        {daysSince === null ? 'No backup yet.' : `Last backup ${daysSince} days ago.`} The data lives only on
        this phone until it is backed up.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to="/settings"
          hash="drive"
          className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
        >
          Back up now
        </Link>
        <Button variant="quiet" onClick={() => setHidden(true)}>
          Not today
        </Button>
      </div>
    </Banner>
  )
}
