import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildFortisBonusPercentByYear,
  buildFortisInitialCostByYear,
  buildFortisRedemptionSchedule,
  estimateFortisDurationYears,
  FORTIS_MAX_ENTRY_AGE,
  FORTIS_MIN_ENTRY_AGE,
  getFortisVariantConfig,
  resolveFortisVariant,
  toFortisProductVariantId,
} from "./alfa-fortis-config"
import { createAlfaFortisRiskFeeResolver } from "./alfa-fortis-risk"
import type { ProductDefinition } from "./types"

function clampEntryAge(age: number | undefined): number {
  const safeAge = Math.round(age ?? 38)
  return Math.min(FORTIS_MAX_ENTRY_AGE, Math.max(FORTIS_MIN_ENTRY_AGE, safeAge))
}

export const alfaFortis: ProductDefinition = {
  id: "alfa-fortis",
  label: "Alfa Fortis (WL-02)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveFortisVariant(inputs.productVariant, inputs.currency)
    const variantConfig = getFortisVariantConfig(inputs.productVariant, inputs.currency)
    const durationYears = estimateFortisDurationYears(inputs)
    const initialCostByYearDefault = buildFortisInitialCostByYear()
    const redemptionFeeByYearDefault = buildFortisRedemptionSchedule(durationYears)
    const bonusPercentByYearDefault = buildFortisBonusPercentByYear(variant)
    const riskFeeResolver = createAlfaFortisRiskFeeResolver(inputs)

    return calculateResultsDaily({
      ...inputs,
      productVariant: toFortisProductVariantId(variant),
      yearlyPaymentsPlan: inputs.yearlyPaymentsPlan ?? [],
      initialCostByYear: shouldUseProductDefaults
        ? { ...initialCostByYearDefault, ...(inputs.initialCostByYear ?? {}) }
        : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      redemptionFeeByYear: shouldUseProductDefaults ? redemptionFeeByYearDefault : inputs.redemptionFeeByYear,
      redemptionFeeDefaultPercent: shouldUseProductDefaults ? 0 : (inputs.redemptionFeeDefaultPercent ?? 0),
      redemptionEnabled: shouldUseProductDefaults ? true : inputs.redemptionEnabled,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      isAccountSplitOpen: shouldUseProductDefaults ? false : inputs.isAccountSplitOpen,
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? false : inputs.isTaxBonusSeparateAccount,
      bonusMode: shouldUseProductDefaults ? "percentOnContribution" : inputs.bonusMode,
      bonusOnContributionPercent: shouldUseProductDefaults ? 0 : (inputs.bonusOnContributionPercent ?? 0),
      bonusOnContributionPercentByYear: shouldUseProductDefaults
        ? { ...bonusPercentByYearDefault, ...(inputs.bonusOnContributionPercentByYear ?? {}) }
        : inputs.bonusOnContributionPercentByYear,
      bonusPercentByYear: shouldUseProductDefaults ? {} : inputs.bonusPercentByYear,
      bonusAmountByYear: shouldUseProductDefaults ? {} : inputs.bonusAmountByYear,
      assetBasedFeePercent: shouldUseProductDefaults ? 0 : inputs.assetBasedFeePercent,
      adminFeePercentOfPayment: shouldUseProductDefaults ? 4 : (inputs.adminFeePercentOfPayment ?? 0),
      accountMaintenanceMonthlyPercent: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceMonthlyPercent
        : (inputs.accountMaintenanceMonthlyPercent ?? 0),
      accountMaintenanceStartMonth: shouldUseProductDefaults
        ? variantConfig.accountMaintenanceStartMonthMain
        : (inputs.accountMaintenanceStartMonth ?? 1),
      partialSurrenderFeeAmount: shouldUseProductDefaults
        ? variantConfig.partialSurrenderFixedFee
        : (inputs.partialSurrenderFeeAmount ?? 0),
      minimumBalanceAfterPartialSurrender: shouldUseProductDefaults
        ? variantConfig.minBalanceAfterPartialSurrender
        : (inputs.minimumBalanceAfterPartialSurrender ?? 0),
      minimumPaidUpValue: shouldUseProductDefaults ? variantConfig.minPaidUpValue : (inputs.minimumPaidUpValue ?? 0),
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

