import { createFileRoute } from '@tanstack/react-router'
import { Screen } from '@/components/ui'
import { plan } from '@/data/plan'

export const Route = createFileRoute('/library')({
  component: Library,
})

/** A plain list for now; search, filters and exercise pages come in Phase 5. */
function Library() {
  return (
    <Screen title="Library">
      <ul className="space-y-2">
        {plan.exercises.map((e) => (
          <li key={e.id} className="rounded-2xl border border-line bg-surface p-3">
            <p className="font-semibold">{e.name}</p>
            <p className="text-sm">{e.how}</p>
          </li>
        ))}
      </ul>
    </Screen>
  )
}
