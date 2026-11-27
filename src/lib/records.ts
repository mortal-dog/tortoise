// The stored records (design §6). zod schemas, so a Google Drive copy can be validated on restore and the database
// layer stays typed. Every record carries updatedAt, which decides the newer record when a backup is merged (D-032).
import { z } from 'zod'
import { Weekday } from '@/data/schema'

const LocalDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const Instant = z.string().min(10)

export const SettingsRecord = z.object({
  key: z.literal('settings'),
  /** The Monday of Week 1. Unset until the first run picks the Week 0 Monday. */
  startDate: LocalDate.optional(),
  profile: z
    .object({
      birthYear: z.number().int().optional(),
      sex: z.enum(['male', 'female']).optional(),
      weightKg: z.number().positive().optional(),
      heightCm: z.number().positive().optional(),
    })
    .default({}),
  units: z
    .object({ mass: z.enum(['kg', 'lb']), distance: z.enum(['km', 'mi']) })
    .default({ mass: 'kg', distance: 'km' }),
  /** The player's spoken cues (D-040); in the record since D-071, so every device signed in to Drive shares it. */
  spokenCues: z.boolean().optional(),
  updatedAt: Instant,
})
export type SettingsRecord = z.infer<typeof SettingsRecord>

export const Variant = z.enum(['outdoor', 'indoor'])
export type Variant = z.infer<typeof Variant>

/**
 * The step ids the player finished, skipped ones left out (D-057). Missing on a "Done as planned" tap, which counts
 * every step of the part as done.
 */
const Steps = z.array(z.string()).optional()

export const DayRecord = z.object({
  date: LocalDate,
  morning: z.object({ doneAt: Instant, steps: Steps }).nullable().optional(),
  main: z
    .object({
      doneAt: Instant,
      sessionId: z.string(),
      variant: Variant.optional(),
      minutes: z.number().nonnegative().optional(),
      distanceKm: z.number().nonnegative().optional(),
      effort: z.number().int().min(1).max(10).optional(),
      note: z.string().optional(),
      /** True for a one-tap "Done as planned". */
      asPlanned: z.boolean().optional(),
      steps: Steps,
    })
    .nullable()
    .optional(),
  split: z
    .object({ doneAt: Instant, kind: z.enum(['front', 'side', 'both', 'long']), steps: Steps })
    .nullable()
    .optional(),
  /** The "Make it a Shell day" tap: it only folds the open cards. */
  folded: z.boolean().optional(),
  updatedAt: Instant,
})
export type DayRecord = z.infer<typeof DayRecord>

export const LogRecord = z.object({
  /** A random id, unique across devices (D-032). */
  id: z.string().min(8),
  date: LocalDate,
  sessionId: z.string(),
  exerciseId: z.string(),
  ladderId: z.string().optional(),
  level: z.number().int().positive().optional(),
  sets: z.array(
    z.object({
      reps: z.number().nonnegative().optional(),
      seconds: z.number().nonnegative().optional(),
      kg: z.number().nonnegative().optional(),
    }),
  ),
  feedback: z.enum(['easy', 'right', 'hard']).optional(),
  updatedAt: Instant,
})
export type LogRecord = z.infer<typeof LogRecord>

export const LevelRecord = z.object({
  ladderId: z.string(),
  level: z.number().int().positive(),
  since: LocalDate,
  history: z.array(z.object({ level: z.number().int().positive(), date: LocalDate })),
  /** The last check-in on this ladder, whatever the answer (D-069). */
  askedAt: LocalDate.optional(),
  /** The last check-in answered "one level easier": the next comes after a week. */
  eased: z.boolean().optional(),
  updatedAt: Instant,
})
export type LevelRecord = z.infer<typeof LevelRecord>

const side = z.number().nonnegative().optional()

export const TestRecord = z.object({
  /** The date of Day 1. */
  date: LocalDate,
  results: z.object({
    rockport: z
      .object({
        minutes: z.number().positive(),
        heartRate: z.number().positive(),
        weightKg: z.number().positive(),
      })
      .optional(),
    jumpReachCm: side,
    farmerS: side,
    heightCm: side,
    wallCm: side,
    sitRise: z.object({ sit: z.number().int().min(0), rise: z.number().int().min(0) }).optional(),
    oneLeg: z.object({ openL: side, openR: side, closedL: side, closedR: side }).optional(),
    pushups: side,
    squatHoldS: side,
    splits: z.object({ frontL: side, frontR: side, side: side }).optional(),
    handstand: z.object({ wallS: side, freeS: side }).optional(),
    restingHr: side,
  }),
  start: z.object({ runMin: z.number().nonnegative() }).optional(),
  computed: z.object({ vo2max: z.number().optional(), sitRiseScore: z.number().optional() }).default({}),
  updatedAt: Instant,
})
export type TestRecord = z.infer<typeof TestRecord>

export const OverrideRecord = z.object({
  monday: LocalDate,
  swaps: z.array(z.tuple([Weekday, Weekday])),
  updatedAt: Instant,
})
export type OverrideRecord = z.infer<typeof OverrideRecord>

export const MilestoneRecord = z.object({ id: z.string(), earnedAt: LocalDate, updatedAt: Instant })
export type MilestoneRecord = z.infer<typeof MilestoneRecord>

/** A progress photo (Phase 9), kept only on this phone and in its Google Drive copy: a JPEG as a data URL. */
export const PhotoRecord = z.object({
  id: z.string().min(8),
  date: LocalDate,
  dataUrl: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/),
  note: z.string().optional(),
  updatedAt: Instant,
})
export type PhotoRecord = z.infer<typeof PhotoRecord>

export const MetaRecord = z.object({
  key: z.literal('meta'),
  schemaVersion: z.number().int().positive(),
  createdAt: Instant,
  appVersion: z.string(),
  updatedAt: Instant,
})
export type MetaRecord = z.infer<typeof MetaRecord>

export interface Stores {
  settings: SettingsRecord
  days: DayRecord
  logs: LogRecord
  levels: LevelRecord
  tests: TestRecord
  overrides: OverrideRecord
  milestones: MilestoneRecord
  photos: PhotoRecord
  meta: MetaRecord
}
export type StoreName = keyof Stores

export function newId(): string {
  return crypto.randomUUID()
}

export function nowIso(now: Date = new Date()): string {
  return now.toISOString()
}
