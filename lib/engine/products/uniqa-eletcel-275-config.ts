import type { Currency, InputsDaily } from "../calculate-results-daily"

export type UniqaEletcel275Variant = "huf"

export const UNIQA_ELETCEL_275_MNB_CODE = "275" as const
export const UNIQA_ELETCEL_275_PRODUCT_CODE = "275" as const
export const UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF = "uniqa_eletcel_275_huf" as const

export const UNIQA_ELETCEL_275_MIN_DURATION_YEARS = 10
export const UNIQA_ELETCEL_275_MAX_DURATION_YEARS = 80
export const UNIQA_ELETCEL_275_MIN_ANNUAL_PAYMENT_HUF = 180_000
export const UNIQA_ELETCEL_275_MIN_EXTRAORDINARY_PAYMENT_HUF = 20_000
export const UNIQA_ELETCEL_275_MIN_EXTRAORDINARY_PAYMENT_EUR = 100
export const UNIQA_ELETCEL_275_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 50_000

export const UNIQA_ELETCEL_275_EXTRAORDINARY_ADMIN_FEE_PERCENT = 1
export const UNIQA_ELETCEL_275_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT = 4

type UniqaEletcel275InitialCostRow = { year1: number; year2: number; year3: number }

const UNIQA_ELETCEL_275_INITIAL_COST_TABLE: Record<number, UniqaEletcel275InitialCostRow> = {
  10: { year1: 55, year2: 20, year3: 5 },
  11: { year1: 57, year2: 21.5, year3: 5 },
  12: { year1: 59, year2: 23, year3: 5 },
  13: { year1: 61, year2: 24.5, year3: 5 },
  14: { year1: 63, year2: 26, year3: 5 },
  15: { year1: 65, year2: 27.5, year3: 5 },
  16: { year1: 67, year2: 29, year3: 5 },
  17: { year1: 69, year2: 30.5, year3: 5 },
  18: { year1: 71, year2: 32, year3: 5 },
  19: { year1: 73, year2: 33.5, year3: 5 },
  20: { year1: 75, year2: 35, year3: 5 },
}

type UniqaEletcel275RedemptionCurve = Record<number, number>

const UNIQA_ELETCEL_275_REDEMPTION_10: UniqaEletcel275RedemptionCurve = {
  1: 12,
  2: 11,
  3: 9,
  4: 7,
  5: 5,
  6: 3,
  7: 2,
  8: 1,
  9: 0,
  10: 0,
}

const UNIQA_ELETCEL_275_REDEMPTION_15: UniqaEletcel275RedemptionCurve = {
  1: 15,
  2: 13,
  3: 11,
  4: 8,
  5: 6,
  6: 4,
  7: 2.5,
  8: 1.5,
  9: 0.5,
  10: 0,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
}

const UNIQA_ELETCEL_275_REDEMPTION_20_PLUS: UniqaEletcel275RedemptionCurve = {
  1: 19,
  2: 16,
  3: 13,
  4: 10,
  5: 7,
  6: 5,
  7: 3,
  8: 2,
  9: 0.5,
  10: 0,
}

export interface UniqaEletcel275VariantConfig {
  variant: UniqaEletcel275Variant
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
}

const HUF_CONFIG: UniqaEletcel275VariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: UNIQA_ELETCEL_275_MNB_CODE,
  productCode: UNIQA_ELETCEL_275_PRODUCT_CODE,
  productVariantId: UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function normalizeUniqaEletcel275DurationYears(durationYears: number): number {
  return clamp(Math.max(1, Math.round(durationYears)), UNIQA_ELETCEL_275_MIN_DURATION_YEARS, UNIQA_ELETCEL_275_MAX_DURATION_YEARS)
}

export function estimateUniqaEletcel275DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeUniqaEletcel275DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeUniqaEletcel275DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeUniqaEletcel275DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveUniqaEletcel275Variant(): UniqaEletcel275Variant {
  return "huf"
}

export function toUniqaEletcel275ProductVariantId(): string {
  return UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF
}

export function getUniqaEletcel275VariantConfig(): UniqaEletcel275VariantConfig {
  return HUF_CONFIG
}

export function resolveUniqaEletcel275MinimumAnnualPayment(): number {
  return UNIQA_ELETCEL_275_MIN_ANNUAL_PAYMENT_HUF
}

export function buildUniqaEletcel275InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const key = clamp(safeDuration, 10, 20)
  const row = UNIQA_ELETCEL_275_INITIAL_COST_TABLE[key] ?? UNIQA_ELETCEL_275_INITIAL_COST_TABLE[20]
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = row.year1
    else if (year === 2) out[year] = row.year2
    else if (year === 3) out[year] = row.year3
    else out[year] = 0
  }
  return out
}

export function buildUniqaEletcel275InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

// Core V1 simplification: we use the non-bond branch as default for all funds.
export function buildUniqaEletcel275AssetCostPercentByYearMain(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 3) out[year] = 0
    else if (year <= 15) out[year] = 1.95
    else if (year <= 25) out[year] = 1.5
    else out[year] = 1
  }
  return out
}

export function buildUniqaEletcel275AssetCostPercentByYearExtra(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 1.5
  return out
}

export function resolveUniqaEletcel275RegularFeePercent(annualPayment: number, year: number): number {
  if (year >= 26) return 1.5
  if (year <= 3) return 0
  if (annualPayment >= 384_000) return 2
  if (annualPayment >= 300_000) return 3
  return 5
}

export function buildUniqaEletcel275RegularFeePercentByYear(
  annualPayment: number,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = resolveUniqaEletcel275RegularFeePercent(annualPayment, year)
  }
  return out
}

function resolveRedemptionCurveForDuration(durationYears: number): UniqaEletcel275RedemptionCurve {
  if (durationYears <= 10) return UNIQA_ELETCEL_275_REDEMPTION_10
  if (durationYears <= 15) return UNIQA_ELETCEL_275_REDEMPTION_15
  return UNIQA_ELETCEL_275_REDEMPTION_20_PLUS
}

export function buildUniqaEletcel275RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUniqaEletcel275DurationYears(durationYears)
  const curve = resolveRedemptionCurveForDuration(safeDuration)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = curve[year] ?? 0
  }
  return out
}

