import { Link } from '@tanstack/react-router'
import { Share, SquarePlus } from 'lucide-react'
import { useState } from 'react'
import { addDays, compareDates, defaultWeek0Monday, formatShort, isLocalDate, weekday } from '@/lib/dates'
import { startPlan } from '@/lib/repo'
import { isStandalone, useToday } from '@/lib/use-app'
import { Button, Card, Screen } from './ui'

/** The first run (design §3.8): the install hint in Safari, then the Monday on which Week 0 begins. */
export function FirstRun() {
  const t = useToday()
  const [stage, setStage] = useState<'install' | 'pick'>(() => (isStandalone() ? 'pick' : 'install'))
  const [monday, setMonday] = useState(() => defaultWeek0Monday(t))
  const valid = isLocalDate(monday) && weekday(monday) === 'mon' && compareDates(monday, t) >= 0

  if (stage === 'install') {
    return (
      <Screen title="Welcome to Tortoise">
        <p className="mb-4">Slow and steady, to 99. A plan for every day, kept only on this phone.</p>
        <Card>
          <h2 className="text-lg font-semibold text-primary">Install it first</h2>
          <ol className="mt-3 space-y-3">
            <li className="flex items-start gap-3">
              <Share aria-hidden className="mt-0.5 size-5 shrink-0 text-sky" />
              <span>In Safari, tap Share.</span>
            </li>
            <li className="flex items-start gap-3">
              <SquarePlus aria-hidden className="mt-0.5 size-5 shrink-0 text-sky" />
              <span>Choose Add to Home Screen, then open Tortoise from the Home Screen.</span>
            </li>
          </ol>
          <p className="mt-4 text-sm text-primary-strong">
            The installed app keeps its own data, apart from Safari&apos;s, so start the plan there, not in
            this tab.
          </p>
        </Card>
        <Button variant="quiet" className="mt-4 w-full" onClick={() => setStage('pick')}>
          Start in this browser instead
        </Button>
      </Screen>
    )
  }

  return (
    <Screen title="Start the plan">
      <Card>
        <label htmlFor="week0" className="block text-lg font-semibold text-primary">
          Week 0 begins on
        </label>
        <p className="mt-1 text-sm text-primary-strong">
          A Monday: learn the movements at half volume, then the Tortoise Test on the weekend. Week 1 starts
          seven days later.
        </p>
        <input
          id="week0"
          type="date"
          value={monday}
          min={t}
          step={7}
          onChange={(e) => setMonday(e.target.value)}
          className="mt-3 min-h-11 w-full rounded-xl border border-line bg-background px-3 text-text"
        />
        {!valid && (
          <p className="mt-2 text-sm text-brick">Pick today if it is a Monday, or a coming Monday.</p>
        )}
        {valid && (
          <p className="mt-2 text-sm">
            Week 0: {formatShort(monday)} to {formatShort(addDays(monday, 6))}.
          </p>
        )}
        <Button className="mt-4 w-full" disabled={!valid} onClick={() => void startPlan(monday)}>
          Start the plan
        </Button>
      </Card>
      <p className="mt-4 text-sm">The profile is optional; the Tortoise Test asks for what it needs.</p>
      <p className="mt-4 text-sm">
        Moving from another phone or browser?{' '}
        <Link to="/settings" hash="backup" className="font-semibold text-primary underline">
          Restore a backup in Settings
        </Link>
        .
      </p>
    </Screen>
  )
}
