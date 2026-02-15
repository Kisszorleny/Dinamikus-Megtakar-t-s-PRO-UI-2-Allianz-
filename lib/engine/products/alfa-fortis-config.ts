import type { InputsDaily } from "../calculate-results-daily"

export const FORTIS_MIN_ANNUAL_PAYMENT = 300_000
export const FORTIS_MIN_EXTRAORDINARY_PAYMENT = 50_000
export const FORTIS_MIN_ENTRY_AGE = 16
export const FORTIS_MAX_ENTRY_AGE = 70

export function estimateFortisDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function buildFortisInitialCostByYear(): Record<number, number> {
  return { 1: 75, 2: 42, 3: 15 }
}

export function buildFortisRedemptionSchedule(durationYears: number): Record<number, number> {
  const schedule: Record<number, number> = {}
  const safeDuration = Math.max(1, durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) schedule[year] = 100
    else if (year === 2) schedule[year] = 3.5
    else if (year >= 3 && year <= 8) schedule[year] = 1.95
    else if (year >= 9 && year <= 15) schedule[year] = 1.5
    else schedule[year] = 0
  }
  return schedule
}

export function buildFortisBonusAmountByYear(minAnnualizedContribution: number): Record<number, number> {
  if (minAnnualizedContribution <= 0) return {}
  return {
    8: minAnnualizedContribution * 0.7,
    15: minAnnualizedContribution * 0.45,
    20: minAnnualizedContribution * 0.6,
  }
}

