import { CirclePlay, ExternalLink, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

/** The YouTube id of a watch link, or undefined. */
export function videoId(url: string): string | undefined {
  return /[?&]v=([\w-]{11})/.exec(url)?.[1]
}

/**
 * YouTube's privacy-enhanced player for a video (D-060). It is loaded only when the person taps a name; nothing from
 * YouTube is requested before. `playsinline` keeps it in the page on an iPhone.
 */
export function embedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}?playsinline=1&rel=0`
}

/**
 * An exercise's name; a tap plays its teaching video inside the app (D-060), with a link to open it on YouTube as a
 * fallback. Without a video (the everyday movements, D-056) the name stands alone.
 */
export function ExerciseLink({ name, url, className }: { name: string; url?: string; className?: string }) {
  const [open, setOpen] = useState(false)
  const id = url ? videoId(url) : undefined
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])
  if (!url || !id) return <span className={className}>{name}</span>
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1 text-left font-semibold text-primary underline',
          className,
        )}
      >
        <CirclePlay aria-hidden className="size-4 shrink-0" />
        {name}
      </button>
      {/* In a portal: a glass card's backdrop filter would hold a fixed child inside the card (D-048). */}
      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex flex-col bg-background p-4 pt-[calc(env(safe-area-inset-top)+1rem)]"
            role="dialog"
            aria-modal="true"
            aria-label={`Video: ${name}`}
            data-testid="video-sheet"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-lg text-primary">{name}</p>
              <button
                type="button"
                aria-label="Close the video"
                onClick={() => setOpen(false)}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-edge bg-field text-primary"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <div className="mt-3 aspect-video w-full overflow-hidden rounded-xl border border-edge bg-black">
              <iframe
                src={embedUrl(id)}
                title={`Video: ${name}`}
                className="size-full"
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 self-start font-semibold text-primary text-sm underline"
            >
              <ExternalLink aria-hidden className="size-4" /> Open in YouTube
            </a>
          </div>,
          document.body,
        )}
    </>
  )
}
