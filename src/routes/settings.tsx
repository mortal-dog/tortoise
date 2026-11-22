import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { Button, Card, Screen } from '@/components/ui'
import { plan } from '@/data/plan'
import { addDays, formatShort } from '@/lib/dates'
import { saveSettings } from '@/lib/repo'
import { useSettings } from '@/lib/use-app'

export const Route = createFileRoute('/settings')({
  component: Settings,
})

const input = 'mt-1 block min-h-11 w-full rounded-xl border border-line bg-background px-3 text-text'

/** The sections Phase 3 needs; the rest of design §3.7 (profile, units, reminders, backup, reset) comes in Phase 7. */
function Settings() {
  const settings = useSettings()
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [error, setError] = useState('')
  if (!settings) return <Screen title="Settings">{null}</Screen>
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
    <Screen title="Settings">
      <div className="space-y-3">
        <Card>
          <h2 className="font-semibold text-primary">Plan</h2>
          <p className="mt-1 text-sm">
            {settings.startDate
              ? `Week 0 began on ${formatShort(addDays(settings.startDate, -7))}; Week 1 on ${formatShort(settings.startDate)}.`
              : 'Not started yet.'}
          </p>
        </Card>

        <Card>
          <h2 className="font-semibold text-primary">Daylight</h2>
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
                className={input}
              />
            </label>
            <label className="text-sm">
              Longitude
              <input
                inputMode="decimal"
                value={lon}
                onChange={(e) => setLon(e.target.value)}
                className={input}
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

        <Card>
          <fieldset>
            <legend className="font-semibold text-primary">Runs</legend>
            <p className="mt-1 text-sm">The variant run days start with.</p>
            <div className="mt-2 flex gap-2">
              {(['outdoor', 'indoor', 'ask'] as const).map((v) => (
                <Button
                  key={v}
                  variant={settings.runDefault === v ? 'primary' : 'quiet'}
                  aria-pressed={settings.runDefault === v}
                  onClick={() => void saveSettings({ runDefault: v })}
                  className="flex-1"
                >
                  {v === 'outdoor' ? 'Outdoor' : v === 'indoor' ? 'Indoor' : 'Ask'}
                </Button>
              ))}
            </div>
          </fieldset>
        </Card>

        <Card>
          <h2 className="font-semibold text-primary">About</h2>
          <p className="mt-1 text-sm">
            App {__APP_VERSION__} · plan {plan.version}. All data stays on this phone: no account, no server,
            no tracking.
          </p>
        </Card>
      </div>
    </Screen>
  )
}
