import { describe, expect, it } from 'vitest'
import {
  heartRateZones,
  heightLoss,
  hrMax,
  kgToLb,
  kmToMi,
  lbToKg,
  miToKm,
  rockport,
  sitRiseScore,
} from '@/lib/calc'

describe('calculations (design §8)', () => {
  it('converts units', () => {
    expect(kgToLb(10)).toBeCloseTo(22.0462, 4)
    expect(lbToKg(kgToLb(12.5))).toBeCloseTo(12.5, 10)
    expect(kmToMi(10)).toBeCloseTo(6.21371, 5)
    expect(miToKm(1)).toBeCloseTo(1.609344, 3)
  })

  it("estimates HRmax as 208 − 0.7 × age, with the plan's example at 40", () => {
    expect(hrMax(40)).toBe(180)
    expect(heartRateZones(40)).toEqual({ easyMax: 126, hardMin: 162, hardMax: 171 })
  })

  it('computes the Rockport estimate in L/min, then mL/kg/min', () => {
    // An invented example: 80 kg, age 40, male, 14 min, heart rate 140.
    const r = rockport({ weightKg: 80, age: 40, sex: 'male', minutes: 14, heartRate: 140 })
    const l = 6.9652 + 0.0091 * 80 * 2.20462 - 0.0257 * 40 + 0.5955 - 0.224 * 14 - 0.0115 * 140
    expect(r.litresPerMin).toBeCloseTo(l, 10)
    expect(r.vo2max).toBeCloseTo((1000 * l) / 80, 10)
    expect(r.ageInRange).toBe(true)
    expect(rockport({ weightKg: 80, age: 29, sex: 'female', minutes: 14, heartRate: 140 }).ageInRange).toBe(
      false,
    )
    expect(rockport({ weightKg: 80, age: 70, sex: 'female', minutes: 14, heartRate: 140 }).ageInRange).toBe(
      false,
    )
  })

  it('scores sit-to-rise from 10, one point off per support, each part at least 0', () => {
    expect(sitRiseScore(0, 0)).toBe(10)
    expect(sitRiseScore(1, 2)).toBe(7)
    expect(sitRiseScore(7, 0)).toBe(5)
  })

  it('measures height loss against the tallest earlier record and flags more than 2 cm', () => {
    expect(heightLoss([], 178)).toBeNull()
    expect(heightLoss([180, 179], 178)).toEqual({ lossCm: 2, flag: false })
    expect(heightLoss([180.5, 179], 178)).toEqual({ lossCm: 2.5, flag: true })
  })
})
