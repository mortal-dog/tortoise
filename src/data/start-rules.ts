// The starting levels from the start questions, asked when the plan starts (plan §8, D-069), our rule. A level starts
// where the answer shows its pass is not yet met; every ladder without a matching rule starts at level 1.
//
// Band semantics (see StartRule in schema.ts): a band matches a value v when min ≤ v and (max === null or v < max).
// The bands are half-open, so they meet without a gap. A yes is 1 and a no is 0. When several rules match one ladder,
// the highest level wins.
import type { z } from 'zod'
import type { StartRule } from './schema'

type StartRuleInput = z.input<typeof StartRule>

const yes = (ladderId: string, input: StartRuleInput['input'], code: string): StartRuleInput => ({
  ladderId,
  input,
  bands: [{ min: 1, max: null, code }],
  ourRule: true,
})

export const startRules: StartRuleInput[] = [
  {
    ladderId: 'push',
    input: 'pushups',
    bands: [
      { min: 0, max: 5, code: '1' },
      { min: 5, max: 15, code: '2' },
      { min: 15, max: 30, code: '3' },
      { min: 30, max: null, code: '4' },
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
  yes('balance', 'oneLeg30', 'Ba2'),
  yes('handstand-skill', 'handstandWall30', 'H8'),
  yes('squat', 'trains', '2'),
  yes('bridge', 'trains', '2'),
  yes('row', 'trains', 'P2'),
  yes('back-extension', 'trains', '2'),
]
