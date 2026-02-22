import assert from "node:assert/strict"

import {
  buildGeneraliKabalaU91BonusOnContributionPercentByYear,
  buildGeneraliKabalaU91InitialCostByYear,
  buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear,
  buildGeneraliKabalaU91RedemptionFeeByYear,
  buildGeneraliKabalaU91WealthBonusPercentByYear,
  getGeneraliKabalaU91VariantConfig,
  resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent,
  resolveGeneraliKabalaU91TaxCreditCapPerYear,
} from "../lib/engine/products/generali-kabala-u91-config.ts"

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = emptyPlan(years)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function runConfigChecks(): void {
  const life = getGeneraliKabalaU91VariantConfig("generali_kabala_u91_life", false)
  const pension = getGeneraliKabalaU91VariantConfig("generali_kabala_u91_pension", true)
  assert.equal(life.code, "U91")
  assert.equal(pension.code, "U91")
  assert.equal(life.currency, "HUF")
  assert.equal(pension.currency, "HUF")
  assert.equal(life.taxCreditAllowed, false)
  assert.equal(pension.taxCreditAllowed, true)
  assert.equal(pension.minEntryAge, 15)
  assert.equal(pension.maxEntryAge, 55)
  assert.equal(pension.taxCreditRepaymentOnSurrenderPercent, 120)
  assert.equal(resolveGeneraliKabalaU91TaxCreditCapPerYear(), 130_000)
}

function runScheduleChecks(): void {
  const initial20 = buildGeneraliKabalaU91InitialCostByYear(20, "life")
  assert.equal(initial20[1], 80)
  assert.equal(initial20[2], 50)
  assert.equal(initial20[3], 20)
  assert.equal(initial20[4], 3)
  assert.equal(initial20[15], 3)
  assert.equal(initial20[16], 0)
  const initial10Pension = buildGeneraliKabalaU91InitialCostByYear(10, "pension")
  assert.equal(initial10Pension[2], 3)
  assert.equal(initial10Pension[3], 3)
  const initial12Pension = buildGeneraliKabalaU91InitialCostByYear(12, "pension")
  assert.equal(initial12Pension[2], 21)
  assert.equal(initial12Pension[3], 10)
  const initial14Pension = buildGeneraliKabalaU91InitialCostByYear(14, "pension")
  assert.equal(initial14Pension[2], 40)
  assert.equal(initial14Pension[3], 17)

  const redemption20 = buildGeneraliKabalaU91RedemptionFeeByYear(20)
  assert.equal(redemption20[1], 0)
  assert.equal(redemption20[20], 0)
}

function runBonusChecks(): void {
  const inputs = {
    currency: "HUF" as const,
    durationUnit: "year" as const,
    durationValue: 20,
    annualYieldPercent: 0,
    frequency: "havi" as const,
    yearsPlanned: 20,
    yearlyPaymentsPlan: fullPaymentPlan(20, 300_000),
    yearlyWithdrawalsPlan: emptyPlan(20),
  }
  const contributionBonusMap = buildGeneraliKabalaU91BonusOnContributionPercentByYear(inputs, 20)
  assert.equal(contributionBonusMap[1], 2.5)
  assert.equal(contributionBonusMap[10], 2.5)

  const loyaltyCreditMap = buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(inputs, 20, "life")
  assert.equal(loyaltyCreditMap[10], 24_000)
  assert.equal(loyaltyCreditMap[15], 108_000)
  assert.ok(Math.abs((loyaltyCreditMap[20] ?? 0) - 168_000) < 1e-6)

  const pensionShortInputs = {
    ...inputs,
    durationValue: 19,
    yearsPlanned: 19,
    yearlyPaymentsPlan: fullPaymentPlan(19, 300_000),
    yearlyWithdrawalsPlan: emptyPlan(19),
  }
  const pensionShortLoyaltyMap = buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(pensionShortInputs, 19, "pension")
  assert.equal(pensionShortLoyaltyMap[10], 24_000)
  assert.equal(pensionShortLoyaltyMap[15], 108_000)
  assert.equal(pensionShortLoyaltyMap[19], 73_500)

  const pensionShortWithWithdrawal = {
    ...inputs,
    durationValue: 16,
    yearsPlanned: 16,
    yearlyPaymentsPlan: fullPaymentPlan(16, 300_000),
    yearlyWithdrawalsPlan: (() => {
      const out = emptyPlan(16)
      out[16] = 100_000
      return out
    })(),
  }
  const pensionShortWithWithdrawalMap = buildGeneraliKabalaU91LoyaltyCreditBonusAmountByYear(
    pensionShortWithWithdrawal,
    16,
    "pension",
  )
  // 16y short pension extra: avg(300k, minus 100k withdrawal in year16 => 200k) * 6.5%
  assert.equal(pensionShortWithWithdrawalMap[16], 13_000)

  const wealthBonus20 = buildGeneraliKabalaU91WealthBonusPercentByYear(20)
  assert.equal(wealthBonus20[16], 0.5)
  assert.equal(wealthBonus20[20], 0.5)

  const wealthBonus24 = buildGeneraliKabalaU91WealthBonusPercentByYear(24)
  assert.equal(wealthBonus24[16], 0.5)
  assert.equal(wealthBonus24[21], 0.7)
}

function runFundMaintenanceChecks(): void {
  assert.equal(resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent("PENZPIACI_2016"), 0.16)
  assert.equal(resolveGeneraliKabalaU91AccountMaintenanceMonthlyPercent("RANDOM_FUND"), 0.175)
}

runConfigChecks()
runScheduleChecks()
runBonusChecks()
runFundMaintenanceChecks()

console.log("Generali Kabala U91 smoke checks passed")
