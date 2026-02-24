import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type SignalNyugdijTervPluszNy010Variant = "huf"
export type SignalNyugdijTervPluszNy010PaymentMethodProfile = "bank-transfer" | "direct-debit"

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE = "NY010" as const
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE = "NY010" as const
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF = "signal_nyugdij_terv_plusz_ny010_huf" as const

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_DURATION_YEARS = 10
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MAX_DURATION_YEARS = 80

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_10_TO_14_YEARS_HUF = 20_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_15_PLUS_YEARS_HUF = 15_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_EXTRAORDINARY_PAYMENT_HUF = 35_000

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_INITIAL_COST_YEAR1 = 74
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ADMIN_PERCENT_OF_REGULAR_PAYMENT = 6
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_EXTRAORDINARY_ADMIN_PERCENT_OF_PAYMENT = 1

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_ANNUAL_STANDARD = 2
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_ANNUAL_REDUCED = 1.3
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_MAIN_ANNUAL_BEFORE_YEAR4 = 0

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_PERCENT = 0.3
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_MIN_FEE_HUF = 300
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_MAX_FEE_HUF = 5_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_RATE_PERCENT = 2
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_MONTHLY_HUF = 25_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_QUARTERLY_HUF = 75_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_SEMIANNUAL_HUF = 150_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_ANNUAL_HUF = 300_000

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ONGONDOSKODASI_BONUS_RATE_MONTH_37_TO_180 = 5
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ONGONDOSKODASI_BONUS_RATE_MONTH_181_TO_240 = 8

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_HOZAMPLUSZ_BONUS_RATE_AFTER_YEAR10 = 0.3
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_HOZAMPLUSZ_BONUS_RATE_AFTER_YEAR20_FOR_25_PLUS_DURATION = 2

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PAIDUP_MAINTENANCE_MONTHLY_HUF = 500

export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_RATE_PERCENT = 20
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_CAP_HUF = 130_000
export const SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 20

export interface SignalNyugdijTervPluszNy010VariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minDurationYears: number
  maxDurationYears: number
  minAnnualPayment10To14Years: number
  minAnnualPayment15PlusYears: number
  minExtraordinaryPayment: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function getMinimumMonthlyPayment(durationYears: number): number {
  return durationYears <= 14
    ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_10_TO_14_YEARS_HUF
    : SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_15_PLUS_YEARS_HUF
}

function annualizedMinimumByFrequency(durationYears: number, frequency: PaymentFrequency): number {
  const monthlyMinimum = getMinimumMonthlyPayment(durationYears)
  if (frequency === "havi") return monthlyMinimum * 12
  if (frequency === "negyedéves") return monthlyMinimum * 3 * 4
  if (frequency === "féléves") return monthlyMinimum * 6 * 2
  return monthlyMinimum * 12
}

function annualizedPremiumSizeBonusMinimumByFrequency(frequency: PaymentFrequency): number {
  if (frequency === "havi") return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_MONTHLY_HUF * 12
  if (frequency === "negyedéves") return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_QUARTERLY_HUF * 4
  if (frequency === "féléves") return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_SEMIANNUAL_HUF * 2
  return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_MIN_ANNUAL_HUF
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
  if (normalized.includes("sifi") && normalized.includes("rövid") && normalized.includes("kötvény")) {
    return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_ANNUAL_REDUCED
  }
  if (normalized.includes("sifi") && normalized.includes("rovid") && normalized.includes("kotveny")) {
    return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_ANNUAL_REDUCED
  }
  return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_ANNUAL_STANDARD
}

function encodePaymentMethodProfile(profile: SignalNyugdijTervPluszNy010PaymentMethodProfile): string {
  return profile.replace("-", "_")
}

function decodePaymentMethodProfile(variant?: string): SignalNyugdijTervPluszNy010PaymentMethodProfile {
  const source = (variant ?? "").toLowerCase()
  if (source.includes("__pm_direct_debit")) return "direct-debit"
  return "bank-transfer"
}

export function resolveSignalNyugdijTervPluszNy010Variant(): SignalNyugdijTervPluszNy010Variant {
  return "huf"
}

export function toSignalNyugdijTervPluszNy010ProductVariantId(
  paymentMethodProfile?: SignalNyugdijTervPluszNy010PaymentMethodProfile,
): string {
  if (!paymentMethodProfile) return SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF
  return `${SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF}__pm_${encodePaymentMethodProfile(paymentMethodProfile)}`
}

export function resolveSignalNyugdijTervPluszNy010PaymentMethodProfile(
  productVariant?: string,
): SignalNyugdijTervPluszNy010PaymentMethodProfile {
  return decodePaymentMethodProfile(productVariant)
}

export function normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(
    rounded,
    SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_DURATION_YEARS,
    SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MAX_DURATION_YEARS,
  )
}

export function estimateSignalNyugdijTervPluszNy010DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeSignalNyugdijTervPluszNy010DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") {
    return normalizeSignalNyugdijTervPluszNy010DurationYears(Math.ceil(inputs.durationValue / 12))
  }
  return normalizeSignalNyugdijTervPluszNy010DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getSignalNyugdijTervPluszNy010VariantConfig(): SignalNyugdijTervPluszNy010VariantConfig {
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE,
    productCode: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE,
    productVariantId: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF,
    minDurationYears: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_DURATION_YEARS,
    maxDurationYears: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MAX_DURATION_YEARS,
    minAnnualPayment10To14Years: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_10_TO_14_YEARS_HUF * 12,
    minAnnualPayment15PlusYears: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_MONTHLY_PAYMENT_15_PLUS_YEARS_HUF * 12,
    minExtraordinaryPayment: SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function validateSignalNyugdijTervPluszNy010MinimumPayment(inputs: InputsDaily): boolean {
  const durationYears = estimateSignalNyugdijTervPluszNy010DurationYears(inputs)
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= annualizedMinimumByFrequency(durationYears, inputs.frequency)
}

export function validateSignalNyugdijTervPluszNy010ExtraordinaryMinimum(amount: number): boolean {
  return Math.max(0, amount) >= SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_EXTRAORDINARY_PAYMENT_HUF
}

export function buildSignalNyugdijTervPluszNy010InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_INITIAL_COST_YEAR1
    else if (year === 2) out[year] = resolveSecondYearInitialCostPercent(safeDuration)
    else if (year === 3) out[year] = resolveThirdYearInitialCostPercent(safeDuration)
    else out[year] = 0
  }
  return out
}

export function buildSignalNyugdijTervPluszNy010InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const annualRate = resolveVakAnnualRate(selectedFundId)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year <= 3 ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_VAK_MAIN_ANNUAL_BEFORE_YEAR4 : annualRate
  }
  return out
}

export function buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const annualRate = resolveVakAnnualRate(selectedFundId)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = annualRate
  return out
}

export function estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  const amount = Math.max(0, partialSurrenderAmount)
  const proportional = amount * (SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(
    round2(proportional),
    SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_MIN_FEE_HUF,
    SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PARTIAL_SURRENDER_MAX_FEE_HUF,
  )
}

export function buildSignalNyugdijTervPluszNy010BonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const initialCostByYear = buildSignalNyugdijTervPluszNy010InitialCostByYear(safeDuration)
  const premiumSizeAnnualMinimum = annualizedPremiumSizeBonusMinimumByFrequency(inputs.frequency)

  const firstThreeYearsAcquisitionCost =
    Math.max(0, yearlyPayments[1] ?? 0) * ((initialCostByYear[1] ?? 0) / 100) +
    Math.max(0, yearlyPayments[2] ?? 0) * ((initialCostByYear[2] ?? 0) / 100) +
    Math.max(0, yearlyPayments[3] ?? 0) * ((initialCostByYear[3] ?? 0) / 100)

  let loyaltyBalance = 0
  const out: Record<number, number> = {}

  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)

    if (annualPayment >= premiumSizeAnnualMinimum) {
      const amountBonus = annualPayment * (SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PREMIUM_SIZE_BONUS_RATE_PERCENT / 100)
      out[year] = round2((out[year] ?? 0) + amountBonus)
    }

    const yearMonthStart = (year - 1) * 12 + 1
    if (yearMonthStart >= 37 && yearMonthStart <= 180) {
      loyaltyBalance +=
        firstThreeYearsAcquisitionCost * (SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ONGONDOSKODASI_BONUS_RATE_MONTH_37_TO_180 / 100)
    } else if (yearMonthStart >= 181 && yearMonthStart <= 240) {
      loyaltyBalance +=
        firstThreeYearsAcquisitionCost * (SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ONGONDOSKODASI_BONUS_RATE_MONTH_181_TO_240 / 100)
    }

    if (year >= 10 && (year - 10) % 5 === 0 && loyaltyBalance > 0) {
      const released = loyaltyBalance * 0.5
      out[year] = round2((out[year] ?? 0) + released)
      loyaltyBalance -= released
    }
  }

  return out
}

export function buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeSignalNyugdijTervPluszNy010DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (safeDuration >= 25) {
      out[year] =
        year >= 20
          ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_HOZAMPLUSZ_BONUS_RATE_AFTER_YEAR20_FOR_25_PLUS_DURATION
          : year >= 10
            ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_HOZAMPLUSZ_BONUS_RATE_AFTER_YEAR10
            : 0
      continue
    }
    out[year] =
      safeDuration >= 20 && year >= 10
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_HOZAMPLUSZ_BONUS_RATE_AFTER_YEAR10
        : 0
  }
  return out
}
