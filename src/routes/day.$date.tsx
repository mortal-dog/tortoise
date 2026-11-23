import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronLeft, X } from 'lucide-react'
import { ExerciseLink } from '@/components/ExerciseLink'
import { StatusMark, statusLabel } from '@/components/StatusMark'
import { Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import type { Session } from '@/data/schema'
import { dayTemplate, type PlanDay } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { compareDates, formatShort, isLocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { type DayItem, dayItems, sessionOf, stepsFor } from '@/lib/plan-view'
import type { LevelRecord, Variant } from '@/lib/records'
import { getLevels, getOverride } from '@/lib/repo'
import { planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/day/$date')({
  component: DayDetail,
})

/**
 * A day of the plan (D-057): the same list for every day, past or to come, of each part's exercises with their videos.
 * A day that has passed (and today, once a part is done) marks each exercise done or not done.
 */
function DayDetail() {
  const { date } = Route.useParams()
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const start = settings?.startDate
  const pd = start && isLocalDate(date) ? planDayOf(start, date) : null
  const override = useLive(() => (pd ? getOverride(pd.monday) : Promise.resolve(undefined)), [pd?.monday])
  const levels = useLive(getLevels, []) ?? new Map<string, LevelRecord>()

  if (!settings || !history) return <Screen title="Day">{null}</Screen>
  const tmpl = pd ? dayTemplate(pd, plan.week, override?.swaps ?? []) : null
  if (!start || !pd || !tmpl || !isLocalDate(date) || compareDates(date, history.week0) < 0) {
    return (
      <Screen title="Day">
        <p>This day is outside the plan.</p>
        <BackLink />
      </Screen>
    )
  }
  const day = history.days.get(date)
  const status = history.statusOf(date)
  const past = compareDates(date, t) < 0
  const nothingDone = !day?.morning?.doneAt && !day?.main?.doneAt && !day?.split?.doneAt
  const mark = (record: { doneAt: string } | null | undefined) => past || !!record?.doneAt
  const main = sessionOf(tmpl.main)
  const variant: Variant = day?.main?.variant ?? 'outdoor'
  const split = tmpl.split ? sessionOf(tmpl.split) : null

  return (
    <Screen title={formatShort(date)} action={<BackLink />}>
      <p className="mb-3 flex items-center gap-2" data-testid="day-status">
        <StatusMark status={status} size={22} />
        <span className="font-semibold">{statusLabel(status)}</span>
      </p>
      {past && nothingDone && (
        <p className="mb-3 font-semibold text-brick" data-testid="day-nothing">
          Nothing was done this day.
        </p>
      )}
      <div className="space-y-3">
        <Part
          title="Morning block"
          marked={mark(day?.morning)}
          done={!!day?.morning?.doneAt}
          items={dayItems(sessionOf(tmpl.morning), 'outdoor', levels, pd, day?.morning, mark(day?.morning))}
        />
        {main && (
          <MainPart
            session={main}
            variant={variant}
            levels={levels}
            pd={pd}
            record={day?.main}
            marked={mark(day?.main)}
          />
        )}
        {split && (
          <Part
            title={split.name}
            marked={mark(day?.split)}
            done={!!day?.split?.doneAt}
            items={dayItems(split, 'outdoor', levels, pd, day?.split, mark(day?.split))}
          />
        )}
      </div>
    </Screen>
  )
}

/** The main session; a run day that is not done yet also lists its indoor version (the indoor walk). */
function MainPart({
  session,
  variant,
  levels,
  pd,
  record,
  marked,
}: {
  session: Session
  variant: Variant
  levels: ReadonlyMap<string, LevelRecord>
  pd: PlanDay
  record: { doneAt: string; steps?: string[] } | null | undefined
  marked: boolean
}) {
  const items = dayItems(session, variant, levels, pd, record, marked)
  const shown = new Set(stepsFor(session, variant, pd).map((s) => s.id))
  const indoor =
    session.hasVariants && !record?.doneAt && variant === 'outdoor'
      ? dayItems(session, 'indoor', levels, pd, undefined, false).filter((i) => !shown.has(i.stepId))
      : []
  return (
    <Part
      title={`${session.name}${record?.doneAt && session.hasVariants ? ` · ${variant === 'indoor' ? 'Indoor' : 'Outdoor'}` : ''}`}
      marked={marked}
      done={!!record?.doneAt}
      items={items}
      extra={
        indoor.length > 0 ? (
          <>
            <h3 className="mt-3 font-semibold text-sm text-primary-strong">Indoors (rain or ice)</h3>
            <ItemList items={indoor} />
          </>
        ) : null
      }
    />
  )
}

function Part({
  title,
  items,
  marked,
  done,
  extra,
}: {
  title: string
  items: DayItem[]
  marked: boolean
  done: boolean
  extra?: React.ReactNode
}) {
  return (
    <Card data-testid="day-part">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg text-primary">{title}</h2>
        {marked && (
          <span className={cn('font-semibold text-sm', done ? 'text-primary' : 'text-brick')}>
            {done ? 'Done' : 'Not done'}
          </span>
        )}
      </div>
      <ItemList items={items} />
      {extra}
    </Card>
  )
}

function ItemList({ items }: { items: DayItem[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item.stepId} className="flex items-start gap-2" data-testid="day-item">
          {item.done !== undefined &&
            (item.done ? (
              <Check aria-label="done" className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={3} />
            ) : (
              <X aria-label="not done" className="mt-0.5 size-5 shrink-0 text-brick" strokeWidth={3} />
            ))}
          <div className="min-w-0">
            <p className="font-semibold">
              {item.label ? `${item.label} · ` : ''}
              {item.name}
            </p>
            <p className="text-sm">
              <ExerciseLink name={item.exercise} url={item.videoUrl} /> <span>{item.dose}</span>
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}

function BackLink() {
  return (
    <Link
      to="/week"
      aria-label="Back to the week"
      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-edge bg-field px-3 text-sm font-semibold text-primary"
    >
      <ChevronLeft aria-hidden className="size-4" /> Week
    </Link>
  )
}
