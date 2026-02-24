import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildMetlifeManhattanAssetCostPercentByYear,
  buildMetlifeManhattanInitialCostByYear,
  buildMetlifeManhattanInvestedShareByYear,
  buildMetlifeManhattanRedemptionFeeByYear,
  buildMetlifeManhattanRegularBonusAmountByYear,
  estimateMetlifeManhattanDurationYears,
  getMetlifeManhattanVariantConfig,
  toMetlifeManhattanProductVariantId,
} from "./metlife-manhattan-config"
import type { ProductDefinition } from "./types"

export const metlifeManhattan: ProductDefinition = {
  id: "metlife-manhattan",
  label: "MetLife Manhattan",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getMetlifeManhattanVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateMetlifeManhattanDurationYears(inputs)

    const initialCostByYearDefault = buildMetlifeManhattanInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildMetlifeManhattanInvestedShareByYear(durationYears)
    const assetCostPercentByYearDefault = buildMetlifeManhattanAssetCostPercentByYear(durationYears)
    const redemptionFeeByYearDefault = buildMetlifeManhattanRedemptionFeeByYear(durationYears)
    const regularBonusAmountByYearDefault = buildMetlifeManhattanRegularBonusAmountByYear(
      inputs,
      durationYears,
      variantConfig.currency,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toMetlifeManhattanProductVariantId(variantConfig.variant),
      durationUnit: "year",
      durationValue: durationYears,
      yearsPlanned: durationYears,
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      yearlyWithdrawalsPlan: inputs.yearlyWithdrawalsPlan ?? [],
      yearlyExtraTaxEligiblePaymentsPlan: inputs.yearlyExtraTaxEligiblePaymentsPlan ?? [],
      yearlyExtraImmediateAccessPaymentsPlan: inputs.yearlyExtraImmediateAccessPaymentsPlan ?? [],
      yearlyExtraImmediateAccessWithdrawalsPlan: inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "payment" : inputs.initialCostBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? false : inputs.riskInsuranceEnabled,
      // TODO(METLIFE_MANHATTAN): Add age/tariff-based monthly risk fee resolver in V2.
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : (inputs.riskInsuranceStartYear ?? 1),
      riskInsuranceEndYear: shouldUseProductDefaults ? 1 : (inputs.riskInsuranceEndYear ?? 1),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
      adminFeeMonthlyAmount: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceMonthlyAmount
        : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? 0
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults
        ? { ...redemptionFeeByYearDefault, ...(inputs.redemptionFeeByYear ?? {}) }
        : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      // TODO(METLIFE_MANHATTAN): Strictly block partial surrender before year 3 in V2 event-level logic.
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? variantConfig.partialSurrenderFixedFeeAmount
        : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? variantConfig.partialSurrenderMinimumBalanceAfterAmount
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...regularBonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      plusCostByYear: inputs.plusCostByYear ?? {},
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: false,
      taxCreditRatePercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditStartYear ?? 0),
      taxCreditEndYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditEndYear ?? 0),
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: false,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
