import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type SignalElorelatoUl001Variant = "huf"
export type SignalElorelatoUl001PaymentMethodProfile = "bank-transfer" | "direct-debit" | "postal-check"
export type SignalElorelatoUl001VakProfile = "standard" | "reduced-funds"

export const SIGNAL_ELORELATO_UL001_MNB_CODE = "UL001" as const
export const SIGNAL_ELORELATO_UL001_PRODUCT_CODE = "UL001" as const
export const SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF = "signal_elorelato_ul001_huf" as const

export const SIGNAL_ELORELATO_UL001_MIN_DURATION_YEARS = 10
export const SIGNAL_ELORELATO_UL001_MAX_DURATION_YEARS = 45
export const SIGNAL_ELORELATO_UL001_MAX_AGE_AT_MATURITY = 75

export const SIGNAL_ELORELATO_UL001_MIN_MONTHLY_PAYMENT_HUF = 12_000
export const SIGNAL_ELORELATO_UL001_MIN_QUARTERLY_PAYMENT_HUF = 36_000
export const SIGNAL_ELORELATO_UL001_MIN_SEMIANNUAL_PAYMENT_HUF = 72_000
export const SIGNAL_ELORELATO_UL001_MIN_ANNUAL_PAYMENT_HUF = 144_000
export const SIGNAL_ELORELATO_UL001_MIN_EXTRAORDINARY_PAYMENT_HUF = 35_000
export const SIGNAL_ELORELATO_UL001_BONUS_QUALIFYING_ANNUAL_PAYMENT_HUF = 300_000

export const SIGNAL_ELORELATO_UL001_ADMIN_PERCENT_OF_REGULAR_PAYMENT = 6
export const SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_UP_TO_3M = 3
export const SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_3M_TO_10M = 2
export const SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_ABOVE_10M = 1

export const SIGNAL_ELORELATO_UL001_VAK_ANNUAL_MAIN_BEFORE_YEAR4 = 0
export const SIGNAL_ELORELATO_UL001_VAK_ANNUAL_STANDARD = 2
export const SIGNAL_ELORELATO_UL001_VAK_ANNUAL_REDUCED = 1.6

export const SIGNAL_ELORELATO_UL001_PREMIUM_HOLIDAY_FEE_HUF = 2_500
export const SIGNAL_ELORELATO_UL001_PAIDUP_MAINTENANCE_MONTHLY_HUF = 500
export const SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_PERCENT = 0.3
export const SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_MIN_FEE_HUF = 300
export const SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_MAX_FEE_HUF = 1_500
export const SIGNAL_ELORELATO_UL001_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 100_000

export const SIGNAL_ELORELATO_UL001_SPECIAL_CANCELLATION_FEE_HUF = 6_000
export const SIGNAL_ELORELATO_UL001_DEATH_BENEFIT_CAP_HUF = 1_000_000

export interface SignalElorelatoUl001VariantConfig {
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

export interface SignalElorelatoUl001RuntimeProfiles {
  paymentMethodProfile: SignalElorelatoUl001PaymentMethodProfile
  vakProfile: SignalElorelatoUl001VakProfile
  loyaltyBonusEnabled: boolean
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function annualMinByFrequency(frequency: PaymentFrequency): number {
  if (frequency === "havi") return SIGNAL_ELORELATO_UL001_MIN_MONTHLY_PAYMENT_HUF * 12
  if (frequency === "negyedéves") return SIGNAL_ELORELATO_UL001_MIN_QUARTERLY_PAYMENT_HUF * 4
  if (frequency === "féléves") return SIGNAL_ELORELATO_UL001_MIN_SEMIANNUAL_PAYMENT_HUF * 2
  return SIGNAL_ELORELATO_UL001_MIN_ANNUAL_PAYMENT_HUF
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

function resolveExtraordinaryAdminFeeAmount(extraordinaryAmount: number): number {
  const amount = Math.max(0, extraordinaryAmount)
  if (amount <= 0) return 0
  const firstBand = Math.min(amount, 3_000_000)
  const secondBand = Math.min(Math.max(0, amount - 3_000_000), 7_000_000)
  const thirdBand = Math.max(0, amount - 10_000_000)
  return (
    firstBand * (SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_UP_TO_3M / 100) +
    secondBand * (SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_3M_TO_10M / 100) +
    thirdBand * (SIGNAL_ELORELATO_UL001_EXTRAORDINARY_ADMIN_PERCENT_ABOVE_10M / 100)
  )
}

function encodeProfilesToVariantSuffix(profiles: SignalElorelatoUl001RuntimeProfiles): string {
  const payment = profiles.paymentMethodProfile.replace("-", "_")
  const vak = profiles.vakProfile.replace("-", "_")
  const loyalty = profiles.loyaltyBonusEnabled ? "on" : "off"
  return `__pm_${payment}__vak_${vak}__loyal_${loyalty}`
}

function decodeProfilesFromVariantSuffix(variant?: string): SignalElorelatoUl001RuntimeProfiles {
  const source = (variant ?? "").toLowerCase()
  const paymentMethodProfile: SignalElorelatoUl001PaymentMethodProfile = source.includes("__pm_postal_check")
    ? "postal-check"
    : source.includes("__pm_direct_debit")
      ? "direct-debit"
      : "bank-transfer"
  const vakProfile: SignalElorelatoUl001VakProfile = source.includes("__vak_reduced_funds") ? "reduced-funds" : "standard"
  const loyaltyBonusEnabled = source.includes("__loyal_off") ? false : true
  return { paymentMethodProfile, vakProfile, loyaltyBonusEnabled }
}

export function resolveSignalElorelatoUl001Variant(): SignalElorelatoUl001Variant {
  return "huf"
}

export function toSignalElorelatoUl001ProductVariantId(
  profiles?: Partial<SignalElorelatoUl001RuntimeProfiles>,
): string {
  if (!profiles) return SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF
  const completed: SignalElorelatoUl001RuntimeProfiles = {
    paymentMethodProfile: profiles.paymentMethodProfile ?? "bank-transfer",
    vakProfile: profiles.vakProfile ?? "standard",
    loyaltyBonusEnabled: profiles.loyaltyBonusEnabled ?? true,
  }
  return `${SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF}${encodeProfilesToVariantSuffix(completed)}`
}

export function resolveSignalElorelatoUl001RuntimeProfiles(productVariant?: string): SignalElorelatoUl001RuntimeProfiles {
  return decodeProfilesFromVariantSuffix(productVariant)
}

export function normalizeSignalElorelatoUl001DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(rounded, SIGNAL_ELORELATO_UL001_MIN_DURATION_YEARS, SIGNAL_ELORELATO_UL001_MAX_DURATION_YEARS)
}

export function estimateSignalElorelatoUl001DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeSignalElorelatoUl001DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeSignalElorelatoUl001DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeSignalElorelatoUl001DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getSignalElorelatoUl001VariantConfig(): SignalElorelatoUl001VariantConfig {
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: SIGNAL_ELORELATO_UL001_MNB_CODE,
    productCode: SIGNAL_ELORELATO_UL001_PRODUCT_CODE,
    productVariantId: SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF,
    minDurationYears: SIGNAL_ELORELATO_UL001_MIN_DURATION_YEARS,
    maxDurationYears: SIGNAL_ELORELATO_UL001_MAX_DURATION_YEARS,
    minAnnualPayment: SIGNAL_ELORELATO_UL001_MIN_ANNUAL_PAYMENT_HUF,
    minExtraordinaryPayment: SIGNAL_ELORELATO_UL001_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function validateSignalElorelatoUl001MinimumPayment(inputs: InputsDaily): boolean {
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= annualMinByFrequency(inputs.frequency)
}

export function buildSignalElorelatoUl001InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = 74
    else if (year === 2) out[year] = resolveSecondYearInitialCostPercent(safeDuration)
    else if (year === 3) out[year] = resolveThirdYearInitialCostPercent(safeDuration)
    else out[year] = 0
  }
  return out
}

export function buildSignalElorelatoUl001InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildSignalElorelatoUl001MainAssetCostPercentByYear(
  durationYears: number,
  vakProfile: SignalElorelatoUl001VakProfile,
): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const annualRate =
    vakProfile === "reduced-funds" ? SIGNAL_ELORELATO_UL001_VAK_ANNUAL_REDUCED : SIGNAL_ELORELATO_UL001_VAK_ANNUAL_STANDARD
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year <= 3 ? SIGNAL_ELORELATO_UL001_VAK_ANNUAL_MAIN_BEFORE_YEAR4 : annualRate
  }
  return out
}

export function buildSignalElorelatoUl001ExtraAssetCostPercentByYear(
  durationYears: number,
  vakProfile: SignalElorelatoUl001VakProfile,
): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const annualRate =
    vakProfile === "reduced-funds" ? SIGNAL_ELORELATO_UL001_VAK_ANNUAL_REDUCED : SIGNAL_ELORELATO_UL001_VAK_ANNUAL_STANDARD
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = annualRate
  return out
}

export function buildSignalElorelatoUl001CollectionFeePlusCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const out: Record<number, number> = {}
  const extraordinaryTaxEligible = inputs.yearlyExtraTaxEligiblePaymentsPlan ?? []
  const extraordinaryImmediate = inputs.yearlyExtraImmediateAccessPaymentsPlan ?? []
  for (let year = 1; year <= safeDuration; year++) {
    const extraordinaryAmount = Math.max(0, extraordinaryTaxEligible[year] ?? 0) + Math.max(0, extraordinaryImmediate[year] ?? 0)
    const extraordinaryFeeAmount = resolveExtraordinaryAdminFeeAmount(extraordinaryAmount)
    if (extraordinaryFeeAmount > 0) out[year] = round2(extraordinaryFeeAmount)
  }
  return out
}

export function estimateSignalElorelatoUl001PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  const amount = Math.max(0, partialSurrenderAmount)
  if (amount <= 0) return SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_MIN_FEE_HUF
  const proportional = amount * (SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(round2(proportional), SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_MIN_FEE_HUF, SIGNAL_ELORELATO_UL001_PARTIAL_SURRENDER_MAX_FEE_HUF)
}

export function buildSignalElorelatoUl001BonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  paymentMethodProfile: SignalElorelatoUl001PaymentMethodProfile,
  loyaltyBonusEnabled: boolean,
): Record<number, number> {
  const safeDuration = normalizeSignalElorelatoUl001DurationYears(durationYears)
  const out: Record<number, number> = {}
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const initialCostByYear = buildSignalElorelatoUl001InitialCostByYear(safeDuration)
  let loyaltyBalance = 0

  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)
    if (annualPayment <= 0) continue

    if (annualPayment >= SIGNAL_ELORELATO_UL001_BONUS_QUALIFYING_ANNUAL_PAYMENT_HUF) {
      out[year] = (out[year] ?? 0) + annualPayment * 0.01
    }
    if (paymentMethodProfile === "bank-transfer" || paymentMethodProfile === "direct-debit") {
      out[year] = (out[year] ?? 0) + annualPayment * 0.01
    }

    if (loyaltyBonusEnabled) {
      const acquisitionPercent = initialCostByYear[year] ?? 0
      const acquisitionAmount = annualPayment * (acquisitionPercent / 100)
      const yearlyLoyaltyRate = year <= 15 ? 0.05 : year <= 20 ? 0.08 : 0
      loyaltyBalance += acquisitionAmount * yearlyLoyaltyRate
      if (year >= 10 && (year - 10) % 5 === 0 && loyaltyBalance > 0) {
        const released = loyaltyBalance * 0.5
        out[year] = (out[year] ?? 0) + released
        loyaltyBalance -= released
      }
    }
  }

  return Object.fromEntries(Object.entries(out).map(([year, amount]) => [Number(year), round2(amount)]))
}
