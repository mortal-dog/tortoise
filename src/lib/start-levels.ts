// The starting levels from the start questions, asked when the plan starts (plan §8, D-069). Every ladder without a
// matching rule starts at level 1.
import type { Ladder, StartRule } from '@/data/schema'

/** The start questions' answers (D-069): counts and minutes as numbers, a yes as 1 and a no as 0. */
export interface StartAnswers {
  /** Floor push-ups in a row. */
  pushups?: number
  /** How long an easy run is comfortable, in minutes. */
  runMin?: number
  /** Standing 30 s on each leg, eyes open. */
  oneLeg30?: number
  /** Holding a chest-to-wall handstand for 30 s. */
  handstandWall30?: number
  /** Lifting weights at least twice a week for 3 months or more. */
  trains?: number
}

/** The ladders the answers move above level 1, with their levels; the highest level wins when rules overlap. */
export function startingLevels(
  rules: readonly StartRule[],
  ladders: readonly Ladder[],
  answers: StartAnswers,
): Map<string, number> {
  const out = new Map<string, number>()
  for (const rule of rules) {
    const v = answers[rule.input]
    if (v === undefined || Number.isNaN(v)) continue
    const band = rule.bands.find((b) => v >= b.min && (b.max === null || v < b.max))
    if (!band) continue
    const level = ladders.find((l) => l.id === rule.ladderId)?.levels.find((l) => l.code === band.code)?.level
    if (level === undefined) continue
    out.set(rule.ladderId, Math.max(out.get(rule.ladderId) ?? 0, level))
  }
  return out
}
