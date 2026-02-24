import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type NnVista128Variant = "eur"
export type NnVista128ContractStateProfile = "paid" | "paid-up" | "post-term"
export type NnVista128AssetProfile =
  | "eur-liquidity"
  | "eur-bond"
  | "active-mixed"
  | "equity"
  | "target-date"

export const NN_VISTA_128_MNB_CODE = "128" as const
export const NN_VISTA_128_PRODUCT_CODE = "128" as const
export const NN_VISTA_128_PRODUCT_VARIANT_EUR = "nn_vista_128_eur" as const

export const NN_VISTA_128_MIN_DURATION_YEARS = 10
export const NN_VISTA_128_MAX_DURATION_YEARS = 30

export const NN_VISTA_128_MIN_MONTHLY_PAYMENT_10_TO_14_EUR = 114
export const NN_VISTA_128_MIN_MONTHLY_PAYMENT_15_PLUS_EUR = 82
export const NN_VISTA_128_MIN_EXTRAORDINARY_PAYMENT_EUR = 500

export const NN_VISTA_128_ADMIN_MONTHLY_HAVI_EUR = 4.6
export const NN_VISTA_128_ADMIN_MONTHLY_NEGYEDEVES_EUR = 3.35
export const NN_VISTA_128_ADMIN_MONTHLY_FELEVES_EUR = 3.05
export const NN_VISTA_128_ADMIN_MONTHLY_EVES_EUR = 2.95
export const NN_VISTA_128_ADMIN_MONTHLY_PAID_UP_EUR = 4.4
export const NN_VISTA_128_ADMIN_MONTHLY_POST_TERM_EUR = 1.55

export const NN_VISTA_128_RISK_MONTHLY_16_TO_65_EUR = 0.71
export const NN_VISTA_128_RISK_MONTHLY_66_TO_80_EUR = 0.85

export const NN_VISTA_128_MIN_PARTIAL_SURRENDER_EUR = 500
export const NN_VISTA_128_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_EUR = 500
export const NN_VISTA_128_PARTIAL_SURRENDER_PERCENT = 0.3
export const NN_VISTA_128_PARTIAL_SURRENDER_MIN_FEE_EUR = 4.4
export const NN_VISTA_128_PARTIAL_SURRENDER_MAX_FEE_EUR = 30.2

export interface NnVista128VariantConfig {
  variant: "eur"
  currency: "EUR"
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
  const safeDuration = clamp(Math.round(durationYears), NN_VISTA_128_MIN_DURATION_YEARS, NN_VISTA_128_MAX_DURATION_YEARS)
  if (policyYear >= 4) return 3
  if (safeDuration >= 20) return 20
  return safeDuration
}

function resolveSurrenderPayoutByMonth(elapsedMonth: number, durationMonths: number): number {
  const maturityMonth = Math.max(120, Math.round(durationMonths))
  const month = clamp(Math.round(elapsedMonth), 0, maturityMonth)
  const points: Array<{ month: number; payout: number }> = [
    { month: 0, payout: 30.9 },
    { month: 24, payout: 61.7 },
    { month: 36, payout: 70.0 },
    { month: 60, payout: 90.0 },
    { month: 120, payout: 99.0 },
    { month: maturityMonth, payout: 100.0 },
  ].sort((a, b) => a.month - b.month)

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (month <= next.month) {
      if (next.month === prev.month) return next.payout
      const t = (month - prev.month) / (next.month - prev.month)
      return round2(prev.payout + (next.payout - prev.payout) * t)
    }
  }

  return 100
}

export function resolveNnVista128Variant(): NnVista128Variant {
  return "eur"
}

export function resolveNnVista128VariantFromInputs(inputs?: Pick<InputsDaily, "currency" | "productVariant">): NnVista128Variant {
  if (!inputs) return "eur"
  if (inputs.productVariant === NN_VISTA_128_PRODUCT_VARIANT_EUR) return "eur"
  if (inputs.currency === "EUR") return "eur"
  return "eur"
}

export function toNnVista128ProductVariantId(): string {
  return NN_VISTA_128_PRODUCT_VARIANT_EUR
}

export function normalizeNnVista128DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(rounded, NN_VISTA_128_MIN_DURATION_YEARS, NN_VISTA_128_MAX_DURATION_YEARS)
}

export function estimateNnVista128DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeNnVista128DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeNnVista128DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeNnVista128DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveNnVista128MinMonthlyPayment(durationYears: number): number {
  return durationYears <= 14 ? NN_VISTA_128_MIN_MONTHLY_PAYMENT_10_TO_14_EUR : NN_VISTA_128_MIN_MONTHLY_PAYMENT_15_PLUS_EUR
}

export function getNnVista128VariantConfig(durationYears = 20): NnVista128VariantConfig {
  const safeDuration = normalizeNnVista128DurationYears(durationYears)
  const minMonthlyPayment = resolveNnVista128MinMonthlyPayment(safeDuration)
  return {
    variant: "eur",
    currency: "EUR",
    mnbCode: NN_VISTA_128_MNB_CODE,
    productCode: NN_VISTA_128_PRODUCT_CODE,
    productVariantId: NN_VISTA_128_PRODUCT_VARIANT_EUR,
    minDurationYears: NN_VISTA_128_MIN_DURATION_YEARS,
    maxDurationYears: NN_VISTA_128_MAX_DURATION_YEARS,
    minMonthlyPayment,
    minAnnualPayment: minMonthlyPayment * 12,
    minExtraordinaryPayment: NN_VISTA_128_MIN_EXTRAORDINARY_PAYMENT_EUR,
  }
}

export function resolveNnVista128AdminMonthlyAmount(
  frequency: PaymentFrequency,
  contractStateProfile: NnVista128ContractStateProfile,
): number {
  if (contractStateProfile === "paid-up") return NN_VISTA_128_ADMIN_MONTHLY_PAID_UP_EUR
  if (contractStateProfile === "post-term") return NN_VISTA_128_ADMIN_MONTHLY_POST_TERM_EUR
  if (frequency === "havi") return NN_VISTA_128_ADMIN_MONTHLY_HAVI_EUR
  if (frequency === "negyedéves") return NN_VISTA_128_ADMIN_MONTHLY_NEGYEDEVES_EUR
  if (frequency === "féléves") return NN_VISTA_128_ADMIN_MONTHLY_FELEVES_EUR
  return NN_VISTA_128_ADMIN_MONTHLY_EVES_EUR
}

export function resolveNnVista128RiskMonthlyFeePerInsured(insuredEntryAge: number): number {
  return insuredEntryAge >= 66 ? NN_VISTA_128_RISK_MONTHLY_66_TO_80_EUR : NN_VISTA_128_RISK_MONTHLY_16_TO_65_EUR
}

export function resolveNnVista128ExtraordinarySalesPercent(
  extraordinaryPaymentAmount: number,
  contractStateProfile: "paid" | "paid-up",
): number {
  const amount = Math.max(0, extraordinaryPaymentAmount)
  if (amount < NN_VISTA_128_MIN_EXTRAORDINARY_PAYMENT_EUR) return 0
  if (contractStateProfile === "paid-up") {
    if (amount < 5_000) return 3
    if (amount < 20_000) return 2
    return 1
  }
  if (amount < 20_000) return 1
  return 0.5
}

export function buildNnVista128InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVista128DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveRegularSalesPercentByDurationForYear(safeDuration, year)
  }
  return out
}

export function buildNnVista128InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVista128DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function resolveNnVista128VakPercentForYear(
  durationYears: number,
  policyYear: number,
  assetProfile: NnVista128AssetProfile,
): number {
  if (assetProfile === "eur-liquidity") return 0.45
  if (assetProfile === "eur-bond") return 1.4
  if (assetProfile === "active-mixed") return 1.55
  if (assetProfile === "equity") return 1.7

  const remainingYears = Math.max(0, durationYears - policyYear + 1)
  if (remainingYears >= 21) return 1.7
  if (remainingYears >= 16) return 1.55
  return 1.4
}

export function buildNnVista128AssetCostPercentByYear(
  durationYears: number,
  assetProfile: NnVista128AssetProfile,
): Record<number, number> {
  const safeDuration = normalizeNnVista128DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveNnVista128VakPercentForYear(safeDuration, year, assetProfile)
  }
  return out
}

export function buildNnVista128RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnVista128DurationYears(durationYears)
  const durationMonths = safeDuration * 12
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const payoutPercent = resolveSurrenderPayoutByMonth(year * 12, durationMonths)
    out[year] = round2(Math.max(0, 100 - payoutPercent))
  }
  return out
}

export function estimateNnVista128PartialSurrenderFixedFee(partialSurrenderAmount: number): number {
  if (partialSurrenderAmount <= 0) return NN_VISTA_128_PARTIAL_SURRENDER_MIN_FEE_EUR
  const proportionalFee = partialSurrenderAmount * (NN_VISTA_128_PARTIAL_SURRENDER_PERCENT / 100)
  return clamp(round2(proportionalFee), NN_VISTA_128_PARTIAL_SURRENDER_MIN_FEE_EUR, NN_VISTA_128_PARTIAL_SURRENDER_MAX_FEE_EUR)
}

export function validateNnVista128MinimumPayment(inputs: InputsDaily, durationYears: number): boolean {
  const minAnnual = resolveNnVista128MinMonthlyPayment(durationYears) * 12
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  return firstYearPayment >= minAnnual
}
