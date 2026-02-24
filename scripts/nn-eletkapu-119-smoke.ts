import assert from "node:assert/strict"

import {
  buildNnEletkapu119AssetCostPercentByYear,
  buildNnEletkapu119InitialCostByYear,
  buildNnEletkapu119RedemptionFeeByYear,
  estimateNnEletkapu119DurationYears,
  estimateNnEletkapu119PartialSurrenderFixedFee,
  getNnEletkapu119VariantConfig,
  NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF,
  NN_ELETKAPU_119_MNB_CODE,
  NN_ELETKAPU_119_PRODUCT_CODE,
  NN_ELETKAPU_119_PRODUCT_VARIANT_HUF,
  resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured,
  resolveNnEletkapu119AdminMonthlyAmount,
  resolveNnEletkapu119ExtraordinarySalesPercent,
  resolveNnEletkapu119MinMonthlyPayment,
  toNnEletkapu119ProductVariantId,
} from "../lib/engine/products/nn-eletkapu-119-config.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (±${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(NN_ELETKAPU_119_MNB_CODE, "119")
  assert.equal(NN_ELETKAPU_119_PRODUCT_CODE, "119")
  assert.equal(NN_ELETKAPU_119_PRODUCT_VARIANT_HUF, "nn_eletkapu_119_huf")
  assert.equal(toNnEletkapu119ProductVariantId(), NN_ELETKAPU_119_PRODUCT_VARIANT_HUF)
}

function runVariantChecks(): void {
  const config14 = getNnEletkapu119VariantConfig(14)
  assert.equal(config14.currency, "HUF")
  assert.equal(config14.minMonthlyPayment, 23_800)
  assert.equal(config14.minAnnualPayment, 285_600)

  const config20 = getNnEletkapu119VariantConfig(20)
  assert.equal(config20.minMonthlyPayment, 15_000)
  assert.equal(config20.minAnnualPayment, 180_000)
}

function runDurationChecks(): void {
  assert.equal(estimateNnEletkapu119DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateNnEletkapu119DurationYears({ durationUnit: "year", durationValue: 30 } as any), 25)
  assert.equal(resolveNnEletkapu119MinMonthlyPayment(10), 23_800)
  assert.equal(resolveNnEletkapu119MinMonthlyPayment(15), 15_000)
}

function runRegularSalesChecks(): void {
  const baseline = buildNnEletkapu119InitialCostByYear(
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

  const highPremium = buildNnEletkapu119InitialCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyPaymentsPlan: [0, 2_500_000],
    } as any,
    20,
  )
  assertClose(highPremium[1], 24.8)
}

function runAdminAndRiskChecks(): void {
  assert.equal(resolveNnEletkapu119AdminMonthlyAmount("havi", "postal", "paid"), 1_285)
  assert.equal(resolveNnEletkapu119AdminMonthlyAmount("éves", "non-postal", "paid"), 815)
  assert.equal(resolveNnEletkapu119AdminMonthlyAmount("havi", "postal", "paid-up"), NN_ELETKAPU_119_ADMIN_PAIDUP_MONTHLY_HUF)

  assert.equal(resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured(45), 142)
  assert.equal(resolveNnEletkapu119AccidentDeathMonthlyFeePerInsured(66), 170)
}

function runExtraordinaryAndAssetChecks(): void {
  assert.equal(resolveNnEletkapu119ExtraordinarySalesPercent(50_000, "paid"), 2)
  assert.equal(resolveNnEletkapu119ExtraordinarySalesPercent(250_000, "paid"), 1)
  assert.equal(resolveNnEletkapu119ExtraordinarySalesPercent(6_000_000, "paid-up"), 1)

  const generalAsset = buildNnEletkapu119AssetCostPercentByYear(20, "general-equity")
  assert.equal(generalAsset[1], 1.7)
  assert.equal(generalAsset[20], 1.7)

  const targetDateAsset = buildNnEletkapu119AssetCostPercentByYear(25, "target-date")
  assert.equal(targetDateAsset[1], 1.7)
  assert.equal(targetDateAsset[8], 1.55)
  assert.equal(targetDateAsset[12], 1.4)
}

function runRedemptionAndPartialSurrenderChecks(): void {
  const redemption10y = buildNnEletkapu119RedemptionFeeByYear(10)
  assertClose(redemption10y[1], 70.8)
  assertClose(redemption10y[2], 55)
  assertClose(redemption10y[3], 29.2)
  assertClose(redemption10y[10], 1)

  assert.equal(estimateNnEletkapu119PartialSurrenderFixedFee(100_000), 1_020)
  assert.equal(estimateNnEletkapu119PartialSurrenderFixedFee(1_000_000), 3_000)
  assert.equal(estimateNnEletkapu119PartialSurrenderFixedFee(5_000_000), 8_470)
}

runIdentityChecks()
runVariantChecks()
runDurationChecks()
runRegularSalesChecks()
runAdminAndRiskChecks()
runExtraordinaryAndAssetChecks()
runRedemptionAndPartialSurrenderChecks()

console.log("NN Életkapu 119 smoke checks passed")
