// Pillar minutes (design §8): strength, aerobic, skills, mobility. Planned minutes come from each session template;
// done minutes are the logged minutes in the template's shares, or the template's own minutes for "Done as planned".
import type { Pillar, Session } from '@/data/schema'

export type PillarMinutes = Record<Pillar, number>

export const PILLARS: readonly Pillar[] = ['strength', 'aerobic', 'skills', 'mobility']

export function zeroPillars(): PillarMinutes {
  return { strength: 0, aerobic: 0, skills: 0, mobility: 0 }
}

export function plannedPillars(session: Session): PillarMinutes {
  const out = zeroPillars()
  for (const p of PILLARS) out[p] = session.pillars[p] ?? 0
  return out
}

export function donePillars(session: Session, loggedMinutes?: number): PillarMinutes {
  const planned = plannedPillars(session)
  if (loggedMinutes === undefined) return planned
  const total = PILLARS.reduce((s, p) => s + planned[p], 0)
  const out = zeroPillars()
  if (total === 0) return out
  for (const p of PILLARS) out[p] = (planned[p] / total) * loggedMinutes
  return out
}

export function addPillars(a: PillarMinutes, b: PillarMinutes): PillarMinutes {
  const out = zeroPillars()
  for (const p of PILLARS) out[p] = a[p] + b[p]
  return out
}
