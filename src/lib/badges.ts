// Badges (D-058, D-066, D-067, D-070): every milestone of plan §11 shows as a badge on Progress. Locked badges are
// grey; a tap opens a card that tells how to earn one (no hover tooltips). Under the medal stands the badge's name, a
// real name on one line, never the rule that earns it (D-070); the rule is `how`, in the card. A badge counts as
// earned when the milestone is stored as earned or its metric reaches the threshold now, so a badge whose goal is met
// is never shown locked, even before the award has been written. Ability badges are ladder levels reached, split
// blocks done and runs (D-067: no test).
import type { LucideIcon } from 'lucide-react'
import {
  ArrowDownUp,
  BicepsFlexed,
  Dumbbell,
  Egg,
  Footprints,
  MoveHorizontal,
  MoveVertical,
  PersonStanding,
  Rabbit,
  Rainbow,
  Route,
  Scale,
  Shield,
  Sun,
  Timer,
  Triangle,
  Turtle,
  Wind,
} from 'lucide-react'
import { ladderById } from '@/data/plan'
import type { Metric, Milestone } from '@/data/schema'
import { type Metrics, metricKey, reached } from './milestones'

/** The metal of a badge: the first step of a metric is bronze, then gold, jade and sapphire; a lone one is gold. */
export type Tier = 'bronze' | 'gold' | 'jade' | 'sapphire'
const TIERS: readonly Tier[] = ['bronze', 'gold', 'jade', 'sapphire']

interface MetricStyle {
  icon: LucideIcon
  /** Turn the icon upside down (the handstand). */
  flip?: boolean
  how: (n: number) => string
}

/** The longest name that fits one line under a medal in the three-column grid on a 375-px-wide phone. */
export const LABEL_MAX = 14

const STYLE: Record<Exclude<Metric, 'level'>, MetricStyle> = {
  noMissDays: {
    icon: Egg,
    how: (n) => `Do the morning block or the main session on ${n} days in a row, with none missed.`,
  },
  streak: {
    icon: Turtle,
    how: (n) =>
      `Reach a tortoise streak of ${n} days. One missed day is bridged; two missed days in a row end the streak.`,
  },
  outdoorSessions: {
    icon: Sun,
    how: (n) => `Do ${n} main sessions outdoors.`,
  },
  runKm: {
    icon: Route,
    how: (n) => `Run ${n.toLocaleString('en')} km in all. Enter the distance at the end of each run.`,
  },
  continuousRunKm: {
    icon: Footprints,
    how: (n) => `Run ${n} km in one run. Enter the distance at the end of the run.`,
  },
  longRunMin: {
    icon: Timer,
    how: (n) => `Do a long run of ${n} minutes.`,
  },
  splitBlocks: {
    icon: MoveHorizontal,
    how: (n) => `Finish ${n} split blocks. Sunday's Light session counts as one.`,
  },
}

/** The icon of each ladder's level badges; the handstand turns upside down. */
const LADDER_ICON: Record<string, { icon: LucideIcon; flip?: boolean }> = {
  push: { icon: BicepsFlexed },
  squat: { icon: ArrowDownUp },
  bridge: { icon: Rainbow },
  row: { icon: Dumbbell },
  'back-extension': { icon: MoveVertical },
  core: { icon: Shield },
  'handstand-skill': { icon: PersonStanding, flip: true },
  'handstand-strength': { icon: Triangle },
  balance: { icon: Scale },
  jumps: { icon: Rabbit },
  run: { icon: Wind },
}

/** A level badge's look and words, from its ladder. */
function levelStyle(m: Milestone): MetricStyle {
  const ladder = m.ladderId ? ladderById.get(m.ladderId) : undefined
  const level = ladder?.levels.find((l) => l.level === m.threshold)
  const code = level?.code ?? String(m.threshold)
  const shown = /^\d/.test(code) ? `L${code}` : code
  const look = (m.ladderId ? LADDER_ICON[m.ladderId] : undefined) ?? { icon: BicepsFlexed }
  return {
    ...look,
    how: () =>
      `Reach ${ladder?.name ?? m.ladderId} ${shown}${level ? `: ${level.name}` : ''}. Every few weeks, after a session, the app asks whether to go one level harder.`,
  }
}

export interface Badge {
  milestone: Milestone
  icon: LucideIcon
  flip: boolean
  tier: Tier
  how: string
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
  const siblings = new Map<string, Milestone[]>()
  for (const m of milestones) siblings.set(metricKey(m), [...(siblings.get(metricKey(m)) ?? []), m])
  return milestones.map((m) => {
    const style = m.metric === 'level' ? levelStyle(m) : STYLE[m.metric]
    const group = siblings.get(metricKey(m)) ?? [m]
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
      earned: !!stored || reached(m, metrics),
      ...(stored ? { earnedAt: stored.earnedAt } : {}),
    }
  })
}
