import assert from "node:assert/strict"

import {
  buildKnhHozamhalmozoAssetCostPercentByYear,
  buildKnhHozamhalmozoGiftBonusAmountByYear,
  buildKnhHozamhalmozoInitialAdminPlusCostByYear,
  buildKnhHozamhalmozoInitialCostByYear,
  estimateKnhHozamhalmozoDurationYears,
  getKnhHozamhalmozoVariantConfig,
  KNH_HOZAMHALMOZO_ASSET_FEE_ANNUAL_PERCENT,
  KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHS,
  KNH_HOZAMHALMOZO_MNB_CODE,
  KNH_HOZAMHALMOZO_MIN_ANNUAL_PAYMENT_HUF,
  KNH_HOZAMHALMOZO_MIN_MONTHLY_PAYMENT_HUF,
  KNH_HOZAMHALMOZO_PARTIAL_SURRENDER_FEE_HUF,
  KNH_HOZAMHALMOZO_PRODUCT_CODE,
  KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF,
  toKnhHozamhalmozoProductVariantId,
} from "../lib/engine/products/knh-hozamhalmozo-config.ts"

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
  assert.equal(KNH_HOZAMHALMOZO_MNB_CODE, "K&H-HOZAMHALMOZO-4")
  assert.equal(KNH_HOZAMHALMOZO_PRODUCT_CODE, "KH-HHZ4")
  assert.equal(KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF, "knh_hozamhalmozo_huf")
  assert.equal(toKnhHozamhalmozoProductVariantId(), KNH_HOZAMHALMOZO_PRODUCT_VARIANT_HUF)
}

function runConstantChecks(): void {
  assert.equal(KNH_HOZAMHALMOZO_MIN_MONTHLY_PAYMENT_HUF, 15_000)
  assert.equal(KNH_HOZAMHALMOZO_MIN_ANNUAL_PAYMENT_HUF, 180_000)
  assert.equal(KNH_HOZAMHALMOZO_INITIAL_ADMIN_MONTHS, 36)
  assert.equal(KNH_HOZAMHALMOZO_ASSET_FEE_ANNUAL_PERCENT, 2.2)
  assert.equal(KNH_HOZAMHALMOZO_PARTIAL_SURRENDER_FEE_HUF, 10_000)
}

function runDurationChecks(): void {
  assert.equal(estimateKnhHozamhalmozoDurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateKnhHozamhalmozoDurationYears({ durationUnit: "year", durationValue: 30 } as any), 25)
}

function runAcquisitionBandChecks(): void {
  const years = 12
  const low = buildKnhHozamhalmozoInitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 120_000) } as any,
    years,
  )
  const mid = buildKnhHozamhalmozoInitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 300_000) } as any,
    years,
  )
  const top = buildKnhHozamhalmozoInitialCostByYear(
    { yearlyPaymentsPlan: fullPaymentPlan(years, 360_000) } as any,
    years,
  )
  assert.equal(low[1], 4.5)
  assert.equal(mid[1], 2.5)
  assert.equal(top[1], 2)
}

function runInitialAdminChecks(): void {
  const plusCost = buildKnhHozamhalmozoInitialAdminPlusCostByYear(12)
  assert.equal(plusCost[1], 11_880)
  assert.equal(plusCost[2], 11_880)
  assert.equal(plusCost[3], 11_880)
  assert.equal(plusCost[4], undefined)
}

function runAssetCostChecks(): void {
  const asset = buildKnhHozamhalmozoAssetCostPercentByYear(12)
  assert.equal(asset[1], 2.2)
  assert.equal(asset[12], 2.2)
}

function runGiftBonusChecks(): void {
  const years = 25
  const paid = fullPaymentPlan(years, 180_000)
  const withdrawals = emptyPlan(years)
  const bonus = buildKnhHozamhalmozoGiftBonusAmountByYear(
    { yearlyPaymentsPlan: paid, yearlyWithdrawalsPlan: withdrawals } as any,
    years,
  )
  assertClose(bonus[10], 60_000)
  assertClose(bonus[15], 120_000)
  assertClose(bonus[20], 240_000)

  const blocked = buildKnhHozamhalmozoGiftBonusAmountByYear(
    {
      yearlyPaymentsPlan: paid,
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(years)
        out[5] = 1
        return out
      })(),
    } as any,
    years,
  )
  assert.equal(Object.keys(blocked).length, 0)
}

function runVariantConfigChecks(): void {
  const config = getKnhHozamhalmozoVariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.productCode, KNH_HOZAMHALMOZO_PRODUCT_CODE)
}

runIdentityChecks()
runConstantChecks()
runDurationChecks()
runAcquisitionBandChecks()
runInitialAdminChecks()
runAssetCostChecks()
runGiftBonusChecks()
runVariantConfigChecks()

console.log("K&H Hozamhalmozo smoke checks passed")
