import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildAlfaExclusivePlusRedemptionSchedule,
  estimateDurationYears,
  getAlfaExclusivePlusVariantConfig,
  resolveAlfaExclusivePlusVariant,
} from "./alfa-exclusive-plus-config"
import { createAlfaExclusivePlusRiskFeeResolver } from "./alfa-exclusive-plus-risk"
import type { ProductDefinition } from "./types"

function buildAlfaExclusiveDefaultInitialCosts(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  if (durationYears >= 5 && durationYears <= 10) {
    config[1] = 49
    config[2] = 0
    config[3] = 0
  } else if (durationYears === 11) {
    config[1] = 55
    config[2] = 5
    config[3] = 0
  } else if (durationYears === 12) {
    config[1] = 55
    config[2] = 15
    config[3] = 0
  } else if (durationYears === 13) {
    config[1] = 60
    config[2] = 25
    config[3] = 0
  } else if (durationYears === 14) {
    config[1] = 60
    config[2] = 35
    config[3] = 0
  } else if (durationYears >= 15) {
    config[1] = 60
    config[2] = 40
    config[3] = 10
  }
  return config
}

function buildAlfaExclusiveDefaultInvestedShare(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  for (let year = 1; year <= durationYears; year++) {
    config[year] = year === 1 ? 20 : year === 2 ? 50 : 80
  }
  return config
}

function buildAlfaExclusiveDefaultAssetCost(durationYears: number): Record<number, number> {
  const config: Record<number, number> = {}
  for (let year = 1; year <= durationYears; year++) {
    config[year] = 0.145
  }
  return config
}

export const alfaExclusivePlus: ProductDefinition = {
  id: "alfa-exclusive-plus",
  label: "Alfa Exclusive Plus",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveAlfaExclusivePlusVariant(inputs.productVariant)
    const variantConfig = getAlfaExclusivePlusVariantConfig(inputs.productVariant)
    const durationYears = estimateDurationYears(inputs)
    const initialCostByYearDefault = buildAlfaExclusiveDefaultInitialCosts(durationYears)
    const investedShareByYearDefault = buildAlfaExclusiveDefaultInvestedShare(durationYears)
    const assetCostPercentByYearDefault = buildAlfaExclusiveDefaultAssetCost(durationYears)
    // In default mode, always derive the redemption schedule from the resolved variant.
    // This prevents stale NY-05/TR-08 maps from leaking after product/toggle switches.
    const redemptionFeeByYear = shouldUseProductDefaults
      ? buildAlfaExclusivePlusRedemptionSchedule(durationYears, variantConfig.redemptionFeeAfterYear10Percent)
      : Object.keys(inputs.redemptionFeeByYear ?? {}).length > 0
        ? (inputs.redemptionFeeByYear ?? {})
        : buildAlfaExclusivePlusRedemptionSchedule(durationYears, variantConfig.redemptionFeeAfterYear10Percent)

    const taxCreditAllowed = variantConfig.taxCreditAllowed
    const riskFeeResolver = createAlfaExclusivePlusRiskFeeResolver(variant, inputs)

    return calculateResultsDaily({
      ...inputs,
      productVariant: variant === "tr08" ? "alfa_exclusive_plus_tr08" : "alfa_exclusive_plus_ny05",
      initialCostByYear: shouldUseProductDefaults ? initialCostByYearDefault : inputs.initialCostByYear,
      initialCostDefaultPercent: shouldUseProductDefaults ? 0 : inputs.initialCostDefaultPercent,
      investedShareByYear: shouldUseProductDefaults ? investedShareByYearDefault : inputs.investedShareByYear,
      investedShareDefaultPercent: shouldUseProductDefaults ? 100 : inputs.investedShareDefaultPercent,
      assetBasedFeePercent: shouldUseProductDefaults ? 0.145 : inputs.assetBasedFeePercent,
      assetCostPercentByYear: shouldUseProductDefaults ? assetCostPercentByYearDefault : inputs.assetCostPercentByYear,
      isAccountSplitOpen: shouldUseProductDefaults ? true : inputs.isAccountSplitOpen,
      isTaxBonusSeparateAccount: shouldUseProductDefaults ? true : inputs.isTaxBonusSeparateAccount,
      bonusMode: shouldUseProductDefaults ? "none" : inputs.bonusMode,
      redemptionBaseMode: shouldUseProductDefaults ? "surplus-only" : inputs.redemptionBaseMode,
      managementFeeFrequency: shouldUseProductDefaults ? "éves" : inputs.managementFeeFrequency,
      managementFeeValueType: shouldUseProductDefaults ? "percent" : inputs.managementFeeValueType,
      managementFeeValue: shouldUseProductDefaults ? 0 : inputs.managementFeeValue,
      managementFeeStartYear: shouldUseProductDefaults ? 1 : inputs.managementFeeStartYear,
      managementFeeStopYear: shouldUseProductDefaults ? 0 : inputs.managementFeeStopYear,
      yearlyManagementFeePercent: shouldUseProductDefaults ? 0 : inputs.yearlyManagementFeePercent,
      yearlyFixedManagementFeeAmount: shouldUseProductDefaults ? 0 : inputs.yearlyFixedManagementFeeAmount,
      adminFeeMonthlyAmount: shouldUseProductDefaults ? 0 : inputs.adminFeeMonthlyAmount,
      redemptionFeeByYear,
      redemptionFeeDefaultPercent: variantConfig.redemptionFeeAfterYear10Percent,
      paidUpMaintenanceFeeMonthlyAmount: shouldUseProductDefaults
        ? variantConfig.paidUpMaintenanceFeeMonthlyAmount
        : (inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0),
      paidUpMaintenanceFeeStartMonth: shouldUseProductDefaults
        ? variantConfig.paidUpMaintenanceFeeStartMonth
        : (inputs.paidUpMaintenanceFeeStartMonth ?? 10),
      enableTaxCredit: taxCreditAllowed ? inputs.enableTaxCredit : false,
      taxCreditRatePercent: taxCreditAllowed ? inputs.taxCreditRatePercent : 0,
      taxCreditCapPerYear: taxCreditAllowed ? inputs.taxCreditCapPerYear : 0,
      taxCreditLimitByYear: taxCreditAllowed ? inputs.taxCreditLimitByYear : {},
      taxCreditAmountByYear: taxCreditAllowed ? inputs.taxCreditAmountByYear : {},
      taxCreditYieldPercent: taxCreditAllowed ? inputs.taxCreditYieldPercent : 0,
      taxCreditCalendarPostingEnabled: taxCreditAllowed ? inputs.taxCreditCalendarPostingEnabled : false,
      riskFeeResolver: riskFeeResolver ?? inputs.riskFeeResolver,
      insuredEntryAge: inputs.insuredEntryAge ?? 38,
    })
  },
}
