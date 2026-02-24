import assert from "node:assert/strict"

import {
  buildPostaTrendNyugdijAssetCostPercentByYear,
  buildPostaTrendNyugdijInitialCostByYear,
  buildPostaTrendNyugdijRedemptionFeeByYear,
  estimatePostaTrendNyugdijDurationYears,
  getPostaTrendNyugdijVariantConfig,
  POSTA_TREND_NYUGDIJ_ADMIN_MONTHLY_HUF,
  POSTA_TREND_NYUGDIJ_DEFAULT_DURATION_YEARS,
  POSTA_TREND_NYUGDIJ_MAX_ANNUAL_PAYMENT_HUF,
  POSTA_TREND_NYUGDIJ_MAX_MONTHLY_PAYMENT_HUF,
  POSTA_TREND_NYUGDIJ_MIN_ANNUAL_PAYMENT_HUF,
  POSTA_TREND_NYUGDIJ_MIN_MONTHLY_PAYMENT_HUF,
  POSTA_TREND_NYUGDIJ_MNB_CODE,
  POSTA_TREND_NYUGDIJ_PRODUCT_CODE,
  POSTA_TREND_NYUGDIJ_PRODUCT_VARIANT_HUF,
  toPostaTrendNyugdijProductVariantId,
} from "../lib/engine/products/posta-trend-nyugdij-config.ts"

function runIdentityChecks(): void {
  assert.equal(POSTA_TREND_NYUGDIJ_MNB_CODE, "23073-NY")
  assert.equal(POSTA_TREND_NYUGDIJ_PRODUCT_CODE, "23073-NY")
  assert.equal(POSTA_TREND_NYUGDIJ_PRODUCT_VARIANT_HUF, "posta_trend_nyugdij_huf")
  assert.equal(toPostaTrendNyugdijProductVariantId(), POSTA_TREND_NYUGDIJ_PRODUCT_VARIANT_HUF)
}

function runConstantChecks(): void {
  assert.equal(POSTA_TREND_NYUGDIJ_DEFAULT_DURATION_YEARS, 10)
  assert.equal(POSTA_TREND_NYUGDIJ_MIN_MONTHLY_PAYMENT_HUF, 25_000)
  assert.equal(POSTA_TREND_NYUGDIJ_MAX_MONTHLY_PAYMENT_HUF, 100_000)
  assert.equal(POSTA_TREND_NYUGDIJ_MIN_ANNUAL_PAYMENT_HUF, 300_000)
  assert.equal(POSTA_TREND_NYUGDIJ_MAX_ANNUAL_PAYMENT_HUF, 1_200_000)
  assert.equal(POSTA_TREND_NYUGDIJ_ADMIN_MONTHLY_HUF, 1_250)
}

function runDurationChecks(): void {
  assert.equal(estimatePostaTrendNyugdijDurationYears({ durationUnit: "year", durationValue: 5 } as any), 10)
  assert.equal(estimatePostaTrendNyugdijDurationYears({ durationUnit: "year", durationValue: 12 } as any), 12)
}

function runInitialCostChecks(): void {
  const table = buildPostaTrendNyugdijInitialCostByYear(12)
  assert.equal(table[1], 25)
  assert.equal(table[2], 2)
  assert.equal(table[12], 2)
}

function runRedemptionChecks(): void {
  const table = buildPostaTrendNyugdijRedemptionFeeByYear(12)
  assert.equal(table[1], 60)
  assert.equal(table[2], 50)
  assert.equal(table[3], 30)
  assert.equal(table[8], 5)
  assert.equal(table[10], 1)
  assert.equal(table[11], 0)
}

function runAssetCostChecks(): void {
  const table = buildPostaTrendNyugdijAssetCostPercentByYear(12)
  assert.equal(table[1], 0)
  assert.equal(table[12], 0)
}

function runVariantChecks(): void {
  const config = getPostaTrendNyugdijVariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.productCode, POSTA_TREND_NYUGDIJ_PRODUCT_CODE)
}

runIdentityChecks()
runConstantChecks()
runDurationChecks()
runInitialCostChecks()
runRedemptionChecks()
runAssetCostChecks()
runVariantChecks()

console.log("Posta Trend Nyugdij smoke checks passed")
