import assert from "node:assert/strict"

import {
  buildCigEsszenciaeBonusAmountByYear,
  buildCigEsszenciaeBonusPercentByYear,
  buildCigEsszenciaeInitialCostByYear,
  buildCigEsszenciaeInvestedShareByYear,
  buildCigEsszenciaeRedemptionFeeByYear,
  CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE,
  CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE,
  CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE,
  CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE,
  CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING,
  CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH,
  CIG_ESSZENCIAE_EUR_MNB_CODE,
  CIG_ESSZENCIAE_HUF_MNB_CODE,
  CIG_ESSZENCIAE_MAX_AGE_AT_MATURITY,
  CIG_ESSZENCIAE_MAX_DURATION_YEARS,
  CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_EUR,
  CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_HUF,
  CIG_ESSZENCIAE_MIN_DURATION_YEARS,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_EUR,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_HUF,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR,
  CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF,
  CIG_ESSZENCIAE_PRODUCT_CODE,
  CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR,
  CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF,
  CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES,
  estimateCigEsszenciaeDurationYears,
  getCigEsszenciaeVariantConfig,
  resolveCigEsszenciaeVariant,
  toCigEsszenciaeProductVariantId,
} from "../lib/engine/products/cig-esszenciae-config.ts"

function fullPaymentPlan(years: number, yearlyPayment: number): number[] {
  const out = Array.from({ length: years + 1 }, () => 0)
  for (let year = 1; year <= years; year++) out[year] = yearlyPayment
  return out
}

function emptyPlan(years: number): number[] {
  return Array.from({ length: years + 1 }, () => 0)
}

function runIdentityChecks(): void {
  assert.equal(CIG_ESSZENCIAE_HUF_MNB_CODE, "P0151")
  assert.equal(CIG_ESSZENCIAE_EUR_MNB_CODE, "P0251")
  assert.equal(CIG_ESSZENCIAE_PRODUCT_CODE, "-")
  assert.equal(CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF, "cig_esszenciae_huf")
  assert.equal(CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR, "cig_esszenciae_eur")
}

function runConstantChecks(): void {
  assert.equal(CIG_ESSZENCIAE_MIN_DURATION_YEARS, 10)
  assert.equal(CIG_ESSZENCIAE_MAX_DURATION_YEARS, 80)
  assert.equal(CIG_ESSZENCIAE_MAX_AGE_AT_MATURITY, 90)
  assert.equal(CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_HUF, 150_000)
  assert.equal(CIG_ESSZENCIAE_MIN_ANNUAL_PAYMENT_EUR, 540)
  assert.equal(CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_HUF, 300)
  assert.equal(CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_HUF, 3_000)
  assert.equal(CIG_ESSZENCIAE_PARTIAL_SURRENDER_MIN_EUR, 1)
  assert.equal(CIG_ESSZENCIAE_PARTIAL_SURRENDER_MAX_EUR, 10)
}

function runFlagChecks(): void {
  assert.equal(CIG_ESSZENCIAE_STRICT_UNSPECIFIED_RULES, true)
  assert.equal(CIG_ESSZENCIAE_ENABLE_AGE_BASED_RISK_TABLE, false)
  assert.equal(CIG_ESSZENCIAE_ENABLE_EXTRA_ACCOUNT_QUARTERLY_FEE, false)
  assert.equal(CIG_ESSZENCIAE_ENABLE_SWITCH_FEE_TRACKING, false)
  assert.equal(CIG_ESSZENCIAE_ENABLE_POSTAL_PAYOUT_FEE, false)
  assert.equal(CIG_ESSZENCIAE_ENABLE_TAJOLO_LIFECYCLE_AUTO_SWITCH, false)
  assert.equal(CIG_ESSZENCIAE_ENABLE_FULL_DURATION_INITIAL_COST_TABLE, false)
}

function runVariantResolutionChecks(): void {
  assert.equal(resolveCigEsszenciaeVariant(undefined, "HUF"), "huf")
  assert.equal(resolveCigEsszenciaeVariant(undefined, "EUR"), "eur")
  assert.equal(resolveCigEsszenciaeVariant("cig_esszenciae_huf", "EUR"), "huf")
  assert.equal(resolveCigEsszenciaeVariant("cig_esszenciae_eur", "HUF"), "eur")

  assert.equal(toCigEsszenciaeProductVariantId("huf"), CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF)
  assert.equal(toCigEsszenciaeProductVariantId("eur"), CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR)

  const hufConfig = getCigEsszenciaeVariantConfig(CIG_ESSZENCIAE_PRODUCT_VARIANT_HUF, "HUF")
  const eurConfig = getCigEsszenciaeVariantConfig(CIG_ESSZENCIAE_PRODUCT_VARIANT_EUR, "EUR")
  assert.equal(hufConfig.currency, "HUF")
  assert.equal(eurConfig.currency, "EUR")
}

function runDurationChecks(): void {
  assert.equal(
    estimateCigEsszenciaeDurationYears({ durationUnit: "year", durationValue: 8, insuredEntryAge: 30 } as any),
    CIG_ESSZENCIAE_MIN_DURATION_YEARS,
  )
  assert.equal(estimateCigEsszenciaeDurationYears({ durationUnit: "year", durationValue: 120, insuredEntryAge: 20 } as any), 70)
  assert.equal(estimateCigEsszenciaeDurationYears({ durationUnit: "month", durationValue: 120, insuredEntryAge: 40 } as any), 10)
}

function runInitialCostTableChecks(): void {
  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(10, "huf"), { 1: 78, 2: 47, 3: 18, 4: 10, 5: 18, 6: 0, 7: 0, 8: 0 })
  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(15, "huf"), { 1: 78, 2: 47, 3: 18, 4: 18, 5: 18, 6: 18, 7: 0, 8: 0 })
  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(20, "huf"), { 1: 78, 2: 47, 3: 18, 4: 18, 5: 18, 6: 18, 7: 18, 8: 0 })

  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(10, "eur"), { 1: 78, 2: 33, 3: 18, 4: 18, 5: 10, 6: 0, 7: 0, 8: 0 })
  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(15, "eur"), { 1: 78, 2: 33, 3: 18, 4: 43, 5: 18, 6: 18, 7: 0, 8: 0 })
  assert.deepEqual(buildCigEsszenciaeInitialCostByYear(20, "eur"), { 1: 78, 2: 33, 3: 18, 4: 18, 5: 43, 6: 18, 7: 18, 8: 0 })
}

function runFeeScheduleChecks(): void {
  const invested = buildCigEsszenciaeInvestedShareByYear(12)
  const redemption = buildCigEsszenciaeRedemptionFeeByYear(12)
  assert.equal(invested[1], 100)
  assert.equal(invested[12], 100)
  assert.equal(redemption[1], 0)
  assert.equal(redemption[12], 0)
}

function runBonusChecks(): void {
  const hufBonus = buildCigEsszenciaeBonusAmountByYear(
    {
      durationUnit: "year",
      durationValue: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 150_000),
      yearlyWithdrawalsPlan: emptyPlan(15),
    } as any,
    15,
    "huf",
  )
  assert.equal(hufBonus[7], 105_000)

  const eurBonus = buildCigEsszenciaeBonusAmountByYear(
    {
      durationUnit: "year",
      durationValue: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 540),
      yearlyWithdrawalsPlan: emptyPlan(15),
    } as any,
    15,
    "eur",
  )
  assert.equal(eurBonus[7], 486)

  const blockedBonus = buildCigEsszenciaeBonusAmountByYear(
    {
      durationUnit: "year",
      durationValue: 15,
      yearlyPaymentsPlan: fullPaymentPlan(15, 150_000),
      yearlyWithdrawalsPlan: (() => {
        const out = emptyPlan(15)
        out[4] = 1
        return out
      })(),
    } as any,
    15,
    "huf",
  )
  assert.equal(Object.keys(blockedBonus).length, 0)

  const bonusPercent = buildCigEsszenciaeBonusPercentByYear(12)
  assert.equal(bonusPercent[7], undefined)
  assert.equal(bonusPercent[8], 1)
  assert.equal(bonusPercent[12], 1)
}

runIdentityChecks()
runConstantChecks()
runFlagChecks()
runVariantResolutionChecks()
runDurationChecks()
runInitialCostTableChecks()
runFeeScheduleChecks()
runBonusChecks()

console.log("CIG EsszenciaE smoke checks passed")
