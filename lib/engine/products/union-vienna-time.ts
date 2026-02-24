import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildUnionViennaTimeExtraordinaryEarlySurrenderApproxCostByYear,
  buildUnionViennaTimeInitialCostByYear,
  buildUnionViennaTimeInvestedShareByYear,
  buildUnionViennaTimeLoyaltyBonusAmountByYear,
  buildUnionViennaTimeMaturityBonusAmountByYear,
  buildUnionViennaTimeRedemptionFeeByYear,
  estimateUnionViennaTimeDurationYears,
  estimateUnionViennaTimeTransactionFee,
  resolveUnionViennaTimeAccountMaintenanceMonthlyPercent,
  resolveUnionViennaTimeAdminFeePercentOfPayment,
  resolveUnionViennaTimeLoyaltyEligibilityProfile,
  resolveUnionViennaTimeMinimumAnnualPayment,
  resolveUnionViennaTimeVariant,
  toUnionViennaTimeProductVariantId,
  UNION_VIENNA_TIME_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  UNION_VIENNA_TIME_MIN_ANNUAL_PAYMENT_HUF,
  UNION_VIENNA_TIME_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF,
  UNION_VIENNA_TIME_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT,
} from "./union-vienna-time-config"
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

function resolveObservedMinimumAnnualRegularPayment(inputs: InputsDaily, durationYears: number): number {
  const yearlyPayments = inputs.yearlyPaymentsPlan ?? []
  let minValue = Number.POSITIVE_INFINITY
  for (let year = 1; year <= durationYears; year++) {
    const payment = Math.max(0, yearlyPayments[year] ?? 0)
    if (payment <= 0) continue
    minValue = Math.min(minValue, payment)
  }
  const observed = Number.isFinite(minValue) ? minValue : 0
  return Math.max(UNION_VIENNA_TIME_MIN_ANNUAL_PAYMENT_HUF, observed)
}

export const unionViennaTime: ProductDefinition = {
  id: "union-vienna-time-584",
  label: "UNION Vienna Time Nyugdijbiztositas (564/584/606)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveUnionViennaTimeVariant(inputs.productVariant)
    const loyaltyEligibilityProfile = resolveUnionViennaTimeLoyaltyEligibilityProfile(inputs.productVariant)
    const durationYears = estimateUnionViennaTimeDurationYears(inputs)
    const minimumAnnualPayment = resolveUnionViennaTimeMinimumAnnualPayment()
    const observedAnnualPayment = resolveObservedMinimumAnnualRegularPayment(inputs, durationYears)

    const initialCostByYearDefault = buildUnionViennaTimeInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildUnionViennaTimeInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildUnionViennaTimeRedemptionFeeByYear(durationYears)
    const loyaltyBonusByYearDefault = buildUnionViennaTimeLoyaltyBonusAmountByYear(
      inputs,
      durationYears,
      loyaltyEligibilityProfile,
    )
    const maturityBonusByYearDefault = buildUnionViennaTimeMaturityBonusAmountByYear(inputs, durationYears)
    const bonusAmountByYearDefault = { ...loyaltyBonusByYearDefault }
    for (const [year, amount] of Object.entries(maturityBonusByYearDefault)) {
      const y = Number(year)
      bonusAmountByYearDefault[y] = (bonusAmountByYearDefault[y] ?? 0) + amount
    }

    const transactionFeeDefault = estimateUnionViennaTimeTransactionFee(minimumAnnualPayment)
    const annualizedRiskFee = Math.max(
      0,
      observedAnnualPayment * (UNION_VIENNA_TIME_RISK_ANNUAL_FEE_PERCENT_OF_YEARLY_PAYMENT / 100),
    )
    const extraordinaryEarlySurrenderApproxByYear = buildUnionViennaTimeExtraordinaryEarlySurrenderApproxCostByYear(
      inputs,
      durationYears,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: "HUF",
      productVariant: inputs.productVariant ?? toUnionViennaTimeProductVariantId(variant, loyaltyEligibilityProfile),
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
        ? resolveUnionViennaTimeAdminFeePercentOfPayment(observedAnnualPayment)
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? UNION_VIENNA_TIME_EXTRAORDINARY_ADMIN_FEE_PERCENT
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
        ? resolveUnionViennaTimeAccountMaintenanceMonthlyPercent(observedAnnualPayment)
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
        ? Math.max(minimumAnnualPayment, UNION_VIENNA_TIME_MIN_BALANCE_AFTER_PARTIAL_SURRENDER_HUF)
        : inputs.minimumBalanceAfterPartialSurrender,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      enableTaxCredit: shouldUseProductDefaults ? true : inputs.enableTaxCredit,
      taxCreditRatePercent: shouldUseProductDefaults ? 20 : (inputs.taxCreditRatePercent ?? 0),
      taxCreditCapPerYear: shouldUseProductDefaults ? 130_000 : (inputs.taxCreditCapPerYear ?? 0),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? durationYears : inputs.taxCreditEndYear,
      taxCreditLimitByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditLimitByYear ?? {}),
      taxCreditAmountByYear: shouldUseProductDefaults ? {} : (inputs.taxCreditAmountByYear ?? {}),
      taxCreditYieldPercent: shouldUseProductDefaults ? inputs.annualYieldPercent : (inputs.taxCreditYieldPercent ?? 0),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? 20
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
      paidUpMaintenanceFeeMonthlyPercent: shouldUseProductDefaults
        ? resolveUnionViennaTimeAccountMaintenanceMonthlyPercent(observedAnnualPayment)
        : inputs.paidUpMaintenanceFeeMonthlyPercent,
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults ? 1 : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
      extraordinaryAccountSubtype: shouldUseProductDefaults ? "standard" : inputs.extraordinaryAccountSubtype,
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : inputs.accountMaintenanceStartMonth,
      assetCostPercentByYearClient: shouldUseProductDefaults
        ? { ...(inputs.assetCostPercentByYearClient ?? {}) }
        : inputs.assetCostPercentByYearClient,
      assetCostPercentByYearInvested: shouldUseProductDefaults
        ? { ...(inputs.assetCostPercentByYearInvested ?? {}) }
        : inputs.assetCostPercentByYearInvested,
      adminFeePercentByYear: shouldUseProductDefaults ? {} : inputs.adminFeePercentByYear,
    })
  },
}
