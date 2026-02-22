import assert from "node:assert/strict"

import {
  buildZenProBonusAmountByYear,
  buildZenProInitialCostByYear,
  buildZenProRedemptionSchedule,
  getZenProVariantConfig,
  resolveZenProMinimumAnnualPayment,
  resolveZenProTaxCreditCapPerYear,
  ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT,
  ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT,
  ZEN_PRO_NY14_PARTIAL_SURRENDER_FIXED_FEE,
  ZEN_PRO_NY14_POLICY_ISSUANCE_FEE_AMOUNT,
  ZEN_PRO_NY14_PRODUCT_CODE,
  ZEN_PRO_NY24_PARTIAL_SURRENDER_FIXED_FEE,
  ZEN_PRO_NY24_POLICY_ISSUANCE_FEE_AMOUNT,
  ZEN_PRO_NY24_PRODUCT_CODE,
  ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT,
  ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF,
  ZEN_PRO_TAX_CREDIT_RATE_PERCENT,
} from "../lib/engine/products/alfa-zen-pro-config.ts"

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = emptyPlan(years)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function runUnitChecks(): void {
  const init10 = buildZenProInitialCostByYear(10)
  assert.equal(init10[1], 55)
  assert.equal(init10[2], 15)
  assert.equal(init10[3], 10)

  const init20 = buildZenProInitialCostByYear(20)
  assert.equal(init20[1], 75)
  assert.equal(init20[2], 42)
  assert.equal(init20[3], 15)

  const redemption20 = buildZenProRedemptionSchedule(20)
  assert.equal(redemption20[2], 3.5)
  assert.equal(redemption20[8], 1.95)
  assert.equal(redemption20[15], 1.5)
  assert.equal(redemption20[16], 0)

  assert.equal(resolveZenProMinimumAnnualPayment(10, "ny08"), 300_000)
  assert.equal(resolveZenProMinimumAnnualPayment(14, "ny08"), 300_000)
  assert.equal(resolveZenProMinimumAnnualPayment(15, "ny08"), 210_000)
}

function runBonusChecks(): void {
  const bonus10 = buildZenProBonusAmountByYear(
    {
      currency: "HUF",
      durationUnit: "year",
      durationValue: 10,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 10,
      yearlyPaymentsPlan: fullPaymentPlan(10, 300_000),
      yearlyWithdrawalsPlan: emptyPlan(10),
    },
    10,
  )
  assert.equal(bonus10[7], 90_000)
  assert.equal(bonus10[9], 150_000)

  const blockedBonus = buildZenProBonusAmountByYear(
    {
      currency: "HUF",
      durationUnit: "year",
      durationValue: 15,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 300_000),
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(15)
        out[4] = 100_000
        return out
      })(),
    },
    15,
  )
  assert.equal(Object.keys(blockedBonus).length, 0)
}

function runSmokeChecks(): void {
  assert.equal(ZEN_PRO_REGULAR_ADMIN_FEE_PERCENT, 4)
  assert.equal(ZEN_PRO_EXTRAORDINARY_ADMIN_FEE_PERCENT, 2)
  assert.equal(ZEN_PRO_ACCOUNT_MAINTENANCE_MONTHLY_PERCENT, 0.165)
  assert.equal(ZEN_PRO_TAX_CREDIT_RATE_PERCENT, 20)
  assert.equal(ZEN_PRO_TAX_CREDIT_CAP_BASE_HUF, 130_000)
}

function runNy14Checks(): void {
  const ny14Config = getZenProVariantConfig("alfa_zen_pro_ny14", "EUR")
  assert.equal(ny14Config.code, ZEN_PRO_NY14_PRODUCT_CODE)
  assert.equal(ny14Config.currency, "EUR")
  assert.equal(ny14Config.minExtraordinaryPayment, 200)
  assert.equal(ny14Config.partialSurrenderFixedFee, ZEN_PRO_NY14_PARTIAL_SURRENDER_FIXED_FEE)
  assert.equal(ny14Config.policyIssuanceFeeAmount, ZEN_PRO_NY14_POLICY_ISSUANCE_FEE_AMOUNT)
  assert.equal(ny14Config.paidUpMaintenanceMonthlyCapAmount, 5)

  assert.equal(resolveZenProMinimumAnnualPayment(10, ny14Config), 1_200)
  assert.equal(resolveZenProMinimumAnnualPayment(16, ny14Config), 900)
  assert.equal(resolveZenProMinimumAnnualPayment(22, ny14Config), 600)

  const bonus14 = buildZenProBonusAmountByYear(
    {
      currency: "EUR",
      productVariant: "alfa_zen_pro_ny14",
      durationUnit: "year",
      durationValue: 14,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 14,
      yearlyPaymentsPlan: fullPaymentPlan(14, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(14),
    },
    14,
    { variant: ny14Config },
  )
  assert.equal(bonus14[9], 1_080)
  assert.equal(Object.keys(bonus14).length, 1)

  const bonus20 = buildZenProBonusAmountByYear(
    {
      currency: "EUR",
      productVariant: "alfa_zen_pro_ny14",
      durationUnit: "year",
      durationValue: 20,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 20,
      yearlyPaymentsPlan: fullPaymentPlan(20, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(20),
    },
    20,
    { variant: ny14Config },
  )
  assert.equal(bonus20[10], 840)
  assert.equal(bonus20[15], 840)
  assert.equal(bonus20[19], 840)

  const capEur = resolveZenProTaxCreditCapPerYear(ny14Config, 400, 360)
  assert.equal(capEur, 130_000 / 400)
}

function runNy24Checks(): void {
  const ny24Config = getZenProVariantConfig("alfa_zen_pro_ny24", "USD")
  assert.equal(ny24Config.code, ZEN_PRO_NY24_PRODUCT_CODE)
  assert.equal(ny24Config.currency, "USD")
  assert.equal(ny24Config.minExtraordinaryPayment, 200)
  assert.equal(ny24Config.partialSurrenderFixedFee, ZEN_PRO_NY24_PARTIAL_SURRENDER_FIXED_FEE)
  assert.equal(ny24Config.policyIssuanceFeeAmount, ZEN_PRO_NY24_POLICY_ISSUANCE_FEE_AMOUNT)
  assert.equal(ny24Config.paidUpMaintenanceMonthlyCapAmount, 5)

  assert.equal(resolveZenProMinimumAnnualPayment(10, ny24Config), 1_200)
  assert.equal(resolveZenProMinimumAnnualPayment(16, ny24Config), 900)
  assert.equal(resolveZenProMinimumAnnualPayment(22, ny24Config), 600)

  const bonus14 = buildZenProBonusAmountByYear(
    {
      currency: "USD",
      productVariant: "alfa_zen_pro_ny24",
      durationUnit: "year",
      durationValue: 14,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 14,
      yearlyPaymentsPlan: fullPaymentPlan(14, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(14),
    },
    14,
    { variant: ny24Config },
  )
  assert.equal(bonus14[9], 1_080)
  assert.equal(Object.keys(bonus14).length, 1)

  const bonus20 = buildZenProBonusAmountByYear(
    {
      currency: "USD",
      productVariant: "alfa_zen_pro_ny24",
      durationUnit: "year",
      durationValue: 20,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 20,
      yearlyPaymentsPlan: fullPaymentPlan(20, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(20),
    },
    20,
    { variant: ny24Config },
  )
  assert.equal(bonus20[10], 840)
  assert.equal(bonus20[15], 840)
  assert.equal(bonus20[19], 840)

  const capUsd = resolveZenProTaxCreditCapPerYear(ny24Config, 400, 360)
  assert.equal(capUsd, 130_000 / 360)
}

runUnitChecks()
runBonusChecks()
runSmokeChecks()
runNy14Checks()
runNy24Checks()
console.log("Alfa Zen Pro NY-08/NY-14/NY-24 smoke checks passed")

