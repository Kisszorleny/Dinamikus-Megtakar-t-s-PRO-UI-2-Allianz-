import type { Currency, InputsDaily } from "../calculate-results-daily"

export type GroupamaNextVariant = "ul100-trad0" | "ul75-trad25" | "ul0-trad100"

export const GROUPAMA_NEXT_MNB_CODE = "GB733" as const
export const GROUPAMA_NEXT_PRODUCT_CODE = "NEXT" as const

export const GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0 = "groupama_next_ul100_trad0_huf" as const
export const GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25 = "groupama_next_ul75_trad25_huf" as const
export const GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100 = "groupama_next_ul0_trad100_huf" as const

export const GROUPAMA_NEXT_MIN_ANNUAL_PAYMENT_HUF = 144_000
export const GROUPAMA_NEXT_MIN_MONTHLY_PAYMENT_HUF = 12_000
export const GROUPAMA_NEXT_MIN_EXTRAORDINARY_PAYMENT_HUF = 12_000

export const GROUPAMA_NEXT_POLICY_ISSUANCE_ONE_OFF_FEE_HUF = 2_500
export const GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_HUF = 700
export const GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_ELECTRONIC_HUF = 560
export const GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_CAP_HUF = 1_400
export const GROUPAMA_NEXT_RISK_MONTHLY_FEE_HUF = 125

export const GROUPAMA_NEXT_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.07
export const GROUPAMA_NEXT_UL_ASSET_MONTHLY_PERCENT = 0.03
export const GROUPAMA_NEXT_CAPITAL_GUARD_MONTHLY_PERCENT = 0.1
export const GROUPAMA_NEXT_CAPITAL_GUARD_MONTHLY_PERCENT_AGE65_PLUS = 0.05

export interface GroupamaNextVariantConfig {
  variant: GroupamaNextVariant
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
  ulSharePercent: number
  traditionalSharePercent: number
}

const UL100_TRAD0_CONFIG: GroupamaNextVariantConfig = {
  variant: "ul100-trad0",
  currency: "HUF",
  mnbCode: GROUPAMA_NEXT_MNB_CODE,
  productCode: GROUPAMA_NEXT_PRODUCT_CODE,
  productVariantId: GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0,
  ulSharePercent: 100,
  traditionalSharePercent: 0,
}

const UL75_TRAD25_CONFIG: GroupamaNextVariantConfig = {
  variant: "ul75-trad25",
  currency: "HUF",
  mnbCode: GROUPAMA_NEXT_MNB_CODE,
  productCode: GROUPAMA_NEXT_PRODUCT_CODE,
  productVariantId: GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25,
  ulSharePercent: 75,
  traditionalSharePercent: 25,
}

const UL0_TRAD100_CONFIG: GroupamaNextVariantConfig = {
  variant: "ul0-trad100",
  currency: "HUF",
  mnbCode: GROUPAMA_NEXT_MNB_CODE,
  productCode: GROUPAMA_NEXT_PRODUCT_CODE,
  productVariantId: GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100,
  ulSharePercent: 0,
  traditionalSharePercent: 100,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeVariantKey(value: string): string {
  return value.trim().toLowerCase()
}

export function resolveGroupamaNextVariant(productVariant?: string): GroupamaNextVariant {
  const normalized = normalizeVariantKey(productVariant ?? "")
  if (normalized.includes("ul0") || normalized.includes("trad100")) return "ul0-trad100"
  if (normalized.includes("ul75") || normalized.includes("trad25")) return "ul75-trad25"
  return "ul100-trad0"
}

export function toGroupamaNextProductVariantId(variant: GroupamaNextVariant): string {
  if (variant === "ul0-trad100") return GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100
  if (variant === "ul75-trad25") return GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25
  return GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0
}

export function getGroupamaNextVariantConfig(productVariant?: string): GroupamaNextVariantConfig {
  const variant = resolveGroupamaNextVariant(productVariant)
  if (variant === "ul0-trad100") return UL0_TRAD100_CONFIG
  if (variant === "ul75-trad25") return UL75_TRAD25_CONFIG
  return UL100_TRAD0_CONFIG
}

export function estimateGroupamaNextDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function resolveGroupamaNextMinimumAnnualPayment(): number {
  return GROUPAMA_NEXT_MIN_ANNUAL_PAYMENT_HUF
}

export function resolveGroupamaNextAdminMonthlyFee(useElectronicAdministration?: boolean): number {
  return useElectronicAdministration ? GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_ELECTRONIC_HUF : GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_HUF
}

export function resolveGroupamaNextRiskMonthlyFee(): number {
  return GROUPAMA_NEXT_RISK_MONTHLY_FEE_HUF
}

export function resolveGroupamaNextAccountMaintenanceMonthlyPercent(): number {
  return GROUPAMA_NEXT_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
}

export function resolveGroupamaNextUlAssetMonthlyPercent(variant: GroupamaNextVariant): number {
  return variant === "ul0-trad100" ? 0 : GROUPAMA_NEXT_UL_ASSET_MONTHLY_PERCENT
}

export function resolveGroupamaNextCapitalGuardMonthlyPercent(
  isEnabled: boolean,
  isAge65Plus = false,
): number {
  if (!isEnabled) return 0
  return isAge65Plus
    ? GROUPAMA_NEXT_CAPITAL_GUARD_MONTHLY_PERCENT_AGE65_PLUS
    : GROUPAMA_NEXT_CAPITAL_GUARD_MONTHLY_PERCENT
}

export function buildGroupamaNextInvestedShareByYear(
  durationYears: number,
  variant: GroupamaNextVariant,
): Record<number, number> {
  const safeDuration = Math.max(1, Math.round(durationYears))
  const out: Record<number, number> = {}
  const config = getGroupamaNextVariantConfig(toGroupamaNextProductVariantId(variant))
  for (let year = 1; year <= safeDuration; year++) out[year] = config.ulSharePercent
  return out
}

export function buildGroupamaNextAssetCostPercentByYear(
  durationYears: number,
  variant: GroupamaNextVariant,
  isCapitalGuardEnabled: boolean,
  isAge65Plus: boolean,
): Record<number, number> {
  const safeDuration = Math.max(1, Math.round(durationYears))
  const out: Record<number, number> = {}
  const basePercent =
    resolveGroupamaNextUlAssetMonthlyPercent(variant) +
    resolveGroupamaNextCapitalGuardMonthlyPercent(isCapitalGuardEnabled, isAge65Plus)
  for (let year = 1; year <= safeDuration; year++) out[year] = basePercent * 12
  return out
}

export function buildGroupamaNextPolicyFeeByYear(durationYears: number): Record<number, number> {
  const safeDuration = Math.max(1, Math.round(durationYears))
  return { 1: GROUPAMA_NEXT_POLICY_ISSUANCE_ONE_OFF_FEE_HUF, ...(safeDuration > 1 ? {} : {}) }
}

export function estimateGroupamaNextSwitchFee(amount: number, annualSwitchCount: number): number {
  if (annualSwitchCount <= 2) return 0
  const safeAmount = Math.max(0, amount)
  const proportional = safeAmount * 0.0025
  return clamp(Math.round(proportional), 200, 2_000)
}
