import { createFileRoute, Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { Card, Screen } from '@/components/ui'
import { citedBy, sourceOf } from '@/lib/library'

export const Route = createFileRoute('/library/sources/$sourceId')({
  component: SourcePage,
})

/** A source: its citation, the finding as read in its raw text (docs/sources.md), its link, and what cites it. */
function SourcePage() {
  const { sourceId } = Route.useParams()
  const source = sourceOf(sourceId)
  if (!source) {
    return (
      <Screen title="Source" action={<BackLink />}>
        <p>This source is not in the plan.</p>
      </Screen>
    )
  }
  const { exercises, ladders } = citedBy(source.id)
  return (
    <Screen title={source.id} action={<BackLink />}>
      <div className="space-y-4">
        <Card>
          <h2 className="text-sm font-semibold text-primary">Source</h2>
          <p className="mb-3">{source.citation}</p>
          <h2 className="text-sm font-semibold text-primary">Finding</h2>
          <p className="mb-3">{source.finding}</p>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-sky px-3 text-sm font-semibold text-sky"
          >
            Read the source <ExternalLink aria-hidden className="size-4" />
          </a>
          <p className="mt-2 text-sm text-primary-strong">Opens outside the app and needs the network.</p>
        </Card>
        {(exercises.length > 0 || ladders.length > 0) && (
          <Card>
            <h2 className="mb-2 font-semibold text-primary">Cited by</h2>
            <ul className="space-y-1">
              {exercises.map((e) => (
                <li key={e.id}>
                  <Link
                    to="/library/$exerciseId"
                    params={{ exerciseId: e.id }}
                    className="inline-flex min-h-11 items-center font-semibold text-primary underline"
                  >
                    {e.name}
                  </Link>
                </li>
              ))}
              {ladders.map((l) => (
                <li key={l.id} className="flex min-h-11 items-center">
                  The {l.name.toLowerCase()} ladder (plan §{l.section})
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </Screen>
  )
}

function BackLink() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <Link
      to="/library"
      onClick={(ev) => {
        if (!canGoBack) return
        ev.preventDefault()
        router.history.back()
      }}
      aria-label="Back"
      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-3 text-sm font-semibold text-primary"
    >
      <ChevronLeft aria-hidden className="size-4" /> Back
    </Link>
  )
}
