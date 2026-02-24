import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildUniqaPremiumLife190ExtraAssetCostPercentByYear,
  buildUniqaPremiumLife190InitialCostByYear,
  buildUniqaPremiumLife190InvestedShareByYear,
  buildUniqaPremiumLife190MainAssetCostPercentByYear,
  buildUniqaPremiumLife190RedemptionFeeByYear,
  buildUniqaPremiumLife190RegularFeePercentByYear,
  estimateUniqaPremiumLife190DurationYears,
  resolveUniqaPremiumLife190MinimumAnnualPayment,
  toUniqaPremiumLife190ProductVariantId,
  UNIQA_PREMIUM_LIFE_190_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  UNIQA_PREMIUM_LIFE_190_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  UNIQA_PREMIUM_LIFE_190_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT,
} from "./uniqa-premium-life-190-config"
import type { ProductDefinition } from "./types"

function resolveObservedBaselineAnnualPayment(inputs: InputsDaily, durationYears: number): number {
  const minimumAnnualPayment = resolveUniqaPremiumLife190MinimumAnnualPayment()
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= durationYears; year++) {
    const payment = Math.max(0, yearlyPayments[year] ?? 0)
    if (payment > 0) return Math.max(minimumAnnualPayment, payment)
  }
  return minimumAnnualPayment
}

export const uniqaPremiumLife190: ProductDefinition = {
  id: "uniqa-premium-life-190",
  label: "UNIQA Premium Life (190)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateUniqaPremiumLife190DurationYears(inputs)
    const minimumAnnualPayment = resolveUniqaPremiumLife190MinimumAnnualPayment()
    const baselineAnnualPayment = resolveObservedBaselineAnnualPayment(inputs, durationYears)

    const initialCostByYearDefault = buildUniqaPremiumLife190InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildUniqaPremiumLife190InvestedShareByYear(durationYears)
    const adminFeePercentByYearDefault = buildUniqaPremiumLife190RegularFeePercentByYear(
      baselineAnnualPayment,
      durationYears,
    )
    const redemptionFeeByYearDefault = buildUniqaPremiumLife190RedemptionFeeByYear(durationYears)
    const assetCostPercentByYearMainDefault = buildUniqaPremiumLife190MainAssetCostPercentByYear(
      durationYears,
      inputs.selectedFundId,
    )
    const assetCostPercentByYearExtraDefault = buildUniqaPremiumLife190ExtraAssetCostPercentByYear(durationYears)

    const annualizedRiskFee = Math.max(
      0,
      baselineAnnualPayment * (UNIQA_PREMIUM_LIFE_190_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT / 100),
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: toUniqaPremiumLife190ProductVariantId(),
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
      adminFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.adminFeeMonthlyAmount ?? 0),
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      adminFeePercentByYear: shouldUseProductDefaults
        ? { ...adminFeePercentByYearDefault, ...(inputs.adminFeePercentByYear ?? {}) }
        : inputs.adminFeePercentByYear,
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? UNIQA_PREMIUM_LIFE_190_EXTRAORDINARY_ADMIN_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults
        ? annualizedRiskFee / 12
        : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults
        ? { ...investedShareByYearDefault, ...(inputs.investedShareByYear ?? {}) }
        : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      assetCostPercentByYearClient: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYearClient ?? {}) }
        : inputs.assetCostPercentByYearClient,
      assetCostPercentByYearInvested: shouldUseProductDefaults
        ? { ...assetCostPercentByYearMainDefault, ...(inputs.assetCostPercentByYearInvested ?? {}) }
        : inputs.assetCostPercentByYearInvested,
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? { ...assetCostPercentByYearExtraDefault, ...(inputs.assetCostPercentByYearTaxBonus ?? {}) }
        : inputs.assetCostPercentByYearTaxBonus,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults
        ? { ...redemptionFeeByYearDefault, ...(inputs.redemptionFeeByYear ?? {}) }
        : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? 0 : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? Math.max(minimumAnnualPayment, UNIQA_PREMIUM_LIFE_190_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF)
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}

