// The daily habits (plan §6.10): target and why verbatim. The steps row's "Why" cell is only its citation, so it
// has no `why` text, only the source.
import type { z } from 'zod'
import type { Habit } from './schema'

type HabitInput = z.input<typeof Habit>

export const habits: HabitInput[] = [
  { id: 'steps', name: 'Steps', target: '8,000–10,000 a day', sources: ['paluch2022'] },
  {
    id: 'snacks',
    name: 'Exercise snacks',
    target:
      '3 bursts a day of 1–2 min vigorous effort: stairs two at a time, a fast uphill walk, a minute of fast rope',
    why: 'Three such bursts a day went with 38–40% lower mortality in non-exercisers [stamatakis2022]',
    sources: ['stamatakis2022'],
  },
  {
    id: 'sitting-breaks',
    name: 'Sitting breaks',
    target: 'Stand and move every 30–60 min at a desk (our rule)',
    why: 'The WHO advises less sitting, though no threshold was proven [bull2020]',
    sources: ['bull2020'],
    ourRule: true,
  },
  {
    id: 'daylight',
    name: 'Daylight',
    target: 'Some time outside every day, at midday when possible (our rule)',
    why: '§12',
    ourRule: true,
  },
]
