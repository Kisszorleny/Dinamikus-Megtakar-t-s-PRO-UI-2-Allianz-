import assert from "node:assert/strict"

import {
  buildNnVista128AssetCostPercentByYear,
  buildNnVista128InitialCostByYear,
  buildNnVista128RedemptionFeeByYear,
  estimateNnVista128DurationYears,
  estimateNnVista128PartialSurrenderFixedFee,
  getNnVista128VariantConfig,
  NN_VISTA_128_MNB_CODE,
  NN_VISTA_128_PRODUCT_CODE,
  NN_VISTA_128_PRODUCT_VARIANT_EUR,
  resolveNnVista128AdminMonthlyAmount,
  resolveNnVista128ExtraordinarySalesPercent,
  resolveNnVista128MinMonthlyPayment,
  resolveNnVista128RiskMonthlyFeePerInsured,
  toNnVista128ProductVariantId,
} from "../lib/engine/products/nn-vista-128-config.ts"
import { nnVista128 } from "../lib/engine/products/nn-vista-128.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (±${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(NN_VISTA_128_MNB_CODE, "128")
  assert.equal(NN_VISTA_128_PRODUCT_CODE, "128")
  assert.equal(NN_VISTA_128_PRODUCT_VARIANT_EUR, "nn_vista_128_eur")
  assert.equal(toNnVista128ProductVariantId(), NN_VISTA_128_PRODUCT_VARIANT_EUR)
}

function runVariantAndDurationChecks(): void {
  const config14 = getNnVista128VariantConfig(14)
  assert.equal(config14.currency, "EUR")
  assert.equal(config14.minMonthlyPayment, 114)
  assert.equal(config14.minAnnualPayment, 1_368)

  const config20 = getNnVista128VariantConfig(20)
  assert.equal(config20.minMonthlyPayment, 82)
  assert.equal(config20.minAnnualPayment, 984)

  assert.equal(estimateNnVista128DurationYears({ durationUnit: "year", durationValue: 7 } as any), 10)
  assert.equal(estimateNnVista128DurationYears({ durationUnit: "year", durationValue: 35 } as any), 30)
  assert.equal(resolveNnVista128MinMonthlyPayment(10), 114)
  assert.equal(resolveNnVista128MinMonthlyPayment(20), 82)
}

function runRegularSalesChecks(): void {
  const duration16 = buildNnVista128InitialCostByYear(16)
  assert.equal(duration16[1], 16)
  assert.equal(duration16[2], 16)
  assert.equal(duration16[3], 16)
  assert.equal(duration16[4], 3)

  const duration25 = buildNnVista128InitialCostByYear(25)
  assert.equal(duration25[1], 20)
  assert.equal(duration25[2], 20)
  assert.equal(duration25[3], 20)
  assert.equal(duration25[4], 3)
}

function runAdminRiskAndAssetChecks(): void {
  assertClose(resolveNnVista128AdminMonthlyAmount("havi", "paid"), 4.6)
  assertClose(resolveNnVista128AdminMonthlyAmount("negyedéves", "paid"), 3.35)
  assertClose(resolveNnVista128AdminMonthlyAmount("féléves", "paid"), 3.05)
  assertClose(resolveNnVista128AdminMonthlyAmount("éves", "paid"), 2.95)
  assertClose(resolveNnVista128AdminMonthlyAmount("havi", "paid-up"), 4.4)
  assertClose(resolveNnVista128AdminMonthlyAmount("havi", "post-term"), 1.55)

  assertClose(resolveNnVista128RiskMonthlyFeePerInsured(45), 0.71)
  assertClose(resolveNnVista128RiskMonthlyFeePerInsured(66), 0.85)

  assert.equal(resolveNnVista128ExtraordinarySalesPercent(500, "paid"), 1)
  assert.equal(resolveNnVista128ExtraordinarySalesPercent(30_000, "paid"), 0.5)
  assert.equal(resolveNnVista128ExtraordinarySalesPercent(8_000, "paid-up"), 2)

  const equityAsset = buildNnVista128AssetCostPercentByYear(20, "equity")
  assert.equal(equityAsset[1], 1.7)
  assert.equal(equityAsset[20], 1.7)

  const targetDateAsset = buildNnVista128AssetCostPercentByYear(25, "target-date")
  assert.equal(targetDateAsset[1], 1.7)
  assert.equal(targetDateAsset[8], 1.55)
  assert.equal(targetDateAsset[12], 1.4)
}

function runRedemptionAndPartialChecks(): void {
  const redemption20 = buildNnVista128RedemptionFeeByYear(20)
  assertClose(redemption20[1], 53.7)
  assertClose(redemption20[2], 38.3)
  assertClose(redemption20[3], 30)
  assertClose(redemption20[5], 10)
  assertClose(redemption20[10], 1)

  assertClose(estimateNnVista128PartialSurrenderFixedFee(500), 4.4)
  assertClose(estimateNnVista128PartialSurrenderFixedFee(10_000), 30)
  assertClose(estimateNnVista128PartialSurrenderFixedFee(500_000), 30.2)
}

function runProductIntegrationChecks(): void {
  const result = nnVista128.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 6,
    frequency: "éves",
    yearsPlanned: 20,
    yearlyPaymentsPlan: [0, 2_000, 2_000],
    yearlyWithdrawalsPlan: [0, 0, 0],
    yearlyExtraTaxEligiblePaymentsPlan: [],
    yearlyExtraImmediateAccessPaymentsPlan: [],
    yearlyExtraImmediateAccessWithdrawalsPlan: [],
  })

  assert.equal(result.currency, "EUR")
  assertClose(result.totalTaxCredit, 0)
}

runIdentityChecks()
runVariantAndDurationChecks()
runRegularSalesChecks()
runAdminRiskAndAssetChecks()
runRedemptionAndPartialChecks()
runProductIntegrationChecks()

console.log("NN Vista 128 smoke checks passed")
