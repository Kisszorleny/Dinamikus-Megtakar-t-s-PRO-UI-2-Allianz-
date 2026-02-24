import assert from "node:assert/strict"

import {
  buildUnionViennaPlan500ExtraordinaryEarlySurrenderApproxCostByYear,
  buildUnionViennaPlan500InitialCostByYear,
  buildUnionViennaPlan500LoyaltyBonusAmountByYear,
  buildUnionViennaPlan500MaturityBonusAmountByYear,
  estimateUnionViennaPlan500DurationYears,
  estimateUnionViennaPlan500TransactionFee,
  getUnionViennaPlan500VariantConfig,
  resolveUnionViennaPlan500MinimumAnnualPayment,
  resolveUnionViennaPlan500Variant,
  toUnionViennaPlan500ProductVariantId,
  UNION_VIENNA_PLAN_500_MNB_CODE,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF,
  UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD,
} from "../lib/engine/products/union-vienna-plan-500-config.ts"
import { unionViennaPlan500 } from "../lib/engine/products/union-vienna-plan-500.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (+/-${epsilon})`)
}

function runIdentityAndVariantChecks(): void {
  assert.equal(UNION_VIENNA_PLAN_500_MNB_CODE, "500")
  assert.equal(UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_HUF, "union_vienna_plan_500_huf")
  assert.equal(UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_EUR, "union_vienna_plan_500_eur")
  assert.equal(UNION_VIENNA_PLAN_500_PRODUCT_VARIANT_USD, "union_vienna_plan_500_usd")

  assert.equal(resolveUnionViennaPlan500Variant(undefined, "HUF"), "huf")
  assert.equal(resolveUnionViennaPlan500Variant(undefined, "EUR"), "eur")
  assert.equal(resolveUnionViennaPlan500Variant(undefined, "USD"), "usd")
  assert.equal(resolveUnionViennaPlan500Variant("union_vienna_plan_500_eur"), "eur")

  assert.equal(toUnionViennaPlan500ProductVariantId("huf"), "union_vienna_plan_500_huf")
  assert.equal(toUnionViennaPlan500ProductVariantId("eur"), "union_vienna_plan_500_eur")
  assert.equal(toUnionViennaPlan500ProductVariantId("usd"), "union_vienna_plan_500_usd")
}

function runDurationAndMinimumChecks(): void {
  assert.equal(estimateUnionViennaPlan500DurationYears({ durationUnit: "year", durationValue: 1 } as any), 5)
  assert.equal(estimateUnionViennaPlan500DurationYears({ durationUnit: "year", durationValue: 100 } as any), 80)

  const hufConfig = getUnionViennaPlan500VariantConfig(undefined, "HUF")
  assert.equal(resolveUnionViennaPlan500MinimumAnnualPayment(7, hufConfig), 650_000)
  assert.equal(resolveUnionViennaPlan500MinimumAnnualPayment(10, hufConfig), 240_000)

  const eurConfig = getUnionViennaPlan500VariantConfig(undefined, "EUR")
  assert.equal(resolveUnionViennaPlan500MinimumAnnualPayment(7, eurConfig), 1_600)
  assert.equal(resolveUnionViennaPlan500MinimumAnnualPayment(10, eurConfig), 750)
}

function runCostAndFeeChecks(): void {
  const costs5 = buildUnionViennaPlan500InitialCostByYear(5)
  assert.equal(costs5[1], 42)
  assert.equal(costs5[2], 0)
  assert.equal(costs5[3], 0)

  const costs15 = buildUnionViennaPlan500InitialCostByYear(15)
  assert.equal(costs15[1], 72)
  assert.equal(costs15[2], 42)
  assert.equal(costs15[3], 5)

  const costsWholeLife = buildUnionViennaPlan500InitialCostByYear(35)
  assert.equal(costsWholeLife[1], 72)
  assert.equal(costsWholeLife[2], 42)
  assert.equal(costsWholeLife[3], 5)

  const hufConfig = getUnionViennaPlan500VariantConfig(undefined, "HUF")
  const eurConfig = getUnionViennaPlan500VariantConfig(undefined, "EUR")
  assertClose(estimateUnionViennaPlan500TransactionFee(10_000, hufConfig), 350)
  assertClose(estimateUnionViennaPlan500TransactionFee(1_000_000, hufConfig), 3_000)
  assertClose(estimateUnionViennaPlan500TransactionFee(5_000_000, hufConfig), 3_500)
  assertClose(estimateUnionViennaPlan500TransactionFee(100, eurConfig), 1)
  assertClose(estimateUnionViennaPlan500TransactionFee(10_000, eurConfig), 10)
}

function runBonusChecks(): void {
  const hufInputs = {
    yearlyPaymentsPlan: Array(21).fill(650_000),
  } as any
  const hufConfig = getUnionViennaPlan500VariantConfig(undefined, "HUF")
  const loyalty = buildUnionViennaPlan500LoyaltyBonusAmountByYear(hufInputs, 20, hufConfig, "eligible")
  assert.equal(loyalty[7], 195_000)
  assert.equal(loyalty[10], 455_000)
  assert.equal(loyalty[15], 650_000)
  assert.equal(loyalty[20], 975_000)

  const blocked = buildUnionViennaPlan500LoyaltyBonusAmountByYear(
    hufInputs,
    20,
    hufConfig,
    "blocked-after-partial-surrender",
  )
  assert.equal(Object.keys(blocked).length, 0)

  const maturity12 = buildUnionViennaPlan500MaturityBonusAmountByYear(
    { yearlyPaymentsPlan: Array(13).fill(300_000) } as any,
    12,
  )
  assert.equal(maturity12[12], 120_000)

  const maturity20 = buildUnionViennaPlan500MaturityBonusAmountByYear(
    { yearlyPaymentsPlan: Array(21).fill(300_000) } as any,
    20,
  )
  assert.equal(maturity20[20], 300_000)
}

function runExtraordinaryApproxChecks(): void {
  const approxCosts = buildUnionViennaPlan500ExtraordinaryEarlySurrenderApproxCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyExtraImmediateAccessPaymentsPlan: [0, 1_000_000],
      yearlyExtraTaxEligiblePaymentsPlan: [0, 0],
      yearlyExtraImmediateAccessWithdrawalsPlan: [0, 500_000],
    } as any,
    20,
  )
  assert.equal(approxCosts[1], 10_000)
}

function runIntegrationChecks(): void {
  const hufResult = unionViennaPlan500.calculate({
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
    productVariant: "union_vienna_plan_500_huf",
  })
  assert.equal(hufResult.currency, "HUF")
  assert.ok(hufResult.totalContributions > 0)
  assert.equal(hufResult.totalTaxCredit ?? 0, 0)

  const eurResult = unionViennaPlan500.calculate({
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
    productVariant: "union_vienna_plan_500_eur",
  })
  assert.equal(eurResult.currency, "EUR")
  assert.ok(eurResult.totalContributions > 0)
  assert.equal(eurResult.totalTaxCredit ?? 0, 0)

  const usdResult = unionViennaPlan500.calculate({
    currency: "USD",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 4,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(2_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: "union_vienna_plan_500_usd",
  })
  assert.equal(usdResult.currency, "USD")
  assert.ok(usdResult.totalContributions > 0)
  assert.equal(usdResult.totalTaxCredit ?? 0, 0)
}

runIdentityAndVariantChecks()
runDurationAndMinimumChecks()
runCostAndFeeChecks()
runBonusChecks()
runExtraordinaryApproxChecks()
runIntegrationChecks()

console.log("UNION Vienna Plan 500 smoke checks passed")
