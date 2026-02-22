import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildCigNyugdijkotvenyeBonusAmountByYear,
  buildCigNyugdijkotvenyeBonusPercentByYear,
  buildCigNyugdijkotvenyeInitialCostByYear,
  buildCigNyugdijkotvenyeInvestedShareByYear,
  buildCigNyugdijkotvenyeRedemptionFeeByYear,
  CIG_NYUGDIJKOTVENYE_CURRENCY,
  CIG_NYUGDIJKOTVENYE_MIN_BALANCE_AFTER_PARTIAL_SURRENDER,
  CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS,
  CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_REGULAR_MIN,
  CIG_NYUGDIJKOTVENYE_PAID_UP_MAINTENANCE_MONTHLY_AMOUNT,
  CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
  CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT,
  CIG_NYUGDIJKOTVENYE_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
  estimateCigNyugdijkotvenyeDurationYears,
  resolveCigNyugdijkotvenyeAssetFeeAnnualPercent,
  resolveCigNyugdijkotvenyeTaxCreditCapPerYear,
} from "./cig-nyugdijkotvenye-config"
import type { ProductDefinition } from "./types"

export const cigNyugdijkotvenye: ProductDefinition = {
  id: "cig-nyugdijkotvenye",
  label: "CIG Pannonia NyugdijkotvenyE",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateCigNyugdijkotvenyeDurationYears(inputs)
    const initialCostByYearDefault = buildCigNyugdijkotvenyeInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildCigNyugdijkotvenyeInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildCigNyugdijkotvenyeRedemptionFeeByYear(durationYears)
    const bonusAmountByYearDefault = buildCigNyugdijkotvenyeBonusAmountByYear(inputs, durationYears)
    const bonusPercentByYearDefault = buildCigNyugdijkotvenyeBonusPercentByYear(durationYears)
    const assetFeePercentDefault = resolveCigNyugdijkotvenyeAssetFeeAnnualPercent(inputs.selectedFundId)

    return calculateResultsDaily({
      ...inputs,
      currency: CIG_NYUGDIJKOTVENYE_CURRENCY,
      productVariant: CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
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
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? 0
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      riskInsuranceEnabled: shouldUseProductDefaults ? false : inputs.riskInsuranceEnabled,
      // TODO(CIG): Age-based risk fee table not yet available in inputs.
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS : inputs.riskInsuranceEndYear,
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? assetFeePercentDefault : inputs.assetBasedFeePercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      // TODO(CIG): Engine supports fixed partial surrender fee only; percent/min/max logic remains strict TODO.
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? CIG_NYUGDIJKOTVENYE_PARTIAL_SURRENDER_REGULAR_MIN
        : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? CIG_NYUGDIJKOTVENYE_MIN_BALANCE_AFTER_PARTIAL_SURRENDER
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      // TODO(CIG): 8. évtől 1% bónusz a rendszeres díj számla értékére; engine bonusPercentByYear jelenleg teljes számlaértékre számol.
      bonusPercentByYear: shouldUseProductDefaults
        ? { ...bonusPercentByYearDefault, ...(inputs.bonusPercentByYear ?? {}) }
        : inputs.bonusPercentByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      plusCostByYear: inputs.plusCostByYear ?? {},
      enableTaxCredit: true,
      taxCreditRatePercent: shouldUseProductDefaults
        ? CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT
        : (inputs.taxCreditRatePercent ?? CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? resolveCigNyugdijkotvenyeTaxCreditCapPerYear()
        : (inputs.taxCreditCapPerYear ?? resolveCigNyugdijkotvenyeTaxCreditCapPerYear()),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditEndYear ?? 0),
      taxCreditLimitByYear: inputs.taxCreditLimitByYear ?? {},
      taxCreditAmountByYear: inputs.taxCreditAmountByYear ?? {},
      taxCreditYieldPercent: shouldUseProductDefaults ? 1 : (inputs.taxCreditYieldPercent ?? 1),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? true : (inputs.taxCreditCalendarPostingEnabled ?? true),
      isTaxBonusSeparateAccount: true,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? CIG_NYUGDIJKOTVENYE_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? CIG_NYUGDIJKOTVENYE_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT),
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? CIG_NYUGDIJKOTVENYE_PAID_UP_MAINTENANCE_MONTHLY_AMOUNT
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
