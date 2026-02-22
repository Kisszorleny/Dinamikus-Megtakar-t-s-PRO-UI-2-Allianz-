import assert from "node:assert/strict"

import {
  buildAlfaZenBonusAmountByYear,
  buildAlfaZenInitialCostByYear,
  buildAlfaZenRedemptionSchedule,
  getAlfaZenVariantConfig,
  resolveAlfaZenAccountMaintenanceMonthlyPercent,
  resolveAlfaZenTaxCreditCapPerYear,
} from "../lib/engine/products/alfa-zen-config.ts"

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = emptyPlan(years)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function runUnitChecks(): void {
  const init9 = buildAlfaZenInitialCostByYear(9)
  assert.equal(init9[1], 78)
  assert.equal(init9[2], 23)
  assert.equal(init9[3], 13)

  const redemption9 = buildAlfaZenRedemptionSchedule(9)
  assert.equal(redemption9[1], 100)
  assert.equal(redemption9[9], 100)

  const redemption20 = buildAlfaZenRedemptionSchedule(20)
  assert.equal(redemption20[10], 100)
  assert.equal(redemption20[11], 15)

  const bonus15 = buildAlfaZenBonusAmountByYear(
    {
      currency: "EUR",
      durationUnit: "year",
      durationValue: 15,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(15),
    },
    15,
  )
  assert.equal(bonus15[10], 1_200)
  assert.equal(bonus15[15], 1_200)
}

function runSmokeChecks(): void {
  const bonus20 = buildAlfaZenBonusAmountByYear(
    {
      currency: "EUR",
      durationUnit: "year",
      durationValue: 20,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 20,
      yearlyPaymentsPlan: fullPaymentPlan(20, 1_200),
      yearlyWithdrawalsPlan: emptyPlan(20),
    },
    20,
  )
  assert.ok((bonus20[10] ?? 0) > 0, "Expected 10th-year NY13 bonus on continuous payments")
  assert.ok((bonus20[15] ?? 0) > 0, "Expected 15th-year NY13 bonus on continuous payments")
  assert.ok((bonus20[19] ?? 0) > 0, "Expected final pre-maturity NY13 bonus on 20-year duration")

  const blockedBonus20 = buildAlfaZenBonusAmountByYear(
    {
      currency: "EUR",
      durationUnit: "year",
      durationValue: 20,
      annualYieldPercent: 0,
      frequency: "havi",
      yearsPlanned: 20,
      yearlyPaymentsPlan: fullPaymentPlan(20, 1_200),
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(20)
        out[6] = 100
        return out
      })(),
    },
    20,
  )
  assert.equal(Object.keys(blockedBonus20).length, 0, "Bonuses must be blocked when withdrawals exist before milestones")
}

function runNy23Checks(): void {
  const ny23Config = getAlfaZenVariantConfig("alfa_zen_ny23", "USD")
  const ny13Config = getAlfaZenVariantConfig("alfa_zen_ny13", "EUR")
  assert.equal(ny23Config.code, "NY23")
  assert.equal(ny23Config.currency, "USD")
  assert.equal(resolveAlfaZenAccountMaintenanceMonthlyPercent("ANY_MONEY_MARKET_MM", ny23Config), 0.165)
  assert.equal(resolveAlfaZenAccountMaintenanceMonthlyPercent("ANY_MONEY_MARKET_MM", ny13Config), 0.08)

  const capUsd = resolveAlfaZenTaxCreditCapPerYear(ny23Config, 400, 360)
  const capEur = resolveAlfaZenTaxCreditCapPerYear(ny13Config, 400, 360)
  assert.equal(capUsd, 130_000 / 360)
  assert.equal(capEur, 130_000 / 400)
}

runUnitChecks()
runSmokeChecks()
runNy23Checks()
console.log("Alfa Zen NY13/NY23 smoke checks passed")

