import type { InputsDaily } from "../calculate-results-daily"

export const JOVOTERVEZO_PRODUCT_CODE = "TR03"
export const JOVOTERVEZO_CURRENCY = "HUF" as const

export const JOVOTERVEZO_MIN_DURATION_YEARS = 11
export const JOVOTERVEZO_MAX_DURATION_YEARS = 25

export const JOVOTERVEZO_MIN_ANNUAL_PAYMENT = 240_000
export const JOVOTERVEZO_MIN_EXTRAORDINARY_PAYMENT = 50_000

export const JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT = 4.5
export const JOVOTERVEZO_EXTRAORDINARY_ADMIN_FEE_PERCENT = 1

export const JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.145
export const JOVOTERVEZO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 85
export const JOVOTERVEZO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const JOVOTERVEZO_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH = 1

export const JOVOTERVEZO_PARTIAL_SURRENDER_FIXED_FEE = 2_500
export const JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT = 1_000
export const JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_START_MONTH = 10

export const JOVOTERVEZO_RISK_ACCIDENTAL_DEATH_BENEFIT = 1_000_000
export const JOVOTERVEZO_RISK_COVERAGE_START_YEAR = 1
export const JOVOTERVEZO_RISK_COVERAGE_END_YEAR = 1

export const JOVOTERVEZO_BONUS_MONTHLY_THRESHOLD = 20_000

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.round(durationYears)
  return Math.min(JOVOTERVEZO_MAX_DURATION_YEARS, Math.max(JOVOTERVEZO_MIN_DURATION_YEARS, rounded))
}

export function estimateJovotervezoDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildJovotervezoInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration === 11) return { 1: 55, 2: 20, 3: 15 }
  if (safeDuration === 12) return { 1: 60, 2: 25, 3: 15 }
  if (safeDuration === 13) return { 1: 70, 2: 25, 3: 15 }
  if (safeDuration === 14) return { 1: 75, 2: 30, 3: 15 }
  return { 1: 75, 2: 45, 3: 15 }
}

export function buildJovotervezoInvestedShareByYear(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  const safeDuration = normalizeDurationYears(durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    // Invested (maturity surplus) receives the remainder: 80/50/20.
    if (year === 1) config[year] = 80
    else if (year === 2) config[year] = 50
    else config[year] = 20
  }
  return config
}

function redemptionPercentAfter120Months(durationYears: number): number {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration === 11) return 45
  if (safeDuration === 12 || safeDuration === 13) return 40
  if (safeDuration === 14) return 35
  return 25
}

export function buildJovotervezoRedemptionSchedule(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const after120 = redemptionPercentAfter120Months(safeDuration)
  const schedule: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    schedule[year] = year <= 10 ? 100 : after120
  }
  return schedule
}

export function buildJovotervezoBonusAmountByYear(
  yearlyPaymentsPlan: number[],
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const horizon = Math.min(20, safeDuration)
  let minMonthlyPayment = Number.POSITIVE_INFINITY

  for (let year = 1; year <= horizon; year++) {
    const yearlyValue = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const monthlyEquivalent = yearlyValue / 12
    if (monthlyEquivalent > 0 && monthlyEquivalent < minMonthlyPayment) {
      minMonthlyPayment = monthlyEquivalent
    }
  }

  if (!Number.isFinite(minMonthlyPayment) || minMonthlyPayment < JOVOTERVEZO_BONUS_MONTHLY_THRESHOLD) {
    return {}
  }

  const annualizedMin = minMonthlyPayment * 12
  const bonusByYear: Record<number, number> = {
    10: annualizedMin * 0.6, // 30% + extra 30%
  }

  if (safeDuration >= 15) {
    bonusByYear[safeDuration] = annualizedMin // maturity bonus at contract end
  }

  return bonusByYear
}
