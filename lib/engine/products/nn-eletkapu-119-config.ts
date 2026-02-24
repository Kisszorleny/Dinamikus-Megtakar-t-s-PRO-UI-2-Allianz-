import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type NnEletkapu119Variant = "huf"
export type NnEletkapu119PaymentMethodProfile = "postal" | "non-postal"
export type NnEletkapu119ContractStateProfile = "paid" | "paid-up"
export type NnEletkapu119VakProfile =
  | "general-money-market"
  | "general-bond"
  | "general-equity"
  | "general-hungarian-equity"
  | "target-date"

export const NN_ELETKAPU_119_MNB_CODE = "119" as const
export const NN_ELETKAPU_119_PRODUCT_CODE = "119" as const
export const NN_ELETKAPU_119_PRODUCT_VARIANT_HUF = "nn_eletkapu_119_huf" as const

export const NN_ELETKAPU_119_MIN_DURATION_YEARS = 10
export const NN_ELETKAPU_119_MAX_DURATION_YEARS = 25

export const NN_ELETKAPU_119_MIN_MONTHLY_PAYMENT_10_TO_14_HUF = 23_800
export const NN_ELETKAPU_119_MIN_MONTHLY_PAYMENT_15_PLUS_HUF = 15_000
export const NN_ELETKAPU_119_MIN_EXTRAORDINARY_PAYMENT_HUF = 50_000
export const NN_ELETKAPU_119_HIGH_PREMIUM_THRESHOLD_HUF = 2_000_000

export const NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF = 940
export const NN_ELETKAPU_119_ACCIDENT_DEATH_MONTHLY_18_TO_65_HUF = 142
export const NN_ELETKAPU_119_ACCIDENT_DEATH_MONTHLY_66_PLUS_HUF = 170

export const NN_ELETKAPU_119_MIN_PARTIAL_SURRENDER_HUF = 100_000
export const NN_ELETKAPU_119_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000
export const NN_ELETKAPU_119_PARTIAL_SURRENDER_PERCENT = 0.3
export const NN_ELETKAPU_119_PARTIAL_SURRENDER_MIN_FEE_HUF = 1_020
export const NN_ELETKAPU_119_PARTIAL_SURRENDER_MAX_FEE_HUF = 8_470

export const NN_ELETKAPU_119_ENABLE_ENGINE_PROFILES_WITHOUT_UI = true
export const NN_ELETKAPU_119_ENABLE_TRANSACTION_LEVEL_PARTIAL_SURRENDER_FEE = false
export const NN_ELETKAPU_119_ENABLE_MONTH_LEVEL_SURRENDER_TABLE = false

export interface NnEletkapu119VariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minDurationYears: number
  maxDurationYears: number
  minMonthlyPayment: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function paymentsPerYear(frequency: PaymentFrequency): number {
  if (frequency === "havi") return 12
  if (frequency === "negyedéves") return 4
  if (frequency === "féléves") return 2
  return 1
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveRegularSalesPercentByDurationForYear(durationYears: number, policyYear: number): number {
  const cappedDuration = clamp(Math.round(durationYears), 10, 20)
  if (policyYear === 1) return 10 + (cappedDuration - 10) * 2
  if (policyYear === 2 || policyYear === 3) return 5 + (cappedDuration - 10)
  return 4
}

function resolveSurrenderPayoutByDurationAtYear(durationYears: number, policyYear: number): number {
  const duration = clamp(durationYears, NN_ELETKAPU_119_MIN_DURATION_YEARS, NN_ELETKAPU_119_MAX_DURATION_YEARS)
  const weightTo15 = clamp((duration - 10) / 5, 0, 1)
  const weightTo20 = clamp((duration - 15) / 5, 0, 1)
  const pick = (v10: number, v15: number, v20: number): number => {
    if (duration <= 15) return v10 + (v15 - v10) * weightTo15
    return v15 + (v20 - v15) * weightTo20
  }

  const y1 = pick(29.2, 34, 40)
  const y2 = pick(45, 50, 55)
  const y3 = pick(70.8, 75, 80)
  const y6 = pick(80.6, 83, 86)
  const y10 = 99

  if (policyYear <= 1) return y1
  if (policyYear === 2) return y2
  if (policyYear === 3) return y3
  if (policyYear <= 6) {
    const ratio = (policyYear - 3) / 3
    return y3 + (y6 - y3) * ratio
  }
  if (policyYear <= 10) {
    const ratio = (policyYear - 6) / 4
    return y6 + (y10 - y6) * ratio
  }
  return 99
}

export function resolveNnEletkapu119Variant(): NnEletkapu119Variant {
  return "huf"
}

export function toNnEletkapu119ProductVariantId(): string {
  return NN_ELETKAPU_119_PRODUCT_VARIANT_HUF
}

export function normalizeNnEletkapu119DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(rounded, NN_ELETKAPU_119_MIN_DURATION_YEARS, NN_ELETKAPU_119_MAX_DURATION_YEARS)
}

export function estimateNnEletkapu119DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeNnEletkapu119DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeNnEletkapu119DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeNnEletkapu119DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveNnEletkapu119MinMonthlyPayment(durationYears: number): number {
  return durationYears <= 14
    ? NN_ELETKAPU_119_MIN_MONTHLY_PAYMENT_10_TO_14_HUF
    : NN_ELETKAPU_119_MIN_MONTHLY_PAYMENT_15_PLUS_HUF
}

export function getNnEletkapu119VariantConfig(durationYears = 20): NnEletkapu119VariantConfig {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const minMonthlyPayment = resolveNnEletkapu119MinMonthlyPayment(safeDuration)
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: NN_ELETKAPU_119_MNB_CODE,
    productCode: NN_ELETKAPU_119_PRODUCT_CODE,
    productVariantId: NN_ELETKAPU_119_PRODUCT_VARIANT_HUF,
    minDurationYears: NN_ELETKAPU_119_MIN_DURATION_YEARS,
    maxDurationYears: NN_ELETKAPU_119_MAX_DURATION_YEARS,
    minMonthlyPayment,
    minAnnualPayment: minMonthlyPayment * 12,
    minExtraordinaryPayment: NN_ELETKAPU_119_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function resolveNnEletkapu119AdminMonthlyAmount(
  frequency: PaymentFrequency,
  paymentMethodProfile: NnEletkapu119PaymentMethodProfile,
  contractStateProfile: NnEletkapu119ContractStateProfile,
): number {
  if (contractStateProfile === "paid-up") return NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF
  if (frequency === "havi") return paymentMethodProfile === "postal" ? 1_285 : 1_120
  if (frequency === "negyedéves") return paymentMethodProfile === "postal" ? 970 : 885
  if (frequency === "féléves") return paymentMethodProfile === "postal" ? 880 : 845
  return paymentMethodProfile === "postal" ? 805 : 815
}

export function resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured(insuredEntryAge: number): number {
  return insuredEntryAge >= 66
    ? NN_ELETKAPU_119_ACCIDENT_DEATH_MONTHLY_66_PLUS_HUF
    : NN_ELETKAPU_119_ACCIDENT_DEATH_MONTHLY_18_TO_65_HUF
}

export function resolveNnEletkapu119ExtraordinarySalesPercent(
  extraordinaryPaymentAmount: number,
  contractStateProfile: NnEletkapu119ContractStateProfile,
): number {
  const amount = Math.max(0, extraordinaryPaymentAmount)
  if (amount < NN_ELETKAPU_119_MIN_EXTRAORDINARY_PAYMENT_HUF) return 0
  if (contractStateProfile === "paid-up") {
    if (amount < 1_000_000) return 4
    if (amount < 5_000_000) return 2
    return 1
  }
  if (amount < 200_000) return 2
  if (amount < 5_000_000) return 1
  return 0.5
}

export function buildNnEletkapu119InitialCostByYear(inputs: InputsDaily, durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const out: Record<number, number> = {}
  const payments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= safeDuration; year++) {
    const baseRate = resolveRegularSalesPercentByDurationForYear(safeDuration, year)
    const yearlyPayment = Math.max(0, payments[year] ?? 0)
    if (yearlyPayment <= 0) {
      out[year] = baseRate
      continue
    }
    const basePart = Math.min(yearlyPayment, NN_ELETKAPU_119_HIGH_PREMIUM_THRESHOLD_HUF)
    const excessPart = Math.max(0, yearlyPayment - NN_ELETKAPU_119_HIGH_PREMIUM_THRESHOLD_HUF)
    const weightedRate = (basePart * baseRate + excessPart * 4) / yearlyPayment
    out[year] = round2(weightedRate)
  }
  return out
}

export function buildNnEletkapu119InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function resolveNnEletkapu119VakPercentForYear(
  durationYears: number,
  policyYear: number,
  vakProfile: NnEletkapu119VakProfile,
): number {
  if (vakProfile === "general-money-market") return 1.25
  if (vakProfile === "general-bond") return 1.4
  if (vakProfile === "general-equity") return 1.7
  if (vakProfile === "general-hungarian-equity") return 1.82

  const remainingYears = Math.max(0, durationYears - policyYear + 1)
  if (remainingYears >= 21) return 1.7
  if (remainingYears >= 16) return 1.55
  return 1.4
}

export function buildNnEletkapu119AssetCostPercentByYear(
  durationYears: number,
  vakProfile: NnEletkapu119VakProfile,
): Record<number, number> {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveNnEletkapu119VakPercentForYear(safeDuration, year, vakProfile)
  }
  return out
}

export function buildNnEletkapu119RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const payoutPercent = resolveSurrenderPayoutByDurationAtYear(safeDuration, year)
    out[year] = round2(Math.max(0, 100 - payoutPercent))
  }
  return out
}

export function estimateNnEletkapu119PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  if (partialSurrenderAmount <= 0) return NN_ELETKAPU_119_PARTIAL_SURRENDER_MIN_FEE_HUF
  const proportionalFee = partialSurrenderAmount * (NN_ELETKAPU_119_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(
    round2(proportionalFee),
    NN_ELETKAPU_119_PARTIAL_SURRENDER_MIN_FEE_HUF,
    NN_ELETKAPU_119_PARTIAL_SURRENDER_MAX_FEE_HUF,
  )
}

export function buildNnEletkapu119AdminPlusCostByYear(
  durationYears: number,
  frequency: PaymentFrequency,
  paymentMethodProfile: NnEletkapu119PaymentMethodProfile,
  contractStateProfile: NnEletkapu119ContractStateProfile,
): Record<number, number> {
  const safeDuration = normalizeNnEletkapu119DurationYears(durationYears)
  const monthlyAdmin = resolveNnEletkapu119AdminMonthlyAmount(frequency, paymentMethodProfile, contractStateProfile)
  const yearlyAdmin = monthlyAdmin * 12
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = yearlyAdmin
  return out
}

export function validateNnEletkapu119MinimumPayment(inputs: InputsDaily, durationYears: number): boolean {
  const minAnnual = resolveNnEletkapu119MinMonthlyPayment(durationYears) * 12
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= minAnnual
}
