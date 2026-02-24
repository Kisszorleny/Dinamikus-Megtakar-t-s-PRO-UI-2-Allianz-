import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildSignalElorelatoUl001BonusAmountByYear,
  buildSignalElorelatoUl001CollectionFeePlusCostByYear,
  buildSignalElorelatoUl001ExtraAssetCostPercentByYear,
  buildSignalElorelatoUl001InitialCostByYear,
  buildSignalElorelatoUl001InvestedShareByYear,
  buildSignalElorelatoUl001MainAssetCostPercentByYear,
  estimateSignalElorelatoUl001DurationYears,
  estimateSignalElorelatoUl001PartialSurrenderFixedFee,
  getSignalElorelatoUl001VariantConfig,
  resolveSignalElorelatoUl001RuntimeProfiles,
  SIGNAL_ELORELATO_UL001_ADMIN_PERCENT_OF_REGULAR_PAYMENT,
  SIGNAL_ELORELATO_UL001_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  SIGNAL_ELORELATO_UL001_MIN_EXTRAORDINARY_PAYMENT_HUF,
  toSignalElorelatoUl001ProductVariantId,
} from "./signal-elorelato-ul001-config"
import type { ProductDefinition } from "./types"

export const signalElorelatoUl001: ProductDefinition = {
  id: "signal-elorelato-ul001",
  label: "Signal Iduna Előrelátó Program (UL001)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateSignalElorelatoUl001DurationYears(inputs)
    const variantConfig = getSignalElorelatoUl001VariantConfig()
    const runtimeProfiles = resolveSignalElorelatoUl001RuntimeProfiles(inputs.productVariant)

    const initialCostByYearDefault = buildSignalElorelatoUl001InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildSignalElorelatoUl001InvestedShareByYear(durationYears)
    const assetCostPercentByYearDefault = buildSignalElorelatoUl001MainAssetCostPercentByYear(
      durationYears,
      runtimeProfiles.vakProfile,
    )
    const assetCostPercentByYearExtraDefault = buildSignalElorelatoUl001ExtraAssetCostPercentByYear(
      durationYears,
      runtimeProfiles.vakProfile,
    )
    const plusCostByYearDefault = buildSignalElorelatoUl001CollectionFeePlusCostByYear(inputs, durationYears)
    const bonusAmountByYearDefault = buildSignalElorelatoUl001BonusAmountByYear(
      inputs,
      durationYears,
      runtimeProfiles.paymentMethodProfile,
      runtimeProfiles.loyaltyBonusEnabled,
    )
    const partialSurrenderFeeDefault = estimateSignalElorelatoUl001PartialSurrenderFixedFee(
      SIGNAL_ELORELATO_UL001_MIN_EXTRAORDINARY_PAYMENT_HUF,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: inputs.productVariant ?? toSignalElorelatoUl001ProductVariantId(),
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
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? { ...assetCostPercentByYearExtraDefault, ...(inputs.assetCostPercentByYearTaxBonus ?? {}) }
        : inputs.assetCostPercentByYearTaxBonus,
      adminFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? SIGNAL_ELORELATO_UL001_ADMIN_PERCENT_OF_REGULAR_PAYMENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? 0
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? {} : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? partialSurrenderFeeDefault : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? SIGNAL_ELORELATO_UL001_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults ? 500 : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
