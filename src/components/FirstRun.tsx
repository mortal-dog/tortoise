import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { addDays, compareDates, defaultWeek0Monday, formatShort, isLocalDate, weekday } from '@/lib/dates'
import { currentPlatform, useInstallView, useStandalone } from '@/lib/install'
import { startPlan } from '@/lib/repo'
import { useToday } from '@/lib/use-app'
import { InstallCard } from './InstallCard'
import { Button, Card, Screen } from './ui'

/**
 * The first run (design §3.8): in a browser, the install card for this platform (D-047); in the installed app, or once
 * the owner chooses the browser, the Monday on which Week 0 begins.
 */
export function FirstRun() {
  const standalone = useStandalone()
  const [inBrowser, setInBrowser] = useState(false)
  if (!standalone && !inBrowser) return <Welcome onBrowser={() => setInBrowser(true)} />
  return <PickMonday />
}

function Welcome({ onBrowser }: { onBrowser: () => void }) {
  const [platform] = useState(currentPlatform)
  const view = useInstallView(platform)
  return (
    <Screen title="Welcome to Tortoise">
      <p className="mb-4">Slow and steady, to 99. A plan for every day, kept only on this device.</p>
      <InstallCard platform={platform} view={view} />
      <Button variant="quiet" className="mt-4 w-full" onClick={onBrowser}>
        Start in this browser instead
      </Button>
    </Screen>
  )
}

function PickMonday() {
  const t = useToday()
  const [monday, setMonday] = useState(() => defaultWeek0Monday(t))
  const [runMin, setRunMin] = useState('')
  const run = runMin.trim() === '' ? undefined : Number(runMin)
  const valid = isLocalDate(monday) && weekday(monday) === 'mon' && compareDates(monday, t) >= 0

  return (
    <Screen title="Start the plan">
      <Card>
        <label htmlFor="week0" className="block text-lg font-semibold text-primary">
          Week 0 begins on
        </label>
        <p className="mt-1 text-sm text-primary-strong">
          A Monday: learn the movements at half volume, every exercise at its first level. Week 1 starts seven
          days later.
        </p>
        <input
          id="week0"
          type="date"
          value={monday}
          min={t}
          step={7}
          onChange={(e) => setMonday(e.target.value)}
          className="mt-3 min-h-11 w-full rounded-xl border border-edge bg-field px-3 text-text"
        />
        {!valid && (
          <p className="mt-2 text-sm text-brick">Pick today if it is a Monday, or a coming Monday.</p>
        )}
        {valid && (
          <p className="mt-2 text-sm">
            Week 0: {formatShort(monday)} to {formatShort(addDays(monday, 6))}.
          </p>
        )}
        <label htmlFor="run-min" className="mt-5 block font-semibold text-primary">
          How long is an easy run comfortable?
        </label>
        <p className="mt-1 text-sm text-primary-strong">
          In minutes, without stopping; 0 if you do not run yet. It sets where the run–walk starts. Every
          other exercise starts at its first level and moves up when it feels easy.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <input
            id="run-min"
            type="number"
            inputMode="numeric"
            min={0}
            value={runMin}
            onChange={(e) => setRunMin(e.target.value)}
            className="min-h-11 w-28 rounded-xl border border-edge bg-field px-3 text-text"
          />
          <span className="text-sm">min</span>
        </div>
        <Button
          className="mt-4 w-full"
          disabled={!valid}
          onClick={() => void startPlan(monday, run !== undefined && run >= 0 ? { runMin: run } : {})}
        >
          Start the plan
        </Button>
      </Card>
      <p className="mt-4 text-sm">
        Moving from another phone or browser?{' '}
        <Link to="/settings" hash="drive" className="font-semibold text-primary underline">
          Sign in with Google in Settings
        </Link>
        .
      </p>
    </Screen>
  )
}
