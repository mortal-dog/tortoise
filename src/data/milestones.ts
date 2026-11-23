// Milestones (plan §11). Every threshold is our rule. Habit milestones count days and logs; ability milestones read
// the logs and the tests. Split distances count down to the floor, so they use `atMost`.
import type { z } from 'zod'
import type { Metric, Milestone } from './schema'

type MilestoneInput = z.input<typeof Milestone>

function ability(
  id: string,
  name: string,
  metric: Metric,
  threshold: number,
  atMost = false,
): MilestoneInput {
  return {
    id,
    name,
    group: 'ability',
    kind: 'test',
    metric,
    direction: atMost ? 'atMost' : 'atLeast',
    threshold,
    ourRule: true,
  }
}

function count(id: string, name: string, metric: Metric, threshold: number): MilestoneInput {
  return { id, name, group: 'habit', kind: 'count', metric, direction: 'atLeast', threshold, ourRule: true }
}

export const milestones: MilestoneInput[] = [
  // Habit milestones
  {
    id: 'hatchling',
    name: 'Hatchling',
    group: 'habit',
    kind: 'streak',
    metric: 'noMissDays',
    direction: 'atLeast',
    threshold: 7,
    ourRule: true,
  },
  {
    id: 'juvenile',
    name: 'Juvenile',
    group: 'habit',
    kind: 'streak',
    metric: 'streak',
    direction: 'atLeast',
    threshold: 30,
    ourRule: true,
  },
  {
    id: 'adult',
    name: 'Adult',
    group: 'habit',
    kind: 'streak',
    metric: 'streak',
    direction: 'atLeast',
    threshold: 100,
    ourRule: true,
  },
  {
    id: 'elder',
    name: 'Elder',
    group: 'habit',
    kind: 'streak',
    metric: 'streak',
    direction: 'atLeast',
    threshold: 365,
    ourRule: true,
  },
  {
    id: 'ancient',
    name: 'Ancient',
    group: 'habit',
    kind: 'streak',
    metric: 'streak',
    direction: 'atLeast',
    threshold: 1000,
    ourRule: true,
  },
  count('bask-10', 'Bask 10', 'outdoorSessions', 10),
  count('bask-50', 'Bask 50', 'outdoorSessions', 50),
  count('bask-100', 'Bask 100', 'outdoorSessions', 100),
  count('bask-500', 'Bask 500', 'outdoorSessions', 500),
  count('long-road-100', 'Long road 100 km', 'runKm', 100),
  count('long-road-500', 'Long road 500 km', 'runKm', 500),
  count('long-road-1000', 'Long road 1,000 km', 'runKm', 1000),
  // Ability milestones (from logs and tests)
  ability('push-ups-10', '10 push-ups', 'pushups', 10),
  ability('push-ups-20', '20 push-ups', 'pushups', 20),
  ability('push-ups-30', '30 push-ups', 'pushups', 30),
  ability('push-ups-40', '40 push-ups', 'pushups', 40),
  ability('push-ups-50', '50 push-ups', 'pushups', 50),
  ability('handstand-wall-30', 'Handstand at the wall 30 s', 'handstandWallS', 30),
  ability('handstand-wall-60', 'Handstand at the wall 60 s', 'handstandWallS', 60),
  ability('handstand-free-5', 'The first freestanding handstand, 5 s', 'handstandFreeS', 5),
  ability('handstand-free-10', 'Freestanding handstand 10 s', 'handstandFreeS', 10),
  ability('handstand-free-30', 'Freestanding handstand 30 s', 'handstandFreeS', 30),
  ability('handstand-free-60', 'Freestanding handstand 60 s', 'handstandFreeS', 60),
  ability('front-split-20', 'Front split within 20 cm (each side)', 'frontSplitCm', 20, true),
  ability('front-split-10', 'Front split within 10 cm (each side)', 'frontSplitCm', 10, true),
  ability('front-split-flat', 'Front split flat (each side)', 'frontSplitCm', 0, true),
  ability('side-split-30', 'Side split within 30 cm', 'sideSplitCm', 30, true),
  ability('side-split-15', 'Side split within 15 cm', 'sideSplitCm', 15, true),
  ability('side-split-flat', 'Side split flat', 'sideSplitCm', 0, true),
  ability('sit-to-rise-10', 'Sit-to-rise 10 out of 10', 'sitRise', 10),
  ability('one-leg-closed-30', 'One leg, eyes closed 30 s', 'oneLegClosedS', 30),
  ability('one-leg-closed-60', 'One leg, eyes closed 60 s', 'oneLegClosedS', 60),
  ability('run-5k', 'The first continuous 5 km', 'continuousRunKm', 5),
  ability('run-10k', 'The first continuous 10 km', 'continuousRunKm', 10),
  ability('long-run-90', 'A 90-minute long run', 'longRunMin', 90),
  ability('vo2max-10', 'Aerobic power: VO2max estimate up 10% from Week 0', 'vo2maxGainPct', 10),
  ability('straight-back', 'Straight back: the wall test at 0 cm in four tests in a row', 'wallZeroTests', 4),
]
