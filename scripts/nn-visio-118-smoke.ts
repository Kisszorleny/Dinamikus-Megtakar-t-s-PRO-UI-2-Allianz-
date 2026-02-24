import assert from "node:assert/strict"

import {
  buildNnVisio118AssetCostPercentByYear,
  buildNnVisio118InitialCostByYear,
  buildNnVisio118RedemptionFeeByYear,
  estimateNnVisio118DurationYears,
  estimateNnVisio118PartialSurrenderFixedFee,
  getNnVisio118VariantConfig,
  NN_VISIO_118_MNB_CODE,
  NN_VISIO_118_PRODUCT_CODE,
  NN_VISIO_118_PRODUCT_VARIANT_HUF,
  resolveNnVisio118AccidentDeathMonthlyFeePerInsured,
  resolveNnVisio118AdminMonthlyAmount,
  resolveNnVisio118ExtraordinarySalesPercent,
  resolveNnVisio118MinMonthlyPayment,
  toNnVisio118ProductVariantId,
} from "../lib/engine/products/nn-visio-118-config.ts"
import { nnVisio118 } from "../lib/engine/products/nn-visio-118.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (±${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(NN_VISIO_118_MNB_CODE, "118")
  assert.equal(NN_VISIO_118_PRODUCT_CODE, "118")
  assert.equal(NN_VISIO_118_PRODUCT_VARIANT_HUF, "nn_visio_118_huf")
  assert.equal(toNnVisio118ProductVariantId(), NN_VISIO_118_PRODUCT_VARIANT_HUF)
}

function runVariantAndDurationChecks(): void {
  const config14 = getNnVisio118VariantConfig(14)
  assert.equal(config14.currency, "HUF")
  assert.equal(config14.minMonthlyPayment, 23_800)
  assert.equal(config14.minAnnualPayment, 285_600)

  const config20 = getNnVisio118VariantConfig(20)
  assert.equal(config20.minMonthlyPayment, 15_000)
  assert.equal(config20.minAnnualPayment, 180_000)

  assert.equal(estimateNnVisio118DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateNnVisio118DurationYears({ durationUnit: "year", durationValue: 50 } as any), 45)
  assert.equal(resolveNnVisio118MinMonthlyPayment(10), 23_800)
  assert.equal(resolveNnVisio118MinMonthlyPayment(20), 15_000)
}

function runRegularSalesChecks(): void {
  const baseline = buildNnVisio118InitialCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyPaymentsPlan: [0, 1_800_000, 1_800_000, 1_800_000, 1_800_000],
    } as any,
    20,
  )
  assert.equal(baseline[1], 30)
  assert.equal(baseline[2], 15)
  assert.equal(baseline[3], 15)
  assert.equal(baseline[4], 4)

  const highPremium = buildNnVisio118InitialCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyPaymentsPlan: [0, 2_500_000],
    } as any,
    20,
  )
  assertClose(highPremium[1], 24.8)
}

function runAdminRiskAndAssetChecks(): void {
  assert.equal(resolveNnVisio118AdminMonthlyAmount("havi", "postal", "paid"), 1_285)
  assert.equal(resolveNnVisio118AdminMonthlyAmount("éves", "non-postal", "paid"), 815)
  assert.equal(resolveNnVisio118AdminMonthlyAmount("havi", "postal", "paid-up"), 940)

  assert.equal(resolveNnVisio118AccidentDeathMonthlyFeePerInsured(45), 142)
  assert.equal(resolveNnVisio118AccidentDeathMonthlyFeePerInsured(66), 170)

  assert.equal(resolveNnVisio118ExtraordinarySalesPercent(50_000, "paid"), 2)
  assert.equal(resolveNnVisio118ExtraordinarySalesPercent(250_000, "paid"), 1)
  assert.equal(resolveNnVisio118ExtraordinarySalesPercent(6_000_000, "paid-up"), 1)

  const equityAsset = buildNnVisio118AssetCostPercentByYear(20, "general-equity")
  assert.equal(equityAsset[1], 1.7)
  assert.equal(equityAsset[20], 1.7)

  const targetDateAsset = buildNnVisio118AssetCostPercentByYear(25, "target-date")
  assert.equal(targetDateAsset[1], 1.7)
  assert.equal(targetDateAsset[8], 1.55)
  assert.equal(targetDateAsset[12], 1.4)
}

function runRedemptionChecks(): void {
  const redemption20 = buildNnVisio118RedemptionFeeByYear(20)
  assertClose(redemption20[1], 58.7)
  assertClose(redemption20[2], 44.16)
  assertClose(redemption20[5], 14)
  assertClose(redemption20[10], 1)

  assert.equal(estimateNnVisio118PartialSurrenderFixedFee(100_000), 1_020)
  assert.equal(estimateNnVisio118PartialSurrenderFixedFee(1_000_000), 3_000)
  assert.equal(estimateNnVisio118PartialSurrenderFixedFee(5_000_000), 8_470)
}

function runProductIntegrationChecks(): void {
  const result = nnVisio118.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 8,
    frequency: "éves",
    yearsPlanned: 20,
    yearlyPaymentsPlan: [0, 1_000_000, 1_000_000],
    yearlyWithdrawalsPlan: [0, 0, 0],
    yearlyExtraTaxEligiblePaymentsPlan: [],
    yearlyExtraImmediateAccessPaymentsPlan: [],
    yearlyExtraImmediateAccessWithdrawalsPlan: [],
  })

  assert.equal(result.currency, "HUF")
  assertClose(result.totalTaxCredit, 0)
}

runIdentityChecks()
runVariantAndDurationChecks()
runRegularSalesChecks()
runAdminRiskAndAssetChecks()
runRedemptionChecks()
runProductIntegrationChecks()

console.log("NN Visio 118 smoke checks passed")
