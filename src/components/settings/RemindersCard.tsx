import { CalendarPlus } from 'lucide-react'
import { useState } from 'react'
import { plan } from '@/data/plan'
import { WEEKDAYS, type Weekday } from '@/data/schema'
import { week0Monday } from '@/lib/calendar'
import { cn } from '@/lib/cn'
import { compareDates, dayName, type LocalDate } from '@/lib/dates'
import { buildCalendar, reminderLines, remindersOf } from '@/lib/ics'
import { sessionOf } from '@/lib/plan-view'
import type { SettingsRecord } from '@/lib/records'
import { saveSettings } from '@/lib/repo'
import { downloadFile, type ShareOutcome, shareOrDownload } from '@/lib/share'
import { Button, Card } from '../ui'
import { inputClass, SectionTitle } from './fields'

const CLOCK = /^\d{2}:\d{2}$/

function TimeField({
  label,
  value,
  onSave,
  className,
}: {
  label: string
  value: string | undefined
  onSave: (v: string | undefined) => void
  className?: string
}) {
  return (
    <label className={cn('block text-sm', className)}>
      {label}
      <input
        type="time"
        value={value ?? ''}
        data-empty={value ? undefined : 'true'}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' || CLOCK.test(v)) onSave(v === '' ? undefined : v)
        }}
        className={inputClass}
      />
    </label>
  )
}

/**
 * Settings → Reminders (design §3.7, §9): the times, the calendar file through the share sheet or as a file to open,
 * and the times as text in case neither hand-off works.
 */
export function RemindersCard({ settings, today }: { settings: SettingsRecord; today: LocalDate }) {
  const [outcome, setOutcome] = useState<ShareOutcome | null>(null)
  const r = settings.reminders
  const reminders = remindersOf(r)
  const lines = reminderLines(reminders)

  const save = (next: SettingsRecord['reminders']) => {
    const main = Object.fromEntries(Object.entries(next.main).filter(([, v]) => v)) as typeof next.main
    void saveSettings({ reminders: next.morning ? { morning: next.morning, main } : { main } })
  }

  const file = () => {
    // The events begin with the plan's Week 0, or today once it has begun.
    const week0 = settings.startDate ? week0Monday(settings.startDate) : today
    const from = compareDates(week0, today) > 0 ? week0 : today
    return new File([buildCalendar(reminders, from, new Date())], 'tortoise-reminders.ics', {
      type: 'text/calendar',
    })
  }

  return (
    <Card id="reminders">
      <SectionTitle>Reminders</SectionTitle>
      <p className="mt-1 text-sm">
        The phone&apos;s Calendar rings them, even with Tortoise closed. Leave a time empty for no reminder.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <TimeField
          label="Morning block, every day"
          className="col-span-2"
          value={r.morning}
          onSave={(v) => save({ ...r, morning: v })}
        />
        {WEEKDAYS.map((d: Weekday) => (
          <TimeField
            key={d}
            label={`${dayName(d)}: ${sessionOf(plan.week[d].main).name}`}
            value={r.main[d]}
            onSave={(v) => save({ ...r, main: { ...r.main, [d]: v } })}
          />
        ))}
      </div>

      {lines.length > 0 ? (
        <>
          <h3 className="mt-3 text-sm font-semibold">Your reminder times</h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm" data-testid="reminder-lines">
            {lines.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => void shareOrDownload(file(), 'Tortoise reminders').then(setOutcome)}>
              <CalendarPlus aria-hidden className="size-4" /> Add to Calendar
            </Button>
            <Button
              variant="quiet"
              onClick={() => {
                downloadFile(file())
                setOutcome('downloaded')
              }}
            >
              Open the calendar file
            </Button>
          </div>
          <p className="mt-2 text-sm" aria-live="polite">
            {outcome === 'downloaded'
              ? 'Calendar file saved. Open it to add the events, or set the alarms by hand from the list above.'
              : outcome === 'shared'
                ? 'Calendar file shared.'
                : outcome === 'cancelled' || outcome === 'needs-tap'
                  ? 'Not added. Try "Open the calendar file", or set the alarms by hand from the list above.'
                  : 'Adding the file again adds a second set of events: delete the old ones in Calendar first.'}
          </p>
        </>
      ) : (
        <p className="mt-3 text-sm">No reminder times yet.</p>
      )}
    </Card>
  )
}
