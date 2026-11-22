// Calculations (design §8): units, HRmax, the Rockport walk, sit-to-rise, height loss.

export const LB_PER_KG = 2.20462
export const MI_PER_KM = 0.621371

export const kgToLb = (kg: number) => kg * LB_PER_KG
export const lbToKg = (lb: number) => lb / LB_PER_KG
export const kmToMi = (km: number) => km * MI_PER_KM
export const miToKm = (mi: number) => mi / MI_PER_KM

/** HRmax ≈ 208 − 0.7 × age [tanaka2001]. */
export function hrMax(age: number): number {
  return 208 - 0.7 * age
}

/** Easy: at or below about 70% of HRmax; hard: 90–95% by the end of each 4-minute interval [helgerud2007]. */
export function heartRateZones(age: number): { easyMax: number; hardMin: number; hardMax: number } {
  const max = hrMax(age)
  return { easyMax: Math.round(max * 0.7), hardMin: Math.round(max * 0.9), hardMax: Math.round(max * 0.95) }
}

export interface RockportInput {
  weightKg: number
  age: number
  sex: 'male' | 'female'
  minutes: number
  heartRate: number
}

export interface RockportResult {
  litresPerMin: number
  /** mL/kg/min = 1000 × L/min ÷ weight (kg). */
  vo2max: number
  /** The equation was built for ages 30–69 [kline1987]. */
  ageInRange: boolean
}

/**
 * The Rockport walk [kline1987], in the abstract's L/min form:
 * 6.9652 + 0.0091 × weight (lb) − 0.0257 × age + 0.5955 × sex (1 male, 0 female) − 0.2240 × time (min) − 0.0115 × HR.
 */
export function rockport(input: RockportInput): RockportResult {
  const lb = kgToLb(input.weightKg)
  const sex = input.sex === 'male' ? 1 : 0
  const l =
    6.9652 +
    0.0091 * lb -
    0.0257 * input.age +
    0.5955 * sex -
    0.224 * input.minutes -
    0.0115 * input.heartRate
  return {
    litresPerMin: l,
    vo2max: (1000 * l) / input.weightKg,
    ageInRange: input.age >= 30 && input.age <= 69,
  }
}

/** Sit-to-rise [brito2014]: (5 − supports sitting) + (5 − supports rising), each part at least 0. */
export function sitRiseScore(supportsSitting: number, supportsRising: number): number {
  return Math.max(0, 5 - supportsSitting) + Math.max(0, 5 - supportsRising)
}

/**
 * Height loss [oc2023]: the tallest earlier record minus today's height. A loss of more than 2 cm is flagged.
 * Measured loss is against an earlier measurement, so the tallest earlier record is used, not only the last.
 */
export function heightLoss(
  earlierCm: readonly number[],
  todayCm: number,
): { lossCm: number; flag: boolean } | null {
  if (earlierCm.length === 0) return null
  const loss = Math.max(...earlierCm) - todayCm
  return { lossCm: Math.round(loss * 10) / 10, flag: loss > 2 }
}

/** Age in whole years in a given year, from the birth year (the profile holds only the year). */
export function ageInYear(birthYear: number, year: number): number {
  return year - birthYear
}
