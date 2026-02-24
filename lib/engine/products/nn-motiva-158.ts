import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildNnMotiva158AssetCostPercentByYear,
  buildNnMotiva158InitialCostByYear,
  buildNnMotiva158InvestedShareByYear,
  buildNnMotiva158RedemptionFeeByYear,
  estimateNnMotiva158DurationYears,
  getNnMotiva158VariantConfig,
  NN_MOTIVA_168_TAX_CREDIT_CAP_PER_YEAR_EUR,
  NN_MOTIVA_158_ADMIN_MONTHLY_PAID_UP_HUF,
  NN_MOTIVA_158_TAX_CREDIT_CAP_PER_YEAR_HUF,
  NN_MOTIVA_158_TAX_CREDIT_RATE_PERCENT,
  resolveNnMotiva158AccidentDeathMonthlyFeePerInsured,
  resolveNnMotiva158AdminMonthlyAmount,
  resolveNnMotiva158ExtraordinarySalesPercent,
  resolveNnMotiva158VariantFromInputs,
  toNnMotiva158ProductVariantId,
} from "./nn-motiva-158-config"
import type { ProductDefinition } from "./types"

export const nnMotiva158: ProductDefinition = {
  id: "nn-motiva-158",
  label: "NN Motiva 158",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateNnMotiva158DurationYears(inputs)
    const variant = resolveNnMotiva158VariantFromInputs(inputs)
    const variantConfig = getNnMotiva158VariantConfig(durationYears, variant)

    const initialCostByYearDefault = buildNnMotiva158InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildNnMotiva158InvestedShareByYear(durationYears)
    const assetCostPercentByYearDefault = buildNnMotiva158AssetCostPercentByYear(durationYears, "general-equity")
    const redemptionFeeByYearDefault = buildNnMotiva158RedemptionFeeByYear(durationYears)

    const adminMonthlyDefault = resolveNnMotiva158AdminMonthlyAmount(inputs.frequency, "non-postal", "paid", variant)
    const riskFeeMonthlyDefault = resolveNnMotiva158AccidentDeathMonthlyFeePerInsured(variant)
    const extraordinarySalesPercentDefault = resolveNnMotiva158ExtraordinarySalesPercent(
      variantConfig.minMonthlyPayment * 12,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toNnMotiva158ProductVariantId(variant),
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
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? buildNnMotiva158AssetCostPercentByYear(durationYears, "tax-credit-collector")
        : inputs.assetCostPercentByYearTaxBonus,
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
      allowWithdrawals: shouldUseProductDefaults ? false : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? false : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? 0 : (inputs.partialSurrenderFeeAmount ?? 0),
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults ? {} : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      plusCostByYear: shouldUseProductDefaults ? (inputs.plusCostByYear ?? {}) : (inputs.plusCostByYear ?? {}),
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: shouldUseProductDefaults ? true : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults
        ? NN_MOTIVA_158_TAX_CREDIT_RATE_PERCENT
        : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? (variant === "eur" ? NN_MOTIVA_168_TAX_CREDIT_CAP_PER_YEAR_EUR : NN_MOTIVA_158_TAX_CREDIT_CAP_PER_YEAR_HUF)
        : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? durationYears : (inputs.taxCreditEndYear ?? durationYears),
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : (inputs.isTaxBonusSeparateAccount ?? true),
      taxCreditToInvestedAccount: shouldUseProductDefaults ? false : inputs.taxCreditToInvestedAccount,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? 0
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? resolveNnMotiva158AdminMonthlyAmount(inputs.frequency, "non-postal", "paid-up", variant) ||
          NN_MOTIVA_158_ADMIN_MONTHLY_PAID_UP_HUF
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
