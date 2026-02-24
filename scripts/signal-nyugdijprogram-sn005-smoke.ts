import assert from "node:assert/strict"

import {
  buildSignalNyugdijprogramSn005BonusAmountByYear,
  buildSignalNyugdijprogramSn005CollectionFeePlusCostByYear,
  buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear,
  buildSignalNyugdijprogramSn005InitialCostByYear,
  buildSignalNyugdijprogramSn005MainAssetCostPercentByYear,
  estimateSignalNyugdijprogramSn005DurationYears,
  estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee,
  getSignalNyugdijprogramSn005VariantConfig,
  resolveSignalNyugdijprogramSn005PaymentMethodProfile,
  SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE,
  SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE,
  SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF,
  toSignalNyugdijprogramSn005ProductVariantId,
  validateSignalNyugdijprogramSn005ExtraordinaryMinimum,
  validateSignalNyugdijprogramSn005MinimumPayment,
} from "../lib/engine/products/signal-nyugdijprogram-sn005-config.ts"
import { signalNyugdijprogramSn005 } from "../lib/engine/products/signal-nyugdijprogram-sn005.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (+/-${epsilon})`)
}

function runIdentityChecks(): void {
  assert.equal(SIGNAL_NYUGDIJPROGRAM_SN005_MNB_CODE, "SN005")
  assert.equal(SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_CODE, "SN005")
  assert.equal(SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF, "signal_nyugdijprogram_sn005_huf")
  assert.equal(toSignalNyugdijprogramSn005ProductVariantId(), SIGNAL_NYUGDIJPROGRAM_SN005_PRODUCT_VARIANT_HUF)
}

function runDurationAndMinimumChecks(): void {
  const config = getSignalNyugdijprogramSn005VariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.minDurationYears, 10)
  assert.equal(config.maxDurationYears, 80)

  assert.equal(estimateSignalNyugdijprogramSn005DurationYears({ durationUnit: "year", durationValue: 1 } as any), 10)
  assert.equal(estimateSignalNyugdijprogramSn005DurationYears({ durationUnit: "year", durationValue: 100 } as any), 80)

  const validMinimum = {
    frequency: "havi",
    yearlyPaymentsPlan: [0, 200_000],
  } as any
  const invalidMinimum = {
    frequency: "éves",
    yearlyPaymentsPlan: [0, 120_000],
  } as any
  assert.equal(validateSignalNyugdijprogramSn005MinimumPayment(validMinimum), true)
  assert.equal(validateSignalNyugdijprogramSn005MinimumPayment(invalidMinimum), false)
  assert.equal(validateSignalNyugdijprogramSn005ExtraordinaryMinimum(35_000), true)
  assert.equal(validateSignalNyugdijprogramSn005ExtraordinaryMinimum(20_000), false)
}

function runCostTableChecks(): void {
  const initialCosts18 = buildSignalNyugdijprogramSn005InitialCostByYear(18)
  assert.equal(initialCosts18[1], 74)
  assert.equal(initialCosts18[2], 44)
  assert.equal(initialCosts18[3], 4)
  assert.equal(initialCosts18[4], 0)

  const initialCosts20 = buildSignalNyugdijprogramSn005InitialCostByYear(20)
  assert.equal(initialCosts20[2], 44)
  assert.equal(initialCosts20[3], 14)

  const vakMainStandard = buildSignalNyugdijprogramSn005MainAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakMainStandard[1], 0)
  assert.equal(vakMainStandard[4], 2)

  const vakMainReduced = buildSignalNyugdijprogramSn005MainAssetCostPercentByYear(20, "HOLD Szef Abszolut Hozamu Alap")
  assert.equal(vakMainReduced[1], 0)
  assert.equal(vakMainReduced[4], 1.6)

  const vakExtraStandard = buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear(20, "global-bond")
  assert.equal(vakExtraStandard[1], 2)

  const vakExtraReduced = buildSignalNyugdijprogramSn005ExtraAssetCostPercentByYear(20, "Amundi Ovatos Kotveny")
  assert.equal(vakExtraReduced[1], 1.6)
}

function runFeeAndBonusChecks(): void {
  assertClose(estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee(30_000), 300)
  assertClose(estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee(1_000_000), 1_500)
  assertClose(estimateSignalNyugdijprogramSn005PartialSurrenderFixedFee(3_000_000), 1_500)

  const plusCostByYear = buildSignalNyugdijprogramSn005CollectionFeePlusCostByYear(
    {
      yearlyExtraTaxEligiblePaymentsPlan: [0, 2_000_000, 4_000_000, 11_000_000],
      yearlyExtraImmediateAccessPaymentsPlan: [0, 0, 1_000_000, 2_000_000],
    } as any,
    20,
  )
  assertClose(plusCostByYear[1], 60_000)
  assertClose(plusCostByYear[2], 130_000)
  assertClose(plusCostByYear[3], 260_000)

  const yearlyPayments = Array(26).fill(360_000)
  const bonusAmountByYearBank = buildSignalNyugdijprogramSn005BonusAmountByYear(
    { yearlyPaymentsPlan: yearlyPayments } as any,
    25,
    "bank-transfer",
  )
  const bonusAmountByYearPostal = buildSignalNyugdijprogramSn005BonusAmountByYear(
    { yearlyPaymentsPlan: yearlyPayments } as any,
    25,
    "postal-check",
  )
  assert.ok((bonusAmountByYearBank[1] ?? 0) > (bonusAmountByYearPostal[1] ?? 0))
  assert.ok((bonusAmountByYearBank[10] ?? 0) > 0)
  assert.ok((bonusAmountByYearBank[15] ?? 0) > 0)
}

function runProfileResolutionChecks(): void {
  assert.equal(resolveSignalNyugdijprogramSn005PaymentMethodProfile(undefined), "bank-transfer")
  assert.equal(
    resolveSignalNyugdijprogramSn005PaymentMethodProfile(
      "signal_nyugdijprogram_sn005_huf__pm_direct_debit",
    ),
    "direct-debit",
  )
}

function runIntegrationCheck(): void {
  const result = signalNyugdijprogramSn005.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(360_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: toSignalNyugdijprogramSn005ProductVariantId(),
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assert.ok((result.totalTaxCredit ?? 0) > 0)
}

runIdentityChecks()
runDurationAndMinimumChecks()
runCostTableChecks()
runFeeAndBonusChecks()
runProfileResolutionChecks()
runIntegrationCheck()

console.log("Signal SN005 smoke checks passed")
