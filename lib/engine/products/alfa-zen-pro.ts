import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildZenProBonusAmountByYear,
  buildZenProInitialCostByYear,
  buildZenProInvestedShareByYear,
  buildZenProRedemptionSchedule,
  estimateZenProDurationYears,
  getZenProVariantConfig,
  resolveZenProTaxCreditCapPerYear,
  toZenProProductVariantId,
  ZEN_PRO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  ZEN_PRO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  ZEN_PRO_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  ZEN_PRO_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE,
  ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ZEN_PRO_PAID_UP_MAINTENANCE_MONTHLY_PERCENT,
  ZEN_PRO_PAID_UP_MAINTENANCE_START_MONTH,
  ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT,
  ZEN_PRO_NY08_PRODUCT_CODE,
  ZEN_PRO_NY14_PRODUCT_CODE,
  ZEN_PRO_NY24_PRODUCT_CODE,
  ZEN_PRO_RISK_ANNUAL_FEE,
  ZEN_PRO_RISK_COVERAGE_END_YEAR,
  ZEN_PRO_RISK_COVERAGE_START_YEAR,
  ZEN_PRO_TAX_CREDIT_RATE_PERCENT,
} from "./alfa-zen-pro-config"
import type { ProductDefinition } from "./types"

function createZenProRiskResolver(): (ctx: {
  currentYear: number
  currentCalendarYear: number
  monthsElapsed: number
  monthsBetweenPayments: number
  paymentPerEvent: number
  yearlyPayment: number
  durationYears: number
  insuredEntryAge: number
}) => number {
  return ({ monthsBetweenPayments }) => {
    if (ZEN_PRO_RISK_ANNUAL_FEE <= 0) return 0
    const paymentShare = Math.max(0, monthsBetweenPayments) / 12
    return ZEN_PRO_RISK_ANNUAL_FEE * paymentShare
  }
}

function resolveZenProPlusCosts(
  inputs: InputsDaily,
  policyIssuanceFeeAmount: number,
): Record<number, number> {
  const base = { ...(inputs.plusCostByYear ?? {}) }
  if (!ZEN_PRO_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE) return base
  const isCancelledWithinWindow = (inputs.productVariant ?? "").toLowerCase().includes("cancel30")
  if (!isCancelledWithinWindow) return base
  return { 1: policyIssuanceFeeAmount, ...base }
}

export const alfaZenPro: ProductDefinition = {
  id: "alfa-zen-pro",
  label: "Alfa Zen Pro (NY-08/NY-14/NY-24)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getZenProVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateZenProDurationYears(inputs)
    const initialCostByYearDefault = buildZenProInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildZenProInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildZenProRedemptionSchedule(durationYears)
    const bonusAmountByYearDefault = buildZenProBonusAmountByYear(inputs, durationYears, {
      variant: variantConfig.variant,
    })
    const riskResolver = createZenProRiskResolver()
    const taxCreditCapDefault = resolveZenProTaxCreditCapPerYear(
      variantConfig,
      inputs.eurToHufRate,
      inputs.usdToHufRate,
    )

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toZenProProductVariantId(variantConfig.variant),
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
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? variantConfig.riskAccidentalDeathBenefit
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? ZEN_PRO_RISK_COVERAGE_START_YEAR : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? ZEN_PRO_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? riskResolver : (inputs.riskFeeResolver ?? riskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? ZEN_PRO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? ZEN_PRO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? ZEN_PRO_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? false : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? variantConfig.partialSurrenderFixedFee
        : (inputs.partialSurrenderFeeAmount ?? 0),
      plusCostByYear: shouldUseProductDefaults
        ? resolveZenProPlusCosts(inputs, variantConfig.policyIssuanceFeeAmount)
        : inputs.plusCostByYear,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusOnContributionPercent: shouldUseProductDefaults ? 0 : (inputs.bonusOnContributionPercent ?? 0),
      bonusOnContributionPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusOnContributionPercentByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults
        ? { ...bonusAmountByYearDefault, ...(inputs.bonusAmountByYear ?? {}) }
        : inputs.bonusAmountByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      enableTaxCredit: shouldUseProductDefaults ? true : (inputs.enableTaxCredit ?? true),
      taxCreditRatePercent: shouldUseProductDefaults ? ZEN_PRO_TAX_CREDIT_RATE_PERCENT : (inputs.taxCreditRatePercent ?? 20),
      taxCreditCapPerYear: shouldUseProductDefaults ? taxCreditCapDefault : (inputs.taxCreditCapPerYear ?? 130000),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditEndYear ?? 0),
      taxCreditLimitByYear: inputs.taxCreditLimitByYear ?? {},
      taxCreditAmountByYear: inputs.taxCreditAmountByYear ?? {},
      taxCreditYieldPercent: shouldUseProductDefaults ? 1 : (inputs.taxCreditYieldPercent ?? 1),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeMonthlyPercent: shouldUseProductDefaults
        ? ZEN_PRO_PAID_UP_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.paidUpMaintenanceFeeMonthlyPercent ?? 0),
      paidUpMaintenanceFeeMonthlyCapAmount: shouldUseProductDefaults
        ? variantConfig.paidUpMaintenanceMonthlyCapAmount
        : (inputs.paidUpMaintenanceFeeMonthlyCapAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults
        ? ZEN_PRO_PAID_UP_MAINTENANCE_START_MONTH
        : (inputs.paidUpMaintenanceFeeStartMonth ?? 1),
    })
  },
}

export const ALFA_ZEN_PRO_PRODUCT_CODE = `${ZEN_PRO_NY08_PRODUCT_CODE}/${ZEN_PRO_NY14_PRODUCT_CODE}/${ZEN_PRO_NY24_PRODUCT_CODE}`

