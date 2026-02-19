import type { InputsDaily } from "../calculate-results-daily"

export const JOVOKEP_PRODUCT_CODE = "TR10"
export const JOVOKEP_CURRENCY = "HUF" as const

export const JOVOKEP_MIN_ENTRY_AGE = 16
export const JOVOKEP_MAX_ENTRY_AGE = 70
export const JOVOKEP_MAX_AGE_AT_MATURITY = 75

export const JOVOKEP_MIN_DURATION_YEARS = 5
export const JOVOKEP_MAX_DURATION_YEARS = 40

export const JOVOKEP_MIN_ANNUAL_PAYMENT = 360_000
export const JOVOKEP_MIN_EXTRAORDINARY_PAYMENT = 100_000

export const JOVOKEP_REGULAR_ADMIN_FEE_PERCENT = 5
export const JOVOKEP_EXTRAORDINARY_ADMIN_FEE_PERCENT = 3

export const JOVOKEP_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.165
export const JOVOKEP_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 37
export const JOVOKEP_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const JOVOKEP_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH = 1

export const JOVOKEP_PARTIAL_SURRENDER_FIXED_FEE = 2_500
export const JOVOKEP_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT = 1_000
export const JOVOKEP_PAID_UP_MAINTENANCE_FEE_START_MONTH = 10

export const JOVOKEP_RISK_ACCIDENTAL_DEATH_BENEFIT = 1_000_000
export const JOVOKEP_RISK_COVERAGE_START_YEAR = 1
export const JOVOKEP_RISK_COVERAGE_END_YEAR = 3

export const JOVOKEP_BONUS_PERCENT_BY_YEAR: Record<number, number> = {
  10: 120, // 90% + additional 30%
  15: 50,
  20: 25,
}

function normalizeDurationYears(durationYears: number): number {
  const safe = Math.round(durationYears)
  return Math.min(JOVOKEP_MAX_DURATION_YEARS, Math.max(JOVOKEP_MIN_DURATION_YEARS, safe))
}

export function estimateJovokepDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildJovokepInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration >= 15) return { 1: 75, 2: 45, 3: 15 }
  if (safeDuration === 14) return { 1: 70, 2: 35, 3: 15 }
  if (safeDuration === 13) return { 1: 70, 2: 30, 3: 10 }
  if (safeDuration === 12) return { 1: 65, 2: 25, 3: 10 }
  if (safeDuration === 11) return { 1: 65, 2: 15, 3: 10 }
  if (safeDuration === 10) return { 1: 55, 2: 15, 3: 10 }
  if (safeDuration === 9) return { 1: 50, 2: 15, 3: 10 }
  if (safeDuration === 8) return { 1: 40, 2: 15, 3: 10 }
  if (safeDuration === 7) return { 1: 30, 2: 15, 3: 10 }
  if (safeDuration === 6) return { 1: 20, 2: 15, 3: 10 }
  return { 1: 15, 2: 15, 3: 10 }
}

export function buildJovokepInvestedShareByYear(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  const safeDuration = normalizeDurationYears(durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    // Invested (maturity surplus) account receives the remainder: 80/50/20.
    if (year === 1) config[year] = 80
    else if (year === 2) config[year] = 50
    else config[year] = 20
  }
  return config
}

export function buildJovokepRedemptionSchedule(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const schedule: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 10) {
      schedule[year] = 100
    } else {
      schedule[year] = safeDuration > 10 ? 30 : 100
    }
  }
  return schedule
}

export function clampJovokepEntryAge(entryAge: number | undefined, durationYears: number): number {
  const safeEntryAge = Math.round(entryAge ?? 38)
  const maxByMaturity = JOVOKEP_MAX_AGE_AT_MATURITY - Math.max(1, Math.round(durationYears))
  const effectiveMax = Math.max(JOVOKEP_MIN_ENTRY_AGE, Math.min(JOVOKEP_MAX_ENTRY_AGE, maxByMaturity))
  return Math.max(JOVOKEP_MIN_ENTRY_AGE, Math.min(effectiveMax, safeEntryAge))
}

export function isJovokepBonusEligible(yearlyPaymentsPlan: number[], durationYears: number): boolean {
  const horizon = Math.min(normalizeDurationYears(durationYears), 20)
  for (let year = 1; year <= horizon; year++) {
    if ((yearlyPaymentsPlan[year] ?? 0) <= 0) return false
  }
  return true
}

export function buildJovokepBonusAmountByYear(
  yearlyPaymentsPlan: number[],
  durationYears: number,
): Record<number, number> {
  if (!isJovokepBonusEligible(yearlyPaymentsPlan, durationYears)) return {}
  const horizon = Math.min(normalizeDurationYears(durationYears), 20)
  let minMonthlyPremium = Number.POSITIVE_INFINITY
  for (let year = 1; year <= horizon; year++) {
    const yearlyPayment = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const monthlyEquivalent = yearlyPayment / 12
    if (monthlyEquivalent > 0 && monthlyEquivalent < minMonthlyPremium) {
      minMonthlyPremium = monthlyEquivalent
    }
  }
  if (!Number.isFinite(minMonthlyPremium) || minMonthlyPremium <= 0) return {}
  const annualizedMin = minMonthlyPremium * 12
  return {
    10: annualizedMin * ((JOVOKEP_BONUS_PERCENT_BY_YEAR[10] ?? 0) / 100),
    15: annualizedMin * ((JOVOKEP_BONUS_PERCENT_BY_YEAR[15] ?? 0) / 100),
    20: annualizedMin * ((JOVOKEP_BONUS_PERCENT_BY_YEAR[20] ?? 0) / 100),
  }
}
