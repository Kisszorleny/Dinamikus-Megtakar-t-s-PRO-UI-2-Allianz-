import type { InputsDaily } from "../calculate-results-daily"

export const CIG_NYUGDIJKOTVENYE_PRODUCT_CODE = "NyugdijkotvenyE" as const
export const CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT = "cig_nyugdijkotvenye_nyugdij" as const
export const CIG_NYUGDIJKOTVENYE_CURRENCY = "HUF" as const

export const CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS = 10
export const CIG_NYUGDIJKOTVENYE_MAX_DURATION_YEARS = 85
export const CIG_NYUGDIJKOTVENYE_MIN_ANNUAL_PAYMENT = 150_000

export const CIG_NYUGDIJKOTVENYE_MIN_EXTRAORDINARY_PAYMENT = 10_000
export const CIG_NYUGDIJKOTVENYE_MIN_REGULAR_WITHDRAWAL_MONTHLY = 15_000
export const CIG_NYUGDIJKOTVENYE_MIN_BALANCE_AFTER_PARTIAL_SURRENDER = 100_000

export const CIG_NYUGDIJKOTVENYE_PAID_UP_MAINTENANCE_MONTHLY_AMOUNT = 500
export const CIG_NYUGDIJKOTVENYE_LIQUIDITY_PLUS_ANNUAL_FEE = 5_000

export const CIG_NYUGDIJKOTVENYE_EXTRA_TAX_ELIGIBLE_QUARTERLY_MANAGEMENT_PERCENT = 0.25
export const CIG_NYUGDIJKOTVENYE_EXTRA_LIQUIDITY_QUARTERLY_MANAGEMENT_PERCENT = 0.25

export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_REGULAR_PERCENT = 0.3
export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_REGULAR_MIN = 300
export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_REGULAR_MAX = 3_000
export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_LIQUIDITY_PERCENT = 0.2
export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_LIQUIDITY_MIN = 200
export const CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_LIQUIDITY_MAX = 2_000

export const CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT = 20
export const CIG_NYUGDIJKOTVENYE_TAX_CREDIT_CAP_HUF = 130_000
export const CIG_NYUGDIJKOTVENYE_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT = 120

export const CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_YEAR7_PERCENT = 70
export const CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_FROM_YEAR8_ANNUAL_PERCENT = 1

export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_LIQUIDITY_PRO_ANNUAL_PERCENT = 1.46
export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_HAZAI_TOP_VALLALATOK_PRO_ANNUAL_PERCENT = 1.22
export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_TOKEVEDETT_PRO_ANNUAL_PERCENT = 1.30
export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_HAZAI_PRO_VEGYES_ANNUAL_PERCENT = 1.548
export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_KELET_EUROPAI_PRO_RESZVENY_ANNUAL_PERCENT = 1.824
export const CIG_NYUGDIJKOTVENYE_ASSET_FEE_DEFAULT_ANNUAL_PERCENT = 1.98

export const CIG_NYUGDIJKOTVENYE_STRICT_UNSPECIFIED_RULES = true
export const CIG_NYUGDIJKOTVENYE_ENABLE_AGE_BASED_RISK_FEE_TABLE = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_DEPOSIT_PAYMENT_METHOD_FEES = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_SWITCH_FEE_TRACKING = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_PAYOUT_POSTAL_FEE = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_MANAGEMENT_FEES = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_LIQUIDITY_PLUS_ANNUAL_FEE = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_BONUS_STRICT_ELIGIBILITY_FLAGS = false
export const CIG_NYUGDIJKOTVENYE_ENABLE_PARTIAL_SURRENDER_PERCENT_FEES = false

function normalizeDurationYears(durationYears: number): number {
  const rounded = Math.max(1, Math.round(durationYears))
  return Math.min(CIG_NYUGDIJKOTVENYE_MAX_DURATION_YEARS, Math.max(CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS, rounded))
}

export function estimateCigNyugdijkotvenyeDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12))
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365))
}

export function resolveCigNyugdijkotvenyeAssetFeeAnnualPercent(selectedFundId?: string | null): number {
  const normalized = (selectedFundId ?? "").toUpperCase()
  if (normalized.includes("LIKVIDITASI_PRO") || normalized.includes("LIKVIDITASI PRO")) {
    return CIG_NYUGDIJKOTVENYE_ASSET_FEE_LIQUIDITY_PRO_ANNUAL_PERCENT
  }
  if (normalized.includes("HAZAI_TOP_VALLALATOK_PRO") || normalized.includes("HAZAI TOP VALLALATOK PRO")) {
    return CIG_NYUGDIJKOTVENYE_ASSET_FEE_HAZAI_TOP_VALLALATOK_PRO_ANNUAL_PERCENT
  }
  if (normalized.includes("TOKEVEDETT_PRO_2030") || normalized.includes("TOKEVEDETT_PRO_2034") || normalized.includes("TOKEVEDETT_PRO_2041")) {
    return CIG_NYUGDIJKOTVENYE_ASSET_FEE_TOKEVEDETT_PRO_ANNUAL_PERCENT
  }
  if (normalized.includes("HAZAI_PRO_VEGYES") || normalized.includes("HAZAI PRO VEGYES")) {
    return CIG_NYUGDIJKOTVENYE_ASSET_FEE_HAZAI_PRO_VEGYES_ANNUAL_PERCENT
  }
  if (normalized.includes("KELET_EUROPAI_PRO_RESZVENY") || normalized.includes("KELET EUROPAI PRO RESZVENY")) {
    return CIG_NYUGDIJKOTVENYE_ASSET_FEE_KELET_EUROPAI_PRO_RESZVENY_ANNUAL_PERCENT
  }
  return CIG_NYUGDIJKOTVENYE_ASSET_FEE_DEFAULT_ANNUAL_PERCENT
}

export function buildCigNyugdijkotvenyeInitialCostByYear(durationYears: number): Record<number, number> {
  const safeDuration = Math.max(8, normalizeDurationYears(durationYears))
  if (safeDuration <= 10) return { 1: 18, 2: 10, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 }
  if (safeDuration === 11) return { 1: 18, 2: 18, 3: 47, 4: 0, 5: 0, 6: 0, 7: 0 }
  if (safeDuration === 12) return { 1: 18, 2: 18, 3: 47, 4: 78, 5: 7, 6: 0, 7: 0 }
  if (safeDuration === 13) return { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 11, 7: 0 }
  if (safeDuration === 14) return { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 18, 7: 16 }
  return { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 18, 7: 47 }
}

export function buildCigNyugdijkotvenyeInvestedShareByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 100
  return out
}

export function buildCigNyugdijkotvenyeRedemptionFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) out[year] = 0
  return out
}

function hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs: InputsDaily, endYear: number): boolean {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []
  for (let year = 1; year <= endYear; year++) {
    if ((yearlyPayments[year] ?? 0) <= 0) return false
    if ((yearlyWithdrawals[year] ?? 0) > 0) return false
  }
  return true
}

export function buildCigNyugdijkotvenyeBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}

  if (safeDuration >= 7 && hasContinuousPaymentsWithoutMainAccountWithdrawals(inputs, 7)) {
    const firstYearPayment = Math.max(0, inputs.yearlyPaymentsPlan?.[1] ?? 0)
    if (firstYearPayment > 0) {
      out[7] = firstYearPayment * (CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_YEAR7_PERCENT / 100)
    }
  }
  return out
}

export function buildCigNyugdijkotvenyeBonusPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears)
  const out: Record<number, number> = {}
  for (let year = 8; year <= safeDuration; year++) {
    out[year] = CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_FROM_YEAR8_ANNUAL_PERCENT
  }
  return out
}

export function resolveCigNyugdijkotvenyeTaxCreditCapPerYear(): number {
  return CIG_NYUGDIJKOTVENYE_TAX_CREDIT_CAP_HUF
}
