import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildPremiumSelectionBonusAmountByYear,
  buildPremiumSelectionInitialCostByYear,
  buildPremiumSelectionInvestedShareByYear,
  buildPremiumSelectionRedemptionSchedule,
  estimatePremiumSelectionDurationYears,
  getPremiumSelectionVariantConfig,
  PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
  PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  PREMIUM_SELECTION_PAID_UP_MAINTENANCE_FEE_START_MONTH,
  PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT,
  PREMIUM_SELECTION_RISK_COVERAGE_END_YEAR,
  PREMIUM_SELECTION_RISK_COVERAGE_START_YEAR,
  resolvePremiumSelectionTaxCreditCapPerYear,
  resolvePremiumSelectionAccountMaintenanceMonthlyPercent,
} from "./alfa-premium-selection-config"
import type { ProductDefinition } from "./types"

function createPremiumSelectionRiskResolver(annualFeeAmount: number): (ctx: {
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
    if (annualFeeAmount <= 0) return 0
    const paymentShare = Math.max(0, monthsBetweenPayments) / 12
    return annualFeeAmount * paymentShare
  }
}

export const alfaPremiumSelection: ProductDefinition = {
  id: "alfa-premium-selection",
  label: "Alfa Premium Selection (TR09/NY06/TR18/NY12/TR28/NY22)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getPremiumSelectionVariantConfig(inputs.productVariant, inputs.enableTaxCredit, inputs.currency)
    const durationYears = estimatePremiumSelectionDurationYears(inputs, variantConfig)
    const initialCostByYearDefault = buildPremiumSelectionInitialCostByYear(durationYears, variantConfig)
    const investedShareByYearDefault = buildPremiumSelectionInvestedShareByYear(durationYears, variantConfig)
    const redemptionFeeByYearDefault = buildPremiumSelectionRedemptionSchedule(durationYears, variantConfig)
    const bonusAmountByYearDefault = buildPremiumSelectionBonusAmountByYear(inputs, durationYears)
    const riskResolver = createPremiumSelectionRiskResolver(variantConfig.riskAnnualFeeAmount)
    const accountMaintenanceMonthlyPercent = resolvePremiumSelectionAccountMaintenanceMonthlyPercent(
      inputs.selectedFundId,
      variantConfig,
    )
    const productVariantId =
      variantConfig.variant === "ny06"
        ? "alfa_premium_selection_ny06"
        : variantConfig.variant === "ny12"
          ? "alfa_premium_selection_ny12"
        : variantConfig.variant === "ny22"
          ? "alfa_premium_selection_ny22"
        : variantConfig.variant === "tr18"
          ? "alfa_premium_selection_tr18"
        : variantConfig.variant === "tr28"
          ? "alfa_premium_selection_tr28"
          : "alfa_premium_selection_tr09"
    const durationValue = variantConfig.fixedDurationYears ?? Math.max(variantConfig.minimumDurationYears, durationYears)
    const riskCoverageEndYear =
      variantConfig.variant === "tr18" || variantConfig.variant === "tr28"
        ? undefined
        : PREMIUM_SELECTION_RISK_COVERAGE_END_YEAR
    const defaultFrequency = variantConfig.allowedFrequencies.includes("éves") &&
      variantConfig.allowedFrequencies.length === 1
      ? "éves"
      : inputs.frequency

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: productVariantId,
      durationUnit: "year",
      durationValue,
      frequency: shouldUseProductDefaults ? defaultFrequency : inputs.frequency,
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? PREMIUM_SELECTION_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? variantConfig.riskAccidentalDeathBenefitAmount
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults
        ? PREMIUM_SELECTION_RISK_COVERAGE_START_YEAR
        : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults
        ? riskCoverageEndYear
        : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? riskResolver : (inputs.riskFeeResolver ?? riskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 20 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? accountMaintenanceMonthlyPercent
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? PREMIUM_SELECTION_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? variantConfig.partialSurrenderFeeAmount
        : (inputs.partialSurrenderFeeAmount ?? 0),
      plusCostByYear: shouldUseProductDefaults
        ? (variantConfig.variant === "tr18" || variantConfig.variant === "tr28"
            ? { 1: variantConfig.policyIssuanceFeeAmount, ...(inputs.plusCostByYear ?? {}) }
            : (inputs.plusCostByYear ?? {}))
        : inputs.plusCostByYear,
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? variantConfig.paidUpMaintenanceFeeMonthlyAmount
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults
        ? PREMIUM_SELECTION_PAID_UP_MAINTENANCE_FEE_START_MONTH
        : (inputs.paidUpMaintenanceFeeStartMonth ?? 10),
      enableTaxCredit: variantConfig.taxCreditAllowed ? (inputs.enableTaxCredit ?? true) : false,
      taxCreditRatePercent: variantConfig.taxCreditAllowed ? (inputs.taxCreditRatePercent ?? 20) : 0,
      taxCreditCapPerYear: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditCapPerYear ??
          resolvePremiumSelectionTaxCreditCapPerYear(variantConfig, inputs.eurToHufRate, inputs.usdToHufRate))
        : 0,
      taxCreditLimitByYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditLimitByYear ?? {}) : {},
      taxCreditAmountByYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditAmountByYear ?? {}) : {},
      taxCreditYieldPercent: variantConfig.taxCreditAllowed ? (inputs.taxCreditYieldPercent ?? 1) : 0,
      taxCreditCalendarPostingEnabled: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditCalendarPostingEnabled ?? (variantConfig.variant === "ny12"))
        : false,
    })
  },
}
