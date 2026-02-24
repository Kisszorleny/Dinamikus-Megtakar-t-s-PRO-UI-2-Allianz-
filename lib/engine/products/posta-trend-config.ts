import type { InputsDaily } from "../calculate-results-daily"

export type PostaTrendVariant = "huf"

export const POSTA_TREND_MNB_CODE = "23073" as const
export const POSTA_TREND_PRODUCT_CODE = "23073" as const
export const POSTA_TREND_PRODUCT_VARIANT_HUF = "posta_trend_huf" as const

export const POSTA_TREND_MIN_DURATION_YEARS = 10
export const POSTA_TREND_DEFAULT_DURATION_YEARS = 10

export const POSTA_TREND_MIN_MONTHLY_PAYMENT_HUF = 25_000
export const POSTA_TREND_MAX_MONTHLY_PAYMENT_HUF = 100_000
export const POSTA_TREND_MIN_ANNUAL_PAYMENT_HUF = POSTA_TREND_MIN_MONTHLY_PAYMENT_HUF * 12
export const POSTA_TREND_MAX_ANNUAL_PAYMENT_HUF = POSTA_TREND_MAX_MONTHLY_PAYMENT_HUF * 12

export const POSTA_TREND_ADMIN_MONTHLY_HUF = 1_250
export const POSTA_TREND_ADMIN_MONTHLY_POSTAL_HUF = 1_550
export const POSTA_TREND_ADMIN_MONTHLY_PAIDUP_HUF = 1_100

export const POSTA_TREND_ENABLE_RISK_TABLE = false
export const POSTA_TREND_ENABLE_ASSET_FEE_TABLE = false
export const POSTA_TREND_ENABLE_TRANSACTION_FEES = false
export const POSTA_TREND_ENABLE_INDEXATION_RULES = false

export interface PostaTrendVariantConfig {
  variant: "huf"
  currency: "HUF"
  mnbCode: string
  productCode: string
  productVariantId: string
  minMonthlyPayment: number
  maxMonthlyPayment: number
  minAnnualPayment: number
  maxAnnualPayment: number
  adminMonthlyAmount: number
}

const HUF_CONFIG: PostaTrendVariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: POSTA_TREND_MNB_CODE,
  productCode: POSTA_TREND_PRODUCT_CODE,
  productVariantId: POSTA_TREND_PRODUCT_VARIANT_HUF,
  minMonthlyPayment: POSTA_TREND_MIN_MONTHLY_PAYMENT_HUF,
  maxMonthlyPayment: POSTA_TREND_MAX_MONTHLY_PAYMENT_HUF,
  minAnnualPayment: POSTA_TREND_MIN_ANNUAL_PAYMENT_HUF,
  maxAnnualPayment: POSTA_TREND_MAX_ANNUAL_PAYMENT_HUF,
  adminMonthlyAmount: POSTA_TREND_ADMIN_MONTHLY_HUF,
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.max(POSTA_TREND_MIN_DURATION_YEARS, rounded)
}

function resolveRedemptionFeePercent(year: number): number {
  if (year <= 1) return 60
  if (year === 2) return 50
  if (year === 3) return 30
  if (year === 4) return 25
  if (year === 5) return 20
  if (year === 6) return 15
  if (year === 7) return 10
  if (year === 8) return 5
  if (year === 9) return 2
  if (year === 10) return 1
  return 0
}

export function resolvePostaTrendVariant(): PostaTrendVariant {
  return "huf"
}

export function toPostaTrendProductVariantId(): string {
  return POSTA_TREND_PRODUCT_VARIANT_HUF
}

export function getPostaTrendVariantConfig(): PostaTrendVariantConfig {
  return HUF_CONFIG
}

export function estimatePostaTrendDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function buildPostaTrendInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = year === 1 ? 25 : 2
  return out
}

export function buildPostaTrendInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildPostaTrendAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 0
  return out
}

export function buildPostaTrendRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = resolveRedemptionFeePercent(year)
  return out
}
