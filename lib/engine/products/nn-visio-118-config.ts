import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type NnVisio118Variant = "huf"
export type NnVisio118PaymentMethodProfile = "postal" | "non-postal"
export type NnVisio118ContractStateProfile = "paid" | "paid-up"
export type NnVisio118VakProfile =
  | "general-money-market"
  | "general-bond"
  | "general-equity"
  | "general-hungarian-equity"
  | "general-mixed"
  | "target-date"

export const NN_VISIO_118_MNB_CODE = "118" as const
export const NN_VISIO_118_PRODUCT_CODE = "118" as const
export const NN_VISIO_118_PRODUCT_VARIANT_HUF = "nn_visio_118_huf" as const

export const NN_VISIO_118_MIN_DURATION_YEARS = 10
export const NN_VISIO_118_MAX_DURATION_YEARS = 45

export const NN_VISIO_118_MIN_MONTHLY_PAYMENT_10_TO_14_HUF = 23_800
export const NN_VISIO_118_MIN_MONTHLY_PAYMENT_15_PLUS_HUF = 15_000
export const NN_VISIO_118_MIN_EXTRAORDINARY_PAYMENT_HUF = 50_000
export const NN_VISIO_118_HIGH_PREMIUM_THRESHOLD_HUF = 2_000_000

export const NN_VISIO_118_ADMIN_PAIDUP_MONTHLY_HUF = 940
export const NN_VISIO_118_ACCIDENT_DEATH_MONTHLY_18_TO_65_HUF = 142
export const NN_VISIO_118_ACCIDENT_DEATH_MONTHLY_66_PLUS_HUF = 170

export const NN_VISIO_118_MIN_PARTIAL_SURRENDER_HUF = 100_000
export const NN_VISIO_118_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000
export const NN_VISIO_118_PARTIAL_SURRENDER_PERCENT = 0.3
export const NN_VISIO_118_PARTIAL_SURRENDER_MIN_FEE_HUF = 1_020
export const NN_VISIO_118_PARTIAL_SURRENDER_MAX_FEE_HUF = 8_470

export interface NnVisio118VariantConfig {
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

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function resolveRegularSalesPercentByDurationForYear(durationYears: number, policyYear: number): number {
  const cappedDuration = clamp(Math.round(durationYears), 10, 20)
  if (policyYear === 1) return 10 + (cappedDuration - 10) * 2
  if (policyYear === 2 || policyYear === 3) return 5 + (cappedDuration - 10)
  return 4
}

function resolveSurrenderPayoutByMonth(elapsedMonth: number, durationMonths: number): number {
  const month = clamp(Math.round(elapsedMonth), 0, Math.max(120, Math.round(durationMonths)))
  const maturityMonth = Math.max(120, Math.round(durationMonths))
  const points: Array<{ month: number; payout: number }> = [
    { month: 0, payout: 34.5 },
    { month: 5, payout: 37.0 },
    { month: 12, payout: 41.3 },
    { month: 23, payout: 55.0 },
    { month: 60, payout: 86.0 },
    { month: 120, payout: 99.0 },
    { month: maturityMonth, payout: 100.0 },
  ].sort((a, b) => a.month - b.month)

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (month <= next.month) {
      if (next.month === prev.month) return next.payout
      const ratio = (month - prev.month) / (next.month - prev.month)
      return round2(prev.payout + (next.payout - prev.payout) * ratio)
    }
  }

  return 100
}

export function resolveNnVisio118Variant(): NnVisio118Variant {
  return "huf"
}

export function toNnVisio118ProductVariantId(): string {
  return NN_VISIO_118_PRODUCT_VARIANT_HUF
}

export function normalizeNnVisio118DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(rounded, NN_VISIO_118_MIN_DURATION_YEARS, NN_VISIO_118_MAX_DURATION_YEARS)
}

export function estimateNnVisio118DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeNnVisio118DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeNnVisio118DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeNnVisio118DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveNnVisio118MinMonthlyPayment(durationYears: number): number {
  return durationYears <= 14 ? NN_VISIO_118_MIN_MONTHLY_PAYMENT_10_TO_14_HUF : NN_VISIO_118_MIN_MONTHLY_PAYMENT_15_PLUS_HUF
}

export function getNnVisio118VariantConfig(durationYears = 20): NnVisio118VariantConfig {
  const safeDuration = normalizeNnVisio118DurationYears(durationYears)
  const minMonthlyPayment = resolveNnVisio118MinMonthlyPayment(safeDuration)
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: NN_VISIO_118_MNB_CODE,
    productCode: NN_VISIO_118_PRODUCT_CODE,
    productVariantId: NN_VISIO_118_PRODUCT_VARIANT_HUF,
    minDurationYears: NN_VISIO_118_MIN_DURATION_YEARS,
    maxDurationYears: NN_VISIO_118_MAX_DURATION_YEARS,
    minMonthlyPayment,
    minAnnualPayment: minMonthlyPayment * 12,
    minExtraordinaryPayment: NN_VISIO_118_MIN_EXTRAORDINARY_PAYMENT_HUF,
  }
}

export function resolveNnVisio118AdminMonthlyAmount(
  frequency: PaymentFrequency,
  paymentMethodProfile: NnVisio118PaymentMethodProfile,
  contractStateProfile: NnVisio118ContractStateProfile,
): number {
  if (contractStateProfile === "paid-up") return NN_VISIO_118_ADMIN_PAIDUP_MONTHLY_HUF
  if (frequency === "havi") return paymentMethodProfile === "postal" ? 1_285 : 1_120
  if (frequency === "negyedéves") return paymentMethodProfile === "postal" ? 970 : 885
  if (frequency === "féléves") return paymentMethodProfile === "postal" ? 880 : 845
  return paymentMethodProfile === "postal" ? 805 : 815
}

export function resolveNnVisio118AccidentDeathMonthlyFeePerInsured(insuredEntryAge: number): number {
  return insuredEntryAge >= 66 ? NN_VISIO_118_ACCIDENT_DEATH_MONTHLY_66_PLUS_HUF : NN_VISIO_118_ACCIDENT_DEATH_MONTHLY_18_TO_65_HUF
}

export function resolveNnVisio118ExtraordinarySalesPercent(
  extraordinaryPaymentAmount: number,
  contractStateProfile: NnVisio118ContractStateProfile,
): number {
  const amount = Math.max(0, extraordinaryPaymentAmount)
  if (amount < NN_VISIO_118_MIN_EXTRAORDINARY_PAYMENT_HUF) return 0
  if (contractStateProfile === "paid-up") {
    if (amount < 1_000_000) return 4
    if (amount < 5_000_000) return 2
    return 1
  }
  if (amount < 200_000) return 2
  if (amount < 5_000_000) return 1
  return 0.5
}

export function buildNnVisio118InitialCostByYear(inputs: InputsDaily, durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVisio118DurationYears(durationYears)
  const out: Record<number, number> = {}
  const payments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= safeDuration; year++) {
    const baseRate = resolveRegularSalesPercentByDurationForYear(safeDuration, year)
    const yearlyPayment = Math.max(0, payments[year] ?? 0)
    if (yearlyPayment <= 0) {
      out[year] = baseRate
      continue
    }
    const basePart = Math.min(yearlyPayment, NN_VISIO_118_HIGH_PREMIUM_THRESHOLD_HUF)
    const excessPart = Math.max(0, yearlyPayment - NN_VISIO_118_HIGH_PREMIUM_THRESHOLD_HUF)
    const weightedRate = (basePart * baseRate + excessPart * 4) / yearlyPayment
    out[year] = round2(weightedRate)
  }
  return out
}

export function buildNnVisio118InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVisio118DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function resolveNnVisio118VakPercentForYear(
  durationYears: number,
  policyYear: number,
  vakProfile: NnVisio118VakProfile,
): number {
  if (vakProfile === "general-money-market") return 1.25
  if (vakProfile === "general-bond") return 1.4
  if (vakProfile === "general-mixed") return 1.5
  if (vakProfile === "general-equity") return 1.7
  if (vakProfile === "general-hungarian-equity") return 1.82

  const remainingYears = Math.max(0, durationYears - policyYear + 1)
  if (remainingYears >= 21) return 1.7
  if (remainingYears >= 16) return 1.55
  return 1.4
}

export function buildNnVisio118AssetCostPercentByYear(
  durationYears: number,
  vakProfile: NnVisio118VakProfile,
): Record<number, number> {
  const safeDuration = normalizeNnVisio118DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveNnVisio118VakPercentForYear(safeDuration, year, vakProfile)
  }
  return out
}

export function buildNnVisio118RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVisio118DurationYears(durationYears)
  const durationMonths = safeDuration * 12
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const payoutPercent = resolveSurrenderPayoutByMonth(year * 12, durationMonths)
    out[year] = round2(Math.max(0, 100 - payoutPercent))
  }
  return out
}

export function estimateNnVisio118PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  if (partialSurrenderAmount <= 0) return NN_VISIO_118_PARTIAL_SURRENDER_MIN_FEE_HUF
  const proportionalFee = partialSurrenderAmount * (NN_VISIO_118_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(round2(proportionalFee), NN_VISIO_118_PARTIAL_SURRENDER_MIN_FEE_HUF, NN_VISIO_118_PARTIAL_SURRENDER_MAX_FEE_HUF)
}

export function validateNnVisio118MinimumPayment(inputs: InputsDaily, durationYears: number): boolean {
  const minAnnual = resolveNnVisio118MinMonthlyPayment(durationYears) * 12
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= minAnnual
}
