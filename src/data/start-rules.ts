// The starting level from the start question, asked when the plan starts (plan §8), our rule. Every other ladder
// starts at level 1 and moves by the level suggestions (D-067).
//
// Band semantics (see StartRule in schema.ts): a band matches a value v when min ≤ v and (max === null or v < max).
// The bands are half-open, so they meet without a gap for whole and fractional values alike: "10 min" of running
// means 10 ≤ v < 30. A ladder with no matching band starts at level 1, like every ladder without a rule.
import type { z } from 'zod'
import type { StartRule } from './schema'

type StartRuleInput = z.input<typeof StartRule>

export const startRules: StartRuleInput[] = [
  {
    ladderId: 'run',
    input: 'runMin',
    bands: [
      { min: 0, max: 10, code: 'R1' },
      { min: 10, max: 30, code: 'R4' },
      { min: 30, max: null, code: 'R8' },
    ],
    ourRule: true,
  },
]
