import assert from "node:assert/strict"

import {
  buildMetlifeNyugdijprogramAssetCostPercentByYear,
  buildMetlifeNyugdijprogramBonusAmountByYear,
  buildMetlifeNyugdijprogramCollectionFeePlusCostByYear,
  buildMetlifeNyugdijprogramInitialCostByYear,
  buildMetlifeNyugdijprogramRedemptionFeeByYear,
  estimateMetlifeNyugdijprogramDurationYears,
  getMetlifeNyugdijprogramVariantConfig,
  METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE,
  METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR,
  METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF,
  resolveMetlifeNyugdijprogramVariant,
  toMetlifeNyugdijprogramProductVariantId,
} from "../lib/engine/products/metlife-nyugdijprogram-config.ts"

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
  assert.equal(METLIFE_NYUGDIJPROGRAM_HUF_MNB_CODE, "MET-688")
  assert.equal(METLIFE_NYUGDIJPROGRAM_EUR_MNB_CODE, "MET-788")
  assert.equal(METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_HUF, "MET-688")
  assert.equal(METLIFE_NYUGDIJPROGRAM_PRODUCT_CODE_EUR, "MET-788")
  assert.equal(METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF, "metlife_nyugdijprogram_huf")
  assert.equal(METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR, "metlife_nyugdijprogram_eur")
}

function runVariantChecks(): void {
  assert.equal(resolveMetlifeNyugdijprogramVariant(undefined, "HUF"), "huf")
  assert.equal(resolveMetlifeNyugdijprogramVariant(undefined, "EUR"), "eur")
  assert.equal(resolveMetlifeNyugdijprogramVariant("metlife_nyugdijprogram_huf", "EUR"), "huf")
  assert.equal(resolveMetlifeNyugdijprogramVariant("metlife_nyugdijprogram_eur", "HUF"), "eur")
  assert.equal(resolveMetlifeNyugdijprogramVariant("MET-688", "EUR"), "huf")
  assert.equal(resolveMetlifeNyugdijprogramVariant("MET-788", "HUF"), "eur")
  assert.equal(toMetlifeNyugdijprogramProductVariantId("huf"), METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_HUF)
  assert.equal(toMetlifeNyugdijprogramProductVariantId("eur"), METLIFE_NYUGDIJPROGRAM_PRODUCT_VARIANT_EUR)
}

function runDurationChecks(): void {
  assert.equal(estimateMetlifeNyugdijprogramDurationYears({ durationUnit: "year", durationValue: 4 } as any), 5)
  assert.equal(estimateMetlifeNyugdijprogramDurationYears({ durationUnit: "month", durationValue: 240 } as any), 20)
}

function runMinimumPaymentChecks(): void {
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "HUF", 6).minMonthlyPayment, 41_667)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "HUF", 8).minMonthlyPayment, 29_167)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "HUF", 12).minMonthlyPayment, 20_000)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "HUF", 20).minMonthlyPayment, 15_000)

  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "EUR", 6).minMonthlyPayment, 142)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "EUR", 8).minMonthlyPayment, 100)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "EUR", 12).minMonthlyPayment, 42)
  assert.equal(getMetlifeNyugdijprogramVariantConfig(undefined, "EUR", 20).minMonthlyPayment, 33)
}

function runInitialCostChecks(): void {
  assert.deepEqual(buildMetlifeNyugdijprogramInitialCostByYear(5), { 1: 60, 2: 15, 3: 0 })
  assert.deepEqual(buildMetlifeNyugdijprogramInitialCostByYear(7), { 1: 60, 2: 20, 3: 0 })
  assert.deepEqual(buildMetlifeNyugdijprogramInitialCostByYear(10), { 1: 60, 2: 35, 3: 15 })
}

function runAssetFeeChecks(): void {
  const schedule = buildMetlifeNyugdijprogramAssetCostPercentByYear(20)
  assert.equal(schedule[1], 2.65)
  assert.equal(schedule[15], 2.65)
  assert.equal(schedule[16], 2.39)
  assert.equal(schedule[20], 2.39)
}

function runRedemptionChecks(): void {
  const schedule = buildMetlifeNyugdijprogramRedemptionFeeByYear(25)
  assert.equal(schedule[1], 35)
  assert.equal(schedule[2], 22)
  assert.equal(schedule[3], 8)
  assert.equal(schedule[10], 6)
  assert.equal(schedule[15], 4)
  assert.equal(schedule[20], 1)
  assert.equal(schedule[21], 0)
}

function runCollectionFeeChecks(): void {
  const hufMonthly = buildMetlifeNyugdijprogramCollectionFeePlusCostByYear(10, "havi", 100)
  const eurAnnual = buildMetlifeNyugdijprogramCollectionFeePlusCostByYear(10, "éves", 0)
  assert.equal(hufMonthly[1], 1_200)
  assert.equal(hufMonthly[10], 1_200)
  assert.equal(eurAnnual[1], 0)
}

function runBonusChecks(): void {
  const years = 25
  const noWithdrawal = emptyPlan(years)
  const hufConfig = getMetlifeNyugdijprogramVariantConfig(undefined, "HUF", years)
  const eurConfig = getMetlifeNyugdijprogramVariantConfig(undefined, "EUR", years)

  const hufAbove = buildMetlifeNyugdijprogramBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 700_000), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    hufConfig,
  )
  assertClose(hufAbove[10], 595_000)
  assertClose(hufAbove[20], 276_500)
  assertClose(hufAbove[25], 329_000)

  const hufBelow = buildMetlifeNyugdijprogramBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 600_000), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    hufConfig,
  )
  assert.equal(Object.keys(hufBelow).length, 0)

  const eurAbove = buildMetlifeNyugdijprogramBonusAmountByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 2_500), yearlyWithdrawalsPlan: noWithdrawal } as any,
    years,
    eurConfig,
  )
  assertClose(eurAbove[10], 2_125)
}

runIdentityChecks()
runVariantChecks()
runDurationChecks()
runMinimumPaymentChecks()
runInitialCostChecks()
runAssetFeeChecks()
runRedemptionChecks()
runCollectionFeeChecks()
runBonusChecks()

console.log("MetLife Nyugdijprogram smoke checks passed")
