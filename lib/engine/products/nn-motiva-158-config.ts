import type { InputsDaily, PaymentFrequency } from "../calculate-results-daily"

export type NnMotiva158Variant = "huf" | "eur"
export type NnMotiva158PaymentMethodProfile = "postal" | "non-postal"
export type NnMotiva158ContractStateProfile = "paid" | "paid-up" | "post-term"
export type NnMotiva158AssetProfile =
  | "general-money-market"
  | "general-bond"
  | "general-equity"
  | "target-date"
  | "tax-credit-collector"

export const NN_MOTIVA_158_MNB_CODE = "158" as const
export const NN_MOTIVA_158_PRODUCT_CODE = "158" as const
export const NN_MOTIVA_168_MNB_CODE = "168" as const
export const NN_MOTIVA_168_PRODUCT_CODE = "168" as const
export const NN_MOTIVA_158_PRODUCT_VARIANT_HUF = "nn_motiva_158_huf" as const
export const NN_MOTIVA_168_PRODUCT_VARIANT_EUR = "nn_motiva_168_eur" as const

export const NN_MOTIVA_158_MIN_DURATION_YEARS = 10
export const NN_MOTIVA_158_MAX_DURATION_YEARS = 45
export const NN_MOTIVA_158_MIN_INVESTMENT_MONTHLY_PAYMENT_HUF = 10_300
export const NN_MOTIVA_158_ACCIDENT_DEATH_MONTHLY_FEE_HUF = 142
export const NN_MOTIVA_158_MIN_MONTHLY_PAYMENT_HUF =
  NN_MOTIVA_158_MIN_INVESTMENT_MONTHLY_PAYMENT_HUF + NN_MOTIVA_158_ACCIDENT_DEATH_MONTHLY_FEE_HUF
export const NN_MOTIVA_168_MIN_EXTRAORDINARY_PAYMENT_EUR = 200

export const NN_MOTIVA_158_EXTRAORDINARY_SALES_PERCENT = 6

export const NN_MOTIVA_158_CONTRACTING_FEE_BASE_HUF = 600
export const NN_MOTIVA_158_CONTRACTING_FEE_PROMO_HUF = 0
export const NN_MOTIVA_158_SPECIAL_CANCELLATION_FEE_HUF = 10_000
export const NN_MOTIVA_168_SPECIAL_CANCELLATION_FEE_EUR = 40

export const NN_MOTIVA_158_ADMIN_MONTHLY_STANDARD_HUF = 1_250
export const NN_MOTIVA_158_ADMIN_MONTHLY_ANNUAL_PAYMENT_HUF = 790
export const NN_MOTIVA_158_ADMIN_MONTHLY_PAID_UP_HUF = 940
export const NN_MOTIVA_158_ADMIN_MONTHLY_POST_TERM_HUF = 320

export const NN_MOTIVA_168_ADMIN_MONTHLY_STANDARD_EUR = 3.13
export const NN_MOTIVA_168_ADMIN_MONTHLY_ANNUAL_PAYMENT_EUR = 1.98
export const NN_MOTIVA_168_ADMIN_MONTHLY_PAID_UP_EUR = 2.35
export const NN_MOTIVA_168_ADMIN_MONTHLY_POST_TERM_EUR = 0.8
export const NN_MOTIVA_168_ACCIDENT_DEATH_MONTHLY_FEE_EUR = 0.36

export const NN_MOTIVA_158_TAX_CREDIT_RATE_PERCENT = 20
export const NN_MOTIVA_158_TAX_CREDIT_CAP_PER_YEAR_HUF = 130_000
export const NN_MOTIVA_168_TAX_CREDIT_CAP_PER_YEAR_EUR = 1_625

export interface NnMotiva158VariantConfig {
  variant: NnMotiva158Variant
  currency: "HUF" | "EUR"
  mnbCode: string
  productCode: string
  productVariantId: string
  minDurationYears: number
  maxDurationYears: number
  minMonthlyPayment: number
  minAnnualPayment: number
  minimumInvestmentMonthlyPayment: number
  monthlyRiskFeeIncludedInMinimum: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function resolveRegularSalesPercentByDurationForYear(durationYears: number, policyYear: number): number {
  const safeDuration = clamp(Math.round(durationYears), 10, 20)
  const t = (safeDuration - 10) / 10

  if (policyYear === 1) return round2(lerp(10, 30, t))
  if (policyYear === 2 || policyYear === 3) return round2(lerp(10, 20, t))
  return 3
}

function resolveSurrenderPayoutPercentByMonth(durationMonths: number, elapsedMonth: number): number {
  const safeDurationMonths = Math.max(120, Math.round(durationMonths))
  const maturityMonth = safeDurationMonths
  const m = clamp(Math.round(elapsedMonth), 0, maturityMonth)

  const points: Array<{ month: number; payout: number }> = [
    { month: 0, payout: 35.9 },
    { month: 12, payout: 46.7 },
    { month: 24, payout: 66.7 },
    { month: 36, payout: 85 },
    { month: 60, payout: 90 },
    { month: 120, payout: 99 },
    { month: maturityMonth, payout: 100 },
  ].sort((a, b) => a.month - b.month)

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (m <= next.month) {
      if (next.month === prev.month) return next.payout
      const t = (m - prev.month) / (next.month - prev.month)
      return round2(lerp(prev.payout, next.payout, t))
    }
  }

  return 100
}

export function resolveNnMotiva158Variant(): NnMotiva158Variant {
  return "huf"
}

export function resolveNnMotiva158VariantFromInputs(inputs?: Pick<InputsDaily, "currency" | "productVariant">): NnMotiva158Variant {
  if (!inputs) return "huf"
  if (inputs.productVariant === NN_MOTIVA_168_PRODUCT_VARIANT_EUR) return "eur"
  if (inputs.productVariant === NN_MOTIVA_158_PRODUCT_VARIANT_HUF) return "huf"
  if (inputs.currency === "EUR") return "eur"
  return "huf"
}

export function toNnMotiva158ProductVariantId(variant: NnMotiva158Variant = "huf"): string {
  return variant === "eur" ? NN_MOTIVA_168_PRODUCT_VARIANT_EUR : NN_MOTIVA_158_PRODUCT_VARIANT_HUF
}

export function normalizeNnMotiva158DurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return clamp(rounded, NN_MOTIVA_158_MIN_DURATION_YEARS, NN_MOTIVA_158_MAX_DURATION_YEARS)
}

export function estimateNnMotiva158DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeNnMotiva158DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeNnMotiva158DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeNnMotiva158DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function getNnMotiva158VariantConfig(
  durationYears = 20,
  variant: NnMotiva158Variant = "huf",
): NnMotiva158VariantConfig {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  if (variant === "eur") {
    return {
      variant: "eur",
      currency: "EUR",
      mnbCode: NN_MOTIVA_168_MNB_CODE,
      productCode: NN_MOTIVA_168_PRODUCT_CODE,
      productVariantId: NN_MOTIVA_168_PRODUCT_VARIANT_EUR,
      minDurationYears: NN_MOTIVA_158_MIN_DURATION_YEARS,
      maxDurationYears: NN_MOTIVA_158_MAX_DURATION_YEARS,
      minMonthlyPayment: 0,
      minAnnualPayment: 0,
      minimumInvestmentMonthlyPayment: 0,
      monthlyRiskFeeIncludedInMinimum: NN_MOTIVA_168_ACCIDENT_DEATH_MONTHLY_FEE_EUR,
    }
  }
  return {
    variant: "huf",
    currency: "HUF",
    mnbCode: NN_MOTIVA_158_MNB_CODE,
    productCode: NN_MOTIVA_158_PRODUCT_CODE,
    productVariantId: NN_MOTIVA_158_PRODUCT_VARIANT_HUF,
    minDurationYears: NN_MOTIVA_158_MIN_DURATION_YEARS,
    maxDurationYears: NN_MOTIVA_158_MAX_DURATION_YEARS,
    minMonthlyPayment: NN_MOTIVA_158_MIN_MONTHLY_PAYMENT_HUF,
    minAnnualPayment: NN_MOTIVA_158_MIN_MONTHLY_PAYMENT_HUF * 12,
    minimumInvestmentMonthlyPayment: NN_MOTIVA_158_MIN_INVESTMENT_MONTHLY_PAYMENT_HUF,
    monthlyRiskFeeIncludedInMinimum: NN_MOTIVA_158_ACCIDENT_DEATH_MONTHLY_FEE_HUF,
  }
}

export function resolveNnMotiva158AdminMonthlyAmount(
  frequency: PaymentFrequency,
  paymentMethodProfile: NnMotiva158PaymentMethodProfile,
  contractStateProfile: NnMotiva158ContractStateProfile,
  variant: NnMotiva158Variant = "huf",
): number {
  if (variant === "eur") {
    if (contractStateProfile === "paid-up") return NN_MOTIVA_168_ADMIN_MONTHLY_PAID_UP_EUR
    if (contractStateProfile === "post-term") return NN_MOTIVA_168_ADMIN_MONTHLY_POST_TERM_EUR
    if (frequency === "éves") return NN_MOTIVA_168_ADMIN_MONTHLY_ANNUAL_PAYMENT_EUR
    if (frequency === "havi" && paymentMethodProfile === "postal") return NN_MOTIVA_168_ADMIN_MONTHLY_STANDARD_EUR
    return NN_MOTIVA_168_ADMIN_MONTHLY_STANDARD_EUR
  }

  if (contractStateProfile === "paid-up") return NN_MOTIVA_158_ADMIN_MONTHLY_PAID_UP_HUF
  if (contractStateProfile === "post-term") return NN_MOTIVA_158_ADMIN_MONTHLY_POST_TERM_HUF
  if (frequency === "éves") return NN_MOTIVA_158_ADMIN_MONTHLY_ANNUAL_PAYMENT_HUF
  if (frequency === "havi" && paymentMethodProfile === "postal") return NN_MOTIVA_158_ADMIN_MONTHLY_STANDARD_HUF
  return NN_MOTIVA_158_ADMIN_MONTHLY_STANDARD_HUF
}

export function resolveNnMotiva158AccidentDeathMonthlyFeePerInsured(variant: NnMotiva158Variant = "huf"): number {
  return variant === "eur" ? NN_MOTIVA_168_ACCIDENT_DEATH_MONTHLY_FEE_EUR : NN_MOTIVA_158_ACCIDENT_DEATH_MONTHLY_FEE_HUF
}

export function resolveNnMotiva158ExtraordinarySalesPercent(extraordinaryPaymentAmount: number): number {
  return extraordinaryPaymentAmount > 0 ? NN_MOTIVA_158_EXTRAORDINARY_SALES_PERCENT : 0
}

export function buildNnMotiva158InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveRegularSalesPercentByDurationForYear(safeDuration, year)
  }
  return out
}

export function buildNnMotiva158InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function resolveNnMotiva158AssetCostPercentForYear(
  durationYears: number,
  policyYear: number,
  assetProfile: NnMotiva158AssetProfile,
): number {
  if (assetProfile === "general-money-market") return 1.25
  if (assetProfile === "general-bond") return 1.4
  if (assetProfile === "general-equity") return 1.7
  if (assetProfile === "tax-credit-collector") return 1.7

  const remainingYears = Math.max(0, durationYears - policyYear + 1)
  if (remainingYears >= 21) return 1.7
  if (remainingYears >= 16) return 1.55
  return 1.4
}

export function buildNnMotiva158AssetCostPercentByYear(
  durationYears: number,
  assetProfile: NnMotiva158AssetProfile,
): Record<number, number> {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveNnMotiva158AssetCostPercentForYear(safeDuration, year, assetProfile)
  }
  return out
}

export function buildNnMotiva158RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  const durationMonths = safeDuration * 12
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    const payoutPercent = resolveSurrenderPayoutPercentByMonth(durationMonths, year * 12)
    out[year] = round2(Math.max(0, 100 - payoutPercent))
  }
  return out
}

export function buildNnMotiva158AdminPlusCostByYear(
  durationYears: number,
  frequency: PaymentFrequency,
  paymentMethodProfile: NnMotiva158PaymentMethodProfile,
  contractStateProfile: NnMotiva158ContractStateProfile,
): Record<number, number> {
  const safeDuration = normalizeNnMotiva158DurationYears(durationYears)
  const monthlyAdmin = resolveNnMotiva158AdminMonthlyAmount(frequency, paymentMethodProfile, contractStateProfile)
  const yearlyAdmin = monthlyAdmin * 12
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = yearlyAdmin
  return out
}

export function validateNnMotiva158MinimumPayment(inputs: InputsDaily, durationYears: number): boolean {
  const variant = resolveNnMotiva158VariantFromInputs(inputs)
  const config = getNnMotiva158VariantConfig(durationYears, variant)
  const firstYearPayment = Math.max(0, (inputs.yearlyPaymentsPlan ?? [])[1] ?? 0)
  if (config.minAnnualPayment <= 0) return true
  return firstYearPayment >= config.minAnnualPayment
}
