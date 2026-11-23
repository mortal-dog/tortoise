// The whole exercise plan (docs/2-exercise-plan.md) as one typed, validated data module (design §7).
//
// Text conventions: text is copied from the plan verbatim. Citations stay in square brackets, as in the plan, and
// every bracketed id is also in the object's `sources`; the Tortoise Test's `how` and `aim` drop the brackets. The
// markdown emphasis is dropped ("*our rule*" reads "our rule").
import { at99 } from './at99'
import { exercises } from './exercises'
import { ladders } from './ladders'
import { milestones } from './milestones'
import { rationale } from './rationale'
import { blockRules } from './rules'
import { type Exercise, type Ladder, Plan, type PlanInput, type Session } from './schema'
import { sessions } from './sessions'
import { sources } from './sources'
import { startRules } from './start-rules'
import { tests } from './tests'
import { week } from './week'

export const planInput: PlanInput = {
  version: '2026-11-21',
  sources,
  exercises,
  ladders,
  sessions,
  week,
  blockRules,
  tests,
  milestones,
  at99,
  startRules,
  rationale,
  ourRule: true,
}

export const plan: Plan = Plan.parse(planInput)

export const exerciseById: ReadonlyMap<string, Exercise> = new Map(plan.exercises.map((e) => [e.id, e]))
export const ladderById: ReadonlyMap<string, Ladder> = new Map(plan.ladders.map((l) => [l.id, l]))
export const sessionById: ReadonlyMap<string, Session> = new Map(plan.sessions.map((s) => [s.id, s]))
