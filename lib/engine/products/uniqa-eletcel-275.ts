import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildUniqaEletcel275AssetCostPercentByYearMain,
  buildUniqaEletcel275InitialCostByYear,
  buildUniqaEletcel275InvestedShareByYear,
  buildUniqaEletcel275RedemptionFeeByYear,
  buildUniqaEletcel275RegularFeePercentByYear,
  estimateUniqaEletcel275DurationYears,
  resolveUniqaEletcel275MinimumAnnualPayment,
  toUniqaEletcel275ProductVariantId,
  UNIQA_ELETCEL_275_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  UNIQA_ELETCEL_275_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  UNIQA_ELETCEL_275_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT,
} from "./uniqa-eletcel-275-config"
import type { ProductDefinition } from "./types"

function resolveObservedBaselineAnnualPayment(inputs: InputsDaily, durationYears: number): number {
  const minimumAnnualPayment = resolveUniqaEletcel275MinimumAnnualPayment()
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  for (let year = 1; year <= durationYears; year++) {
    const payment = Math.max(0, yearlyPayments[year] ?? 0)
    if (payment > 0) return Math.max(minimumAnnualPayment, payment)
  }
  return minimumAnnualPayment
}

export const uniqaEletcel275: ProductDefinition = {
  id: "uniqa-eletcel-275",
  label: "UNIQA Eletcel (275)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateUniqaEletcel275DurationYears(inputs)
    const minimumAnnualPayment = resolveUniqaEletcel275MinimumAnnualPayment()
    const baselineAnnualPayment = resolveObservedBaselineAnnualPayment(inputs, durationYears)

    const initialCostByYearDefault = buildUniqaEletcel275InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildUniqaEletcel275InvestedShareByYear(durationYears)
    const assetCostPercentByYearDefault = buildUniqaEletcel275AssetCostPercentByYearMain(durationYears)
    const redemptionFeeByYearDefault = buildUniqaEletcel275RedemptionFeeByYear(durationYears)
    const adminFeePercentByYearDefault = buildUniqaEletcel275RegularFeePercentByYear(baselineAnnualPayment, durationYears)

    const annualizedRiskFee = Math.max(
      0,
      baselineAnnualPayment * (UNIQA_ELETCEL_275_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT / 100),
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: toUniqaEletcel275ProductVariantId(),
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
        ? UNIQA_ELETCEL_275_EXTRAORDINARY_ADMIN_FEE_PERCENT
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
      assetCostPercentByYear: shouldUseProductDefaults
        ? { ...assetCostPercentByYearDefault, ...(inputs.assetCostPercentByYear ?? {}) }
        : inputs.assetCostPercentByYear,
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
        ? Math.max(minimumAnnualPayment, UNIQA_ELETCEL_275_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF)
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
