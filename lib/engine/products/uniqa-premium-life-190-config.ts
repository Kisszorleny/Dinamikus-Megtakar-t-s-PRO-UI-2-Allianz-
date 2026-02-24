import type { Currency, InputsDaily } from "../calculate-results-daily"

export type UniqaPremiumLife190Variant = "huf"

export const UNIQA_PREMIUM_LIFE_190_MNB_CODE = "190" as const
export const UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE = "190" as const
export const UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF = "uniqa_premium_life_190_huf" as const

export const UNIQA_PREMIUM_LIFE_190_MIN_DURATION_YEARS = 10
export const UNIQA_PREMIUM_LIFE_190_MAX_DURATION_YEARS = 80
export const UNIQA_PREMIUM_LIFE_190_MIN_ANNUAL_PAYMENT_HUF = 180_000
export const UNIQA_PREMIUM_LIFE_190_MIN_EXTRAORDINARY_PAYMENT_HUF = 20_000
export const UNIQA_PREMIUM_LIFE_190_MIN_EXTRAORDINARY_PAYMENT_EUR = 100
export const UNIQA_PREMIUM_LIFE_190_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000

export const UNIQA_PREMIUM_LIFE_190_EXTRAORDINARY_ADMIN_FEE_PERCENT = 1
export const UNIQA_PREMIUM_LIFE_190_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT = 4

export const UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_PERCENT = 0.3
export const UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_MIN_HUF = 300
export const UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_MAX_HUF = 3_000

export interface UniqaPremiumLife190VariantConfig {
  variant: UniqaPremiumLife190Variant
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
}

const HUF_CONFIG: UniqaPremiumLife190VariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: UNIQA_PREMIUM_LIFE_190_MNB_CODE,
  productCode: UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE,
  productVariantId: UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF,
}

const LOW_FEE_FUND_IDS = new Set<string>([
  "PPA", // forint likviditas
  "MKA", // magyar allamkotveny
  "AGA", // allampapir
  "MRA", // hazai reszveny
  "CDB",
  "CDC",
  "CDD",
  "CDE",
  "CDF",
  "CDG",
])

const REDEMPTION_BY_YEAR: Record<number, number> = {
  1: 0,
  2: 11,
  3: 9.5,
  4: 8,
  5: 6.5,
  6: 5,
  7: 3.5,
  8: 2,
  9: 0.5,
  10: 0,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveUniqaPremiumLife190Variant(): UniqaPremiumLife190Variant {
  return "huf"
}

export function toUniqaPremiumLife190ProductVariantId(): string {
  return UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF
}

export function getUniqaPremiumLife190VariantConfig(): UniqaPremiumLife190VariantConfig {
  return HUF_CONFIG
}

export function normalizeUniqaPremiumLife190DurationYears(durationYears: number): number {
  return clamp(Math.max(1, Math.round(durationYears)), UNIQA_PREMIUM_LIFE_190_MIN_DURATION_YEARS, UNIQA_PREMIUM_LIFE_190_MAX_DURATION_YEARS)
}

export function estimateUniqaPremiumLife190DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeUniqaPremiumLife190DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeUniqaPremiumLife190DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeUniqaPremiumLife190DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveUniqaPremiumLife190MinimumAnnualPayment(): number {
  return UNIQA_PREMIUM_LIFE_190_MIN_ANNUAL_PAYMENT_HUF
}

export function buildUniqaPremiumLife190InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = 80
    else if (year === 2) out[year] = 40
    else if (year === 3) out[year] = 5
    else out[year] = 0
  }
  return out
}

export function buildUniqaPremiumLife190InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function resolveUniqaPremiumLife190RegularFeePercent(annualPayment: number, year: number): number {
  if (year >= 26) return 1.5
  if (year <= 3) return 0
  if (annualPayment >= 384_000) return 2
  if (annualPayment >= 300_000) return 3
  return 5
}

export function buildUniqaPremiumLife190RegularFeePercentByYear(
  annualPayment: number,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = resolveUniqaPremiumLife190RegularFeePercent(annualPayment, year)
  return out
}

export function resolveUniqaPremiumLife190MainAssetAnnualPercent(year: number, selectedFundId?: string | null): number {
  if (year <= 3) return 0
  if (year >= 26) return 1
  const normalizedFundId = (selectedFundId ?? "").trim().toUpperCase()
  const isLowFeeFund = LOW_FEE_FUND_IDS.has(normalizedFundId)
  if (year <= 15) return isLowFeeFund ? 0 : 1.95
  return isLowFeeFund ? 1.05 : 1.5
}

export function buildUniqaPremiumLife190MainAssetCostPercentByYear(
  durationYears: number,
  selectedFundId?: string | null,
): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveUniqaPremiumLife190MainAssetAnnualPercent(year, selectedFundId)
  }
  return out
}

export function buildUniqaPremiumLife190ExtraAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 1.5
  return out
}

export function buildUniqaPremiumLife190RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaPremiumLife190DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = REDEMPTION_BY_YEAR[year] ?? 0
  }
  return out
}

export function estimateUniqaPremiumLife190SwitchFee(amount: number): number {
  const safeAmount = Math.max(0, amount)
  const proportional = safeAmount * (UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_PERCENT / 100)
  return clamp(round2(proportional), UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_MIN_HUF, UNIQA_PREMIUM_LIFE_190_SWITCH_FEE_MAX_HUF)
}

