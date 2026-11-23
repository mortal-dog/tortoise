// The plan content model (design §7): zod schemas for the plan as data. The data lives in the files next to this one
// and is validated by these schemas in the content tests and at start-up.
//
// Evidence rule (D-018): any object holding a digit in its text names a source (`sources`) or carries `ourRule: true`,
// on itself or inherited from an enclosing object. A `why` text with a digit needs its own `sources` or `ourRule`.
import { z } from 'zod'

export const Weekday = z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'])
export type Weekday = z.infer<typeof Weekday>
export const WEEKDAYS: readonly Weekday[] = Weekday.options

/** Evidence fields carried by most content objects. */
const evidence = {
  sources: z.array(z.string()).default([]),
  ourRule: z.boolean().optional(),
}

/** An inclusive range; min equals max for a single number. */
export const Range = z
  .object({ min: z.number().nonnegative(), max: z.number().nonnegative() })
  .refine((r) => r.min <= r.max, 'min must not exceed max')
export type Range = z.infer<typeof Range>

export const Source = z.object({
  id: z.string().regex(/^[a-z][a-z0-9]*$/),
  citation: z.string().min(10),
  url: z.url(),
  finding: z.string().min(10),
})
export type Source = z.infer<typeof Source>

/**
 * A teaching video (D-056, D-060): a YouTube watch link, played in the app's embedded player after a tap, recorded with the title and channel
 * exactly as YouTube's oEmbed returned them. `checked` is the day its frames were looked at and its oEmbed answered.
 */
export const VideoLink = z.object({
  url: z.string().regex(/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]{11}$/),
  title: z.string().min(1),
  channel: z.string().min(1),
  checked: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type VideoLink = z.infer<typeof VideoLink>

export const Area = z.enum(['spine', 'strength', 'handstand', 'splits', 'cardio'])
export type Area = z.infer<typeof Area>

/** An exercise is a well-known name and a video (D-056); the plan's sessions and ladders say what to do with it. */
export const Exercise = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  area: Area,
  unit: z.enum(['reps', 'seconds', 'minutes']),
  /** None only for the everyday movements (exercises.ts NO_VIDEO). */
  video: VideoLink.optional(),
})
export type Exercise = z.infer<typeof Exercise>

/** A work/rest structure: run–walk and rope steps, interval stages. */
export const Repeats = z.object({
  repeats: z.number().int().positive(),
  workS: z.number().positive(),
  restS: z.number().nonnegative(),
  workLabel: z.string().optional(),
  restLabel: z.string().optional(),
})
export type Repeats = z.infer<typeof Repeats>

/** What a level asks for to pass. Sets × reps, sets × seconds, a continuous time, or repeats. */
export const Target = z.object({
  sets: z.number().int().positive().optional(),
  reps: z.number().int().positive().optional(),
  seconds: z.number().positive().optional(),
  minutes: z.number().positive().optional(),
  perSide: z.boolean().optional(),
  repeats: Repeats.optional(),
  /** The plan's own words for the pass target, as in the ladder table. */
  text: z.string(),
})
export type Target = z.infer<typeof Target>

export const LadderLevel = z.object({
  /** 1, 2, 3 … in order. */
  level: z.number().int().positive(),
  /** The plan's label: "1", "H1", "S1", "P1", "R1", "J1", "G1", "Ba1". */
  code: z.string(),
  exerciseId: z.string(),
  /** The variant as the ladder table names it. */
  name: z.string(),
  pass: Target,
  ...evidence,
})
export type LadderLevel = z.infer<typeof LadderLevel>

export const Ladder = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  /** How the pass rule reads (design §5.3): reps, holds, endurance steps (by tap), or a skill. */
  kind: z.enum(['reps', 'hold', 'endurance', 'skill']),
  /** The plan section, e.g. "7.1". */
  section: z.string(),
  levels: z.array(LadderLevel).min(1),
  note: z.string().optional(),
  ...evidence,
})
export type Ladder = z.infer<typeof Ladder>

export const Pillar = z.enum(['strength', 'aerobic', 'skills', 'mobility'])
export type Pillar = z.infer<typeof Pillar>

export const Step = z
  .object({
    /** Unique within its session. */
    id: z.string(),
    /** The slot label of the plan's table: "A0", "A1", "B2", "D"; or a number for the morning block. */
    label: z.string().optional(),
    part: z.enum(['warmup', 'main', 'cooldown', 'split']),
    ladderId: z.string().optional(),
    exerciseId: z.string().optional(),
    /** The interval session's main set, which follows the block's interval stage (block rules). */
    intervalStage: z.boolean().optional(),
    sets: z.number().int().positive().optional(),
    reps: Range.optional(),
    seconds: Range.optional(),
    minutes: Range.optional(),
    perSide: z.boolean().optional(),
    restS: z.number().nonnegative().optional(),
    /** The id of the step done alternately with this one (A1 with A2). */
    pairedWith: z.string().optional(),
    /** Levels above the ladder's current level ("one variant harder than Monday's"), capped at the top level. */
    levelOffset: z.number().int().positive().optional(),
    /** A step for one variant only; steps without it are in both. */
    variant: z.enum(['outdoor', 'indoor']).optional(),
    /** A step that starts in a later block (strides from Block 2). */
    fromBlock: z.number().int().positive().optional(),
    /** The dose as the plan's table writes it: "3 × 8–12", "30 s per side". */
    dose: z.string(),
    why: z.string().optional(),
    /** The plan's own words around the step that the dose cannot hold: a fallback, a condition, a later form. */
    note: z.string().optional(),
    ...evidence,
  })
  .refine(
    (s) => [s.ladderId, s.exerciseId, s.intervalStage].filter(Boolean).length === 1,
    'a step names exactly one of ladderId, exerciseId or intervalStage',
  )
export type Step = z.infer<typeof Step>

export const SessionKind = z.enum(['morning', 'strength', 'run', 'intervals', 'long', 'light', 'split'])
export type SessionKind = z.infer<typeof SessionKind>

export const Session = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  kind: SessionKind,
  /** The plan section, e.g. "6.3". */
  section: z.string(),
  /** Total minutes, warm-up included, as a range. */
  minutes: Range,
  /** Planned minutes per pillar for "Done as planned" (design §8); they add up to the middle of `minutes`. */
  pillars: z.record(Pillar, z.number().nonnegative()),
  /** Run days have an outdoor and an indoor variant. */
  hasVariants: z.boolean().default(false),
  steps: z.array(Step).min(1),
  ...evidence,
})
export type Session = z.infer<typeof Session>

export const DayTemplate = z.object({
  morning: z.string(),
  main: z.string(),
  /** The split block session; null on Sunday, where the split work is inside the Light session. */
  split: z.string().nullable(),
  /** The day's total in the plan's week table (§5), as a range of minutes. */
  expectedMinutes: Range,
})
export type DayTemplate = z.infer<typeof DayTemplate>

export const WeekTemplate = z.record(Weekday, DayTemplate)
export type WeekTemplate = z.infer<typeof WeekTemplate>

export const IntervalStage = z.object({
  stage: z.number().int().min(1).max(4),
  /** The first block of this stage; stage 4 holds from Block 4 onward. */
  fromBlock: z.number().int().positive(),
  set: Repeats,
  text: z.string(),
  ...evidence,
})
export type IntervalStage = z.infer<typeof IntervalStage>

export const BlockRules = z.object({
  blockWeeks: z.number().int().positive(),
  lightWeekInBlock: z.number().int().positive(),
  week0: z.object({
    halfVolumeDays: z.array(Weekday),
    setsFactor: z.number(),
    enduranceFactor: z.number(),
    intervalRepsFactor: z.number(),
    allLevelsOne: z.boolean(),
  }),
  ramp: z.object({ weeks: z.array(z.number().int().positive()), strengthSets: z.number().int().positive() }),
  light: z.object({
    strengthSetsDelta: z.number().int(),
    minStrengthSets: z.number().int().positive(),
    enduranceFactor: z.number(),
    intervalRepsFactor: z.number(),
  }),
  intervalStages: z.array(IntervalStage).length(4),
  ...evidence,
})
export type BlockRules = z.infer<typeof BlockRules>

/** What a milestone measures. The milestone engine knows each one; `level` reads the milestone's own ladder. */
export const Metric = z.enum([
  'noMissDays', // days in a row with none missed (Hatchling)
  'streak', // the tortoise streak
  'outdoorSessions',
  'runKm',
  'continuousRunKm',
  'longRunMin',
  'splitBlocks', // split blocks done
  'level', // the highest level ever reached on the milestone's ladder (D-067)
])
export type Metric = z.infer<typeof Metric>

export const Milestone = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  group: z.enum(['habit', 'ability']),
  kind: z.enum(['streak', 'count', 'log', 'level']),
  metric: Metric,
  /** The ladder a `level` milestone reads; its threshold is that ladder's level number. */
  ladderId: z.string().optional(),
  /** atLeast: the value must reach the threshold; atMost: it must come down to it (split distances). */
  direction: z.enum(['atLeast', 'atMost']),
  threshold: z.number(),
  ...evidence,
})
export type Milestone = z.infer<typeof Milestone>

/**
 * A start rule (plan §8): a value asked when the plan starts sets a ladder's starting level code. A band matches when
 * min ≤ v and (max is null or v < max): half-open, so bands meet without a gap for any value, whole or not. When
 * several rules match one ladder, the highest level wins.
 */
export const StartRule = z.object({
  ladderId: z.string(),
  /** One of the start answers. */
  input: z.enum(['runMin']),
  bands: z.array(z.object({ min: z.number(), max: z.number().nullable(), code: z.string() })).min(1),
  ...evidence,
})
export type StartRule = z.infer<typeof StartRule>

/**
 * A piece of the plan's reasoning that has no other home in the data: the evidence behind the goals (plan §1), the
 * effort scale (§3), the week against the benchmarks (§5), the stretching notes (§6.9), vitamin D (§12) and safety
 * (§13). The text is the plan's own, verbatim, with its citations; it gives every source a place in the data.
 */
export const Rationale = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  topic: z.string(),
  /** The plan section, e.g. "1". */
  section: z.string(),
  text: z.string(),
  ...evidence,
})
export type Rationale = z.infer<typeof Rationale>

export const Plan = z.object({
  /** A date, shown in About and written into every backup. */
  version: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  sources: z.array(Source),
  exercises: z.array(Exercise),
  ladders: z.array(Ladder),
  sessions: z.array(Session),
  week: WeekTemplate,
  blockRules: BlockRules,
  milestones: z.array(Milestone),
  startRules: z.array(StartRule),
  rationale: z.array(Rationale).default([]),
  /** The plan's own doses, ladder steps, pass targets and milestones are our rule as a whole (plan, "How to read the numbers"). */
  ourRule: z.literal(true),
})
export type Plan = z.infer<typeof Plan>
export type PlanInput = z.input<typeof Plan>
