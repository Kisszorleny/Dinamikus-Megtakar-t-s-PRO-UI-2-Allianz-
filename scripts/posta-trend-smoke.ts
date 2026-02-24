import assert from "node:assert/strict"

import {
  buildPostaTrendAssetCostPercentByYear,
  buildPostaTrendInitialCostByYear,
  buildPostaTrendRedemptionFeeByYear,
  estimatePostaTrendDurationYears,
  getPostaTrendVariantConfig,
  POSTA_TREND_ADMIN_MONTHLY_HUF,
  POSTA_TREND_DEFAULT_DURATION_YEARS,
  POSTA_TREND_MIN_ANNUAL_PAYMENT_HUF,
  POSTA_TREND_MIN_MONTHLY_PAYMENT_HUF,
  POSTA_TREND_MAX_ANNUAL_PAYMENT_HUF,
  POSTA_TREND_MAX_MONTHLY_PAYMENT_HUF,
  POSTA_TREND_MNB_CODE,
  POSTA_TREND_PRODUCT_CODE,
  POSTA_TREND_PRODUCT_VARIANT_HUF,
  toPostaTrendProductVariantId,
} from "../lib/engine/products/posta-trend-config.ts"

function runIdentityChecks(): void {
  assert.equal(POSTA_TREND_MNB_CODE, "23073")
  assert.equal(POSTA_TREND_PRODUCT_CODE, "23073")
  assert.equal(POSTA_TREND_PRODUCT_VARIANT_HUF, "posta_trend_huf")
  assert.equal(toPostaTrendProductVariantId(), POSTA_TREND_PRODUCT_VARIANT_HUF)
}

function runConstantChecks(): void {
  assert.equal(POSTA_TREND_DEFAULT_DURATION_YEARS, 10)
  assert.equal(POSTA_TREND_MIN_MONTHLY_PAYMENT_HUF, 25_000)
  assert.equal(POSTA_TREND_MAX_MONTHLY_PAYMENT_HUF, 100_000)
  assert.equal(POSTA_TREND_MIN_ANNUAL_PAYMENT_HUF, 300_000)
  assert.equal(POSTA_TREND_MAX_ANNUAL_PAYMENT_HUF, 1_200_000)
  assert.equal(POSTA_TREND_ADMIN_MONTHLY_HUF, 1_250)
}

function runDurationChecks(): void {
  assert.equal(estimatePostaTrendDurationYears({ durationUnit: "year", durationValue: 5 } as any), 10)
  assert.equal(estimatePostaTrendDurationYears({ durationUnit: "year", durationValue: 12 } as any), 12)
}

function runInitialCostChecks(): void {
  const table = buildPostaTrendInitialCostByYear(12)
  assert.equal(table[1], 25)
  assert.equal(table[2], 2)
  assert.equal(table[12], 2)
}

function runRedemptionChecks(): void {
  const table = buildPostaTrendRedemptionFeeByYear(12)
  assert.equal(table[1], 60)
  assert.equal(table[2], 50)
  assert.equal(table[3], 30)
  assert.equal(table[8], 5)
  assert.equal(table[10], 1)
  assert.equal(table[11], 0)
  assert.equal(table[12], 0)
}

function runAssetCostChecks(): void {
  const table = buildPostaTrendAssetCostPercentByYear(12)
  assert.equal(table[1], 0)
  assert.equal(table[12], 0)
}

function runVariantChecks(): void {
  const config = getPostaTrendVariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.productCode, POSTA_TREND_PRODUCT_CODE)
}

runIdentityChecks()
runConstantChecks()
runDurationChecks()
runInitialCostChecks()
runRedemptionChecks()
runAssetCostChecks()
runVariantChecks()

console.log("Posta Trend smoke checks passed")
