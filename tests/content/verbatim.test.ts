// Texts copied from the plan stay verbatim: each one is found in docs/2-exercise-plan.md (with the markdown emphasis
// dropped). The few texts the data composes are listed below with the reason, so a new one cannot slip in unseen.
import { describe, expect, it } from 'vitest'
import { plan } from '@/data/plan'
import { readRepoFile } from '../guard/repo'

const doc = readRepoFile('docs/2-exercise-plan.md')
  .replace(/\*\*/g, '')
  .replace(/\*our rule\*/g, 'our rule')
  .replace(/\n +/g, ' ')
  .replace(/\n(?![|#\n-])/g, ' ')

/** Texts the data writes itself, each with its reason. */
const COMPOSED: Record<string, string> = {
  // The first letter is capitalised where the data starts a sentence the plan starts after a colon.
  'Runners had a 30% lower risk of death and about 3 years more life expectancy, and 5–10 slow minutes a day was enough [lee2014]. Any running, even once a week, went with 27% lower risk [pedisic2020]. Easy running builds the base without the cost of hard running.':
    'capitalised',
  'With total work matched, the interval groups raised VO2max more than steady running did; the 4 × 4 gave +7.2% in 8 weeks [helgerud2007]. Low aerobic fitness carried as much risk of death as smoking, diabetes or coronary disease, or more [mandsager2018]. Older adults doing intervals twice a week for five years showed a trend to lower mortality, not a proven effect [stensvold2020].':
    'capitalised',
  'Winter sun at southern Canadian latitudes makes none. On cloudless days, skin made no previtamin D3 from November through February at 42° N, and from October through March at 52° N [webb1988]. In the rest of the year the sun does make it. Vitamin D intake is nutrition, which is outside this app; that is a question for a doctor.':
    'capitalised',
  'In the first 3–8 weeks, most of the gain is the nervous system tolerating the stretch, not longer muscle. What longer programmes change in the muscle had not been measured [weppler2010]. Expect the splits to take months to years, not weeks. Hip bones differ in shape, and a flat side split is not possible for every hip, so any steady gain counts.':
    'capitalised',
  'Keep the upper back straight; avoid deep forward bending under load [ros2022]. The plan has no lift that bends forward under load.':
    'capitalised',
  'After a spine fracture, impact only up to brisk walking [ros2022].': 'capitalised',
  'Long easy run (or run–walk, or a hike) in daylight. It starts at 30–45 min in Block 1 and grows by at most 10% a week (our rule), to 60–75 min in year 1 and up to 90 min later.':
    'drops ", after 5 min of brisk walking": the walk is its own step',
  // Doses the plan gives in running text, not in a table cell.
  '30–45 min in Block 1, growing by at most 10% a week': 'from §6.8 running text',
  'An easy walk': 'capitalised from §5',
  // Notes that join two places of the plan.
  'Long form: every hold of both blocks done twice. Half-kneeling hip-flexor stretch, pelvis tucked':
    'joins the long form rule to the first hold',
  'Seated straddle, leaning forward from the hips with a flat back (the seated straddle is the pancake)':
    'joins §6.9 running text',
  // Notes of ladder tables that join the lines under a table.
  // D-056: notes the data writes for the new indoor walk, plyometrics and handstand track.
  'Indoor version (rain, ice, storm, dangerous footing): walk briskly in circles around a room, longer than the run because walking is easier (our rule).':
    'the §6.6 bullet without its dose',
  'Indoor version (rain, ice, storm, dangerous footing): walk briskly in circles around a room. At most 60 min; the long run waits for the next safe Saturday (our rule).':
    'the §6.8 bullet without its dose and its order',
  'Plyometrics, while fresh: squat jumps, landing softly on both feet': 'the §6.7 bullet without its dose',
  'Indoors on the rope, using the alternate-foot running step and high knees. Outdoors in good weather, run the same intervals, uphill if possible. The easy parts are an easy bounce or a walk.':
    'capitalised',
  'Wednesday A2; hollow holds on Monday support it.': 'the parenthesis after "Strength track"',
  'Static stretching at least 5 days a week was the pattern that improved range of motion. Weekly time and frequency mattered, not the length of one session [thomas2018]. Strength training improved range of motion as much as stretching did [afonso2021], which is why the wide goblet squats, bridges and hip thrusts are in the strength days.':
    'capitalised',
}

/** Splits the joined §3 and §5 rationale texts back into the table cells they join. */
function parts(text: string): string[] {
  return text
    .split(/(?:^|\. )(?:How to check|This plan|The benchmark): /)
    .map((p) => p.trim())
    .filter(Boolean)
}

describe('texts copied from the plan', () => {
  it('are found verbatim in it, or are listed as composed', () => {
    const texts: string[] = []
    for (const s of plan.sessions) {
      for (const st of s.steps)
        texts.push(st.dose, ...(st.why ? [st.why] : []), ...(st.note ? [st.note] : []))
    }
    for (const l of plan.ladders) {
      if (l.note) texts.push(l.note)
      for (const lv of l.levels) texts.push(lv.name, lv.pass.text)
    }
    for (const st of plan.blockRules.intervalStages) texts.push(st.text)
    for (const r of plan.rationale) texts.push(...parts(r.text))

    const missing = [...new Set(texts)].filter((t) => !COMPOSED[t] && !doc.includes(t))
    expect(missing).toEqual([])
  })

  it('list no composed text that is unused or in fact verbatim', () => {
    const all = JSON.stringify(plan)
    expect(Object.keys(COMPOSED).filter((t) => !all.includes(JSON.stringify(t).slice(1, -1)))).toEqual([])
    expect(Object.keys(COMPOSED).filter((t) => doc.includes(t))).toEqual([])
  })
})
