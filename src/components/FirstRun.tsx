import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { cn } from '@/lib/cn'
import { addDays, compareDates, defaultWeek0Monday, formatShort, isLocalDate, weekday } from '@/lib/dates'
import { currentPlatform, useInstallView, useStandalone } from '@/lib/install'
import { startPlan } from '@/lib/repo'
import type { StartAnswers } from '@/lib/start-levels'
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

/** The start questions (D-069): each answer sets a ladder's first level by the start rules (plan §8). */
const QUESTIONS: Array<{
  key: keyof StartAnswers
  text: string
  options: Array<{ label: string; value: number }>
}> = [
  {
    key: 'pushups',
    text: 'How many push-ups on the floor can you do in a row?',
    options: [
      { label: '0–4', value: 0 },
      { label: '5–14', value: 5 },
      { label: '15–29', value: 15 },
      { label: '30 or more', value: 30 },
    ],
  },
  {
    key: 'runMin',
    text: 'How long can you run at an easy pace without stopping?',
    options: [
      { label: 'Not yet', value: 0 },
      { label: 'About 10 min', value: 10 },
      { label: '30 min or more', value: 30 },
    ],
  },
  {
    key: 'oneLeg30',
    text: 'Can you stand on one leg for 30 s, eyes open, on each leg?',
    options: [
      { label: 'No', value: 0 },
      { label: 'Yes', value: 1 },
    ],
  },
  {
    key: 'handstandWall30',
    text: 'Can you hold a handstand with your chest to a wall for 30 s?',
    options: [
      { label: 'No', value: 0 },
      { label: 'Yes', value: 1 },
    ],
  },
  {
    key: 'trains',
    text: 'Have you lifted weights at least twice a week for 3 months or more?',
    options: [
      { label: 'No', value: 0 },
      { label: 'Yes', value: 1 },
    ],
  },
]

/** Every answer starts at its lowest choice, so a skipped question starts that exercise at level 1. */
const FIRST: Required<StartAnswers> = { pushups: 0, runMin: 0, oneLeg30: 0, handstandWall30: 0, trains: 0 }

function PickMonday() {
  const t = useToday()
  const [monday, setMonday] = useState(() => defaultWeek0Monday(t))
  const [answers, setAnswers] = useState<Required<StartAnswers>>(FIRST)
  const valid = isLocalDate(monday) && weekday(monday) === 'mon' && compareDates(monday, t) >= 0

  return (
    <Screen title="Start the plan">
      <Card>
        <label htmlFor="week0" className="block text-lg font-semibold text-primary">
          Week 0 begins on
        </label>
        <p className="mt-1 text-sm text-primary-strong">
          A Monday: learn the movements at half volume. Week 1 starts seven days later.
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
      </Card>
      <Card className="mt-4">
        <h2 className="font-semibold text-lg text-primary">Where you start</h2>
        <p className="mt-1 text-sm text-primary-strong">
          Five quick questions set the first level of each exercise. After that the app asks every few weeks:
          harder, keep, or easier.
        </p>
        <div className="mt-2 divide-y divide-line">
          {QUESTIONS.map((q) => (
            <fieldset key={q.key} className="py-3" data-testid={`start-${q.key}`}>
              <legend className="font-semibold">{q.text}</legend>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {q.options.map((o) => (
                  <button
                    key={o.label}
                    type="button"
                    aria-pressed={answers[q.key] === o.value}
                    onClick={() => setAnswers({ ...answers, [q.key]: o.value })}
                    className={cn(
                      'min-h-11 rounded-xl border px-3 font-semibold text-sm transition-transform active:scale-[0.97]',
                      answers[q.key] === o.value
                        ? 'border-primary bg-primary text-on-primary'
                        : 'border-edge bg-field text-text',
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ))}
        </div>
        <Button className="mt-4 w-full" disabled={!valid} onClick={() => void startPlan(monday, answers)}>
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
