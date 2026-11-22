import { createFileRoute } from '@tanstack/react-router'
import { Screen } from '@/components/ui'
import { longestStreak } from '@/lib/status'
import { useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/progress')({
  component: Progress,
})

/** The Shell honeycomb, test trends, milestones and the At-99 board come in Phase 6; the streak numbers are here now. */
function Progress() {
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const longest = history ? longestStreak(history.statusOf, t, history.week0) : 0
  return (
    <Screen title="Progress">
      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-line bg-surface p-4">
          <dt className="text-sm text-primary-strong">Tortoise streak</dt>
          <dd className="text-3xl font-semibold text-shell">{history?.streak ?? 0}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <dt className="text-sm text-primary-strong">Longest streak</dt>
          <dd className="text-3xl font-semibold text-primary">{longest}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm">
        The Shell calendar, test trends, milestones and the At-99 board arrive with the Tortoise Test.
      </p>
    </Screen>
  )
}
