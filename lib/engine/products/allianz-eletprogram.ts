import { calculateResultsDaily, type InputsDaily, type ResultsDaily } from "../calculate-results-daily"
import type { ProductDefinition } from "./types"

const MONTHLY_FEE_HUF = 990
const MONTHLY_FEE_EUR = 3.3
const ANNUAL_ASSET_FEE_PERCENT = 1.19
const YEAR1_INITIAL_COST_PERCENT = 33
const YEAR1_INITIAL_COST_BONUS_PERCENT = 79

export const allianzEletprogram: ProductDefinition = {
  id: "allianz-eletprogram",
  label: "Allianz Életprogram (Forintos, nyugdíjbiztosítás nélkül)",
  calculate: (inputs: InputsDaily): ResultsDaily => {
    const isBonusVariant = inputs.productVariant === "allianz_bonusz_eletprogram"
    const year1InitialCostPercent = isBonusVariant ? YEAR1_INITIAL_COST_BONUS_PERCENT : YEAR1_INITIAL_COST_PERCENT
    const initialCostByYear = {
      ...(inputs.initialCostByYear ?? {}),
      1: isBonusVariant ? YEAR1_INITIAL_COST_BONUS_PERCENT : inputs.initialCostByYear?.[1] ?? year1InitialCostPercent,
    }
    const monthlyFee = inputs.currency === "EUR" ? MONTHLY_FEE_EUR : MONTHLY_FEE_HUF

    return calculateResultsDaily({
      ...inputs,
      currency: inputs.currency ?? "HUF",
      initialCostByYear,
      initialCostDefaultPercent: inputs.initialCostDefaultPercent ?? 0,
      bonusMode: isBonusVariant ? "refundInitialCostIncreasing" : inputs.bonusMode,
      // Ensure no extra management fee layer is applied
      managementFeeValueType: "percent",
      managementFeeValue: 0,
      yearlyFixedManagementFeeAmount: 0,
      adminFeeMonthlyAmount: monthlyFee,
      assetBasedFeePercent: ANNUAL_ASSET_FEE_PERCENT,
      taxCreditToInvestedAccount: inputs.enableTaxCredit === true,
    })
  },
}
