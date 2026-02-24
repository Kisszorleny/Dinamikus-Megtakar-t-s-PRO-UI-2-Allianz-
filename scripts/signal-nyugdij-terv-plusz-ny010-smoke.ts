import assert from "node:assert/strict"

import {
  buildSignalNyugdijTervPluszNy010BonusAmountByYear,
  buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear,
  buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear,
  buildSignalNyugdijTervPluszNy010InitialCostByYear,
  buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear,
  estimateSignalNyugdijTervPluszNy010DurationYears,
  estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee,
  getSignalNyugdijTervPluszNy010VariantConfig,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE,
  SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF,
  toSignalNyugdijTervPluszNy010ProductVariantId,
  validateSignalNyugdijTervPluszNy010ExtraordinaryMinimum,
  validateSignalNyugdijTervPluszNy010MinimumPayment,
} from "../lib/engine/products/signal-nyugdij-terv-plusz-ny010-config.ts"
import { signalNyugdijTervPluszNy010 } from "../lib/engine/products/signal-nyugdij-terv-plusz-ny010.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (+/-${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_MNB_CODE, "NY010")
  assert.equal(SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_CODE, "NY010")
  assert.equal(SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF, "signal_nyugdij_terv_plusz_ny010_huf")
  assert.equal(toSignalNyugdijTervPluszNy010ProductVariantId(), SIGNAL_NYUGDIJ_TERV_PLUSZ_NY010_PRODUCT_VARIANT_HUF)
}

function runDurationAndMinimumChecks(): void {
  const config = getSignalNyugdijTervPluszNy010VariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.minDurationYears, 10)
  assert.equal(config.maxDurationYears, 80)

  assert.equal(estimateSignalNyugdijTervPluszNy010DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(
    estimateSignalNyugdijTervPluszNy010DurationYears({ durationUnit: "year", durationValue: 100 } as any),
    80,
  )

  const validMinimum10Years = {
    durationUnit: "year",
    durationValue: 10,
    frequency: "havi",
    yearlyPaymentsPlan: [0, 240_000],
  } as any
  const validMinimum15Years = {
    durationUnit: "year",
    durationValue: 15,
    frequency: "havi",
    yearlyPaymentsPlan: [0, 180_000],
  } as any
  const invalidMinimum15Years = {
    durationUnit: "year",
    durationValue: 15,
    frequency: "havi",
    yearlyPaymentsPlan: [0, 170_000],
  } as any

  assert.equal(validateSignalNyugdijTervPluszNy010MinimumPayment(validMinimum10Years), true)
  assert.equal(validateSignalNyugdijTervPluszNy010MinimumPayment(validMinimum15Years), true)
  assert.equal(validateSignalNyugdijTervPluszNy010MinimumPayment(invalidMinimum15Years), false)
  assert.equal(validateSignalNyugdijTervPluszNy010ExtraordinaryMinimum(35_000), true)
  assert.equal(validateSignalNyugdijTervPluszNy010ExtraordinaryMinimum(20_000), false)
}

function runCostTableChecks(): void {
  const initialCosts18 = buildSignalNyugdijTervPluszNy010InitialCostByYear(18)
  assert.equal(initialCosts18[1], 74)
  assert.equal(initialCosts18[2], 44)
  assert.equal(initialCosts18[3], 4)
  assert.equal(initialCosts18[4], 0)

  const initialCosts20 = buildSignalNyugdijTervPluszNy010InitialCostByYear(20)
  assert.equal(initialCosts20[2], 44)
  assert.equal(initialCosts20[3], 14)

  const vakMainStandard = buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakMainStandard[1], 0)
  assert.equal(vakMainStandard[4], 2)

  const vakMainReduced = buildSignalNyugdijTervPluszNy010MainAssetCostPercentByYear(20, "SIFI rovid kotveny")
  assert.equal(vakMainReduced[1], 0)
  assert.equal(vakMainReduced[4], 1.3)

  const vakExtraStandard = buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakExtraStandard[1], 2)

  const vakExtraReduced = buildSignalNyugdijTervPluszNy010ExtraAssetCostPercentByYear(20, "SIFI rövid kötvény")
  assert.equal(vakExtraReduced[1], 1.3)
}

function runFeeAndBonusChecks(): void {
  assertClose(estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee(30_000), 300)
  assertClose(estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee(1_000_000), 3_000)
  assertClose(estimateSignalNyugdijTervPluszNy010PartialSurrenderFixedFee(3_000_000), 5_000)

  const yearlyPayments = Array(26).fill(300_000)
  const bonusAmountByYear = buildSignalNyugdijTervPluszNy010BonusAmountByYear(
    {
      frequency: "havi",
      yearlyPaymentsPlan: yearlyPayments,
    } as any,
    25,
  )
  assert.ok((bonusAmountByYear[1] ?? 0) > 0)
  assert.ok((bonusAmountByYear[10] ?? 0) > 0)
  assert.ok((bonusAmountByYear[15] ?? 0) > 0)

  const hozamplusz20 = buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear(20)
  assert.equal(hozamplusz20[9], 0)
  assert.equal(hozamplusz20[10], 0.3)
  assert.equal(hozamplusz20[20], 0.3)

  const hozamplusz25 = buildSignalNyugdijTervPluszNy010HozampluszBonusPercentByYear(25)
  assert.equal(hozamplusz25[19], 0.3)
  assert.equal(hozamplusz25[20], 2)
}

function runIntegrationCheck(): void {
  const result = signalNyugdijTervPluszNy010.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 25,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 25,
    yearlyPaymentsPlan: Array(26).fill(300_000),
    yearlyWithdrawalsPlan: Array(26).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(26).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(26).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(26).fill(0),
    productVariant: toSignalNyugdijTervPluszNy010ProductVariantId(),
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assert.ok((result.totalTaxCredit ?? 0) > 0)
}

runIdentityChecks()
runDurationAndMinimumChecks()
runCostTableChecks()
runFeeAndBonusChecks()
runIntegrationCheck()

console.log("Signal NY010 smoke checks passed")
