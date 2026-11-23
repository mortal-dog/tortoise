// The teaching videos (D-056, D-060): one YouTube video per exercise (none for the everyday ones: rope, running,
// walking). Nothing is fetched until a name is tapped; then the video plays in YouTube's privacy-enhanced player inside
// the app, and every one allows embedding (checked 2026-11-23, `playableInEmbed`). The kick-up video stands for the bail too (D-061). Each was chosen and checked on 2026-11-23 by looking at its frames (YouTube's storyboard, a grid of stills
// through the whole video), with its title, channel and length: the frames had to show the plan's movement with the
// plan's equipment. A health body or physiotherapist came first, then an established coach or professional body.
// Title and channel are exactly as YouTube's oEmbed returned them (one channel name ends in a space).
import type { VideoLink } from './schema'

const CHECKED = '2026-11-23'

function yt(id: string, title: string, channel: string): VideoLink {
  return { url: `https://www.youtube.com/watch?v=${id}`, title, channel, checked: CHECKED }
}

/** Exercise id → its video. */
export const videos: Readonly<Record<string, VideoLink>> = {
  'cat-camel': yt('JJkjIKlimW8', 'Cat & Camel', 'Royal Free London NHS Foundation Trust'),
  'chin-tuck': yt(
    'LkLed6m3twY',
    'NUH Physiotherapy - Chin Tucks',
    'National University Hospital (NUH) Singapore',
  ),
  'wall-angel': yt('VdMRN6iTgR8', 'Wall Angels', 'Harris Health'),
  'prone-chest-lift': yt(
    'WJkydq1RVvk',
    'How To Do Prone Thoracic Extension - Posture Exercises - Wellen',
    'Wellen',
  ),
  'hip-flexor-stretch': yt(
    'mzPvzMivukw',
    'Back Exercises to Strengthen and Stretch (Half-Kneeling Hip Flexor Stretch) | HSS',
    'Hospital for Special Surgery',
  ),
  'one-leg-stance': yt('HTVVv4ESgms', 'Single Leg Stance (balance)', 'National Stroke Association'),
  'wrist-prep': yt('TG6LePq5auc', 'Daily Wrist Warm Up // Wrist Stretching Routine', 'Tom Morrison'),
  'hand-plank': yt(
    'MDxfAuBbHHA',
    'How to do a Straight-Arm Plank  | Proper Form & Technique | NASM',
    'National Academy of Sports Medicine (NASM)',
  ),
  'pike-hold': yt('exlk6d6BhKc', 'Handstand Prep - Pike Hold', 'Lance Goyke'),
  'wall-plank': yt(
    'kShJnmKMaVc',
    'Handstand Tutorial - L-Shape Exercise Using a Wall',
    'Yoga with Kassandra',
  ),
  'wall-walk': yt('2TnX8j29tRY', 'The Wall Walk', 'CrossFit'),
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
  'freestanding-handstand': yt(
    'd6_lcWtQDxw',
    'Handstand Progression for Perfect Freestanding Handstands',
    'GMB Fitness (Praxis)',
  ),
  'pike-push-up': yt('XckEEwa1BPI', 'How to do a Pike Push-Up', 'National Academy of Sports Medicine (NASM)'),
  'goblet-squat': yt(
    'nfX7IFK9UNI',
    'How to do a Goblet Squat  | Proper Form & Technique | NASM',
    'National Academy of Sports Medicine (NASM)',
  ),
  'split-squat': yt('SX7BtPh_pL0', 'U.S. Marine Corps Fitness - Dumbbell Split Squat', 'U.S. Forces Fitness'),
  'push-up': yt('tf3VNkmzHq0', 'How to work up to a full pushup progression', 'WeShape'),
  'one-arm-row': yt(
    'DmUX88nWClo',
    'How to do a Supported Bent-Over Dumbbell Row',
    'National Academy of Sports Medicine (NASM)',
  ),
  'glute-bridge': yt(
    'PhTDzR0TpZs',
    'How to Do a Glute Bridge Exercise: A Guide from Physical Therapists',
    'Hinge Health',
  ),
  'farmer-carry': yt('p5MNNosenJc', 'The Dumbbell Farmers Carry', 'CrossFit'),
  'side-plank': yt(
    'FwbhtRs8uj4',
    'Complete Physio – 16: Simple Side Plank with Progressions',
    'Complete Physio',
  ),
  'calf-raise': yt('NVMrM-e8eoY', 'Single Leg Calf Raise Off Step', 'John Kahl PT DPT SCS CSCS'),
  'dead-bug': yt('GbSC02oU3To', 'How to Do a Dead Bug: A Guide from Physical Therapists', 'Hinge Health'),
  'hollow-hold': yt(
    'LlDNef_Ztsc',
    'Hollow Body Hold Progression - Gymnastic Core Stability Exercise',
    'GMB Fitness (Praxis)',
  ),
  'squat-jump': yt(
    'tZSYZdtbONc',
    'How to do a Squat Jump  | Proper Form & Technique | NASM',
    'National Academy of Sports Medicine (NASM)',
  ),
  'worlds-greatest-stretch': yt(
    '-CiWQ2IvY34',
    "The World's Greatest Stretch (Mobility Exercise) by Squat University",
    'Squat University',
  ),
  'half-split': yt(
    'gTjRgU8M_B0',
    'Half Split (Ardha Hanumansana) For Hamstring Stretch with Dr. Jenn of Root To Rise PT',
    'Jenn Gelfand ~ Root To Rise PT',
  ),
  'supported-front-split': yt(
    'qWN7irIeWSc',
    'How to get your Front Splits | Blocks & Slider edition ',
    'Hip Pilates Method ',
  ),
  'straddle-lean': yt('mVisirHzJqk', 'Pancake Straddle Stretch', 'Tom Morrison'),
  'supported-side-split': yt(
    'GSwx0yGxtPk',
    'Begin Your Middle Split Journey! (FOLLOW ALONG) #BIG5FLEX',
    'Tom Merrick',
  ),
  'deep-squat-hold': yt(
    'IHApHfNA2Ag',
    'How to Do a Deep Squat According to Physical Therapists',
    'Hinge Health',
  ),
}
