import type { Currency, InputsDaily } from "../calculate-results-daily"

export type AlfaFortisVariant = "wl02" | "wl12" | "wl22"

export interface AlfaFortisVariantConfig {
  variant: AlfaFortisVariant
  code: "WL-02" | "WL-12" | "WL-22"
  minAnnualPayment: number
  minExtraordinaryPayment: number
  partialSurrenderFixedFee: number
  policyFeeAnnualAmount: number
  maxMaintenanceFeeMonthlyAmount: number
  riskBenefitAccidentalDeath: number
  riskPremiumUnitAmount: number
  accountMaintenanceMonthlyPercent: number
  accountMaintenanceStartMonthMain: number
  accountMaintenanceStartMonthExtra: number
  eurMoneyMarketReducedMaintenancePercent?: number
  usdMoneyMarketReducedMaintenancePercent?: number
  vakPercentByFundClass: {
    equityOrMixed: number
    bondOrMoneyMarket: number
    europeanEquityOrInternationalBond?: number
    internationalMoneyMarket?: number
  }
  minBalanceAfterPartialSurrender: number
  minPaidUpValue: number
  bonusPercentByYear: Record<number, number>
}

const WL02_CONFIG: AlfaFortisVariantConfig = {
  variant: "wl02",
  code: "WL-02",
  minAnnualPayment: 300_000,
  minExtraordinaryPayment: 50_000,
  partialSurrenderFixedFee: 2_500,
  policyFeeAnnualAmount: 14_000,
  maxMaintenanceFeeMonthlyAmount: 1_000,
  riskBenefitAccidentalDeath: 1_000_000,
  riskPremiumUnitAmount: 100_000,
  accountMaintenanceMonthlyPercent: 0.165,
  accountMaintenanceStartMonthMain: 37,
  accountMaintenanceStartMonthExtra: 1,
  vakPercentByFundClass: {
    equityOrMixed: 1.95,
    bondOrMoneyMarket: 0.6,
  },
  minBalanceAfterPartialSurrender: 100_000,
  minPaidUpValue: 80_000,
  bonusPercentByYear: { 8: 70, 15: 45, 20: 60 },
}

const WL12_CONFIG: AlfaFortisVariantConfig = {
  variant: "wl12",
  code: "WL-12",
  minAnnualPayment: 1_200,
  minExtraordinaryPayment: 200,
  partialSurrenderFixedFee: 10,
  policyFeeAnnualAmount: 40,
  maxMaintenanceFeeMonthlyAmount: 5,
  riskBenefitAccidentalDeath: 5_000,
  riskPremiumUnitAmount: 1_000,
  accountMaintenanceMonthlyPercent: 0.165,
  accountMaintenanceStartMonthMain: 37,
  accountMaintenanceStartMonthExtra: 1,
  eurMoneyMarketReducedMaintenancePercent: 0.03,
  vakPercentByFundClass: {
    equityOrMixed: 1.95,
    bondOrMoneyMarket: 0.6,
    europeanEquityOrInternationalBond: 0.6,
    internationalMoneyMarket: 0.53,
  },
  minBalanceAfterPartialSurrender: 400,
  minPaidUpValue: 200,
  bonusPercentByYear: { 8: 125, 15: 0, 20: 50 },
}

const WL22_CONFIG: AlfaFortisVariantConfig = {
  variant: "wl22",
  code: "WL-22",
  minAnnualPayment: 1_200,
  minExtraordinaryPayment: 200,
  partialSurrenderFixedFee: 10,
  policyFeeAnnualAmount: 40,
  maxMaintenanceFeeMonthlyAmount: 5,
  riskBenefitAccidentalDeath: 5_000,
  riskPremiumUnitAmount: 1_000,
  accountMaintenanceMonthlyPercent: 0.165,
  accountMaintenanceStartMonthMain: 37,
  accountMaintenanceStartMonthExtra: 1,
  usdMoneyMarketReducedMaintenancePercent: 0.13,
  vakPercentByFundClass: {
    equityOrMixed: 1.95,
    bondOrMoneyMarket: 0.6,
    europeanEquityOrInternationalBond: 0.6,
    internationalMoneyMarket: 0.39,
  },
  minBalanceAfterPartialSurrender: 400,
  minPaidUpValue: 200,
  bonusPercentByYear: { 8: 125, 15: 0, 20: 50 },
}

export const FORTIS_MIN_ANNUAL_PAYMENT = WL02_CONFIG.minAnnualPayment
export const FORTIS_MIN_EXTRAORDINARY_PAYMENT = WL02_CONFIG.minExtraordinaryPayment
export const FORTIS_MIN_ENTRY_AGE = 16
export const FORTIS_MAX_ENTRY_AGE = 70

export function estimateFortisDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function resolveFortisVariant(productVariant?: string, currency?: Currency): AlfaFortisVariant {
  const normalized = (productVariant ?? "").toLowerCase()
  if (normalized.includes("wl12") || normalized.includes("wl-12")) return "wl12"
  if (normalized.includes("wl22") || normalized.includes("wl-22")) return "wl22"
  if (normalized.includes("wl02") || normalized.includes("wl-02")) return "wl02"

  if (currency === "EUR") return "wl12"
  if (currency === "USD") return "wl22"
  return "wl02"
}

export function toFortisProductVariantId(variant: AlfaFortisVariant): string {
  if (variant === "wl12") return "alfa_fortis_wl12"
  if (variant === "wl22") return "alfa_fortis_wl22"
  return "alfa_fortis_wl02"
}

export function getFortisVariantConfig(productVariant?: string, currency?: Currency): AlfaFortisVariantConfig {
  const variant = resolveFortisVariant(productVariant, currency)
  if (variant === "wl12") return WL12_CONFIG
  if (variant === "wl22") return WL22_CONFIG
  return WL02_CONFIG
}

export function buildFortisInitialCostByYear(): Record<number, number> {
  return { 1: 75, 2: 42, 3: 15 }
}

export function buildFortisRedemptionSchedule(durationYears: number): Record<number, number> {
  const schedule: Record<number, number> = {}
  const safeDuration = Math.max(1, durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) schedule[year] = 100
    else if (year === 2) schedule[year] = 3.5
    else if (year >= 3 && year <= 8) schedule[year] = 1.95
    else if (year >= 9 && year <= 15) schedule[year] = 1.5
    else schedule[year] = 0
  }
  return schedule
}

export function buildFortisBonusAmountByYear(
  minAnnualizedContribution: number,
  variant: AlfaFortisVariant = "wl02",
): Record<number, number> {
  if (minAnnualizedContribution <= 0) return {}
  const bonusByYear = getFortisVariantConfig(toFortisProductVariantId(variant)).bonusPercentByYear
  const year8 = bonusByYear[8] ?? 0
  const year15 = bonusByYear[15] ?? 0
  const year20 = bonusByYear[20] ?? 0
  return {
    8: minAnnualizedContribution * (year8 / 100),
    15: minAnnualizedContribution * (year15 / 100),
    20: minAnnualizedContribution * (year20 / 100),
  }
}

export function buildFortisBonusPercentByYear(variant: AlfaFortisVariant = "wl02"): Record<number, number> {
  return { ...getFortisVariantConfig(toFortisProductVariantId(variant)).bonusPercentByYear }
}

export const FORTIS_EUR_MONEY_MARKET_FUND_IDS = ["ALFA_INT_MM_EUR", "NPE"] as const
export const FORTIS_USD_MONEY_MARKET_FUND_IDS = ["ALFA_INT_MM_USD"] as const

export function isFortisEurMoneyMarketFund(selectedFundId?: string | null): boolean {
  if (!selectedFundId) return false
  return FORTIS_EUR_MONEY_MARKET_FUND_IDS.includes(selectedFundId as (typeof FORTIS_EUR_MONEY_MARKET_FUND_IDS)[number])
}

export function isFortisUsdMoneyMarketFund(selectedFundId?: string | null): boolean {
  if (!selectedFundId) return false
  return FORTIS_USD_MONEY_MARKET_FUND_IDS.includes(selectedFundId as (typeof FORTIS_USD_MONEY_MARKET_FUND_IDS)[number])
}

