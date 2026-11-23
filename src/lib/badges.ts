// Badges (D-058): every milestone of plan §11 shows as a badge on Progress. Locked badges are grey; tapping or hovering
// one tells how to earn it. A badge counts as earned when the milestone is stored as earned or its metric reaches the
// threshold now, so a badge whose goal is met is never shown locked, even before the award has been written.
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpFromLine,
  BicepsFlexed,
  BrickWall,
  Egg,
  EyeOff,
  Footprints,
  HeartPulse,
  MoveDiagonal,
  MoveHorizontal,
  MoveVertical,
  PersonStanding,
  Route,
  Sun,
  Timer,
  Turtle,
} from 'lucide-react'
import type { Metric, Milestone } from '@/data/schema'
import { type Metrics, reached } from './milestones'

/** The metal of a badge: the first step of a metric is bronze, then gold, jade and sapphire; a lone one is gold. */
export type Tier = 'bronze' | 'gold' | 'jade' | 'sapphire'
const TIERS: readonly Tier[] = ['bronze', 'gold', 'jade', 'sapphire']

interface MetricStyle {
  icon: LucideIcon
  /** Turn the icon upside down (the handstands). */
  flip?: boolean
  how: (n: number) => string
  /** The short mark on the badge's ribbon. */
  mark: (n: number) => string
}

const STYLE: Record<Metric, MetricStyle> = {
  noMissDays: {
    icon: Egg,
    how: (n) => `Do the morning block or the main session on ${n} days in a row, with none missed.`,
    mark: (n) => `${n} d`,
  },
  streak: {
    icon: Turtle,
    how: (n) =>
      `Reach a tortoise streak of ${n} days. One missed day is bridged; two missed days in a row end the streak.`,
    mark: (n) => `${n} d`,
  },
  outdoorSessions: {
    icon: Sun,
    how: (n) => `Do ${n} main sessions outdoors.`,
    mark: (n) => `${n}×`,
  },
  runKm: {
    icon: Route,
    how: (n) => `Run ${n.toLocaleString('en')} km in all. Enter the distance at the end of each run.`,
    mark: (n) => `${n.toLocaleString('en')} km`,
  },
  pushups: {
    icon: BicepsFlexed,
    how: (n) => `Do ${n} push-ups in a row in the Tortoise Test.`,
    mark: (n) => `${n}`,
  },
  handstandWallS: {
    icon: BrickWall,
    how: (n) => `Hold a chest-to-wall handstand for ${n} s in the Tortoise Test.`,
    mark: (n) => `${n} s`,
  },
  handstandFreeS: {
    icon: PersonStanding,
    flip: true,
    how: (n) => `Hold a freestanding handstand for ${n} s in the Tortoise Test.`,
    mark: (n) => `${n} s`,
  },
  frontSplitCm: {
    icon: MoveDiagonal,
    how: (n) =>
      n === 0
        ? 'Reach the floor in the front split, on both sides, in the Tortoise Test.'
        : `Come within ${n} cm of the floor in the front split, on both sides, in the Tortoise Test.`,
    mark: (n) => (n === 0 ? 'flat' : `${n} cm`),
  },
  sideSplitCm: {
    icon: MoveHorizontal,
    how: (n) =>
      n === 0
        ? 'Reach the floor in the side split in the Tortoise Test.'
        : `Come within ${n} cm of the floor in the side split in the Tortoise Test.`,
    mark: (n) => (n === 0 ? 'flat' : `${n} cm`),
  },
  sitRise: {
    icon: ArrowUpFromLine,
    how: (n) =>
      `Score ${n} out of 10 in the sit-to-rise test: down to the floor and up with no hand or knee.`,
    mark: (n) => `${n}/10`,
  },
  oneLegClosedS: {
    icon: EyeOff,
    how: (n) => `Stand ${n} s on each leg with the eyes closed in the Tortoise Test.`,
    mark: (n) => `${n} s`,
  },
  continuousRunKm: {
    icon: Footprints,
    how: (n) => `Run ${n} km in one run. Enter the distance at the end of the run.`,
    mark: (n) => `${n} km`,
  },
  longRunMin: {
    icon: Timer,
    how: (n) => `Do a long run of ${n} minutes.`,
    mark: (n) => `${n} min`,
  },
  vo2maxGainPct: {
    icon: HeartPulse,
    how: (n) => `Raise your VO2max estimate from the Rockport walk ${n}% above your Week 0 result.`,
    mark: (n) => `+${n}%`,
  },
  wallZeroTests: {
    icon: MoveVertical,
    how: (n) => `Score 0 cm in the wall test in ${n} Tortoise Tests in a row.`,
    mark: (n) => `${n}×`,
  },
  // Metrics read by the At-99 board only; no milestone uses them.
  wallCm: { icon: MoveVertical, how: () => '', mark: () => '' },
  farmerS: { icon: BicepsFlexed, how: () => '', mark: () => '' },
  jumpReachCm: { icon: ArrowUpFromLine, how: () => '', mark: () => '' },
  vo2max: { icon: HeartPulse, how: () => '', mark: () => '' },
}

export interface Badge {
  milestone: Milestone
  icon: LucideIcon
  flip: boolean
  tier: Tier
  how: string
  mark: string
  earned: boolean
  /** The day it was stored as earned; undefined when it is earned now and the award is not written yet. */
  earnedAt?: string
}

/** One badge per milestone, in the plan's order. */
export function badges(
  milestones: readonly Milestone[],
  metrics: Metrics,
  earned: ReadonlyMap<string, { earnedAt: string }>,
): Badge[] {
  const siblings = new Map<Metric, Milestone[]>()
  for (const m of milestones) siblings.set(m.metric, [...(siblings.get(m.metric) ?? []), m])
  return milestones.map((m) => {
    const style = STYLE[m.metric]
    const group = siblings.get(m.metric) ?? [m]
    const i = group.indexOf(m)
    // A lone milestone is gold, except Hatchling, the very first one, which starts the metals at bronze.
    const lone: Tier = m.metric === 'noMissDays' ? 'bronze' : 'gold'
    const tier: Tier = group.length === 1 ? lone : (TIERS[Math.min(i, TIERS.length - 1)] as Tier)
    const stored = earned.get(m.id)
    return {
      milestone: m,
      icon: style.icon,
      flip: style.flip ?? false,
      tier,
      how: style.how(m.threshold),
      mark: style.mark(m.threshold),
      earned: !!stored || reached(m, metrics),
      ...(stored ? { earnedAt: stored.earnedAt } : {}),
    }
  })
}
