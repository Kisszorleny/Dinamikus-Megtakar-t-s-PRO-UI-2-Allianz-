import assert from "node:assert/strict"

import {
  buildNnMotiva158AssetCostPercentByYear,
  buildNnMotiva158InitialCostByYear,
  buildNnMotiva158RedemptionFeeByYear,
  estimateNnMotiva158DurationYears,
  getNnMotiva158VariantConfig,
  NN_MOTIVA_168_MNB_CODE,
  NN_MOTIVA_168_PRODUCT_CODE,
  NN_MOTIVA_168_PRODUCT_VARIANT_EUR,
  NN_MOTIVA_158_MNB_CODE,
  NN_MOTIVA_158_PRODUCT_CODE,
  NN_MOTIVA_158_PRODUCT_VARIANT_HUF,
  resolveNnMotiva158AccidentDeathMonthlyFeePerInsured,
  resolveNnMotiva158AdminMonthlyAmount,
  resolveNnMotiva158ExtraordinarySalesPercent,
  resolveNnMotiva158VariantFromInputs,
  toNnMotiva158ProductVariantId,
} from "../lib/engine/products/nn-motiva-158-config.ts"
import { nnMotiva158 } from "../lib/engine/products/nn-motiva-158.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (±${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(NN_MOTIVA_158_MNB_CODE, "158")
  assert.equal(NN_MOTIVA_158_PRODUCT_CODE, "158")
  assert.equal(NN_MOTIVA_168_MNB_CODE, "168")
  assert.equal(NN_MOTIVA_168_PRODUCT_CODE, "168")
  assert.equal(NN_MOTIVA_158_PRODUCT_VARIANT_HUF, "nn_motiva_158_huf")
  assert.equal(NN_MOTIVA_168_PRODUCT_VARIANT_EUR, "nn_motiva_168_eur")
  assert.equal(toNnMotiva158ProductVariantId("huf"), NN_MOTIVA_158_PRODUCT_VARIANT_HUF)
  assert.equal(toNnMotiva158ProductVariantId("eur"), NN_MOTIVA_168_PRODUCT_VARIANT_EUR)
}

function runVariantAndDurationChecks(): void {
  const config = getNnMotiva158VariantConfig(20, "huf")
  assert.equal(config.currency, "HUF")
  assert.equal(config.minMonthlyPayment, 10_442)
  assert.equal(config.minAnnualPayment, 125_304)

  const eurConfig = getNnMotiva158VariantConfig(20, "eur")
  assert.equal(eurConfig.currency, "EUR")
  assert.equal(eurConfig.productCode, "168")
  assert.equal(resolveNnMotiva158VariantFromInputs({ currency: "EUR" } as any), "eur")

  assert.equal(estimateNnMotiva158DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateNnMotiva158DurationYears({ durationUnit: "year", durationValue: 48 } as any), 45)
}

function runRegularSalesChecks(): void {
  const costs10y = buildNnMotiva158InitialCostByYear(10)
  assert.equal(costs10y[1], 10)
  assert.equal(costs10y[2], 10)
  assert.equal(costs10y[3], 10)
  assert.equal(costs10y[4], 3)

  const costs20y = buildNnMotiva158InitialCostByYear(20)
  assert.equal(costs20y[1], 30)
  assert.equal(costs20y[2], 20)
  assert.equal(costs20y[3], 20)
  assert.equal(costs20y[4], 3)

  const costs15y = buildNnMotiva158InitialCostByYear(15)
  assert.equal(costs15y[1], 20)
  assert.equal(costs15y[2], 15)
  assert.equal(costs15y[3], 15)
}

function runAdminRiskAndAssetChecks(): void {
  assert.equal(resolveNnMotiva158AdminMonthlyAmount("havi", "non-postal", "paid"), 1_250)
  assertClose(resolveNnMotiva158AdminMonthlyAmount("havi", "non-postal", "paid", "eur"), 3.13)
  assert.equal(resolveNnMotiva158AdminMonthlyAmount("éves", "non-postal", "paid"), 790)
  assert.equal(resolveNnMotiva158AdminMonthlyAmount("havi", "postal", "paid-up"), 940)
  assert.equal(resolveNnMotiva158AdminMonthlyAmount("havi", "postal", "post-term"), 320)
  assert.equal(resolveNnMotiva158AccidentDeathMonthlyFeePerInsured(), 142)
  assertClose(resolveNnMotiva158AccidentDeathMonthlyFeePerInsured("eur"), 0.36)
  assert.equal(resolveNnMotiva158ExtraordinarySalesPercent(50_000), 6)

  const equityAsset = buildNnMotiva158AssetCostPercentByYear(20, "general-equity")
  assert.equal(equityAsset[1], 1.7)
  assert.equal(equityAsset[20], 1.7)

  const targetDateAsset = buildNnMotiva158AssetCostPercentByYear(25, "target-date")
  assert.equal(targetDateAsset[1], 1.7)
  assert.equal(targetDateAsset[10], 1.55)
  assert.equal(targetDateAsset[12], 1.4)
}

function runRedemptionChecks(): void {
  const redemption20y = buildNnMotiva158RedemptionFeeByYear(20)
  assertClose(redemption20y[1], 53.3)
  assertClose(redemption20y[2], 33.3)
  assertClose(redemption20y[3], 15)
  assertClose(redemption20y[5], 10)
  assertClose(redemption20y[10], 1)
  assertClose(redemption20y[20], 0)
}

function runProductIntegrationChecks(): void {
  const result = nnMotiva158.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 8,
    frequency: "éves",
    yearsPlanned: 20,
    yearlyPaymentsPlan: [0, 1_000_000, 1_000_000],
    yearlyWithdrawalsPlan: [0, 50_000, 50_000],
    yearlyExtraTaxEligiblePaymentsPlan: [],
    yearlyExtraImmediateAccessPaymentsPlan: [],
    yearlyExtraImmediateAccessWithdrawalsPlan: [],
  })

  assert.equal(result.currency, "HUF")
  assert.equal(result.yearlyBreakdown[0]?.withdrawalForYear, 0)
  assert.equal(result.yearlyBreakdown[1]?.withdrawalForYear, 0)
  assertClose(result.yearlyBreakdown[0]?.taxCreditForYear ?? 0, 130_000)
  assertClose(result.yearlyBreakdown[1]?.taxCreditForYear ?? 0, 130_000)

  const eurResult = nnMotiva158.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 8,
    frequency: "éves",
    yearsPlanned: 20,
    yearlyPaymentsPlan: [0, 2_000, 2_000],
    yearlyWithdrawalsPlan: [0, 50, 50],
    yearlyExtraTaxEligiblePaymentsPlan: [],
    yearlyExtraImmediateAccessPaymentsPlan: [],
    yearlyExtraImmediateAccessWithdrawalsPlan: [],
  })
  assert.equal(eurResult.currency, "EUR")
  assertClose(eurResult.yearlyBreakdown[0]?.taxCreditForYear ?? 0, 400)
}

runIdentityChecks()
runVariantAndDurationChecks()
runRegularSalesChecks()
runAdminRiskAndAssetChecks()
runRedemptionChecks()
runProductIntegrationChecks()

console.log("NN Motiva 158 smoke checks passed")
