// The week template (plan §5). `expectedMinutes` is the "Total" column: "~60 min" reads as 55–65, "~70 min" as
// 65–75, "~55–65 min" as written, "~1.5–2 h" as 90–120, and Sunday's "~45 min + walk" as 45 (the walk has no length
// in the plan and is left out, as in the Light session's minutes).
import type { z } from 'zod'
import type { WeekTemplate } from './schema'

type WeekTemplateInput = z.input<typeof WeekTemplate>

export const week: WeekTemplateInput = {
  mon: {
    morning: 'morning',
    main: 'strength-a',
    split: 'split-front',
    expectedMinutes: { min: 55, max: 65 },
  },
  tue: { morning: 'morning', main: 'easy-run', split: 'split-side', expectedMinutes: { min: 65, max: 75 } },
  wed: {
    morning: 'morning',
    main: 'strength-b',
    split: 'split-front',
    expectedMinutes: { min: 55, max: 65 },
  },
  thu: { morning: 'morning', main: 'intervals', split: 'split-side', expectedMinutes: { min: 55, max: 65 } },
  fri: {
    morning: 'morning',
    main: 'strength-c',
    split: 'split-short',
    expectedMinutes: { min: 55, max: 65 },
  },
  sat: { morning: 'morning', main: 'long', split: 'split-short', expectedMinutes: { min: 90, max: 120 } },
  sun: { morning: 'morning', main: 'light', split: null, expectedMinutes: { min: 45, max: 45 } },
}
