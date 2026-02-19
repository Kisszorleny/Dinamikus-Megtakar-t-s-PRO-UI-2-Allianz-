import type { Currency, InputsDaily } from "../calculate-results-daily"

export type AlfaJadeVariant = "tr19" | "tr29"

export interface AlfaJadeVariantConfig {
  variant: AlfaJadeVariant
  code: "TR19" | "TR29"
  currency: Currency
  defaultDurationYears: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
  riskMonthlyFeeAmount: number
  riskBenefitAccidentalDeath: number
  regularAdminFeePercent: number
  extraordinaryAdminFeePercent: number
  accountMaintenanceMonthlyPercent: number
  accountMaintenanceClientStartMonth: number
  accountMaintenanceInvestedStartMonth: number
  accountMaintenanceExtraStartMonth: number
  partialSurrenderFixedFeeAmount: number
  bonusPercentByYear: Record<number, number>
}

const TR19_CONFIG: AlfaJadeVariantConfig = {
  variant: "tr19",
  code: "TR19",
  currency: "EUR",
  defaultDurationYears: 15,
  minAnnualPayment: 1_200,
  minExtraordinaryPayment: 500,
  riskMonthlyFeeAmount: 1,
  riskBenefitAccidentalDeath: 6_000,
  regularAdminFeePercent: 2,
  extraordinaryAdminFeePercent: 2,
  accountMaintenanceMonthlyPercent: 0.165,
  accountMaintenanceClientStartMonth: 37,
  accountMaintenanceInvestedStartMonth: 1,
  accountMaintenanceExtraStartMonth: 1,
  partialSurrenderFixedFeeAmount: 10,
  bonusPercentByYear: { 10: 70, 15: 30 },
}

const TR29_CONFIG: AlfaJadeVariantConfig = {
  variant: "tr29",
  code: "TR29",
  currency: "USD",
  defaultDurationYears: 15,
  minAnnualPayment: 1_200,
  minExtraordinaryPayment: 500,
  riskMonthlyFeeAmount: 1,
  riskBenefitAccidentalDeath: 6_000,
  regularAdminFeePercent: 2,
  extraordinaryAdminFeePercent: 2,
  accountMaintenanceMonthlyPercent: 0.165,
  accountMaintenanceClientStartMonth: 37,
  accountMaintenanceInvestedStartMonth: 1,
  accountMaintenanceExtraStartMonth: 1,
  partialSurrenderFixedFeeAmount: 10,
  bonusPercentByYear: { 10: 70, 15: 30 },
}

export function resolveJadeVariant(productVariant?: string, currency?: Currency): AlfaJadeVariant {
  const normalized = (productVariant ?? "").toLowerCase()
  if (normalized.includes("tr19") || normalized.includes("tr-19")) return "tr19"
  if (normalized.includes("tr29") || normalized.includes("tr-29")) return "tr29"
  if (currency === "USD") return "tr29"
  if (currency === "EUR") return "tr19"
  return "tr19"
}

export function toJadeProductVariantId(variant: AlfaJadeVariant): string {
  if (variant === "tr19") return "alfa_jade_tr19"
  if (variant === "tr29") return "alfa_jade_tr29"
  return "alfa_jade_tr19"
}

export function getJadeVariantConfig(productVariant?: string, currency?: Currency): AlfaJadeVariantConfig {
  const variant = resolveJadeVariant(productVariant, currency)
  if (variant === "tr19") return TR19_CONFIG
  if (variant === "tr29") return TR29_CONFIG
  return TR19_CONFIG
}

export function estimateJadeDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function buildJadeInitialCostByYear(): Record<number, number> {
  return { 1: 75, 2: 45, 3: 15 }
}

export function buildJadeInvestedShareByYear(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  const safeDuration = Math.max(1, durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    if (year === 1) config[year] = 80
    else if (year === 2) config[year] = 50
    else config[year] = 20
  }
  return config
}

export function buildJadeRedemptionSchedule(durationYears: number): Record<number, number> {
  const schedule: Record<number, number> = {}
  const safeDuration = Math.max(1, durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    if (year <= 10) schedule[year] = 100
    else if (year <= 15) schedule[year] = 20
    else schedule[year] = 0
  }
  return schedule
}

export function isJadeBonusEligible(yearlyPaymentsPlan: number[], durationYears: number): boolean {
  const horizon = Math.max(1, Math.min(durationYears, TR19_CONFIG.defaultDurationYears))
  for (let year = 1; year <= horizon; year++) {
    const value = yearlyPaymentsPlan[year] ?? 0
    if (value <= 0) return false
  }
  return true
}

export function buildJadeBonusAmountByYear(
  yearlyPaymentsPlan: number[],
  durationYears: number,
  productVariant?: string,
  currency?: Currency,
): Record<number, number> {
  const variantConfig = getJadeVariantConfig(productVariant, currency)
  if (!isJadeBonusEligible(yearlyPaymentsPlan, durationYears)) return {}
  const horizon = Math.max(1, Math.min(durationYears, variantConfig.defaultDurationYears))
  let minMonthlyPremium = Number.POSITIVE_INFINITY
  for (let year = 1; year <= horizon; year++) {
    const yearly = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    const monthlyEquivalent = yearly / 12
    if (monthlyEquivalent > 0 && monthlyEquivalent < minMonthlyPremium) {
      minMonthlyPremium = monthlyEquivalent
    }
  }
  if (!Number.isFinite(minMonthlyPremium) || minMonthlyPremium <= 0) return {}
  const annualizedMin = minMonthlyPremium * 12
  return {
    10: annualizedMin * ((variantConfig.bonusPercentByYear[10] ?? 0) / 100),
    15: annualizedMin * ((variantConfig.bonusPercentByYear[15] ?? 0) / 100),
  }
}
