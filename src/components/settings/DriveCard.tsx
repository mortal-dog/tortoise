import { LogIn, LogOut, RefreshCw } from 'lucide-react'
import { formatLong, localDateOf } from '@/lib/dates'
import { driveSignOut, SYNC_CONTROLS, syncNow, useDriveSync } from '@/lib/sync/sync'
import { Button, Card } from '../ui'
import { SectionTitle } from './fields'

function when(ms: number): string {
  const d = new Date(ms)
  return `${formatLong(localDateOf(d))}, ${d.toTimeString().slice(0, 5)}`
}

/**
 * Settings → Google Drive sync (D-054, D-055): the last sync's date and time, and nothing else to read (the owner:
 * "you can just show last sync date time"). The sync runs by itself; "Sync now" runs it at once.
 */
export function DriveCard() {
  const s = useDriveSync()
  const busy = s.status === 'syncing'
  const signedIn = s.status !== 'signed-out'
  return (
    <Card id="drive">
      <SectionTitle>Google Drive sync</SectionTitle>
      {signedIn && (
        <p className="mt-1 text-sm" data-testid="last-sync">
          Last sync: {s.lastSync ? when(s.lastSync) : 'not yet'}
        </p>
      )}
      {s.error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-brick">
          {s.error}
        </p>
      )}
      <div className={`${SYNC_CONTROLS} mt-3 flex flex-wrap gap-2`}>
        {!signedIn ? (
          <Button disabled={busy} onClick={() => void syncNow({ fromTap: true })}>
            <LogIn aria-hidden className="size-4" /> Sign in with Google
          </Button>
        ) : (
          <>
            <Button disabled={busy} onClick={() => void syncNow({ fromTap: true })}>
              <RefreshCw aria-hidden className={busy ? 'size-4 motion-safe:animate-spin' : 'size-4'} />{' '}
              {busy ? 'Syncing…' : 'Sync now'}
            </Button>
            <Button variant="quiet" disabled={busy} onClick={() => void driveSignOut()}>
              <LogOut aria-hidden className="size-4" /> Sign out
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}
