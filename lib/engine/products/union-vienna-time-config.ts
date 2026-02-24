import type { Currency, InputsDaily } from "../calculate-results-daily"

export type UnionViennaTimeVariant = "erste-564" | "standard-584" | "select-606"
export type UnionViennaTimeChannelProfile = "erste" | "standard" | "select"
export type UnionViennaTimeLoyaltyEligibilityProfile = "eligible" | "blocked-after-partial-surrender"

export const UNION_VIENNA_TIME_PRODUCT_CODE_564 = "564" as const
export const UNION_VIENNA_TIME_PRODUCT_CODE_584 = "584" as const
export const UNION_VIENNA_TIME_PRODUCT_CODE_606 = "606" as const

export const UNION_VIENNA_TIME_MNB_CODE_564 = "564" as const
export const UNION_VIENNA_TIME_MNB_CODE_584 = "584" as const
export const UNION_VIENNA_TIME_MNB_CODE_606 = "606" as const

export const UNION_VIENNA_TIME_PRODUCT_VARIANT_564 = "union_vienna_time_564" as const
export const UNION_VIENNA_TIME_PRODUCT_VARIANT_584 = "union_vienna_time_584" as const
export const UNION_VIENNA_TIME_PRODUCT_VARIANT_606 = "union_vienna_time_606" as const

export const UNION_VIENNA_TIME_MIN_DURATION_YEARS = 5
export const UNION_VIENNA_TIME_MAX_DURATION_YEARS = 80
export const UNION_VIENNA_TIME_MIN_ANNUAL_PAYMENT_HUF = 120_000
export const UNION_VIENNA_TIME_MIN_EXTRAORDINARY_PAYMENT_HUF = 25_000
export const UNION_VIENNA_TIME_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF = 200_000

export const UNION_VIENNA_TIME_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT = 4
export const UNION_VIENNA_TIME_EXTRAORDINARY_ONE_OFF_FEE_PERCENT = 2.5
export const UNION_VIENNA_TIME_EXTRAORDINARY_ADMIN_FEE_PERCENT = UNION_VIENNA_TIME_EXTRAORDINARY_ONE_OFF_FEE_PERCENT
export const UNION_VIENNA_TIME_EXTRAORDINARY_TAX_BONUS_MAINTENANCE_MONTHLY_PERCENT = 0.1
export const UNION_VIENNA_TIME_EXTRAORDINARY_OTHER_MAINTENANCE_MONTHLY_PERCENT = 0.199
export const UNION_VIENNA_TIME_FULL_SURRENDER_FEE_HUF = 25_000
export const UNION_VIENNA_TIME_POLICY_CANCELLATION_ADMIN_FEE_HUF = 2_000
export const UNION_VIENNA_TIME_NON_ONLINE_SWITCH_FEE_HUF = 500
export const UNION_VIENNA_TIME_TRANSACTION_FEE_PERCENT = 0.3
export const UNION_VIENNA_TIME_TRANSACTION_FEE_MIN_HUF = 350
export const UNION_VIENNA_TIME_TRANSACTION_FEE_MAX_HUF = 3_500

type UnionViennaTimeInitialCostRow = { year1: number; year2: number; year3: number }

const UNION_VIENNA_TIME_INITIAL_COST_TABLE: Record<number, UnionViennaTimeInitialCostRow> = {
  5: { year1: 42, year2: 0, year3: 0 },
  6: { year1: 50, year2: 0, year3: 0 },
  7: { year1: 58, year2: 0, year3: 0 },
  8: { year1: 65, year2: 0, year3: 0 },
  9: { year1: 72, year2: 8, year3: 0 },
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

export interface UnionViennaTimeVariantConfig {
  variant: UnionViennaTimeVariant
  channelProfile: UnionViennaTimeChannelProfile
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
}

const ERSTE_564_CONFIG: UnionViennaTimeVariantConfig = {
  variant: "erste-564",
  channelProfile: "erste",
  currency: "HUF",
  mnbCode: UNION_VIENNA_TIME_MNB_CODE_564,
  productCode: UNION_VIENNA_TIME_PRODUCT_CODE_564,
  productVariantId: UNION_VIENNA_TIME_PRODUCT_VARIANT_564,
}

const STANDARD_584_CONFIG: UnionViennaTimeVariantConfig = {
  variant: "standard-584",
  channelProfile: "standard",
  currency: "HUF",
  mnbCode: UNION_VIENNA_TIME_MNB_CODE_584,
  productCode: UNION_VIENNA_TIME_PRODUCT_CODE_584,
  productVariantId: UNION_VIENNA_TIME_PRODUCT_VARIANT_584,
}

const SELECT_606_CONFIG: UnionViennaTimeVariantConfig = {
  variant: "select-606",
  channelProfile: "select",
  currency: "HUF",
  mnbCode: UNION_VIENNA_TIME_MNB_CODE_606,
  productCode: UNION_VIENNA_TIME_PRODUCT_CODE_606,
  productVariantId: UNION_VIENNA_TIME_PRODUCT_VARIANT_606,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

export function resolveUnionViennaTimeChannelProfile(
  channelProfile?: string,
  productVariant?: string,
): UnionViennaTimeChannelProfile {
  const normalizedProfile = (channelProfile ?? "").toLowerCase()
  if (normalizedProfile.includes("erste")) return "erste"
  if (normalizedProfile.includes("select")) return "select"
  if (normalizedProfile.includes("standard")) return "standard"

  const normalizedVariant = (productVariant ?? "").toLowerCase()
  if (normalizedVariant.includes("564")) return "erste"
  if (normalizedVariant.includes("606")) return "select"
  if (normalizedVariant.includes("584")) return "standard"
  return "standard"
}

export function resolveUnionViennaTimeVariant(
  productVariant?: string,
  channelProfile?: string,
): UnionViennaTimeVariant {
  const normalizedVariant = (productVariant ?? "").toLowerCase()
  if (normalizedVariant.includes("564")) return "erste-564"
  if (normalizedVariant.includes("606")) return "select-606"
  if (normalizedVariant.includes("584")) return "standard-584"

  const profile = resolveUnionViennaTimeChannelProfile(channelProfile)
  if (profile === "erste") return "erste-564"
  if (profile === "select") return "select-606"
  return "standard-584"
}

export function resolveUnionViennaTimeLoyaltyEligibilityProfile(
  productVariant?: string,
): UnionViennaTimeLoyaltyEligibilityProfile {
  const normalized = (productVariant ?? "").toLowerCase()
  return normalized.includes("__bonus_blocked") ? "blocked-after-partial-surrender" : "eligible"
}

export function toUnionViennaTimeProductVariantId(
  variant: UnionViennaTimeVariant,
  loyaltyEligibilityProfile?: UnionViennaTimeLoyaltyEligibilityProfile,
): string {
  const base =
    variant === "erste-564"
      ? UNION_VIENNA_TIME_PRODUCT_VARIANT_564
      : variant === "select-606"
        ? UNION_VIENNA_TIME_PRODUCT_VARIANT_606
        : UNION_VIENNA_TIME_PRODUCT_VARIANT_584
  if (loyaltyEligibilityProfile === "blocked-after-partial-surrender") return `${base}__bonus_blocked`
  return base
}

export function getUnionViennaTimeVariantConfig(
  productVariant?: string,
  channelProfile?: string,
): UnionViennaTimeVariantConfig {
  const variant = resolveUnionViennaTimeVariant(productVariant, channelProfile)
  if (variant === "erste-564") return ERSTE_564_CONFIG
  if (variant === "select-606") return SELECT_606_CONFIG
  return STANDARD_584_CONFIG
}

export function normalizeUnionViennaTimeDurationYears(durationYears: number): number {
  return clamp(Math.max(1, Math.round(durationYears)), UNION_VIENNA_TIME_MIN_DURATION_YEARS, UNION_VIENNA_TIME_MAX_DURATION_YEARS)
}

export function estimateUnionViennaTimeDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeUnionViennaTimeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeUnionViennaTimeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeUnionViennaTimeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveUnionViennaTimeMinimumAnnualPayment(): number {
  return UNION_VIENNA_TIME_MIN_ANNUAL_PAYMENT_HUF
}

export function resolveUnionViennaTimeAdminFeePercentOfPayment(annualPayment: number): number {
  return annualPayment >= 300_000 ? 2 : 3
}

export function resolveUnionViennaTimeAccountMaintenanceMonthlyPercent(annualPayment: number): number {
  if (annualPayment >= 300_000) return 0.15
  if (annualPayment >= 180_000) return 0.199
  return 0.225
}

export function buildUnionViennaTimeInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const row = UNION_VIENNA_TIME_INITIAL_COST_TABLE[clamp(safeDuration, 5, 20)] ?? UNION_VIENNA_TIME_INITIAL_COST_TABLE[20]
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = row.year1
    else if (year === 2) out[year] = row.year2
    else if (year === 3) out[year] = row.year3
    else out[year] = 0
  }
  return out
}

export function buildUnionViennaTimeInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildUnionViennaTimeRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const approxFinalYearPercent = Math.max(0, (UNION_VIENNA_TIME_FULL_SURRENDER_FEE_HUF / UNION_VIENNA_TIME_MIN_ANNUAL_PAYMENT_HUF) * 100)
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = approxFinalYearPercent
  }
  return out
}

export function estimateUnionViennaTimeTransactionFee(amount: number): number {
  const safeAmount = Math.max(0, amount)
  const proportional = safeAmount * (UNION_VIENNA_TIME_TRANSACTION_FEE_PERCENT / 100)
  return clamp(round2(proportional), UNION_VIENNA_TIME_TRANSACTION_FEE_MIN_HUF, UNION_VIENNA_TIME_TRANSACTION_FEE_MAX_HUF)
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

export function buildUnionViennaTimeLoyaltyBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  loyaltyEligibilityProfile: UnionViennaTimeLoyaltyEligibilityProfile,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const out: Record<number, number> = {}
  if (loyaltyEligibilityProfile !== "eligible") return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, Math.min(20, safeDuration))
  if (minAnnualPayment <= 0) return out

  if (safeDuration >= 10) out[10] = round2(minAnnualPayment)
  if (safeDuration >= 15) out[15] = round2(minAnnualPayment)
  if (safeDuration >= 20) out[20] = round2(minAnnualPayment)
  return out
}

export function buildUnionViennaTimeMaturityBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const out: Record<number, number> = {}
  if (safeDuration < 10 || safeDuration > 20) return out

  const minAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, safeDuration)
  if (minAnnualPayment <= 0) return out

  const anchorYear = safeDuration >= 15 ? 15 : 10
  const yearsAfterAnchor = Math.max(0, safeDuration - anchorYear)
  out[safeDuration] = round2(yearsAfterAnchor * minAnnualPayment * 0.2)
  return out
}

export function buildUnionViennaTimeExtraordinaryEarlySurrenderApproxCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeUnionViennaTimeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const taxEligibleExtraPayments = inputs.yearlyExtraTaxEligiblePaymentsPlan ?? []
  const immediateExtraPayments = inputs.yearlyExtraImmediateAccessPaymentsPlan ?? []
  const immediateExtraWithdrawals = inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? []

  for (let year = 1; year <= safeDuration; year++) {
    const taxEligiblePaid = Math.max(0, taxEligibleExtraPayments[year] ?? 0)
    const immediatePaid = Math.max(0, immediateExtraPayments[year] ?? 0)
    const immediateWithdrawal = Math.max(0, immediateExtraWithdrawals[year] ?? 0)

    if (immediateWithdrawal <= 0) continue
    const chargedBaseTaxEligible = Math.min(taxEligiblePaid, immediateWithdrawal)
    const chargedBaseImmediate = Math.min(immediatePaid, Math.max(0, immediateWithdrawal - chargedBaseTaxEligible))
    const chargedBaseTotal = chargedBaseTaxEligible + chargedBaseImmediate
    if (chargedBaseTotal <= 0) continue

    // V1 approximation: 3/6 month timing windows are represented as same-year overlap.
    out[year] = round2(chargedBaseTotal * 0.02)
  }
  return out
}
