import type { Currency, InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type MetlifeNyugdijprogramVariant = "huf" | "eur"

export const METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE = "MET-688" as const
export const METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE = "MET-788" as const
export const METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF = "MET-688" as const
export const METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR = "MET-788" as const
export const METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF = "metlife_nyugdijprogram_huf" as const
export const METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR = "metlife_nyugdijprogram_eur" as const

export const METLIFE_NYUGDIJPROGRAM_MIN_DURATION_YEARS = 5
export const METLIFE_NYUGDIJPROGRAM_MAX_DURATION_YEARS = 80

export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_5_TO_7 = 41_667
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_8_TO_9 = 29_167
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_10_TO_14 = 20_000
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_15_PLUS = 15_000

export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_5_TO_7 = 142
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_8_TO_9 = 100
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_10_TO_14 = 42
export const METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_15_PLUS = 33

export const METLIFE_NYUGDIJPROGRAM_MIN_EXTRAORDINARY_PAYMENT_HUF = 20_000
export const METLIFE_NYUGDIJPROGRAM_MIN_EXTRAORDINARY_PAYMENT_EUR = 65

export const METLIFE_NYUGDIJPROGRAM_BASIC_ADMIN_MONTHLY_HUF = 500
export const METLIFE_NYUGDIJPROGRAM_BASIC_ADMIN_MONTHLY_EUR = 1.6
export const METLIFE_NYUGDIJPROGRAM_BASIC_COLLECTION_FEE_PER_PAYMENT_HUF = 100
export const METLIFE_NYUGDIJPROGRAM_BASIC_COLLECTION_FEE_PER_PAYMENT_EUR = 0

export const METLIFE_NYUGDIJPROGRAM_ASSET_FEE_ANNUAL_PERCENT_BEFORE_YEAR16 = 2.65
export const METLIFE_NYUGDIJPROGRAM_ASSET_FEE_ANNUAL_PERCENT_FROM_YEAR16 = 2.39

export const METLIFE_NYUGDIJPROGRAM_BONUS_THRESHOLD_HUF = 650_000
export const METLIFE_NYUGDIJPROGRAM_BONUS_THRESHOLD_EUR = 2_200
export const METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR10 = 85
export const METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR20 = 39.5
export const METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR25 = 47

export const METLIFE_NYUGDIJPROGRAM_STRICT_UNSPECIFIED_RULES = true
export const METLIFE_NYUGDIJPROGRAM_ENABLE_AGE_BASED_RISK_TABLE = false
export const METLIFE_NYUGDIJPROGRAM_ENABLE_FULL_PAYMENT_METHOD_RULES = false
export const METLIFE_NYUGDIJPROGRAM_ENABLE_TKMNY_REPORTING = false

const METLIFE_NYUGDIJPROGRAM_PAYOUT_PERCENT_BY_YEAR: Record<number, number> = {
  1: 65,
  2: 78,
  3: 92,
  4: 92,
  5: 92,
  10: 94,
  15: 96,
  20: 99,
}

export interface MetlifeNyugdijprogramVariantConfig {
  variant: MetlifeNyugdijprogramVariant
  currency: "HUF" | "EUR"
  mnbCode: string
  productCode: "MET-688" | "MET-788"
  productVariantId: string
  minMonthlyPayment: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
  basicAdminMonthlyAmount: number
  basicCollectionFeePerPayment: number
  bonusThresholdAmount: number
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(
    METLIFE_NYUGDIJPROGRAM_MAX_DURATION_YEARS,
    Math.max(METLIFE_NYUGDIJPROGRAM_MIN_DURATION_YEARS, rounded),
  )
}

function resolveMinMonthlyPaymentByDuration(
  durationYears: number,
  variant: MetlifeNyugdijprogramVariant,
): number {
  if (variant === "eur") {
    if (durationYears <= 7) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_5_TO_7
    if (durationYears <= 9) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_8_TO_9
    if (durationYears <= 14) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_10_TO_14
    return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_EUR_15_PLUS
  }
  if (durationYears <= 7) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_5_TO_7
  if (durationYears <= 9) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_8_TO_9
  if (durationYears <= 14) return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_10_TO_14
  return METLIFE_NYUGDIJPROGRAM_MIN_MONTHLY_PAYMENT_HUF_15_PLUS
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

function paymentsPerYear(frequency: PaymentFrequency): number {
  if (frequency === "havi") return 12
  if (frequency === "negyedéves") return 4
  if (frequency === "féléves") return 2
  return 1
}

export function resolveMetlifeNyugdijprogramVariant(
  productVariant?: string,
  currency?: Currency,
): MetlifeNyugdijprogramVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (
      normalized.includes("met-788") ||
      normalized.includes("_eur") ||
      normalized.includes("eur") ||
      normalized.includes("788")
    ) {
      return "eur"
    }
    if (
      normalized.includes("met-688") ||
      normalized.includes("_huf") ||
      normalized.includes("huf") ||
      normalized.includes("688")
    ) {
      return "huf"
    }
  }
  if (currency === "EUR") return "eur"
  return "huf"
}

export function toMetlifeNyugdijprogramProductVariantId(variant: MetlifeNyugdijprogramVariant): string {
  return variant === "eur" ? METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR : METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF
}

export function estimateMetlifeNyugdijprogramDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getMetlifeNyugdijprogramVariantConfig(
  productVariant?: string,
  currency?: Currency,
  durationYears = 20,
): MetlifeNyugdijprogramVariantConfig {
  const variant = resolveMetlifeNyugdijprogramVariant(productVariant, currency)
  const safeDuration = normalizeDurationYears(durationYears)
  const minMonthlyPayment = resolveMinMonthlyPaymentByDuration(safeDuration, variant)
  const minAnnualPayment = minMonthlyPayment * 12
  if (variant === "eur") {
    return {
      variant: "eur",
      currency: "EUR",
      mnbCode: METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE,
      productCode: METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR,
      productVariantId: METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR,
      minMonthlyPayment,
      minAnnualPayment,
      minExtraordinaryPayment: METLIFE_NYUGDIJPROGRAM_MIN_EXTRAORDINARY_PAYMENT_EUR,
      basicAdminMonthlyAmount: METLIFE_NYUGDIJPROGRAM_BASIC_ADMIN_MONTHLY_EUR,
      basicCollectionFeePerPayment: METLIFE_NYUGDIJPROGRAM_BASIC_COLLECTION_FEE_PER_PAYMENT_EUR,
      bonusThresholdAmount: METLIFE_NYUGDIJPROGRAM_BONUS_THRESHOLD_EUR,
    }
  }
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE,
    productCode: METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF,
    productVariantId: METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF,
    minMonthlyPayment,
    minAnnualPayment,
    minExtraordinaryPayment: METLIFE_NYUGDIJPROGRAM_MIN_EXTRAORDINARY_PAYMENT_HUF,
    basicAdminMonthlyAmount: METLIFE_NYUGDIJPROGRAM_BASIC_ADMIN_MONTHLY_HUF,
    basicCollectionFeePerPayment: METLIFE_NYUGDIJPROGRAM_BASIC_COLLECTION_FEE_PER_PAYMENT_HUF,
    bonusThresholdAmount: METLIFE_NYUGDIJPROGRAM_BONUS_THRESHOLD_HUF,
  }
}

export function buildMetlifeNyugdijprogramInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration >= 10) {
    return { 1: 60, 2: 35, 3: 15 }
  }
  if (safeDuration <= 5) {
    return { 1: 60, 2: 15, 3: 0 }
  }
  if (safeDuration === 6) {
    return { 1: 60, 2: 17.5, 3: 0 }
  }
  if (safeDuration === 7) {
    return { 1: 60, 2: 20, 3: 0 }
  }
  if (safeDuration === 8) {
    return { 1: 60, 2: 25, 3: 0 }
  }
  return { 1: 60, 2: 30, 3: 0 }
}

export function buildMetlifeNyugdijprogramInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildMetlifeNyugdijprogramAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] =
      year <= 15
        ? METLIFE_NYUGDIJPROGRAM_ASSET_FEE_ANNUAL_PERCENT_BEFORE_YEAR16
        : METLIFE_NYUGDIJPROGRAM_ASSET_FEE_ANNUAL_PERCENT_FROM_YEAR16
  }
  return out
}

export function buildMetlifeNyugdijprogramRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    let payoutPercent = 100
    if (year <= 5) payoutPercent = METLIFE_NYUGDIJPROGRAM_PAYOUT_PERCENT_BY_YEAR[year] ?? 92
    else if (year <= 9) payoutPercent = 92
    else if (year <= 14) payoutPercent = 94
    else if (year <= 19) payoutPercent = 96
    else if (year === 20) payoutPercent = 99
    else payoutPercent = 100
    out[year] = Math.max(0, 100 - payoutPercent)
  }
  return out
}

export function buildMetlifeNyugdijprogramCollectionFeePlusCostByYear(
  durationYears: number,
  frequency: PaymentFrequency,
  feePerPayment: number,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const yearlyFee = Math.max(0, feePerPayment) * paymentsPerYear(frequency)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = yearlyFee
  return out
}

export function buildMetlifeNyugdijprogramBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  variantConfig: MetlifeNyugdijprogramVariantConfig,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}

  const canApplyAt10 =
    safeDuration >= 10 &&
    hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 10) &&
    averageAnnualPaidPremiumUntilYear(inputs, 10) > variantConfig.bonusThresholdAmount
  if (canApplyAt10) {
    const avgAnnualAt10 = averageAnnualPaidPremiumUntilYear(inputs, 10)
    out[10] = avgAnnualAt10 * (METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR10 / 100)
  }

  const canApplyAt20 =
    safeDuration >= 20 &&
    hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 20) &&
    averageAnnualPaidPremiumUntilYear(inputs, 20) > variantConfig.bonusThresholdAmount
  if (canApplyAt20) {
    const avgAnnualAt20 = averageAnnualPaidPremiumUntilYear(inputs, 20)
    out[20] = (out[20] ?? 0) + avgAnnualAt20 * (METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR20 / 100)
  }

  const canApplyAt25 =
    safeDuration >= 25 &&
    hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 25) &&
    averageAnnualPaidPremiumUntilYear(inputs, 25) > variantConfig.bonusThresholdAmount
  if (canApplyAt25) {
    const avgAnnualAt25 = averageAnnualPaidPremiumUntilYear(inputs, 25)
    out[25] = (out[25] ?? 0) + avgAnnualAt25 * (METLIFE_NYUGDIJPROGRAM_BONUS_PERCENT_AT_YEAR25 / 100)
  }

  return out
}
