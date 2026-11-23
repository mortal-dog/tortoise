import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Player } from '@/components/player/Player'
import { Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { dayTemplate } from '@/lib/calendar'
import { isLocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { sessionOf, splitKind } from '@/lib/plan-view'
import { buildUnits } from '@/lib/player'
import type { Variant } from '@/lib/records'
import { getLevels, getOverride, type Slot } from '@/lib/repo'
import { planDayOf, useSettings } from '@/lib/use-app'

export const Route = createFileRoute('/play/$date/$slot')({
  validateSearch: (s: Record<string, unknown>): { v?: Variant } =>
    s.v === 'indoor' || s.v === 'outdoor' ? { v: s.v } : {},
  component: Play,
})

const SLOTS: readonly Slot[] = ['morning', 'main', 'split']

function Play() {
  const { date, slot } = Route.useParams()
  const { v } = Route.useSearch()
  const settings = useSettings()
  const startDate = settings?.startDate
  const pd = startDate && isLocalDate(date) ? planDayOf(startDate, date) : null
  // Boxed, so 'loading' (undefined) differs from 'no swaps this week'.
  const overrideBox = useLive(
    async () => ({ o: pd ? await getOverride(pd.monday) : undefined }),
    [pd?.monday],
  )
  const override = overrideBox?.o
  const levels = useLive(getLevels, [])
  const tmpl = pd ? dayTemplate(pd, plan.week, override?.swaps ?? []) : null
  const validSlot = (SLOTS as readonly string[]).includes(slot) ? (slot as Slot) : null
  const sessionId =
    tmpl && validSlot && !(validSlot === 'main' && tmpl.testDay)
      ? validSlot === 'morning'
        ? tmpl.morning
        : validSlot === 'main'
          ? tmpl.main
          : tmpl.split
      : null
  const session = sessionId ? sessionOf(sessionId) : null
  const variant: Variant | undefined = session?.hasVariants ? (v ?? 'outdoor') : undefined
  const ready = !!(settings && levels && pd && overrideBox)

  // Built once the data is in, so a change elsewhere never reshuffles a session that is running.
  // biome-ignore lint/correctness/useExhaustiveDependencies: frozen on purpose once ready
  const units = useMemo(
    () =>
      ready && session && pd && levels
        ? buildUnits({ session, variant: variant ?? 'outdoor', day: pd, levels, rules: plan.blockRules })
        : null,
    [ready, session?.id, variant],
  )

  if (!settings || !levels) return <Screen title="Session">{null}</Screen>
  if (!session || !units || !pd || !validSlot) {
    return (
      <Screen title="Session">
        <p>There is no session to play here.</p>
        <Link to="/" className="mt-3 inline-block font-semibold text-primary underline">
          Back to Today
        </Link>
      </Screen>
    )
  }

  const kind =
    validSlot === 'split'
      ? splitKind(session.id)
      : validSlot === 'main' && !tmpl?.split
        ? ('long' as const)
        : undefined
  return (
    <Player
      date={date}
      slot={validSlot}
      sessionId={session.id}
      title={session.name}
      units={units}
      variant={variant}
      splitKind={kind}
      asksDistance={
        validSlot === 'main' && (session.kind === 'run' || session.kind === 'long') && variant === 'outdoor'
      }
    />
  )
}
