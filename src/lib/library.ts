// The library's rules as pure functions (design §3.6): search and filters over the exercises, the ladders an exercise
// belongs to, its sources, and how a logged exercise reads in its history.
import { plan } from '@/data/plan'
import type { Area, Exercise, Ladder, Source } from '@/data/schema'
import type { LogRecord } from './records'

/** The areas in the order of the plan's Appendix A, with its headings and a short chip label. */
export const AREAS: readonly { id: Area; label: string; heading: string }[] = [
  { id: 'spine', label: 'Spine', heading: 'Spine and posture' },
  { id: 'handstand', label: 'Handstand', heading: 'Wrists and handstand' },
  { id: 'strength', label: 'Strength', heading: 'Strength' },
  { id: 'cardio', label: 'Cardio', heading: 'Jumps, rope and running' },
  { id: 'playground', label: 'Playground', heading: 'Playground' },
  { id: 'splits', label: 'Splits', heading: 'Splits and flexibility' },
]

export function areaHeading(area: Area): string {
  return AREAS.find((a) => a.id === area)?.heading ?? area
}

export interface LibraryFilter {
  query?: string
  area?: Area
  /** Only exercises with a teaching link. */
  video?: boolean
}

/** Lower case, accents and punctuation dropped: "Cat–camel" and "cat camel" read the same. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

/** The ladder levels that use each exercise, so a search for "pistol" or "archer" finds the base exercise. */
const levelNames: ReadonlyMap<string, string[]> = (() => {
  const m = new Map<string, string[]>()
  for (const l of plan.ladders) {
    for (const lv of l.levels) m.set(lv.exerciseId, [...(m.get(lv.exerciseId) ?? []), lv.name, l.name])
  }
  return m
})()

/**
 * The exercises that match a filter. Every word of the query must appear in the exercise's name, texts or ladder
 * level names. Name matches come first; otherwise the plan's order is kept.
 */
export function searchExercises(exercises: readonly Exercise[], filter: LibraryFilter): Exercise[] {
  const words = normalize(filter.query ?? '')
    .split(' ')
    .filter(Boolean)
  const scored: { e: Exercise; rank: number; i: number }[] = []
  for (const [i, e] of exercises.entries()) {
    if (filter.area && e.area !== filter.area) continue
    if (filter.video && !e.video) continue
    if (words.length === 0) {
      scored.push({ e, rank: 0, i })
      continue
    }
    const name = normalize(e.name)
    const all = normalize([e.name, e.how, e.cue, e.mistake, e.why, ...(levelNames.get(e.id) ?? [])].join(' '))
    if (!words.every((w) => all.includes(w))) continue
    scored.push({ e, rank: words.every((w) => name.includes(w)) ? 0 : 1, i })
  }
  return scored.sort((a, b) => a.rank - b.rank || a.i - b.i).map((s) => s.e)
}

/** The ladders with a level that uses this exercise. */
export function laddersOf(exerciseId: string): Ladder[] {
  return plan.ladders.filter((l) => l.levels.some((lv) => lv.exerciseId === exerciseId))
}

const sourceById: ReadonlyMap<string, Source> = new Map(plan.sources.map((s) => [s.id, s]))

export function sourceOf(id: string): Source | undefined {
  return sourceById.get(id)
}

/** The sources an exercise names, in order, without repeats. */
export function sourcesOf(ids: readonly string[]): Source[] {
  return [...new Set(ids)].map((id) => sourceById.get(id)).filter((s): s is Source => !!s)
}

/** The exercises and ladders that cite a source, for its detail view. */
export function citedBy(sourceId: string): { exercises: Exercise[]; ladders: Ladder[] } {
  return {
    exercises: plan.exercises.filter((e) => e.sources.includes(sourceId)),
    ladders: plan.ladders.filter(
      (l) => l.sources.includes(sourceId) || l.levels.some((lv) => lv.sources.includes(sourceId)),
    ),
  }
}

/** A text without its bracketed citations, which the page shows as chips instead. */
export function withoutCitations(text: string): string {
  return text
    .replace(/ ?\[[a-z][a-z0-9]*(?:, [a-z][a-z0-9]*)*\]/g, '')
    .replace(/ +([.;,])/g, '$1')
    .trim()
}

/** A teaching link opens YouTube, or a health body's page. */
export function isYouTube(url: string): boolean {
  return /^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/.test(url)
}

/** The logs of one exercise, newest first, at most `limit`. */
export function historyOf(logs: readonly LogRecord[], exerciseId: string, limit = 10): LogRecord[] {
  return logs
    .filter((l) => l.exerciseId === exerciseId)
    .sort((a, b) =>
      a.date === b.date ? b.updatedAt.localeCompare(a.updatedAt) : b.date.localeCompare(a.date),
    )
    .slice(0, limit)
}

/** How a log's sets read: "3 × 10", "12, 10, 9", "3 × 30 s", with the weight when one was logged. */
export function setsText(log: LogRecord): string {
  const parts = log.sets.map((s) => {
    const amount = s.seconds !== undefined ? `${s.seconds} s` : s.reps !== undefined ? `${s.reps}` : '—'
    return s.kg !== undefined ? `${amount} @ ${s.kg} kg` : amount
  })
  if (parts.length === 0) return 'No sets'
  const first = parts[0] as string
  return parts.every((p) => p === first) && parts.length > 1 ? `${parts.length} × ${first}` : parts.join(', ')
}
