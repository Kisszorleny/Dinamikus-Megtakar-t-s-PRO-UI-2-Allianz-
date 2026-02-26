import assert from "node:assert/strict"

import {
  buildCigNyugdijkotvenyeBonusAmountByYear,
  buildCigNyugdijkotvenyeBonusPercentByYear,
  buildCigNyugdijkotvenyeInitialCostByYear,
  CIG_NYUGDIJKOTVENYE_ENABLE_AGE_BASED_RISK_FEE_TABLE,
  CIG_NYUGDIJKOTVENYE_ENABLE_BONUS_STRICT_ELIGIBILITY_FLAGS,
  CIG_NYUGDIJKOTVENYE_ENABLE_DEPOSIT_PAYMENT_METHOD_FEES,
  CIG_NYUGDIJKOTVENYE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_MANAGEMENT_FEES,
  CIG_NYUGDIJKOTVENYE_ENABLE_LIQUIDITY_PLUS_ANNUAL_FEE,
  CIG_NYUGDIJKOTVENYE_ENABLE_PARTIAL_SURRENDER_PERCENT_FEES,
  CIG_NYUGDIJKOTVENYE_ENABLE_PAYOUT_POSTAL_FEE,
  CIG_NYUGDIJKOTVENYE_ENABLE_SWITCH_FEE_TRACKING,
  CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_FROM_YEAR8_ANNUAL_PERCENT,
  CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_YEAR7_PERCENT,
  CIG_NYUGDIJKOTVENYE_MIN_ANNUAL_PAYMENT,
  CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS,
  CIG_NYUGDIJKOTVENYE_MNB_CODE,
  CIG_NYUGDIJKOTVENYE_PRODUCT_CODE,
  CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT,
  CIG_NYUGDIJKOTVENYE_STRICT_UNSPECIFIED_RULES,
  CIG_NYUGDIJKOTVENYE_TAX_CREDIT_CAP_HUF,
  CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT,
  estimateCigNyugdijkotvenyeDurationYears,
  resolveCigNyugdijkotvenyeAssetFeeAnnualPercent,
  resolveCigNyugdijkotvenyeTaxCreditCapPerYear,
} from "../lib/engine/products/cig-nyugdijkotvenye-config.ts"

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = Array.from({ length: years + 1 }, () => 0)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function runIdentityChecks(): void {
  assert.equal(CIG_NYUGDIJKOTVENYE_MNB_CODE, "P0139")
  assert.equal(CIG_NYUGDIJKOTVENYE_PRODUCT_CODE, "NyugdijkotvenyE")
  assert.equal(CIG_NYUGDIJKOTVENYE_PRODUCT_VARIANT, "cig_nyugdijkotvenye_nyugdij")
}

function runConstantChecks(): void {
  assert.equal(CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS, 10)
  assert.equal(CIG_NYUGDIJKOTVENYE_MIN_ANNUAL_PAYMENT, 150_000)
  assert.equal(CIG_NYUGDIJKOTVENYE_TAX_CREDIT_RATE_PERCENT, 20)
  assert.equal(CIG_NYUGDIJKOTVENYE_TAX_CREDIT_CAP_HUF, 130_000)
  assert.equal(CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_YEAR7_PERCENT, 70)
  assert.equal(CIG_NYUGDIJKOTVENYE_LOYALTY_BONUS_FROM_YEAR8_ANNUAL_PERCENT, 1)
}

function runFlagChecks(): void {
  assert.equal(CIG_NYUGDIJKOTVENYE_STRICT_UNSPECIFIED_RULES, true)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_AGE_BASED_RISK_FEE_TABLE, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_DEPOSIT_PAYMENT_METHOD_FEES, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_SWITCH_FEE_TRACKING, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_PAYOUT_POSTAL_FEE, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_MANAGEMENT_FEES, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_LIQUIDITY_PLUS_ANNUAL_FEE, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_BONUS_STRICT_ELIGIBILITY_FLAGS, false)
  assert.equal(CIG_NYUGDIJKOTVENYE_ENABLE_PARTIAL_SURRENDER_PERCENT_FEES, false)
}

function runDurationChecks(): void {
  assert.equal(
    estimateCigNyugdijkotvenyeDurationYears({ durationUnit: "year", durationValue: 8 } as any),
    CIG_NYUGDIJKOTVENYE_MIN_DURATION_YEARS,
  )
  assert.equal(estimateCigNyugdijkotvenyeDurationYears({ durationUnit: "month", durationValue: 120 } as any), 10)
  assert.equal(estimateCigNyugdijkotvenyeDurationYears({ durationUnit: "day", durationValue: 3650 } as any), 10)
}

function runInitialCostTableChecks(): void {
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(10), { 1: 18, 2: 10, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 })
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(11), { 1: 18, 2: 18, 3: 47, 4: 0, 5: 0, 6: 0, 7: 0 })
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(12), { 1: 18, 2: 18, 3: 47, 4: 78, 5: 7, 6: 0, 7: 0 })
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(13), { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 11, 7: 0 })
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(14), { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 18, 7: 16 })
  assert.deepEqual(buildCigNyugdijkotvenyeInitialCostByYear(20), { 1: 18, 2: 18, 3: 47, 4: 78, 5: 18, 6: 18, 7: 47 })
}

function runAssetFeeChecks(): void {
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("LIKVIDITASI_PRO"), 1.46)
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("HAZAI_TOP_VALLALATOK_PRO"), 1.22)
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("TOKEVEDETT_PRO_2034"), 1.3)
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("HAZAI_PRO_VEGYES"), 1.548)
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("KELET_EUROPAI_PRO_RESZVENY"), 1.824)
  assert.equal(resolveCigNyugdijkotvenyeAssetFeeAnnualPercent("UNKNOWN"), 1.98)
}

function runBonusChecks(): void {
  const noWithdrawalBonus = buildCigNyugdijkotvenyeBonusAmountByYear(
    {
      durationUnit: "year",
      durationValue: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 150_000),
      yearlyWithdrawalsPlan: emptyPlan(15),
    } as any,
    15,
  )
  assert.equal(noWithdrawalBonus[7], 105_000)

  const withdrawalBlocksBonus = buildCigNyugdijkotvenyeBonusAmountByYear(
    {
      durationUnit: "year",
      durationValue: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 150_000),
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(15)
        out[3] = 1
        return out
      })(),
    } as any,
    15,
  )
  assert.equal(Object.keys(withdrawalBlocksBonus).length, 0)

  const bonusPercent = buildCigNyugdijkotvenyeBonusPercentByYear(12)
  assert.equal(bonusPercent[8], 1)
  assert.equal(bonusPercent[12], 1)
  assert.equal(bonusPercent[7], undefined)
}

function runTaxCreditCapChecks(): void {
  assert.equal(resolveCigNyugdijkotvenyeTaxCreditCapPerYear(), 130_000)
}

runIdentityChecks()
runConstantChecks()
runFlagChecks()
runDurationChecks()
runInitialCostTableChecks()
runAssetFeeChecks()
runBonusChecks()
runTaxCreditCapChecks()

console.log("CIG NyugdijkotvenyE smoke checks passed")
