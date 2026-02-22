import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE,
  ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ALFA_ZEN_PARTIAL_SURRENDER_FIXED_FEE,
  ALFA_ZEN_POLICY_ISSUANCE_FEE_AMOUNT,
  ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT,
  ALFA_ZEN_RISK_ACCIDENTAL_DEATH_BENEFIT,
  ALFA_ZEN_RISK_ANNUAL_FEE,
  ALFA_ZEN_RISK_COVERAGE_END_YEAR,
  ALFA_ZEN_RISK_COVERAGE_START_YEAR,
  ALFA_ZEN_TAX_CREDIT_RATE_PERCENT,
  buildAlfaZenBonusAmountByYear,
  buildAlfaZenInitialCostByYear,
  buildAlfaZenInvestedShareByYear,
  buildAlfaZenRedemptionSchedule,
  estimateAlfaZenDurationYears,
  getAlfaZenVariantConfig,
  resolveAlfaZenAccountMaintenanceMonthlyPercent,
  resolveAlfaZenTaxCreditCapPerYear,
  toAlfaZenProductVariantId,
} from "./alfa-zen-config"
import type { ProductDefinition } from "./types"

function createAlfaZenRiskResolver(): (ctx: {
  currentYear: number
  currentCalendarYear: number
  monthsElapsed: number
  monthsBetweenPayments: number
  paymentPerEvent: number
  yearlyPayment: number
  durationYears: number
  insuredEntryAge: number
}) => number {
  return ({ monthsBetweenPayments }) => {
    if (ALFA_ZEN_RISK_ANNUAL_FEE <= 0) return 0
    const paymentShare = Math.max(0, monthsBetweenPayments) / 12
    return ALFA_ZEN_RISK_ANNUAL_FEE * paymentShare
  }
}

function resolveAlfaZenPlusCosts(inputs: InputsDaily): Record<number, number> {
  const base = { ...(inputs.plusCostByYear ?? {}) }
  if (!ALFA_ZEN_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE) return base
  const isCancelledWithinWindow = (inputs.productVariant ?? "").toLowerCase().includes("cancel30")
  if (!isCancelledWithinWindow) return base
  return { 1: ALFA_ZEN_POLICY_ISSUANCE_FEE_AMOUNT, ...base }
}

export const alfaZen: ProductDefinition = {
  id: "alfa-zen",
  label: "Alfa Zen (NY13/NY23)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getAlfaZenVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateAlfaZenDurationYears(inputs)
    const initialCostByYearDefault = buildAlfaZenInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildAlfaZenInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildAlfaZenRedemptionSchedule(durationYears)
    const bonusAmountByYearDefault = buildAlfaZenBonusAmountByYear(inputs, durationYears)
    const riskResolver = createAlfaZenRiskResolver()

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toAlfaZenProductVariantId(variantConfig.variant),
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      yearlyWithdrawalsPlan: inputs.yearlyWithdrawalsPlan ?? [],
      yearlyExtraTaxEligiblePaymentsPlan: inputs.yearlyExtraTaxEligiblePaymentsPlan ?? [],
      yearlyExtraImmediateAccessPaymentsPlan: inputs.yearlyExtraImmediateAccessPaymentsPlan ?? [],
      yearlyExtraImmediateAccessWithdrawalsPlan: inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? ALFA_ZEN_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? ALFA_ZEN_EXTRAORDINARY_ADMIN_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? ALFA_ZEN_RISK_ACCIDENTAL_DEATH_BENEFIT
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? ALFA_ZEN_RISK_COVERAGE_START_YEAR : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? ALFA_ZEN_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? riskResolver : (inputs.riskFeeResolver ?? riskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 20 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? resolveAlfaZenAccountMaintenanceMonthlyPercent(inputs.selectedFundId, variantConfig)
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? ALFA_ZEN_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? ALFA_ZEN_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? ALFA_ZEN_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? false : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? ALFA_ZEN_PARTIAL_SURRENDER_FIXED_FEE
        : (inputs.partialSurrenderFeeAmount ?? 0),
      plusCostByYear: shouldUseProductDefaults ? resolveAlfaZenPlusCosts(inputs) : inputs.plusCostByYear,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusOnContributionPercent: shouldUseProductDefaults ? 0 : (inputs.bonusOnContributionPercent ?? 0),
      bonusOnContributionPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusOnContributionPercentByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: shouldUseProductDefaults ? true : (inputs.enableTaxCredit ?? true),
      taxCreditRatePercent: shouldUseProductDefaults ? ALFA_ZEN_TAX_CREDIT_RATE_PERCENT : (inputs.taxCreditRatePercent ?? 20),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? resolveAlfaZenTaxCreditCapPerYear(variantConfig, inputs.eurToHufRate, inputs.usdToHufRate)
        : (inputs.taxCreditCapPerYear ??
          resolveAlfaZenTaxCreditCapPerYear(variantConfig, inputs.eurToHufRate, inputs.usdToHufRate)),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditEndYear ?? 0),
      taxCreditLimitByYear: inputs.taxCreditLimitByYear ?? {},
      taxCreditAmountByYear: inputs.taxCreditAmountByYear ?? {},
      taxCreditYieldPercent: shouldUseProductDefaults ? 1 : (inputs.taxCreditYieldPercent ?? 1),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? true : (inputs.taxCreditCalendarPostingEnabled ?? true),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
    })
  },
}

