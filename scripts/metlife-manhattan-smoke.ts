import assert from "node:assert/strict"

import {
  buildMetlifeManhattanAssetCostPercentByYear,
  buildMetlifeManhattanInitialCostByYear,
  buildMetlifeManhattanRedemptionFeeByYear,
  buildMetlifeManhattanRegularBonusAmountByYear,
  estimateMetlifeManhattanDurationYears,
  getMetlifeManhattanVariantConfig,
  METLIFE_MANHATTAN_EUR_MNB_CODE,
  METLIFE_MANHATTAN_HUF_MNB_CODE,
  METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_EUR,
  METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_HUF,
  METLIFE_MANHATTAN_PRODUCT_CODE_EUR,
  METLIFE_MANHATTAN_PRODUCT_CODE_HUF,
  METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR,
  METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF,
  resolveMetlifeManhattanVariant,
  toMetlifeManhattanProductVariantId,
} from "../lib/engine/products/metlife-manhattan-config.ts"

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = Array.from({ length: years + 1 }, () => 0)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function assertClose(actual: number | undefined, expected: number, tolerance = 1e-6): void {
  assert.ok(actual !== undefined, `Expected value ${expected}, but got undefined`)
  assert.ok(Math.abs(actual - expected) <= tolerance, `Expected ${expected}, got ${actual}`)
}

function runIdentityChecks(): void {
  assert.equal(METLIFE_MANHATTAN_HUF_MNB_CODE, "MET-689")
  assert.equal(METLIFE_MANHATTAN_EUR_MNB_CODE, "MET-789")
  assert.equal(METLIFE_MANHATTAN_PRODUCT_CODE_HUF, "MET-689")
  assert.equal(METLIFE_MANHATTAN_PRODUCT_CODE_EUR, "MET-789")
  assert.equal(METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF, "metlife_manhattan_huf")
  assert.equal(METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR, "metlife_manhattan_eur")
  assert.equal(METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_HUF, 120_000)
  assert.equal(METLIFE_MANHATTAN_MIN_ANNUAL_PAYMENT_EUR, 400)
}

function runVariantChecks(): void {
  assert.equal(resolveMetlifeManhattanVariant(undefined, "HUF"), "huf")
  assert.equal(resolveMetlifeManhattanVariant(undefined, "EUR"), "eur")
  assert.equal(resolveMetlifeManhattanVariant("metlife_manhattan_huf", "EUR"), "huf")
  assert.equal(resolveMetlifeManhattanVariant("metlife_manhattan_eur", "HUF"), "eur")
  assert.equal(resolveMetlifeManhattanVariant("MET-689", "EUR"), "huf")
  assert.equal(resolveMetlifeManhattanVariant("MET-789", "HUF"), "eur")

  assert.equal(toMetlifeManhattanProductVariantId("huf"), METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF)
  assert.equal(toMetlifeManhattanProductVariantId("eur"), METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR)

  const hufConfig = getMetlifeManhattanVariantConfig(METLIFE_MANHATTAN_PRODUCT_VARIANT_HUF, "HUF")
  const eurConfig = getMetlifeManhattanVariantConfig(METLIFE_MANHATTAN_PRODUCT_VARIANT_EUR, "EUR")
  assert.equal(hufConfig.currency, "HUF")
  assert.equal(eurConfig.currency, "EUR")
}

function runDurationChecks(): void {
  assert.equal(estimateMetlifeManhattanDurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateMetlifeManhattanDurationYears({ durationUnit: "month", durationValue: 240 } as any), 20)
}

function runInitialCostChecks(): void {
  const table = buildMetlifeManhattanInitialCostByYear(12)
  assert.equal(table[1], 60)
  assert.equal(table[2], 35)
  assert.equal(table[3], 20)
  assert.equal(table[4], 0)
  assert.equal(table[12], 0)
}

function runRedemptionChecks(): void {
  const schedule = buildMetlifeManhattanRedemptionFeeByYear(12)
  // Charge = 100 - payout percentage from product annex.
  assert.equal(schedule[1], 35)
  assert.equal(schedule[2], 20)
  assert.equal(schedule[3], 4)
  assert.equal(schedule[8], 3)
  assert.equal(schedule[10], 1)
  assert.equal(schedule[11], 0)
}

function runAssetFeeChecks(): void {
  const schedule = buildMetlifeManhattanAssetCostPercentByYear(20)
  assert.equal(schedule[1], 3.25)
  assert.equal(schedule[15], 3.25)
  assert.equal(schedule[16], 2.93)
  assert.equal(schedule[20], 2.93)
}

function runBonusChecksAtYear10(): void {
  const years = 20
  const noWithdrawal = emptyPlan(years)

  const hufLow = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 150_000), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "HUF",
  )
  const hufMid = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 250_000), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "HUF",
  )
  const hufTop = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 350_000), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "HUF",
  )
  assertClose(hufLow[10], 75_000)
  assertClose(hufMid[10], 250_000)
  assertClose(hufTop[10], 385_000)

  const eurLow = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 700), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "EUR",
  )
  const eurMid = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 900), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "EUR",
  )
  const eurTop = buildMetlifeManhattanRegularBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 1_200), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    "EUR",
  )
  assertClose(eurLow[10], 350)
  assertClose(eurMid[10], 900)
  assertClose(eurTop[10], 1_320)
}

runIdentityChecks()
runVariantChecks()
runDurationChecks()
runInitialCostChecks()
runRedemptionChecks()
runAssetFeeChecks()
runBonusChecksAtYear10()

console.log("MetLife Manhattan smoke checks passed")
