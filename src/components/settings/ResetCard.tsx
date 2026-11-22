import { useState } from 'react'
import { Button, Card } from '../ui'
import { inputClass, SectionTitle } from './fields'

export const CONFIRM_WORD = 'DELETE'

/** Settings → Reset (design §3.7): deletes all data once DELETE is typed. */
export function ResetCard({ onReset }: { onReset: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Card className="border-brick">
      <SectionTitle>Reset</SectionTitle>
      {!open ? (
        <>
          <p className="mt-1 text-sm">
            Delete every record on this phone and start again from the first run.
          </p>
          <Button variant="danger" className="mt-3" onClick={() => setOpen(true)}>
            Delete all data
          </Button>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm font-semibold text-brick">
            This deletes every day, log, level, test, milestone and setting on this phone. It cannot be
            undone; only a backup file brings them back.
          </p>
          <label className="mt-2 block text-sm">
            Type {CONFIRM_WORD} to confirm
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
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="danger"
              disabled={typed !== CONFIRM_WORD || busy}
              onClick={async () => {
                setBusy(true)
                try {
                  await onReset()
                } finally {
                  setBusy(false)
                  setOpen(false)
                  setTyped('')
                }
              }}
            >
              Delete everything
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                setOpen(false)
                setTyped('')
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}
