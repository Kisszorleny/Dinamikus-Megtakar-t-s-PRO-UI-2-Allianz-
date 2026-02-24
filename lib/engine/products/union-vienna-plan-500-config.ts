import type { Currency, InputsDaily } from "../calculate-results-daily"

export type UnionViennaPlan500Variant = "huf" | "eur" | "usd"
export type UnionViennaPlan500LoyaltyEligibilityProfile = "eligible" | "blocked-after-partial-surrender"

export const UNION_VIENNA_PLAN_500_MNB_CODE = "500" as const
export const UNION_VIENNA_PLAN_500_PRODUCT_CODE_HUF = "500" as const
export const UNION_VIENNA_PLAN_500_PRODUCT_CODE_EUR = "500" as const
export const UNION_VIENNA_PLAN_500_PRODUCT_CODE_USD = "500" as const

export const UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF = "union_vienna_plan_500_huf" as const
export const UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR = "union_vienna_plan_500_eur" as const
export const UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD = "union_vienna_plan_500_usd" as const

export const UNION_VIENNA_PLAN_500_MIN_DURATION_YEARS = 5
export const UNION_VIENNA_PLAN_500_MAX_DURATION_YEARS = 80

export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_HUF = 650_000
export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_HUF = 240_000
export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_EUR = 1_600
export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_EUR = 750
export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_USD = 1_600
export const UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_USD = 750

export const UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_HUF = 100_000
export const UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_EUR = 300
export const UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_USD = 300

export const UNION_VIENNA_PLAN_500_REGULAR_ADMIN_FEE_PERCENT = 2
export const UNION_VIENNA_PLAN_500_EXTRAORDINARY_ADMIN_FEE_PERCENT = 2
export const UNION_VIENNA_PLAN_500_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.15
export const UNION_VIENNA_PLAN_500_EXTRA_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.085
export const UNION_VIENNA_PLAN_500_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT = 2

export const UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_HUF = 3_500
export const UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_EUR = 10
export const UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_USD = 10

export const UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_HUF = 25_000
export const UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_EUR = 70
export const UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_USD = 70

export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_PERCENT = 0.3
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_HUF = 350
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_EUR = 1
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_USD = 1
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_HUF = 3_500
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_EUR = 10
export const UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_USD = 10

type UnionViennaPlan500InitialCostRow = { year1: number; year2: number; year3: number }

const UNION_VIENNA_PLAN_500_INITIAL_COST_TABLE: Record<number, UnionViennaPlan500InitialCostRow> = {
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

const UNION_VIENNA_PLAN_500_WHOLE_LIFE_INITIAL_COST_ROW: UnionViennaPlan500InitialCostRow = {
  year1: 72,
  year2: 42,
  year3: 5,
}

export interface UnionViennaPlan500VariantConfig {
  variant: UnionViennaPlan500Variant
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
  loyaltyTier1ThresholdAnnualPayment: number
  loyaltyTier2ThresholdAnnualPayment: number
}

const HUF_CONFIG: UnionViennaPlan500VariantConfig = {
  variant: "huf",
  currency: "HUF",
  mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
  productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_HUF,
  productVariantId: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF,
  minAnnualPayment5To9Years: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_HUF,
  minAnnualPayment10PlusYears: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_HUF,
  minExtraordinaryPayment: UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_HUF,
  fullSurrenderFeeAmount: UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_HUF,
  transactionFeeMinAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_HUF,
  transactionFeeMaxAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_HUF,
  policyWithdrawalFeeAmount: UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_HUF,
  loyaltyTier1ThresholdAnnualPayment: 600_000,
  loyaltyTier2ThresholdAnnualPayment: 1_200_000,
}

const EUR_CONFIG: UnionViennaPlan500VariantConfig = {
  variant: "eur",
  currency: "EUR",
  mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
  productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_EUR,
  productVariantId: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR,
  minAnnualPayment5To9Years: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_EUR,
  minAnnualPayment10PlusYears: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_EUR,
  minExtraordinaryPayment: UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_EUR,
  fullSurrenderFeeAmount: UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_EUR,
  transactionFeeMinAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_EUR,
  transactionFeeMaxAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_EUR,
  policyWithdrawalFeeAmount: UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_EUR,
  loyaltyTier1ThresholdAnnualPayment: 1_800,
  loyaltyTier2ThresholdAnnualPayment: 3_600,
}

const USD_CONFIG: UnionViennaPlan500VariantConfig = {
  variant: "usd",
  currency: "USD",
  mnbCode: UNION_VIENNA_PLAN_500_MNB_CODE,
  productCode: UNION_VIENNA_PLAN_500_PRODUCT_CODE_USD,
  productVariantId: UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD,
  minAnnualPayment5To9Years: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_5_TO_9_USD,
  minAnnualPayment10PlusYears: UNION_VIENNA_PLAN_500_MIN_ANNUAL_PAYMENT_10_PLUS_USD,
  minExtraordinaryPayment: UNION_VIENNA_PLAN_500_MIN_EXTRAORDINARY_PAYMENT_USD,
  fullSurrenderFeeAmount: UNION_VIENNA_PLAN_500_FULL_SURRENDER_FEE_USD,
  transactionFeeMinAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MIN_USD,
  transactionFeeMaxAmount: UNION_VIENNA_PLAN_500_TRANSACTION_FEE_MAX_USD,
  policyWithdrawalFeeAmount: UNION_VIENNA_PLAN_500_POLICY_WITHDRAWAL_FEE_USD,
  loyaltyTier1ThresholdAnnualPayment: 1_800,
  loyaltyTier2ThresholdAnnualPayment: 3_600,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveUnionViennaPlan500Variant(
  productVariant?: string,
  currency?: Currency,
): UnionViennaPlan500Variant {
  const normalized = (productVariant ?? "").toLowerCase()
  if (normalized.includes("_usd") || normalized.includes("usd")) return "usd"
  if (normalized.includes("_eur") || normalized.includes("eur")) return "eur"
  if (normalized.includes("_huf") || normalized.includes("huf")) return "huf"
  if (currency === "USD") return "usd"
  if (currency === "EUR") return "eur"
  return "huf"
}

export function resolveUnionViennaPlan500LoyaltyEligibilityProfile(
  productVariant?: string,
): UnionViennaPlan500LoyaltyEligibilityProfile {
  const normalized = (productVariant ?? "").toLowerCase()
  return normalized.includes("__bonus_blocked") ? "blocked-after-partial-surrender" : "eligible"
}

export function toUnionViennaPlan500ProductVariantId(
  variant: UnionViennaPlan500Variant,
  loyaltyEligibilityProfile?: UnionViennaPlan500LoyaltyEligibilityProfile,
): string {
  const base =
    variant === "eur"
      ? UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR
      : variant === "usd"
        ? UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD
        : UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF
  if (loyaltyEligibilityProfile === "blocked-after-partial-surrender") return `${base}__bonus_blocked`
  return base
}

export function getUnionViennaPlan500VariantConfig(
  productVariant?: string,
  currency?: Currency,
): UnionViennaPlan500VariantConfig {
  const variant = resolveUnionViennaPlan500Variant(productVariant, currency)
  if (variant === "eur") return EUR_CONFIG
  if (variant === "usd") return USD_CONFIG
  return HUF_CONFIG
}

export function normalizeUnionViennaPlan500DurationYears(durationYears: number): number {
  return clamp(Math.max(1, Math.round(durationYears)), UNION_VIENNA_PLAN_500_MIN_DURATION_YEARS, UNION_VIENNA_PLAN_500_MAX_DURATION_YEARS)
}

export function estimateUnionViennaPlan500DurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeUnionViennaPlan500DurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeUnionViennaPlan500DurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeUnionViennaPlan500DurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveUnionViennaPlan500MinimumAnnualPayment(
  durationYears: number,
  config: UnionViennaPlan500VariantConfig,
): number {
  return durationYears <= 9 ? config.minAnnualPayment5To9Years : config.minAnnualPayment10PlusYears
}

export function buildUnionViennaPlan500InitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}

  const row =
    safeDuration > 20
      ? UNION_VIENNA_PLAN_500_WHOLE_LIFE_INITIAL_COST_ROW
      : (UNION_VIENNA_PLAN_500_INITIAL_COST_TABLE[clamp(safeDuration, 5, 20)] ?? UNION_VIENNA_PLAN_500_INITIAL_COST_TABLE[20])

  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = row.year1
    else if (year === 2) out[year] = row.year2
    else if (year === 3) out[year] = row.year3
    else out[year] = 0
  }
  return out
}

export function buildUnionViennaPlan500InvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildUnionViennaPlan500RedemptionFeeByYear(
  durationYears: number,
  config: UnionViennaPlan500VariantConfig,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}
  const approxFinalYearPercent = Math.max(0, (config.fullSurrenderFeeAmount / Math.max(1, config.minAnnualPayment10PlusYears)) * 100)
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = approxFinalYearPercent
  }
  return out
}

export function estimateUnionViennaPlan500TransactionFee(amount: number, config: UnionViennaPlan500VariantConfig): number {
  const safeAmount = Math.max(0, amount)
  const proportional = safeAmount * (UNION_VIENNA_PLAN_500_TRANSACTION_FEE_PERCENT / 100)
  return clamp(round2(proportional), config.transactionFeeMinAmount, config.transactionFeeMaxAmount)
}

function resolveLoyaltyTierMultiplierAtYear20(minAnnualPayment: number, config: UnionViennaPlan500VariantConfig): number {
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

export function buildUnionViennaPlan500LoyaltyBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  config: UnionViennaPlan500VariantConfig,
  loyaltyEligibilityProfile: UnionViennaPlan500LoyaltyEligibilityProfile,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}
  if (safeDuration < 10) return out
  if (loyaltyEligibilityProfile !== "eligible") return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, Math.min(20, safeDuration))
  if (minAnnualPayment <= 0) return out

  if (safeDuration >= 7) out[7] = round2(minAnnualPayment * 0.3)
  if (safeDuration >= 10) out[10] = round2(minAnnualPayment * 0.7)
  if (safeDuration >= 15) out[15] = round2(minAnnualPayment)
  if (safeDuration >= 20) {
    out[20] = round2(minAnnualPayment * resolveLoyaltyTierMultiplierAtYear20(minAnnualPayment, config))
  }
  return out
}

export function buildUnionViennaPlan500MaturityBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}
  if (safeDuration < 10 || safeDuration > 20) return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, safeDuration)
  if (minAnnualPayment <= 0) return out

  const anchorYear = safeDuration >= 15 ? 15 : 10
  const yearsAfterAnchor = Math.max(0, safeDuration - anchorYear)
  out[safeDuration] = round2(yearsAfterAnchor * minAnnualPayment * 0.2)
  return out
}

export function buildUnionViennaPlan500ExtraordinaryEarlySurrenderApproxCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaPlan500DurationYears(durationYears)
  const out: Record<number, number> = {}
  const immediateExtraPayments = inputs.yearlyExtraImmediateAccessPaymentsPlan ?? []
  const taxEligibleExtraPayments = inputs.yearlyExtraTaxEligiblePaymentsPlan ?? []
  const immediateExtraWithdrawals = inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? []

  for (let year = 1; year <= safeDuration; year++) {
    const extraPaidInYear = Math.max(0, immediateExtraPayments[year] ?? 0) + Math.max(0, taxEligibleExtraPayments[year] ?? 0)
    const immediateWithdrawalInYear = Math.max(0, immediateExtraWithdrawals[year] ?? 0)
    if (extraPaidInYear <= 0 || immediateWithdrawalInYear <= 0) continue

    // V1 approximation: if payment and extraordinary withdrawal happen in the same year,
    // apply the 2% charge on the overlap amount as an annualized proxy for the 3-month rule.
    const chargeBase = Math.min(extraPaidInYear, immediateWithdrawalInYear)
    out[year] = round2(chargeBase * 0.02)
  }
  return out
}
