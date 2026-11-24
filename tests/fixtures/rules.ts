// Block rules as design §5.1 states them; the content tests check that the plan data says the same.
import type { BlockRules, Ladder } from '@/data/schema'

export const rules: BlockRules = {
  blockWeeks: 4,
  lightWeekInBlock: 4,
  week0: {
    halfVolumeDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
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
      set: { repeats: 10, workS: 30, restS: 60 },
      text: '10 × (30 s fast, 60 s easy)',
      sources: [],
    },
    {
      stage: 2,
      fromBlock: 2,
      set: { repeats: 6, workS: 60, restS: 60 },
      text: '6 × (1 min hard, 1 min easy)',
      sources: [],
    },
    {
      stage: 3,
      fromBlock: 3,
      set: { repeats: 5, workS: 120, restS: 120 },
      text: '5 × (2 min hard, 2 min easy)',
      sources: [],
    },
    {
      stage: 4,
      fromBlock: 4,
      set: { repeats: 4, workS: 240, restS: 180 },
      text: '4 × (4 min hard, 3 min easy)',
      sources: ['helgerud2007'],
    },
  ],
  sources: [],
  ourRule: true,
}

/** A reps ladder and a hold ladder shaped like plan §7.3 and §7.7. */
export const pushLadder: Ladder = {
  id: 'push',
  name: 'Push',
  kind: 'reps',
  askEveryDays: 14,
  section: '7.3',
  sources: [],
  ourRule: true,
  levels: [
    {
      level: 1,
      code: '1',
      exerciseId: 'push-up',
      name: 'Push-up, hands on a table',
      pass: { sets: 3, reps: 15, text: '3 × 15' },
      sources: [],
    },
    {
      level: 2,
      code: '2',
      exerciseId: 'push-up',
      name: 'Push-up, hands on a chair',
      pass: { sets: 3, reps: 15, text: '3 × 15' },
      sources: [],
    },
    {
      level: 3,
      code: '3',
      exerciseId: 'push-up',
      name: 'Floor push-up',
      pass: { sets: 3, reps: 12, text: '3 × 12' },
      sources: [],
    },
  ],
}

export const coreLadder: Ladder = {
  id: 'core',
  name: 'Core',
  kind: 'hold',
  askEveryDays: 14,
  section: '7.7',
  sources: [],
  ourRule: true,
  levels: [
    {
      level: 1,
      code: '2',
      exerciseId: 'hollow-hold',
      name: 'Hollow hold, knees bent',
      pass: { sets: 3, seconds: 30, text: '3 × 30 s' },
      sources: [],
    },
    {
      level: 2,
      code: '3',
      exerciseId: 'hollow-hold',
      name: 'Hollow hold, legs straight',
      pass: { sets: 3, seconds: 40, text: '3 × 40 s' },
      sources: [],
    },
  ],
}
