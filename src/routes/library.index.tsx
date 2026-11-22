import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { ChevronRight, CirclePlay, Search, X } from 'lucide-react'
import { Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { Area } from '@/data/schema'
import { cn } from '@/lib/cn'
import { AREAS, areaHeading, searchExercises } from '@/lib/library'

/** The search and filters live in the address, so Back from an exercise returns to the same list. */
interface LibrarySearch {
  q?: string
  area?: Area
  video?: boolean
}

export const Route = createFileRoute('/library/')({
  validateSearch: (s: Record<string, unknown>): LibrarySearch => {
    const area = Area.safeParse(s.area)
    return {
      q: typeof s.q === 'string' && s.q !== '' ? s.q : undefined,
      area: area.success ? area.data : undefined,
      video: s.video === true || s.video === 'true' ? true : undefined,
    }
  },
  component: Library,
})

const chipClass = 'inline-flex min-h-11 items-center gap-1 rounded-full border px-4 text-sm font-semibold'

function Library() {
  const { q, area, video } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const set = (patch: LibrarySearch) =>
    void navigate({ search: (prev: LibrarySearch) => ({ ...prev, ...patch }), replace: true })
  const results = searchExercises(plan.exercises, { query: q, area, video })

  return (
    <Screen title="Library">
      <search className="block space-y-3">
        <div className="relative">
          <Search aria-hidden className="pointer-events-none absolute top-3 left-3 size-5 text-primary" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            autoComplete="off"
            aria-label="Search exercises"
            placeholder="Search exercises"
            value={q ?? ''}
            onChange={(e) => set({ q: e.target.value || undefined })}
            className="block min-h-11 w-full rounded-xl border border-line bg-surface pr-11 pl-10 text-text placeholder:text-primary-strong"
          />
          {q && (
            <button
              type="button"
              aria-label="Clear the search"
              onClick={() => set({ q: undefined })}
              className="absolute top-0 right-0 flex size-11 items-center justify-center text-primary"
            >
              <X aria-hidden className="size-5" />
            </button>
          )}
        </div>
        <fieldset aria-label="Area" className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={!area}
            onClick={() => set({ area: undefined })}
            className={cn(
              chipClass,
              !area ? 'border-primary bg-primary text-on-primary' : 'border-line text-text',
            )}
          >
            All
          </button>
          {AREAS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-pressed={area === a.id}
              onClick={() => set({ area: area === a.id ? undefined : a.id })}
              className={cn(
                chipClass,
                area === a.id ? 'border-primary bg-primary text-on-primary' : 'border-line text-text',
              )}
            >
              {a.label}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={!!video}
            onClick={() => set({ video: video ? undefined : true })}
            className={cn(chipClass, video ? 'border-sky bg-sky text-on-primary' : 'border-line text-text')}
          >
            <CirclePlay aria-hidden className="size-4" /> With video
          </button>
        </fieldset>
      </search>

      <p className="mt-4 mb-2 text-sm text-primary-strong" aria-live="polite" data-testid="library-count">
        {results.length === 1 ? '1 exercise' : `${results.length} exercises`}
      </p>
      {results.length === 0 ? (
        <p>No exercise matches. Try fewer words, or another area.</p>
      ) : (
        <ul className="space-y-2" aria-label="Exercises">
          {results.map((e) => (
            <li key={e.id}>
              <Link
                to="/library/$exerciseId"
                params={{ exerciseId: e.id }}
                className="flex min-h-11 items-center gap-3 rounded-2xl border border-line bg-surface p-3"
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{e.name}</span>
                  <span className="block text-sm text-primary-strong">
                    {areaHeading(e.area)} · {e.cue}
                  </span>
                </span>
                {e.video && <CirclePlay aria-label="Has a video" className="size-5 shrink-0 text-sky" />}
                <ChevronRight aria-hidden className="size-5 shrink-0 text-primary" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  )
}
