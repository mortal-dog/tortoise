import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BackupCard } from '@/components/settings/BackupCard'
import {
  Choice,
  formatBytes,
  inputClass,
  numberIn,
  SavedField,
  SectionTitle,
} from '@/components/settings/fields'
import { RemindersCard } from '@/components/settings/RemindersCard'
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
import { isStoragePersistent, requestPersistentStorage } from '@/lib/db'
import type { SettingsRecord } from '@/lib/records'
import { resetAll, saveSettings, startPlan } from '@/lib/repo'
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
        <DaylightSection settings={settings} />
        <RunsSection settings={settings} />
        <RemindersCard settings={settings} today={t} />
        <BackupCard settings={settings} />
        <StorageSection />
        <AboutSection />
        <ResetCard
          onReset={async () => {
            await resetAll()
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
        All optional, and kept only on this phone. Used for the heart-rate zones, the Rockport walk and the
        broad-jump aim.
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
  const lb = u.mass === 'lb'
  const kg = settings.dumbbellKg
  return (
    <Card>
      <SectionTitle>Units and equipment</SectionTitle>
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
      <SavedField
        className="mt-3"
        label="Dumbbell weight, each"
        suffix={u.mass}
        value={kg === undefined ? '' : String(round(lb ? kgToLb(kg) : kg, 1))}
        parse={numberIn(lb ? 1 : 0.5, lb ? 110 : 50, 'The dumbbell weight')}
        onSave={(v) =>
          void saveSettings({ dumbbellKg: v === undefined ? undefined : round(lb ? lbToKg(v) : v, 3) })
        }
      />
    </Card>
  )
}

function DaylightSection({ settings }: { settings: SettingsRecord }) {
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [error, setError] = useState('')
  const loc = settings.location

  const saveLocation = (la: number, lo: number) => {
    if (!(la >= -90 && la <= 90 && lo >= -180 && lo <= 180)) {
      setError('Latitude runs from −90 to 90, longitude from −180 to 180.')
      return
    }
    setError('')
    void saveSettings({ location: { lat: Math.round(la * 1e4) / 1e4, lon: Math.round(lo * 1e4) / 1e4 } })
  }

  return (
    <Card>
      <SectionTitle>Daylight</SectionTitle>
      <p className="mt-1 text-sm">
        {loc
          ? `Location ${loc.lat}, ${loc.lon}. It stays on this phone.`
          : 'Off. Set a location to see sunrise, sunset and the length of the day. It stays on this phone.'}
      </p>
      <div className="mt-2 grid grid-cols-2 gap-3">
        <label className="text-sm">
          Latitude
          <input
            inputMode="decimal"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="text-sm">
          Longitude
          <input
            inputMode="decimal"
            value={lon}
            onChange={(e) => setLon(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-brick">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button disabled={!lat || !lon} onClick={() => saveLocation(Number(lat), Number(lon))}>
          Save location
        </Button>
        <Button
          variant="quiet"
          onClick={() =>
            navigator.geolocation?.getCurrentPosition(
              (p) => saveLocation(p.coords.latitude, p.coords.longitude),
              () => setError('The location was not shared.'),
              { maximumAge: 0, timeout: 20_000 },
            )
          }
        >
          Use my location once
        </Button>
        {loc && (
          <Button variant="danger" onClick={() => void saveSettings({ location: undefined })}>
            Clear
          </Button>
        )}
      </div>
    </Card>
  )
}

function RunsSection({ settings }: { settings: SettingsRecord }) {
  return (
    <Card>
      <SectionTitle>Runs</SectionTitle>
      <Choice
        legend="The variant run days start with"
        options={[
          { value: 'outdoor', label: 'Outdoor' },
          { value: 'indoor', label: 'Indoor' },
          { value: 'ask', label: 'Ask' },
        ]}
        value={settings.runDefault}
        onChange={(v) => void saveSettings({ runDefault: v })}
      />
    </Card>
  )
}

function StorageSection() {
  const [persistent, setPersistent] = useState<boolean | null | undefined>(undefined)
  const [used, setUsed] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    void isStoragePersistent().then((p) => alive && setPersistent(p))
    void navigator.storage
      ?.estimate?.()
      .then((e) => alive && setUsed(e.usage ?? null))
      .catch(() => undefined)
    return () => {
      alive = false
    }
  }, [])
  return (
    <Card>
      <SectionTitle>Storage</SectionTitle>
      <p className="mt-1 text-sm" data-testid="storage-persistent">
        {persistent === undefined
          ? 'Checking…'
          : persistent === null
            ? 'This browser cannot say whether it keeps the data under storage pressure.'
            : persistent
              ? 'Persistent: the browser keeps the data even when space runs low.'
              : 'Not persistent yet: the browser may clear the data when space runs low. Back up often.'}
      </p>
      {used !== null && <p className="mt-1 text-sm">About {formatBytes(used)} used.</p>}
      {persistent === false && (
        <Button
          variant="quiet"
          className="mt-3"
          onClick={() => void requestPersistentStorage().then((p) => setPersistent(p))}
        >
          Ask to keep the data
        </Button>
      )}
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
        All data stays on this phone: no account, no server, no tracking, no third-party requests. A backup
        file goes only where you send it.
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
