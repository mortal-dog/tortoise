// The plan's reasoning that has no other home in the data (see Rationale in schema.ts). Texts are the plan's own,
// verbatim with their citations; only the markdown emphasis is dropped. The §3 and §5 rows join the table's cells
// with "How to check:", "This plan:" and "The benchmark:".
import type { z } from 'zod'
import type { Rationale } from './schema'

type RationaleInput = z.input<typeof Rationale>

export const rationale: RationaleInput[] = [
  // §1 The goals and what they need
  {
    id: 'hunched-back',
    topic: 'A hunched back is more than looks',
    section: '1',
    text: 'Older people with a hyperkyphotic posture died at a 1.44 times higher rate [kado2004]. The most hunched had 3.7 times the odds of needing their arms to rise from a chair [kado2005].',
    sources: ['kado2004', 'kado2005'],
  },
  {
    id: 'posture-lifetime',
    topic: 'Posture work has to last a lifetime',
    section: '1',
    text: 'In adults over 60 with a hunched back, spine strengthening with posture training cut the curve by 3.0° in 6 months, and 1.6° of it came back in the 6 months after the programme ended [sheaf2017]. That is why the straight-back routine runs every morning rather than in a 12-week course.',
    sources: ['sheaf2017'],
  },
  {
    id: 'bone-loading',
    topic: 'Bone answers loads that come and go',
    section: '1',
    text: 'Bone responds to dynamic loading, such as lifting, lowering and landing, not to a weight held still [turner1998]. In an animal experiment, a bone under a constant load lost as much as an unloaded one [lanyon1984]. In women around and after menopause, walking alone did not significantly change spine density [ma2013].',
    sources: ['turner1998', 'lanyon1984', 'ma2013'],
  },
  {
    id: 'heavier-builds-more',
    topic: 'Heavier, for you, builds more',
    section: '1',
    text: 'These trials were in people with low bone mass. Supervised heavy lifting with jumps raised spine density by 2.9% in women past menopause [liftmor2018] and by 4.1% in older men [harding2020]. In the same trial the women\'s upper-back curve fell 6.7°, against 1.6° in controls [liftmor2019]. Leg resistance training raised hip density in women past menopause [howe2011], and in men exercise had small, positive effects on bone [mages2021]. At home, without supervision, the plan stays at "heavy for you" (8–12 clean reps) [ros2022], made heavier by one-leg variants, slower tempo and backpack load.',
    sources: ['liftmor2018', 'harding2020', 'liftmor2019', 'howe2011', 'mages2021', 'ros2022'],
  },
  {
    id: 'fitness-declines',
    topic: 'Fitness declines faster with age',
    section: '1',
    text: 'Peak aerobic capacity falls 3–6% per decade in the 20s and 30s, and more than 20% per decade from the 70s on. It falls at about the same rate at every activity level [fleg2005]. Training does not stop the slide; it raises the point the slide starts from.',
    sources: ['fleg2005'],
  },
  {
    id: 'line-to-stay-above',
    topic: 'There is a line to stay above',
    section: '1',
    text: 'Independent living at 85 needs about 18 mL/kg/min of aerobic power in men and 15 in women [paterson1999]. The higher the capacity built at 40–60, the later in life that line is crossed.',
    sources: ['paterson1999'],
  },
  {
    id: 'fitness-pays',
    topic: 'More fitness kept paying',
    section: '1',
    text: 'Elite against low fitness carried a hazard ratio of 0.20 for death, with "no observed upper limit of benefit" [mandsager2018]. Each MET more went with 13% lower risk [kodama2009].',
    sources: ['mandsager2018', 'kodama2009'],
  },
  {
    id: 'power-fades-first',
    topic: 'Power fades first',
    section: '1',
    text: 'Muscle power declines earlier and more steeply than strength [reid2012], so this plan keeps jumping for life.',
    sources: ['reid2012'],
  },
  {
    id: 'bones-start-early',
    topic: 'Bones start early',
    section: '1',
    text: "Men's bone loss began at 25–39 in a Canadian cohort [berger2008].",
    sources: ['berger2008'],
  },
  // §2 The tortoise rules
  {
    id: 'heavy-for-you',
    topic: 'Heavy for you, never maximal alone',
    section: '2',
    text: 'Use a load you can lift 8–12 times with good form, building to 3 sets [ros2022]. End each set 1–2 reps before form would break (our rule). No one-rep-maximum attempts at home.',
    sources: ['ros2022'],
    ourRule: true,
  },
  {
    id: 'small-steps',
    topic: 'Small steps',
    section: '2',
    text: 'The run–walk ladder moves one step at a time, with at least a week on each step. Beyond the ladder, running time grows by at most 10% a week (our rule). Novice runners who raised their weekly distance by more than 30% over two weeks seemed more prone to distance-related injuries, though the difference was not statistically significant [nielsen2014].',
    sources: ['nielsen2014'],
    ourRule: true,
  },
  // §3 How hard is hard
  {
    id: 'effort-easy',
    topic: 'Easy',
    section: '3',
    text: 'You can talk in full sentences. How to check: The talk test. With a heart-rate monitor: at or below about 70% of HRmax, the "long slow distance" intensity in [helgerud2007]',
    sources: ['helgerud2007'],
  },
  {
    id: 'effort-hard',
    topic: 'Hard (intervals)',
    section: '3',
    text: 'Only a few words at a time; you could not hold it much longer than the interval. How to check: 90–95% of HRmax by the end of each 4-minute interval [helgerud2007]',
    sources: ['helgerud2007'],
  },
  {
    id: 'effort-hrmax',
    topic: 'HRmax',
    section: '3',
    text: "Maximal heart rate. How to check: About 208 − 0.7 × age [tanaka2001]. At 40: about 180, so easy is up to about 126 and hard is about 162–171. The formula is an average, and one person's real HRmax can sit well away from it, so the talk test wins when they disagree (our rule)",
    sources: ['tanaka2001'],
    ourRule: true,
  },
  // §5 The week against the evidence
  {
    id: 'week-moderate-aerobic',
    topic: 'Moderate aerobic',
    section: '5',
    text: 'This plan: Easy run 30–40 min + long run 45–90 min + the walks ≈ 120–170 min, before the daily steps. The benchmark: 150–300 min a week of moderate activity, or 75–150 min of vigorous, or a mix [bull2020]',
    sources: ['bull2020'],
    ourRule: true,
  },
  {
    id: 'week-vigorous-aerobic',
    topic: 'Vigorous aerobic',
    section: '5',
    text: 'This plan: 16 min hard in the 4 × 4, plus rope bursts. The benchmark: 4 × 4 min at 90–95% HRmax raised VO2max 7.2% in 8 weeks (done 3 times a week in the trial) [helgerud2007]',
    sources: ['helgerud2007'],
    ourRule: true,
  },
  {
    id: 'week-strength',
    topic: 'Strength',
    section: '5',
    text: 'This plan: 3 sessions of about 30 min. The benchmark: Mortality risk was lowest at about 30–60 min a week; above that the effect was unclear [momma2022]. The extra minutes here serve bone, the skills and the goals',
    sources: ['momma2022'],
    ourRule: true,
  },
  {
    id: 'week-impact',
    topic: 'Impact',
    section: '5',
    text: 'This plan: Rope in the strength and interval warm-ups, jumps, running. The benchmark: About 50 moderate impacts on most days [ros2022]',
    sources: ['ros2022'],
  },
  {
    id: 'week-back-extension',
    topic: 'Back extension',
    section: '5',
    text: 'This plan: Light every morning, loaded on Monday. The benchmark: 3–5 reps held 3–5 s, at least twice a week [ros2022]',
    sources: ['ros2022'],
  },
  {
    id: 'week-balance',
    topic: 'Balance',
    section: '5',
    text: 'This plan: Every day. The benchmark: Balance and functional exercise cut the rate of falls by 24% [sherrington2019]',
    sources: ['sherrington2019'],
  },
  {
    id: 'week-stretching',
    topic: 'Stretching',
    section: '5',
    text: 'This plan: Each split 5 days a week. The benchmark: Static stretching at least 5 days a week [thomas2018]',
    sources: ['thomas2018'],
    ourRule: true,
  },
  // §6.9 Split blocks
  {
    id: 'stretch-hold-still',
    topic: 'Hold each position still',
    section: '6.9',
    text: 'Hold each position still: static stretching gave larger gains than bouncing or contract–relax methods [thomas2018]. Breathe slowly and sink a little on each breath out. Stretch at 5–7 out of 10, never sharp pain (our rule).',
    sources: ['thomas2018'],
    ourRule: true,
  },
  {
    id: 'stretch-why',
    topic: 'Why the split blocks',
    section: '6.9',
    text: 'Static stretching at least 5 days a week was the pattern that improved range of motion. Weekly time and frequency mattered, not the length of one session [thomas2018]. Strength training improved range of motion as much as stretching did [afonso2021], which is why the wide goblet squats, bridges and hip thrusts are in the strength days.',
    sources: ['thomas2018', 'afonso2021'],
  },
  {
    id: 'stretch-expect',
    topic: 'What to expect from the splits',
    section: '6.9',
    text: 'In the first 3–8 weeks, most of the gain is the nervous system tolerating the stretch, not longer muscle. What longer programmes change in the muscle had not been measured [weppler2010]. Expect the splits to take months to years, not weeks. Hip bones differ in shape, and a flat side split is not possible for every hip, so any steady gain counts.',
    sources: ['weppler2010'],
  },
  // §9 Over the years
  {
    id: 'bone-density-checks',
    topic: 'Bone-density checks',
    section: '9',
    text: 'Bone density at 70 for everyone [oc2023].',
    sources: ['oc2023'],
  },
  // §12 Outdoors, weather and daylight
  {
    id: 'vitamin-d',
    topic: 'Vitamin D',
    section: '12',
    text: 'Winter sun at southern Canadian latitudes makes none. On cloudless days, skin made no previtamin D3 from November through February at 42° N, and from October through March at 52° N [webb1988]. In the rest of the year the sun does make it. Vitamin D intake is nutrition, which is outside this app; that is a question for a doctor.',
    sources: ['webb1988'],
  },
  // §13 Safety
  {
    id: 'safety-lifting',
    topic: 'Lifting',
    section: '13',
    text: 'Keep the upper back straight; avoid deep forward bending under load [ros2022]. The plan has no lift that bends forward under load.',
    sources: ['ros2022'],
  },
  {
    id: 'safety-impact',
    topic: 'Impact',
    section: '13',
    text: 'After a spine fracture, impact only up to brisk walking [ros2022].',
    sources: ['ros2022'],
  },
]
