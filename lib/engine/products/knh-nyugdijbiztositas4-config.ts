import type { InputsDaily } from "../calculate-results-daily"

export type KnhNyugdijbiztositas4Variant = "huf"

export const KNH_NYUGDIJBIZTOSITAS4_MNB_CODE = "K&H-NYUGDIJBIZTOSITAS-4" as const
export const KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE = "KH-NY4" as const
export const KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF = "knh_nyugdijbiztositas4_huf" as const

export const KNH_NYUGDIJBIZTOSITAS4_MIN_DURATION_YEARS = 10
export const KNH_NYUGDIJBIZTOSITAS4_MAX_DURATION_YEARS = 25
export const KNH_NYUGDIJBIZTOSITAS4_MIN_ENTRY_AGE = 18
export const KNH_NYUGDIJBIZTOSITAS4_MAX_ENTRY_AGE = 65

export const KNH_NYUGDIJBIZTOSITAS4_MIN_MONTHLY_PAYMENT_HUF = 15_000
export const KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_HUF = 180_000
export const KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_MOBILEBANK_HUF = 240_000
export const KNH_NYUGDIJBIZTOSITAS4_MIN_EXTRAORDINARY_PAYMENT_HUF = 10_000

export const KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_HUF = 990
export const KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_CAP_HUF = 1_500
export const KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHS = 36

export const KNH_NYUGDIJBIZTOSITAS4_ASSET_FEE_ANNUAL_PERCENT = 1.7
export const KNH_NYUGDIJBIZTOSITAS4_EXTRA_ACQUISITION_PERCENT = 1
export const KNH_NYUGDIJBIZTOSITAS4_SURRENDER_FEE_HUF = 10_000
export const KNH_NYUGDIJBIZTOSITAS4_ALLOW_PARTIAL_SURRENDER = false
export const KNH_NYUGDIJBIZTOSITAS4_DEATH_BENEFIT_HUF = 500_000
export const KNH_NYUGDIJBIZTOSITAS4_ACCIDENTAL_DEATH_BENEFIT_HUF = 1_000_000

export const KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_10Y = 100 / 3
export const KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_15Y = 200 / 3
export const KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_20Y = 400 / 3

export const KNH_NYUGDIJBIZTOSITAS4_STRICT_UNSPECIFIED_RULES = true
export const KNH_NYUGDIJBIZTOSITAS4_ENABLE_AGE_BASED_RISK_TABLE = false
export const KNH_NYUGDIJBIZTOSITAS4_ENABLE_PAYMENT_METHOD_FEE_MATRIX = false
export const KNH_NYUGDIJBIZTOSITAS4_ENABLE_TKM_REPORTING = false

export interface KnhNyugdijbiztositas4VariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minMonthlyPayment: number
  minAnnualPayment: number
  minAnnualPaymentMobilebank: number
  minExtraordinaryPayment: number
  initialAdminMonthlyAmount: number
  initialAdminMonths: number
  initialAdminMonthlyCapAmount: number
  extraordinaryAcquisitionPercent: number
  surrenderFeeAmount: number
}

const HUF_CONFIG: KnhNyugdijbiztositas4VariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: KNH_NYUGDIJBIZTOSITAS4_MNB_CODE,
  productCode: KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE,
  productVariantId: KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF,
  minMonthlyPayment: KNH_NYUGDIJBIZTOSITAS4_MIN_MONTHLY_PAYMENT_HUF,
  minAnnualPayment: KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_HUF,
  minAnnualPaymentMobilebank: KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_MOBILEBANK_HUF,
  minExtraordinaryPayment: KNH_NYUGDIJBIZTOSITAS4_MIN_EXTRAORDINARY_PAYMENT_HUF,
  initialAdminMonthlyAmount: KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_HUF,
  initialAdminMonths: KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHS,
  initialAdminMonthlyCapAmount: KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_CAP_HUF,
  extraordinaryAcquisitionPercent: KNH_NYUGDIJBIZTOSITAS4_EXTRA_ACQUISITION_PERCENT,
  surrenderFeeAmount: KNH_NYUGDIJBIZTOSITAS4_SURRENDER_FEE_HUF,
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(KNH_NYUGDIJBIZTOSITAS4_MAX_DURATION_YEARS, Math.max(KNH_NYUGDIJBIZTOSITAS4_MIN_DURATION_YEARS, rounded))
}

function resolveRegularAcquisitionPercent(monthlyPaymentHuf: number): number {
  if (monthlyPaymentHuf >= 28_000) return 2
  if (monthlyPaymentHuf >= 24_000) return 2.5
  if (monthlyPaymentHuf >= 20_000) return 3
  if (monthlyPaymentHuf >= 16_000) return 3.5
  if (monthlyPaymentHuf >= 12_000) return 4
  if (monthlyPaymentHuf >= 10_000) return 4.5
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

export function resolveKnhNyugdijbiztositas4Variant(): KnhNyugdijbiztositas4Variant {
  return "huf"
}

export function toKnhNyugdijbiztositas4ProductVariantId(): string {
  return KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF
}

export function getKnhNyugdijbiztositas4VariantConfig(): KnhNyugdijbiztositas4VariantConfig {
  return HUF_CONFIG
}

export function estimateKnhNyugdijbiztositas4DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildKnhNyugdijbiztositas4InitialCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
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

export function buildKnhNyugdijbiztositas4InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildKnhNyugdijbiztositas4AssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = KNH_NYUGDIJBIZTOSITAS4_ASSET_FEE_ANNUAL_PERCENT
  return out
}

export function buildKnhNyugdijbiztositas4InitialAdminPlusCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const monthlyCost = Math.min(
    KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_HUF,
    KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHLY_CAP_HUF,
  )
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 3) out[year] = monthlyCost * 12
  }
  return out
}

export function buildKnhNyugdijbiztositas4GiftBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const firstAnnualPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[1] ?? 0)
  if (firstAnnualPayment <= 0) return out

  if (safeDuration >= 10 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 10)) {
    out[10] = firstAnnualPayment * (KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_10Y / 100)
  }
  if (safeDuration >= 15 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 15)) {
    out[15] = firstAnnualPayment * (KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_15Y / 100)
  }
  if (safeDuration >= 20 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 20)) {
    out[20] = firstAnnualPayment * (KNH_NYUGDIJBIZTOSITAS4_GIFT_BONUS_PERCENT_20Y / 100)
  }
  return out
}
