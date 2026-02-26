import type { Currency, InputsDaily } from "../calculate-results-daily"

export type GroupamaEasyVariant = "life" | "life-tax"

export const GROUPAMA_EASY_MNB_CODE = "GB730" as const
export const GROUPAMA_EASY_PRODUCT_CODE = "EASY" as const

export const GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF = "groupama_easy_life_huf" as const
export const GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF = "groupama_easy_life_tax_huf" as const

export const GROUPAMA_EASY_MIN_MONTHLY_PAYMENT_HUF = 12_000
export const GROUPAMA_EASY_MIN_ANNUAL_PAYMENT_HUF = 144_000
export const GROUPAMA_EASY_MIN_EXTRAORDINARY_PAYMENT_HUF = 12_000

export const GROUPAMA_EASY_ADMIN_MONTHLY_FEE_HUF = 700
export const GROUPAMA_EASY_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.07
export const GROUPAMA_EASY_ASSET_MONTHLY_PERCENT = 0.03
export const GROUPAMA_EASY_RISK_MONTHLY_FEE_HUF = 125

export interface GroupamaEasyVariantConfig {
  variant: GroupamaEasyVariant
  currency: Currency
  mnbCode: string
  productCode: string
  productVariantId: string
  taxCreditAllowed: boolean
}

const LIFE_CONFIG: GroupamaEasyVariantConfig = {
  variant: "life",
  currency: "HUF",
  mnbCode: GROUPAMA_EASY_MNB_CODE,
  productCode: GROUPAMA_EASY_PRODUCT_CODE,
  productVariantId: GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF,
  taxCreditAllowed: false,
}

const LIFE_TAX_CONFIG: GroupamaEasyVariantConfig = {
  variant: "life-tax",
  currency: "HUF",
  mnbCode: GROUPAMA_EASY_MNB_CODE,
  productCode: GROUPAMA_EASY_PRODUCT_CODE,
  productVariantId: GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF,
  taxCreditAllowed: true,
}

export function resolveGroupamaEasyVariant(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GroupamaEasyVariant {
  const normalized = (productVariant ?? "").toLowerCase()
  if (normalized.includes("_tax_") || normalized.includes("life_tax")) return "life-tax"
  if (normalized.includes("groupama_easy_life_huf")) return "life"
  return enableTaxCredit ? "life-tax" : "life"
}

export function toGroupamaEasyProductVariantId(variant: GroupamaEasyVariant): string {
  return variant === "life-tax"
    ? GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF
    : GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF
}

export function getGroupamaEasyVariantConfig(
  productVariant?: string,
  enableTaxCredit?: boolean,
): GroupamaEasyVariantConfig {
  const variant = resolveGroupamaEasyVariant(productVariant, enableTaxCredit)
  return variant === "life-tax" ? LIFE_TAX_CONFIG : LIFE_CONFIG
}

export function estimateGroupamaEasyDurationYears(inputs: InputsDaily): number {
  if (inputs.durationUnit === "year") return Math.max(1, Math.round(inputs.durationValue))
  if (inputs.durationUnit === "month") return Math.max(1, Math.ceil(inputs.durationValue / 12))
  return Math.max(1, Math.ceil(inputs.durationValue / 365))
}

export function resolveGroupamaEasyMinimumAnnualPayment(): number {
  return GROUPAMA_EASY_MIN_ANNUAL_PAYMENT_HUF
}

export function resolveGroupamaEasyAdminMonthlyFee(): number {
  return GROUPAMA_EASY_ADMIN_MONTHLY_FEE_HUF
}

export function resolveGroupamaEasyRiskMonthlyFee(): number {
  return GROUPAMA_EASY_RISK_MONTHLY_FEE_HUF
}

export function resolveGroupamaEasyAccountMaintenanceMonthlyPercent(): number {
  return GROUPAMA_EASY_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
}

export function buildGroupamaEasyAssetCostPercentByYear(durationYears: number): Record<number, number> {
  const safeDuration = Math.max(1, Math.round(durationYears))
  const out: Record<number, number> = {}
  const yearlyPercent = GROUPAMA_EASY_ASSET_MONTHLY_PERCENT * 12
  for (let year = 1; year <= safeDuration; year++) out[year] = yearlyPercent
  return out
}
