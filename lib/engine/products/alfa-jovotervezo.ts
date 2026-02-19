import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildJovotervezoBonusAmountByYear,
  buildJovotervezoInitialCostByYear,
  buildJovotervezoInvestedShareByYear,
  buildJovotervezoRedemptionSchedule,
  estimateJovotervezoDurationYears,
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH,
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  JOVOTERVEZO_CURRENCY,
  JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT,
  JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_START_MONTH,
  JOVOTERVEZO_PARTIAL_SURRENDER_FIXED_FEE,
  JOVOTERVEZO_PRODUCT_CODE,
  JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT,
  JOVOTERVEZO_RISK_ACCIDENTAL_DEATH_BENEFIT,
  JOVOTERVEZO_RISK_COVERAGE_END_YEAR,
  JOVOTERVEZO_RISK_COVERAGE_START_YEAR,
} from "./alfa-jovotervezo-config"
import type { ProductDefinition } from "./types"

function createPlaceholderJovotervezoRiskResolver(): (ctx: {
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

function shouldApplyJovotervezoBonus(inputs: InputsDaily): boolean {
  const hasWithdrawals = (inputs.yearlyWithdrawalsPlan ?? []).some((value, index) => index > 0 && value > 0)
  return !hasWithdrawals
}

export const alfaJovotervezo: ProductDefinition = {
  id: "alfa-jovotervezo",
  label: "Alfa Jövőtervező (TR03)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateJovotervezoDurationYears(inputs)
    const initialCostByYearDefault = buildJovotervezoInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildJovotervezoInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildJovotervezoRedemptionSchedule(durationYears)
    const placeholderRiskResolver = createPlaceholderJovotervezoRiskResolver()
    const bonusAllowed = shouldApplyJovotervezoBonus(inputs)
    const bonusAmountByYearDefault = bonusAllowed
      ? buildJovotervezoBonusAmountByYear(inputs.yearlyPaymentsPlan ?? [], durationYears)
      : {}

    return calculateResultsDaily({
      ...inputs,
      currency: JOVOTERVEZO_CURRENCY,
      productVariant: "alfa_jovotervezo_tr03",
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? JOVOTERVEZO_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? JOVOTERVEZO_RISK_ACCIDENTAL_DEATH_BENEFIT
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? JOVOTERVEZO_RISK_COVERAGE_START_YEAR : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? JOVOTERVEZO_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? placeholderRiskResolver : (inputs.riskFeeResolver ?? placeholderRiskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 20 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? JOVOTERVEZO_ACCOUNT_MAINTENANCE_EXTRA_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? JOVOTERVEZO_PARTIAL_SURRENDER_FIXED_FEE
        : (inputs.partialSurrenderFeeAmount ?? 0),
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      bonusOnContributionPercent: shouldUseProductDefaults ? 0 : (inputs.bonusOnContributionPercent ?? 0),
      bonusOnContributionPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusOnContributionPercentByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults ? bonusAmountByYearDefault : inputs.bonusAmountByYear,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_MONTHLY_AMOUNT
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults
        ? JOVOTERVEZO_PAID_UP_MAINTENANCE_FEE_START_MONTH
        : (inputs.paidUpMaintenanceFeeStartMonth ?? 10),
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

export const ALFA_JOVOTERVEZO_PRODUCT_CODE = JOVOTERVEZO_PRODUCT_CODE
