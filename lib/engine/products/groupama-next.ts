import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildGroupamaNextAssetCostPercentByYear,
  buildGroupamaNextInvestedShareByYear,
  buildGroupamaNextPolicyFeeByYear,
  estimateGroupamaNextDurationYears,
  getGroupamaNextVariantConfig,
  resolveGroupamaNextAccountMaintenanceMonthlyPercent,
  resolveGroupamaNextAdminMonthlyFee,
  resolveGroupamaNextMinimumAnnualPayment,
  resolveGroupamaNextRiskMonthlyFee,
  resolveGroupamaNextVariant,
  toGroupamaNextProductVariantId,
} from "./groupama-next-config"
import type { ProductDefinition } from "./types"

function resolveObservedBaselineAnnualPayment(inputs: InputsDaily, durationYears: number): number {
  const minimumAnnualPayment = resolveGroupamaNextMinimumAnnualPayment()
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= durationYears; year++) {
    const payment = Math.max(0, yearlyPayments[year] ?? 0)
    if (payment > 0) return Math.max(minimumAnnualPayment, payment)
  }
  return minimumAnnualPayment
}

export const groupamaNext: ProductDefinition = {
  id: "groupama-next",
  label: "Groupama Next Eletbiztositas",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateGroupamaNextDurationYears(inputs)
    const variant = resolveGroupamaNextVariant(inputs.productVariant)
    const variantConfig = getGroupamaNextVariantConfig(inputs.productVariant)
    const observedAnnualPayment = resolveObservedBaselineAnnualPayment(inputs, durationYears)

    const investedShareByYearDefault = buildGroupamaNextInvestedShareByYear(durationYears, variant)
    const assetCostPercentByYearDefault = buildGroupamaNextAssetCostPercentByYear(
      durationYears,
      variant,
      false,
      false,
    )
    const plusCostByYearDefault = buildGroupamaNextPolicyFeeByYear(durationYears)

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: toGroupamaNextProductVariantId(variant),
      durationUnit: "year",
      durationValue: durationYears,
      yearsPlanned: durationYears,
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      yearlyWithdrawalsPlan: inputs.yearlyWithdrawalsPlan ?? [],
      yearlyExtraTaxEligiblePaymentsPlan: inputs.yearlyExtraTaxEligiblePaymentsPlan ?? [],
      yearlyExtraImmediateAccessPaymentsPlan: inputs.yearlyExtraImmediateAccessPaymentsPlan ?? [],
      yearlyExtraImmediateAccessWithdrawalsPlan: inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults ? {} : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "payment" : inputs.initialCostBaseMode,
      adminFeeMonthlyAmount: shouldUseProductDefaults
        ? resolveGroupamaNextAdminMonthlyFee(false)
        : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults
        ? resolveGroupamaNextRiskMonthlyFee()
        : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : (inputs.riskInsuranceStartYear ?? 1),
      riskInsuranceEndYear: shouldUseProductDefaults ? durationYears : inputs.riskInsuranceEndYear,
      isAccountSplitOpen: shouldUseProductDefaults ? false : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? false : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults
        ? { ...investedShareByYearDefault, ...(inputs.investedShareByYear ?? {}) }
        : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? variantConfig.ulSharePercent : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? resolveGroupamaNextAccountMaintenanceMonthlyPercent()
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? false : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? {} : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? 0 : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? observedAnnualPayment
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults ? {} : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      plusCostByYear: shouldUseProductDefaults
        ? { ...plusCostByYearDefault, ...(inputs.plusCostByYear ?? {}) }
        : (inputs.plusCostByYear ?? {}),
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
