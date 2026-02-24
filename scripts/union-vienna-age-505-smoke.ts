import assert from "node:assert/strict"

import {
  buildUnionViennaAge505InitialCostByYear,
  buildUnionViennaAge505LoyaltyBonusAmountByYear,
  buildUnionViennaAge505MaturityBonusAmountByYear,
  estimateUnionViennaAge505DurationYears,
  estimateUnionViennaAge505TransactionFee,
  getUnionViennaAge505VariantConfig,
  resolveUnionViennaAge505MinimumAnnualPayment,
  resolveUnionViennaAge505Variant,
  toUnionViennaAge505ProductVariantId,
  UNION_VIENNA_AGE_505_MNB_CODE,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF,
  UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD,
} from "../lib/engine/products/union-vienna-age-505-config.ts"
import { unionViennaAge505 } from "../lib/engine/products/union-vienna-age-505.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (+/-${epsilon})`)
}

function runIdentityAndVariantChecks(): void {
  assert.equal(UNION_VIENNA_AGE_505_MNB_CODE, "505")
  assert.equal(UNION_VIENNA_AGE_505_PRODUCT_VARIANT_HUF, "union_vienna_age_505_huf")
  assert.equal(UNION_VIENNA_AGE_505_PRODUCT_VARIANT_EUR, "union_vienna_age_505_eur")
  assert.equal(UNION_VIENNA_AGE_505_PRODUCT_VARIANT_USD, "union_vienna_age_505_usd")

  assert.equal(resolveUnionViennaAge505Variant(undefined, "HUF"), "huf")
  assert.equal(resolveUnionViennaAge505Variant(undefined, "EUR"), "eur")
  assert.equal(resolveUnionViennaAge505Variant(undefined, "USD"), "usd")
  assert.equal(resolveUnionViennaAge505Variant("union_vienna_age_505_eur"), "eur")

  assert.equal(toUnionViennaAge505ProductVariantId("huf"), "union_vienna_age_505_huf")
  assert.equal(toUnionViennaAge505ProductVariantId("eur"), "union_vienna_age_505_eur")
  assert.equal(toUnionViennaAge505ProductVariantId("usd"), "union_vienna_age_505_usd")
}

function runDurationAndMinimumChecks(): void {
  assert.equal(estimateUnionViennaAge505DurationYears({ durationUnit: "year", durationValue: 1 } as any), 5)
  assert.equal(estimateUnionViennaAge505DurationYears({ durationUnit: "year", durationValue: 100 } as any), 80)

  const hufConfig = getUnionViennaAge505VariantConfig(undefined, "HUF")
  assert.equal(resolveUnionViennaAge505MinimumAnnualPayment(7, hufConfig), 650_000)
  assert.equal(resolveUnionViennaAge505MinimumAnnualPayment(10, hufConfig), 240_000)

  const eurConfig = getUnionViennaAge505VariantConfig(undefined, "EUR")
  assert.equal(resolveUnionViennaAge505MinimumAnnualPayment(7, eurConfig), 1_600)
  assert.equal(resolveUnionViennaAge505MinimumAnnualPayment(10, eurConfig), 750)
}

function runCostAndFeeChecks(): void {
  const costs5 = buildUnionViennaAge505InitialCostByYear(5)
  assert.equal(costs5[1], 42)
  assert.equal(costs5[2], 0)
  assert.equal(costs5[3], 0)

  const costs15 = buildUnionViennaAge505InitialCostByYear(15)
  assert.equal(costs15[1], 72)
  assert.equal(costs15[2], 42)
  assert.equal(costs15[3], 5)

  const costs20 = buildUnionViennaAge505InitialCostByYear(25)
  assert.equal(costs20[1], 72)
  assert.equal(costs20[2], 42)
  assert.equal(costs20[3], 10)

  const hufConfig = getUnionViennaAge505VariantConfig(undefined, "HUF")
  const eurConfig = getUnionViennaAge505VariantConfig(undefined, "EUR")
  assertClose(estimateUnionViennaAge505TransactionFee(10_000, hufConfig), 350)
  assertClose(estimateUnionViennaAge505TransactionFee(1_000_000, hufConfig), 3_000)
  assertClose(estimateUnionViennaAge505TransactionFee(5_000_000, hufConfig), 3_500)
  assertClose(estimateUnionViennaAge505TransactionFee(100, eurConfig), 1)
  assertClose(estimateUnionViennaAge505TransactionFee(10_000, eurConfig), 10)
}

function runBonusChecks(): void {
  const hufInputs = {
    yearlyPaymentsPlan: Array(21).fill(650_000),
  } as any
  const hufConfig = getUnionViennaAge505VariantConfig(undefined, "HUF")
  const loyaltyHuf = buildUnionViennaAge505LoyaltyBonusAmountByYear(hufInputs, 20, hufConfig, "eligible")
  assert.equal(loyaltyHuf[10], 650_000)
  assert.equal(loyaltyHuf[15], 650_000)
  assert.equal(loyaltyHuf[20], 975_000)

  const blocked = buildUnionViennaAge505LoyaltyBonusAmountByYear(hufInputs, 20, hufConfig, "blocked-after-partial-surrender")
  assert.equal(Object.keys(blocked).length, 0)

  const maturity12 = buildUnionViennaAge505MaturityBonusAmountByYear(
    { yearlyPaymentsPlan: Array(13).fill(300_000) } as any,
    12,
  )
  assert.equal(maturity12[12], 120_000)

  const maturity20 = buildUnionViennaAge505MaturityBonusAmountByYear(
    { yearlyPaymentsPlan: Array(21).fill(300_000) } as any,
    20,
  )
  assert.equal(maturity20[20], 300_000)
}

function runIntegrationChecks(): void {
  const hufResult = unionViennaAge505.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(650_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: "union_vienna_age_505_huf",
  })
  assert.equal(hufResult.currency, "HUF")
  assert.ok(hufResult.totalContributions > 0)
  assert.ok((hufResult.totalTaxCredit ?? 0) > 0)

  const eurResult = unionViennaAge505.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 15,
    annualYieldPercent: 4,
    frequency: "havi",
    yearsPlanned: 15,
    yearlyPaymentsPlan: Array(16).fill(1_900),
    yearlyWithdrawalsPlan: Array(16).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(16).fill(0),
    productVariant: "union_vienna_age_505_eur",
  })
  assert.equal(eurResult.currency, "EUR")
  assert.ok(eurResult.totalContributions > 0)
  assert.ok((eurResult.totalTaxCredit ?? 0) > 0)
}

runIdentityAndVariantChecks()
runDurationAndMinimumChecks()
runCostAndFeeChecks()
runBonusChecks()
runIntegrationChecks()

console.log("UNION Vienna Age 505 smoke checks passed")
