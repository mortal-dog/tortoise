import { useMovingBackdrop } from '@/lib/effects'

/**
 * The backdrop behind every screen (D-048): soft colour fields that drift over minutes, seen through the glass
 * panels. Still when the system asks for reduced motion. The raindrops are gone (D-053).
 */
export function Backdrop() {
  const moving = useMovingBackdrop()
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      data-still={moving ? undefined : ''}
      data-testid="backdrop"
    >
      <div className="backdrop-glow backdrop-glow-moss" />
      <div className="backdrop-glow backdrop-glow-sky" />
      <div className="backdrop-glow backdrop-glow-amber" />
      <div className="backdrop-glow backdrop-glow-light" />
    </div>
  )
}
