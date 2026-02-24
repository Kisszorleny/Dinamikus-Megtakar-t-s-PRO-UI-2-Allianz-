import assert from "node:assert/strict"

import {
  buildSignalOngondoskodasiWl009AdminFeePercentByYear,
  buildSignalOngondoskodasiWl009BonusAmountByYear,
  buildSignalOngondoskodasiWl009ExtraAndLoyaltyAssetCostPercentByYear,
  buildSignalOngondoskodasiWl009HozampluszBonusPercentByYear,
  buildSignalOngondoskodasiWl009InitialCostByYear,
  buildSignalOngondoskodasiWl009MainAssetCostPercentByYear,
  estimateSignalOngondoskodasiWl009DurationYears,
  estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee,
  getSignalOngondoskodasiWl009VariantConfig,
  SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE,
  SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE,
  SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF,
  toSignalOngondoskodasiWl009ProductVariantId,
  validateSignalOngondoskodasiWl009ExtraordinaryMinimum,
  validateSignalOngondoskodasiWl009MinimumPayment,
} from "../lib/engine/products/signal-ongondoskodasi-wl009-config.ts"
import { signalOngondoskodasiWl009 } from "../lib/engine/products/signal-ongondoskodasi-wl009.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (+/-${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(SIGNAL_ONGONDOSKODASI_WL009_MNB_CODE, "WL009")
  assert.equal(SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_CODE, "WL009")
  assert.equal(SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF, "signal_ongondoskodasi_wl009_huf")
  assert.equal(toSignalOngondoskodasiWl009ProductVariantId(), SIGNAL_ONGONDOSKODASI_WL009_PRODUCT_VARIANT_HUF)
}

function runDurationAndMinimumChecks(): void {
  const config = getSignalOngondoskodasiWl009VariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.minDurationYears, 1)
  assert.equal(config.maxDurationYears, 80)

  assert.equal(estimateSignalOngondoskodasiWl009DurationYears({ durationUnit: "year", durationValue: 0 } as any), 1)
  assert.equal(estimateSignalOngondoskodasiWl009DurationYears({ durationUnit: "year", durationValue: 120 } as any), 80)

  const validMinimum = {
    frequency: "havi",
    yearlyPaymentsPlan: [0, 180_000],
  } as any
  const invalidMinimum = {
    frequency: "éves",
    yearlyPaymentsPlan: [0, 120_000],
  } as any
  assert.equal(validateSignalOngondoskodasiWl009MinimumPayment(validMinimum), true)
  assert.equal(validateSignalOngondoskodasiWl009MinimumPayment(invalidMinimum), false)
  assert.equal(validateSignalOngondoskodasiWl009ExtraordinaryMinimum(35_000), true)
  assert.equal(validateSignalOngondoskodasiWl009ExtraordinaryMinimum(20_000), false)
}

function runCostTableChecks(): void {
  const initialCosts = buildSignalOngondoskodasiWl009InitialCostByYear(20)
  assert.equal(initialCosts[1], 64)
  assert.equal(initialCosts[2], 34)
  assert.equal(initialCosts[3], 4)
  assert.equal(initialCosts[4], 0)

  const admin = buildSignalOngondoskodasiWl009AdminFeePercentByYear(20)
  assert.equal(admin[1], 16)
  assert.equal(admin[8], 16)
  assert.equal(admin[9], 6)

  const vakMainStandard = buildSignalOngondoskodasiWl009MainAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakMainStandard[1], 0)
  assert.equal(vakMainStandard[4], 2.45)

  const vakMainSifi = buildSignalOngondoskodasiWl009MainAssetCostPercentByYear(20, "SIFI Rövid Kötvény Alap U")
  assert.equal(vakMainSifi[1], 1.8)
  assert.equal(vakMainSifi[4], 1.8)

  const vakExtra = buildSignalOngondoskodasiWl009ExtraAndLoyaltyAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakExtra[1], 2.45)
}

function runFeeAndBonusChecks(): void {
  assertClose(estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee(30_000), 300)
  assertClose(estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee(1_000_000), 3_000)
  assertClose(estimateSignalOngondoskodasiWl009PartialSurrenderFixedFee(3_000_000), 5_000)

  const bonusAmountByYear = buildSignalOngondoskodasiWl009BonusAmountByYear({
    inputs: {
      yearlyPaymentsPlan: Array(26).fill(480_000),
    } as any,
    durationYears: 25,
  })
  assert.ok((bonusAmountByYear[10] ?? 0) > 0)
  assert.ok((bonusAmountByYear[15] ?? 0) > 0)
  assert.ok((bonusAmountByYear[20] ?? 0) > 0)

  const hozamplusz = buildSignalOngondoskodasiWl009HozampluszBonusPercentByYear(25)
  assert.equal(hozamplusz[3], 0)
  assert.equal(hozamplusz[4], 1)
}

function runIntegrationCheck(): void {
  const result = signalOngondoskodasiWl009.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(480_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: toSignalOngondoskodasiWl009ProductVariantId(),
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assertClose(result.totalTaxCredit, 0)
}

runIdentityChecks()
runDurationAndMinimumChecks()
runCostTableChecks()
runFeeAndBonusChecks()
runIntegrationCheck()

console.log("Signal WL009 smoke checks passed")
