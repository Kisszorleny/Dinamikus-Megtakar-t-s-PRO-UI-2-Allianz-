import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildSignalOngondoskodasiWl009AdminFeePercentByYear,
  buildSignalOngondoskodasiWl009BonusAmountByYear,
  buildSignalOngondoskodasiWl009ExtraAndLoyaltyAssetCostPercentByYear,
  buildSignalOngondoskodasiWl009HozampluszBonusPercentByYear,
  buildSignalOngondoskodasiWl009InitialCostByYear,
  buildSignalOngondoskodasiWl009MainAssetCostPercentByYear,
  estimateSignalOngondoskodasiWl009DurationYears,
  estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee,
  SIGNAL_ONGONDOSKODASI_WL009_EXTRAORDINARY_ADMIN_PERCENT,
  SIGNAL_ONGONDOSKODASI_WL009_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  SIGNAL_ONGONDOSKODASI_WL009_MIN_EXTRAORDINARY_PAYMENT_HUF,
  SIGNAL_ONGONDOSKODASI_WL009_PAIDUP_MAINTENANCE_MONTHLY_HUF,
  toSignalOngondoskodasiWl009ProductVariantId,
} from "./signal-ongondoskodasi-wl009-config"
import type { ProductDefinition } from "./types"

export const signalOngondoskodasiWl009: ProductDefinition = {
  id: "signal-ongondoskodasi-wl009",
  label: "Signal Öngondoskodási terv 2.0 Plusz (WL009)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateSignalOngondoskodasiWl009DurationYears(inputs)

    const initialCostByYearDefault = buildSignalOngondoskodasiWl009InitialCostByYear(durationYears)
    const adminFeePercentByYearDefault = buildSignalOngondoskodasiWl009AdminFeePercentByYear(durationYears)
    const assetCostPercentByYearMainDefault = buildSignalOngondoskodasiWl009MainAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const assetCostPercentByYearExtraAndLoyaltyDefault =
      buildSignalOngondoskodasiWl009ExtraAndLoyaltyAssetCostPercentByYear(durationYears, inputs.selectedFundId)
    const bonusAmountByYearDefault = buildSignalOngondoskodasiWl009BonusAmountByYear({ inputs, durationYears })
    const bonusPercentByYearDefault = buildSignalOngondoskodasiWl009HozampluszBonusPercentByYear(durationYears)
    const partialSurrenderFeeDefault = estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee(
      SIGNAL_ONGONDOSKODASI_WL009_MIN_EXTRAORDINARY_PAYMENT_HUF,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: inputs.productVariant ?? toSignalOngondoskodasiWl009ProductVariantId(),
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
      adminFeePercentByYear: shouldUseProductDefaults
        ? { ...adminFeePercentByYearDefault, ...(inputs.adminFeePercentByYear ?? {}) }
        : inputs.adminFeePercentByYear,
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? SIGNAL_ONGONDOSKODASI_WL009_EXTRAORDINARY_ADMIN_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? {} : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? {
            ...assetCostPercentByYearExtraAndLoyaltyDefault,
            ...(inputs.assetCostPercentByYearTaxBonus ?? {}),
          }
        : inputs.assetCostPercentByYearTaxBonus,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? {} : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? partialSurrenderFeeDefault : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? SIGNAL_ONGONDOSKODASI_WL009_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? SIGNAL_ONGONDOSKODASI_WL009_PAIDUP_MAINTENANCE_MONTHLY_HUF
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
      enableTaxCredit: false,
      taxCreditRatePercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditCapPerYear ?? 0),
      isTaxBonusSeparateAccount: false,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
    })
  },
}
