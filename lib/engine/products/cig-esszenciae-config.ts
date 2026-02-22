import type { Currency, InputsDaily } from "../calculate-results-daily"

export type CigEsszenciaeVariant = "huf" | "eur"

export const CIG_ESSZENCIAE_HUF_MNB_CODE = "P0151" as const
export const CIG_ESSZENCIAE_EUR_MNB_CODE = "P0251" as const
export const CIG_ESSZENCIAE_PRODUCT_CODE = "-" as const
export const CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF = "cig_esszenciae_huf" as const
export const CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR = "cig_esszenciae_eur" as const

export const CIG_ESSZENCIAE_MIN_DURATION_YEARS = 10
export const CIG_ESSZENCIAE_MAX_DURATION_YEARS = 80
export const CIG_ESSZENCIAE_MAX_AGE_AT_MATURITY = 90

export const CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_HUF = 150_000
export const CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_EUR = 540
export const CIG_ESSZENCIAE_MIN_EXTRAORDINARY_PAYMENT_HUF = 10_000
export const CIG_ESSZENCIAE_MIN_EXTRAORDINARY_PAYMENT_EUR = 1

export const CIG_ESSZENCIAE_PAID_UP_MAINTENANCE_MONTHLY_HUF = 500
export const CIG_ESSZENCIAE_PAID_UP_MAINTENANCE_MONTHLY_EUR = 1.6

export const CIG_ESSZENCIAE_PARTIAL_SURRENDER_PERCENT = 0.3
export const CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF = 300
export const CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_HUF = 3_000
export const CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR = 1
export const CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_EUR = 10

export const CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_HUF = 70
export const CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_EUR = 90
export const CIG_ESSZENCIAE_BONUS_FROM_YEAR8_PERCENT = 1

export const CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES = true
export const CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE = false
export const CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE = false
export const CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING = false
export const CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE = false
export const CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH = false
export const CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE = false

export interface CigEsszenciaeVariantConfig {
  variant: CigEsszenciaeVariant
  currency: "HUF" | "EUR"
  mnbCode: string
  productCode: "-"
  productVariantId: string
  minAnnualPayment: number
  minExtraordinaryPayment: number
  paidUpMaintenanceMonthlyAmount: number
  bonusYear7Percent: number
  partialSurrenderMin: number
  partialSurrenderMax: number
}

const HUF_CONFIG: CigEsszenciaeVariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: CIG_ESSZENCIAE_HUF_MNB_CODE,
  productCode: CIG_ESSZENCIAE_PRODUCT_CODE,
  productVariantId: CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF,
  minAnnualPayment: CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_HUF,
  minExtraordinaryPayment: CIG_ESSZENCIAE_MIN_EXTRAORDINARY_PAYMENT_HUF,
  paidUpMaintenanceMonthlyAmount: CIG_ESSZENCIAE_PAID_UP_MAINTENANCE_MONTHLY_HUF,
  bonusYear7Percent: CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_HUF,
  partialSurrenderMin: CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF,
  partialSurrenderMax: CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_HUF,
}

const EUR_CONFIG: CigEsszenciaeVariantConfig = {
  variant: "eur",
  currency: "EUR",
  mnbCode: CIG_ESSZENCIAE_EUR_MNB_CODE,
  productCode: CIG_ESSZENCIAE_PRODUCT_CODE,
  productVariantId: CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR,
  minAnnualPayment: CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_EUR,
  minExtraordinaryPayment: CIG_ESSZENCIAE_MIN_EXTRAORDINARY_PAYMENT_EUR,
  paidUpMaintenanceMonthlyAmount: CIG_ESSZENCIAE_PAID_UP_MAINTENANCE_MONTHLY_EUR,
  bonusYear7Percent: CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_EUR,
  partialSurrenderMin: CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR,
  partialSurrenderMax: CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_EUR,
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(CIG_ESSZENCIAE_MAX_DURATION_YEARS, Math.max(CIG_ESSZENCIAE_MIN_DURATION_YEARS, rounded))
}

export function resolveCigEsszenciaeVariant(productVariant?: string, currency?: Currency): CigEsszenciaeVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (normalized.includes("eur")) return "eur"
    if (normalized.includes("huf")) return "huf"
  }
  if (currency === "EUR") return "eur"
  return "huf"
}

export function getCigEsszenciaeVariantConfig(
  productVariant?: string,
  currency?: Currency,
): CigEsszenciaeVariantConfig {
  const variant = resolveCigEsszenciaeVariant(productVariant, currency)
  return variant === "eur" ? EUR_CONFIG : HUF_CONFIG
}

export function toCigEsszenciaeProductVariantId(variant: CigEsszenciaeVariant): string {
  return variant === "eur" ? CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR : CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF
}

export function estimateCigEsszenciaeDurationYears(inputs: InputsDaily): number {
  const byUnit =
    inputs.durationUnit === "year"
      ? inputs.durationValue
      : inputs.durationUnit === "month"
        ? Math.ceil(inputs.durationValue / 12)
        : Math.ceil(inputs.durationValue / 365)
  const normalized = normalizeDurationYears(byUnit)
  const entryAge = Math.max(0, Math.round(inputs.insuredEntryAge ?? 38))
  const maxByAge = Math.max(CIG_ESSZENCIAE_MIN_DURATION_YEARS, CIG_ESSZENCIAE_MAX_AGE_AT_MATURITY - entryAge)
  // TODO(CIG_ESSZENCIAE): Confirm full age-at-maturity boundary and exceptions from tariff annex.
  return Math.max(CIG_ESSZENCIAE_MIN_DURATION_YEARS, Math.min(normalized, maxByAge, CIG_ESSZENCIAE_MAX_DURATION_YEARS))
}

export function buildCigEsszenciaeInitialCostByYear(
  durationYears: number,
  variant: CigEsszenciaeVariant,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (variant === "eur") {
    if (safeDuration <= 10) return { 1: 78, 2: 33, 3: 18, 4: 18, 5: 10, 6: 0, 7: 0, 8: 0 }
    if (safeDuration >= 20) return { 1: 78, 2: 33, 3: 18, 4: 18, 5: 43, 6: 18, 7: 18, 8: 0 }
    // TODO(CIG_ESSZENCIAE): No complete 11-19y EUR table provided; currently mapped to 15y bucket.
    return { 1: 78, 2: 33, 3: 18, 4: 43, 5: 18, 6: 18, 7: 0, 8: 0 }
  }
  if (safeDuration <= 10) return { 1: 78, 2: 47, 3: 18, 4: 10, 5: 18, 6: 0, 7: 0, 8: 0 }
  if (safeDuration >= 20) return { 1: 78, 2: 47, 3: 18, 4: 18, 5: 18, 6: 18, 7: 18, 8: 0 }
  // TODO(CIG_ESSZENCIAE): No complete 11-19y HUF table provided; currently mapped to 15y bucket.
  return { 1: 78, 2: 47, 3: 18, 4: 18, 5: 18, 6: 18, 7: 0, 8: 0 }
}

export function buildCigEsszenciaeInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildCigEsszenciaeRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 0
  return out
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

export function buildCigEsszenciaeBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  variant: CigEsszenciaeVariant,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  if (safeDuration >= 7 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 7)) {
    const firstYearPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[1] ?? 0)
    if (firstYearPayment > 0) {
      const percent =
        variant === "eur" ? CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_EUR : CIG_ESSZENCIAE_BONUS_YEAR7_PERCENT_HUF
      out[7] = firstYearPayment * (percent / 100)
    }
  }
  return out
}

export function buildCigEsszenciaeBonusPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 8; year <= safeDuration; year++) {
    out[year] = CIG_ESSZENCIAE_BONUS_FROM_YEAR8_PERCENT
  }
  return out
}
