// Calculations (design §8): units and HRmax.

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

/** Age in whole years in a given year, from the birth year (the profile holds only the year). */
export function ageInYear(birthYear: number, year: number): number {
  return year - birthYear
}
