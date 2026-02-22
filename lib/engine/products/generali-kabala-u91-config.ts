import type { InputsDaily } from "../calculate-results-daily"

export type GeneraliKabalaU91Variant = "life" | "pension"

export interface GeneraliKabalaU91VariantConfig {
  variant: GeneraliKabalaU91Variant
  code: "U91"
  currency: "HUF"
  productVariantId: "generali_kabala_u91_life" | "generali_kabala_u91_pension"
  taxCreditAllowed: boolean
  minimumDurationYears: number
  maximumDurationYears: number
  minEntryAge: number
  maxEntryAge: number
  taxCreditRepaymentOnSurrenderPercent: number
}

export const GENERALI_KABALA_U91_PRODUCT_CODE = "U91" as const
export const GENERALI_KABALA_U91_PRODUCT_VARIANT_LIFE = "generali_kabala_u91_life" as const
export const GENERALI_KABALA_U91_PRODUCT_VARIANT_PENSION = "generali_kabala_u91_pension" as const

export const GENERALI_KABALA_U91_CURRENCY = "HUF" as const
export const GENERALI_KABALA_U91_LIFE_MIN_DURATION_YEARS = 15
export const GENERALI_KABALA_U91_LIFE_MAX_DURATION_YEARS = 85
export const GENERALI_KABALA_U91_PENSION_MIN_DURATION_YEARS = 10
export const GENERALI_KABALA_U91_PENSION_MAX_DURATION_YEARS = 50
export const GENERALI_KABALA_U91_LIFE_MIN_ENTRY_AGE = 15
export const GENERALI_KABALA_U91_LIFE_MAX_ENTRY_AGE = 85
export const GENERALI_KABALA_U91_PENSION_MIN_ENTRY_AGE = 15
export const GENERALI_KABALA_U91_PENSION_MAX_ENTRY_AGE = 55

export const GENERALI_KABALA_U91_MIN_EXTRAORDINARY_PAYMENT = 10_000
export const GENERALI_KABALA_U91_MIN_BALANCE_AFTER_PARTIAL_SURRENDER = 100_000
export const GENERALI_KABALA_U91_POLICY_ISSUANCE_FEE_AMOUNT = 8_000
export const GENERALI_KABALA_U91_PARTIAL_SURRENDER_FEE_MIN = 400
export const GENERALI_KABALA_U91_PARTIAL_SURRENDER_FEE_MAX = 3_500
export const GENERALI_KABALA_U91_PARTIAL_SURRENDER_FEE_PERCENT = 0.3

export const GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR1_PERCENT = 80
export const GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR2_PERCENT = 50
export const GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR3_PERCENT = 20
export const GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR4_15_PERCENT = 3
export const GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_AFTER_15_PERCENT = 0
export const GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT = 1
export const GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_DURING_SUSPENSION_PERCENT = 3

export const GENERALI_KABALA_U91_ADMIN_FEE_FROM_YEAR4_MONTHLY_AMOUNT = 500
export const GENERALI_KABALA_U91_COLLECTION_FEE_CHECK_MONTHLY_AMOUNT = 250
export const GENERALI_KABALA_U91_STATEMENT_EXTRA_COST_AMOUNT = 300

export const GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_MONEY_MARKET_2016_MONTHLY_PERCENT = 0.16
export const GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_DEFAULT_MONTHLY_PERCENT = 0.175
export const GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH = 37
export const GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH = 1

export const GENERALI_KABALA_U91_TAX_CREDIT_RATE_PERCENT = 20
export const GENERALI_KABALA_U91_TAX_CREDIT_CAP_HUF = 130_000
export const GENERALI_KABALA_U91_PENSION_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 120

export const GENERALI_KABALA_U91_RISK_ACCIDENTAL_DEATH_BENEFIT = 100_000
export const GENERALI_KABALA_U91_RISK_ANNUAL_FEE = 0
export const GENERALI_KABALA_U91_RISK_COVERAGE_START_YEAR = 1
export const GENERALI_KABALA_U91_RISK_COVERAGE_END_YEAR = 1

export const GENERALI_KABALA_U91_STRICT_UNSPECIFIED_RULES = true
export const GENERALI_KABALA_U91_ENABLE_FIDELITY_ACCOUNT_MODEL = false
export const GENERALI_KABALA_U91_ENABLE_EXTRA_DISTRIBUTION_FEE_DURING_SUSPENSION = false
export const GENERALI_KABALA_U91_ENABLE_COLLECTION_FEE_BY_PAYMENT_METHOD = false
export const GENERALI_KABALA_U91_ENABLE_SWITCH_FEE_MODEL = false
export const GENERALI_KABALA_U91_ENABLE_PARTIAL_SURRENDER_PERCENT_FEE = false
export const GENERALI_KABALA_U91_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE = false

const LIFE_CONFIG: GeneraliKabalaU91VariantConfig = {
  variant: "life",
  code: GENERALI_KABALA_U91_PRODUCT_CODE,
  currency: GENERALI_KABALA_U91_CURRENCY,
  productVariantId: GENERALI_KABALA_U91_PRODUCT_VARIANT_LIFE,
  taxCreditAllowed: false,
  minimumDurationYears: GENERALI_KABALA_U91_LIFE_MIN_DURATION_YEARS,
  maximumDurationYears: GENERALI_KABALA_U91_LIFE_MAX_DURATION_YEARS,
  minEntryAge: GENERALI_KABALA_U91_LIFE_MIN_ENTRY_AGE,
  maxEntryAge: GENERALI_KABALA_U91_LIFE_MAX_ENTRY_AGE,
  taxCreditRepaymentOnSurrenderPercent: 0,
}

const PENSION_CONFIG: GeneraliKabalaU91VariantConfig = {
  variant: "pension",
  code: GENERALI_KABALA_U91_PRODUCT_CODE,
  currency: GENERALI_KABALA_U91_CURRENCY,
  productVariantId: GENERALI_KABALA_U91_PRODUCT_VARIANT_PENSION,
  taxCreditAllowed: true,
  minimumDurationYears: GENERALI_KABALA_U91_PENSION_MIN_DURATION_YEARS,
  maximumDurationYears: GENERALI_KABALA_U91_PENSION_MAX_DURATION_YEARS,
  minEntryAge: GENERALI_KABALA_U91_PENSION_MIN_ENTRY_AGE,
  maxEntryAge: GENERALI_KABALA_U91_PENSION_MAX_ENTRY_AGE,
  taxCreditRepaymentOnSurrenderPercent: GENERALI_KABALA_U91_PENSION_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
}

export function resolveGeneraliKabalaU91Variant(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GeneraliKabalaU91Variant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (normalized.includes("pension") || normalized.includes("nyugd")) return "pension"
    if (normalized.includes("life") || normalized.includes("elet")) return "life"
  }
  return enableTaxCredit === true ? "pension" : "life"
}

export function getGeneraliKabalaU91VariantConfig(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GeneraliKabalaU91VariantConfig {
  const variant = resolveGeneraliKabalaU91Variant(productVariant, enableTaxCredit)
  return variant === "pension" ? PENSION_CONFIG : LIFE_CONFIG
}

export function toGeneraliKabalaU91ProductVariantId(
  variant: GeneraliKabalaU91Variant,
): "generali_kabala_u91_life" | "generali_kabala_u91_pension" {
  return variant === "pension"
    ? GENERALI_KABALA_U91_PRODUCT_VARIANT_PENSION
    : GENERALI_KABALA_U91_PRODUCT_VARIANT_LIFE
}

function normalizeDurationYears(durationYears: number, variantConfig: GeneraliKabalaU91VariantConfig): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(variantConfig.maximumDurationYears, Math.max(variantConfig.minimumDurationYears, rounded))
}

export function estimateGeneraliKabalaU91DurationYears(
  inputs: InputsDaily,
  variantConfig: GeneraliKabalaU91VariantConfig,
): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue, variantConfig)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12), variantConfig)
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365), variantConfig)
}

export function buildGeneraliKabalaU91InitialCostByYear(
  durationYears: number,
  variant: GeneraliKabalaU91Variant = "life",
): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  const isPensionShortTerm = variant === "pension" && safeDuration >= 10 && safeDuration <= 14
  const pensionShortYear2Map: Record<number, number> = {
    10: 3,
    11: 12,
    12: 21,
    13: 30,
    14: 40,
  }
  const pensionShortYear3Map: Record<number, number> = {
    10: 3,
    11: 6.5,
    12: 10,
    13: 13.5,
    14: 17,
  }
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) out[year] = GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR1_PERCENT
    else if (year === 2) {
      out[year] = isPensionShortTerm
        ? (pensionShortYear2Map[safeDuration] ?? GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR2_PERCENT)
        : GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR2_PERCENT
    } else if (year === 3) {
      out[year] = isPensionShortTerm
        ? (pensionShortYear3Map[safeDuration] ?? GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR3_PERCENT)
        : GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR3_PERCENT
    }
    else if (year <= 15) out[year] = GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_YEAR4_15_PERCENT
    else out[year] = GENERALI_KABALA_U91_REGULAR_DISTRIBUTION_FEE_AFTER_15_PERCENT
  }
  return out
}

export function buildGeneraliKabalaU91InvestedShareByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  for (let year = 1; year <= Math.max(1, Math.round(durationYears)); year++) {
    out[year] = 100
  }
  return out
}

export function buildGeneraliKabalaU91RedemptionFeeByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  for (let year = 1; year <= Math.max(1, Math.round(durationYears)); year++) {
    out[year] = 0
  }
  return out
}

export function buildGeneraliKabalaU91AdminPlusCostByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  for (let year = 1; year <= Math.max(1, Math.round(durationYears)); year++) {
    out[year] = year >= 4 ? GENERALI_KABALA_U91_ADMIN_FEE_FROM_YEAR4_MONTHLY_AMOUNT * 12 : 0
  }
  return out
}

export function resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(selectedFundId?: string | null): number {
  const normalized = (selectedFundId ?? "").toUpperCase()
  const isMoneyMarket2016 =
    normalized.includes("PENZPIACI_2016") ||
    normalized.includes("PÉNZPIACI_2016") ||
    normalized.includes("PENZPIACI 2016") ||
    normalized.includes("PÉNZPIACI 2016") ||
    normalized.includes("MONEY_MARKET_2016") ||
    normalized.includes("MONEY MARKET 2016")
  return isMoneyMarket2016
    ? GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_MONEY_MARKET_2016_MONTHLY_PERCENT
    : GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_DEFAULT_MONTHLY_PERCENT
}

export function resolveGeneraliKabalaU91ContributionBonusPercent(annualRegularPayment: number): number {
  if (annualRegularPayment >= 650_000) return 5
  if (annualRegularPayment >= 480_000) return 3
  if (annualRegularPayment >= 300_000) return 2.5
  if (annualRegularPayment >= 240_000) return 1.5
  return 0
}

export function buildGeneraliKabalaU91BonusOnContributionPercentByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  for (let year = 1; year <= safeDuration; year++) {
    const annualPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[year] ?? 0)
    out[year] = resolveGeneraliKabalaU91ContributionBonusPercent(annualPayment)
  }
  return out
}

export function buildGeneraliKabalaU91WealthBonusPercentByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  if (safeDuration < 16) return out
  if (safeDuration <= 19) {
    for (let year = 16; year <= safeDuration; year++) out[year] = 0.2
    return out
  }
  for (let year = 16; year <= safeDuration; year++) {
    out[year] = year <= 20 ? 0.5 : 0.7
  }
  return out
}

function hasContinuousPositivePaymentsUntilYear(yearlyPaymentsPlan: number[], year: number): boolean {
  for (let i = 1; i <= year; i++) {
    if ((yearlyPaymentsPlan[i] ?? 0) <= 0) return false
  }
  return true
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

export function buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  variant: GeneraliKabalaU91Variant = "life",
): Record<number, number> {
  const safeDuration = Math.max(1, Math.round(durationYears))
  const out: Record<number, number> = {}
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  const milestones: Array<{ year: number; percent: number }> = [
    { year: 10, percent: 8 },
    { year: 15, percent: 36 },
    { year: 20, percent: 56 },
  ]
  for (const milestone of milestones) {
    if (safeDuration < milestone.year) continue
    if (!hasContinuousPositivePaymentsUntilYear(yearlyPayments, milestone.year)) continue
    const averageAnnual = averageAnnualNetPaymentInRange(yearlyPayments, yearlyWithdrawals, 1, milestone.year)
    if (averageAnnual <= 0) continue
    out[milestone.year] = averageAnnual * (milestone.percent / 100)
  }
  if (variant === "pension" && safeDuration >= 16 && safeDuration <= 19) {
    const shortTermPensionPercentByDuration: Record<number, number> = {
      16: 6.5,
      17: 12.5,
      18: 18.5,
      19: 24.5,
    }
    const milestoneYear = safeDuration
    if (hasContinuousPositivePaymentsUntilYear(yearlyPayments, milestoneYear)) {
      const percent = shortTermPensionPercentByDuration[safeDuration] ?? 0
      if (percent > 0) {
        const averageAnnual = averageAnnualNetPaymentInRange(yearlyPayments, yearlyWithdrawals, 16, milestoneYear)
        if (averageAnnual > 0) {
          out[milestoneYear] = (out[milestoneYear] ?? 0) + averageAnnual * (percent / 100)
        }
      }
    }
  }
  return out
}

export function buildGeneraliKabalaU91FidelityAccountBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  variant: GeneraliKabalaU91Variant = "life",
): Record<number, number> {
  if (!GENERALI_KABALA_U91_ENABLE_FIDELITY_ACCOUNT_MODEL) return {}
  const safeDuration = Math.max(1, Math.round(durationYears))
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  let accumulated = 0
  const out: Record<number, number> = {}
  const isShortTermPension = variant === "pension" && safeDuration >= 10 && safeDuration <= 14
  const loyaltyBaseEndYear = isShortTermPension ? Math.max(1, safeDuration - 1) : 15
  for (let year = 1; year <= Math.min(15, safeDuration); year++) {
    if (year >= 4) {
      if (year <= loyaltyBaseEndYear) {
        const yearlyPayment = Math.max(0, yearlyPayments[year] ?? 0)
        const loyaltyBase = yearlyPayment * 0.1
        const loyaltyPremium = loyaltyBase * 0.35
        accumulated += loyaltyBase + loyaltyPremium
      }
    }
    if (isShortTermPension) {
      if (safeDuration === 10 && year === 10) {
        out[10] = accumulated
        accumulated = 0
      } else if (safeDuration >= 11 && safeDuration <= 14) {
        if (year === 10) {
          const credit = accumulated * 0.8
          out[10] = credit
          accumulated = Math.max(0, accumulated - credit)
        } else if (year === safeDuration) {
          out[safeDuration] = (out[safeDuration] ?? 0) + accumulated
          accumulated = 0
        }
      }
      continue
    }
    if (year === 10) {
      const credit = accumulated * 0.8
      out[10] = credit
      accumulated = Math.max(0, accumulated - credit)
    } else if (year === 15) {
      out[15] = accumulated
      accumulated = 0
    }
  }
  return out
}

export function resolveGeneraliKabalaU91TaxCreditCapPerYear(): number {
  return GENERALI_KABALA_U91_TAX_CREDIT_CAP_HUF
}
