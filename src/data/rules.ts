// The block rules (design §5.1; plan §2, §6.7, §8, §9): our rule throughout.
// - A block is 4 weeks, the fourth light; the Tortoise Test falls in every third light week, and in Week 0.
// - Week 0: half volume Monday to Friday (sets halved and rounded up, run and rope minutes halved, interval repeats
//   halved), every ladder at level 1; the test on Saturday and Sunday.
// - The ramp: strength at 2 sets in Weeks 1 and 2.
// - A light week: strength sets −1 (never below 2), runs and rope 30% shorter, half the intervals.
// - The interval stage follows the block: 1, 2, 3, then the 4 × 4 from Block 4 on.
import type { z } from 'zod'
import type { BlockRules } from './schema'

type BlockRulesInput = z.input<typeof BlockRules>

export const blockRules: BlockRulesInput = {
  blockWeeks: 4,
  lightWeekInBlock: 4,
  testEveryBlocks: 3,
  testDays: ['sat', 'sun'],
  week0: {
    halfVolumeDays: ['mon', 'tue', 'wed', 'thu', 'fri'],
    setsFactor: 0.5,
    enduranceFactor: 0.5,
    intervalRepsFactor: 0.5,
    allLevelsOne: true,
  },
  ramp: { weeks: [1, 2], strengthSets: 2 },
  light: { strengthSetsDelta: -1, minStrengthSets: 2, enduranceFactor: 0.7, intervalRepsFactor: 0.5 },
  intervalStages: [
    {
      stage: 1,
      fromBlock: 1,
      set: { repeats: 10, workS: 30, restS: 60, workLabel: 'fast', restLabel: 'easy' },
      text: '10 × (30 s fast, 60 s easy)',
    },
    {
      stage: 2,
      fromBlock: 2,
      set: { repeats: 6, workS: 60, restS: 60, workLabel: 'hard', restLabel: 'easy' },
      text: '6 × (1 min hard, 1 min easy)',
    },
    {
      stage: 3,
      fromBlock: 3,
      set: { repeats: 5, workS: 120, restS: 120, workLabel: 'hard', restLabel: 'easy' },
      text: '5 × (2 min hard, 2 min easy)',
    },
    {
      stage: 4,
      fromBlock: 4,
      set: { repeats: 4, workS: 240, restS: 180, workLabel: 'hard', restLabel: 'easy' },
      text: '4 × (4 min hard, 3 min easy): the 4 × 4 of [helgerud2007]',
      sources: ['helgerud2007'],
    },
  ],
  ourRule: true,
}
