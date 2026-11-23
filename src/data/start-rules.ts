// Starting levels from the Week 0 test and the start question (plan §8), our rule.
//
// Band semantics (see StartRule in schema.ts): a band matches a value v when min ≤ v and (max === null or v < max).
// The bands are half-open, so they meet without a gap for whole and fractional values alike: push-ups 0–4 is
// [0, 5), and "10 min" of running means 10 ≤ v < 30. A ladder with no matching band starts at level 1, like every
// ladder without a rule ("Everything else: level 1"). When several rules match one ladder, the highest level wins.
import type { z } from 'zod'
import type { StartRule } from './schema'

type StartRuleInput = z.input<typeof StartRule>

export const startRules: StartRuleInput[] = [
  {
    ladderId: 'push',
    input: 'pushups',
    bands: [
      { min: 0, max: 5, code: '1' },
      { min: 5, max: 10, code: '2' },
      { min: 10, max: 20, code: '3' },
      { min: 20, max: 30, code: '4' },
      { min: 30, max: null, code: '5' },
    ],
    ourRule: true,
  },
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
