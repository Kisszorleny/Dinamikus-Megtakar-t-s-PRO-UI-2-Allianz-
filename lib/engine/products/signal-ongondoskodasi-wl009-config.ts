import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type SignalOngondoskodasiWl009Variant = "huf"
export type SignalOngondoskodasiWl009VakProfile = "standard" | "sifi-u"

export const SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE = "WL009" as const
export const SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE = "WL009" as const
export const SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF = "signal_ongondoskodasi_wl009_huf" as const

export const SIGNAL_ONGONDOSKODASI_WL009_MIN_DURATION_YEARS = 1
export const SIGNAL_ONGONDOSKODASI_WL009_MAX_DURATION_YEARS = 80

export const SIGNAL_ONGONDOSKODASI_WL009_MIN_MONTHLY_PAYMENT_HUF = 15_000
export const SIGNAL_ONGONDOSKODASI_WL009_MIN_QUARTERLY_PAYMENT_HUF = 45_000
export const SIGNAL_ONGONDOSKODASI_WL009_MIN_SEMIANNUAL_PAYMENT_HUF = 90_000
export const SIGNAL_ONGONDOSKODASI_WL009_MIN_ANNUAL_PAYMENT_HUF = 180_000
export const SIGNAL_ONGONDOSKODASI_WL009_MIN_EXTRAORDINARY_PAYMENT_HUF = 35_000

export const SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR1 = 64
export const SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR2 = 34
export const SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR3 = 4

export const SIGNAL_ONGONDOSKODASI_WL009_ADMIN_PERCENT_YEAR1_TO_8 = 16
export const SIGNAL_ONGONDOSKODASI_WL009_ADMIN_PERCENT_YEAR9_PLUS = 6
export const SIGNAL_ONGONDOSKODASI_WL009_EXTRAORDINARY_ADMIN_PERCENT = 1

export const SIGNAL_ONGONDOSKODASI_WL009_VAK_ANNUAL_STANDARD = 2.45
export const SIGNAL_ONGONDOSKODASI_WL009_VAK_ANNUAL_SIFI = 1.8

export const SIGNAL_ONGONDOSKODASI_WL009_PAIDUP_MAINTENANCE_MONTHLY_HUF = 500
export const SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_PERCENT = 0.3
export const SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_MIN_FEE_HUF = 300
export const SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_MAX_FEE_HUF = 5_000
export const SIGNAL_ONGONDOSKODASI_WL009_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000

export const SIGNAL_ONGONDOSKODASI_WL009_SUSPENSION_FEE_HUF = 4_000
export const SIGNAL_ONGONDOSKODASI_WL009_CANCELLATION_30_DAYS_MAX_FEE_HUF = 10_000

interface SignalOngondoskodasiWl009BonusInputs {
  inputs: InputsDaily
  durationYears: number
}

export interface SignalOngondoskodasiWl009VariantConfig {
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
  if (frequency === "havi") return SIGNAL_ONGONDOSKODASI_WL009_MIN_MONTHLY_PAYMENT_HUF * 12
  if (frequency === "negyedéves") return SIGNAL_ONGONDOSKODASI_WL009_MIN_QUARTERLY_PAYMENT_HUF * 4
  if (frequency === "féléves") return SIGNAL_ONGONDOSKODASI_WL009_MIN_SEMIANNUAL_PAYMENT_HUF * 2
  return SIGNAL_ONGONDOSKODASI_WL009_MIN_ANNUAL_PAYMENT_HUF
}

function resolvePremiumSizeBonusRate(annualPayment: number): number {
  if (annualPayment < 240_000) return 0
  if (annualPayment < 300_000) return 3
  if (annualPayment < 480_000) return 4.5
  return 5
}

function resolveVakProfile(selectedFundId?: string | null): SignalOngondoskodasiWl009VakProfile {
  const normalized = (selectedFundId ?? "").toLowerCase()
  return normalized.includes("sifi") && normalized.includes("u") ? "sifi-u" : "standard"
}

function resolveVakAnnualRate(profile: SignalOngondoskodasiWl009VakProfile): number {
  return profile === "sifi-u"
    ? SIGNAL_ONGONDOSKODASI_WL009_VAK_ANNUAL_SIFI
    : SIGNAL_ONGONDOSKODASI_WL009_VAK_ANNUAL_STANDARD
}

export function resolveSignalOngondoskodasiWl009Variant(): SignalOngondoskodasiWl009Variant {
  return "huf"
}

export function toSignalOngondoskodasiWl009ProductVariantId(): string {
  return SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF
}

export function normalizeSignalOngondoskodasiWl009DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(
    rounded,
    SIGNAL_ONGONDOSKODASI_WL009_MIN_DURATION_YEARS,
    SIGNAL_ONGONDOSKODASI_WL009_MAX_DURATION_YEARS,
  )
}

export function estimateSignalOngondoskodasiWl009DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeSignalOngondoskodasiWl009DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") {
    return normalizeSignalOngondoskodasiWl009DurationYears(Math.ceil(inputs.durationValue / 12))
  }
  return normalizeSignalOngondoskodasiWl009DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getSignalOngondoskodasiWl009VariantConfig(): SignalOngondoskodasiWl009VariantConfig {
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE,
    productCode: SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE,
    productVariantId: SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF,
    minDurationYears: SIGNAL_ONGONDOSKODASI_WL009_MIN_DURATION_YEARS,
    maxDurationYears: SIGNAL_ONGONDOSKODASI_WL009_MAX_DURATION_YEARS,
    minAnnualPayment: SIGNAL_ONGONDOSKODASI_WL009_MIN_ANNUAL_PAYMENT_HUF,
    minExtraordinaryPayment: SIGNAL_ONGONDOSKODASI_WL009_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function validateSignalOngondoskodasiWl009MinimumPayment(inputs: InputsDaily): boolean {
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= annualMinByFrequency(inputs.frequency)
}

export function validateSignalOngondoskodasiWl009ExtraordinaryMinimum(amount: number): boolean {
  return Math.max(0, amount) >= SIGNAL_ONGONDOSKODASI_WL009_MIN_EXTRAORDINARY_PAYMENT_HUF
}

export function buildSignalOngondoskodasiWl009InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR1
    else if (year === 2) out[year] = SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR2
    else if (year === 3) out[year] = SIGNAL_ONGONDOSKODASI_WL009_INITIAL_COST_YEAR3
    else out[year] = 0
  }
  return out
}

export function buildSignalOngondoskodasiWl009AdminFeePercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] =
      year <= 8
        ? SIGNAL_ONGONDOSKODASI_WL009_ADMIN_PERCENT_YEAR1_TO_8
        : SIGNAL_ONGONDOSKODASI_WL009_ADMIN_PERCENT_YEAR9_PLUS
  }
  return out
}

export function buildSignalOngondoskodasiWl009MainAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const profile = resolveVakProfile(selectedFundId)
  const annualRate = resolveVakAnnualRate(profile)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = profile === "sifi-u" ? annualRate : year <= 3 ? 0 : annualRate
  }
  return out
}

export function buildSignalOngondoskodasiWl009ExtraAndLoyaltyAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const annualRate = resolveVakAnnualRate(resolveVakProfile(selectedFundId))
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = annualRate
  return out
}

export function estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  const amount = Math.max(0, partialSurrenderAmount)
  const proportional = amount * (SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(
    round2(proportional),
    SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_MIN_FEE_HUF,
    SIGNAL_ONGONDOSKODASI_WL009_PARTIAL_SURRENDER_MAX_FEE_HUF,
  )
}

export function buildSignalOngondoskodasiWl009HozampluszBonusPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year >= 4 ? 1 : 0
  }
  return out
}

export function buildSignalOngondoskodasiWl009BonusAmountByYear({
  inputs,
  durationYears,
}: SignalOngondoskodasiWl009BonusInputs): Record<number, number> {
  const safeDuration = normalizeSignalOngondoskodasiWl009DurationYears(durationYears)
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const initialCosts = buildSignalOngondoskodasiWl009InitialCostByYear(safeDuration)
  const out: Record<number, number> = {}

  const firstThreeYearsPayment =
    Math.max(0, yearlyPayments[1] ?? 0) + Math.max(0, yearlyPayments[2] ?? 0) + Math.max(0, yearlyPayments[3] ?? 0)

  const acquisitionTotal =
    Math.max(0, yearlyPayments[1] ?? 0) * (initialCosts[1] / 100) +
    Math.max(0, yearlyPayments[2] ?? 0) * (initialCosts[2] / 100) +
    Math.max(0, yearlyPayments[3] ?? 0) * (initialCosts[3] / 100)

  const ongondoskodasiBase = acquisitionTotal + firstThreeYearsPayment * 0.1

  let loyaltyBalance = 0

  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)
    let accruedThisYear = 0

    if (annualPayment > 0) {
      const premiumSizeRate = resolvePremiumSizeBonusRate(annualPayment) / 100
      if (premiumSizeRate > 0) {
        accruedThisYear += annualPayment * premiumSizeRate
      }

      if (year >= 4 && year <= 8) {
        accruedThisYear += annualPayment * 0.1
      }
    }

    if (year >= 4 && year <= 15) {
      accruedThisYear += ongondoskodasiBase * 0.05
    } else if (year >= 16 && year <= 20) {
      accruedThisYear += ongondoskodasiBase * 0.08
    }

    loyaltyBalance += accruedThisYear

    let released = 0
    if (year === 10) {
      released = loyaltyBalance * 0.75
      loyaltyBalance -= released
    } else if (year === 15) {
      released = loyaltyBalance * 0.75
      loyaltyBalance -= released
    } else if (year >= 20) {
      released = loyaltyBalance
      loyaltyBalance = 0
    }

    if (released > 0) {
      out[year] = round2((out[year] ?? 0) + released)
    }
  }

  return out
}
