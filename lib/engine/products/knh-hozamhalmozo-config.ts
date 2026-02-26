import type { InputsDaily } from "../calculate-results-daily"

export type KnhHozamhalmozoVariant = "huf"

export const KNH_HOZAMHALMOZO_MNB_CODE = "113" as const
export const KNH_HOZAMHALMOZO_PRODUCT_CODE = "KH-HHZ4" as const
export const KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF = "knh_hozamhalmozo_huf" as const

export const KNH_HOZAMHALMOZO_MIN_DURATION_YEARS = 10
export const KNH_HOZAMHALMOZO_MAX_DURATION_YEARS = 25
export const KNH_HOZAMHALMOZO_MIN_ENTRY_AGE = 18
export const KNH_HOZAMHALMOZO_MAX_ENTRY_AGE = 65

export const KNH_HOZAMHALMOZO_MIN_MONTHLY_PAYMENT_HUF = 15_000
export const KNH_HOZAMHALMOZO_MIN_ANNUAL_PAYMENT_HUF = 180_000
export const KNH_HOZAMHALMOZO_MIN_EXTRAORDINARY_PAYMENT_HUF = 10_000

export const KNH_HOZAMHALMOZO_REGULAR_ADMIN_MONTHLY_HUF = 990
export const KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_HUF = 990
export const KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_CAP_HUF = 1_500
export const KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHS = 36

export const KNH_HOZAMHALMOZO_ASSET_FEE_ANNUAL_PERCENT = 2.2
export const KNH_HOZAMHALMOZO_EXTRA_ACQUISITION_PERCENT = 2
export const KNH_HOZAMHALMOZO_PARTIAL_SURRENDER_FEE_HUF = 10_000
export const KNH_HOZAMHALMOZO_ACCIDENTAL_DEATH_BENEFIT_HUF = 1_000_000

export const KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_10Y = 100 / 3
export const KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_15Y = 200 / 3
export const KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_20Y = 400 / 3

export const KNH_HOZAMHALMOZO_STRICT_UNSPECIFIED_RULES = true
export const KNH_HOZAMHALMOZO_ENABLE_AGE_BASED_RISK_TABLE = false
export const KNH_HOZAMHALMOZO_ENABLE_PAYMENT_METHOD_FEE_MATRIX = false
export const KNH_HOZAMHALMOZO_ENABLE_TKM_REPORTING = false

export interface KnhHozamhalmozoVariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minMonthlyPayment: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
  regularAdminMonthlyAmount: number
  initialAdminMonthlyAmount: number
  initialAdminMonths: number
  initialAdminMonthlyCapAmount: number
  extraordinaryAcquisitionPercent: number
  partialSurrenderFeeAmount: number
}

const HUF_CONFIG: KnhHozamhalmozoVariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: KNH_HOZAMHALMOZO_MNB_CODE,
  productCode: KNH_HOZAMHALMOZO_PRODUCT_CODE,
  productVariantId: KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF,
  minMonthlyPayment: KNH_HOZAMHALMOZO_MIN_MONTHLY_PAYMENT_HUF,
  minAnnualPayment: KNH_HOZAMHALMOZO_MIN_ANNUAL_PAYMENT_HUF,
  minExtraordinaryPayment: KNH_HOZAMHALMOZO_MIN_EXTRAORDINARY_PAYMENT_HUF,
  regularAdminMonthlyAmount: KNH_HOZAMHALMOZO_REGULAR_ADMIN_MONTHLY_HUF,
  initialAdminMonthlyAmount: KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_HUF,
  initialAdminMonths: KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHS,
  initialAdminMonthlyCapAmount: KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_CAP_HUF,
  extraordinaryAcquisitionPercent: KNH_HOZAMHALMOZO_EXTRA_ACQUISITION_PERCENT,
  partialSurrenderFeeAmount: KNH_HOZAMHALMOZO_PARTIAL_SURRENDER_FEE_HUF,
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(KNH_HOZAMHALMOZO_MAX_DURATION_YEARS, Math.max(KNH_HOZAMHALMOZO_MIN_DURATION_YEARS, rounded))
}

function resolveRegularAcquisitionPercent(monthlyPaymentHuf: number): number {
  if (monthlyPaymentHuf >= 28_000) return 2
  if (monthlyPaymentHuf >= 24_000) return 2.5
  if (monthlyPaymentHuf >= 20_000) return 3
  if (monthlyPaymentHuf >= 16_000) return 3.5
  if (monthlyPaymentHuf >= 12_000) return 4
  if (monthlyPaymentHuf >= 10_000) return 4.5
  // Conservative fallback below published bands.
  return 4.5
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

export function resolveKnhHozamhalmozoVariant(): KnhHozamhalmozoVariant {
  return "huf"
}

export function toKnhHozamhalmozoProductVariantId(): string {
  return KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF
}

export function getKnhHozamhalmozoVariantConfig(): KnhHozamhalmozoVariantConfig {
  return HUF_CONFIG
}

export function estimateKnhHozamhalmozoDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildKnhHozamhalmozoInitialCostByYear(inputs: InputsDaily, durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)
    const monthlyEquivalent = annualPayment / 12
    out[year] = resolveRegularAcquisitionPercent(monthlyEquivalent)
  }
  return out
}

export function buildKnhHozamhalmozoInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildKnhHozamhalmozoAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = KNH_HOZAMHALMOZO_ASSET_FEE_ANNUAL_PERCENT
  return out
}

export function buildKnhHozamhalmozoInitialAdminPlusCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const monthlyCost = Math.min(
    KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_HUF,
    KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHLY_CAP_HUF,
  )
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 3) out[year] = monthlyCost * 12
  }
  return out
}

export function buildKnhHozamhalmozoGiftBonusAmountByYear(inputs: InputsDaily, durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const firstAnnualPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[1] ?? 0)
  if (firstAnnualPayment <= 0) return out

  if (safeDuration >= 10 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 10)) {
    out[10] = firstAnnualPayment * (KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_10Y / 100)
  }
  if (safeDuration >= 15 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 15)) {
    out[15] = firstAnnualPayment * (KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_15Y / 100)
  }
  if (safeDuration >= 20 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 20)) {
    out[20] = firstAnnualPayment * (KNH_HOZAMHALMOZO_GIFT_BONUS_PERCENT_20Y / 100)
  }
  return out
}
