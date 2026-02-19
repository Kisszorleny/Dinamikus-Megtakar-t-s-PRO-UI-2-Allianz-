import type { InputsDaily } from "../calculate-results-daily"

export type PremiumSelectionVariant = "tr09" | "ny06" | "tr18" | "ny12" | "tr28" | "ny22"

export const PREMIUM_SELECTION_PRODUCT_CODE = "TR09"
export const PREMIUM_SELECTION_NYUGDIJ_PRODUCT_CODE = "NY06"
export const PREMIUM_SELECTION_EUR_PRODUCT_CODE = "TR18"
export const PREMIUM_SELECTION_NY12_PRODUCT_CODE = "NY12"
export const PREMIUM_SELECTION_USD_PRODUCT_CODE = "TR28"
export const PREMIUM_SELECTION_NY22_PRODUCT_CODE = "NY22"
export const PREMIUM_SELECTION_CURRENCY = "HUF" as const

export const PREMIUM_SELECTION_FIXED_DURATION_YEARS = 15
export const PREMIUM_SELECTION_NY06_MIN_DURATION_YEARS = 10
export const PREMIUM_SELECTION_TR18_MIN_DURATION_YEARS = 5
export const PREMIUM_SELECTION_TR18_MAX_DURATION_YEARS = 15
export const PREMIUM_SELECTION_TR28_MIN_DURATION_YEARS = 5
export const PREMIUM_SELECTION_TR28_MAX_DURATION_YEARS = 15
export const PREMIUM_SELECTION_NY22_MIN_DURATION_YEARS = 10
export const PREMIUM_SELECTION_NY22_MAX_DURATION_YEARS = 50

export const PREMIUM_SELECTION_MIN_ANNUAL_PAYMENT = 360_000
export const PREMIUM_SELECTION_MIN_EXTRAORDINARY_PAYMENT = 50_000
export const PREMIUM_SELECTION_TR18_MIN_ANNUAL_PAYMENT = 2_400
export const PREMIUM_SELECTION_TR18_MIN_EXTRAORDINARY_PAYMENT = 1_000
export const PREMIUM_SELECTION_TR28_MIN_ANNUAL_PAYMENT = 2_400
export const PREMIUM_SELECTION_TR28_MIN_EXTRAORDINARY_PAYMENT = 1_000
export const PREMIUM_SELECTION_NY12_MIN_ANNUAL_PAYMENT = 1_320
export const PREMIUM_SELECTION_NY12_MIN_EXTRAORDINARY_PAYMENT = 1_000
export const PREMIUM_SELECTION_NY22_MIN_ANNUAL_PAYMENT = 1_320
export const PREMIUM_SELECTION_NY22_MIN_EXTRAORDINARY_PAYMENT = 1_000

export const PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT = 0
export const PREMIUM_SELECTION_EXTRAORDINARY_ADMIN_FEE_PERCENT = 0

export const PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.145
export const PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_OTP_BUX_MONTHLY_PERCENT = 0.02
export const PREMIUM_SELECTION_TR18_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.125
export const PREMIUM_SELECTION_TR28_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.125
export const PREMIUM_SELECTION_NY12_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.145
export const PREMIUM_SELECTION_NY12_ACCOUNT_MAINTENANCE_BNP_MM_MONTHLY_PERCENT = 0.03
export const PREMIUM_SELECTION_NY22_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT = 0.145
export const PREMIUM_SELECTION_NY22_ACCOUNT_MAINTENANCE_ABERDEEN_MM_MONTHLY_PERCENT = 0.07
export const PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH = 37
export const PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH = 1
export const PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH = 1

export const PREMIUM_SELECTION_PARTIAL_SURRENDER_FIXED_FEE = 2_500
export const PREMIUM_SELECTION_TR18_PARTIAL_SURRENDER_FIXED_FEE = 10
export const PREMIUM_SELECTION_TR28_PARTIAL_SURRENDER_FIXED_FEE = 10
export const PREMIUM_SELECTION_POLICY_ISSUANCE_FEE = 14_000
export const PREMIUM_SELECTION_TR18_POLICY_ISSUANCE_FEE = 40
export const PREMIUM_SELECTION_TR28_POLICY_ISSUANCE_FEE = 40
export const PREMIUM_SELECTION_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT = 1_000
export const PREMIUM_SELECTION_TR18_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT = 5
export const PREMIUM_SELECTION_TR28_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT = 5
export const PREMIUM_SELECTION_PAID_UP_MAINTENANCE_FEE_START_MONTH = 10

export const PREMIUM_SELECTION_RISK_ACCIDENTAL_DEATH_BENEFIT = 2_000_000
export const PREMIUM_SELECTION_RISK_COVERAGE_START_YEAR = 1
export const PREMIUM_SELECTION_RISK_COVERAGE_END_YEAR = 1
export const PREMIUM_SELECTION_TR18_RISK_ACCIDENTAL_DEATH_BENEFIT = 6_000
export const PREMIUM_SELECTION_TR18_RISK_ANNUAL_FEE = 12
export const PREMIUM_SELECTION_TR18_MIN_ENTRY_AGE = 18
export const PREMIUM_SELECTION_TR18_MAX_ENTRY_AGE = 65
export const PREMIUM_SELECTION_TR28_RISK_ACCIDENTAL_DEATH_BENEFIT = 6_000
export const PREMIUM_SELECTION_TR28_RISK_ANNUAL_FEE = 12
export const PREMIUM_SELECTION_TR28_MIN_ENTRY_AGE = 18
export const PREMIUM_SELECTION_TR28_MAX_ENTRY_AGE = 65
export const PREMIUM_SELECTION_NY22_RISK_ACCIDENTAL_DEATH_BENEFIT = 6_000
export const PREMIUM_SELECTION_NY22_RISK_ANNUAL_FEE = 0
export const PREMIUM_SELECTION_NY22_MIN_ENTRY_AGE = 18
export const PREMIUM_SELECTION_NY22_MAX_ENTRY_AGE = 65

export const PREMIUM_SELECTION_OTP_BUX_FUND_ID = "OTP_BUX_INDEX"
export const PREMIUM_SELECTION_BNP_MONEY_MARKET_FUND_ID = "NPE"
export const PREMIUM_SELECTION_NY22_ABERDEEN_MONEY_MARKET_FUND_ID = "ABERDEEN_MM_USD"
const PREMIUM_SELECTION_NY12_TAX_CREDIT_CAP_HUF = 130_000

export interface PremiumSelectionVariantConfig {
  variant: PremiumSelectionVariant
  code: "TR09" | "NY06" | "TR18" | "NY12" | "TR28" | "NY22"
  currency: "HUF" | "EUR" | "USD"
  taxCreditAllowed: boolean
  fixedDurationYears?: number
  minimumDurationYears: number
  maximumDurationYears: number
  minAnnualPayment: number
  minExtraordinaryPayment: number
  accountMaintenanceMonthlyPercent: number
  partialSurrenderFeeAmount: number
  policyIssuanceFeeAmount: number
  paidUpMaintenanceFeeMonthlyAmount: number
  riskAccidentalDeathBenefitAmount: number
  riskAnnualFeeAmount: number
  minEntryAge: number
  maxEntryAge: number
  allowedFrequencies: Array<"havi" | "negyedéves" | "féléves" | "éves">
  redemptionFeeAfterYear10Percent: number
}

const TR09_CONFIG: PremiumSelectionVariantConfig = {
  variant: "tr09",
  code: "TR09",
  currency: "HUF",
  taxCreditAllowed: false,
  fixedDurationYears: PREMIUM_SELECTION_FIXED_DURATION_YEARS,
  minimumDurationYears: PREMIUM_SELECTION_FIXED_DURATION_YEARS,
  maximumDurationYears: PREMIUM_SELECTION_FIXED_DURATION_YEARS,
  minAnnualPayment: PREMIUM_SELECTION_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: PREMIUM_SELECTION_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: 0,
  minEntryAge: 16,
  maxEntryAge: 60,
  allowedFrequencies: ["havi", "negyedéves", "féléves", "éves"],
  redemptionFeeAfterYear10Percent: 20,
}

const NY06_CONFIG: PremiumSelectionVariantConfig = {
  variant: "ny06",
  code: "NY06",
  currency: "HUF",
  taxCreditAllowed: true,
  minimumDurationYears: PREMIUM_SELECTION_NY06_MIN_DURATION_YEARS,
  maximumDurationYears: 50,
  minAnnualPayment: PREMIUM_SELECTION_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: 0,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: 0,
  minEntryAge: 16,
  maxEntryAge: 60,
  allowedFrequencies: ["havi", "negyedéves", "féléves", "éves"],
  redemptionFeeAfterYear10Percent: 15,
}

const TR18_CONFIG: PremiumSelectionVariantConfig = {
  variant: "tr18",
  code: "TR18",
  currency: "EUR",
  taxCreditAllowed: false,
  minimumDurationYears: PREMIUM_SELECTION_TR18_MIN_DURATION_YEARS,
  maximumDurationYears: PREMIUM_SELECTION_TR18_MAX_DURATION_YEARS,
  minAnnualPayment: PREMIUM_SELECTION_TR18_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_TR18_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_TR18_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_TR18_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_TR18_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: PREMIUM_SELECTION_TR18_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_TR18_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: PREMIUM_SELECTION_TR18_RISK_ANNUAL_FEE,
  minEntryAge: PREMIUM_SELECTION_TR18_MIN_ENTRY_AGE,
  maxEntryAge: PREMIUM_SELECTION_TR18_MAX_ENTRY_AGE,
  allowedFrequencies: ["éves"],
  redemptionFeeAfterYear10Percent: 20,
}

const NY12_CONFIG: PremiumSelectionVariantConfig = {
  variant: "ny12",
  code: "NY12",
  currency: "EUR",
  taxCreditAllowed: true,
  minimumDurationYears: PREMIUM_SELECTION_NY06_MIN_DURATION_YEARS,
  maximumDurationYears: 50,
  minAnnualPayment: PREMIUM_SELECTION_NY12_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_NY12_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_NY12_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_TR18_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_TR18_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: 0,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_TR18_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: PREMIUM_SELECTION_TR18_RISK_ANNUAL_FEE,
  minEntryAge: PREMIUM_SELECTION_TR18_MIN_ENTRY_AGE,
  maxEntryAge: PREMIUM_SELECTION_TR18_MAX_ENTRY_AGE,
  allowedFrequencies: ["havi", "negyedéves", "féléves", "éves"],
  redemptionFeeAfterYear10Percent: 15,
}

const TR28_CONFIG: PremiumSelectionVariantConfig = {
  variant: "tr28",
  code: "TR28",
  currency: "USD",
  taxCreditAllowed: false,
  minimumDurationYears: PREMIUM_SELECTION_TR28_MIN_DURATION_YEARS,
  maximumDurationYears: PREMIUM_SELECTION_TR28_MAX_DURATION_YEARS,
  minAnnualPayment: PREMIUM_SELECTION_TR28_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_TR28_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_TR28_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_TR28_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_TR28_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: PREMIUM_SELECTION_TR28_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_TR28_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: PREMIUM_SELECTION_TR28_RISK_ANNUAL_FEE,
  minEntryAge: PREMIUM_SELECTION_TR28_MIN_ENTRY_AGE,
  maxEntryAge: PREMIUM_SELECTION_TR28_MAX_ENTRY_AGE,
  allowedFrequencies: ["éves"],
  redemptionFeeAfterYear10Percent: 20,
}

const NY22_CONFIG: PremiumSelectionVariantConfig = {
  variant: "ny22",
  code: "NY22",
  currency: "USD",
  taxCreditAllowed: true,
  minimumDurationYears: PREMIUM_SELECTION_NY22_MIN_DURATION_YEARS,
  maximumDurationYears: PREMIUM_SELECTION_NY22_MAX_DURATION_YEARS,
  minAnnualPayment: PREMIUM_SELECTION_NY22_MIN_ANNUAL_PAYMENT,
  minExtraordinaryPayment: PREMIUM_SELECTION_NY22_MIN_EXTRAORDINARY_PAYMENT,
  accountMaintenanceMonthlyPercent: PREMIUM_SELECTION_NY22_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  partialSurrenderFeeAmount: PREMIUM_SELECTION_TR28_PARTIAL_SURRENDER_FIXED_FEE,
  policyIssuanceFeeAmount: PREMIUM_SELECTION_TR28_POLICY_ISSUANCE_FEE,
  paidUpMaintenanceFeeMonthlyAmount: 0,
  riskAccidentalDeathBenefitAmount: PREMIUM_SELECTION_NY22_RISK_ACCIDENTAL_DEATH_BENEFIT,
  riskAnnualFeeAmount: PREMIUM_SELECTION_NY22_RISK_ANNUAL_FEE,
  minEntryAge: PREMIUM_SELECTION_NY22_MIN_ENTRY_AGE,
  maxEntryAge: PREMIUM_SELECTION_NY22_MAX_ENTRY_AGE,
  allowedFrequencies: ["éves"],
  redemptionFeeAfterYear10Percent: 15,
}

export function resolvePremiumSelectionVariant(
  productVariant?: string,
  enableTaxCredit?: boolean,
  currency?: "HUF" | "EUR" | "USD",
): PremiumSelectionVariant {
  if (productVariant) {
    const normalized = productVariant.toLowerCase()
    if (normalized.includes("ny22") || normalized.includes("ny-22")) return "ny22"
    if (normalized.includes("ny12") || normalized.includes("ny-12")) return "ny12"
    if (normalized.includes("ny06") || normalized.includes("ny-06")) return "ny06"
    if (normalized.includes("tr28") || normalized.includes("tr-28")) return "tr28"
    if (normalized.includes("tr18") || normalized.includes("tr-18")) return "tr18"
    if (normalized.includes("tr09") || normalized.includes("tr-09")) return "tr09"
  }
  if (currency === "USD" && enableTaxCredit === true) return "ny22"
  if (currency === "USD") return "tr28"
  if (currency === "EUR" && enableTaxCredit === true) return "ny12"
  if (enableTaxCredit === true) return "ny06"
  if (currency === "EUR") return "tr18"
  return "tr09"
}

export function getPremiumSelectionVariantConfig(
  productVariant?: string,
  enableTaxCredit?: boolean,
  currency?: "HUF" | "EUR" | "USD",
): PremiumSelectionVariantConfig {
  const variant = resolvePremiumSelectionVariant(productVariant, enableTaxCredit, currency)
  if (variant === "ny22") return NY22_CONFIG
  if (variant === "ny12") return NY12_CONFIG
  if (variant === "ny06") return NY06_CONFIG
  if (variant === "tr28") return TR28_CONFIG
  if (variant === "tr18") return TR18_CONFIG
  return TR09_CONFIG
}

function normalizeDurationYears(durationYears: number, variantConfig: PremiumSelectionVariantConfig): number {
  const rounded = Math.max(1, Math.round(durationYears))
  if (variantConfig.fixedDurationYears) {
    return variantConfig.fixedDurationYears
  }
  return Math.min(variantConfig.maximumDurationYears, Math.max(variantConfig.minimumDurationYears, rounded))
}

export function estimatePremiumSelectionDurationYears(
  inputs: InputsDaily,
  variantConfig: PremiumSelectionVariantConfig,
): number {
  if (inputs.durationUnit === "year") return normalizeDurationYears(inputs.durationValue, variantConfig)
  if (inputs.durationUnit === "month") return normalizeDurationYears(Math.ceil(inputs.durationValue / 12), variantConfig)
  return normalizeDurationYears(Math.ceil(inputs.durationValue / 365), variantConfig)
}

export function buildPremiumSelectionInitialCostByYear(
  durationYears: number,
  variantConfig: PremiumSelectionVariantConfig,
): Record<number, number> {
  if (variantConfig.variant === "tr09" || variantConfig.variant === "tr18" || variantConfig.variant === "tr28") {
    return { 1: 80, 2: 50, 3: 10 }
  }

  if (variantConfig.variant === "ny12" || variantConfig.variant === "ny22") {
    if (durationYears <= 10) return { 1: 79, 2: 0, 3: 0 }
    if (durationYears === 11) return { 1: 80, 2: 10, 3: 0 }
    if (durationYears >= 15) return { 1: 80, 2: 50, 3: 10 }
    return { 1: 80, 2: 10, 3: 0 }
  }

  if (durationYears <= 10) return { 1: 79, 2: 0, 3: 0 }
  if (durationYears === 11) return { 1: 80, 2: 10, 3: 0 }
  if (durationYears === 12) return { 1: 80, 2: 20, 3: 0 }
  if (durationYears === 13) return { 1: 80, 2: 30, 3: 0 }
  if (durationYears === 14) return { 1: 80, 2: 40, 3: 5 }
  return { 1: 80, 2: 50, 3: 10 }
}

export function buildPremiumSelectionInvestedShareByYear(
  durationYears: number,
  variantConfig: PremiumSelectionVariantConfig,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears, variantConfig)
  const config: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    // Invested (maturity surplus) account receives the remainder: 80/50/20.
    if (year === 1) config[year] = 80
    else if (year === 2) config[year] = 50
    else config[year] = 20
  }
  return config
}

export function buildPremiumSelectionRedemptionSchedule(
  durationYears: number,
  variantConfig: PremiumSelectionVariantConfig,
): Record<number, number> {
  const safeDuration = normalizeDurationYears(durationYears, variantConfig)
  const schedule: Record<number, number> = {}
  for (let year = 1; year <= safeDuration; year++) {
    schedule[year] = year <= 10 ? 100 : variantConfig.redemptionFeeAfterYear10Percent
  }
  return schedule
}

type PremiumSelectionBonusTier = "silver" | "gold" | "platinum"

function resolvePremiumSelectionBonusTier(initialAnnualPayment: number): PremiumSelectionBonusTier | null {
  if (initialAnnualPayment >= 1_440_000) return "platinum"
  if (initialAnnualPayment >= 720_000) return "gold"
  if (initialAnnualPayment >= 360_000) return "silver"
  return null
}

function resolvePremiumSelectionEuroBonusPercent(yearlyPayment: number, durationYears: number): number {
  if (durationYears >= 15) {
    if (yearlyPayment >= 4_800) return 140
    if (yearlyPayment >= PREMIUM_SELECTION_TR18_MIN_ANNUAL_PAYMENT) return 70
    return 0
  }
  if (durationYears >= 10 && durationYears <= 14) {
    return 20
  }
  return 0
}

function resolvePremiumSelectionNy12BonusPercent(firstYearYearlyPayment: number, durationYears: number): number {
  const isGold = firstYearYearlyPayment >= 2_640
  const isSilver = firstYearYearlyPayment >= 1_320 && firstYearYearlyPayment <= 2_639
  if (!isGold && !isSilver) return 0

  if (durationYears >= 30) return isGold ? 100 : 200
  if (durationYears >= 20) return isGold ? 150 : 75
  if (durationYears >= 10) return isGold ? 100 : 50
  return 0
}

function resolvePremiumSelectionNy22BonusPercent(yearlyPayment: number, durationYears: number): number {
  const isLowerTier = yearlyPayment >= 1_320 && yearlyPayment <= 2_639
  const isUpperTier = yearlyPayment >= 2_640
  if (!isLowerTier && !isUpperTier) return 0

  if (durationYears >= 30) return isUpperTier ? 200 : 100
  if (durationYears >= 20) return isUpperTier ? 150 : 75
  if (durationYears >= 10) return isUpperTier ? 100 : 50
  return 0
}

function getPremiumSelectionBonusPercentForTier(tier: PremiumSelectionBonusTier): number {
  if (tier === "platinum") return 140
  if (tier === "gold") return 70
  return 35
}

function getNy06TenYearBaseBonusPercent(yearlyPayment: number, durationYears: number): number {
  const isGold = yearlyPayment >= 720_000
  const isSilver = yearlyPayment >= 360_000
  if (!isGold && !isSilver) return 0

  if (durationYears >= 30) {
    if (isGold) return 100
    return 200
  }
  if (durationYears >= 20) {
    if (isGold) return 150
    return 75
  }
  if (durationYears >= 10) {
    if (isGold) return 100
    return 50
  }
  return 0
}

export function isPremiumSelectionBonusEligible(inputs: InputsDaily, durationYears: number): boolean {
  const variantConfig = getPremiumSelectionVariantConfig(inputs.productVariant, inputs.enableTaxCredit, inputs.currency)
  const safeDuration = normalizeDurationYears(durationYears, variantConfig)
  const bonusYear = Math.min(10, safeDuration)
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  const yearlyWithdrawals = inputs.yearlyWithdrawalsPlan ?? []

  for (let year = 1; year <= bonusYear; year++) {
    if ((yearlyPayments[year] ?? 0) <= 0) return false
    if ((yearlyWithdrawals[year] ?? 0) > 0) return false
  }
  return true
}

export function buildPremiumSelectionBonusAmountByYear(
  inputs: InputsDaily,
  durationYears: number,
): Record<number, number> {
  const variantConfig = getPremiumSelectionVariantConfig(inputs.productVariant, inputs.enableTaxCredit, inputs.currency)
  if (!isPremiumSelectionBonusEligible(inputs, durationYears)) return {}

  const safeDuration = normalizeDurationYears(durationYears, variantConfig)
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  let minMonthlyPremium = Number.POSITIVE_INFINITY
  for (let year = 1; year <= safeDuration; year++) {
    const yearlyValue = Math.max(0, yearlyPayments[year] ?? 0)
    const monthlyEquivalent = yearlyValue / 12
    if (monthlyEquivalent > 0 && monthlyEquivalent < minMonthlyPremium) {
      minMonthlyPremium = monthlyEquivalent
    }
  }
  if (!Number.isFinite(minMonthlyPremium) || minMonthlyPremium <= 0) return {}

  const annualizedMinimum = minMonthlyPremium * 12

  if (variantConfig.variant === "tr18" || variantConfig.variant === "tr28") {
    const bonusYear = Math.min(10, safeDuration)
    const bonusPercent = resolvePremiumSelectionEuroBonusPercent(annualizedMinimum, safeDuration)
    if (bonusPercent <= 0) return {}
    return { [bonusYear]: annualizedMinimum * (bonusPercent / 100) }
  }

  if (variantConfig.variant === "ny12") {
    const firstYearAnnualPayment = Math.max(0, yearlyPayments[1] ?? 0)
    const bonusPercent = resolvePremiumSelectionNy12BonusPercent(firstYearAnnualPayment, safeDuration)
    const bonusByYear: Record<number, number> = {}
    if (bonusPercent > 0 && safeDuration > 1) {
      bonusByYear[safeDuration - 1] = annualizedMinimum * (bonusPercent / 100)
    }
    if (safeDuration >= 15) {
      bonusByYear[10] = (bonusByYear[10] ?? 0) + annualizedMinimum * 0.15
    }
    return bonusByYear
  }

  if (variantConfig.variant === "ny22") {
    const bonusPercent = resolvePremiumSelectionNy22BonusPercent(annualizedMinimum, safeDuration)
    if (bonusPercent <= 0 || safeDuration <= 1) return {}
    return { [safeDuration - 1]: annualizedMinimum * (bonusPercent / 100) }
  }

  if (variantConfig.variant === "ny06") {
    const tenYearPercent = getNy06TenYearBaseBonusPercent(Math.max(0, yearlyPayments[1] ?? 0), safeDuration)
    const tenYearTotalPercent = tenYearPercent + (safeDuration >= 15 ? 15 : 0)
    const bonusByYear: Record<number, number> = {}
    if (tenYearTotalPercent > 0) {
      bonusByYear[10] = annualizedMinimum * (tenYearTotalPercent / 100)
    }
    if (safeDuration >= 15) {
      bonusByYear[safeDuration - 1] = (bonusByYear[safeDuration - 1] ?? 0) + annualizedMinimum * 0.15
    }
    return bonusByYear
  }

  const bonusYear = Math.min(10, safeDuration)
  const initialAnnualPayment = Math.max(0, yearlyPayments[1] ?? 0)
  const tier = resolvePremiumSelectionBonusTier(initialAnnualPayment)
  if (!tier) return {}
  const bonusPercent = getPremiumSelectionBonusPercentForTier(tier)
  return { [bonusYear]: annualizedMinimum * (bonusPercent / 100) }
}

export function resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
  selectedFundId?: string | null,
  variantConfig?: PremiumSelectionVariantConfig,
): number {
  if (variantConfig?.variant === "ny12") {
    const normalized = (selectedFundId ?? "").toUpperCase()
    return normalized === PREMIUM_SELECTION_BNP_MONEY_MARKET_FUND_ID || normalized.includes("BNP")
      ? PREMIUM_SELECTION_NY12_ACCOUNT_MAINTENANCE_BNP_MM_MONTHLY_PERCENT
      : PREMIUM_SELECTION_NY12_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  if (variantConfig?.variant === "ny22") {
    const normalized = (selectedFundId ?? "").toUpperCase()
    return normalized === PREMIUM_SELECTION_NY22_ABERDEEN_MONEY_MARKET_FUND_ID || normalized.includes("ABERDEEN")
      ? PREMIUM_SELECTION_NY22_ACCOUNT_MAINTENANCE_ABERDEEN_MM_MONTHLY_PERCENT
      : PREMIUM_SELECTION_NY22_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  if (variantConfig?.variant === "tr18") {
    return PREMIUM_SELECTION_TR18_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  if (variantConfig?.variant === "tr28") {
    return PREMIUM_SELECTION_TR28_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  if (variantConfig?.variant === "ny06") {
    return PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
  }
  return selectedFundId === PREMIUM_SELECTION_OTP_BUX_FUND_ID
    ? PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_OTP_BUX_MONTHLY_PERCENT
    : PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
}

export function resolvePremiumSelectionTaxCreditCapPerYear(
  variantConfig: PremiumSelectionVariantConfig,
  eurToHufRate: number | undefined,
  usdToHufRate: number | undefined,
): number {
  if (variantConfig.variant === "ny12") {
    const rate = Math.max(1e-9, eurToHufRate ?? 400)
    return PREMIUM_SELECTION_NY12_TAX_CREDIT_CAP_HUF / rate
  }
  if (variantConfig.variant === "ny22") {
    const rate = Math.max(1e-9, usdToHufRate ?? 360)
    return PREMIUM_SELECTION_NY12_TAX_CREDIT_CAP_HUF / rate
  }
  return 130_000
}
