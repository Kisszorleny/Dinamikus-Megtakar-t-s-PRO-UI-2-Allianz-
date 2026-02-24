import type { Currency, InputsDaily } from "../calculate-results-daily"

export type MetlifeManhattanVariant = "huf" | "eur"

export const METLIFE_MANHATTAN_HUF_MNB_CODE = "MET-689" as const
export const METLIFE_MANHATTAN_EUR_MNB_CODE = "MET-789" as const
export const METLIFE_MANHATTAN_PRODUCT_CODE_HUF = "MET-689" as const
export const METLIFE_MANHATTAN_PRODUCT_CODE_EUR = "MET-789" as const
export const METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF = "metlife_manhattan_huf" as const
export const METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR = "metlife_manhattan_eur" as const

export const METLIFE_MANHATTAN_MIN_DURATION_YEARS = 10
export const METLIFE_MANHATTAN_MAX_DURATION_YEARS = 80

export const METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_HUF = 120_000
export const METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_EUR = 400
export const METLIFE_MANHATTAN_MIN_MONTHLY_PAYMENT_HUF = 10_000
export const METLIFE_MANHATTAN_MIN_MONTHLY_PAYMENT_EUR = 33.3
export const METLIFE_MANHATTAN_MIN_EXTRAORDINARY_PAYMENT_HUF = 20_000
export const METLIFE_MANHATTAN_MIN_EXTRAORDINARY_PAYMENT_EUR = 65

export const METLIFE_MANHATTAN_ACCOUNT_MAINTENANCE_MONTHLY_AMOUNT_HUF = 500
export const METLIFE_MANHATTAN_ACCOUNT_MAINTENANCE_MONTHLY_AMOUNT_EUR = 1.6
export const METLIFE_MANHATTAN_POLICY_CHANGE_FEE_HUF = 600
export const METLIFE_MANHATTAN_POLICY_CHANGE_FEE_EUR = 2
export const METLIFE_MANHATTAN_PAPER_NOTICE_FEE_HUF = 300
export const METLIFE_MANHATTAN_PAPER_NOTICE_FEE_EUR = 1

export const METLIFE_MANHATTAN_PARTIAL_SURRENDER_MIN_BALANCE_HUF = 250_000
export const METLIFE_MANHATTAN_PARTIAL_SURRENDER_MIN_BALANCE_EUR = 800
export const METLIFE_MANHATTAN_PARTIAL_SURRENDER_FIXED_FEE_HUF = 500
export const METLIFE_MANHATTAN_PARTIAL_SURRENDER_FIXED_FEE_EUR = 1.6

export const METLIFE_MANHATTAN_REGULAR_ASSET_FEE_ANNUAL_PERCENT_BEFORE_YEAR16 = 3.25
export const METLIFE_MANHATTAN_REGULAR_ASSET_FEE_ANNUAL_PERCENT_FROM_YEAR16 = 2.93

export const METLIFE_MANHATTAN_INITIAL_COST_BY_YEAR: Record<number, number> = {
  1: 60,
  2: 35,
  3: 20,
}

export const METLIFE_MANHATTAN_STRICT_UNSPECIFIED_RULES = true
export const METLIFE_MANHATTAN_ENABLE_RISK_FEE_TABLE = false
export const METLIFE_MANHATTAN_ENABLE_SINGLE_PREMIUM_FLOW = false
export const METLIFE_MANHATTAN_ENABLE_SWITCH_EVENT_FEE_TRACKING = false
export const METLIFE_MANHATTAN_ENABLE_PORTFOLIO_PLUS_LEDGER = false

const METLIFE_MANHATTAN_REGULAR_SURRENDER_PAYOUT_PERCENT_BY_YEAR: Record<number, number> = {
  1: 65,
  2: 80,
  3: 96,
  4: 96,
  5: 96,
  6: 96,
  7: 96,
  8: 97,
  9: 98,
  10: 99,
}

const METLIFE_MANHATTAN_REGULAR_BONUS_FIXED_PERCENT_BY_YEAR: Record<number, number> = {
  15: 30,
  20: 40,
  25: 50,
  30: 65,
  35: 80,
  40: 95,
  45: 110,
  50: 125,
  55: 140,
  60: 155,
  65: 170,
}

export interface MetlifeManhattanVariantConfig {
  variant: MetlifeManhattanVariant
  currency: "HUF" | "EUR"
  mnbCode: string
  productCode: "MET-689" | "MET-789"
  productVariantId: string
  minAnnualPayment: number
  minMonthlyPayment: number
  minExtraordinaryPayment: number
  accountMaintenanceMonthlyAmount: number
  partialSurrenderFixedFeeAmount: number
  partialSurrenderMinimumBalanceAfterAmount: number
  policyChangeFeeAmount: number
  paperNoticeFeeAmount: number
}

const HUF_CONFIG: MetlifeManhattanVariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: METLIFE_MANHATTAN_HUF_MNB_CODE,
  productCode: METLIFE_MANHATTAN_PRODUCT_CODE_HUF,
  productVariantId: METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF,
  minAnnualPayment: METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_HUF,
  minMonthlyPayment: METLIFE_MANHATTAN_MIN_MONTHLY_PAYMENT_HUF,
  minExtraordinaryPayment: METLIFE_MANHATTAN_MIN_EXTRAORDINARY_PAYMENT_HUF,
  accountMaintenanceMonthlyAmount: METLIFE_MANHATTAN_ACCOUNT_MAINTENANCE_MONTHLY_AMOUNT_HUF,
  partialSurrenderFixedFeeAmount: METLIFE_MANHATTAN_PARTIAL_SURRENDER_FIXED_FEE_HUF,
  partialSurrenderMinimumBalanceAfterAmount: METLIFE_MANHATTAN_PARTIAL_SURRENDER_MIN_BALANCE_HUF,
  policyChangeFeeAmount: METLIFE_MANHATTAN_POLICY_CHANGE_FEE_HUF,
  paperNoticeFeeAmount: METLIFE_MANHATTAN_PAPER_NOTICE_FEE_HUF,
}

const EUR_CONFIG: MetlifeManhattanVariantConfig = {
  variant: "eur",
  currency: "EUR",
  mnbCode: METLIFE_MANHATTAN_EUR_MNB_CODE,
  productCode: METLIFE_MANHATTAN_PRODUCT_CODE_EUR,
  productVariantId: METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR,
  minAnnualPayment: METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_EUR,
  minMonthlyPayment: METLIFE_MANHATTAN_MIN_MONTHLY_PAYMENT_EUR,
  minExtraordinaryPayment: METLIFE_MANHATTAN_MIN_EXTRAORDINARY_PAYMENT_EUR,
  accountMaintenanceMonthlyAmount: METLIFE_MANHATTAN_ACCOUNT_MAINTENANCE_MONTHLY_AMOUNT_EUR,
  partialSurrenderFixedFeeAmount: METLIFE_MANHATTAN_PARTIAL_SURRENDER_FIXED_FEE_EUR,
  partialSurrenderMinimumBalanceAfterAmount: METLIFE_MANHATTAN_PARTIAL_SURRENDER_MIN_BALANCE_EUR,
  policyChangeFeeAmount: METLIFE_MANHATTAN_POLICY_CHANGE_FEE_EUR,
  paperNoticeFeeAmount: METLIFE_MANHATTAN_PAPER_NOTICE_FEE_EUR,
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(METLIFE_MANHATTAN_MAX_DURATION_YEARS, Math.max(METLIFE_MANHATTAN_MIN_DURATION_YEARS, rounded))
}

function averageAnnualPaidPremiumUntilYear(inputs: InputsDaily, endYear: number): number {
  const safeEndYear = Math.max(1, Math.round(endYear))
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  let totalPaid = 0
  for (let year = 1; year <= safeEndYear; year++) {
    totalPaid += Math.max(0, yearlyPayments[year] ?? 0)
  }
  return totalPaid / safeEndYear
}

function hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs: InputsDaily, endYear: number): boolean {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  for (let year = 1; year <= endYear; year++) {
    if ((yearlyPayments[year] ?? 0) <= 0) return false
    if ((yearlyWithdrawals[year] ?? 0) > 0) return false
  }
  return true
}

function resolveRegularBonusPercentAtYear10(averageAnnualPayment: number, currency: Currency): number {
  if (currency === "EUR") {
    if (averageAnnualPayment < 800) return 50
    if (averageAnnualPayment < 1_000) return 100
    return 110
  }
  if (averageAnnualPayment < 200_000) return 50
  if (averageAnnualPayment < 300_000) return 100
  return 110
}

export function resolveMetlifeManhattanVariant(
  productVariant?: string,
  currency?: Currency,
): MetlifeManhattanVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (
      normalized.includes("met-789") ||
      normalized.includes("_eur") ||
      normalized.includes("eur") ||
      normalized.includes("789")
    ) {
      return "eur"
    }
    if (
      normalized.includes("met-689") ||
      normalized.includes("_huf") ||
      normalized.includes("huf") ||
      normalized.includes("689")
    ) {
      return "huf"
    }
  }
  if (currency === "EUR") return "eur"
  return "huf"
}

export function getMetlifeManhattanVariantConfig(
  productVariant?: string,
  currency?: Currency,
): MetlifeManhattanVariantConfig {
  const variant = resolveMetlifeManhattanVariant(productVariant, currency)
  return variant === "eur" ? EUR_CONFIG : HUF_CONFIG
}

export function toMetlifeManhattanProductVariantId(variant: MetlifeManhattanVariant): string {
  return variant === "eur" ? METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR : METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF
}

export function estimateMetlifeManhattanDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildMetlifeManhattanInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = METLIFE_MANHATTAN_INITIAL_COST_BY_YEAR[year] ?? 0
  }
  return out
}

export function buildMetlifeManhattanInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildMetlifeManhattanAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] =
      year <= 15
        ? METLIFE_MANHATTAN_REGULAR_ASSET_FEE_ANNUAL_PERCENT_BEFORE_YEAR16
        : METLIFE_MANHATTAN_REGULAR_ASSET_FEE_ANNUAL_PERCENT_FROM_YEAR16
  }
  return out
}

export function buildMetlifeManhattanRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const payoutPercent = METLIFE_MANHATTAN_REGULAR_SURRENDER_PAYOUT_PERCENT_BY_YEAR[year] ?? 100
    out[year] = Math.max(0, 100 - payoutPercent)
  }
  return out
}

export function buildMetlifeManhattanRegularBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  currency: Currency,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}

  if (safeDuration >= 10 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 10)) {
    const avgAnnualPayment = averageAnnualPaidPremiumUntilYear(inputs, 10)
    if (avgAnnualPayment > 0) {
      const percentAt10 = resolveRegularBonusPercentAtYear10(avgAnnualPayment, currency)
      out[10] = avgAnnualPayment * (percentAt10 / 100)
    }
  }

  for (const [yearStr, percent] of Object.entries(METLIFE_MANHATTAN_REGULAR_BONUS_FIXED_PERCENT_BY_YEAR)) {
    const year = Number(yearStr)
    if (year > safeDuration) continue
    if (!hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, year)) continue
    const avgAnnualPayment = averageAnnualPaidPremiumUntilYear(inputs, year)
    if (avgAnnualPayment <= 0) continue
    out[year] = (out[year] ?? 0) + avgAnnualPayment * (percent / 100)
  }

  return out
}
