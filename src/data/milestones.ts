// Milestones (plan §11). Every threshold is our rule. Habit milestones count days and logs; ability milestones read
// the ladder levels reached, the split blocks done and the run logs (D-067: no test). A name is a name, never the
// rule that earns it: the rule shows in the badge's card (D-070).
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
  count('bask-10', 'First Light', 'outdoorSessions', 10),
  count('bask-50', 'Warm Shell', 'outdoorSessions', 50),
  count('bask-100', 'Sunbather', 'outdoorSessions', 100),
  count('bask-500', 'Sun King', 'outdoorSessions', 500),
  count('long-road-100', 'Wanderer', 'runKm', 100),
  count('long-road-500', 'Voyager', 'runKm', 500),
  count('long-road-1000', 'Odyssey', 'runKm', 1000),
  // Ability milestones: ladder levels reached, split blocks done, and runs from the logs (D-067)
  level('push-3', 'Floor Strong', 'push', 3),
  level('push-4', 'Slow Burn', 'push', 4),
  level('push-5', 'Sky Feet', 'push', 5),
  level('push-6', 'Pack Mule', 'push', 6),
  level('squat-3', 'Split Second', 'squat', 3),
  level('squat-5', 'Deep Roots', 'squat', 5),
  level('bridge-3', 'Drawbridge', 'bridge', 3),
  level('bridge-5', 'Stone Arch', 'bridge', 5),
  level('row-3', 'Oarsman', 'row', 3),
  level('back-3', 'Upright', 'back-extension', 3),
  level('back-5', 'Iron Spine', 'back-extension', 5),
  level('core-3', 'Hollow Shell', 'core', 3),
  level('handstand-6', 'Wall Climber', 'handstand-skill', 6),
  level('handstand-8', 'Topsy-Turvy', 'handstand-skill', 8),
  level('handstand-10', 'Cartwheel', 'handstand-skill', 10),
  level('handstand-13', 'Free Spirit', 'handstand-skill', 13),
  level('pike-3', 'Atlas', 'handstand-strength', 3),
  level('balance-3', 'Heron', 'balance', 3),
  level('balance-6', 'Flamingo', 'balance', 6),
  level('jumps-3', 'Springbok', 'jumps', 3),
  level('run-walk-4', 'Trotter', 'run', 4),
  level('run-walk-8', 'Pacer', 'run', 8),
  count('splits-10', 'Limber', 'splitBlocks', 10),
  count('splits-50', 'Supple', 'splitBlocks', 50),
  count('splits-100', 'Willow', 'splitBlocks', 100),
  count('splits-365', 'Silk Ribbon', 'splitBlocks', 365),
  logged('run-5k', 'Road Runner', 'continuousRunKm', 5),
  logged('run-10k', 'Long Hauler', 'continuousRunKm', 10),
  logged('long-run-90', 'Stayer', 'longRunMin', 90),
]
