import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import {
  buildAlfaExclusivePlusRedemptionSchedule,
  estimateDurationYears,
  getAlfaExclusivePlusVariantConfig,
  resolveAlfaExclusivePlusVariant,
} from "./alfa-exclusive-plus-config"
import { createAlfaExclusivePlusRiskFeeResolver } from "./alfa-exclusive-plus-risk"
import type { ProductDefinition } from "./types"

export const alfaExclusivePlus: ProductDefinition = {
  id: "alfa-exclusive-plus",
  label: "Alfa Exclusive Plus",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const shouldUseProductDefaults = inputs.disableProductDefaults !== true
    const variant = resolveAlfaExclusivePlusVariant(inputs.productVariant)
    const variantConfig = getAlfaExclusivePlusVariantConfig(inputs.productVariant)
    const durationYears = estimateDurationYears(inputs)
    const redemptionFeeByYear =
      Object.keys(inputs.redemptionFeeByYear ?? {}).length > 0
        ? (inputs.redemptionFeeByYear ?? {})
        : buildAlfaExclusivePlusRedemptionSchedule(durationYears, variantConfig.redemptionFeeAfterYear10Percent)

    const taxCreditAllowed = variantConfig.taxCreditAllowed
    const riskFeeResolver = createAlfaExclusivePlusRiskFeeResolver(variant, inputs)

    return calculateResultsDaily({
      ...inputs,
      productVariant: variant === "tr08" ? "alfa_exclusive_plus_tr08" : "alfa_exclusive_plus_ny05",
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
