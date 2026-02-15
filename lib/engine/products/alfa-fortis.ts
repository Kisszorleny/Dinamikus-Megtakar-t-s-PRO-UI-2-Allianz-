import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildFortisBonusAmountByYear,
  buildFortisInitialCostByYear,
  buildFortisRedemptionSchedule,
  estimateFortisDurationYears,
  FORTIS_MAX_ENTRY_AGE,
  FORTIS_MIN_ANNUAL_PAYMENT,
  FORTIS_MIN_ENTRY_AGE,
} from "./alfa-fortis-config"
import { createAlfaFortisRiskFeeResolver } from "./alfa-fortis-risk"
import type { ProductDefinition } from "./types"

function normalizeFortisYearlyPayments(yearlyPaymentsPlan: number[]): number[] {
  const normalized = [...yearlyPaymentsPlan]
  for (let year = 1; year < normalized.length; year++) {
    const planned = Math.max(0, normalized[year] ?? 0)
    normalized[year] = planned > 0 && planned < FORTIS_MIN_ANNUAL_PAYMENT ? FORTIS_MIN_ANNUAL_PAYMENT : planned
  }
  return normalized
}

function clampEntryAge(age: number | undefined): number {
  const safeAge = Math.round(age ?? 38)
  return Math.min(FORTIS_MAX_ENTRY_AGE, Math.max(FORTIS_MIN_ENTRY_AGE, safeAge))
}

function resolveMinAnnualizedContribution(yearlyPaymentsPlan: number[]): number {
  let minValue = Number.POSITIVE_INFINITY
  for (let year = 1; year < yearlyPaymentsPlan.length; year++) {
    const value = Math.max(0, yearlyPaymentsPlan[year] ?? 0)
    if (value > 0) minValue = Math.min(minValue, value)
  }
  return Number.isFinite(minValue) ? minValue : 0
}

export const alfaFortis: ProductDefinition = {
  id: "alfa-fortis",
  label: "Alfa Fortis (WL-02)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateFortisDurationYears(inputs)
    const initialCostByYearDefault = buildFortisInitialCostByYear()
    const redemptionFeeByYearDefault = buildFortisRedemptionSchedule(durationYears)
    const normalizedYearlyPaymentsPlan = shouldUseProductDefaults
      ? normalizeFortisYearlyPayments(inputs.yearlyPaymentsPlan ?? [])
      : (inputs.yearlyPaymentsPlan ?? [])
    const minAnnualizedContribution = resolveMinAnnualizedContribution(normalizedYearlyPaymentsPlan)
    const bonusAmountByYearDefault = buildFortisBonusAmountByYear(minAnnualizedContribution)
    const riskFeeResolver = createAlfaFortisRiskFeeResolver(inputs)

    return calculateResultsDaily({
      ...inputs,
      productVariant: "alfa_fortis_wl02",
      yearlyPaymentsPlan: normalizedYearlyPaymentsPlan,
      initialCostByYear: shouldUseProductDefaults ? initialCostByYearDefault : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      isAccountSplitOpen: shouldUseProductDefaults ? false : inputs.isAccountSplitOpen,
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? false : inputs.isTaxBonusSeparateAccount,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults ? bonusAmountByYearDefault : inputs.bonusAmountByYear,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : inputs.assetBasedFeePercent,
      adminFeePercentOfPayment: shouldUseProductDefaults ? 4 : (inputs.adminFeePercentOfPayment ?? 0),
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults ? 0.165 : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 37 : (inputs.accountMaintenanceStartMonth ?? 1),
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      adminFeeMonthlyAmount: shouldUseProductDefaults ? 0 : (inputs.adminFeeMonthlyAmount ?? 0),
      enableTaxCredit: false,
      taxCreditRatePercent: 0,
      taxCreditCapPerYear: 0,
      taxCreditLimitByYear: {},
      taxCreditAmountByYear: {},
      taxCreditYieldPercent: 0,
      taxCreditCalendarPostingEnabled: false,
      insuredEntryAge: clampEntryAge(inputs.insuredEntryAge),
      riskFeeResolver: riskFeeResolver ?? inputs.riskFeeResolver,
    })
  },
}

