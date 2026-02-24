import assert from "node:assert/strict"

import {
  buildUniqaEletcel275AssetCostPercentByYearExtra,
  buildUniqaEletcel275AssetCostPercentByYearMain,
  buildUniqaEletcel275InitialCostByYear,
  buildUniqaEletcel275RedemptionFeeByYear,
  buildUniqaEletcel275RegularFeePercentByYear,
  estimateUniqaEletcel275DurationYears,
  getUniqaEletcel275VariantConfig,
  resolveUniqaEletcel275MinimumAnnualPayment,
  resolveUniqaEletcel275RegularFeePercent,
  resolveUniqaEletcel275Variant,
  toUniqaEletcel275ProductVariantId,
  UNIQA_ELETCEL_275_MNB_CODE,
  UNIQA_ELETCEL_275_PRODUCT_CODE,
  UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF,
} from "../lib/engine/products/uniqa-eletcel-275-config.ts"
import { uniqaEletcel275 } from "../lib/engine/products/uniqa-eletcel-275.ts"

function runIdentityChecks(): void {
  assert.equal(UNIQA_ELETCEL_275_MNB_CODE, "275")
  assert.equal(UNIQA_ELETCEL_275_PRODUCT_CODE, "275")
  assert.equal(UNIQA_ELETCEL_275_PRODUCT_VARIANT_HUF, "uniqa_eletcel_275_huf")
  assert.equal(resolveUniqaEletcel275Variant(), "huf")
  assert.equal(toUniqaEletcel275ProductVariantId(), "uniqa_eletcel_275_huf")
  assert.equal(getUniqaEletcel275VariantConfig().productCode, "275")
}

function runDurationAndMinimumChecks(): void {
  assert.equal(estimateUniqaEletcel275DurationYears({ durationUnit: "year", durationValue: 1 } as any), 10)
  assert.equal(estimateUniqaEletcel275DurationYears({ durationUnit: "year", durationValue: 200 } as any), 80)
  assert.equal(resolveUniqaEletcel275MinimumAnnualPayment(), 180_000)
}

function runInitialCostChecks(): void {
  const y10 = buildUniqaEletcel275InitialCostByYear(10)
  assert.equal(y10[1], 55)
  assert.equal(y10[2], 20)
  assert.equal(y10[3], 5)

  const y20 = buildUniqaEletcel275InitialCostByYear(20)
  assert.equal(y20[1], 75)
  assert.equal(y20[2], 35)
  assert.equal(y20[3], 5)
}

function runRegularFeeChecks(): void {
  assert.equal(resolveUniqaEletcel275RegularFeePercent(200_000, 4), 5)
  assert.equal(resolveUniqaEletcel275RegularFeePercent(320_000, 4), 3)
  assert.equal(resolveUniqaEletcel275RegularFeePercent(400_000, 4), 2)
  assert.equal(resolveUniqaEletcel275RegularFeePercent(200_000, 26), 1.5)

  const map = buildUniqaEletcel275RegularFeePercentByYear(200_000, 30)
  assert.equal(map[3], 0)
  assert.equal(map[4], 5)
  assert.equal(map[26], 1.5)
}

function runAssetAndRedemptionChecks(): void {
  const mainAsset = buildUniqaEletcel275AssetCostPercentByYearMain(30)
  assert.equal(mainAsset[1], 0)
  assert.equal(mainAsset[4], 1.95)
  assert.equal(mainAsset[16], 1.5)
  assert.equal(mainAsset[26], 1)

  const extraAsset = buildUniqaEletcel275AssetCostPercentByYearExtra(10)
  assert.equal(extraAsset[1], 1.5)
  assert.equal(extraAsset[10], 1.5)

  const redemption10 = buildUniqaEletcel275RedemptionFeeByYear(10)
  assert.equal(redemption10[1], 12)
  assert.equal(redemption10[9], 0)

  const redemption20 = buildUniqaEletcel275RedemptionFeeByYear(20)
  assert.equal(redemption20[1], 19)
  assert.equal(redemption20[10], 0)
}

function runIntegrationCheck(): void {
  const result = uniqaEletcel275.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(240_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: "uniqa_eletcel_275_huf",
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assert.equal(result.totalTaxCredit ?? 0, 0)
}

runIdentityChecks()
runDurationAndMinimumChecks()
runInitialCostChecks()
runRegularFeeChecks()
runAssetAndRedemptionChecks()
runIntegrationCheck()

console.log("UNIQA Eletcel 275 smoke checks passed")
