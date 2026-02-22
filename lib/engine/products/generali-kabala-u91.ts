import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildGeneraliKabalaU91AdminPlusCostByYear,
  buildGeneraliKabalaU91BonusOnContributionPercentByYear,
  buildGeneraliKabalaU91FidelityAccountBonusAmountByYear,
  buildGeneraliKabalaU91InitialCostByYear,
  buildGeneraliKabalaU91InvestedShareByYear,
  buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear,
  buildGeneraliKabalaU91RedemptionFeeByYear,
  buildGeneraliKabalaU91WealthBonusPercentByYear,
  estimateGeneraliKabalaU91DurationYears,
  GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH,
  GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  GENERALI_KABALA_U91_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE,
  GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT,
  GENERALI_KABALA_U91_MIN_BALANCE_AFTER_PARTIAL_SURRENDER,
  GENERALI_KABALA_U91_POLICY_ISSUANCE_FEE_AMOUNT,
  GENERALI_KABALA_U91_RISK_ACCIDENTAL_DEATH_BENEFIT,
  GENERALI_KABALA_U91_RISK_ANNUAL_FEE,
  GENERALI_KABALA_U91_RISK_COVERAGE_END_YEAR,
  GENERALI_KABALA_U91_RISK_COVERAGE_START_YEAR,
  GENERALI_KABALA_U91_TAX_CREDIT_RATE_PERCENT,
  getGeneraliKabalaU91VariantConfig,
  resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent,
  resolveGeneraliKabalaU91TaxCreditCapPerYear,
  toGeneraliKabalaU91ProductVariantId,
} from "./generali-kabala-u91-config"
import type { ProductDefinition } from "./types"

function createGeneraliKabalaU91RiskResolver(): (ctx: {
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
    if (GENERALI_KABALA_U91_RISK_ANNUAL_FEE <= 0) return 0
    const paymentShare = Math.max(0, monthsBetweenPayments) / 12
    return GENERALI_KABALA_U91_RISK_ANNUAL_FEE * paymentShare
  }
}

function resolveGeneraliKabalaU91PlusCosts(
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
  if (!GENERALI_KABALA_U91_ENABLE_POLICY_ISSUANCE_CANCELLATION_FEE) return merged
  const isCancelledWithinWindow = (inputs.productVariant ?? "").toLowerCase().includes("cancel30")
  if (!isCancelledWithinWindow) return merged
  merged[1] = (merged[1] ?? 0) + GENERALI_KABALA_U91_POLICY_ISSUANCE_FEE_AMOUNT
  return merged
}

function mergeBonusAmountByYear(
  ...maps: Array<Record<number, number> | undefined>
): Record<number, number> {
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

export const generaliKabalaU91: ProductDefinition = {
  id: "generali-kabala-u91",
  label: "Generali Kabala (U91)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variantConfig = getGeneraliKabalaU91VariantConfig(inputs.productVariant, inputs.enableTaxCredit)
    const durationYears = estimateGeneraliKabalaU91DurationYears(inputs, variantConfig)
    const initialCostByYearDefault = buildGeneraliKabalaU91InitialCostByYear(durationYears, variantConfig.variant)
    const investedShareByYearDefault = buildGeneraliKabalaU91InvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildGeneraliKabalaU91RedemptionFeeByYear(durationYears)
    const bonusOnContributionPercentByYearDefault = buildGeneraliKabalaU91BonusOnContributionPercentByYear(
      inputs,
      durationYears,
    )
    const wealthBonusPercentByYearDefault = buildGeneraliKabalaU91WealthBonusPercentByYear(durationYears)
    const loyaltyCreditBonusAmountByYearDefault = buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(
      inputs,
      durationYears,
      variantConfig.variant,
    )
    const fidelityAccountBonusByYearDefault = buildGeneraliKabalaU91FidelityAccountBonusAmountByYear(
      inputs,
      durationYears,
      variantConfig.variant,
    )
    const bonusAmountByYearDefault = mergeBonusAmountByYear(
      loyaltyCreditBonusAmountByYearDefault,
      fidelityAccountBonusByYearDefault,
    )
    const riskResolver = createGeneraliKabalaU91RiskResolver()
    const adminPlusCostByYearDefault = buildGeneraliKabalaU91AdminPlusCostByYear(durationYears)
    const plusCostByYearDefault = resolveGeneraliKabalaU91PlusCosts(durationYears, inputs, adminPlusCostByYearDefault)
    const clampedInsuredEntryAge = Math.min(
      variantConfig.maxEntryAge,
      Math.max(variantConfig.minEntryAge, Math.round(inputs.insuredEntryAge ?? 38)),
    )

    return calculateResultsDaily({
      ...inputs,
      currency: variantConfig.currency,
      productVariant: toGeneraliKabalaU91ProductVariantId(variantConfig.variant),
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
        ? GENERALI_KABALA_U91_EXTRA_DISTRIBUTION_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_RISK_ACCIDENTAL_DEATH_BENEFIT
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_RISK_COVERAGE_START_YEAR
        : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? GENERALI_KABALA_U91_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? riskResolver : (inputs.riskFeeResolver ?? riskResolver),
      insuredEntryAge: clampedInsuredEntryAge,
      isAccountSplitOpen: shouldUseProductDefaults ? false : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? false : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent(inputs.selectedFundId)
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_REGULAR_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "total-account" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? true : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults ? 0 : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? GENERALI_KABALA_U91_MIN_BALANCE_AFTER_PARTIAL_SURRENDER
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
        ? (inputs.taxCreditRatePercent ?? GENERALI_KABALA_U91_TAX_CREDIT_RATE_PERCENT)
        : 0,
      taxCreditCapPerYear: variantConfig.taxCreditAllowed
        ? (inputs.taxCreditCapPerYear ?? resolveGeneraliKabalaU91TaxCreditCapPerYear())
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

