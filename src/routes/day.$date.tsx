import { createFileRoute, Link } from '@tanstack/react-router'
import { Check, ChevronLeft } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'
import { StatusMark, statusLabel } from '@/components/StatusMark'
import { Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { dayTemplate } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { compareDates, formatShort, isLocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { sessionOf, splitKind, TEST_SESSION_ID } from '@/lib/plan-view'
import { type DayRecord, nowIso } from '@/lib/records'
import { getOverride, updateDay } from '@/lib/repo'
import { planDayOf, useHistory, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/day/$date')({
  component: DayDetail,
})

function DayDetail() {
  const { date } = Route.useParams()
  const settings = useSettings()
  const t = useToday()
  const history = useHistory(settings?.startDate, t)
  const start = settings?.startDate
  const pd = start && isLocalDate(date) ? planDayOf(start, date) : null
  const override = useLive(() => (pd ? getOverride(pd.monday) : Promise.resolve(undefined)), [pd?.monday])

  if (!settings || !history) return <Screen title="Day">{null}</Screen>
  if (!start || !pd || !isLocalDate(date) || compareDates(date, history.week0) < 0) {
    return (
      <Screen title="Day">
        <p>This day is outside the plan.</p>
        <BackLink />
      </Screen>
    )
  }
  const tmpl = dayTemplate(pd, plan.week, override?.swaps ?? [])
  const day = history.days.get(date)
  const status = history.statusOf(date)
  const future = compareDates(date, t) > 0
  const mainId = tmpl?.testDay ? TEST_SESSION_ID[tmpl.testDay] : (tmpl?.main ?? '')
  const mainName = tmpl?.testDay
    ? `Tortoise Test · Day ${tmpl.testDay}`
    : tmpl
      ? sessionOf(tmpl.main).name
      : ''
  const split = tmpl?.split ? sessionOf(tmpl.split) : null
  const save = (change: (d: DayRecord) => DayRecord) => void updateDay(date, change)
  const num = (s: string) => (s.trim() === '' ? undefined : Number(s))

  return (
    <Screen title={formatShort(date)} action={<BackLink />}>
      <p className="mb-3 flex items-center gap-2" data-testid="day-status">
        <StatusMark status={status} size={22} />
        <span className="font-semibold">{statusLabel(status)}</span>
      </p>
      {future ? (
        <p>This day has not come yet.</p>
      ) : (
        <div className="space-y-3">
          <Card>
            <Toggle
              label="Morning block done"
              checked={!!day?.morning?.doneAt}
              onChange={(on) => save((d) => ({ ...d, morning: on ? { doneAt: nowIso() } : null }))}
            />
          </Card>
          <Card>
            <Toggle
              label={`${mainName} done`}
              checked={!!day?.main?.doneAt}
              onChange={(on) =>
                save((d) => ({
                  ...d,
                  main: on ? { doneAt: nowIso(), sessionId: mainId, asPlanned: true } : null,
                  ...(tmpl && !tmpl.split && !tmpl.testDay
                    ? { split: on ? { doneAt: nowIso(), kind: 'long' as const } : null }
                    : {}),
                }))
              }
            />
            {day?.main?.doneAt && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {sessionOf(tmpl?.main ?? '')?.hasVariants && !tmpl?.testDay && (
                  <Field label="Where">
                    <select
                      value={day.main.variant ?? 'outdoor'}
                      onChange={(e) =>
                        save((d) => ({
                          ...d,
                          main: d.main && { ...d.main, variant: e.target.value as 'outdoor' | 'indoor' },
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="outdoor">Outdoor</option>
                      <option value="indoor">Indoor</option>
                    </select>
                  </Field>
                )}
                <Field label="Minutes">
                  <input
                    inputMode="numeric"
                    defaultValue={day.main.minutes ?? ''}
                    onBlur={(e) =>
                      save((d) => ({
                        ...d,
                        main: d.main && { ...d.main, minutes: num(e.target.value), asPlanned: false },
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Distance (km)">
                  <input
                    inputMode="decimal"
                    defaultValue={day.main.distanceKm ?? ''}
                    onBlur={(e) =>
                      save((d) => ({ ...d, main: d.main && { ...d.main, distanceKm: num(e.target.value) } }))
                    }
                    className={inputClass}
                  />
                </Field>
                <Field label="Effort (1–10)">
                  <input
                    inputMode="numeric"
                    defaultValue={day.main.effort ?? ''}
                    onBlur={(e) => {
                      const v = num(e.target.value)
                      save((d) => ({
                        ...d,
                        main: d.main && {
                          ...d.main,
                          effort: v === undefined ? undefined : Math.min(10, Math.max(1, Math.round(v))),
                        },
                      }))
                    }}
                    className={inputClass}
                  />
                </Field>
                <Field label="Note" wide>
                  <input
                    defaultValue={day.main.note ?? ''}
                    onBlur={(e) =>
                      save((d) => ({
                        ...d,
                        main: d.main && { ...d.main, note: e.target.value || undefined },
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </Card>
          {split && (
            <Card>
              <Toggle
                label={`${split.name} done`}
                checked={!!day?.split?.doneAt}
                onChange={(on) =>
                  save((d) => ({ ...d, split: on ? { doneAt: nowIso(), kind: splitKind(split.id) } : null }))
                }
              />
            </Card>
          )}
          <Card>
            <fieldset>
              <legend className="font-semibold text-primary">Sick or injured</legend>
              <div className="mt-2 flex gap-2">
                {([null, 'sick', 'injured'] as const).map((p) => (
                  <button
                    key={p ?? 'none'}
                    type="button"
                    aria-pressed={(day?.paused ?? null) === p}
                    onClick={() => save((d) => ({ ...d, paused: p }))}
                    className={cn(
                      'min-h-11 flex-1 rounded-xl border text-sm font-semibold',
                      (day?.paused ?? null) === p
                        ? 'border-sky bg-sky text-on-primary'
                        : 'border-line text-text',
                    )}
                  >
                    {p === null ? 'Neither' : p === 'sick' ? 'Sick' : 'Injured'}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-primary-strong">
                A sick or injured day with nothing done pauses the streak; anything done still counts.
              </p>
            </fieldset>
          </Card>
        </div>
      )}
    </Screen>
  )
}

const inputClass = 'mt-1 block min-h-11 w-full rounded-xl border border-edge bg-field px-3 text-text'

function Field({ label, children, wide }: { label: string; children: ReactNode; wide?: boolean }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child
    <label className={cn('text-sm', wide && 'col-span-2')}>
      {label}
      {children}
    </label>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (on: boolean) => void
}) {
  // Shows the tap at once; the stored value takes over again when the write comes back.
  const [shown, setShown] = useState(checked)
  useEffect(() => setShown(checked), [checked])
  return (
    <label className="flex min-h-11 items-center justify-between gap-3">
      <span className="font-semibold">{label}</span>
      <span className="relative flex size-7 shrink-0 items-center justify-center">
        <input
          type="checkbox"
          checked={shown}
          onChange={(e) => {
            setShown(e.target.checked)
            onChange(e.target.checked)
          }}
          className="peer size-7 appearance-none rounded-lg border-2 border-primary checked:bg-primary"
        />
        <Check
          aria-hidden
          strokeWidth={3}
          className="pointer-events-none absolute hidden size-5 text-on-primary peer-checked:block"
        />
      </span>
    </label>
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
