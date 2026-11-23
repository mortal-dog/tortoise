// The starting levels from the start question, asked when the plan starts (plan §8, D-067). Every ladder without a
// matching rule starts at level 1.
import type { Ladder, StartRule } from '@/data/schema'

export interface StartAnswers {
  /** How long an easy run is comfortable, in minutes. */
  runMin?: number
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
