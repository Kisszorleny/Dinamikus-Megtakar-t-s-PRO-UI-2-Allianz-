import assert from "node:assert/strict"

import {
  buildUniqaPremiumLife190ExtraAssetCostPercentByYear,
  buildUniqaPremiumLife190InitialCostByYear,
  buildUniqaPremiumLife190MainAssetCostPercentByYear,
  buildUniqaPremiumLife190RedemptionFeeByYear,
  buildUniqaPremiumLife190RegularFeePercentByYear,
  estimateUniqaPremiumLife190DurationYears,
  estimateUniqaPremiumLife190SwitchFee,
  getUniqaPremiumLife190VariantConfig,
  resolveUniqaPremiumLife190MainAssetAnnualPercent,
  resolveUniqaPremiumLife190MinimumAnnualPayment,
  resolveUniqaPremiumLife190RegularFeePercent,
  resolveUniqaPremiumLife190Variant,
  toUniqaPremiumLife190ProductVariantId,
  UNIQA_PREMIUM_LIFE_190_MNB_CODE,
  UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE,
  UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF,
} from "../lib/engine/products/uniqa-premium-life-190-config.ts"
import { uniqaPremiumLife190 } from "../lib/engine/products/uniqa-premium-life-190.ts"

function runIdentityChecks(): void {
  assert.equal(UNIQA_PREMIUM_LIFE_190_MNB_CODE, "190")
  assert.equal(UNIQA_PREMIUM_LIFE_190_PRODUCT_CODE, "190")
  assert.equal(UNIQA_PREMIUM_LIFE_190_PRODUCT_VARIANT_HUF, "uniqa_premium_life_190_huf")
  assert.equal(resolveUniqaPremiumLife190Variant(), "huf")
  assert.equal(toUniqaPremiumLife190ProductVariantId(), "uniqa_premium_life_190_huf")
  assert.equal(getUniqaPremiumLife190VariantConfig().productCode, "190")
}

function runDurationAndMinimumChecks(): void {
  assert.equal(estimateUniqaPremiumLife190DurationYears({ durationUnit: "year", durationValue: 1 } as any), 10)
  assert.equal(estimateUniqaPremiumLife190DurationYears({ durationUnit: "year", durationValue: 500 } as any), 80)
  assert.equal(resolveUniqaPremiumLife190MinimumAnnualPayment(), 180_000)
}

function runInitialAndRegularFeeChecks(): void {
  const initial = buildUniqaPremiumLife190InitialCostByYear(20)
  assert.equal(initial[1], 80)
  assert.equal(initial[2], 40)
  assert.equal(initial[3], 5)
  assert.equal(initial[4], 0)

  assert.equal(resolveUniqaPremiumLife190RegularFeePercent(200_000, 4), 5)
  assert.equal(resolveUniqaPremiumLife190RegularFeePercent(320_000, 4), 3)
  assert.equal(resolveUniqaPremiumLife190RegularFeePercent(400_000, 4), 2)
  assert.equal(resolveUniqaPremiumLife190RegularFeePercent(200_000, 26), 1.5)

  const feeMap = buildUniqaPremiumLife190RegularFeePercentByYear(200_000, 30)
  assert.equal(feeMap[3], 0)
  assert.equal(feeMap[4], 5)
  assert.equal(feeMap[26], 1.5)
}

function runAssetAndRedemptionChecks(): void {
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(2, "PPA"), 0)
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(4, "PPA"), 0)
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(4, "XYZ"), 1.95)
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(16, "PPA"), 1.05)
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(16, "XYZ"), 1.5)
  assert.equal(resolveUniqaPremiumLife190MainAssetAnnualPercent(26, "XYZ"), 1)

  const mainAsset = buildUniqaPremiumLife190MainAssetCostPercentByYear(30, "PPA")
  assert.equal(mainAsset[1], 0)
  assert.equal(mainAsset[4], 0)
  assert.equal(mainAsset[16], 1.05)
  assert.equal(mainAsset[26], 1)

  const extraAsset = buildUniqaPremiumLife190ExtraAssetCostPercentByYear(12)
  assert.equal(extraAsset[1], 1.5)
  assert.equal(extraAsset[12], 1.5)

  const redemption = buildUniqaPremiumLife190RedemptionFeeByYear(20)
  assert.equal(redemption[1], 0)
  assert.equal(redemption[2], 11)
  assert.equal(redemption[9], 0.5)
  assert.equal(redemption[10], 0)
  assert.equal(redemption[20], 0)
}

function runSwitchFeeChecks(): void {
  assert.equal(estimateUniqaPremiumLife190SwitchFee(0), 300)
  assert.equal(estimateUniqaPremiumLife190SwitchFee(100_000), 300)
  assert.equal(estimateUniqaPremiumLife190SwitchFee(1_000_000), 3_000)
}

function runIntegrationCheck(): void {
  const result = uniqaPremiumLife190.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    selectedFundId: "PPA",
    yearlyPaymentsPlan: Array(21).fill(240_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: "uniqa_premium_life_190_huf",
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assert.equal(result.totalTaxCredit ?? 0, 0)
}

runIdentityChecks()
runDurationAndMinimumChecks()
runInitialAndRegularFeeChecks()
runAssetAndRedemptionChecks()
runSwitchFeeChecks()
runIntegrationCheck()

console.log("UNIQA Premium Life 190 smoke checks passed")
