import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildSignalNyugdijTervPluszNy010BonusAmountByYear,
  buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear,
  buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear,
  buildSignalNyugdijTervPluszNy010InitialCostByYear,
  buildSignalNyugdijTervPluszNy010InvestedShareByYear,
  buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear,
  estimateSignalNyugdijTervPluszNy010DurationYears,
  estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ADMIN_PERCENT_OF_REGULAR_PAYMENT,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_EXTRAORDINARY_ADMIN_PERCENT_OF_PAYMENT,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_EXTRAORDINARY_PAYMENT_HUF,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PAIDUP_MAINTENANCE_MONTHLY_HUF,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_CAP_HUF,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_RATE_PERCENT,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
  toSignalNyugdijTervPluszNy010ProductVariantId,
} from "./signal-nyugdij-terv-plusz-ny010-config"
import type { ProductDefinition } from "./types"

export const signalNyugdijTervPluszNy010: ProductDefinition = {
  id: "signal-nyugdij-terv-plusz-ny010",
  label: "SIGNAL Nyugdij Terv Plusz (NY010)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateSignalNyugdijTervPluszNy010DurationYears(inputs)

    const initialCostByYearDefault = buildSignalNyugdijTervPluszNy010InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildSignalNyugdijTervPluszNy010InvestedShareByYear(durationYears)
    const assetCostPercentByYearMainDefault = buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const assetCostPercentByYearExtraDefault = buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const bonusAmountByYearDefault = buildSignalNyugdijTervPluszNy010BonusAmountByYear(inputs, durationYears)
    const bonusPercentByYearDefault = buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear(durationYears)
    const partialSurrenderFeeDefault = estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee(
      SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_EXTRAORDINARY_PAYMENT_HUF,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: inputs.productVariant ?? toSignalNyugdijTervPluszNy010ProductVariantId(),
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
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_ADMIN_PERCENT_OF_REGULAR_PAYMENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_EXTRAORDINARY_ADMIN_PERCENT_OF_PAYMENT
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
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF
        : inputs.minimumBalanceAfterPartialSurrender,
      riskInsuranceEnabled: shouldUseProductDefaults ? false : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults
        ? { ...bonusPercentByYearDefault, ...(inputs.bonusPercentByYear ?? {}) }
        : inputs.bonusPercentByYear,
      plusCostByYear: shouldUseProductDefaults ? { ...(inputs.plusCostByYear ?? {}) } : (inputs.plusCostByYear ?? {}),
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: shouldUseProductDefaults ? true : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_RATE_PERCENT
        : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_CAP_HUF
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
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PAIDUP_MAINTENANCE_MONTHLY_HUF
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
