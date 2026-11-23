import { CirclePlay } from 'lucide-react'
import { cn } from '@/lib/cn'

/**
 * An exercise's name, opening its teaching video on YouTube (D-056). A link, never an embed: nothing is fetched until
 * the person taps it. Without a video (a ladder step with no exercise) the name stands alone.
 */
export function ExerciseLink({ name, url, className }: { name: string; url?: string; className?: string }) {
  if (!url) return <span className={className}>{name}</span>
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 font-semibold text-primary underline', className)}
    >
      <CirclePlay aria-hidden className="size-4 shrink-0" />
      {name}
    </a>
  )
}
