import { createFileRoute, Link } from '@tanstack/react-router'
import { useMemo } from 'react'
import { Player } from '@/components/player/Player'
import { Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { dayTemplate } from '@/lib/calendar'
import { compareDates, isLocalDate, type LocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { laddersById, sessionOf, splitKind } from '@/lib/plan-view'
import { buildUnits } from '@/lib/player'
import { checkInsDue } from '@/lib/progression'
import type { Variant } from '@/lib/records'
import { getAllLogs, getLevels, getOverride, type Slot } from '@/lib/repo'
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
  const logs = useLive(getAllLogs, [])
  const tmpl = pd ? dayTemplate(pd, plan.week, override?.swaps ?? []) : null
  const validSlot = (SLOTS as readonly string[]).includes(slot) ? (slot as Slot) : null
  const sessionId =
    tmpl && validSlot
      ? validSlot === 'morning'
        ? tmpl.morning
        : validSlot === 'main'
          ? tmpl.main
          : tmpl.split
      : null
  const session = sessionId ? sessionOf(sessionId) : null
  const variant: Variant | undefined = session?.hasVariants ? (v ?? 'outdoor') : undefined
  const ready = !!(settings && levels && logs && pd && overrideBox)

  // Built once the data is in, so a change elsewhere never reshuffles a session that is running.
  // biome-ignore lint/correctness/useExhaustiveDependencies: frozen on purpose once ready
  const units = useMemo(
    () =>
      ready && session && pd && levels
        ? buildUnits({ session, variant: variant ?? 'outdoor', day: pd, levels, rules: plan.blockRules })
        : null,
    [ready, session?.id, variant],
  )

  // The check-ins due after this session (D-069), frozen with the units.
  // biome-ignore lint/correctness/useExhaustiveDependencies: frozen on purpose once ready
  const checkIns = useMemo(() => {
    if (!units || !levels || !logs || !startDate) return []
    const ids = [
      ...new Set(units.flatMap((u) => u.exercises.map((e) => e.ladderId)).filter((x): x is string => !!x)),
    ]
    const lastDone = new Map<string, LocalDate>()
    for (const l of logs) {
      if (!l.ladderId || compareDates(l.date, date) >= 0) continue
      const prev = lastDone.get(l.ladderId)
      if (!prev || compareDates(l.date, prev) > 0) lastDone.set(l.ladderId, l.date)
    }
    const ladders = ids.map((id) => laddersById.get(id)).filter((l) => !!l)
    return checkInsDue(ladders, levels, lastDone, date, startDate)
  }, [units])

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
      checkIns={checkIns}
      variant={variant}
      splitKind={kind}
      asksDistance={
        validSlot === 'main' && (session.kind === 'run' || session.kind === 'long') && variant === 'outdoor'
      }
    />
  )
}
