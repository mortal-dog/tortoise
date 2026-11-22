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

export const Area = z.enum(['spine', 'strength', 'handstand', 'splits', 'cardio', 'playground'])
export type Area = z.infer<typeof Area>

export const Exercise = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  area: Area,
  how: z.string(),
  cue: z.string(),
  mistake: z.string(),
  /** One line of why (design §1, principle 6); from the session tables' "Why" column where there is one. */
  why: z.string().optional(),
  unit: z.enum(['reps', 'seconds', 'minutes']),
  video: z.object({ url: z.url(), title: z.string(), channel: z.string() }).optional(),
  ...evidence,
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
    part: z.enum(['warmup', 'main', 'cooldown', 'playground', 'split']),
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
  /** A test week is a light week whose block number is a multiple of this. Week 0 is a test week too. */
  testEveryBlocks: z.number().int().positive(),
  testDays: z.array(Weekday),
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

export const Calculator = z.enum(['rockport', 'sitRise', 'height', 'none'])

export const TestDef = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  day: z.union([z.literal(1), z.literal(2)]),
  order: z.number().int().positive(),
  how: z.string(),
  /** What is recorded: "cm", "s", "reps", "bpm", "points", or the Rockport inputs. */
  unit: z.string(),
  aim: z.string(),
  calculator: Calculator,
  /** Asked only once a year (height). */
  yearly: z.boolean().optional(),
  ...evidence,
})
export type TestDef = z.infer<typeof TestDef>

/** What a milestone or an At-99 line measures. The milestone engine (Phase 2) knows each one. */
export const Metric = z.enum([
  'noMissDays', // days in a row with none missed (Hatchling)
  'streak', // the tortoise streak
  'outdoorSessions',
  'runKm',
  'pushups',
  'pullups',
  'deadHangS',
  'handstandWallS',
  'handstandFreeS',
  'frontSplitCm',
  'sideSplitCm',
  'sitRise',
  'oneLegClosedS',
  'continuousRunKm',
  'longRunMin',
  'broadJumpVsHeight', // broad jump in cm minus height in cm
  'vo2maxGainPct', // VO2max estimate against Week 0, in per cent
  'wallZeroTests', // wall tests in a row at 0 cm
  'wallCm',
  'farmerS',
  'broadJumpCm',
  'vo2max',
])
export type Metric = z.infer<typeof Metric>

export const Milestone = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  group: z.enum(['habit', 'ability']),
  kind: z.enum(['streak', 'count', 'test', 'level']),
  metric: Metric,
  /** atLeast: the value must reach the threshold; atMost: it must come down to it (split distances). */
  direction: z.enum(['atLeast', 'atMost']),
  threshold: z.number(),
  ...evidence,
})
export type Milestone = z.infer<typeof Milestone>

export const Habit = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  target: z.string(),
  why: z.string().optional(),
  ...evidence,
})
export type Habit = z.infer<typeof Habit>

export const At99Line = z.object({
  ability: z.string(),
  /** The metric shown, or "trend" lines that have no fixed value. */
  metric: Metric,
  line: z.string(),
  /** The value to reach, when the line has one. */
  value: z.number().optional(),
  direction: z.enum(['atLeast', 'atMost', 'trend']),
  ...evidence,
})
export type At99Line = z.infer<typeof At99Line>

/**
 * A start rule (plan §8): a tested or asked value v sets a ladder's starting level code. A band matches when
 * min ≤ v and (max is null or v < max): half-open, so bands meet without a gap for any value, whole or not. When
 * several rules match one ladder, the highest level wins. The answer `negative` is 1 for yes, 0 for no.
 */
export const StartRule = z.object({
  ladderId: z.string(),
  /** A test id, or one of the start answers. */
  input: z.enum(['pushups', 'deadHangS', 'runMin', 'ropeMin', 'negative']),
  bands: z.array(z.object({ min: z.number(), max: z.number().nullable(), code: z.string() })).min(1),
  /** The rule applies only when another input also reaches a value (pull: a 5-s negative counts only with a 30-s hang). */
  onlyIf: z
    .object({ input: z.enum(['pushups', 'deadHangS', 'runMin', 'ropeMin', 'negative']), min: z.number() })
    .optional(),
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
  tests: z.array(TestDef),
  milestones: z.array(Milestone),
  habits: z.array(Habit),
  at99: z.array(At99Line),
  startRules: z.array(StartRule),
  rationale: z.array(Rationale).default([]),
  /** The plan's own doses, ladder steps, pass targets, test aims and milestones are our rule as a whole (plan, "How to read the numbers"). */
  ourRule: z.literal(true),
})
export type Plan = z.infer<typeof Plan>
export type PlanInput = z.input<typeof Plan>
