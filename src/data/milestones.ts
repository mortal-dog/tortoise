// Milestones (plan §11). Every threshold is our rule. Habit milestones count days and logs; ability milestones read
// the ladder levels reached, the split blocks done and the run logs (D-067: no test).
import type { z } from 'zod'
import type { Metric, Milestone } from './schema'

type MilestoneInput = z.input<typeof Milestone>

/** An ability milestone: a ladder level reached (D-067). The threshold is the ladder's level number. */
function level(id: string, name: string, ladderId: string, threshold: number): MilestoneInput {
  return {
    id,
    name,
    group: 'ability',
    kind: 'level',
    metric: 'level',
    ladderId,
    direction: 'atLeast',
    threshold,
    ourRule: true,
  }
}

/** An ability milestone read from the run logs. */
function logged(id: string, name: string, metric: Metric, threshold: number): MilestoneInput {
  return { id, name, group: 'ability', kind: 'log', metric, direction: 'atLeast', threshold, ourRule: true }
}

function count(id: string, name: string, metric: Metric, threshold: number): MilestoneInput {
  const group = metric === 'splitBlocks' ? 'ability' : 'habit'
  return { id, name, group, kind: 'count', metric, direction: 'atLeast', threshold, ourRule: true }
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
  // Ability milestones: ladder levels reached, split blocks done, and runs from the logs (D-067)
  level('push-3', 'Push L3', 'push', 3),
  level('push-4', 'Push L4', 'push', 4),
  level('push-5', 'Push L5', 'push', 5),
  level('push-6', 'Push L6', 'push', 6),
  level('squat-3', 'Squat L3', 'squat', 3),
  level('squat-5', 'Squat L5', 'squat', 5),
  level('bridge-3', 'Bridge L3', 'bridge', 3),
  level('bridge-5', 'Bridge L5', 'bridge', 5),
  level('row-3', 'Row P3', 'row', 3),
  level('back-3', 'Back L3', 'back-extension', 3),
  level('back-5', 'Back L5', 'back-extension', 5),
  level('core-3', 'Core L3', 'core', 3),
  level('handstand-6', 'Handstand H6', 'handstand-skill', 6),
  level('handstand-8', 'Handstand H8', 'handstand-skill', 8),
  level('handstand-10', 'Handstand H10', 'handstand-skill', 10),
  level('handstand-13', 'Handstand H13', 'handstand-skill', 13),
  level('pike-3', 'Pike push S3', 'handstand-strength', 3),
  level('balance-3', 'Balance Ba3', 'balance', 3),
  level('balance-6', 'Balance Ba6', 'balance', 6),
  level('jumps-3', 'Jumps L3', 'jumps', 3),
  level('run-walk-4', 'Run–walk R4', 'run', 4),
  level('run-walk-8', 'Run–walk R8', 'run', 8),
  count('splits-10', 'Splits 10', 'splitBlocks', 10),
  count('splits-50', 'Splits 50', 'splitBlocks', 50),
  count('splits-100', 'Splits 100', 'splitBlocks', 100),
  count('splits-365', 'Splits 365', 'splitBlocks', 365),
  logged('run-5k', 'The first continuous 5 km', 'continuousRunKm', 5),
  logged('run-10k', 'The first continuous 10 km', 'continuousRunKm', 10),
  logged('long-run-90', 'A 90-minute long run', 'longRunMin', 90),
]
