import type { Currency, InputsDaily } from "../calculate-results-daily"

export type UnionViennaAge505Variant = "huf" | "eur" | "usd"
export type UnionViennaAge505LoyaltyEligibilityProfile = "eligible" | "blocked-after-partial-surrender"

export const UNION_VIENNA_AGE_505_MNB_CODE = "505" as const
export const UNION_VIENNA_AGE_505_PRODUCT_CODE_HUF = "505" as const
export const UNION_VIENNA_AGE_505_PRODUCT_CODE_EUR = "505" as const
export const UNION_VIENNA_AGE_505_PRODUCT_CODE_USD = "505" as const

export const UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF = "union_vienna_age_505_huf" as const
export const UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR = "union_vienna_age_505_eur" as const
export const UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD = "union_vienna_age_505_usd" as const

export const UNION_VIENNA_AGE_505_MIN_DURATION_YEARS = 5
export const UNION_VIENNA_AGE_505_MAX_DURATION_YEARS = 80

export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_HUF = 650_000
export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_HUF = 240_000
export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_EUR = 1_600
export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_EUR = 750
export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_USD = 1_600
export const UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_USD = 750
export const UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_HUF = 100_000
export const UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_EUR = 300
export const UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_USD = 300

export const UNION_VIENNA_AGE_505_REGULAR_ADMIN_FEE_PERCENT = 2
export const UNION_VIENNA_AGE_505_EXTRAORDINARY_ADMIN_FEE_PERCENT = 2
export const UNION_VIENNA_AGE_505_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.15
export const UNION_VIENNA_AGE_505_EXTRA_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.085
export const UNION_VIENNA_AGE_505_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT = 2

export const UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_HUF = 3_500
export const UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_EUR = 10
export const UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_USD = 10

export const UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_HUF = 25_000
export const UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_EUR = 70
export const UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_USD = 70

export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_PERCENT = 0.3
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_HUF = 350
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_EUR = 1
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_USD = 1
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_HUF = 3_500
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_EUR = 10
export const UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_USD = 10

export const UNION_VIENNA_AGE_505_TAX_CREDIT_RATE_PERCENT = 20
export const UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_HUF = 130_000
export const UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_EUR = 325
export const UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_USD = 350
export const UNION_VIENNA_AGE_505_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 20

type Union505InitialCostRow = { year1: number; year2: number; year3: number }

const UNION_VIENNA_AGE_505_INITIAL_COST_TABLE: Record<number, Union505InitialCostRow> = {
  5: { year1: 42, year2: 0, year3: 0 },
  6: { year1: 50, year2: 0, year3: 0 },
  7: { year1: 58, year2: 0, year3: 0 },
  8: { year1: 65, year2: 0, year3: 0 },
  9: { year1: 72, year2: 0, year3: 0 },
  10: { year1: 72, year2: 8, year3: 0 },
  11: { year1: 72, year2: 16, year3: 0 },
  12: { year1: 72, year2: 26, year3: 0 },
  13: { year1: 72, year2: 28, year3: 0 },
  14: { year1: 72, year2: 32, year3: 0 },
  15: { year1: 72, year2: 42, year3: 5 },
  16: { year1: 72, year2: 42, year3: 6 },
  17: { year1: 72, year2: 42, year3: 7 },
  18: { year1: 72, year2: 42, year3: 8 },
  19: { year1: 72, year2: 42, year3: 9 },
  20: { year1: 72, year2: 42, year3: 10 },
}

export interface UnionViennaAge505VariantConfig {
  variant: UnionViennaAge505Variant
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
  minAnnualPayment5To9Years: number
  minAnnualPayment10PlusYears: number
  minExtraordinaryPayment: number
  fullSurrenderFeeAmount: number
  transactionFeeMinAmount: number
  transactionFeeMaxAmount: number
  policyWithdrawalFeeAmount: number
  taxCreditCapPerYear: number
  loyaltyTier1ThresholdAnnualPayment: number
  loyaltyTier2ThresholdAnnualPayment: number
}

const HUF_CONFIG: UnionViennaAge505VariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
  productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_HUF,
  productVariantId: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF,
  minAnnualPayment5To9Years: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_HUF,
  minAnnualPayment10PlusYears: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_HUF,
  minExtraordinaryPayment: UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_HUF,
  fullSurrenderFeeAmount: UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_HUF,
  transactionFeeMinAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_HUF,
  transactionFeeMaxAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_HUF,
  policyWithdrawalFeeAmount: UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_HUF,
  taxCreditCapPerYear: UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_HUF,
  loyaltyTier1ThresholdAnnualPayment: 600_000,
  loyaltyTier2ThresholdAnnualPayment: 1_200_000,
}

const EUR_CONFIG: UnionViennaAge505VariantConfig = {
  variant: "eur",
  currency: "EUR",
  mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
  productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_EUR,
  productVariantId: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR,
  minAnnualPayment5To9Years: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_EUR,
  minAnnualPayment10PlusYears: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_EUR,
  minExtraordinaryPayment: UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_EUR,
  fullSurrenderFeeAmount: UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_EUR,
  transactionFeeMinAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_EUR,
  transactionFeeMaxAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_EUR,
  policyWithdrawalFeeAmount: UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_EUR,
  taxCreditCapPerYear: UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_EUR,
  loyaltyTier1ThresholdAnnualPayment: 1_800,
  loyaltyTier2ThresholdAnnualPayment: 3_600,
}

const USD_CONFIG: UnionViennaAge505VariantConfig = {
  variant: "usd",
  currency: "USD",
  mnbCode: UNION_VIENNA_AGE_505_MNB_CODE,
  productCode: UNION_VIENNA_AGE_505_PRODUCT_CODE_USD,
  productVariantId: UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD,
  minAnnualPayment5To9Years: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_5_TO_9_USD,
  minAnnualPayment10PlusYears: UNION_VIENNA_AGE_505_MIN_ANNUAL_PAYMENT_10_PLUS_USD,
  minExtraordinaryPayment: UNION_VIENNA_AGE_505_MIN_EXTRAORDINARY_PAYMENT_USD,
  fullSurrenderFeeAmount: UNION_VIENNA_AGE_505_FULL_SURRENDER_FEE_USD,
  transactionFeeMinAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MIN_USD,
  transactionFeeMaxAmount: UNION_VIENNA_AGE_505_TRANSACTION_FEE_MAX_USD,
  policyWithdrawalFeeAmount: UNION_VIENNA_AGE_505_POLICY_WITHDRAWAL_FEE_USD,
  taxCreditCapPerYear: UNION_VIENNA_AGE_505_TAX_CREDIT_CAP_USD,
  loyaltyTier1ThresholdAnnualPayment: 1_800,
  loyaltyTier2ThresholdAnnualPayment: 3_600,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveUnionViennaAge505Variant(productVariant?: string, currency?: Currency): UnionViennaAge505Variant {
  const normalized = (productVariant ?? "").toLowerCase()
  if (normalized.includes("_usd") || normalized.includes("usd")) return "usd"
  if (normalized.includes("_eur") || normalized.includes("eur")) return "eur"
  if (normalized.includes("_huf") || normalized.includes("huf")) return "huf"
  if (currency === "USD") return "usd"
  if (currency === "EUR") return "eur"
  return "huf"
}

export function resolveUnionViennaAge505LoyaltyEligibilityProfile(
  productVariant?: string,
): UnionViennaAge505LoyaltyEligibilityProfile {
  const normalized = (productVariant ?? "").toLowerCase()
  return normalized.includes("__bonus_blocked") ? "blocked-after-partial-surrender" : "eligible"
}

export function toUnionViennaAge505ProductVariantId(
  variant: UnionViennaAge505Variant,
  loyaltyEligibilityProfile?: UnionViennaAge505LoyaltyEligibilityProfile,
): string {
  const base =
    variant === "eur"
      ? UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR
      : variant === "usd"
        ? UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD
        : UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF
  if (loyaltyEligibilityProfile === "blocked-after-partial-surrender") return `${base}__bonus_blocked`
  return base
}

export function getUnionViennaAge505VariantConfig(
  productVariant?: string,
  currency?: Currency,
): UnionViennaAge505VariantConfig {
  const variant = resolveUnionViennaAge505Variant(productVariant, currency)
  if (variant === "eur") return EUR_CONFIG
  if (variant === "usd") return USD_CONFIG
  return HUF_CONFIG
}

export function normalizeUnionViennaAge505DurationYears(durationYears: number): number {
  return clamp(Math.max(1, Math.round(durationYears)), UNION_VIENNA_AGE_505_MIN_DURATION_YEARS, UNION_VIENNA_AGE_505_MAX_DURATION_YEARS)
}

export function estimateUnionViennaAge505DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeUnionViennaAge505DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeUnionViennaAge505DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeUnionViennaAge505DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveUnionViennaAge505MinimumAnnualPayment(
  durationYears: number,
  config: UnionViennaAge505VariantConfig,
): number {
  return durationYears <= 9 ? config.minAnnualPayment5To9Years : config.minAnnualPayment10PlusYears
}

export function buildUnionViennaAge505InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaAge505DurationYears(durationYears)
  const tableKey = clamp(safeDuration, 5, 20)
  const row = UNION_VIENNA_AGE_505_INITIAL_COST_TABLE[tableKey] ?? UNION_VIENNA_AGE_505_INITIAL_COST_TABLE[20]
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = row.year1
    else if (year === 2) out[year] = row.year2
    else if (year === 3) out[year] = row.year3
    else out[year] = 0
  }
  return out
}

export function buildUnionViennaAge505InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaAge505DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildUnionViennaAge505RedemptionFeeByYear(
  durationYears: number,
  config: UnionViennaAge505VariantConfig,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaAge505DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year < safeDuration ? 100 : Math.max(0, (config.fullSurrenderFeeAmount / Math.max(1, config.minAnnualPayment10PlusYears)) * 100)
  }
  return out
}

export function estimateUnionViennaAge505TransactionFee(
  amount: number,
  config: UnionViennaAge505VariantConfig,
): number {
  const safeAmount = Math.max(0, amount)
  const proportional = safeAmount * (UNION_VIENNA_AGE_505_TRANSACTION_FEE_PERCENT / 100)
  return clamp(round2(proportional), config.transactionFeeMinAmount, config.transactionFeeMaxAmount)
}

function resolveLoyaltyTierMultiplierAtYear20(
  minAnnualPayment: number,
  config: UnionViennaAge505VariantConfig,
): number {
  if (minAnnualPayment >= config.loyaltyTier2ThresholdAnnualPayment) return 2
  if (minAnnualPayment >= config.loyaltyTier1ThresholdAnnualPayment) return 1.5
  return 1
}

function resolveObservedMinimumAnnualRegularPayment(inputs: InputsDaily, endYear: number): number {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  let minValue = Number.POSITIVE_INFINITY
  for (let year = 1; year <= endYear; year++) {
    const payment = Math.max(0, yearlyPayments[year] ?? 0)
    if (payment <= 0) continue
    minValue = Math.min(minValue, payment)
  }
  return Number.isFinite(minValue) ? minValue : 0
}

export function buildUnionViennaAge505LoyaltyBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  config: UnionViennaAge505VariantConfig,
  loyaltyEligibilityProfile: UnionViennaAge505LoyaltyEligibilityProfile,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaAge505DurationYears(durationYears)
  const out: Record<number, number> = {}
  if (loyaltyEligibilityProfile !== "eligible") return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, Math.min(20, safeDuration))
  if (minAnnualPayment <= 0) return out

  if (safeDuration >= 10) out[10] = round2(minAnnualPayment)
  if (safeDuration >= 15) out[15] = round2(minAnnualPayment)
  if (safeDuration >= 20) {
    out[20] = round2(minAnnualPayment * resolveLoyaltyTierMultiplierAtYear20(minAnnualPayment, config))
  }
  return out
}

export function buildUnionViennaAge505MaturityBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaAge505DurationYears(durationYears)
  const out: Record<number, number> = {}
  if (safeDuration < 10 || safeDuration > 20) return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, safeDuration)
  if (minAnnualPayment <= 0) return out

  const anchorYear = safeDuration >= 15 ? 15 : 10
  const yearsAfterAnchor = Math.max(0, safeDuration - anchorYear)
  out[safeDuration] = round2(yearsAfterAnchor * minAnnualPayment * 0.2)
  return out
}
