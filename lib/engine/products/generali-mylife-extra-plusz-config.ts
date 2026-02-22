import type { InputsDaily } from "../calculate-results-daily"

export type GeneraliMylifeExtraPluszVariant = "life" | "pension"

export interface GeneraliMylifeExtraPluszVariantConfig {
  variant: GeneraliMylifeExtraPluszVariant
  code: "U67P"
  currency: "HUF"
  productVariantId: "generali_mylife_extra_plusz_u67p_life" | "generali_mylife_extra_plusz_u67p_pension"
  taxCreditAllowed: boolean
  minimumDurationYears: number
  maximumDurationYears: number
  taxCreditRepaymentOnSurrenderPercent: number
}

export const GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE = "U67P" as const
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_LIFE = "generali_mylife_extra_plusz_u67p_life" as const
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_PENSION = "generali_mylife_extra_plusz_u67p_pension" as const
export const GENERALI_MYLIFE_EXTRA_PLUSZ_CURRENCY = "HUF" as const

export const GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_DURATION_YEARS = 1
export const GENERALI_MYLIFE_EXTRA_PLUSZ_MAX_DURATION_YEARS = 85
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_MIN_DURATION_YEARS = 5
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_MAX_DURATION_YEARS = 50

export const GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_EXTRAORDINARY_PAYMENT = 10_000
export const GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_REGULAR_WITHDRAWAL_MONTHLY = 15_000
export const GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_BALANCE_AFTER_PARTIAL_SURRENDER = 100_000

export const GENERALI_MYLIFE_EXTRA_PLUSZ_POLICY_ISSUANCE_FEE_AMOUNT = 8_000
export const GENERALI_MYLIFE_EXTRA_PLUSZ_EXTRA_DISTRIBUTION_FEE_PERCENT = 1

export const GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR1_PERCENT = 67
export const GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR2_PERCENT = 37
export const GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR3_20_PERCENT = 7
export const GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_AFTER_20_PERCENT = 0

export const GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_MONEY_MARKET_2016_MONTHLY_PERCENT = 0.12
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_DEFAULT_MONTHLY_PERCENT = 0.15
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH = 37
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH = 1

export const GENERALI_MYLIFE_EXTRA_PLUSZ_SWITCH_FEE_PERCENT = 0.3
export const GENERALI_MYLIFE_EXTRA_PLUSZ_SWITCH_FEE_MIN = 400
export const GENERALI_MYLIFE_EXTRA_PLUSZ_SWITCH_FEE_MAX = 3_500
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PARTIAL_SURRENDER_FEE_PERCENT = 0.3
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PARTIAL_SURRENDER_FEE_MIN = 400
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PARTIAL_SURRENDER_FEE_MAX = 3_500

export const GENERALI_MYLIFE_EXTRA_PLUSZ_WEALTH_BONUS_FROM_YEAR = 21
export const GENERALI_MYLIFE_EXTRA_PLUSZ_WEALTH_BONUS_PERCENT = 0.5
export const GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_RATE_PERCENT = 20
export const GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_CAP_HUF = 130_000
export const GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 120

export const GENERALI_MYLIFE_EXTRA_PLUSZ_STRICT_UNSPECIFIED_RULES = true
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_SWITCH_FEE_MODEL = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_PARTIAL_SURRENDER_PERCENT_FEE = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_FIRST_EXTRA_WITHDRAWAL_FREE_RULE = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_PAYOUT_METHOD_FEES = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_REDIRECTION_FEE = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_STATEMENT_EXTRA_FEE = false
export const GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_REGULAR_WITHDRAWAL_MIN_ENFORCEMENT = false

const LIFE_CONFIG: GeneraliMylifeExtraPluszVariantConfig = {
  variant: "life",
  code: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
  currency: GENERALI_MYLIFE_EXTRA_PLUSZ_CURRENCY,
  productVariantId: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_LIFE,
  taxCreditAllowed: false,
  minimumDurationYears: GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_DURATION_YEARS,
  maximumDurationYears: GENERALI_MYLIFE_EXTRA_PLUSZ_MAX_DURATION_YEARS,
  taxCreditRepaymentOnSurrenderPercent: 0,
}

const PENSION_CONFIG: GeneraliMylifeExtraPluszVariantConfig = {
  variant: "pension",
  code: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_CODE,
  currency: GENERALI_MYLIFE_EXTRA_PLUSZ_CURRENCY,
  productVariantId: GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_PENSION,
  taxCreditAllowed: true,
  minimumDurationYears: GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_MIN_DURATION_YEARS,
  maximumDurationYears: GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_MAX_DURATION_YEARS,
  taxCreditRepaymentOnSurrenderPercent: GENERALI_MYLIFE_EXTRA_PLUSZ_PENSION_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
}

export function resolveGeneraliMylifeExtraPluszVariant(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GeneraliMylifeExtraPluszVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (normalized.includes("pension") || normalized.includes("nyugd")) return "pension"
    if (normalized.includes("life") || normalized.includes("elet")) return "life"
  }
  return enableTaxCredit === true ? "pension" : "life"
}

export function getGeneraliMylifeExtraPluszVariantConfig(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GeneraliMylifeExtraPluszVariantConfig {
  const variant = resolveGeneraliMylifeExtraPluszVariant(productVariant, enableTaxCredit)
  return variant === "pension" ? PENSION_CONFIG : LIFE_CONFIG
}

export function toGeneraliMylifeExtraPluszProductVariantId(
  variant: GeneraliMylifeExtraPluszVariant,
): "generali_mylife_extra_plusz_u67p_life" | "generali_mylife_extra_plusz_u67p_pension" {
  return variant === "pension"
    ? GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_PENSION
    : GENERALI_MYLIFE_EXTRA_PLUSZ_PRODUCT_VARIANT_LIFE
}

export function estimateGeneraliMylifeExtraPluszDurationYears(
  inputs: InputsDaily,
  variantConfig: GeneraliMylifeExtraPluszVariantConfig,
): number {
  const normalize = (years: number): number =>
    Math.min(variantConfig.maximumDurationYears, Math.max(variantConfig.minimumDurationYears, Math.max(1, Math.round(years))))
  if (inputs.durationUnit === "year") return normalize(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalize(Math.ceil(inputs.durationValue / 12))
  return normalize(Math.ceil(inputs.durationValue / 365))
}

export function buildGeneraliMylifeExtraPluszInitialCostByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR1_PERCENT
    else if (year === 2) out[year] = GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR2_PERCENT
    else if (year <= 20) out[year] = GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_YEAR3_20_PERCENT
    else out[year] = GENERALI_MYLIFE_EXTRA_PLUSZ_REGULAR_DISTRIBUTION_FEE_AFTER_20_PERCENT
  }
  return out
}

export function buildGeneraliMylifeExtraPluszInvestedShareByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildGeneraliMylifeExtraPluszRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) out[year] = 0
  return out
}

export function resolveGeneraliMylifeExtraPluszAccountMaintenanceMonthlyPercent(selectedFundId?: string | null): number {
  const normalized = (selectedFundId ?? "").toUpperCase()
  const isMoneyMarket2016 =
    normalized.includes("PENZPIACI_2016") ||
    normalized.includes("PÉNZPIACI_2016") ||
    normalized.includes("PENZPIACI 2016") ||
    normalized.includes("PÉNZPIACI 2016") ||
    normalized.includes("MONEY_MARKET_2016") ||
    normalized.includes("MONEY MARKET 2016")
  return isMoneyMarket2016
    ? GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_MONEY_MARKET_2016_MONTHLY_PERCENT
    : GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_DEFAULT_MONTHLY_PERCENT
}

export function buildGeneraliMylifeExtraPluszAdminPlusCostByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, yearlyPayments[year] ?? 0)
    const monthlyAdmin =
      annualPayment >= 240_000 ? 400
      : annualPayment >= 180_000 ? 300
      : 200
    out[year] = monthlyAdmin * 12
  }
  return out
}

export function resolveGeneraliMylifeExtraPluszContributionBonusPercent(annualRegularPayment: number): number {
  if (annualRegularPayment >= 300_000) return 4
  if (annualRegularPayment >= 240_000) return 2
  return 0
}

export function buildGeneraliMylifeExtraPluszBonusOnContributionPercentByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[year] ?? 0)
    out[year] = resolveGeneraliMylifeExtraPluszContributionBonusPercent(annualPayment)
  }
  return out
}

function averageAnnualNetPaymentInRange(
  yearlyPaymentsPlan: number[],
  yearlyWithdrawalsPlan: number[],
  startYear: number,
  endYear: number,
): number {
  if (endYear < startYear) return 0
  let sum = 0
  let count = 0
  for (let year = startYear; year <= endYear; year++) {
    const payment = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const withdrawal = Math.max(0, yearlyWithdrawalsPlan[year] ?? 0)
    sum += Math.max(0, payment - withdrawal)
    count++
  }
  return count > 0 ? sum / count : 0
}

export function buildGeneraliMylifeExtraPluszLoyaltyBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  const cycles: Array<{ year: number; startYear: number; endYear: number; percent: number }> = [
    { year: 5, startYear: 1, endYear: 5, percent: 7 },
    { year: 10, startYear: 6, endYear: 10, percent: 67 },
    { year: 15, startYear: 11, endYear: 15, percent: 7 },
    { year: 20, startYear: 16, endYear: 20, percent: 37 },
  ]
  for (const cycle of cycles) {
    if (safeDuration < cycle.year) continue
    const averageAnnual = averageAnnualNetPaymentInRange(yearlyPayments, yearlyWithdrawals, cycle.startYear, cycle.endYear)
    if (averageAnnual <= 0) continue
    out[cycle.year] = averageAnnual * (cycle.percent / 100)
  }
  return out
}

export function buildGeneraliMylifeExtraPluszWealthBonusPercentByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = GENERALI_MYLIFE_EXTRA_PLUSZ_WEALTH_BONUS_FROM_YEAR; year <= safeDuration; year++) {
    out[year] = GENERALI_MYLIFE_EXTRA_PLUSZ_WEALTH_BONUS_PERCENT
  }
  return out
}

export function estimateGeneraliMylifeExtraPluszSurrenderChargeByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const safeDuration = Math.max(1, Math.round(durationYears))
  const firstAnnual = Math.max(0, yearlyPayments[1] ?? 0)
  const capAmount = firstAnnual * 1.5
  let cumulative = 0
  for (let year = 1; year <= safeDuration; year++) {
    cumulative += Math.max(0, yearlyPayments[year] ?? 0)
    if (year <= 20) out[year] = Math.min(cumulative * 0.07, capAmount)
    else out[year] = 0
  }
  return out
}

export function resolveGeneraliMylifeExtraPluszTaxCreditCapPerYear(): number {
  return GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_CAP_HUF
}
