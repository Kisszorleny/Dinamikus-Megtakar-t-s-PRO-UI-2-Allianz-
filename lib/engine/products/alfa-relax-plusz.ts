import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildRelaxPluszBonusAmountByYear,
  buildRelaxPluszInitialCostByYear,
  buildRelaxPluszInvestedShareByYear,
  buildRelaxPluszRedemptionSchedule,
  estimateRelaxPluszDurationYears,
  RELAX_PLUSZ_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH,
  RELAX_PLUSZ_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH,
  RELAX_PLUSZ_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  RELAX_PLUSZ_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH,
  RELAX_PLUSZ_CURRENCY,
  RELAX_PLUSZ_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  RELAX_PLUSZ_PARTIAL_SURRENDER_FIXED_FEE,
  RELAX_PLUSZ_PRODUCT_CODE,
  RELAX_PLUSZ_REGULAR_ADMIN_FEE_PERCENT,
  RELAX_PLUSZ_RISK_ACCIDENTAL_DEATH_BENEFIT,
  RELAX_PLUSZ_RISK_COVERAGE_END_YEAR,
  RELAX_PLUSZ_RISK_COVERAGE_START_YEAR,
  RELAX_PLUSZ_TAX_CREDIT_CAP_PER_YEAR,
  RELAX_PLUSZ_TAX_CREDIT_RATE_PERCENT,
  RELAX_PLUSZ_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT,
} from "./alfa-relax-plusz-config"
import type { ProductDefinition } from "./types"

function createRelaxPluszRiskResolver(): (ctx: {
  currentYear: number
  currentCalendarYear: number
  monthsElapsed: number
  monthsBetweenPayments: number
  paymentPerEvent: number
  yearlyPayment: number
  durationYears: number
  insuredEntryAge: number
}) => number {
  // NY01 termékben az első éves közlekedési baleseti védelem díjmentes.
  return () => 0
}

export const alfaRelaxPlusz: ProductDefinition = {
  id: "alfa-relax-plusz",
  label: "Alfa Relax Plusz (NY01)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const durationYears = estimateRelaxPluszDurationYears(inputs)
    const initialCostByYearDefault = buildRelaxPluszInitialCostByYear(durationYears)
    const investedShareByYearDefault = buildRelaxPluszInvestedShareByYear(durationYears)
    const redemptionFeeByYearDefault = buildRelaxPluszRedemptionSchedule(durationYears)
    const bonusAmountByYearDefault = buildRelaxPluszBonusAmountByYear(inputs.yearlyPaymentsPlan ?? [], durationYears)
    const riskResolver = createRelaxPluszRiskResolver()

    return calculateResultsDaily({
      ...inputs,
      currency: RELAX_PLUSZ_CURRENCY,
      productVariant: "alfa_relax_plusz_ny01",
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      yearlyExtraTaxEligiblePaymentsPlan: inputs.yearlyExtraTaxEligiblePaymentsPlan ?? [],
      yearlyExtraImmediateAccessPaymentsPlan: inputs.yearlyExtraImmediateAccessPaymentsPlan ?? [],
      yearlyExtraImmediateAccessWithdrawalsPlan: inputs.yearlyExtraImmediateAccessWithdrawalsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      initialCostBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.initialCostBaseMode,
      adminFeePercentOfPayment: shouldUseProductDefaults
        ? RELAX_PLUSZ_REGULAR_ADMIN_FEE_PERCENT
        : (inputs.adminFeePercentOfPayment ?? 0),
      extraordinaryAdminFeePercentOfPayment: shouldUseProductDefaults
        ? RELAX_PLUSZ_EXTRAORDINARY_ADMIN_FEE_PERCENT
        : (inputs.extraordinaryAdminFeePercentOfPayment ?? 0),
      adminFeeBaseMode: shouldUseProductDefaults ? "afterRisk" : inputs.adminFeeBaseMode,
      riskInsuranceEnabled: shouldUseProductDefaults ? true : inputs.riskInsuranceEnabled,
      riskInsuranceMonthlyFeeAmount: shouldUseProductDefaults ? 0 : (inputs.riskInsuranceMonthlyFeeAmount ?? 0),
      riskInsuranceDeathBenefitAmount: shouldUseProductDefaults
        ? RELAX_PLUSZ_RISK_ACCIDENTAL_DEATH_BENEFIT
        : inputs.riskInsuranceDeathBenefitAmount,
      riskInsuranceStartYear: shouldUseProductDefaults ? RELAX_PLUSZ_RISK_COVERAGE_START_YEAR : inputs.riskInsuranceStartYear,
      riskInsuranceEndYear: shouldUseProductDefaults ? RELAX_PLUSZ_RISK_COVERAGE_END_YEAR : inputs.riskInsuranceEndYear,
      riskFeeResolver: shouldUseProductDefaults ? riskResolver : (inputs.riskFeeResolver ?? riskResolver),
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      useSeparatedExtraAccounts: shouldUseProductDefaults ? true : inputs.useSeparatedExtraAccounts,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 80 : inputs.investedShareDefaultPercent,
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? RELAX_PLUSZ_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults ? 1 : (inputs.accountMaintenanceStartMonth ?? 1),
      accountMaintenanceClientStartMonth: shouldUseProductDefaults
        ? RELAX_PLUSZ_ACCOUNT_MAINTENANCE_CLIENT_START_MONTH
        : inputs.accountMaintenanceClientStartMonth,
      accountMaintenanceInvestedStartMonth: shouldUseProductDefaults
        ? RELAX_PLUSZ_ACCOUNT_MAINTENANCE_INVESTED_START_MONTH
        : inputs.accountMaintenanceInvestedStartMonth,
      accountMaintenanceTaxBonusStartMonth: shouldUseProductDefaults
        ? RELAX_PLUSZ_ACCOUNT_MAINTENANCE_TAXBONUS_START_MONTH
        : inputs.accountMaintenanceTaxBonusStartMonth,
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 18 : (inputs.redemptionFeeDefaultPercent ?? 0),
      allowWithdrawals: shouldUseProductDefaults ? false : inputs.allowWithdrawals,
      allowPartialSurrender: shouldUseProductDefaults ? true : inputs.allowPartialSurrender,
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? RELAX_PLUSZ_PARTIAL_SURRENDER_FIXED_FEE
        : (inputs.partialSurrenderFeeAmount ?? 0),
      taxCreditRepaymentOnSurrenderPercent: shouldUseProductDefaults
        ? RELAX_PLUSZ_TAX_CREDIT_REPAYMENT_ON_SURRENDER_PERCENT
        : (inputs.taxCreditRepaymentOnSurrenderPercent ?? 0),
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
      enableTaxCredit: true,
      taxCreditRatePercent: shouldUseProductDefaults ? RELAX_PLUSZ_TAX_CREDIT_RATE_PERCENT : (inputs.taxCreditRatePercent ?? 20),
      taxCreditCapPerYear: shouldUseProductDefaults ? RELAX_PLUSZ_TAX_CREDIT_CAP_PER_YEAR : (inputs.taxCreditCapPerYear ?? 130000),
      taxCreditStartYear: shouldUseProductDefaults ? 1 : (inputs.taxCreditStartYear ?? 1),
      taxCreditEndYear: shouldUseProductDefaults ? 0 : (inputs.taxCreditEndYear ?? 0),
      taxCreditLimitByYear: inputs.taxCreditLimitByYear ?? {},
      taxCreditAmountByYear: inputs.taxCreditAmountByYear ?? {},
      taxCreditYieldPercent: shouldUseProductDefaults ? 1 : (inputs.taxCreditYieldPercent ?? 1),
      taxCreditCalendarPostingEnabled: shouldUseProductDefaults ? false : (inputs.taxCreditCalendarPostingEnabled ?? false),
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
    })
  },
}

export const ALFA_RELAX_PLUSZ_PRODUCT_CODE = RELAX_PLUSZ_PRODUCT_CODE
