import type { Currency, InputsDaily } from "../calculate-results-daily"

export type AlfaZenVariant = "ny13" | "ny23"

export const ALFA_ZEN_NY13_PRODUCT_CODE = "NY13"
export const ALFA_ZEN_NY23_PRODUCT_CODE = "NY23"
export const ALFA_ZEN_PRODUCT_VARIANT_NY13 = "alfa_zen_ny13"
export const ALFA_ZEN_PRODUCT_VARIANT_NY23 = "alfa_zen_ny23"

export const ALFA_ZEN_MIN_DURATION_YEARS = 1
export const ALFA_ZEN_MAX_DURATION_YEARS = 50
export const ALFA_ZEN_MIN_EXTRAORDINARY_PAYMENT = 200
export const ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT = 2
export const ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT = 0
export const ALFA_ZEN_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.165
export const ALFA_ZEN_NY13_MONEY_MARKET_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.08
export const ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 37
export const ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH = 1
export const ALFA_ZEN_PARTIAL_SURRENDER_FIXED_FEE = 10
export const ALFA_ZEN_POLICY_ISSUANCE_FEE_AMOUNT = 40
export const ALFA_ZEN_POLICY_ISSUANCE_CANCELLATION_WINDOW_DAYS = 30
export const ALFA_ZEN_RISK_ACCIDENTAL_DEATH_BENEFIT = 5_000
export const ALFA_ZEN_RISK_ANNUAL_FEE = 0
export const ALFA_ZEN_RISK_COVERAGE_START_YEAR = 1
export const ALFA_ZEN_RISK_COVERAGE_END_YEAR = 1
export const ALFA_ZEN_TAX_CREDIT_RATE_PERCENT = 20
export const ALFA_ZEN_TAX_CREDIT_CAP_HUF = 130_000

export const ALFA_ZEN_STRICT_UNSPECIFIED_RULES = true
export const ALFA_ZEN_ENABLE_PROVISIONAL_INITIAL_COST_CURVE = true
export const ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER = false
export const ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE = false

export interface AlfaZenVariantConfig {
  variant: AlfaZenVariant
  code: "NY13" | "NY23"
  currency: "EUR" | "USD"
  applyMoneyMarketMaintenanceDiscount: boolean
}

const NY13_CONFIG: AlfaZenVariantConfig = {
  variant: "ny13",
  code: ALFA_ZEN_NY13_PRODUCT_CODE,
  currency: "EUR",
  applyMoneyMarketMaintenanceDiscount: true,
}

const NY23_CONFIG: AlfaZenVariantConfig = {
  variant: "ny23",
  code: ALFA_ZEN_NY23_PRODUCT_CODE,
  currency: "USD",
  applyMoneyMarketMaintenanceDiscount: false,
}

type InitialCostRange = {
  maxDurationYears: number
  year2Percent: number
  year3Percent: number
}

const ALFA_ZEN_PROVISIONAL_INITIAL_COST_RANGES: InitialCostRange[] = [
  { maxDurationYears: 10, year2Percent: 23, year3Percent: 13 },
  { maxDurationYears: 11, year2Percent: 28, year3Percent: 14 },
  { maxDurationYears: 12, year2Percent: 33, year3Percent: 15 },
  { maxDurationYears: 13, year2Percent: 38, year3Percent: 16 },
  { maxDurationYears: 14, year2Percent: 43, year3Percent: 17 },
  { maxDurationYears: Number.POSITIVE_INFINITY, year2Percent: 48, year3Percent: 18 },
]

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(ALFA_ZEN_MAX_DURATION_YEARS, Math.max(ALFA_ZEN_MIN_DURATION_YEARS, rounded))
}

export function resolveAlfaZenVariant(productVariant?: string, currency?: Currency): AlfaZenVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (normalized.includes("ny23") || normalized.includes("ny-23")) return "ny23"
    if (normalized.includes("ny13") || normalized.includes("ny-13")) return "ny13"
  }
  if (currency === "USD") return "ny23"
  return "ny13"
}

export function getAlfaZenVariantConfig(productVariant?: string, currency?: Currency): AlfaZenVariantConfig {
  const variant = resolveAlfaZenVariant(productVariant, currency)
  return variant === "ny23" ? NY23_CONFIG : NY13_CONFIG
}

export function toAlfaZenProductVariantId(variant: AlfaZenVariant): string {
  return variant === "ny23" ? ALFA_ZEN_PRODUCT_VARIANT_NY23 : ALFA_ZEN_PRODUCT_VARIANT_NY13
}

export function estimateAlfaZenDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveAlfaZenMinimumAnnualPayment(durationYears: number): number {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration < 10) return 1_800
  if (safeDuration <= 15) return 1_200
  if (safeDuration <= 20) return 900
  return 600
}

export function buildAlfaZenInitialCostByYear(durationYears: number): Record<number, number> {
  const out: Record<number, number> = { 1: 78 }
  if (!ALFA_ZEN_ENABLE_PROVISIONAL_INITIAL_COST_CURVE) return out
  const safeDuration = normalizeDurationYears(durationYears)
  const matchedRange =
    ALFA_ZEN_PROVISIONAL_INITIAL_COST_RANGES.find((range) => safeDuration <= range.maxDurationYears) ??
    ALFA_ZEN_PROVISIONAL_INITIAL_COST_RANGES[ALFA_ZEN_PROVISIONAL_INITIAL_COST_RANGES.length - 1]
  out[2] = matchedRange.year2Percent
  out[3] = matchedRange.year3Percent
  return out
}

export function buildAlfaZenInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year === 1 ? 80 : year === 2 ? 50 : 20
  }
  return out
}

export function buildAlfaZenRedemptionSchedule(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  const after120MonthsPercent = safeDuration <= 10 ? 100 : 15
  for (let year = 1; year <= safeDuration; year++) {
    out[year] = year <= 10 ? 100 : after120MonthsPercent
  }
  return out
}

export function resolveAlfaZenAccountMaintenanceMonthlyPercent(
  selectedFundId: string | null | undefined,
  variantConfig: AlfaZenVariantConfig,
): number {
  if (!variantConfig.applyMoneyMarketMaintenanceDiscount) {
    return ALFA_ZEN_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  const normalized = (selectedFundId ?? "").trim().toUpperCase()
  if (!normalized) return ALFA_ZEN_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  const isMoneyMarket =
    normalized.includes("PENZPIACI") ||
    normalized.includes("PÉNZPIACI") ||
    normalized.includes("MONEY_MARKET") ||
    normalized.includes("MONEY MARKET") ||
    normalized.endsWith("_MM")
  return isMoneyMarket
    ? ALFA_ZEN_NY13_MONEY_MARKET_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
    : ALFA_ZEN_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
}

export function resolveAlfaZenTaxCreditCapPerYear(
  variantConfig: AlfaZenVariantConfig,
  eurToHufRate: number | undefined,
  usdToHufRate: number | undefined,
): number {
  if (variantConfig.currency === "USD") {
    const rate = Math.max(1e-9, usdToHufRate ?? 360)
    return ALFA_ZEN_TAX_CREDIT_CAP_HUF / rate
  }
  const rate = Math.max(1e-9, eurToHufRate ?? 400)
  return ALFA_ZEN_TAX_CREDIT_CAP_HUF / rate
}

function resolveAlfaZenBonusPauseMultiplier(pausedMonths: number): number {
  if (!ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER) return 1
  if (pausedMonths <= 0) return 1
  if (pausedMonths === 3) return 0.97
  // TODO(ALFA_ZEN): replace fallback when insurer pause multiplier table is provided.
  return Math.max(0, 1 - pausedMonths / 100)
}

function computeAnnualizedMinimumBasePremium(yearlyPaymentsPlan: number[], horizonYears: number): number {
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

function isAlfaZenBonusEligibleUntilYear(inputs: InputsDaily, milestoneYear: number): boolean {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  for (let year = 1; year <= milestoneYear; year++) {
    if ((yearlyPayments[year] ?? 0) <= 0) return false
    if ((yearlyWithdrawals[year] ?? 0) > 0) return false
  }
  return true
}

export function buildAlfaZenBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  options?: { pausedMonths?: number },
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  if (safeDuration < 10) return {}

  const pausedMonths = Math.max(0, Math.round(options?.pausedMonths ?? 0))
  const pauseMultiplier = resolveAlfaZenBonusPauseMultiplier(pausedMonths)
  const annualizedMinimum = computeAnnualizedMinimumBasePremium(inputs.yearlyPaymentsPlan ?? [], safeDuration)
  if (annualizedMinimum <= 0) return {}

  const bonusByYear: Record<number, number> = {}
  if (isAlfaZenBonusEligibleUntilYear(inputs, 10)) {
    const percentAtYear10 = safeDuration <= 15 ? 100 : 50
    bonusByYear[10] = annualizedMinimum * (percentAtYear10 / 100) * pauseMultiplier
  }
  if (safeDuration >= 15 && isAlfaZenBonusEligibleUntilYear(inputs, 15)) {
    bonusByYear[15] = (bonusByYear[15] ?? 0) + annualizedMinimum * pauseMultiplier
  }
  if (safeDuration >= 20) {
    const finalMilestoneYear = Math.max(1, safeDuration - 1)
    if (isAlfaZenBonusEligibleUntilYear(inputs, finalMilestoneYear)) {
      bonusByYear[finalMilestoneYear] = (bonusByYear[finalMilestoneYear] ?? 0) + annualizedMinimum * pauseMultiplier
    }
  }
  return bonusByYear
}

