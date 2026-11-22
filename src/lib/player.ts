// The session player's step engine (design §3.2, implementation Phase 4): a session, the current levels and the
// week's changes become a list of units the player runs one at a time. Pure functions, so the rules are unit-tested;
// the timers work from timestamps (`position`), so they catch up after the app comes back from the background.
import type { BlockRules, LadderLevel, Range, Repeats, Session, Step } from '@/data/schema'
import { adjustDose, type PlanDay } from './calendar'
import { exercisesById, laddersById, stepLevel, stepsFor } from './plan-view'
import type { LevelRecord, Variant } from './records'

export type UnitKind = 'reps' | 'hold' | 'interval' | 'timed' | 'stretch'

/** One exercise inside a unit; a pair (A1 with A2) has two. */
export interface UnitExercise {
  stepId: string
  label?: string
  exerciseId: string
  ladderId?: string
  level?: number
  levelCode?: string
  /** The exercise's name, or the ladder level's variant name. */
  name: string
  /** "Squat · L3", or the exercise's name. */
  title: string
  cue: string
  how: string
  note?: string
  /** The working range of a reps step: "8–12". */
  reps?: Range
  /** The dose as the plan writes it. */
  dose: string
}

export type SegmentKind = 'ready' | 'work' | 'rest' | 'switch'

export interface Segment {
  kind: SegmentKind
  seconds: number
  /** What the screen and the spoken cue say: "Run", "Walk", "Left side", "Rest". */
  label: string
  set?: number
  side?: 'left' | 'right'
}

export interface Unit {
  id: string
  kind: UnitKind
  part: Step['part']
  exercises: UnitExercise[]
  /** The target line: "3 × 8–12", "30 s per side", "8 × (1 min run, 2 min walk)". */
  target: string
  sets: number
  perSide: boolean
  /** Rest after each set (after each pair for a pair), in seconds. */
  restS: number
  /** A hold or stretch: seconds per set and side. Undefined for a hold to the maximum (a stopwatch). */
  holdS?: number
  /** A timed step: the planned minutes. */
  minutes?: Range
  /** The timeline of a hold, stretch or interval unit. */
  segments?: Segment[]
  /** "Too easy / Right / Too hard" after it (design §3.2): the main work, not warm-ups, cool-downs or stretches. */
  askFeedback: boolean
  /** Whether finishing it writes a log. */
  logged: boolean
}

/** The 3-2-1 lead-in before a timed set starts (design §3.2). */
export const READY_S = 3
/** The pause to change sides in a per-side hold (builder's ruling, D-040). */
export const SWITCH_S = 5
/** The rest between hold or stretch sets when the plan gives none (builder's ruling, D-040). */
export const DEFAULT_HOLD_REST_S = 30

export interface BuildInput {
  session: Session
  variant: Variant
  day: PlanDay
  levels: ReadonlyMap<string, LevelRecord>
  rules: BlockRules
}

/** The units of a session, in order, with the week's changes applied. */
export function buildUnits({ session, variant, day, levels, rules }: BuildInput): Unit[] {
  const steps = stepsFor(session, variant, day)
  const byId = new Map(steps.map((s) => [s.id, s]))
  const units: Unit[] = []
  const used = new Set<string>()
  for (const step of steps) {
    if (used.has(step.id)) continue
    used.add(step.id)
    const partner = step.pairedWith ? byId.get(step.pairedWith) : undefined
    const unit = unitFor(step, { session, variant, day, levels, rules })
    if (partner && !used.has(partner.id) && unit.kind === 'reps') {
      const other = unitFor(partner, { session, variant, day, levels, rules })
      if (other.kind === 'reps') {
        used.add(partner.id)
        units.push(pairUnits(unit, other))
        continue
      }
    }
    units.push(unit)
  }
  return units
}

function pairUnits(a: Unit, b: Unit): Unit {
  return {
    ...a,
    id: `${a.id}+${b.id}`,
    exercises: [...a.exercises, ...b.exercises],
    target: `${a.target} / ${b.target}`,
    sets: Math.max(a.sets, b.sets),
    // The plan: alternate A1 and A2, and rest after each pair. The rest is the pair's, whichever step carries it.
    restS: Math.max(a.restS, b.restS),
    askFeedback: a.askFeedback || b.askFeedback,
    logged: a.logged || b.logged,
  }
}

function unitFor(step: Step, input: BuildInput): Unit {
  const { session, day, levels, rules } = input
  const ladder = step.ladderId ? laddersById.get(step.ladderId) : undefined
  const level = ladder ? stepLevel(step, ladder, levels, day) : undefined
  const exercise = exerciseFor(step, level)
  const stage =
    day.intervalStage > 0 ? rules.intervalStages.find((s) => s.stage === day.intervalStage) : undefined
  const dose = adjustDose(step, session, day, rules, stage?.set.repeats)
  const mainWork = step.part === 'main' || step.part === 'playground'
  const base = {
    id: step.id,
    part: step.part,
    exercises: [exercise],
    perSide: !!(step.perSide || level?.pass.perSide),
    askFeedback: mainWork && session.kind !== 'morning',
    logged: mainWork || step.part === 'split',
  }

  // The interval session's main set follows the block's stage.
  if (step.intervalStage && stage) {
    const set: Repeats = { ...stage.set, repeats: dose.repeats ?? stage.set.repeats }
    return {
      ...base,
      kind: 'interval',
      target: repeatsText(set),
      sets: set.repeats,
      restS: set.restS,
      segments: repeatSegments(set),
      perSide: false,
    }
  }

  // Run–walk and rope steps: the level's work/rest pattern; past the ladder, a continuous time.
  if (ladder?.kind === 'endurance' && level) {
    const reps = level.pass.repeats
    if (reps) {
      const endurance = (session.kind === 'run' || session.kind === 'long') && step.part === 'main'
      const factor = endurance ? enduranceFactor(day, rules) : 1
      const set: Repeats = { ...reps, repeats: Math.max(1, Math.ceil(reps.repeats * factor)) }
      return {
        ...base,
        kind: 'interval',
        target: repeatsText(set),
        sets: set.repeats,
        restS: set.restS,
        segments: repeatSegments(set),
        perSide: false,
      }
    }
    const minutes = dose.minutes ?? (level.pass.minutes ? exact(level.pass.minutes) : undefined)
    return {
      ...base,
      kind: 'timed',
      target: minutes ? rangeText(minutes, 'min') : level.pass.text,
      sets: 1,
      restS: 0,
      minutes,
    }
  }

  // A step measured in minutes: a walk, a warm-up, the handstand practice.
  if (step.minutes) {
    const minutes = dose.minutes ?? step.minutes
    return { ...base, kind: 'timed', target: rangeText(minutes, 'min'), sets: 1, restS: 0, minutes }
  }

  const sets = dose.sets ?? step.sets ?? level?.pass.sets ?? 1
  const inSeconds = exercisesById.get(exercise.exerciseId)?.unit === 'seconds'

  // Holds: a level whose target is in seconds, or a step in seconds without reps (a dead hang to the maximum).
  // A level is a hold when its pass target is in seconds (core level 1, the dead bug, is reps; level 2 is a hold).
  const holdLevel = level ? level.pass.seconds !== undefined && level.pass.reps === undefined : false
  if (holdLevel || (!level && !step.reps && (step.seconds || inSeconds))) {
    const holdS = level?.pass.seconds ?? step.seconds?.max
    const stretch = step.part === 'split' || session.kind === 'split' || session.kind === 'light'
    const restS = step.restS ?? DEFAULT_HOLD_REST_S
    const perSide = base.perSide
    const target = holdS
      ? `${sets > 1 ? `${sets} × ` : ''}${holdS} s${perSide ? ' per side' : ''}`
      : `${sets} × max`
    return {
      ...base,
      kind: stretch ? 'stretch' : 'hold',
      target,
      sets,
      restS,
      holdS,
      segments: holdS ? holdSegments(sets, holdS, perSide, restS) : undefined,
    }
  }

  // Reps: a ladder's working range up to its pass number, or the step's own range.
  const reps = level?.pass.reps !== undefined ? workingRange(level.pass.reps) : step.reps
  exercise.reps = reps
  const target = reps
    ? `${sets} × ${rangeText(reps)}${base.perSide ? ' per side' : ''}${step.seconds ? ` · ${rangeText(step.seconds, 's')} hold` : ''}`
    : step.sets
      ? `${sets} × max`
      : step.dose
  return { ...base, kind: 'reps', target, sets, restS: step.restS ?? 0 }
}

function exerciseFor(step: Step, level: LadderLevel | undefined): UnitExercise {
  const exerciseId = level?.exerciseId ?? step.exerciseId ?? 'intervals'
  const ex = exercisesById.get(exerciseId)
  const ladder = step.ladderId ? laddersById.get(step.ladderId) : undefined
  const name = level?.name ?? ex?.name ?? (step.intervalStage ? 'Intervals' : exerciseId)
  return {
    stepId: step.id,
    label: step.label,
    exerciseId,
    ladderId: ladder?.id,
    level: level?.level,
    levelCode: level?.code,
    name,
    title: ladder && level ? `${ladder.name} · ${levelLabel(level.code)}` : name,
    cue: ex?.cue ?? '',
    how: ex?.how ?? '',
    note: step.note,
    dose: step.dose,
  }
}

/** Numeric level codes read "L1"; lettered ones stand alone ("H1", "Ba1"). */
export function levelLabel(code: string): string {
  return /^\d/.test(code) ? `L${code}` : code
}

/** A level's working range: about a third below the pass number, up to it (plan §7). */
export function workingRange(passReps: number): Range {
  return { min: Math.max(1, Math.round((passReps * 2) / 3)), max: passReps }
}

function enduranceFactor(day: PlanDay, rules: BlockRules): number {
  const halfVolume = day.kind === 'week0' && rules.week0.halfVolumeDays.includes(day.weekday)
  if (halfVolume) return rules.week0.enduranceFactor
  if (day.isLight) return rules.light.enduranceFactor
  return 1
}

function exact(n: number): Range {
  return { min: n, max: n }
}

export function rangeText(r: Range, unit?: string): string {
  const n = r.min === r.max ? `${r.min}` : `${r.min}–${r.max}`
  return unit ? `${n} ${unit}` : n
}

function secondsText(s: number): string {
  if (s % 60 === 0) return `${s / 60} min`
  if (s > 60) return `${Math.floor(s / 60)} min ${s % 60} s`
  return `${s} s`
}

export function repeatsText(r: Repeats): string {
  const work = `${secondsText(r.workS)}${r.workLabel ? ` ${r.workLabel}` : ''}`
  if (r.restS === 0) return `${r.repeats} × ${work}`
  const rest = `${secondsText(r.restS)}${r.restLabel ? ` ${r.restLabel}` : ''}`
  return `${r.repeats} × (${work}, ${rest})`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** Work/rest cycles after a 3-2-1 lead-in; no rest after the last one. */
export function repeatSegments(r: Repeats): Segment[] {
  const out: Segment[] = [{ kind: 'ready', seconds: READY_S, label: 'Get ready' }]
  for (let i = 1; i <= r.repeats; i++) {
    out.push({ kind: 'work', seconds: r.workS, label: cap(r.workLabel ?? 'work'), set: i })
    if (i < r.repeats && r.restS > 0) {
      out.push({ kind: 'rest', seconds: r.restS, label: cap(r.restLabel ?? 'rest'), set: i })
    }
  }
  return out
}

/** Hold sets, each side in turn for a per-side hold, with a rest between sets. */
export function holdSegments(sets: number, holdS: number, perSide: boolean, restS: number): Segment[] {
  const out: Segment[] = [{ kind: 'ready', seconds: READY_S, label: 'Get ready' }]
  for (let i = 1; i <= sets; i++) {
    if (perSide) {
      out.push({ kind: 'work', seconds: holdS, label: 'Left side', set: i, side: 'left' })
      out.push({ kind: 'switch', seconds: SWITCH_S, label: 'Change sides', set: i })
      out.push({ kind: 'work', seconds: holdS, label: 'Right side', set: i, side: 'right' })
    } else {
      out.push({ kind: 'work', seconds: holdS, label: 'Hold', set: i })
    }
    if (i < sets && restS > 0) out.push({ kind: 'rest', seconds: restS, label: 'Rest', set: i })
  }
  return out
}

export interface Position {
  index: number
  segment: Segment
  /** Milliseconds left in the current segment. */
  remainingMs: number
  /** True once the whole timeline has run. */
  done: boolean
  /** Seconds of work completed, the current segment included up to now. */
  workS: number
}

/** Where a timeline stands after elapsedMs. From timestamps, so a phone back from the background lands right. */
export function position(segments: readonly Segment[], elapsedMs: number): Position {
  let t = Math.max(0, elapsedMs)
  let workS = 0
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i] as Segment
    const len = seg.seconds * 1000
    if (t < len) {
      if (seg.kind === 'work') workS += t / 1000
      return { index: i, segment: seg, remainingMs: len - t, done: false, workS }
    }
    if (seg.kind === 'work') workS += seg.seconds
    t -= len
  }
  const last = segments.at(-1) as Segment
  return { index: segments.length - 1, segment: last, remainingMs: 0, done: true, workS }
}

export function totalSeconds(segments: readonly Segment[]): number {
  return segments.reduce((n, s) => n + s.seconds, 0)
}

/** Elapsed time on a clock that can be paused: the time since start, minus the paused spans. */
export interface Clock {
  startedAt: number
  pausedAt: number | null
  pausedMs: number
}

export function startClock(now: number): Clock {
  return { startedAt: now, pausedAt: null, pausedMs: 0 }
}

export function elapsedMs(c: Clock, now: number): number {
  const end = c.pausedAt ?? now
  return Math.max(0, end - c.startedAt - c.pausedMs)
}

export function pauseClock(c: Clock, now: number): Clock {
  return c.pausedAt === null ? { ...c, pausedAt: now } : c
}

export function resumeClock(c: Clock, now: number): Clock {
  return c.pausedAt === null ? c : { ...c, pausedAt: null, pausedMs: c.pausedMs + (now - c.pausedAt) }
}

/** "4:05" or "1:02:03". */
export function clockText(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000 - 1e-9))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

/** What spoken coaching says at the start of a step: the exercise, the target in words, and the key cue. */
export function coachingText(unit: Unit): string {
  const names = unit.exercises.map((e) => e.title.replace(/ · /g, ', ')).join(', then ')
  const target = unit.target
    .replace(/×/g, 'times')
    .replace(/(\d)–(\d)/g, '$1 to $2')
    .replace(/\bs\b/g, 'seconds')
    .replace(/\bmin\b/g, 'minutes')
    .replace(/ \/ /g, ', and ')
  const cue = unit.exercises[0]?.cue
  return `${names}. ${target}.${cue ? ` ${cue}.` : ''}`
}
