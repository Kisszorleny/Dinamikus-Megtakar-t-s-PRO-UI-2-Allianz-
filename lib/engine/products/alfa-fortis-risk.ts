import type { InputsDaily, RiskFeeResolverContext } from "../calculate-results-daily"
import { getFortisVariantConfig } from "./alfa-fortis-config"

type RiskRateByAge = Record<number, number>

const FORTIS_DEATH_RATE_BY_AGE: RiskRateByAge = {
  18: 36,
  25: 44,
  30: 53,
  35: 69,
  38: 82,
  40: 91,
  45: 121,
  50: 168,
  55: 243,
  60: 365,
  65: 576,
  70: 901,
}

const FOREIGN_CURRENCY_RISK_SCALER = 1.73 / 69
const FORTIS_FOREIGN_CURRENCY_DEATH_RATE_BY_AGE: RiskRateByAge = Object.fromEntries(
  Object.entries(FORTIS_DEATH_RATE_BY_AGE).map(([age, rate]) => [
    Number(age),
    Number((rate * FOREIGN_CURRENCY_RISK_SCALER).toFixed(2)),
  ]),
) as RiskRateByAge

function closestKey(target: number, values: number[]): number {
  return values.reduce((best, value) => (Math.abs(value - target) < Math.abs(best - target) ? value : best), values[0] ?? 0)
}

function resolveAgeRate(age: number, table: RiskRateByAge): number {
  const keys = Object.keys(table)
    .map(Number)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b)
  if (keys.length === 0) return 0
  const nearestAge = closestKey(age, keys)
  return table[nearestAge] ?? 0
}

export function createAlfaFortisRiskFeeResolver(
  inputs: InputsDaily,
): ((context: RiskFeeResolverContext) => number) | undefined {
  const variantConfig = getFortisVariantConfig(inputs.productVariant, inputs.currency)
  const deathBenefit = Math.max(0, inputs.riskInsuranceDeathBenefitAmount ?? variantConfig.riskBenefitAccidentalDeath)
  if (deathBenefit <= 0) return undefined

  return (context: RiskFeeResolverContext): number => {
    const currentAge = context.insuredEntryAge + Math.max(0, context.currentYear - 1)
    const deathRateTable =
      variantConfig.variant === "wl12" || variantConfig.variant === "wl22"
        ? FORTIS_FOREIGN_CURRENCY_DEATH_RATE_BY_AGE
        : FORTIS_DEATH_RATE_BY_AGE
    const ratePerUnit = resolveAgeRate(currentAge, deathRateTable)
    const monthlyFee = (deathBenefit / variantConfig.riskPremiumUnitAmount) * ratePerUnit
    return monthlyFee * context.monthsBetweenPayments
  }
}

