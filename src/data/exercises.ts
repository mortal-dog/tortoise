// The exercises (plan Appendix A): a well-known name and a teaching video each, nothing more (D-056: the owner, "each
// exercise gets a name and a YouTube link, no text"; "use only well-known exercises with their own names, easy to
// judge; jump rope, running and walking need no link, everyone knows them"). A harder or easier variant lives in its
// base exercise, so ladder levels point at the base id and name the variant themselves. The videos live in videos.ts
// and are joined here; only the exercises in NO_VIDEO go without one.
import type { z } from 'zod'
import type { Exercise } from './schema'
import { videos } from './videos'

type ExerciseInput = z.input<typeof Exercise>
type Row = Omit<ExerciseInput, 'video'>

/** The appendix rows, by section, in the order of the plan. */
const rows: Row[] = [
  // Spine and posture
  { id: 'cat-camel', name: 'Cat–camel', area: 'spine', unit: 'reps' },
  { id: 'chin-tuck', name: 'Chin tuck', area: 'spine', unit: 'reps' },
  { id: 'wall-angel', name: 'Wall angel', area: 'spine', unit: 'reps' },
  { id: 'prone-chest-lift', name: 'Prone back extension', area: 'spine', unit: 'reps' },
  { id: 'hip-flexor-stretch', name: 'Half-kneeling hip-flexor stretch', area: 'spine', unit: 'seconds' },
  { id: 'one-leg-stance', name: 'Single-leg balance', area: 'spine', unit: 'seconds' },
  // Wrists and handstand
  { id: 'wrist-prep', name: 'Wrist warm-up', area: 'handstand', unit: 'seconds' },
  { id: 'hand-plank', name: 'High plank', area: 'handstand', unit: 'seconds' },
  { id: 'pike-hold', name: 'Downward dog', area: 'handstand', unit: 'seconds' },
  { id: 'wall-plank', name: 'L-shape handstand', area: 'handstand', unit: 'seconds' },
  { id: 'wall-walk', name: 'Wall walk', area: 'handstand', unit: 'reps' },
  { id: 'chest-to-wall-handstand', name: 'Chest-to-wall handstand', area: 'handstand', unit: 'seconds' },
  { id: 'kick-up', name: 'Handstand kick-up', area: 'handstand', unit: 'reps' },
  { id: 'freestanding-handstand', name: 'Freestanding handstand', area: 'handstand', unit: 'seconds' },
  { id: 'pike-push-up', name: 'Pike push-up', area: 'handstand', unit: 'reps' },
  // Strength
  { id: 'goblet-squat', name: 'Goblet squat', area: 'strength', unit: 'reps' },
  { id: 'split-squat', name: 'Split squat', area: 'strength', unit: 'reps' },
  { id: 'push-up', name: 'Push-up', area: 'strength', unit: 'reps' },
  { id: 'one-arm-row', name: 'One-arm dumbbell row', area: 'strength', unit: 'reps' },
  { id: 'glute-bridge', name: 'Glute bridge', area: 'strength', unit: 'reps' },
  { id: 'farmer-carry', name: "Farmer's carry", area: 'strength', unit: 'seconds' },
  { id: 'side-plank', name: 'Side plank', area: 'strength', unit: 'seconds' },
  { id: 'calf-raise', name: 'Single-leg calf raise', area: 'strength', unit: 'reps' },
  { id: 'dead-bug', name: 'Dead bug', area: 'strength', unit: 'reps' },
  { id: 'hollow-hold', name: 'Hollow body hold', area: 'strength', unit: 'seconds' },
  // Jumps, rope, running and walking
  { id: 'squat-jump', name: 'Squat jump', area: 'cardio', unit: 'reps' },
  { id: 'rope-basics', name: 'Jump rope', area: 'cardio', unit: 'minutes' },
  { id: 'run', name: 'Run', area: 'cardio', unit: 'minutes' },
  { id: 'walk', name: 'Walk', area: 'cardio', unit: 'minutes' },
  // Splits and flexibility
  { id: 'worlds-greatest-stretch', name: "World's greatest stretch", area: 'splits', unit: 'reps' },
  { id: 'half-split', name: 'Half split', area: 'splits', unit: 'seconds' },
  { id: 'supported-front-split', name: 'Front split (on blocks)', area: 'splits', unit: 'seconds' },
  { id: 'straddle-lean', name: 'Pancake stretch', area: 'splits', unit: 'seconds' },
  { id: 'supported-side-split', name: 'Middle split (on blocks)', area: 'splits', unit: 'seconds' },
  { id: 'deep-squat-hold', name: 'Deep squat', area: 'splits', unit: 'seconds' },
]

/** Everyday movements everyone knows: no video (D-056). */
export const NO_VIDEO: readonly string[] = ['rope-basics', 'run', 'walk']

/** Every exercise with its video; the content tests fail a missing one that is not in NO_VIDEO. */
export const exercises: ExerciseInput[] = rows.map((e) => {
  const video = NO_VIDEO.includes(e.id) ? undefined : videos[e.id]
  return video ? { ...e, video } : e
})
