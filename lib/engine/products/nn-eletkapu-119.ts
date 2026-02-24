import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildNnEletkapu119AssetCostPercentByYear,
  buildNnEletkapu119InitialCostByYear,
  buildNnEletkapu119InvestedShareByYear,
  buildNnEletkapu119RedemptionFeeByYear,
  estimateNnEletkapu119DurationYears,
  estimateNnEletkapu119PartialSurrenderFixedFee,
  getNnEletkapu119VariantConfig,
  NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF,
  NN_ELETKAPU_119_MIN_PARTIAL_SURRENDER_HUF,
  NN_ELETKAPU_119_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured,
  resolveNnEletkapu119AdminMonthlyAmount,
  resolveNnEletkapu119ExtraordinarySalesPercent,
  toNnEletkapu119ProductVariantId,
} from "./nn-eletkapu-119-config"
import type { ProductDefinition } from "./types"

export const nnEletkapu119: ProductDefinition = {
  id: "nn-eletkapu-119",
  label: "NN Életkapu 119",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateNnEletkapu119DurationYears(inputs)
    const variantConfig = getNnEletkapu119VariantConfig(durationYears)

    const initialCostByYearDefault = buildNnEletkapu119InitialCostByYear(inputs, durationYears)
    const investedShareByYearDefault = buildNnEletkapu119InvestedShareByYear(durationYears)
    const assetCostPercentByYearDefault = buildNnEletkapu119AssetCostPercentByYear(durationYears, "general-equity")
    const redemptionFeeByYearDefault = buildNnEletkapu119RedemptionFeeByYear(durationYears)

    const adminMonthlyDefault = resolveNnEletkapu119AdminMonthlyAmount(inputs.frequency, "non-postal", "paid")
    const riskFeeMonthlyDefault = resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured(Math.round(inputs.insuredEntryAge ?? 38))
    const extraordinarySalesPercentDefault = resolveNnEletkapu119ExtraordinarySalesPercent(
      variantConfig.minExtraordinaryPayment,
      "paid",
    )
    const partialSurrenderFeeDefault = estimateNnEletkapu119PartialSurrenderFixedFee(NN_ELETKAPU_119_MIN_PARTIAL_SURRENDER_HUF)

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: toNnEletkapu119ProductVariantId(),
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
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults
        ? riskFeeMonthlyDefault
        : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : (inputs.riskInsuranceStartYear ?? 1),
      riskInsuranceEndYear: shouldUseProductDefaults ? durationYears : (inputs.riskInsuranceEndYear ?? durationYears),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
      adminFeeMonthlyAmount: shouldUseProductDefaults ? adminMonthlyDefault : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? extraordinarySalesPercentDefault
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
      partialSurrenderFeeAmount: shouldUseProductDefaults ? partialSurrenderFeeDefault : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? NN_ELETKAPU_119_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults ? {} : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      plusCostByYear: shouldUseProductDefaults ? (inputs.plusCostByYear ?? {}) : (inputs.plusCostByYear ?? {}),
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
