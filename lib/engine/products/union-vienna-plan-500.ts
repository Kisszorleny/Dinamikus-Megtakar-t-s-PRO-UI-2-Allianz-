import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildUnionViennaPlan500ExtraordinaryEarlySurrenderApproxCostByYear,
  buildUnionViennaPlan500InitialCostByYear,
  buildUnionViennaPlan500InvestedShareByYear,
  buildUnionViennaPlan500LoyaltyBonusAmountByYear,
  buildUnionViennaPlan500MaturityBonusAmountByYear,
  buildUnionViennaPlan500RedemptionFeeByYear,
  estimateUnionViennaPlan500DurationYears,
  estimateUnionViennaPlan500TransactionFee,
  getUnionViennaPlan500VariantConfig,
  resolveUnionViennaPlan500LoyaltyEligibilityProfile,
  resolveUnionViennaPlan500MinimumAnnualPayment,
  resolveUnionViennaPlan500Variant,
  toUnionViennaPlan500ProductVariantId,
  UNION_VIENNA_PLAN_500_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  UNION_VIENNA_PLAN_500_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  UNION_VIENNA_PLAN_500_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT,
  UNION_VIENNA_PLAN_500_REGULAR_ADMIN_FEE_PERCENT,
} from "./union-vienna-plan-500-config"
import type { ProductDefinition } from "./types"

function mergeNumberRecordsSum(
  base: Record<number, number>,
  overrides?: Record<number, number>,
): Record<number, number> {
  if (!overrides) return { ...base }
  const out: Record<number, number> = { ...base }
  for (const [yearRaw, value] of Object.entries(overrides)) {
    const year = Number(yearRaw)
    out[year] = (out[year] ?? 0) + (value ?? 0)
  }
  return out
}

export const unionViennaPlan500: ProductDefinition = {
  id: "union-vienna-plan-500",
  label: "UNION Vienna Plan eletbiztositas (500)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveUnionViennaPlan500Variant(inputs.productVariant, inputs.currency)
    const loyaltyEligibilityProfile = resolveUnionViennaPlan500LoyaltyEligibilityProfile(inputs.productVariant)
    const variantConfig = getUnionViennaPlan500VariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateUnionViennaPlan500DurationYears(inputs)
    const minAnnualPayment = resolveUnionViennaPlan500MinimumAnnualPayment(durationYears, variantConfig)

    const initialCostByYearDefault = buildUnionViennaPlan500InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildUnionViennaPlan500InvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildUnionViennaPlan500RedemptionFeeByYear(durationYears, variantConfig)
    const loyaltyBonusByYearDefault = buildUnionViennaPlan500LoyaltyBonusAmountByYear(
      inputs,
      durationYears,
      variantConfig,
      loyaltyEligibilityProfile,
    )
    const maturityBonusByYearDefault = buildUnionViennaPlan500MaturityBonusAmountByYear(inputs, durationYears)
    const bonusAmountByYearDefault = { ...loyaltyBonusByYearDefault }
    for (const [year, amount] of Object.entries(maturityBonusByYearDefault)) {
      const y = Number(year)
      bonusAmountByYearDefault[y] = (bonusAmountByYearDefault[y] ?? 0) + amount
    }

    const transactionFeeDefault = estimateUnionViennaPlan500TransactionFee(variantConfig.minExtraordinaryPayment, variantConfig)
    const annualizedRiskFee = Math.max(0, minAnnualPayment * (UNION_VIENNA_PLAN_500_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT / 100))
    const extraordinaryEarlySurrenderApproxByYear = buildUnionViennaPlan500ExtraordinaryEarlySurrenderApproxCostByYear(
      inputs,
      durationYears,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: inputs.productVariant ?? toUnionViennaPlan500ProductVariantId(variant, loyaltyEligibilityProfile),
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
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? UNION_VIENNA_PLAN_500_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? UNION_VIENNA_PLAN_500_EXTRAORDINARY_ADMIN_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? annualizedRiskFee / 12 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults
        ? { ...investedShareByYearDefault, ...(inputs.investedShareByYear ?? {}) }
        : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : (inputs.assetBasedFeePercent ?? 0),
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? UNION_VIENNA_PLAN_500_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenancePercentByYear: shouldUseProductDefaults
        ? { ...(inputs.accountMaintenancePercentByYear ?? {}) }
        : inputs.accountMaintenancePercentByYear,
      assetCostPercentByYearTaxBonus: shouldUseProductDefaults
        ? { ...(inputs.assetCostPercentByYearTaxBonus ?? {}) }
        : inputs.assetCostPercentByYearTaxBonus,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults ? 1 : inputs.accountMaintenanceTaxBonusStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults ? 1 : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceClientStartMonth: shouldUseProductDefaults ? 1 : inputs.accountMaintenanceClientStartMonth,
      plusCostByYear: shouldUseProductDefaults
        ? mergeNumberRecordsSum(extraordinaryEarlySurrenderApproxByYear, inputs.plusCostByYear)
        : (inputs.plusCostByYear ?? {}),
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults
        ? { ...redemptionFeeByYearDefault, ...(inputs.redemptionFeeByYear ?? {}) }
        : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? transactionFeeDefault : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? minAnnualPayment
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      enableTaxCredit: shouldUseProductDefaults ? false : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? undefined : inputs.taxCreditEndYear,
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults ? 0 : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? false : inputs.isTaxBonusSeparateAccount,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? 0
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyPercent: shouldUseProductDefaults
        ? UNION_VIENNA_PLAN_500_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : inputs.paidUpMaintenanceFeeMonthlyPercent,
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
      extraordinaryAccountSubtype: shouldUseProductDefaults ? "immediateAccess" : inputs.extraordinaryAccountSubtype,
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : inputs.accountMaintenanceStartMonth,
      assetCostPercentByYearClient: shouldUseProductDefaults
        ? { ...(inputs.assetCostPercentByYearClient ?? {}) }
        : inputs.assetCostPercentByYearClient,
      assetCostPercentByYearInvested: shouldUseProductDefaults
        ? { ...(inputs.assetCostPercentByYearInvested ?? {}) }
        : inputs.assetCostPercentByYearInvested,
    })
  },
}
