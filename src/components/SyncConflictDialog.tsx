import { CloudDownload, Smartphone } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inputClass } from '@/components/settings/fields'
import { Button } from '@/components/ui'
import { losesMore, type StateSummary } from '@/lib/backup'
import { formatLong } from '@/lib/dates'
import {
  type Choice,
  type Conflict,
  driveSignOut,
  resolveConflict,
  SYNC_CONTROLS,
  useDriveSync,
} from '@/lib/sync/sync'

export const REPLACE_WORD = 'REPLACE'

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`

const SIDE_NAME: Record<Choice, string> = { local: 'This device', remote: 'Google Drive' }

/**
 * The first sync after signing in found progress on both sides, on different plans (D-071). The owner: "let the user
 * choose whether the local state overwrites the remote Drive state or the remote state overwrites the local one, and
 * ask again and again for confirmation if the state being overwritten is older or larger." Shown over every screen
 * until the user chooses or signs out; the sync waits meanwhile.
 */
export function SyncConflictDialog() {
  const s = useDriveSync()
  if (s.status !== 'conflict' || !s.conflict) return null
  return <ConflictDialog conflict={s.conflict} />
}

export function ConflictDialog({
  conflict,
  onChoose = (c) => resolveConflict(c),
  onSignOut = () => driveSignOut(),
}: {
  conflict: Conflict
  onChoose?: (choice: Choice) => Promise<void>
  onSignOut?: () => Promise<void>
}) {
  const titleId = useId()
  const firstRef = useRef<HTMLButtonElement>(null)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: focus moves to each step's first button
  useEffect(() => {
    firstRef.current?.focus()
  }, [choice])

  useEffect(() => {
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
    }
  }, [])

  const { local, remote } = conflict
  const kept = choice === 'local' ? local : remote
  const lost = choice === 'local' ? remote : local
  const lostName = choice === 'local' ? SIDE_NAME.remote : SIDE_NAME.local
  const strict = choice !== null && losesMore(lost, kept)
  const more: Choice | null =
    local.activeDays === remote.activeDays ? null : local.activeDays > remote.activeDays ? 'local' : 'remote'

  const act = async (f: () => Promise<void>) => {
    setBusy(true)
    try {
      await f()
    } finally {
      setBusy(false)
    }
  }

  // In a portal: a glass card's backdrop filter would hold a fixed child inside the card (D-048).
  return createPortal(
    <div className={`${SYNC_CONTROLS} badge-scrim fixed inset-0 z-50 flex items-center justify-center p-5`}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-testid="sync-conflict"
        className="badge-pop max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-edge bg-surface p-5 text-text shadow-2xl"
      >
        {choice === null ? (
          <>
            <h2 id={titleId} className="font-bold text-lg text-primary">
              Which progress do you keep?
            </h2>
            <p className="mt-1 text-sm">
              This device and Google Drive hold different plans, so they cannot be joined. One replaces the
              other.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Side title={SIDE_NAME.remote} icon="remote" s={remote} more={more === 'remote'} />
              <Side title={SIDE_NAME.local} icon="local" s={local} more={more === 'local'} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button ref={firstRef} disabled={busy} onClick={() => setChoice('remote')}>
                Use Google Drive's
              </Button>
              <Button variant="quiet" disabled={busy} onClick={() => setChoice('local')}>
                Keep this device's
              </Button>
              <Button variant="quiet" disabled={busy} onClick={() => void act(onSignOut)}>
                Sign out of Google instead
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 id={titleId} className="font-bold text-lg text-brick">
              {choice === 'local'
                ? "Replace Google Drive's copy with this device's?"
                : "Replace this device's records with Google Drive's?"}
            </h2>
            <p className="mt-2 text-sm">
              {lostName} loses {loss(lost)}. It cannot be undone.
              {choice === 'local' &&
                ' Other devices signed in to this Google account will ask this question again.'}
            </p>
            {strict && (
              <>
                <p className="mt-2 text-sm font-semibold text-brick" data-testid="loses-more">
                  {lostName} holds more or older progress than the side you keep.
                </p>
                <label className="mt-2 block text-sm">
                  Type {REPLACE_WORD} to confirm
                  <input
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoCapitalize="characters"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className={inputClass}
                  />
                </label>
              </>
            )}
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="danger"
                disabled={busy || (strict && typed !== REPLACE_WORD)}
                onClick={() => void act(() => onChoose(choice))}
              >
                Replace {lostName === SIDE_NAME.local ? "this device's" : "Google Drive's"}
              </Button>
              <Button
                ref={firstRef}
                variant="quiet"
                disabled={busy}
                onClick={() => {
                  setChoice(null)
                  setTyped('')
                }}
              >
                Back
              </Button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  )
}

/** "12 days done (Mon 2 Nov 2026 to Fri 20 Nov 2026), 3 badges and its plan from Mon 2 Nov 2026". */
function loss(s: StateSummary): string {
  const parts = [
    `${plural(s.activeDays, 'day')} done${s.firstDay && s.lastDay ? ` (${formatLong(s.firstDay)} to ${formatLong(s.lastDay)})` : ''}`,
    plural(s.badges, 'badge'),
  ]
  return `${parts.join(', ')} and its plan${s.startDate ? ` from ${formatLong(s.startDate)}` : ''}`
}

function Side({ title, icon, s, more }: { title: string; icon: Choice; s: StateSummary; more: boolean }) {
  const Icon = icon === 'local' ? Smartphone : CloudDownload
  return (
    <section className="rounded-2xl border border-edge bg-field p-3" aria-label={title}>
      <h3 className="flex items-center gap-1.5 font-semibold text-primary">
        <Icon aria-hidden className="size-4" /> {title}
        {more && (
          <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-on-primary text-xs">More</span>
        )}
      </h3>
      <ul className="mt-1 space-y-0.5 text-sm">
        <li>Week 1: {s.startDate ? formatLong(s.startDate) : 'no plan'}</li>
        <li>{plural(s.activeDays, 'day')} done</li>
        {s.firstDay && s.lastDay && (
          <li>
            {formatLong(s.firstDay)} to {formatLong(s.lastDay)}
          </li>
        )}
        <li>{plural(s.badges, 'badge')}</li>
      </ul>
    </section>
  )
}
