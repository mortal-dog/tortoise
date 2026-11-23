import { CloudUpload, LogIn, LogOut, RotateCcw } from 'lucide-react'
import { formatLong, localDateOf } from '@/lib/dates'
import { driveSignOut, syncNow, useDriveSync } from '@/lib/sync/sync'
import { Button, Card } from '../ui'
import { SectionTitle } from './fields'

function when(ms: number): string {
  const d = new Date(ms)
  return `${formatLong(localDateOf(d))}, ${d.toTimeString().slice(0, 5)}`
}

/**
 * Settings → Google Drive (D-054): sign in once; the app then backs up by itself while Google's sign-in lasts, and
 * "Sync now" renews it with a tap. Signing in on a new phone restores the Drive copy.
 */
export function DriveCard() {
  const s = useDriveSync()
  const busy = s.status === 'syncing'
  const signedIn = s.status !== 'signed-out'
  return (
    <Card id="drive">
      <SectionTitle>Google Drive backup</SectionTitle>
      <p className="mt-1 text-sm" data-testid="drive-status">
        {!signedIn
          ? 'Off. Sign in with Google and the app keeps a copy in a hidden folder of your Google Drive that only this app can see. Signing in on a new phone brings everything back.'
          : `Signed in${s.email ? ` as ${s.email}` : ''}. ${
              s.lastSync ? `Last backup: ${when(s.lastSync)}.` : 'No backup yet.'
            } ${
              s.status === 'needs-tap'
                ? "Google's sign-in lasts an hour; tap Sync now to back up again."
                : 'It backs up by itself after each change while the sign-in lasts.'
            }`}
      </p>
      {busy && <p className="mt-2 text-sm text-primary">Syncing…</p>}
      {s.error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-brick">
          {s.error}
        </p>
      )}
      {s.restored && <p className="mt-2 text-sm text-primary">{s.restored}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {!signedIn ? (
          <Button disabled={busy} onClick={() => void syncNow({ fromTap: true, restore: true })}>
            <LogIn aria-hidden className="size-4" /> Sign in with Google
          </Button>
        ) : (
          <>
            <Button disabled={busy} onClick={() => void syncNow({ fromTap: true })}>
              <CloudUpload aria-hidden className="size-4" /> Sync now
            </Button>
            <Button
              variant="quiet"
              disabled={busy}
              onClick={() => void syncNow({ fromTap: true, restore: true })}
            >
              <RotateCcw aria-hidden className="size-4" /> Restore from Google Drive
            </Button>
            <Button variant="quiet" disabled={busy} onClick={() => void driveSignOut()}>
              <LogOut aria-hidden className="size-4" /> Sign out
            </Button>
          </>
        )}
      </div>
      <p className="mt-3 text-sm">
        Restore merges: for each record the newer copy wins. If Google's window says "origin_mismatch", the
        app's address is not yet registered with Google: in the Google Cloud console, add
        https://tortoise.doctornova.net to the Web client's authorised JavaScript origins.
      </p>
    </Card>
  )
}
