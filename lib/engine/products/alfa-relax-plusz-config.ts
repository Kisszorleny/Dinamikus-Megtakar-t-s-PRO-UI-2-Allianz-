import type { InputsDaily } from "../calculate-results-daily"

export const RELAX_PLUSZ_PRODUCT_CODE = "NY01"
export const RELAX_PLUSZ_CURRENCY = "HUF" as const

export const RELAX_PLUSZ_MIN_DURATION_YEARS = 5
export const RELAX_PLUSZ_MAX_DURATION_YEARS = 50

export const RELAX_PLUSZ_MIN_ANNUAL_PAYMENT = 240_000
export const RELAX_PLUSZ_MIN_EXTRAORDINARY_PAYMENT = 50_000
export const RELAX_PLUSZ_BONUS_MONTHLY_THRESHOLD = 20_000

export const RELAX_PLUSZ_REGULAR_ADMIN_FEE_PERCENT = 4.8
export const RELAX_PLUSZ_EXTRAORDINARY_ADMIN_FEE_PERCENT = 1
export const RELAX_PLUSZ_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.145
export const RELAX_PLUSZ_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 37
export const RELAX_PLUSZ_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const RELAX_PLUSZ_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH = 1

export const RELAX_PLUSZ_PARTIAL_SURRENDER_FIXED_FEE = 2_500
export const RELAX_PLUSZ_TAX_CREDIT_RATE_PERCENT = 20
export const RELAX_PLUSZ_TAX_CREDIT_CAP_PER_YEAR = 130_000
export const RELAX_PLUSZ_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 120

export const RELAX_PLUSZ_RISK_ACCIDENTAL_DEATH_BENEFIT = 1_000_000
export const RELAX_PLUSZ_RISK_COVERAGE_START_YEAR = 1
export const RELAX_PLUSZ_RISK_COVERAGE_END_YEAR = 1

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(RELAX_PLUSZ_MAX_DURATION_YEARS, Math.max(RELAX_PLUSZ_MIN_DURATION_YEARS, rounded))
}

export function estimateRelaxPluszDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildRelaxPluszInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration <= 10) return { 1: 49, 2: 0, 3: 0 }
  if (safeDuration === 11) return { 1: 55, 2: 5, 3: 0 }
  if (safeDuration === 12) return { 1: 55, 2: 15, 3: 0 }
  if (safeDuration === 13) return { 1: 60, 2: 25, 3: 0 }
  if (safeDuration === 14) return { 1: 60, 2: 35, 3: 0 }
  return { 1: 60, 2: 40, 3: 10 }
}

export function buildRelaxPluszInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year === 1 ? 20 : year === 2 ? 50 : 80
  }
  return out
}

function redemptionAfter120MonthsByDuration(durationYears: number): number {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration <= 10) return 100
  if (safeDuration === 11) return 40
  if (safeDuration === 12) return 30
  if (safeDuration === 13) return 37
  if (safeDuration === 14) return 25
  return 18
}

export function buildRelaxPluszRedemptionSchedule(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const after120 = redemptionAfter120MonthsByDuration(safeDuration)
  const schedule: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    schedule[year] = year <= 10 ? 100 : after120
  }
  return schedule
}

function computeAnnualizedMinimumBasePremium(yearlyPaymentsPlan: number[], horizonYears: number): number {
  let minMonthly = Number.POSITIVE_INFINITY
  for (let year = 1; year <= horizonYears; year++) {
    const yearly = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const monthly = yearly / 12
    if (monthly > 0 && monthly < minMonthly) {
      minMonthly = monthly
    }
  }
  if (!Number.isFinite(minMonthly) || minMonthly < RELAX_PLUSZ_BONUS_MONTHLY_THRESHOLD) return 0
  return minMonthly * 12
}

export function buildRelaxPluszBonusAmountByYear(
  yearlyPaymentsPlan: number[],
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const annualizedMinUntil10 = computeAnnualizedMinimumBasePremium(yearlyPaymentsPlan, Math.min(10, safeDuration))
  if (safeDuration >= 10 && annualizedMinUntil10 > 0) {
    // 10. évforduló: 20% alap + 20% extra.
    out[10] = annualizedMinUntil10 * 0.4
  }

  if (safeDuration >= 15) {
    const annualizedMinFullTerm = computeAnnualizedMinimumBasePremium(yearlyPaymentsPlan, safeDuration)
    if (annualizedMinFullTerm > 0) {
      // Lejárat előtti utolsó évforduló: +100%.
      out[safeDuration - 1] = (out[safeDuration - 1] ?? 0) + annualizedMinFullTerm
    }
  }

  return out
}
