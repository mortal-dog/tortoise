// Teaching links for the exercise library (implementation Phase 5, D-026, D-043): links only, never embeds, and
// nothing is fetched at runtime. The order of choice:
//   1. a health body's own video or page: a national health service or one of its trusts, a national institute,
//      a national osteoporosis society, or a hospital;
//   2. for the handstand and split drills, the most reputable teaching video found, from an established coach;
//   3. otherwise a professional body's technique video (the National Academy of Sports Medicine).
// A YouTube link carries the title and channel exactly as YouTube's oEmbed returned them; a page carries its <title>
// and the body that publishes it. `checked` is the day the link answered (oEmbed 200, or HTTP 200 after redirects).
import type { VideoLink } from './schema'

const CHECKED = '2026-11-22'

function yt(id: string, title: string, channel: string): VideoLink {
  return { url: `https://www.youtube.com/watch?v=${id}`, title, channel, checked: CHECKED }
}

const ROS = 'Royal Osteoporosis Society'
const NIA = 'National Institute on Aging'
const HSS = 'Hospital for Special Surgery'
const NASM = 'National Academy of Sports Medicine (NASM)'
// YouTube gives this channel's name with its Arabic spelling too; the repo keeps the Latin name (English only).
const ASPETAR = 'Aspetar'
const GMB = 'GMB Fitness (Praxis)'

const strengthStage1 = yt('94OadxOIWgc', 'Muscle strengthening exercise for your bones - Stage 1', ROS)
const impactStage3 = yt('3crvpTMTZYk', 'Impact exercise for your bones - Stage 3', ROS)
const walking: VideoLink = {
  url: 'https://www.nhs.uk/live-well/exercise/walking-for-health/',
  title: 'Walking for health - NHS',
  channel: 'NHS',
  checked: CHECKED,
}

/** Exercise id → its link. */
export const videos: Readonly<Record<string, VideoLink>> = {
  // Spine and posture
  'cat-camel': yt('JJkjIKlimW8', 'Cat & Camel', 'Royal Free London NHS Foundation Trust'),
  'chin-tuck': yt('SuY3grzBoiA', 'Exercises to help with posture', ROS),
  'wall-angel': yt('VdMRN6iTgR8', 'Wall Angels', 'Harris Health'),
  'hip-flexor-stretch': yt(
    'mzPvzMivukw',
    'Back Exercises to Strengthen and Stretch (Half-Kneeling Hip Flexor Stretch) | HSS',
    HSS,
  ),
  'one-leg-stance': yt('QT5d4tTXW6U', 'Stand on One Foot Balance Exercise for Older Adults', NIA),
  'heel-to-toe-walk': yt('z_GKdFf3qv4', 'Heel-to-Toe Walk Balance Exercise for Older Adults', NIA),
  // Wrists and handstand
  'wrist-prep': yt('20w70zUTZik', 'Wrist Mobility & Strength (No Equipment)', GMB),
  'wall-plank': yt(
    'kShJnmKMaVc',
    'Handstand Tutorial - L-Shape Exercise Using a Wall',
    'Yoga with Kassandra',
  ),
  'wall-walk': yt('d6_lcWtQDxw', 'Handstand Progression for Perfect Freestanding Handstands', GMB),
  'chest-to-wall-handstand': yt(
    'fj6lKSg5bSM',
    '3 Ways to get into a Chest-To-Wall Handstand',
    'Yuri Marmerstein',
  ),
  'kick-up': yt(
    'Z1BEEzg5L6Q',
    'HANDSTAND KICK UP TUTORIAL All the Levels! Wall to Freestanding',
    'Paul Twyman',
  ),
  bail: yt('P_h4rUJnJTY', 'How to Bail a Handstand', 'Yuri Marmerstein'),
  'heel-pull': yt('OYehg2ruMN0', 'How to Balance a Handstand: Heel pulls', 'Emmet Louis'),
  'freestanding-handstand': yt(
    '2-3wv5kLNnw',
    'The Complete Handstand Guide | From Absolute Beginner',
    'Tom Merrick',
  ),
  'pike-push-up': yt('XckEEwa1BPI', 'How to do a Pike Push-Up', NASM),
  'wall-handstand-push-up': yt(
    'PDKmh0OJ6Ic',
    'Handstand Push-Up For Beginners (Increase Your Strength)',
    'FitnessFAQs',
  ),
  // Strength
  'bodyweight-squat': yt('jyQgzil5KY8', 'The Right Way to Do a Squat', HSS),
  'goblet-squat': yt('nfX7IFK9UNI', 'How to do a Goblet Squat  | Proper Form & Technique | NASM', NASM),
  'split-squat': yt(
    'hbw7hdyOpq0',
    'How to do a Bulgarian Split Squat  | Proper Form & Technique | NASM',
    NASM,
  ),
  'push-up': yt('08pMuPjGpUI', 'Muscle strengthening exercise for your bones - Stage 2', ROS),
  'one-arm-row': yt('DmUX88nWClo', 'How to do a Supported Bent-Over Dumbbell Row', NASM),
  'romanian-deadlift': yt('cQqTHQGzC_M', 'Using the hip hinge to bend safely', ROS),
  'single-leg-romanian-deadlift': yt('6pEL3KxnlEo', 'How to do a Single-Leg Romanian Deadlift', NASM),
  'step-up': strengthStage1,
  'nordic-curl': yt('zd_YToC83TA', 'Nordic Hamstring Exercise - How to perform it correctly?', ASPETAR),
  'overhead-press': yt('MMjBnEBnZKM', 'How to do a Dumbbell Overhead Press', NASM),
  'bent-over-row': yt('DJfQN6xJL28', 'How to do a Dumbbell Bent Over Row', NASM),
  'copenhagen-plank': yt('ougbplWKXYM', 'The Copenhagen Adductor Exercise', ASPETAR),
  'side-plank': yt('E5U7Nv3cd_E', 'Back Exercises to Strengthen and Stretch (Side Plank) | HSS', HSS),
  'calf-raise': yt('qPd73snQfUs', 'Single-Leg Calf Raise (HSS)', HSS),
  'dead-bug': yt('bxn9FBrt4-A', 'How to do a Dead Bug | Proper Form & Technique | NASM', NASM),
  'l-sit': yt('BbAkWxDZKIM', 'L-Sit: Step-by-Step Progressions', GMB),
  'glute-bridge': strengthStage1,
  // Jumps, rope and running
  'squat-jump': yt('tZSYZdtbONc', 'How to do a Squat Jump  | Proper Form & Technique | NASM', NASM),
  'single-leg-hop': impactStage3,
  'pogo-hops': yt('GJ4Wjo_LmCk', 'Impact exercise for your bones - Stage 2', ROS),
  'skater-hops': impactStage3,
  'run-walk': {
    url: 'https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/',
    title: 'Get running with Couch to 5K - Better Health - NHS',
    channel: 'NHS',
    checked: CHECKED,
  },
  'brisk-walk': walking,
  walk: walking,
  // Playground
  'pull-up': yt('9yVGh3XbJ34', 'How to do a Pull-Up | Proper Form & Technique | NASM', NASM),
  // Splits and flexibility
  'worlds-greatest-stretch': yt(
    '-CiWQ2IvY34',
    "The World's Greatest Stretch (Mobility Exercise) by Squat University",
    'Squat University',
  ),
  'leg-swings': yt(
    '-KbrCW3MRbg',
    'Dynamic Multidirectional Leg Swings Stretch',
    'Athletico Physical Therapy',
  ),
  'supported-front-split': yt(
    'yobZX63_bEM',
    'Supported bent-leg partial front splits',
    'Kit Laughlin (Stretch Therapy)',
  ),
  'horse-stance': yt(
    'kXWtk3NLESk',
    'Middle/Straddle Splits Tutorial with Antranik (Gain Passive & Active Flexibility using Horse Stance)',
    'Antranik Kizirian',
  ),
  'straddle-lean': yt('bs63okrxH8E', '15 Minute Pancake Routine (FOLLOW ALONG)', 'Tom Merrick'),
  'supported-side-split': yt(
    'GSwx0yGxtPk',
    'Begin Your Middle Split Journey! (FOLLOW ALONG) #BIG5FLEX',
    'Tom Merrick',
  ),
  'side-lying-leg-raise': yt('xVSwJhJCsgo', 'How to do a Side-Lying Leg Raise', NASM),
}

/**
 * Exercises without a link: no health body's video or page showed the movement as the plan does it, and (for the
 * handstand and split drills) no established coach's video taught it on its own. Listed so a new exercise cannot be
 * left out unseen.
 */
export const noLinkFound: readonly string[] = [
  'upper-back-extension',
  'prone-chest-lift',
  'hand-plank',
  'pike-hold',
  'pistol-squat',
  'scapular-push-up',
  'archer-push-up',
  'pseudo-planche-push-up',
  'pullover',
  'farmer-carry',
  'cossack-squat',
  'single-leg-reach',
  'tibialis-raise',
  'hollow-hold',
  'hollow-rock',
  'broad-jump',
  'rope-basics',
  'rope-skills',
  'easy-run',
  'strides',
  'dead-hang',
  'scapular-pull',
  'negative-pull-up',
  'hanging-knee-raise',
  'half-split',
  'active-front-leg-lift',
  'frog-stretch',
  'switch-90-90',
  'puppy-pose',
  'deep-squat-hold',
  'marching-in-place',
  'easy-cool-down',
]
