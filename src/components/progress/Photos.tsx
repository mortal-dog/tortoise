import { Camera, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card } from '@/components/ui'
import { formatShort, type LocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { addPhoto, deletePhoto, getPhotos, shrinkPhoto } from '@/lib/photos'
import type { PhotoRecord } from '@/lib/records'

/** Progress photos (Phase 9): kept only on this phone and in its backups. */
export function Photos({ today }: { today: LocalDate }) {
  const photos = useLive(getPhotos, [])
  const [open, setOpen] = useState<PhotoRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  return (
    <Card>
      <p className="text-sm">
        A photo now and then shows the posture change that numbers miss. They stay on this phone and in its
        backups.
      </p>
      <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-primary px-4 text-sm font-semibold text-primary">
        <Camera aria-hidden className="size-4" />
        {busy ? 'Adding…' : 'Add a photo'}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          data-testid="photo-input"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (!file) return
            setBusy(true)
            setError(null)
            try {
              await addPhoto(today, await shrinkPhoto(file))
            } catch {
              setError('This photo could not be read. Try another one.')
            } finally {
              setBusy(false)
            }
          }}
        />
      </label>
      {error && (
        <p role="alert" className="mt-2 text-sm text-brick">
          {error}
        </p>
      )}
      {photos && photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-3 gap-2" data-testid="photos">
          {photos.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="block w-full"
                aria-label={`Photo of ${formatShort(p.date)}`}
              >
                <img
                  src={p.dataUrl}
                  alt=""
                  className="aspect-[3/4] w-full rounded-xl border border-line object-cover"
                />
                <span className="mt-1 block text-xs">{formatShort(p.date)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {/* In a portal: a glass card's backdrop filter would hold a fixed child inside the card (D-048). */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-background p-4 pt-[calc(env(safe-area-inset-top)+1rem)]"
            role="dialog"
            aria-label={`Photo of ${formatShort(open.date)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold">
                {formatShort(open.date)} {open.date.slice(0, 4)}
              </p>
              <button
                type="button"
                aria-label="Close the photo"
                onClick={() => setOpen(null)}
                className="flex size-11 items-center justify-center rounded-xl border border-edge bg-field text-primary"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <img
              src={open.dataUrl}
              alt={`Progress on ${formatShort(open.date)}`}
              className="mt-3 min-h-0 flex-1 object-contain"
            />
            <Button
              variant="danger"
              className="mt-3"
              onClick={async () => {
                if (!window.confirm('Delete this photo? It cannot be undone, except from a backup.')) return
                await deletePhoto(open.id)
                setOpen(null)
              }}
            >
              <Trash2 aria-hidden className="size-4" /> Delete
            </Button>
          </div>,
          document.body,
        )}
    </Card>
  )
}
