import type { InputsDaily } from "../calculate-results-daily"

export type AlfaExclusivePlusVariant = "ny05" | "tr08"

export interface AlfaExclusivePlusVariantConfig {
  variant: AlfaExclusivePlusVariant
  code: "NY-05" | "TR-08"
  taxCreditAllowed: boolean
  redemptionFeeAfterYear10Percent: number
  paidUpMaintenanceFeeMonthlyAmount: number
  paidUpMaintenanceFeeStartMonth: number
}

const NY05_CONFIG: AlfaExclusivePlusVariantConfig = {
  variant: "ny05",
  code: "NY-05",
  taxCreditAllowed: true,
  redemptionFeeAfterYear10Percent: 15,
  paidUpMaintenanceFeeMonthlyAmount: 0,
  paidUpMaintenanceFeeStartMonth: 10,
}

const TR08_CONFIG: AlfaExclusivePlusVariantConfig = {
  variant: "tr08",
  code: "TR-08",
  taxCreditAllowed: false,
  redemptionFeeAfterYear10Percent: 20,
  paidUpMaintenanceFeeMonthlyAmount: 1000,
  paidUpMaintenanceFeeStartMonth: 10,
}

export function resolveAlfaExclusivePlusVariant(productVariant?: string): AlfaExclusivePlusVariant {
  if (!productVariant) return "ny05"
  const normalized = productVariant.toLowerCase()
  if (normalized.includes("tr08") || normalized.includes("tr-08")) return "tr08"
  return "ny05"
}

export function getAlfaExclusivePlusVariantConfig(productVariant?: string): AlfaExclusivePlusVariantConfig {
  const variant = resolveAlfaExclusivePlusVariant(productVariant)
  if (variant === "tr08") return TR08_CONFIG
  return NY05_CONFIG
}

export function estimateDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function buildAlfaExclusivePlusRedemptionSchedule(
  durationYears: number,
  afterYear10Percent: number,
): Record<number, number> {
  const schedule: Record<number, number> = {}
  const safeDuration = Math.max(1, durationYears)
  for (let year = 1; year <= safeDuration; year++) {
    schedule[year] = year <= 10 ? 100 : afterYear10Percent
  }
  return schedule
}
