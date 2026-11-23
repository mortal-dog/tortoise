// Lookups and display helpers over the plan data, shared by the screens.
import { plan } from '@/data/plan'
import type { Exercise, Ladder, LadderLevel, Session, Step } from '@/data/schema'
import type { PlanDay } from './calendar'
import type { LevelRecord, Variant } from './records'

export const sessionsById: ReadonlyMap<string, Session> = new Map(plan.sessions.map((s) => [s.id, s]))
export const laddersById: ReadonlyMap<string, Ladder> = new Map(plan.ladders.map((l) => [l.id, l]))
export const exercisesById: ReadonlyMap<string, Exercise> = new Map(plan.exercises.map((e) => [e.id, e]))

export function sessionOf(id: string): Session {
  const s = sessionsById.get(id)
  if (!s) throw new Error(`unknown session ${id}`)
  return s
}

export function kindOf(id: string): Session['kind'] | undefined {
  return sessionsById.get(id)?.kind
}

/** The current level of a ladder: level 1 in Week 0 (plan §8) or when nothing is stored yet. */
export function currentLevel(
  ladder: Ladder,
  levels: ReadonlyMap<string, LevelRecord>,
  day?: PlanDay,
): LadderLevel {
  const n = day?.kind === 'week0' ? 1 : (levels.get(ladder.id)?.level ?? 1)
  return ladder.levels.find((l) => l.level === n) ?? (ladder.levels[0] as LadderLevel)
}

/** The level a step works at: the ladder's current level, raised by the step's offset and capped at the top. */
export function stepLevel(
  step: Step,
  ladder: Ladder,
  levels: ReadonlyMap<string, LevelRecord>,
  day?: PlanDay,
): LadderLevel {
  const base = currentLevel(ladder, levels, day)
  if (!step.levelOffset) return base
  const top = ladder.levels.at(-1) as LadderLevel
  return ladder.levels.find((l) => l.level === base.level + (step.levelOffset ?? 0)) ?? top
}

/** The steps a variant uses: untagged steps and the variant's own. */
export function stepsFor(session: Session, variant: Variant, day?: PlanDay): Step[] {
  return session.steps.filter(
    (s) =>
      (!s.variant || s.variant === variant) &&
      (s.fromBlock === undefined || (day?.block ?? 0) >= s.fromBlock),
  )
}

/** A step's short name for a card: a ladder with its level ("Squat L1"), or the exercise's name. */
export function stepName(step: Step, levels: ReadonlyMap<string, LevelRecord>, day?: PlanDay): string {
  if (step.ladderId) {
    const ladder = laddersById.get(step.ladderId)
    if (!ladder) return step.ladderId
    const code = stepLevel(step, ladder, levels, day).code
    // Numeric codes read "L1"; lettered ones (H1, S1, P1, R1, J1, G1, Ba1) stand alone.
    return `${ladder.name} ${/^\d/.test(code) ? `L${code}` : code}`
  }
  if (step.exerciseId) return exercisesById.get(step.exerciseId)?.name ?? step.exerciseId
  return 'Intervals'
}

/** The main work of a session, without warm-up and cool-down, as short names. */
export function sessionSummary(
  session: Session,
  variant: Variant,
  levels: ReadonlyMap<string, LevelRecord>,
  day?: PlanDay,
): string[] {
  const steps = stepsFor(session, variant, day)
  const main = steps.filter((s) => s.part === 'main' || s.part === 'split')
  const names = (main.length ? main : steps).map((s) => stepName(s, levels, day))
  return [...new Set(names)]
}

export function minutesText(r: { min: number; max: number }): string {
  return r.min === r.max ? `${r.min} min` : `${r.min}–${r.max} min`
}

/** The ladders a day's sessions use, for level-up suggestions. */
export function laddersIn(sessions: readonly Session[]): Ladder[] {
  const ids = new Set(
    sessions.flatMap((s) => s.steps.map((st) => st.ladderId).filter((x): x is string => !!x)),
  )
  return [...ids].map((id) => laddersById.get(id)).filter((l): l is Ladder => !!l)
}

export function testsForDay(day: 1 | 2) {
  return plan.tests.filter((t) => t.day === day).sort((a, b) => a.order - b.order)
}

/** The split kind a split session records (the week template's split sessions, plan §6.9). */
export function splitKind(sessionId: string): 'front' | 'side' | 'both' | 'long' {
  const kinds: Record<string, 'front' | 'side' | 'both' | 'long'> = {
    'split-front': 'front',
    'split-side': 'side',
    'split-short': 'both',
    light: 'long',
  }
  return kinds[sessionId] ?? 'both'
}

export const TEST_SESSION_ID = { 1: 'test-day-1', 2: 'test-day-2' } as const

/** One exercise of a day's part, as the day page lists it (D-057). */
export interface DayItem {
  stepId: string
  label?: string
  /** The step's name: the ladder and its level ("Squat L3"), the exercise, or "Intervals". */
  name: string
  /** The variant or exercise the video shows, with its link. */
  exercise: string
  videoUrl?: string
  dose: string
  /** Past days and today: whether the step was done. Undefined for a day still to come. */
  done?: boolean
}

/**
 * The exercises of one part of a day, with what was done (D-057). A part record with `steps` counts only those steps
 * (the player's finished steps); one without (a "Done as planned" tap) counts every step; no record counts none.
 */
export function dayItems(
  session: Session,
  variant: Variant,
  levels: ReadonlyMap<string, LevelRecord>,
  day: PlanDay | undefined,
  record: { doneAt: string; steps?: string[] } | null | undefined,
  marked: boolean,
): DayItem[] {
  return stepsFor(session, variant, day).map((step) => {
    const ladder = step.ladderId ? laddersById.get(step.ladderId) : undefined
    const level = ladder ? stepLevel(step, ladder, levels, day) : undefined
    const ex = exercisesById.get(level?.exerciseId ?? step.exerciseId ?? '')
    const done = !record ? false : record.steps ? record.steps.includes(step.id) : true
    return {
      stepId: step.id,
      ...(step.label ? { label: step.label } : {}),
      name: stepName(step, levels, day),
      exercise: level?.name ?? ex?.name ?? 'Intervals',
      ...(ex?.video ? { videoUrl: ex.video.url } : {}),
      dose: step.dose,
      ...(marked ? { done } : {}),
    }
  })
}
