import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { backupDue } from '@/lib/backup'
import type { LocalDate } from '@/lib/dates'
import type { SettingsRecord } from '@/lib/records'
import { Banner, Button } from './ui'

/** The backup reminder on Today (design §10): shown when the last backup is older than the interval. */
export function BackupReminder({ settings, t }: { settings: SettingsRecord; t: LocalDate }) {
  const [hidden, setHidden] = useState(false)
  const { due, daysSince } = backupDue(settings, t)
  if (!due || hidden) return null
  return (
    <Banner tone="shell">
      <p className="font-semibold" data-testid="backup-reminder">
        {daysSince === null ? 'No backup yet.' : `Last backup ${daysSince} days ago.`} The data lives only on
        this phone.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <Link
          to="/settings"
          hash="backup"
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
