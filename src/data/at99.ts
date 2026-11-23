// The At-99 board (plan §11): each ability's line, shown next to its latest result. Lines with a fixed value are our
// rule except the sit-to-rise line, which is the best-surviving group in brito2014. "Trend" lines have no value.
// The plan's last row, "Bonus: Handstand and splits", is three lines here, one per measured value.
import type { z } from 'zod'
import type { At99Line } from './schema'

type At99Input = z.input<typeof At99Line>

export const at99: At99Input[] = [
  {
    ability: 'Stand straight',
    metric: 'wallCm',
    line: 'Wall test 0 cm',
    value: 0,
    direction: 'atMost',
    ourRule: true,
  },
  {
    ability: 'Get up off the floor',
    metric: 'sitRise',
    line: 'Sit-to-rise 8 or more, the best-surviving group in [brito2014]',
    value: 8,
    direction: 'atLeast',
    sources: ['brito2014'],
  },
  { ability: 'Jump', metric: 'jumpReachCm', line: 'Jump-and-reach trend', direction: 'trend', ourRule: true },
  {
    ability: 'Run',
    metric: 'continuousRunKm',
    line: 'Continuous 5 km',
    value: 5,
    direction: 'atLeast',
    ourRule: true,
  },
  {
    ability: 'Balance',
    metric: 'oneLegClosedS',
    line: 'One leg, eyes closed 30 s',
    value: 30,
    direction: 'atLeast',
    ourRule: true,
  },
  {
    ability: 'Carry',
    metric: 'farmerS',
    line: 'Farmer hold 60 s',
    value: 60,
    direction: 'atLeast',
    ourRule: true,
  },
  {
    ability: 'Aerobic reserve',
    metric: 'vo2max',
    line: 'VO2max estimate trend',
    direction: 'trend',
    ourRule: true,
  },
  { ability: 'Bonus', metric: 'handstandFreeS', line: 'Handstand', direction: 'trend', ourRule: true },
  { ability: 'Bonus', metric: 'frontSplitCm', line: 'Front split', direction: 'trend', ourRule: true },
  { ability: 'Bonus', metric: 'sideSplitCm', line: 'Side split', direction: 'trend', ourRule: true },
]
