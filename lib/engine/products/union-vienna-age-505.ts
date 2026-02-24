import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildUnionViennaAge505InitialCostByYear,
  buildUnionViennaAge505InvestedShareByYear,
  buildUnionViennaAge505LoyaltyBonusAmountByYear,
  buildUnionViennaAge505MaturityBonusAmountByYear,
  buildUnionViennaAge505RedemptionFeeByYear,
  estimateUnionViennaAge505DurationYears,
  estimateUnionViennaAge505TransactionFee,
  getUnionViennaAge505VariantConfig,
  resolveUnionViennaAge505LoyaltyEligibilityProfile,
  resolveUnionViennaAge505MinimumAnnualPayment,
  resolveUnionViennaAge505Variant,
  toUnionViennaAge505ProductVariantId,
  UNION_VIENNA_AGE_505_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  UNION_VIENNA_AGE_505_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  UNION_VIENNA_AGE_505_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT,
  UNION_VIENNA_AGE_505_REGULAR_ADMIN_FEE_PERCENT,
  UNION_VIENNA_AGE_505_TAX_CREDIT_RATE_PERCENT,
  UNION_VIENNA_AGE_505_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
} from "./union-vienna-age-505-config"
import type { ProductDefinition } from "./types"

export const unionViennaAge505: ProductDefinition = {
  id: "union-vienna-age-505",
  label: "UNION Vienna Age Nyugdijbiztositas (505)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveUnionViennaAge505Variant(inputs.productVariant, inputs.currency)
    const loyaltyEligibilityProfile = resolveUnionViennaAge505LoyaltyEligibilityProfile(inputs.productVariant)
    const variantConfig = getUnionViennaAge505VariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateUnionViennaAge505DurationYears(inputs)
    const minAnnualPayment = resolveUnionViennaAge505MinimumAnnualPayment(durationYears, variantConfig)

    const initialCostByYearDefault = buildUnionViennaAge505InitialCostByYear(durationYears)
    const investedShareByYearDefault = buildUnionViennaAge505InvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildUnionViennaAge505RedemptionFeeByYear(durationYears, variantConfig)
    const loyaltyBonusByYearDefault = buildUnionViennaAge505LoyaltyBonusAmountByYear(
      inputs,
      durationYears,
      variantConfig,
      loyaltyEligibilityProfile,
    )
    const maturityBonusByYearDefault = buildUnionViennaAge505MaturityBonusAmountByYear(inputs, durationYears)
    const bonusAmountByYearDefault = { ...loyaltyBonusByYearDefault }
    for (const [year, amount] of Object.entries(maturityBonusByYearDefault)) {
      const y = Number(year)
      bonusAmountByYearDefault[y] = (bonusAmountByYearDefault[y] ?? 0) + amount
    }

    const transactionFeeDefault = estimateUnionViennaAge505TransactionFee(variantConfig.minExtraordinaryPayment, variantConfig)
    const annualizedRiskFee = Math.max(0, minAnnualPayment * (UNION_VIENNA_AGE_505_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT / 100))

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: inputs.productVariant ?? toUnionViennaAge505ProductVariantId(variant, loyaltyEligibilityProfile),
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
        ? UNION_VIENNA_AGE_505_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? UNION_VIENNA_AGE_505_EXTRAORDINARY_ADMIN_FEE_PERCENT
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
        ? UNION_VIENNA_AGE_505_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
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
        ? { ...(inputs.plusCostByYear ?? {}) }
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
      enableTaxCredit: shouldUseProductDefaults ? true : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults
        ? UNION_VIENNA_AGE_505_TAX_CREDIT_RATE_PERCENT
        : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults
        ? variantConfig.taxCreditCapPerYear
        : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? durationYears : inputs.taxCreditEndYear,
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults ? inputs.annualYieldPercent : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? UNION_VIENNA_AGE_505_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyPercent: shouldUseProductDefaults
        ? UNION_VIENNA_AGE_505_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : inputs.paidUpMaintenanceFeeMonthlyPercent,
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
      extraordinaryAccountSubtype: shouldUseProductDefaults ? "standard" : inputs.extraordinaryAccountSubtype,
      // Keep this as a documented V1 approximation for extra accounts.
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
