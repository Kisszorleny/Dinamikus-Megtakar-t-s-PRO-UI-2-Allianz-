import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildSignalNyugdijprogramSn005BonusAmountByYear,
  buildSignalNyugdijprogramSn005CollectionFeePlusCostByYear,
  buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear,
  buildSignalNyugdijprogramSn005InitialCostByYear,
  buildSignalNyugdijprogramSn005InvestedShareByYear,
  buildSignalNyugdijprogramSn005MainAssetCostPercentByYear,
  estimateSignalNyugdijprogramSn005DurationYears,
  estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee,
  resolveSignalNyugdijprogramSn005PaymentMethodProfile,
  SIGNAL_NYUGDIJPROGRAM_SN005_ADMIN_PERCENT_OF_REGULAR_PAYMENT,
  SIGNAL_NYUGDIJPROGRAM_SN005_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  SIGNAL_NYUGDIJPROGRAM_SN005_MIN_EXTRAORDINARY_PAYMENT_HUF,
  SIGNAL_NYUGDIJPROGRAM_SN005_PAIDUP_MAINTENANCE_MONTHLY_HUF,
  SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_CAP_HUF,
  SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_RATE_PERCENT,
  SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
  toSignalNyugdijprogramSn005ProductVariantId,
} from "./signal-nyugdijprogram-sn005-config"
import type { ProductDefinition } from "./types"

export const signalNyugdijprogramSn005: ProductDefinition = {
  id: "signal-nyugdijprogram-sn005",
  label: "Signal Nyugdijprogram (SN005)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateSignalNyugdijprogramSn005DurationYears(inputs)
    const paymentMethodProfile = resolveSignalNyugdijprogramSn005PaymentMethodProfile(inputs.productVariant)

    const initialCostByYearDefault = buildSignalNyugdijprogramSn005InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildSignalNyugdijprogramSn005InvestedShareByYear(durationYears)
    const assetCostPercentByYearMainDefault = buildSignalNyugdijprogramSn005MainAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const assetCostPercentByYearExtraDefault = buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const plusCostByYearDefault = buildSignalNyugdijprogramSn005CollectionFeePlusCostByYear(inputs, durationYears)
    const bonusAmountByYearDefault = buildSignalNyugdijprogramSn005BonusAmountByYear(
      inputs,
      durationYears,
      paymentMethodProfile,
    )
    const partialSurrenderFeeDefault = estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee(
      SIGNAL_NYUGDIJPROGRAM_SN005_MIN_EXTRAORDINARY_PAYMENT_HUF,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: inputs.productVariant ?? toSignalNyugdijprogramSn005ProductVariantId(),
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
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults
        ? { ...investedShareByYearDefault, ...(inputs.investedShareByYear ?? {}) }
        : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
      assetCostPercentByYearClient: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYearClient ?? {}) }
        : inputs.assetCostPercentByYearClient,
      assetCostPercentByYearInvested: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYearInvested ?? {}) }
        : inputs.assetCostPercentByYearInvested,
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? { ...assetCostPercentByYearExtraDefault, ...(inputs.assetCostPercentByYearTaxBonus ?? {}) }
        : inputs.assetCostPercentByYearTaxBonus,
      adminFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJPROGRAM_SN005_ADMIN_PERCENT_OF_REGULAR_PAYMENT
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
        ? SIGNAL_NYUGDIJPROGRAM_SN005_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF
        : inputs.minimumBalanceAfterPartialSurrender,
      riskInsuranceEnabled: shouldUseProductDefaults ? false : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
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
      enableTaxCredit: shouldUseProductDefaults ? true : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_RATE_PERCENT
        : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_CAP_HUF
        : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? durationYears : inputs.taxCreditEndYear,
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults
        ? inputs.annualYieldPercent
        : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJPROGRAM_SN005_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJPROGRAM_SN005_PAIDUP_MAINTENANCE_MONTHLY_HUF
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
