import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type SignalNyugdijprogramSn005Variant = "huf"
export type SignalNyugdijprogramSn005PaymentMethodProfile = "bank-transfer" | "direct-debit" | "postal-check"

export const SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE = "SN005" as const
export const SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE = "SN005" as const
export const SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF = "signal_nyugdijprogram_sn005_huf" as const

export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_DURATION_YEARS = 10
export const SIGNAL_NYUGDIJPROGRAM_SN005_MAX_DURATION_YEARS = 80

export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_MONTHLY_PAYMENT_HUF = 12_000
export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_QUARTERLY_PAYMENT_HUF = 36_000
export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_SEMIANNUAL_PAYMENT_HUF = 72_000
export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_ANNUAL_PAYMENT_HUF = 144_000
export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_EXTRAORDINARY_PAYMENT_HUF = 35_000

export const SIGNAL_NYUGDIJPROGRAM_SN005_INITIAL_COST_YEAR1 = 74
export const SIGNAL_NYUGDIJPROGRAM_SN005_ADMIN_PERCENT_OF_REGULAR_PAYMENT = 6

export const SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_UP_TO_3M = 3
export const SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_3M_TO_10M = 2
export const SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_ABOVE_10M = 1

export const SIGNAL_NYUGDIJPROGRAM_SN005_VAK_ANNUAL_STANDARD = 2
export const SIGNAL_NYUGDIJPROGRAM_SN005_VAK_ANNUAL_REDUCED = 1.6
export const SIGNAL_NYUGDIJPROGRAM_SN005_VAK_MAIN_ANNUAL_BEFORE_YEAR4 = 0

export const SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_PERCENT = 0.3
export const SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_MIN_FEE_HUF = 300
export const SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_MAX_FEE_HUF = 1_500
export const SIGNAL_NYUGDIJPROGRAM_SN005_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 100_000

export const SIGNAL_NYUGDIJPROGRAM_SN005_PAIDUP_MAINTENANCE_MONTHLY_HUF = 500
export const SIGNAL_NYUGDIJPROGRAM_SN005_PREMIUM_HOLIDAY_FEE_HUF = 2_500
export const SIGNAL_NYUGDIJPROGRAM_SN005_SPECIAL_CANCELLATION_FEE_HUF = 6_000

export const SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_RATE_PERCENT = 20
export const SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_CAP_HUF = 130_000
export const SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 20

export interface SignalNyugdijprogramSn005VariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minDurationYears: number
  maxDurationYears: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function annualMinByFrequency(frequency: PaymentFrequency): number {
  if (frequency === "havi") return SIGNAL_NYUGDIJPROGRAM_SN005_MIN_MONTHLY_PAYMENT_HUF * 12
  if (frequency === "negyedéves") return SIGNAL_NYUGDIJPROGRAM_SN005_MIN_QUARTERLY_PAYMENT_HUF * 4
  if (frequency === "féléves") return SIGNAL_NYUGDIJPROGRAM_SN005_MIN_SEMIANNUAL_PAYMENT_HUF * 2
  return SIGNAL_NYUGDIJPROGRAM_SN005_MIN_ANNUAL_PAYMENT_HUF
}

function resolveSecondYearInitialCostPercent(durationYears: number): number {
  const safeDuration = clamp(Math.round(durationYears), 10, 20)
  const map: Record<number, number> = {
    10: 8,
    11: 13,
    12: 18,
    13: 23,
    14: 28,
    15: 33,
    16: 38,
    17: 43,
    18: 44,
    19: 44,
    20: 44,
  }
  return map[safeDuration] ?? 44
}

function resolveThirdYearInitialCostPercent(durationYears: number): number {
  const safeDuration = clamp(Math.round(durationYears), 10, 20)
  if (safeDuration <= 17) return 0
  if (safeDuration === 18) return 4
  if (safeDuration === 19) return 9
  return 14
}

function resolveVakAnnualRate(selectedFundId?: string | null): number {
  const normalized = (selectedFundId ?? "").toLowerCase()
  if (
    (normalized.includes("hold") && normalized.includes("szef")) ||
    (normalized.includes("amundi") && normalized.includes("ovatos") && normalized.includes("kotveny"))
  ) {
    return SIGNAL_NYUGDIJPROGRAM_SN005_VAK_ANNUAL_REDUCED
  }
  return SIGNAL_NYUGDIJPROGRAM_SN005_VAK_ANNUAL_STANDARD
}

function resolveExtraordinaryAdminFeeAmount(extraordinaryAmount: number): number {
  const amount = Math.max(0, extraordinaryAmount)
  if (amount <= 0) return 0
  const firstBand = Math.min(amount, 3_000_000)
  const secondBand = Math.min(Math.max(0, amount - 3_000_000), 7_000_000)
  const thirdBand = Math.max(0, amount - 10_000_000)
  return (
    firstBand * (SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_UP_TO_3M / 100) +
    secondBand * (SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_3M_TO_10M / 100) +
    thirdBand * (SIGNAL_NYUGDIJPROGRAM_SN005_EXTRAORDINARY_ADMIN_PERCENT_ABOVE_10M / 100)
  )
}

function encodePaymentMethodProfile(profile: SignalNyugdijprogramSn005PaymentMethodProfile): string {
  return profile.replace("-", "_")
}

function decodePaymentMethodProfile(variant?: string): SignalNyugdijprogramSn005PaymentMethodProfile {
  const source = (variant ?? "").toLowerCase()
  if (source.includes("__pm_postal_check")) return "postal-check"
  if (source.includes("__pm_direct_debit")) return "direct-debit"
  return "bank-transfer"
}

export function resolveSignalNyugdijprogramSn005Variant(): SignalNyugdijprogramSn005Variant {
  return "huf"
}

export function toSignalNyugdijprogramSn005ProductVariantId(
  paymentMethodProfile?: SignalNyugdijprogramSn005PaymentMethodProfile,
): string {
  if (!paymentMethodProfile) return SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF
  return `${SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF}__pm_${encodePaymentMethodProfile(paymentMethodProfile)}`
}

export function resolveSignalNyugdijprogramSn005PaymentMethodProfile(
  productVariant?: string,
): SignalNyugdijprogramSn005PaymentMethodProfile {
  return decodePaymentMethodProfile(productVariant)
}

export function normalizeSignalNyugdijprogramSn005DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(
    rounded,
    SIGNAL_NYUGDIJPROGRAM_SN005_MIN_DURATION_YEARS,
    SIGNAL_NYUGDIJPROGRAM_SN005_MAX_DURATION_YEARS,
  )
}

export function estimateSignalNyugdijprogramSn005DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeSignalNyugdijprogramSn005DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") {
    return normalizeSignalNyugdijprogramSn005DurationYears(Math.ceil(inputs.durationValue / 12))
  }
  return normalizeSignalNyugdijprogramSn005DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getSignalNyugdijprogramSn005VariantConfig(): SignalNyugdijprogramSn005VariantConfig {
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE,
    productCode: SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE,
    productVariantId: SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF,
    minDurationYears: SIGNAL_NYUGDIJPROGRAM_SN005_MIN_DURATION_YEARS,
    maxDurationYears: SIGNAL_NYUGDIJPROGRAM_SN005_MAX_DURATION_YEARS,
    minAnnualPayment: SIGNAL_NYUGDIJPROGRAM_SN005_MIN_ANNUAL_PAYMENT_HUF,
    minExtraordinaryPayment: SIGNAL_NYUGDIJPROGRAM_SN005_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function validateSignalNyugdijprogramSn005MinimumPayment(inputs: InputsDaily): boolean {
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= annualMinByFrequency(inputs.frequency)
}

export function validateSignalNyugdijprogramSn005ExtraordinaryMinimum(amount: number): boolean {
  return Math.max(0, amount) >= SIGNAL_NYUGDIJPROGRAM_SN005_MIN_EXTRAORDINARY_PAYMENT_HUF
}

export function buildSignalNyugdijprogramSn005InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = SIGNAL_NYUGDIJPROGRAM_SN005_INITIAL_COST_YEAR1
    else if (year === 2) out[year] = resolveSecondYearInitialCostPercent(safeDuration)
    else if (year === 3) out[year] = resolveThirdYearInitialCostPercent(safeDuration)
    else out[year] = 0
  }
  return out
}

export function buildSignalNyugdijprogramSn005InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildSignalNyugdijprogramSn005MainAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const annualRate = resolveVakAnnualRate(selectedFundId)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year <= 3 ? SIGNAL_NYUGDIJPROGRAM_SN005_VAK_MAIN_ANNUAL_BEFORE_YEAR4 : annualRate
  }
  return out
}

export function buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const annualRate = resolveVakAnnualRate(selectedFundId)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = annualRate
  return out
}

export function buildSignalNyugdijprogramSn005CollectionFeePlusCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const extraordinaryTaxEligible = inputs.yearlyExtraTaxEligiblePaymentsPlan ?? []
  const extraordinaryImmediate = inputs.yearlyExtraImmediateAccessPaymentsPlan ?? []
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const extraordinaryAmount = Math.max(0, extraordinaryTaxEligible[year] ?? 0) + Math.max(0, extraordinaryImmediate[year] ?? 0)
    const extraordinaryFeeAmount = resolveExtraordinaryAdminFeeAmount(extraordinaryAmount)
    if (extraordinaryFeeAmount > 0) out[year] = round2(extraordinaryFeeAmount)
  }
  return out
}

export function estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  const amount = Math.max(0, partialSurrenderAmount)
  const proportional = amount * (SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(
    round2(proportional),
    SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_MIN_FEE_HUF,
    SIGNAL_NYUGDIJPROGRAM_SN005_PARTIAL_SURRENDER_MAX_FEE_HUF,
  )
}

export function buildSignalNyugdijprogramSn005BonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  paymentMethodProfile: SignalNyugdijprogramSn005PaymentMethodProfile,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijprogramSn005DurationYears(durationYears)
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const initialCostByYear = buildSignalNyugdijprogramSn005InitialCostByYear(safeDuration)
  let loyaltyBalance = 0
  const out: Record<number, number> = {}

  const acquisitionBaseFirst3Years =
    Math.max(0, yearlyPayments[1] ?? 0) * ((initialCostByYear[1] ?? 0) / 100) +
    Math.max(0, yearlyPayments[2] ?? 0) * ((initialCostByYear[2] ?? 0) / 100) +
    Math.max(0, yearlyPayments[3] ?? 0) * ((initialCostByYear[3] ?? 0) / 100)

  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)
    if (annualPayment > 0) {
      if (annualPayment >= 300_000) {
        out[year] = round2((out[year] ?? 0) + annualPayment * 0.01)
      }
      if (paymentMethodProfile === "bank-transfer" || paymentMethodProfile === "direct-debit") {
        out[year] = round2((out[year] ?? 0) + annualPayment * 0.01)
      }
    }

    if (year >= 4 && year <= 15) {
      loyaltyBalance += acquisitionBaseFirst3Years * 0.05
    } else if (year >= 16 && year <= 20) {
      loyaltyBalance += acquisitionBaseFirst3Years * 0.08
    }

    if (year >= 10 && (year - 10) % 5 === 0 && loyaltyBalance > 0) {
      const released = loyaltyBalance * 0.5
      out[year] = round2((out[year] ?? 0) + released)
      loyaltyBalance -= released
    }
  }

  return out
}
