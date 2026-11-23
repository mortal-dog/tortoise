import { describe, expect, it } from 'vitest'
import { heartRateZones, hrMax, kgToLb, kmToMi, lbToKg, miToKm } from '@/lib/calc'

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
})
