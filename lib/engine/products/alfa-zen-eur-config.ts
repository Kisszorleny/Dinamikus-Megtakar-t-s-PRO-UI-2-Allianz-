import type { InputsDaily } from "../calculate-results-daily"
import {
  ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER,
  ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE,
  ALFA_ZEN_ENABLE_PROVISIONAL_INITIAL_COST_CURVE,
  ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ALFA_ZEN_MAX_DURATION_YEARS,
  ALFA_ZEN_MIN_DURATION_YEARS,
  ALFA_ZEN_MIN_EXTRAORDINARY_PAYMENT,
  ALFA_ZEN_NY13_MONEY_MARKET_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  ALFA_ZEN_NY13_PRODUCT_CODE,
  ALFA_ZEN_PARTIAL_SURRENDER_FIXED_FEE,
  ALFA_ZEN_POLICY_ISSUANCE_CANCELLATION_WINDOW_DAYS,
  ALFA_ZEN_POLICY_ISSUANCE_FEE_AMOUNT,
  ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT,
  ALFA_ZEN_RISK_ACCIDENTAL_DEATH_BENEFIT,
  ALFA_ZEN_RISK_ANNUAL_FEE,
  ALFA_ZEN_RISK_COVERAGE_END_YEAR,
  ALFA_ZEN_RISK_COVERAGE_START_YEAR,
  ALFA_ZEN_STRICT_UNSPECIFIED_RULES,
  ALFA_ZEN_TAX_CREDIT_CAP_HUF,
  ALFA_ZEN_TAX_CREDIT_RATE_PERCENT,
  buildAlfaZenBonusAmountByYear,
  buildAlfaZenInitialCostByYear,
  buildAlfaZenInvestedShareByYear,
  buildAlfaZenRedemptionSchedule,
  estimateAlfaZenDurationYears,
  getAlfaZenVariantConfig,
  resolveAlfaZenAccountMaintenanceMonthlyPercent,
  resolveAlfaZenMinimumAnnualPayment,
  resolveAlfaZenTaxCreditCapPerYear,
} from "./alfa-zen-config"

export const NY13_PRODUCT_CODE = ALFA_ZEN_NY13_PRODUCT_CODE
export const NY13_CURRENCY = "EUR" as const
export const NY13_MIN_DURATION_YEARS = ALFA_ZEN_MIN_DURATION_YEARS
export const NY13_MAX_DURATION_YEARS = ALFA_ZEN_MAX_DURATION_YEARS
export const NY13_MIN_EXTRAORDINARY_PAYMENT = ALFA_ZEN_MIN_EXTRAORDINARY_PAYMENT
export const NY13_REGULAR_ADMIN_FEE_PERCENT = ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT
export const NY13_EXTRAORDINARY_ADMIN_FEE_PERCENT = ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT
export const NY13_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.165
export const NY13_MONEY_MARKET_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = ALFA_ZEN_NY13_MONEY_MARKET_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
export const NY13_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
export const NY13_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
export const NY13_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH = ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
export const NY13_PARTIAL_SURRENDER_FIXED_FEE = ALFA_ZEN_PARTIAL_SURRENDER_FIXED_FEE
export const NY13_POLICY_ISSUANCE_FEE_AMOUNT = ALFA_ZEN_POLICY_ISSUANCE_FEE_AMOUNT
export const NY13_POLICY_ISSUANCE_CANCELLATION_WINDOW_DAYS = ALFA_ZEN_POLICY_ISSUANCE_CANCELLATION_WINDOW_DAYS
export const NY13_RISK_ACCIDENTAL_DEATH_BENEFIT = ALFA_ZEN_RISK_ACCIDENTAL_DEATH_BENEFIT
export const NY13_RISK_ANNUAL_FEE = ALFA_ZEN_RISK_ANNUAL_FEE
export const NY13_RISK_COVERAGE_START_YEAR = ALFA_ZEN_RISK_COVERAGE_START_YEAR
export const NY13_RISK_COVERAGE_END_YEAR = ALFA_ZEN_RISK_COVERAGE_END_YEAR
export const NY13_TAX_CREDIT_RATE_PERCENT = ALFA_ZEN_TAX_CREDIT_RATE_PERCENT
export const NY13_TAX_CREDIT_CAP_HUF = ALFA_ZEN_TAX_CREDIT_CAP_HUF
export const NY13_STRICT_UNSPECIFIED_RULES = ALFA_ZEN_STRICT_UNSPECIFIED_RULES
export const NY13_ENABLE_PROVISIONAL_INITIAL_COST_CURVE = ALFA_ZEN_ENABLE_PROVISIONAL_INITIAL_COST_CURVE
export const NY13_ENABLE_BONUS_PAUSE_MULTIPLIER = ALFA_ZEN_ENABLE_BONUS_PAUSE_MULTIPLIER
export const NY13_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE = ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE

export function estimateNy13DurationYears(inputs: InputsDaily): number {
  return estimateAlfaZenDurationYears(inputs)
}

export function resolveNy13MinimumAnnualPayment(durationYears: number): number {
  return resolveAlfaZenMinimumAnnualPayment(durationYears)
}

export function buildNy13InitialCostByYear(durationYears: number): Record<number, number> {
  return buildAlfaZenInitialCostByYear(durationYears)
}

export function buildNy13InvestedShareByYear(durationYears: number): Record<number, number> {
  return buildAlfaZenInvestedShareByYear(durationYears)
}

export function buildNy13RedemptionSchedule(durationYears: number): Record<number, number> {
  return buildAlfaZenRedemptionSchedule(durationYears)
}

export function resolveNy13AccountMaintenanceMonthlyPercent(selectedFundId?: string | null): number {
  const variantConfig = getAlfaZenVariantConfig("alfa_zen_ny13", "EUR")
  return resolveAlfaZenAccountMaintenanceMonthlyPercent(selectedFundId, variantConfig)
}

export function resolveNy13TaxCreditCapPerYear(eurToHufRate: number | undefined): number {
  const variantConfig = getAlfaZenVariantConfig("alfa_zen_ny13", "EUR")
  return resolveAlfaZenTaxCreditCapPerYear(variantConfig, eurToHufRate, undefined)
}

export function buildNy13BonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
  options?: { pausedMonths?: number },
): Record<number, number> {
  return buildAlfaZenBonusAmountByYear(inputs, durationYears, options)
}

