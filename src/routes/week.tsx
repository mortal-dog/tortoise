import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeftRight, ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { StatusMark, statusLabel } from '@/components/StatusMark'
import { Banner, Button, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import type { Weekday } from '@/data/schema'
import { dayTemplate, type Swap, swapWarnings, weekWithSwaps } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { addDays, compareDates, dayName, formatShort, mondayOf } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { kindOf, sessionOf } from '@/lib/plan-view'
import { getOverride, saveSwaps } from '@/lib/repo'
import { planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/week')({
  component: Week,
})

const DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

function Week() {
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const [offset, setOffset] = useState(0)
  const [picking, setPicking] = useState<Weekday[] | null>(null)
  const monday = addDays(mondayOf(t), offset * 7)
  const override = useLive(() => getOverride(monday), [monday])

  if (!settings || !history) return <Screen title="Week">{null}</Screen>
  if (!settings.startDate) {
    return (
      <Screen title="Week">
        <p>Start the plan on the Today tab first.</p>
      </Screen>
    )
  }
  const start = settings.startDate
  const pd = planDayOf(start, monday)
  const swaps: Swap[] = override?.swaps ?? []
  const pendingSwaps: Swap[] = picking?.length === 2 ? [...swaps, [picking[0], picking[1]] as Swap] : swaps
  const week = weekWithSwaps(plan.week, pendingSwaps)
  const warnings = pd.kind === 'before' ? [] : swapWarnings(week, kindOf)
  const label =
    pd.kind === 'before'
      ? 'Before Week 0'
      : pd.kind === 'week0'
        ? 'Week 0 · learn and test'
        : `Week ${pd.week} · Block ${pd.block} · ${pd.kind === 'test' ? 'test' : pd.kind === 'light' ? 'light' : 'build'}`

  const toggle = (d: Weekday) => {
    if (!picking) return
    setPicking(
      picking.includes(d) ? picking.filter((x) => x !== d) : picking.length < 2 ? [...picking, d] : picking,
    )
  }

  return (
    <Screen
      title="Week"
      action={
        <div className="flex gap-1">
          <button
            type="button"
            aria-label="Previous week"
            onClick={() => setOffset((o) => o - 1)}
            className="flex size-11 items-center justify-center rounded-xl border border-line text-primary"
          >
            <ChevronLeft aria-hidden className="size-5" />
          </button>
          <button
            type="button"
            aria-label="Next week"
            onClick={() => setOffset((o) => o + 1)}
            className="flex size-11 items-center justify-center rounded-xl border border-line text-primary"
          >
            <ChevronRight aria-hidden className="size-5" />
          </button>
        </div>
      }
    >
      <p className="mb-3 text-sm font-semibold text-primary-strong" data-testid="week-label">
        {label} · {formatShort(monday)}
      </p>

      <ol className="space-y-2">
        {DAYS.map((wd, i) => {
          const date = addDays(monday, i)
          const dpd = planDayOf(start, date)
          const tmpl = dayTemplate(dpd, plan.week, pendingSwaps)
          const status = history.statusOf(date)
          const isToday = date === t
          const picked = picking?.includes(wd)
          const mainName = tmpl
            ? tmpl.testDay
              ? `Tortoise Test · Day ${tmpl.testDay}`
              : sessionOf(tmpl.main).name
            : '—'
          const splitName = tmpl?.split ? sessionOf(tmpl.split).name : tmpl?.testDay ? '' : 'In the session'
          const body = (
            <div className="flex items-center gap-3">
              <StatusMark status={status} size={22} />
              <div className="w-12 shrink-0">
                <p className="font-semibold">{dayName(wd)}</p>
                <p className="text-xs">{date.slice(8)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{mainName}</p>
                {splitName && <p className="truncate text-sm text-primary-strong">{splitName}</p>}
              </div>
              <span className="sr-only">{statusLabel(status)}</span>
            </div>
          )
          const rowClass = cn(
            'block w-full rounded-2xl border bg-surface p-3 text-left',
            isToday ? 'border-primary' : 'border-line',
            picked && 'border-shell ring-2 ring-shell',
          )
          return (
            <li key={wd} data-testid={`week-row-${wd}`} data-status={status}>
              {picking ? (
                <button type="button" aria-pressed={picked} onClick={() => toggle(wd)} className={rowClass}>
                  {body}
                </button>
              ) : compareDates(date, history.week0) >= 0 ? (
                <Link to="/day/$date" params={{ date }} className={rowClass}>
                  {body}
                </Link>
              ) : (
                <div className={rowClass}>{body}</div>
              )}
            </li>
          )
        })}
      </ol>

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((w) => (
            <Banner key={w.days.join('-')} tone="brick">
              <span className="flex items-start gap-2">
                <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0 text-brick" />
                {dayName(w.days[0])}–{dayName(w.days[1])}: {w.message}
              </span>
            </Banner>
          ))}
        </div>
      )}

      {pd.kind !== 'before' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {picking ? (
            <>
              <Button
                disabled={picking.length !== 2}
                onClick={() => {
                  void saveSwaps(monday, pendingSwaps)
                  setPicking(null)
                }}
              >
                Save the swap
              </Button>
              <Button variant="quiet" onClick={() => setPicking(null)}>
                Cancel
              </Button>
              <p className="w-full text-sm">
                Pick two days: their main sessions swap, each with its split block.
              </p>
            </>
          ) : (
            <>
              <Button variant="quiet" onClick={() => setPicking([])}>
                <ArrowLeftRight aria-hidden className="size-4" /> Swap days
              </Button>
              {swaps.length > 0 && (
                <Button variant="danger" onClick={() => void saveSwaps(monday, [])}>
                  Undo the swaps
                </Button>
              )}
            </>
          )}
        </div>
      )}
      <Legend />
    </Screen>
  )
}

function Legend() {
  return (
    <ul className="mt-6 grid grid-cols-2 gap-2 text-sm" aria-label="Status key">
      {(['full', 'shell', 'missed', 'paused', 'ahead'] as const).map((s) => (
        <li key={s} className="flex items-center gap-2">
          <StatusMark status={s} />
          {statusLabel(s)}
        </li>
      ))}
    </ul>
  )
}
