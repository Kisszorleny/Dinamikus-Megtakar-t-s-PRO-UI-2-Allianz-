import type { InputsDaily, RiskFeeResolverContext } from "../calculate-results-daily"
import type { AlfaExclusivePlusVariant } from "./alfa-exclusive-plus-config"

type RiskRateByAge = Record<number, number>
type RiskRateByTermAndAge = Record<number, RiskRateByAge>

const NY05_DEATH_RATE_BY_AGE: RiskRateByAge = {
  30: 92,
  35: 104,
  38: 118,
  40: 126,
  45: 159,
  50: 212,
  55: 311,
  60: 472,
}

const NY05_DISABILITY_RATE_BY_AGE: RiskRateByAge = {
  30: 31,
  35: 38,
  38: 44,
  40: 49,
  45: 68,
  50: 96,
  55: 147,
  60: 238,
}

const TR08_DEATH_RATE_BY_TERM_AND_AGE: RiskRateByTermAndAge = {
  5: { 30: 42, 35: 48, 38: 53, 40: 58, 45: 78, 50: 116, 55: 190, 60: 330 },
  10: { 30: 56, 35: 64, 38: 71, 40: 77, 45: 98, 50: 141, 55: 220, 60: 364 },
  15: { 30: 67, 35: 77, 38: 84, 40: 91, 45: 115, 50: 162, 55: 248, 60: 396 },
  20: { 30: 76, 35: 86, 38: 95, 40: 102, 45: 127, 50: 177, 55: 266, 60: 412 },
  25: { 30: 83, 35: 95, 38: 110, 40: 117, 45: 141, 50: 192, 55: 280, 60: 428 },
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

function resolveTermAgeRate(age: number, termYears: number, table: RiskRateByTermAndAge): number {
  const termKeys = Object.keys(table)
    .map(Number)
    .filter((v) => Number.isFinite(v))
    .sort((a, b) => a - b)
  if (termKeys.length === 0) return 0
  const nearestTerm = closestKey(termYears, termKeys)
  const ageTable = table[nearestTerm] ?? {}
  return resolveAgeRate(age, ageTable)
}

export function createAlfaExclusivePlusRiskFeeResolver(
  variant: AlfaExclusivePlusVariant,
  inputs: InputsDaily,
): ((context: RiskFeeResolverContext) => number) | undefined {
  const deathBenefit = Math.max(0, inputs.riskInsuranceDeathBenefitAmount ?? 0)
  const disabilityBenefit = Math.max(0, inputs.riskInsuranceDisabilityBenefitAmount ?? 0)
  if (deathBenefit <= 0 && disabilityBenefit <= 0) return undefined

  return (context: RiskFeeResolverContext): number => {
    const currentAge = context.insuredEntryAge + Math.max(0, context.currentYear - 1)
    const deathRatePer100k =
      variant === "ny05"
        ? resolveAgeRate(currentAge, NY05_DEATH_RATE_BY_AGE)
        : resolveTermAgeRate(currentAge, context.durationYears, TR08_DEATH_RATE_BY_TERM_AND_AGE)
    const disabilityRatePer100k = resolveAgeRate(currentAge, NY05_DISABILITY_RATE_BY_AGE)
    const monthlyFee =
      (deathBenefit / 100000) * deathRatePer100k + (disabilityBenefit / 100000) * disabilityRatePer100k
    return monthlyFee * context.monthsBetweenPayments
  }
}
