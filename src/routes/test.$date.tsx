import { createFileRoute, Link } from '@tanstack/react-router'
import { Check } from 'lucide-react'
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from 'react'
import { NumberField, PointsStepper, PulseCount, parseNumber } from '@/components/test/fields'
import { Banner, Button, Card, Screen } from '@/components/ui'
import type { TestDef } from '@/data/schema'
import { heightLoss } from '@/lib/calc'
import { cn } from '@/lib/cn'
import { isLocalDate, type LocalDate } from '@/lib/dates'
import { useLive } from '@/lib/live'
import { laddersById, testsForDay } from '@/lib/plan-view'
import type { TestRecord } from '@/lib/records'
import { saveSettings } from '@/lib/repo'
import { finishTestDay, getTests, saveTestResults } from '@/lib/test-repo'
import { computeResults, heightDue, type Results } from '@/lib/test-results'
import { planDayOf, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/test/$date')({
  validateSearch: (s: Record<string, unknown>): { day?: 1 | 2 } =>
    s.day === 2 || s.day === '2' ? { day: 2 } : s.day === 1 || s.day === '1' ? { day: 1 } : {},
  component: TestWizard,
})

type Patch = Partial<Results>

interface FieldSpec {
  label: string
  unit: string
  get: (r: Results) => number | undefined
  set: (r: Results, n: number | undefined) => Patch
  stopwatch?: { capS?: number; minutes?: boolean }
}

const num = (n: number | undefined) => (n === undefined ? undefined : n)

/** The input fields of each test (design §6, the tests store). */
const FIELDS: Record<string, FieldSpec[]> = {
  'jump-reach': [
    { label: 'Best of 3', unit: 'cm', get: (r) => r.jumpReachCm, set: (_, n) => ({ jumpReachCm: num(n) }) },
  ],
  'resting-hr': [
    { label: 'Beats in 60 s', unit: 'bpm', get: (r) => r.restingHr, set: (_, n) => ({ restingHr: num(n) }) },
  ],
  height: [{ label: 'Height', unit: 'cm', get: (r) => r.heightCm, set: (_, n) => ({ heightCm: num(n) }) }],
  wall: [{ label: 'Gap', unit: 'cm', get: (r) => r.wallCm, set: (_, n) => ({ wallCm: num(n) }) }],
  'one-leg': (
    [
      ['openL', 'Left, eyes open'],
      ['openR', 'Right, eyes open'],
      ['closedL', 'Left, eyes closed'],
      ['closedR', 'Right, eyes closed'],
    ] as const
  ).map(([k, label]) => ({
    label,
    unit: 's',
    get: (r: Results) => r.oneLeg?.[k],
    set: (r: Results, n: number | undefined) => ({ oneLeg: { ...r.oneLeg, [k]: num(n) } }),
    stopwatch: { capS: 60 },
  })),
  'push-ups': [
    { label: 'Push-ups', unit: 'reps', get: (r) => r.pushups, set: (_, n) => ({ pushups: num(n) }) },
  ],
  handstand: [
    {
      label: 'Chest-to-wall hold',
      unit: 's',
      get: (r) => r.handstand?.wallS,
      set: (r, n) => ({ handstand: { ...r.handstand, wallS: num(n) } }),
      stopwatch: {},
    },
    {
      label: 'Best freestanding hold',
      unit: 's',
      get: (r) => r.handstand?.freeS,
      set: (r, n) => ({ handstand: { ...r.handstand, freeS: num(n) } }),
      stopwatch: {},
    },
  ],
  farmer: [
    { label: 'Time', unit: 's', get: (r) => r.farmerS, set: (_, n) => ({ farmerS: num(n) }), stopwatch: {} },
  ],
  'deep-squat': [
    {
      label: 'Time',
      unit: 's',
      get: (r) => r.squatHoldS,
      set: (_, n) => ({ squatHoldS: num(n) }),
      stopwatch: {},
    },
  ],
  splits: (
    [
      ['frontL', 'Front split, left leg forward'],
      ['frontR', 'Front split, right leg forward'],
      ['side', 'Side split'],
    ] as const
  ).map(([k, label]) => ({
    label,
    unit: 'cm',
    get: (r: Results) => r.splits?.[k],
    set: (r: Results, n: number | undefined) => ({ splits: { ...r.splits, [k]: num(n) } }),
  })),
}

/**
 * Cards with unsaved changes register a flush here, so "Finish" saves them first: nothing typed is lost, and the
 * day is finished only after every save has landed.
 */
type Flush = () => Promise<void>
const FlushContext = createContext<Map<string, Flush> | null>(null)

function useFlush(key: string, dirty: boolean, flush: Flush) {
  const map = useContext(FlushContext)
  const ref = useRef(flush)
  ref.current = flush
  useEffect(() => {
    if (!map || !dirty) return
    map.set(key, () => ref.current())
    return () => {
      map.delete(key)
    }
  }, [map, key, dirty])
}

function FlushProvider({ map, children }: { map: Map<string, Flush>; children: ReactNode }) {
  return <FlushContext.Provider value={map}>{children}</FlushContext.Provider>
}

function TestWizard() {
  const { date } = Route.useParams()
  const search = Route.useSearch()
  const t = useToday()
  const settings = useSettings()
  const tests = useLive(getTests, [])
  const [day, setDay] = useState<1 | 2>(search.day ?? 1)
  const [finished, setFinished] = useState<{ day: 1 | 2; levels: Map<string, number> } | null>(null)
  const flushes = useRef(new Map<string, Flush>()).current

  if (!settings || !tests) return <Screen title="Tortoise Test">{null}</Screen>
  if (!isLocalDate(date) || !settings.startDate) {
    return (
      <Screen title="Tortoise Test">
        <p>Start the plan first.</p>
      </Screen>
    )
  }
  const record = tests.find((x) => x.date === date)
  const previous = tests.filter((x) => x.date < date).at(-1)
  const week0 = planDayOf(settings.startDate, date).kind === 'week0'
  const defs = testsForDay(day).filter(
    (d) => !d.yearly || heightDue(tests, date) || record?.results.heightCm !== undefined,
  )

  if (finished) {
    return (
      <Screen title="Tortoise Test">
        <Card>
          <h2 className="font-semibold text-lg text-primary">Day {finished.day} saved</h2>
          {finished.levels.size > 0 && (
            <>
              <p className="mt-2 text-sm">The starting levels, from Week 0's results (plan §8):</p>
              <ul className="mt-1 list-inside list-disc text-sm" data-testid="start-levels">
                {[...finished.levels].map(([id, level]) => {
                  const ladder = laddersById.get(id)
                  const lv = ladder?.levels.find((l) => l.level === level)
                  return (
                    <li key={id}>
                      {ladder?.name}: {lv?.code} · {lv?.name}
                    </li>
                  )
                })}
              </ul>
            </>
          )}
          <div className="mt-4 flex gap-2">
            {finished.day === 1 && (
              <Button
                variant="quiet"
                onClick={() => {
                  setFinished(null)
                  setDay(2)
                }}
              >
                Go to Day 2
              </Button>
            )}
            <Link
              to="/progress"
              className="inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary"
            >
              See progress
            </Link>
          </div>
        </Card>
      </Screen>
    )
  }

  return (
    <Screen title="Tortoise Test">
      <div className="mb-3 grid grid-cols-2 gap-2" role="tablist" aria-label="Test day">
        {([1, 2] as const).map((d) => (
          <button
            key={d}
            type="button"
            role="tab"
            aria-selected={day === d}
            onClick={() => setDay(d)}
            className={cn(
              'min-h-11 rounded-xl border text-sm font-semibold',
              day === d ? 'border-primary bg-primary text-on-primary' : 'border-primary text-primary',
            )}
          >
            Day {d} · {d === 1 ? 'outdoors' : 'indoors'}
          </button>
        ))}
      </div>
      <p className="mb-3 text-sm">
        Rested, in the same conditions and the same order each time. Each card saves on its own; leave and
        come back any time.
      </p>
      <FlushProvider map={flushes}>
        <div className="space-y-3">
          {defs.map((def) => (
            <TestCard
              key={`${date}-${def.id}`}
              date={date}
              def={def}
              record={record}
              previous={previous}
              tests={tests}
            />
          ))}
          {week0 && day === 1 && <StartQuestions date={date} record={record} />}
        </div>
      </FlushProvider>
      <Button
        className="mt-4 min-h-14 w-full text-lg"
        onClick={async () => {
          for (const flush of [...flushes.values()]) await flush()
          const levels = await finishTestDay(date, day, { week0, today: t })
          setFinished({ day, levels })
        }}
      >
        Finish Day {day}
      </Button>
    </Screen>
  )
}

function TestCard({
  date,
  def,
  record,
  previous,
  tests,
}: {
  date: LocalDate
  def: TestDef
  record: TestRecord | undefined
  previous: TestRecord | undefined
  tests: TestRecord[]
}) {
  const results = record?.results ?? {}
  const fields = FIELDS[def.id] ?? []
  const [values, setValues] = useState<string[]>(() => fields.map((f) => String(f.get(results) ?? '')))
  const [saved, setSaved] = useState(false)
  const [dirty, setDirty] = useState(false)
  const set = (i: number, v: string) => {
    setSaved(false)
    setDirty(true)
    setValues(values.map((x, j) => (j === i ? v : x)))
  }
  const save = async (extra?: Patch) => {
    let patch: Patch = {}
    let merged: Results = { ...results }
    fields.forEach((f, i) => {
      const p = f.set(merged, parseNumber(values[i] ?? ''))
      merged = { ...merged, ...p }
      patch = { ...patch, ...p }
    })
    await saveTestResults(date, { results: { ...patch, ...extra } })
    setSaved(true)
    setDirty(false)
  }
  useFlush(def.id, dirty && fields.length > 0, () => save())

  return (
    <Card data-testid={`test-${def.id}`}>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg text-primary">{def.name}</h2>
        {saved && <Check aria-label="saved" className="size-5 text-primary" strokeWidth={3} />}
      </div>
      <p className="mt-1 text-sm">{def.how}</p>
      <p className="mt-1 text-sm text-primary-strong">Aim: {def.aim}</p>
      <div className="mt-3 space-y-3">
        {def.id === 'rockport' ? (
          <Rockport date={date} record={record} previous={previous} onSaved={() => setSaved(true)} />
        ) : def.id === 'sit-to-rise' ? (
          <SitToRise record={record} onSave={(sitRise) => save({ sitRise })} />
        ) : (
          <>
            {fields.map((f, i) => (
              <NumberField
                key={f.label}
                label={f.label}
                unit={f.unit}
                value={values[i] ?? ''}
                onChange={(v) => set(i, v)}
                previous={previous ? f.get(previous.results) : undefined}
                stopwatch={f.stopwatch}
              />
            ))}
            {def.id === 'height' && (
              <HeightCheck tests={tests} date={date} value={parseNumber(values[0] ?? '')} />
            )}
            <Button variant="quiet" onClick={() => void save()}>
              Save
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

function HeightCheck({
  tests,
  date,
  value,
}: {
  tests: TestRecord[]
  date: LocalDate
  value: number | undefined
}) {
  if (value === undefined) return null
  const earlier = tests
    .filter((t) => t.date < date)
    .flatMap((t) => (t.results.heightCm === undefined ? [] : [t.results.heightCm]))
  const loss = heightLoss(earlier, value)
  if (!loss)
    return <p className="text-sm">The first height record: later ones are compared with the tallest.</p>
  return loss.flag ? (
    <Banner tone="brick">
      {loss.lossCm} cm below the tallest earlier record. More than 2 cm means seeing a doctor.
    </Banner>
  ) : (
    <p className="text-sm">
      Change against the tallest earlier record: {loss.lossCm > 0 ? `−${loss.lossCm}` : '0'} cm.
    </p>
  )
}

function SitToRise({
  record,
  onSave,
}: {
  record: TestRecord | undefined
  onSave: (s: { sit: number; rise: number }) => Promise<void>
}) {
  const [sit, setSit] = useState(record?.results.sitRise?.sit ?? 0)
  const [rise, setRise] = useState(record?.results.sitRise?.rise ?? 0)
  // Untouched steppers read 10 points, so only a card that was touched is saved by "Finish".
  const [dirty, setDirty] = useState(false)
  const save = async () => {
    await onSave({ sit, rise })
    setDirty(false)
  }
  useFlush('sit-to-rise', dirty, save)
  return (
    <>
      <PointsStepper
        label="Sitting down"
        supports={sit}
        onChange={(n) => {
          setSit(n)
          setDirty(true)
        }}
      />
      <PointsStepper
        label="Standing up"
        supports={rise}
        onChange={(n) => {
          setRise(n)
          setDirty(true)
        }}
      />
      <p className="font-semibold" data-testid="sit-rise-score">
        Score: {Math.max(0, 5 - sit) + Math.max(0, 5 - rise)} of 10
      </p>
      <Button variant="quiet" onClick={() => void save()}>
        Save
      </Button>
    </>
  )
}

function Rockport({
  date,
  record,
  previous,
  onSaved,
}: {
  date: LocalDate
  record: TestRecord | undefined
  previous: TestRecord | undefined
  onSaved: () => void
}) {
  const settings = useSettings()
  const r = record?.results.rockport
  const [minutes, setMinutes] = useState(String(r?.minutes ?? ''))
  const [hr, setHr] = useState(String(r?.heartRate ?? ''))
  const [kg, setKg] = useState(String(r?.weightKg ?? settings?.profile.weightKg ?? ''))
  const [birthYear, setBirthYear] = useState(String(settings?.profile.birthYear ?? ''))
  const [sex, setSex] = useState<'male' | 'female' | undefined>(settings?.profile.sex)
  const needsProfile = settings?.profile.birthYear === undefined || !settings?.profile.sex
  const m = parseNumber(minutes)
  const h = parseNumber(hr)
  const w = parseNumber(kg)
  const by = parseNumber(birthYear)
  const preview =
    m && h && w && by && sex
      ? computeResults({ rockport: { minutes: m, heartRate: h, weightKg: w } }, { birthYear: by, sex }, date)
      : null
  const [dirty, setDirty] = useState(false)
  const touch =
    <T,>(f: (v: T) => void) =>
    (v: T) => {
      f(v)
      setDirty(true)
    }
  const save = async () => {
    if (needsProfile && by && sex)
      await saveSettings({ profile: { ...settings?.profile, birthYear: by, sex } })
    if (m && h && w)
      await saveTestResults(date, { results: { rockport: { minutes: m, heartRate: h, weightKg: w } } })
    setDirty(false)
    onSaved()
  }
  useFlush('rockport', dirty && !!m && !!h && !!w, save)

  return (
    <>
      <NumberField
        label="Time for the mile"
        unit="min"
        value={minutes}
        onChange={touch(setMinutes)}
        previous={previous?.results.rockport?.minutes}
        stopwatch={{ minutes: true }}
      />
      <NumberField label="Heart rate at the finish" unit="bpm" value={hr} onChange={touch(setHr)} />
      <PulseCount onBpm={(bpm) => touch(setHr)(String(bpm))} />
      <NumberField label="Weight" unit="kg" value={kg} onChange={touch(setKg)} />
      {needsProfile && (
        <div className="space-y-2 rounded-xl border border-line p-3">
          <p className="text-sm">The equation needs age and sex. They stay on this phone, in the profile.</p>
          <NumberField label="Birth year" unit="" value={birthYear} onChange={touch(setBirthYear)} />
          <fieldset className="flex gap-2">
            <legend className="mb-1 text-sm font-semibold">Sex</legend>
            {(['male', 'female'] as const).map((s) => (
              <Button
                key={s}
                variant={sex === s ? 'primary' : 'quiet'}
                onClick={() => touch(setSex)(s)}
                aria-pressed={sex === s}
              >
                {s === 'male' ? 'Male' : 'Female'}
              </Button>
            ))}
          </fieldset>
        </div>
      )}
      {preview?.vo2max !== undefined && (
        <p className="font-semibold" data-testid="vo2max">
          VO2max estimate: {preview.vo2max} mL/kg/min
          {preview.ageInRange === false && (
            <span className="block text-sm font-normal text-brick">
              The equation was built for ages 30 to 69, so read this estimate with care.
            </span>
          )}
        </p>
      )}
      <Button variant="quiet" disabled={!m || !h || !w} onClick={() => void save()}>
        Save
      </Button>
    </>
  )
}

/** Week 0 asks one start question (plan §8). */
function StartQuestions({ date, record }: { date: LocalDate; record: TestRecord | undefined }) {
  const [run, setRun] = useState(String(record?.start?.runMin ?? ''))
  const [saved, setSaved] = useState(false)
  const r = parseNumber(run)
  const [dirty, setDirty] = useState(false)
  const complete = r !== undefined
  const save = async () => {
    if (r === undefined) return
    await saveTestResults(date, { start: { runMin: r } })
    setSaved(true)
    setDirty(false)
  }
  useFlush('start-questions', dirty && complete, save)
  return (
    <Card data-testid="start-questions">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-lg text-primary">Start question</h2>
        {saved && <Check aria-label="saved" className="size-5 text-primary" strokeWidth={3} />}
      </div>
      <p className="mt-1 text-sm">With the results, it sets the starting levels at the end of Week 0.</p>
      <div className="mt-3 space-y-3">
        <NumberField
          label="How long is an easy run comfortable?"
          unit="min"
          value={run}
          onChange={(v) => {
            setRun(v)
            setDirty(true)
          }}
        />
        <Button variant="quiet" disabled={!complete} onClick={() => void save()}>
          Save
        </Button>
      </div>
    </Card>
  )
}
