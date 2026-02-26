import assert from "node:assert/strict"

import {
  buildKnhNyugdijbiztositas4AssetCostPercentByYear,
  buildKnhNyugdijbiztositas4GiftBonusAmountByYear,
  buildKnhNyugdijbiztositas4InitialAdminPlusCostByYear,
  buildKnhNyugdijbiztositas4InitialCostByYear,
  estimateKnhNyugdijbiztositas4DurationYears,
  getKnhNyugdijbiztositas4VariantConfig,
  KNH_NYUGDIJBIZTOSITAS4_ALLOW_PARTIAL_SURRENDER,
  KNH_NYUGDIJBIZTOSITAS4_ASSET_FEE_ANNUAL_PERCENT,
  KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHS,
  KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_HUF,
  KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_MOBILEBANK_HUF,
  KNH_NYUGDIJBIZTOSITAS4_MIN_MONTHLY_PAYMENT_HUF,
  KNH_NYUGDIJBIZTOSITAS4_MNB_CODE,
  KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE,
  KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF,
  KNH_NYUGDIJBIZTOSITAS4_SURRENDER_FEE_HUF,
  toKnhNyugdijbiztositas4ProductVariantId,
} from "../lib/engine/products/knh-nyugdijbiztositas4-config.ts"

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
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_MNB_CODE, "173")
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE, "KH-NY4")
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF, "knh_nyugdijbiztositas4_huf")
  assert.equal(toKnhNyugdijbiztositas4ProductVariantId(), KNH_NYUGDIJBIZTOSITAS4_PRODUCT_VARIANT_HUF)
}

function runConstantChecks(): void {
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_MIN_MONTHLY_PAYMENT_HUF, 15_000)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_HUF, 180_000)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_MIN_ANNUAL_PAYMENT_MOBILEBANK_HUF, 240_000)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_INITIAL_ADMIN_MONTHS, 36)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_ASSET_FEE_ANNUAL_PERCENT, 1.7)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_SURRENDER_FEE_HUF, 10_000)
  assert.equal(KNH_NYUGDIJBIZTOSITAS4_ALLOW_PARTIAL_SURRENDER, false)
}

function runDurationChecks(): void {
  assert.equal(estimateKnhNyugdijbiztositas4DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateKnhNyugdijbiztositas4DurationYears({ durationUnit: "year", durationValue: 30 } as any), 25)
}

function runAcquisitionBandChecks(): void {
  const years = 12
  const low = buildKnhNyugdijbiztositas4InitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 120_000) } as any,
    years,
  )
  const mid = buildKnhNyugdijbiztositas4InitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 300_000) } as any,
    years,
  )
  const top = buildKnhNyugdijbiztositas4InitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 360_000) } as any,
    years,
  )
  assert.equal(low[1], 4.5)
  assert.equal(mid[1], 2.5)
  assert.equal(top[1], 2)
}

function runInitialAdminChecks(): void {
  const plusCost = buildKnhNyugdijbiztositas4InitialAdminPlusCostByYear(12)
  assert.equal(plusCost[1], 11_880)
  assert.equal(plusCost[2], 11_880)
  assert.equal(plusCost[3], 11_880)
  assert.equal(plusCost[4], undefined)
}

function runAssetCostChecks(): void {
  const asset = buildKnhNyugdijbiztositas4AssetCostPercentByYear(12)
  assert.equal(asset[1], 1.7)
  assert.equal(asset[12], 1.7)
}

function runGiftBonusChecks(): void {
  const years = 25
  const paid = fullPaymentPlan(years, 180_000)
  const withdrawals = emptyPlan(years)
  const bonus = buildKnhNyugdijbiztositas4GiftBonusAmountByYear(
    { yearlyPaymentsPlan: paid, yearlyWithdrawalsPlan: withdrawals } as any,
    years,
  )
  assertClose(bonus[10], 60_000)
  assertClose(bonus[15], 120_000)
  assertClose(bonus[20], 240_000)

  const blocked = buildKnhNyugdijbiztositas4GiftBonusAmountByYear(
    {
      yearlyPaymentsPlan: paid,
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(years)
        out[6] = 1
        return out
      })(),
    } as any,
    years,
  )
  assert.equal(Object.keys(blocked).length, 0)
}

function runVariantConfigChecks(): void {
  const config = getKnhNyugdijbiztositas4VariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.productCode, KNH_NYUGDIJBIZTOSITAS4_PRODUCT_CODE)
  assert.equal(config.minAnnualPayment, 180_000)
}

runIdentityChecks()
runConstantChecks()
runDurationChecks()
runAcquisitionBandChecks()
runInitialAdminChecks()
runAssetCostChecks()
runGiftBonusChecks()
runVariantConfigChecks()

console.log("K&H Nyugdijbiztositas 4 smoke checks passed")
