import type { InputsDaily } from "../calculate-results-daily"

export type ZenProVariant = "ny08" | "ny14" | "ny24"
export type ZenProCurrency = "HUF" | "EUR" | "USD"

export interface ZenProVariantConfig {
  variant: ZenProVariant
  code: string
  currency: ZenProCurrency
  productVariantId: "alfa_zen_pro_ny08" | "alfa_zen_pro_ny14" | "alfa_zen_pro_ny24"
  minExtraordinaryPayment: number
  partialSurrenderFixedFee: number
  policyIssuanceFeeAmount: number
  riskAccidentalDeathBenefit: number
  paidUpMaintenanceMonthlyCapAmount: number
}

export const ZEN_PRO_NY08_PRODUCT_CODE = "NY-08"
export const ZEN_PRO_NY14_PRODUCT_CODE = "NY-14"
export const ZEN_PRO_NY24_PRODUCT_CODE = "NY-24"
export const ZEN_PRO_NY08_CURRENCY = "HUF" as const
export const ZEN_PRO_NY14_CURRENCY = "EUR" as const
export const ZEN_PRO_NY24_CURRENCY = "USD" as const

export const ZEN_PRO_MIN_DURATION_YEARS = 10
export const ZEN_PRO_MAX_DURATION_YEARS = 50
export const ZEN_PRO_NY08_MIN_EXTRAORDINARY_PAYMENT = 50_000
export const ZEN_PRO_NY14_MIN_EXTRAORDINARY_PAYMENT = 200
export const ZEN_PRO_NY24_MIN_EXTRAORDINARY_PAYMENT = 200

export const ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT = 4
export const ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT = 2
export const ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.165
export const ZEN_PRO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 37
export const ZEN_PRO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const ZEN_PRO_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH = 1

export const ZEN_PRO_NY08_PARTIAL_SURRENDER_FIXED_FEE = 2_500
export const ZEN_PRO_NY14_PARTIAL_SURRENDER_FIXED_FEE = 10
export const ZEN_PRO_NY24_PARTIAL_SURRENDER_FIXED_FEE = 10
export const ZEN_PRO_NY08_POLICY_ISSUANCE_FEE_AMOUNT = 14_000
export const ZEN_PRO_NY14_POLICY_ISSUANCE_FEE_AMOUNT = 40
export const ZEN_PRO_NY24_POLICY_ISSUANCE_FEE_AMOUNT = 40
export const ZEN_PRO_POLICY_ISSUANCE_CANCELLATION_WINDOW_DAYS = 30

export const ZEN_PRO_NY08_RISK_ACCIDENTAL_DEATH_BENEFIT = 1_000_000
export const ZEN_PRO_NY14_RISK_ACCIDENTAL_DEATH_BENEFIT = 5_000
export const ZEN_PRO_NY24_RISK_ACCIDENTAL_DEATH_BENEFIT = 5_000
export const ZEN_PRO_RISK_ANNUAL_FEE = 0
export const ZEN_PRO_RISK_COVERAGE_START_YEAR = 1
export const ZEN_PRO_RISK_COVERAGE_END_YEAR = 1

export const ZEN_PRO_TAX_CREDIT_RATE_PERCENT = 20
export const ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF = 130_000
export const ZEN_PRO_NY14_TAX_CREDIT_CAP_FALLBACK_EUR_TO_HUF_RATE = 400
export const ZEN_PRO_NY24_TAX_CREDIT_CAP_FALLBACK_USD_TO_HUF_RATE = 360

export const ZEN_PRO_PAID_UP_MAINTENANCE_MONTHLY_PERCENT = 0.01
export const ZEN_PRO_NY08_PAID_UP_MAINTENANCE_MONTHLY_CAP = 1_000
export const ZEN_PRO_NY14_PAID_UP_MAINTENANCE_MONTHLY_CAP = 5
export const ZEN_PRO_NY24_PAID_UP_MAINTENANCE_MONTHLY_CAP = 5
export const ZEN_PRO_PAID_UP_MAINTENANCE_START_MONTH = 1

export const ZEN_PRO_STRICT_UNSPECIFIED_RULES = true
export const ZEN_PRO_ENABLE_BONUS_PAUSE_MULTIPLIER = false
export const ZEN_PRO_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE = false

const ZEN_PRO_NY08_CONFIG: ZenProVariantConfig = {
  variant: "ny08",
  code: ZEN_PRO_NY08_PRODUCT_CODE,
  currency: ZEN_PRO_NY08_CURRENCY,
  productVariantId: "alfa_zen_pro_ny08",
  minExtraordinaryPayment: ZEN_PRO_NY08_MIN_EXTRAORDINARY_PAYMENT,
  partialSurrenderFixedFee: ZEN_PRO_NY08_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: ZEN_PRO_NY08_POLICY_ISSUANCE_FEE_AMOUNT,
  riskAccidentalDeathBenefit: ZEN_PRO_NY08_RISK_ACCIDENTAL_DEATH_BENEFIT,
  paidUpMaintenanceMonthlyCapAmount: ZEN_PRO_NY08_PAID_UP_MAINTENANCE_MONTHLY_CAP,
}

const ZEN_PRO_NY14_CONFIG: ZenProVariantConfig = {
  variant: "ny14",
  code: ZEN_PRO_NY14_PRODUCT_CODE,
  currency: ZEN_PRO_NY14_CURRENCY,
  productVariantId: "alfa_zen_pro_ny14",
  minExtraordinaryPayment: ZEN_PRO_NY14_MIN_EXTRAORDINARY_PAYMENT,
  partialSurrenderFixedFee: ZEN_PRO_NY14_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: ZEN_PRO_NY14_POLICY_ISSUANCE_FEE_AMOUNT,
  riskAccidentalDeathBenefit: ZEN_PRO_NY14_RISK_ACCIDENTAL_DEATH_BENEFIT,
  paidUpMaintenanceMonthlyCapAmount: ZEN_PRO_NY14_PAID_UP_MAINTENANCE_MONTHLY_CAP,
}

const ZEN_PRO_NY24_CONFIG: ZenProVariantConfig = {
  variant: "ny24",
  code: ZEN_PRO_NY24_PRODUCT_CODE,
  currency: ZEN_PRO_NY24_CURRENCY,
  productVariantId: "alfa_zen_pro_ny24",
  minExtraordinaryPayment: ZEN_PRO_NY24_MIN_EXTRAORDINARY_PAYMENT,
  partialSurrenderFixedFee: ZEN_PRO_NY24_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: ZEN_PRO_NY24_POLICY_ISSUANCE_FEE_AMOUNT,
  riskAccidentalDeathBenefit: ZEN_PRO_NY24_RISK_ACCIDENTAL_DEATH_BENEFIT,
  paidUpMaintenanceMonthlyCapAmount: ZEN_PRO_NY24_PAID_UP_MAINTENANCE_MONTHLY_CAP,
}

export function toZenProProductVariantId(
  variant: ZenProVariant,
): "alfa_zen_pro_ny08" | "alfa_zen_pro_ny14" | "alfa_zen_pro_ny24" {
  if (variant === "ny24") return "alfa_zen_pro_ny24"
  return variant === "ny14" ? "alfa_zen_pro_ny14" : "alfa_zen_pro_ny08"
}

export function resolveZenProVariant(productVariant?: string, currency?: string): ZenProVariant {
  const normalizedVariant = (productVariant ?? "").toLowerCase()
  if (normalizedVariant.includes("ny24")) return "ny24"
  if (normalizedVariant.includes("ny14")) return "ny14"
  if (normalizedVariant.includes("ny08")) return "ny08"
  if (currency === "USD") return "ny24"
  return currency === "EUR" ? "ny14" : "ny08"
}

export function getZenProVariantConfig(productVariant?: string, currency?: string): ZenProVariantConfig {
  const variant = resolveZenProVariant(productVariant, currency)
  if (variant === "ny24") return ZEN_PRO_NY24_CONFIG
  return variant === "ny14" ? ZEN_PRO_NY14_CONFIG : ZEN_PRO_NY08_CONFIG
}

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(ZEN_PRO_MAX_DURATION_YEARS, Math.max(ZEN_PRO_MIN_DURATION_YEARS, rounded))
}

export function estimateZenProDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveZenProMinimumAnnualPayment(
  durationYears: number,
  variantOrConfig?: ZenProVariant | ZenProVariantConfig,
): number {
  const safeDuration = normalizeDurationYears(durationYears)
  const variant = typeof variantOrConfig === "string" ? variantOrConfig : variantOrConfig?.variant
  if (variant === "ny14" || variant === "ny24") {
    if (safeDuration <= 14) return 1_200
    if (safeDuration <= 19) return 900
    return 600
  }
  return safeDuration <= 14 ? 300_000 : 210_000
}

export function buildZenProInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration === 10) return { 1: 55, 2: 15, 3: 10 }
  if (safeDuration === 11) return { 1: 60, 2: 20, 3: 10 }
  if (safeDuration === 12) return { 1: 65, 2: 25, 3: 10 }
  if (safeDuration === 13) return { 1: 70, 2: 25, 3: 10 }
  if (safeDuration === 14) return { 1: 75, 2: 30, 3: 10 }
  return { 1: 75, 2: 42, 3: 15 }
}

export function buildZenProInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = 100
  }
  return out
}

export function buildZenProRedemptionSchedule(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 2) out[year] = 3.5
    else if (year <= 8) out[year] = 1.95
    else if (year <= 15) out[year] = 1.5
    else out[year] = 0
  }
  return out
}

function resolveZenProBonusMilestones(
  durationYears: number,
  variant: ZenProVariant,
): Array<{ year: number; percent: number }> {
  const safeDuration = normalizeDurationYears(durationYears)
  const maturityPreAnniversary = Math.max(1, safeDuration - 1)
  if (variant === "ny14" || variant === "ny24") {
    if (safeDuration <= 11) return [{ year: 7, percent: 90 }]
    if (safeDuration === 12) return [{ year: 8, percent: 90 }]
    if (safeDuration <= 14) return [{ year: 9, percent: 90 }]
    if (safeDuration <= 19) return [{ year: 10, percent: 115 }, { year: maturityPreAnniversary, percent: 35 }]
    return [{ year: 10, percent: 70 }, { year: 15, percent: 70 }, { year: maturityPreAnniversary, percent: 70 }]
  }
  if (safeDuration === 10) return [{ year: 7, percent: 30 }, { year: maturityPreAnniversary, percent: 50 }]
  if (safeDuration === 11) return [{ year: 7, percent: 40 }, { year: maturityPreAnniversary, percent: 40 }]
  if (safeDuration === 12) return [{ year: 8, percent: 50 }, { year: maturityPreAnniversary, percent: 30 }]
  if (safeDuration <= 14) return [{ year: 9, percent: 60 }, { year: maturityPreAnniversary, percent: 20 }]
  if (safeDuration <= 19) return [{ year: 10, percent: 60 }, { year: maturityPreAnniversary, percent: 70 }]
  return [{ year: 10, percent: 60 }, { year: maturityPreAnniversary, percent: 130 }]
}

function resolveZenProBonusPauseMultiplier(pausedMonths: number): number {
  if (!ZEN_PRO_ENABLE_BONUS_PAUSE_MULTIPLIER) return 1
  if (pausedMonths <= 0) return 1
  // TODO(NY08): Replace with insurer-provided pause multiplier table.
  return Math.max(0, 1 - pausedMonths / 100)
}

function computeAnnualizedMinimumBasePremium(
  yearlyPaymentsPlan: number[],
  horizonYears: number,
): number {
  let minMonthly = Number.POSITIVE_INFINITY
  for (let year = 1; year <= horizonYears; year++) {
    const yearly = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const monthly = yearly / 12
    if (monthly > 0 && monthly < minMonthly) {
      minMonthly = monthly
    }
  }
  if (!Number.isFinite(minMonthly) || minMonthly <= 0) return 0
  return minMonthly * 12
}

function isZenProBonusEligibleUntilYear(inputs: InputsDaily, milestoneYear: number): boolean {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  for (let year = 1; year <= milestoneYear; year++) {
    if ((yearlyPayments[year] ?? 0) <= 0) return false
    if ((yearlyWithdrawals[year] ?? 0) > 0) return false
  }
  return true
}

export function buildZenProBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  options?: { pausedMonths?: number; variant?: ZenProVariant | ZenProVariantConfig },
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const explicitVariant =
    typeof options?.variant === "string" ? options.variant : options?.variant?.variant
  const variant = explicitVariant ?? resolveZenProVariant(inputs.productVariant, inputs.currency)
  const milestones = resolveZenProBonusMilestones(safeDuration, variant)
  const pausedMonths = Math.max(0, Math.round(options?.pausedMonths ?? 0))
  const pauseMultiplier = resolveZenProBonusPauseMultiplier(pausedMonths)

  const out: Record<number, number> = {}
  for (const milestone of milestones) {
    if (!isZenProBonusEligibleUntilYear(inputs, milestone.year)) continue
    const annualizedBase = computeAnnualizedMinimumBasePremium(inputs.yearlyPaymentsPlan ?? [], milestone.year)
    if (annualizedBase <= 0) continue
    out[milestone.year] = (out[milestone.year] ?? 0) + annualizedBase * (milestone.percent / 100) * pauseMultiplier
  }
  return out
}

export function resolveZenProTaxCreditCapPerYear(
  variantOrConfig: ZenProVariant | ZenProVariantConfig,
  eurToHufRate?: number,
  usdToHufRate?: number,
): number {
  const variant = typeof variantOrConfig === "string" ? variantOrConfig : variantOrConfig.variant
  if (variant === "ny14") {
    const fxRate =
      eurToHufRate && eurToHufRate > 0
        ? eurToHufRate
        : ZEN_PRO_NY14_TAX_CREDIT_CAP_FALLBACK_EUR_TO_HUF_RATE
    return ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF / fxRate
  }
  if (variant === "ny24") {
    const fxRate =
      usdToHufRate && usdToHufRate > 0
        ? usdToHufRate
        : ZEN_PRO_NY24_TAX_CREDIT_CAP_FALLBACK_USD_TO_HUF_RATE
    return ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF / fxRate
  }
  return ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF
}

// Legacy NY-08 exports kept for backwards compatibility inside the app.
export const ZEN_PRO_PRODUCT_CODE = ZEN_PRO_NY08_PRODUCT_CODE
export const ZEN_PRO_CURRENCY = ZEN_PRO_NY08_CURRENCY
export const ZEN_PRO_MIN_EXTRAORDINARY_PAYMENT = ZEN_PRO_NY08_MIN_EXTRAORDINARY_PAYMENT
export const ZEN_PRO_PARTIAL_SURRENDER_FIXED_FEE = ZEN_PRO_NY08_PARTIAL_SURRENDER_FIXED_FEE
export const ZEN_PRO_POLICY_ISSUANCE_FEE_AMOUNT = ZEN_PRO_NY08_POLICY_ISSUANCE_FEE_AMOUNT
export const ZEN_PRO_RISK_ACCIDENTAL_DEATH_BENEFIT = ZEN_PRO_NY08_RISK_ACCIDENTAL_DEATH_BENEFIT
export const ZEN_PRO_TAX_CREDIT_CAP_PER_YEAR = ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF
export const ZEN_PRO_PAID_UP_MAINTENANCE_MONTHLY_CAP = ZEN_PRO_NY08_PAID_UP_MAINTENANCE_MONTHLY_CAP

