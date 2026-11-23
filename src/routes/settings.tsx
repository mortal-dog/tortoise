import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { DriveCard } from '@/components/settings/DriveCard'
import { Choice, inputClass, numberIn, SavedField, SectionTitle } from '@/components/settings/fields'
import { ResetCard } from '@/components/settings/ResetCard'
import { Button, Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { kgToLb, lbToKg } from '@/lib/calc'
import { week0Monday } from '@/lib/calendar'
import {
  compareDates,
  defaultWeek0Monday,
  formatLong,
  isLocalDate,
  type LocalDate,
  weekday,
} from '@/lib/dates'
import type { SettingsRecord } from '@/lib/records'
import { resetAll, saveSettings, startPlan } from '@/lib/repo'
import { driveSignOut } from '@/lib/sync/sync'
import { useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

export const SOURCES_URL = 'https://github.com/mortal-dog/tortoise/blob/main/docs/sources.md'

/** Settings, every section of design §3.7. */
function Settings() {
  const settings = useSettings()
  const t = useToday()
  const navigate = useNavigate()
  if (!settings) return <Screen title="Settings">{null}</Screen>
  return (
    <Screen title="Settings">
      <div className="space-y-3">
        <PlanSection settings={settings} t={t} />
        <ProfileSection settings={settings} />
        <UnitsSection settings={settings} />
        <DriveCard />
        <AboutSection />
        <ResetCard
          onReset={async () => {
            await resetAll()
            // The Drive copy stays; forgetting the sign-in keeps the empty phone from syncing over it.
            await driveSignOut(false)
            await navigate({ to: '/' })
          }}
        />
      </div>
    </Screen>
  )
}

function PlanSection({ settings, t }: { settings: SettingsRecord; t: LocalDate }) {
  const [restarting, setRestarting] = useState(false)
  const [monday, setMonday] = useState(() => defaultWeek0Monday(t))
  const valid = isLocalDate(monday) && weekday(monday) === 'mon' && compareDates(monday, t) >= 0
  if (!settings.startDate) {
    return (
      <Card>
        <SectionTitle>Plan</SectionTitle>
        <p className="mt-1 text-sm">Not started yet: the Today tab starts the plan.</p>
      </Card>
    )
  }
  return (
    <Card>
      <SectionTitle>Plan</SectionTitle>
      <p className="mt-1 text-sm" data-testid="plan-dates">
        Week 0 began on {formatLong(week0Monday(settings.startDate))}; Week 1 on{' '}
        {formatLong(settings.startDate)}.
      </p>
      {!restarting ? (
        <Button variant="quiet" className="mt-3" onClick={() => setRestarting(true)}>
          Restart from Week 0
        </Button>
      ) : (
        <div className="mt-3">
          <label className="block text-sm">
            The new Week 0 begins on
            <input
              type="date"
              value={monday}
              min={t}
              step={7}
              onChange={(e) => setMonday(e.target.value)}
              className={inputClass}
            />
          </label>
          <p className={valid ? 'mt-2 text-sm' : 'mt-2 text-sm text-brick'}>
            {valid
              ? `Week 0 again from ${formatLong(monday)}, at half volume with every ladder at level 1. Every day and log so far is kept; days before the new Week 0 no longer count toward the streak.`
              : 'Pick today if it is a Monday, or a coming Monday.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              disabled={!valid}
              onClick={() => {
                void startPlan(monday)
                setRestarting(false)
              }}
            >
              Restart
            </Button>
            <Button variant="quiet" onClick={() => setRestarting(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

const round = (n: number, places: number) => Math.round(n * 10 ** places) / 10 ** places

function ProfileSection({ settings }: { settings: SettingsRecord }) {
  const p = settings.profile
  const lb = settings.units.mass === 'lb'
  const year = new Date().getFullYear()
  // From the stored profile, not this render's copy, so two fields edited in a row both land.
  const saveProfile = (patch: Partial<SettingsRecord['profile']>) =>
    void saveSettings((s) => {
      const next = { ...s.profile, ...patch }
      for (const k of Object.keys(next) as Array<keyof typeof next>) if (next[k] === undefined) delete next[k]
      return { profile: next }
    })
  const mass = (kg: number | undefined) => (kg === undefined ? '' : String(round(lb ? kgToLb(kg) : kg, 1)))
  const toKg = (v: number | undefined) => (v === undefined ? undefined : round(lb ? lbToKg(v) : v, 3))
  return (
    <Card>
      <SectionTitle>Profile</SectionTitle>
      <p className="mt-1 text-sm">
        All optional, and kept only on this phone. Used for the heart-rate zones and the Rockport walk.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <SavedField
          label="Birth year"
          inputMode="numeric"
          value={p.birthYear === undefined ? '' : String(p.birthYear)}
          parse={numberIn(year - 120, year, 'The birth year', true)}
          onSave={(v) => saveProfile({ birthYear: v })}
        />
        <SavedField
          label="Height"
          suffix="cm"
          value={p.heightCm === undefined ? '' : String(p.heightCm)}
          parse={numberIn(50, 250, 'Height')}
          onSave={(v) => saveProfile({ heightCm: v })}
        />
        <SavedField
          label="Weight"
          suffix={settings.units.mass}
          value={mass(p.weightKg)}
          parse={numberIn(lb ? 44 : 20, lb ? 660 : 300, 'Weight')}
          onSave={(v) => saveProfile({ weightKg: toKg(v) })}
        />
      </div>
      <Choice
        legend="Sex (for the Rockport formula)"
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
          { value: 'unset', label: 'Not set' },
        ]}
        value={p.sex ?? 'unset'}
        onChange={(v) => saveProfile({ sex: v === 'unset' ? undefined : v })}
      />
    </Card>
  )
}

function UnitsSection({ settings }: { settings: SettingsRecord }) {
  const u = settings.units
  return (
    <Card>
      <SectionTitle>Units</SectionTitle>
      <Choice
        legend="Weight"
        options={[
          { value: 'kg', label: 'kg' },
          { value: 'lb', label: 'lb' },
        ]}
        value={u.mass}
        onChange={(v) => void saveSettings((s) => ({ units: { ...s.units, mass: v } }))}
      />
      <Choice
        legend="Distance"
        options={[
          { value: 'km', label: 'km' },
          { value: 'mi', label: 'mi' },
        ]}
        value={u.distance}
        onChange={(v) => void saveSettings((s) => ({ units: { ...s.units, distance: v } }))}
      />
    </Card>
  )
}

const LICENCES = [
  ['React and React DOM', 'MIT'],
  ['TanStack Router', 'MIT'],
  ['zod', 'MIT'],
  ['Lucide icons', 'ISC'],
] as const

function AboutSection() {
  return (
    <Card>
      <SectionTitle>About</SectionTitle>
      <p className="mt-1 text-sm">
        App {__APP_VERSION__} · plan {plan.version}.
      </p>
      <h3 className="mt-3 text-sm font-semibold">Privacy</h3>
      <p className="mt-1 text-sm">
        The data stays on this phone: no server and no tracking. Only after you sign in with Google does the
        app talk to Google, to sync with a hidden folder of your own Drive (D-054).
      </p>
      <h3 className="mt-3 text-sm font-semibold">Sources</h3>
      <p className="mt-1 text-sm">
        Every number in the plan names one of its {plan.sources.length} sources, each read in its own text.{' '}
        <a
          href={SOURCES_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 font-semibold text-primary underline"
        >
          The list of sources <ExternalLink aria-hidden className="size-3.5" />
        </a>
      </p>
      <h3 className="mt-3 text-sm font-semibold">Licences</h3>
      <ul className="mt-1 text-sm">
        {LICENCES.map(([name, licence]) => (
          <li key={name}>
            {name}: {licence} licence
          </li>
        ))}
      </ul>
    </Card>
  )
}
