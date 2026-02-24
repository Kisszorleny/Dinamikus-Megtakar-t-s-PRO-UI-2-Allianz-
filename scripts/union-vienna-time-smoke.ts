import assert from "node:assert/strict"

import {
  buildUnionViennaTimeExtraordinaryEarlySurrenderApproxCostByYear,
  buildUnionViennaTimeInitialCostByYear,
  buildUnionViennaTimeLoyaltyBonusAmountByYear,
  buildUnionViennaTimeMaturityBonusAmountByYear,
  estimateUnionViennaTimeDurationYears,
  estimateUnionViennaTimeTransactionFee,
  getUnionViennaTimeVariantConfig,
  resolveUnionViennaTimeVariant,
  toUnionViennaTimeProductVariantId,
  UNION_VIENNA_TIME_MNB_CODE_564,
  UNION_VIENNA_TIME_MNB_CODE_584,
  UNION_VIENNA_TIME_MNB_CODE_606,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_564,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_584,
  UNION_VIENNA_TIME_PRODUCT_VARIANT_606,
} from "../lib/engine/products/union-vienna-time-config.ts"
import { unionViennaTime } from "../lib/engine/products/union-vienna-time.ts"

function runIdentityAndVariantChecks(): void {
  assert.equal(UNION_VIENNA_TIME_MNB_CODE_564, "564")
  assert.equal(UNION_VIENNA_TIME_MNB_CODE_584, "584")
  assert.equal(UNION_VIENNA_TIME_MNB_CODE_606, "606")
  assert.equal(UNION_VIENNA_TIME_PRODUCT_VARIANT_564, "union_vienna_time_564")
  assert.equal(UNION_VIENNA_TIME_PRODUCT_VARIANT_584, "union_vienna_time_584")
  assert.equal(UNION_VIENNA_TIME_PRODUCT_VARIANT_606, "union_vienna_time_606")

  assert.equal(resolveUnionViennaTimeVariant(undefined, "erste"), "erste-564")
  assert.equal(resolveUnionViennaTimeVariant(undefined, "standard"), "standard-584")
  assert.equal(resolveUnionViennaTimeVariant(undefined, "select"), "select-606")
  assert.equal(resolveUnionViennaTimeVariant("union_vienna_time_564"), "erste-564")
  assert.equal(resolveUnionViennaTimeVariant("union_vienna_time_606"), "select-606")
  assert.equal(resolveUnionViennaTimeVariant("union_vienna_time_584"), "standard-584")

  assert.equal(toUnionViennaTimeProductVariantId("erste-564"), "union_vienna_time_564")
  assert.equal(toUnionViennaTimeProductVariantId("standard-584"), "union_vienna_time_584")
  assert.equal(toUnionViennaTimeProductVariantId("select-606"), "union_vienna_time_606")
}

function runDurationAndTableChecks(): void {
  assert.equal(estimateUnionViennaTimeDurationYears({ durationUnit: "year", durationValue: 1 } as any), 5)
  assert.equal(estimateUnionViennaTimeDurationYears({ durationUnit: "year", durationValue: 100 } as any), 80)

  const costs5 = buildUnionViennaTimeInitialCostByYear(5)
  assert.equal(costs5[1], 42)
  assert.equal(costs5[2], 0)
  assert.equal(costs5[3], 0)

  const costs15 = buildUnionViennaTimeInitialCostByYear(15)
  assert.equal(costs15[1], 72)
  assert.equal(costs15[2], 42)
  assert.equal(costs15[3], 5)
}

function runFeeAndBonusChecks(): void {
  assert.equal(estimateUnionViennaTimeTransactionFee(1_000), 350)
  assert.equal(estimateUnionViennaTimeTransactionFee(1_000_000), 3_000)
  assert.equal(estimateUnionViennaTimeTransactionFee(5_000_000), 3_500)

  const loyalty = buildUnionViennaTimeLoyaltyBonusAmountByYear(
    { yearlyPaymentsPlan: Array(21).fill(200_000) } as any,
    20,
    "eligible",
  )
  assert.equal(loyalty[10], 200_000)
  assert.equal(loyalty[15], 200_000)
  assert.equal(loyalty[20], 200_000)

  const blocked = buildUnionViennaTimeLoyaltyBonusAmountByYear(
    { yearlyPaymentsPlan: Array(21).fill(200_000) } as any,
    20,
    "blocked-after-partial-surrender",
  )
  assert.equal(Object.keys(blocked).length, 0)

  const maturity = buildUnionViennaTimeMaturityBonusAmountByYear(
    { yearlyPaymentsPlan: Array(21).fill(200_000) } as any,
    20,
  )
  assert.equal(maturity[20], 200_000)
}

function runExtraordinaryApproxChecks(): void {
  const approx = buildUnionViennaTimeExtraordinaryEarlySurrenderApproxCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyExtraImmediateAccessPaymentsPlan: [0, 1_000_000],
      yearlyExtraTaxEligiblePaymentsPlan: [0, 0],
      yearlyExtraImmediateAccessWithdrawalsPlan: [0, 500_000],
    } as any,
    20,
  )
  assert.equal(approx[1], 10_000)
}

function runIntegrationChecks(): void {
  const ersteResult = unionViennaTime.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(200_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: "union_vienna_time_564",
  })
  assert.equal(ersteResult.currency, "HUF")
  assert.ok(ersteResult.totalContributions > 0)
  assert.ok((ersteResult.totalTaxCredit ?? 0) >= 0)

  const selectResult = unionViennaTime.calculate({
    currency: "USD",
    durationUnit: "year",
    durationValue: 15,
    annualYieldPercent: 4,
    frequency: "havi",
    yearsPlanned: 15,
    yearlyPaymentsPlan: Array(16).fill(180_000),
    yearlyWithdrawalsPlan: Array(16).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(16).fill(0),
    productVariant: "union_vienna_time_606",
  })
  assert.equal(selectResult.currency, "HUF")
  assert.ok(selectResult.totalContributions > 0)
}

function runVariantConfigChecks(): void {
  const erste = getUnionViennaTimeVariantConfig("union_vienna_time_564")
  const standard = getUnionViennaTimeVariantConfig("union_vienna_time_584")
  const select = getUnionViennaTimeVariantConfig("union_vienna_time_606")
  assert.equal(erste.productCode, "564")
  assert.equal(standard.productCode, "584")
  assert.equal(select.productCode, "606")
}

runIdentityAndVariantChecks()
runDurationAndTableChecks()
runFeeAndBonusChecks()
runExtraordinaryApproxChecks()
runVariantConfigChecks()
runIntegrationChecks()

console.log("UNION Vienna Time smoke checks passed")
