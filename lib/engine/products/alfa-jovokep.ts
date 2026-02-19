import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildJovokepBonusAmountByYear,
  buildJovokepInitialCostByYear,
  buildJovokepInvestedShareByYear,
  buildJovokepRedemptionSchedule,
  clampJovokepEntryAge,
  estimateJovokepDurationYears,
  JOVOKEP_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  JOVOKEP_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
  JOVOKEP_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  JOVOKEP_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  JOVOKEP_CURRENCY,
  JOVOKEP_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT,
  JOVOKEP_PAID_UP_MAINTENANCE_FEE_START_MONTH,
  JOVOKEP_PARTIAL_SURRENDER_FIXED_FEE,
  JOVOKEP_REGULAR_ADMIN_FEE_PERCENT,
  JOVOKEP_RISK_ACCIDENTAL_DEATH_BENEFIT,
  JOVOKEP_RISK_COVERAGE_END_YEAR,
  JOVOKEP_RISK_COVERAGE_START_YEAR,
} from "./alfa-jovokep-config"
import type { ProductDefinition } from "./types"

function createPlaceholderJovokepRiskResolver(): (ctx: {
  currentYear: number
  currentCalendarYear: number
  monthsElapsed: number
  monthsBetweenPayments: number
  paymentPerEvent: number
  yearlyPayment: number
  durationYears: number
  insuredEntryAge: number
}) => number {
  return () => 0
}

export const alfaJovokep: ProductDefinition = {
  id: "alfa-jovokep",
  label: "Alfa Jövőkép (TR10)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateJovokepDurationYears(inputs)
    const initialCostByYearDefault = buildJovokepInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildJovokepInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildJovokepRedemptionSchedule(durationYears)
    const bonusAmountByYearDefault = buildJovokepBonusAmountByYear(inputs.yearlyPaymentsPlan ?? [], durationYears)
    const clampedEntryAge = clampJovokepEntryAge(inputs.insuredEntryAge, durationYears)
    const placeholderRiskResolver = createPlaceholderJovokepRiskResolver()

    return calculateResultsDaily({
      ...inputs,
      currency: JOVOKEP_CURRENCY,
      productVariant: "alfa_jovokep_tr10",
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? JOVOKEP_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? JOVOKEP_RISK_ACCIDENTAL_DEATH_BENEFIT
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? JOVOKEP_RISK_COVERAGE_START_YEAR : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? JOVOKEP_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? placeholderRiskResolver : (inputs.riskFeeResolver ?? placeholderRiskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 20 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? JOVOKEP_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? JOVOKEP_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? JOVOKEP_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? JOVOKEP_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? JOVOKEP_PARTIAL_SURRENDER_FIXED_FEE
        : (inputs.partialSurrenderFeeAmount ?? 0),
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
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? JOVOKEP_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults
        ? JOVOKEP_PAID_UP_MAINTENANCE_FEE_START_MONTH
        : (inputs.paidUpMaintenanceFeeStartMonth ?? 10),
      insuredEntryAge: clampedEntryAge,
      enableTaxCredit: false,
      taxCreditRatePercent: 0,
      taxCreditCapPerYear: 0,
      taxCreditLimitByYear: {},
      taxCreditAmountByYear: {},
      taxCreditYieldPercent: 0,
      taxCreditCalendarPostingEnabled: false,
    })
  },
}
