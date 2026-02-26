import assert from "node:assert/strict"

import {
  buildGroupamaEasyAssetCostPercentByYear,
  estimateGroupamaEasyDurationYears,
  getGroupamaEasyVariantConfig,
  GROUPAMA_EASY_ADMIN_MONTHLY_FEE_HUF,
  GROUPAMA_EASY_MNB_CODE,
  GROUPAMA_EASY_PRODUCT_CODE,
  GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF,
  GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF,
  GROUPAMA_EASY_RISK_MONTHLY_FEE_HUF,
  resolveGroupamaEasyAccountMaintenanceMonthlyPercent,
  resolveGroupamaEasyAdminMonthlyFee,
  resolveGroupamaEasyMinimumAnnualPayment,
  resolveGroupamaEasyRiskMonthlyFee,
  resolveGroupamaEasyVariant,
  toGroupamaEasyProductVariantId,
} from "../lib/engine/products/groupama-easy-config.ts"
import { groupamaEasy } from "../lib/engine/products/groupama-easy.ts"

function runIdentityChecks(): void {
  assert.equal(GROUPAMA_EASY_MNB_CODE, "GB730")
  assert.equal(GROUPAMA_EASY_PRODUCT_CODE, "EASY")
  assert.equal(GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_HUF, "groupama_easy_life_huf")
  assert.equal(GROUPAMA_EASY_PRODUCT_VARIANT_LIFE_TAX_HUF, "groupama_easy_life_tax_huf")
}

function runVariantChecks(): void {
  assert.equal(resolveGroupamaEasyVariant(undefined, false), "life")
  assert.equal(resolveGroupamaEasyVariant(undefined, true), "life-tax")
  assert.equal(resolveGroupamaEasyVariant("groupama_easy_life_tax_huf", false), "life-tax")
  assert.equal(toGroupamaEasyProductVariantId("life"), "groupama_easy_life_huf")
  assert.equal(toGroupamaEasyProductVariantId("life-tax"), "groupama_easy_life_tax_huf")

  assert.equal(getGroupamaEasyVariantConfig(undefined, true).taxCreditAllowed, true)
  assert.equal(getGroupamaEasyVariantConfig(undefined, false).taxCreditAllowed, false)
}

function runDurationAndFeeChecks(): void {
  assert.equal(estimateGroupamaEasyDurationYears({ durationUnit: "year", durationValue: 15 } as any), 15)
  assert.equal(estimateGroupamaEasyDurationYears({ durationUnit: "month", durationValue: 13 } as any), 2)

  assert.equal(resolveGroupamaEasyMinimumAnnualPayment(), 144_000)
  assert.equal(resolveGroupamaEasyAdminMonthlyFee(), GROUPAMA_EASY_ADMIN_MONTHLY_FEE_HUF)
  assert.equal(resolveGroupamaEasyRiskMonthlyFee(), GROUPAMA_EASY_RISK_MONTHLY_FEE_HUF)
  assert.equal(resolveGroupamaEasyAccountMaintenanceMonthlyPercent(), 0.07)

  const assetMap = buildGroupamaEasyAssetCostPercentByYear(10)
  assert.equal(assetMap[1], 0.36)
  assert.equal(assetMap[10], 0.36)
}

function runIntegrationChecks(): void {
  const taxOff = groupamaEasy.calculate({
    currency: "USD",
    durationUnit: "year",
    durationValue: 12,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 12,
    yearlyPaymentsPlan: Array(13).fill(180_000),
    yearlyWithdrawalsPlan: Array(13).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(13).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(13).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(13).fill(0),
    productVariant: "groupama_easy_life_huf",
    enableTaxCredit: false,
  })

  assert.equal(taxOff.currency, "HUF")
  assert.equal(taxOff.totalTaxCredit ?? 0, 0)

  const taxOn = groupamaEasy.calculate({
    currency: "USD",
    durationUnit: "year",
    durationValue: 12,
    annualYieldPercent: 5,
    frequency: "havi",
    yearsPlanned: 12,
    yearlyPaymentsPlan: Array(13).fill(180_000),
    yearlyWithdrawalsPlan: Array(13).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(13).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(13).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(13).fill(0),
    productVariant: "groupama_easy_life_tax_huf",
    enableTaxCredit: true,
  })

  assert.equal(taxOn.currency, "HUF")
  assert.ok((taxOn.totalTaxCredit ?? 0) >= 0)
}

runIdentityChecks()
runVariantChecks()
runDurationAndFeeChecks()
runIntegrationChecks()

console.log("Groupama Easy smoke checks passed")
