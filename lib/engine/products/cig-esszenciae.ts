import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildCigEsszenciaeBonusAmountByYear,
  buildCigEsszenciaeBonusPercentByYear,
  buildCigEsszenciaeInitialCostByYear,
  buildCigEsszenciaeInvestedShareByYear,
  buildCigEsszenciaeRedemptionFeeByYear,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF,
  estimateCigEsszenciaeDurationYears,
  getCigEsszenciaeVariantConfig,
  toCigEsszenciaeProductVariantId,
} from "./cig-esszenciae-config"
import type { ProductDefinition } from "./types"

export const cigEsszenciae: ProductDefinition = {
  id: "cig-esszenciae",
  label: "CIG Pannonia EsszenciaE",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getCigEsszenciaeVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateCigEsszenciaeDurationYears(inputs)
    const initialCostByYearDefault = buildCigEsszenciaeInitialCostByYear(durationYears, variantConfig.variant)
    const investedShareByYearDefault = buildCigEsszenciaeInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildCigEsszenciaeRedemptionFeeByYear(durationYears)
    const bonusAmountByYearDefault = buildCigEsszenciaeBonusAmountByYear(inputs, durationYears, variantConfig.variant)
    const bonusPercentByYearDefault = buildCigEsszenciaeBonusPercentByYear(durationYears)
    const partialSurrenderMinFee =
      variantConfig.currency === "EUR" ? CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR : CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toCigEsszenciaeProductVariantId(variantConfig.variant),
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
      // TODO(CIG_ESSZENCIAE): Risk fee table depends on age and annex tariff; currently disabled by strict flag.
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceEndYear,
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : inputs.assetBasedFeePercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      // TODO(CIG_ESSZENCIAE): Engine supports fixed fee only; percent/min/max per transaction remains strict TODO.
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? partialSurrenderMinFee
        : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? variantConfig.minAnnualPayment
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      // TODO(CIG_ESSZENCIAE): 8. évtől 1% a rendszeres díj számlára; engine jelenleg teljes számlaértékre számol.
      bonusPercentByYear: shouldUseProductDefaults
        ? { ...bonusPercentByYearDefault, ...(inputs.bonusPercentByYear ?? {}) }
        : inputs.bonusPercentByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      plusCostByYear: inputs.plusCostByYear ?? {},
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
        ? variantConfig.paidUpMaintenanceMonthlyAmount
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}
