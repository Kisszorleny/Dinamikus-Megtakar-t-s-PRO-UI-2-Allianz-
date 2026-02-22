import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildGeneraliMylifeExtraPluszAdminPlusCostByYear,
  buildGeneraliMylifeExtraPluszBonusOnContributionPercentByYear,
  buildGeneraliMylifeExtraPluszInitialCostByYear,
  buildGeneraliMylifeExtraPluszInvestedShareByYear,
  buildGeneraliMylifeExtraPluszLoyaltyBonusAmountByYear,
  buildGeneraliMylifeExtraPluszRedemptionFeeByYear,
  buildGeneraliMylifeExtraPluszWealthBonusPercentByYear,
  estimateGeneraliMylifeExtraPluszDurationYears,
  GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
  GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
  GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE,
  GENERALI_MYLIFE_EXTRA_PLUSZ_EXTRA_DISTRIBUTION_FEE_PERCENT,
  GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_BALANCE_AFTER_PARTIAL_SURRENDER,
  GENERALI_MYLIFE_EXTRA_PLUSZ_POLICY_ISSUANCE_FEE_AMOUNT,
  GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_RATE_PERCENT,
  getGeneraliMylifeExtraPluszVariantConfig,
  resolveGeneraliMylifeExtraPluszAccountMaintenanceMonthlyPercent,
  resolveGeneraliMylifeExtraPluszTaxCreditCapPerYear,
  toGeneraliMylifeExtraPluszProductVariantId,
} from "./generali-mylife-extra-plusz-config"
import type { ProductDefinition } from "./types"

function mergeBonusAmountByYear(...maps: Array<Record<number, number> | undefined>): Record<number, number> {
  const out: Record<number, number> = {}
  for (const map of maps) {
    if (!map) continue
    for (const [yearKey, amount] of Object.entries(map)) {
      const year = Number(yearKey)
      out[year] = (out[year] ?? 0) + Math.max(0, amount)
    }
  }
  return out
}

function resolveGeneraliMylifeExtraPluszPlusCosts(
  durationYears: number,
  inputs: InputsDaily,
  defaultAdminPlusCostByYear: Record<number, number>,
): Record<number, number> {
  const merged: Record<number, number> = {}
  for (let year = 1; year <= durationYears; year++) {
    merged[year] = defaultAdminPlusCostByYear[year] ?? 0
  }
  for (const [yearKey, amount] of Object.entries(inputs.plusCostByYear ?? {})) {
    const year = Number(yearKey)
    merged[year] = (merged[year] ?? 0) + Math.max(0, amount)
  }
  if (!GENERALI_MYLIFE_EXTRA_PLUSZ_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE) return merged
  const isCancelledWithinWindow = (inputs.productVariant ?? "").toLowerCase().includes("cancel30")
  if (!isCancelledWithinWindow) return merged
  merged[1] = (merged[1] ?? 0) + GENERALI_MYLIFE_EXTRA_PLUSZ_POLICY_ISSUANCE_FEE_AMOUNT
  return merged
}

export const generaliMylifeExtraPlusz: ProductDefinition = {
  id: "generali-mylife-extra-plusz",
  label: "Generali MyLife Extra Plusz (U67P)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getGeneraliMylifeExtraPluszVariantConfig(inputs.productVariant, inputs.enableTaxCredit)
    const durationYears = estimateGeneraliMylifeExtraPluszDurationYears(inputs, variantConfig)
    const initialCostByYearDefault = buildGeneraliMylifeExtraPluszInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildGeneraliMylifeExtraPluszInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildGeneraliMylifeExtraPluszRedemptionFeeByYear(durationYears)
    const bonusOnContributionPercentByYearDefault = buildGeneraliMylifeExtraPluszBonusOnContributionPercentByYear(
      inputs,
      durationYears,
    )
    const wealthBonusPercentByYearDefault = buildGeneraliMylifeExtraPluszWealthBonusPercentByYear(durationYears)
    const loyaltyBonusAmountByYearDefault = buildGeneraliMylifeExtraPluszLoyaltyBonusAmountByYear(inputs, durationYears)
    const bonusAmountByYearDefault = mergeBonusAmountByYear(loyaltyBonusAmountByYearDefault)
    const adminPlusCostByYearDefault = buildGeneraliMylifeExtraPluszAdminPlusCostByYear(inputs, durationYears)
    const plusCostByYearDefault = resolveGeneraliMylifeExtraPluszPlusCosts(durationYears, inputs, adminPlusCostByYearDefault)

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toGeneraliMylifeExtraPluszProductVariantId(variantConfig.variant),
      durationUnit: "year",
      durationValue: durationYears,
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      yearlyWithdrawalsPlan: inputs.yearlyWithdrawalsPlan ?? [],
      yearlyExtraTaxEligiblePaymentsPlan: inputs.yearlyExtraTaxEligiblePaymentsPlan ?? [],
      yearlyExtraImmediateAccessPaymentsPlan: inputs.yearlyExtraImmediateAccessPaymentsPlan ?? [],
      yearlyExtraImmediateAccessWithdrawalsPlan: inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults ? 0 : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? GENERALI_MYLIFE_EXTRA_PLUSZ_EXTRA_DISTRIBUTION_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults ? 0 : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? 1 : inputs.riskInsuranceEndYear,
      isAccountSplitOpen: shouldUseProductDefaults ? false : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? false : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? resolveGeneraliMylifeExtraPluszAccountMaintenanceMonthlyPercent(inputs.selectedFundId)
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? GENERALI_MYLIFE_EXTRA_PLUSZ_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? 0 : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? GENERALI_MYLIFE_EXTRA_PLUSZ_MIN_BALANCE_AFTER_PARTIAL_SURRENDER
        : inputs.minimumBalanceAfterPartialSurrender,
      plusCostByYear: shouldUseProductDefaults ? plusCostByYearDefault : inputs.plusCostByYear,
      bonusMode: shouldUseProductDefaults ? "percentOnContribution" : inputs.bonusMode,
      bonusOnContributionPercent: shouldUseProductDefaults ? 0 : (inputs.bonusOnContributionPercent ?? 0),
      bonusOnContributionPercentByYear: shouldUseProductDefaults
        ? { ...bonusOnContributionPercentByYearDefault, ...(inputs.bonusOnContributionPercentByYear ?? {}) }
        : inputs.bonusOnContributionPercentByYear,
      bonusPercentByYear: shouldUseProductDefaults
        ? { ...wealthBonusPercentByYearDefault, ...(inputs.bonusPercentByYear ?? {}) }
        : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: variantConfig.taxCreditAllowed ? (inputs.enableTaxCredit ?? true) : false,
      taxCreditRatePercent: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditRatePercent ?? GENERALI_MYLIFE_EXTRA_PLUSZ_TAX_CREDIT_RATE_PERCENT)
        : 0,
      taxCreditCapPerYear: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditCapPerYear ?? resolveGeneraliMylifeExtraPluszTaxCreditCapPerYear())
        : 0,
      taxCreditStartYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditStartYear ?? 1) : 0,
      taxCreditEndYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditEndYear ?? 0) : 0,
      taxCreditLimitByYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditLimitByYear ?? {}) : {},
      taxCreditAmountByYear: variantConfig.taxCreditAllowed ? (inputs.taxCreditAmountByYear ?? {}) : {},
      taxCreditYieldPercent: variantConfig.taxCreditAllowed ? (inputs.taxCreditYieldPercent ?? 1) : 0,
      taxCreditRepaymentOnSurrenderPercent: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditRepaymentOnSurrenderPercent ?? variantConfig.taxCreditRepaymentOnSurrenderPercent)
        : 0,
      taxCreditCalendarPostingEnabled: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditCalendarPostingEnabled ?? true)
        : false,
      isTaxBonusSeparateAccount: variantConfig.taxCreditAllowed,
    })
  },
}
