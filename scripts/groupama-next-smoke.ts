import assert from "node:assert/strict"

import {
  buildGroupamaNextAssetCostPercentByYear,
  buildGroupamaNextInvestedShareByYear,
  estimateGroupamaNextDurationYears,
  estimateGroupamaNextSwitchFee,
  getGroupamaNextVariantConfig,
  GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_HUF,
  GROUPAMA_NEXT_MNB_CODE,
  GROUPAMA_NEXT_PRODUCT_CODE,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25,
  GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0,
  GROUPAMA_NEXT_RISK_MONTHLY_FEE_HUF,
  resolveGroupamaNextAccountMaintenanceMonthlyPercent,
  resolveGroupamaNextAdminMonthlyFee,
  resolveGroupamaNextMinimumAnnualPayment,
  resolveGroupamaNextRiskMonthlyFee,
  resolveGroupamaNextVariant,
  toGroupamaNextProductVariantId,
} from "../lib/engine/products/groupama-next-config.ts"
import { groupamaNext } from "../lib/engine/products/groupama-next.ts"

function runIdentityChecks(): void {
  assert.equal(GROUPAMA_NEXT_MNB_CODE, "GB733")
  assert.equal(GROUPAMA_NEXT_PRODUCT_CODE, "NEXT")
  assert.equal(GROUPAMA_NEXT_PRODUCT_VARIANT_UL100_TRAD0, "groupama_next_ul100_trad0_huf")
  assert.equal(GROUPAMA_NEXT_PRODUCT_VARIANT_UL75_TRAD25, "groupama_next_ul75_trad25_huf")
  assert.equal(GROUPAMA_NEXT_PRODUCT_VARIANT_UL0_TRAD100, "groupama_next_ul0_trad100_huf")
}

function runVariantChecks(): void {
  assert.equal(resolveGroupamaNextVariant(undefined), "ul100-trad0")
  assert.equal(resolveGroupamaNextVariant("groupama_next_ul75_trad25_huf"), "ul75-trad25")
  assert.equal(resolveGroupamaNextVariant("groupama_next_ul0_trad100_huf"), "ul0-trad100")
  assert.equal(toGroupamaNextProductVariantId("ul0-trad100"), "groupama_next_ul0_trad100_huf")
  assert.equal(getGroupamaNextVariantConfig("groupama_next_ul75_trad25_huf").ulSharePercent, 75)
}

function runDurationAndMinimumChecks(): void {
  assert.equal(estimateGroupamaNextDurationYears({ durationUnit: "year", durationValue: 12 } as any), 12)
  assert.equal(estimateGroupamaNextDurationYears({ durationUnit: "month", durationValue: 125 } as any), 11)
  assert.equal(resolveGroupamaNextMinimumAnnualPayment(), 144_000)
}

function runFeeHelperChecks(): void {
  assert.equal(resolveGroupamaNextAdminMonthlyFee(false), GROUPAMA_NEXT_ADMIN_MONTHLY_FEE_HUF)
  assert.equal(resolveGroupamaNextAdminMonthlyFee(true), 560)
  assert.equal(resolveGroupamaNextRiskMonthlyFee(), GROUPAMA_NEXT_RISK_MONTHLY_FEE_HUF)
  assert.equal(resolveGroupamaNextAccountMaintenanceMonthlyPercent(), 0.07)

  const ulOnly = buildGroupamaNextAssetCostPercentByYear(10, "ul100-trad0", false, false)
  assert.equal(ulOnly[1], 0.36)
  assert.equal(ulOnly[10], 0.36)

  const tradOnly = buildGroupamaNextAssetCostPercentByYear(10, "ul0-trad100", false, false)
  assert.equal(tradOnly[1], 0)
  assert.equal(tradOnly[10], 0)

  const mixedShare = buildGroupamaNextInvestedShareByYear(10, "ul75-trad25")
  assert.equal(mixedShare[1], 75)
  assert.equal(mixedShare[10], 75)

  assert.equal(estimateGroupamaNextSwitchFee(100_000, 1), 0)
  assert.equal(estimateGroupamaNextSwitchFee(100_000, 3), 250)
}

function runIntegrationCheck(): void {
  const result = groupamaNext.calculate({
    currency: "EUR",
    durationUnit: "year",
    durationValue: 15,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 15,
    yearlyPaymentsPlan: Array(16).fill(180_000),
    yearlyWithdrawalsPlan: Array(16).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(16).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(16).fill(0),
    productVariant: "groupama_next_ul75_trad25_huf",
  })

  assert.equal(result.currency, "HUF")
  assert.ok(result.totalContributions > 0)
  assert.equal(result.totalTaxCredit ?? 0, 0)
}

runIdentityChecks()
runVariantChecks()
runDurationAndMinimumChecks()
runFeeHelperChecks()
runIntegrationCheck()

console.log("Groupama Next smoke checks passed")
