import type { InputsDaily, RiskFeeResolverContext } from "../calculate-results-daily"

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
  const deathBenefit = Math.max(0, inputs.riskInsuranceDeathBenefitAmount ?? 0)
  if (deathBenefit <= 0) return undefined

  return (context: RiskFeeResolverContext): number => {
    const currentAge = context.insuredEntryAge + Math.max(0, context.currentYear - 1)
    const deathRatePer100k = resolveAgeRate(currentAge, FORTIS_DEATH_RATE_BY_AGE)
    const monthlyFee = (deathBenefit / 100000) * deathRatePer100k
    return monthlyFee * context.monthsBetweenPayments
  }
}

