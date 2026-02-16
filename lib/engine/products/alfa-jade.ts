import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildJadeBonusAmountByYear,
  buildJadeInitialCostByYear,
  buildJadeInvestedShareByYear,
  buildJadeRedemptionSchedule,
  estimateJadeDurationYears,
  getJadeVariantConfig,
  resolveJadeVariant,
  toJadeProductVariantId,
} from "./alfa-jade-config"
import type { ProductDefinition } from "./types"

export const alfaJade: ProductDefinition = {
  id: "alfa-jade",
  label: "Alfa Jáde EUR (TR19)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveJadeVariant(inputs.productVariant, inputs.currency)
    const variantConfig = getJadeVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateJadeDurationYears(inputs)

    const initialCostByYearDefault = buildJadeInitialCostByYear()
    const investedShareByYearDefault = buildJadeInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildJadeRedemptionSchedule(durationYears)
    const bonusAmountByYearDefault = buildJadeBonusAmountByYear(inputs.yearlyPaymentsPlan ?? [], durationYears)

    return calculateResultsDaily({
      ...inputs,
      productVariant: toJadeProductVariantId(variant),
      currency: variantConfig.currency,
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? variantConfig.regularAdminFeePercent
        : (inputs.adminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults
        ? variantConfig.riskMonthlyFeeAmount
        : inputs.riskInsuranceMonthlyFeeAmount,
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? variantConfig.riskBenefitAccidentalDeath
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? variantConfig.defaultDurationYears : inputs.riskInsuranceEndYear,
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 20 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceMonthlyPercent
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceClientStartMonth
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceInvestedStartMonth
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceExtraStartMonth
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? variantConfig.partialSurrenderFixedFeeAmount
        : (inputs.partialSurrenderFeeAmount ?? 0),
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
      enableTaxCredit: false,
      taxCreditRatePercent: 0,
      taxCreditCapPerYear: 0,
      taxCreditLimitByYear: {},
      taxCreditAmountByYear: {},
      taxCreditYieldPercent: 0,
      taxCreditCalendarPostingEnabled: false,
    })
  },
}
