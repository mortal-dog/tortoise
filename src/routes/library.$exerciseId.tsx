import { createFileRoute, Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { ChevronLeft, CirclePlay, ExternalLink } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { Button, Card, Screen } from '@/components/ui'
import { exerciseById } from '@/data/plan'
import type { Exercise, Ladder, LadderLevel } from '@/data/schema'
import { cn } from '@/lib/cn'
import { formatShort } from '@/lib/dates'
import {
  areaHeading,
  historyOf,
  isYouTube,
  laddersOf,
  setsText,
  sourcesOf,
  withoutCitations,
} from '@/lib/library'
import { useLive } from '@/lib/live'
import { currentLevel, laddersById } from '@/lib/plan-view'
import type { LevelRecord, LogRecord } from '@/lib/records'
import { getAllLogs, getLevels, setLevel } from '@/lib/repo'
import { planDayOf, useSettings, useToday } from '@/lib/use-app'

export const Route = createFileRoute('/library/$exerciseId')({
  component: ExercisePage,
})

function ExercisePage() {
  const { exerciseId } = Route.useParams()
  const exercise = exerciseById.get(exerciseId)
  if (!exercise) {
    return (
      <Screen title="Library" action={<BackLink />}>
        <p>This exercise is not in the library.</p>
      </Screen>
    )
  }
  return <ExerciseDetail exercise={exercise} />
}

function ExerciseDetail({ exercise: e }: { exercise: Exercise }) {
  const logs = useLive(getAllLogs, [])
  const levels = useLive(getLevels, []) ?? new Map<string, LevelRecord>()
  const ladders = laddersOf(e.id)
  const sources = sourcesOf(e.sources)

  return (
    <Screen title={e.name} action={<BackLink />}>
      <p className="-mt-3 mb-4 text-sm font-semibold text-primary-strong">{areaHeading(e.area)}</p>
      <div className="space-y-4">
        <Card>
          <Text label="How">{e.how}</Text>
          <Text label="Key cue">{e.cue}</Text>
          <Text label="Common mistake" tone="brick">
            {e.mistake}
          </Text>
          <Text label="Why">{withoutCitations(e.why)}</Text>
          {sources.length > 0 && <SourceChips ids={sources.map((s) => s.id)} />}
        </Card>

        {e.video && <VideoCard video={e.video} />}

        {ladders.map((l) => (
          <LadderCard key={l.id} ladder={l} exerciseId={e.id} levels={levels} />
        ))}

        <HistoryCard logs={logs ? historyOf(logs, e.id) : undefined} />
      </div>
    </Screen>
  )
}

function Text({ label, tone, children }: { label: string; tone?: 'brick'; children: ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <h2 className={cn('text-sm font-semibold', tone === 'brick' ? 'text-brick' : 'text-primary')}>
        {label}
      </h2>
      <p>{children}</p>
    </div>
  )
}

function SourceChips({ ids }: { ids: string[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-2" aria-label="Sources">
      {ids.map((id) => (
        <li key={id}>
          <Link
            to="/library/sources/$sourceId"
            params={{ sourceId: id }}
            className="inline-flex min-h-11 items-center rounded-full border border-primary px-3 text-sm font-semibold text-primary"
          >
            {id}
          </Link>
        </li>
      ))}
    </ul>
  )
}

function VideoCard({ video }: { video: NonNullable<Exercise['video']> }) {
  const youtube = isYouTube(video.url)
  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-primary">{youtube ? 'Video' : 'Guide'}</h2>
      <a
        href={video.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-h-11 items-start gap-3 rounded-xl border border-sky p-3"
      >
        <CirclePlay aria-hidden className="mt-0.5 size-6 shrink-0 text-sky" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{video.title}</span>
          <span className="block text-sm text-primary-strong">
            {video.channel} · {youtube ? 'YouTube' : 'web page'}
          </span>
        </span>
        <ExternalLink aria-hidden className="mt-0.5 size-5 shrink-0 text-sky" />
      </a>
      <p className="mt-2 text-sm text-primary-strong">
        Opens outside the app and needs the network. Link checked on {video.checked}.
      </p>
    </Card>
  )
}

function LadderCard({
  ladder,
  exerciseId,
  levels,
}: {
  ladder: Ladder
  exerciseId: string
  levels: ReadonlyMap<string, LevelRecord>
}) {
  const settings = useSettings()
  const t = useToday()
  const pd = settings?.startDate ? planDayOf(settings.startDate, t) : undefined
  const current = currentLevel(ladder, levels, pd)
  const [asking, setAsking] = useState<LadderLevel | null>(null)
  const sources = sourcesOf([...ladder.sources, ...ladder.levels.flatMap((lv) => lv.sources)])

  return (
    <Card data-testid={`ladder-${ladder.id}`}>
      <h2 className="font-semibold text-primary">
        {ladder.name} ladder <span className="text-sm text-primary-strong">(plan §{ladder.section})</span>
      </h2>
      <p className="mb-2 text-sm">
        Your level: <span className="font-semibold">{levelLabel(current.code)}</span>
      </p>
      {pd?.kind === 'week0' && (
        <p className="mb-2 text-sm text-primary-strong">In Week 0 every ladder runs at level 1 (plan §8).</p>
      )}
      <ol className="space-y-1">
        {ladder.levels.map((lv) => {
          const isCurrent = lv.level === current.level
          const mine = lv.exerciseId === exerciseId
          return (
            <li
              key={lv.level}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex items-start gap-3 rounded-xl border p-2',
                isCurrent ? 'border-primary bg-background' : 'border-transparent',
              )}
            >
              <span
                className={cn(
                  'flex min-h-7 min-w-9 shrink-0 items-center justify-center rounded-lg px-1 text-sm font-semibold',
                  isCurrent ? 'bg-primary text-on-primary' : 'border border-line text-primary',
                )}
              >
                {lv.code}
              </span>
              <span className="min-w-0 flex-1 text-sm">
                <span className={cn('block', mine && 'font-semibold')}>{lv.name}</span>
                <span className="block text-primary-strong">Pass at {lv.pass.text}</span>
                {isCurrent && <span className="block font-semibold text-primary">Your level</span>}
              </span>
              {!isCurrent && (
                <button
                  type="button"
                  onClick={() => setAsking(lv)}
                  aria-label={`Set ${lv.code} as my level`}
                  className="min-h-11 shrink-0 rounded-lg px-2 text-sm font-semibold text-primary"
                >
                  Set
                </button>
              )}
            </li>
          )
        })}
      </ol>
      {asking && (
        <div role="alertdialog" aria-label="Change level" className="mt-3 rounded-xl border border-shell p-3">
          <p className="mb-2 text-sm">
            Set the {ladder.name.toLowerCase()} ladder to {asking.code}, {asking.name}? The plan suggests a
            level from your logs; setting one by hand is for starting higher or stepping back.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                void setLevel(ladder.id, asking.level, t)
                setAsking(null)
              }}
            >
              Set {asking.code}
            </Button>
            <Button variant="quiet" onClick={() => setAsking(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
      {ladder.note && <p className="mt-3 text-sm">{withoutCitations(ladder.note)}</p>}
      {sources.length > 0 && <SourceChips ids={sources.map((s) => s.id)} />}
    </Card>
  )
}

function HistoryCard({ logs }: { logs: LogRecord[] | undefined }) {
  return (
    <Card>
      <h2 className="mb-2 font-semibold text-primary">Last 10 logs</h2>
      {!logs ? null : logs.length === 0 ? (
        <p className="text-sm">No logs yet. The session player records each set.</p>
      ) : (
        <ul className="divide-y divide-line text-sm" data-testid="history">
          {logs.map((l) => (
            <li key={l.id} className="flex flex-wrap items-baseline gap-x-3 py-2">
              <span className="font-semibold">{formatShort(l.date)}</span>
              {l.level !== undefined && <span className="text-primary-strong">{logLevel(l)}</span>}
              <span>{setsText(l)}</span>
              {l.feedback && <span className="text-primary-strong">felt {l.feedback}</span>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

/** Numeric level codes read "L1"; lettered ones (H1, S1, P1, Ba1) stand alone, as on the Today cards. */
function levelLabel(code: string): string {
  return /^\d/.test(code) ? `L${code}` : code
}

function logLevel(log: LogRecord): string {
  const code = log.ladderId
    ? laddersById.get(log.ladderId)?.levels.find((lv) => lv.level === log.level)?.code
    : undefined
  return code ? levelLabel(code) : `Level ${log.level}`
}

/** Back to the list: the browser's back keeps the search and filters; a page opened directly links to the list. */
function BackLink() {
  const router = useRouter()
  const canGoBack = useCanGoBack()
  return (
    <Link
      to="/library"
      onClick={(ev) => {
        if (!canGoBack) return
        ev.preventDefault()
        router.history.back()
      }}
      aria-label="Back to the library"
      className="inline-flex min-h-11 items-center gap-1 rounded-xl border border-line px-3 text-sm font-semibold text-primary"
    >
      <ChevronLeft aria-hidden className="size-4" /> Library
    </Link>
  )
}
