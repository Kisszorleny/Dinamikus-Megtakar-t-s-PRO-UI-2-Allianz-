import assert from "node:assert/strict"

import {
  buildSignalElorelatoUl001BonusAmountByYear,
  buildSignalElorelatoUl001CollectionFeePlusCostByYear,
  buildSignalElorelatoUl001ExtraAssetCostPercentByYear,
  buildSignalElorelatoUl001InitialCostByYear,
  buildSignalElorelatoUl001MainAssetCostPercentByYear,
  estimateSignalElorelatoUl001DurationYears,
  estimateSignalElorelatoUl001PartialSurrenderFixedFee,
  getSignalElorelatoUl001VariantConfig,
  resolveSignalElorelatoUl001RuntimeProfiles,
  SIGNAL_ELORELATO_UL001_MNB_CODE,
  SIGNAL_ELORELATO_UL001_PRODUCT_CODE,
  SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF,
  toSignalElorelatoUl001ProductVariantId,
  validateSignalElorelatoUl001MinimumPayment,
} from "../lib/engine/products/signal-elorelato-ul001-config.ts"
import { signalElorelatoUl001 } from "../lib/engine/products/signal-elorelato-ul001.ts"

function assertClose(actual: number, expected: number, epsilon = 1e-6): void {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be close to ${expected} (±${epsilon})`)
}

function runIdentityAndProfilesChecks(): void {
  assert.equal(SIGNAL_ELORELATO_UL001_MNB_CODE, "UL001")
  assert.equal(SIGNAL_ELORELATO_UL001_PRODUCT_CODE, "UL001")
  assert.equal(SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF, "signal_elorelato_ul001_huf")
  assert.equal(toSignalElorelatoUl001ProductVariantId(), SIGNAL_ELORELATO_UL001_PRODUCT_VARIANT_HUF)

  const encoded = toSignalElorelatoUl001ProductVariantId({
    paymentMethodProfile: "postal-check",
    vakProfile: "reduced-funds",
    loyaltyBonusEnabled: false,
  })
  const profiles = resolveSignalElorelatoUl001RuntimeProfiles(encoded)
  assert.equal(profiles.paymentMethodProfile, "postal-check")
  assert.equal(profiles.vakProfile, "reduced-funds")
  assert.equal(profiles.loyaltyBonusEnabled, false)
}

function runDurationAndMinPaymentChecks(): void {
  const config = getSignalElorelatoUl001VariantConfig()
  assert.equal(config.currency, "HUF")
  assert.equal(config.minDurationYears, 10)
  assert.equal(config.maxDurationYears, 45)

  assert.equal(estimateSignalElorelatoUl001DurationYears({ durationUnit: "year", durationValue: 8 } as any), 10)
  assert.equal(estimateSignalElorelatoUl001DurationYears({ durationUnit: "year", durationValue: 60 } as any), 45)

  const okInput = {
    frequency: "havi",
    yearlyPaymentsPlan: [0, 150_000],
  } as any
  const lowInput = {
    frequency: "éves",
    yearlyPaymentsPlan: [0, 120_000],
  } as any
  assert.equal(validateSignalElorelatoUl001MinimumPayment(okInput), true)
  assert.equal(validateSignalElorelatoUl001MinimumPayment(lowInput), false)
}

function runInitialCostAndVakChecks(): void {
  const initial15 = buildSignalElorelatoUl001InitialCostByYear(15)
  assert.equal(initial15[1], 74)
  assert.equal(initial15[2], 33)
  assert.equal(initial15[3], 0)
  assert.equal(initial15[4], 0)

  const initial20 = buildSignalElorelatoUl001InitialCostByYear(20)
  assert.equal(initial20[2], 44)
  assert.equal(initial20[3], 14)

  const vakMainStandard = buildSignalElorelatoUl001MainAssetCostPercentByYear(20, "standard")
  assert.equal(vakMainStandard[1], 0)
  assert.equal(vakMainStandard[4], 2)

  const vakMainReduced = buildSignalElorelatoUl001MainAssetCostPercentByYear(20, "reduced-funds")
  assert.equal(vakMainReduced[4], 1.6)

  const vakExtraReduced = buildSignalElorelatoUl001ExtraAssetCostPercentByYear(20, "reduced-funds")
  assert.equal(vakExtraReduced[1], 1.6)
}

function runExtraAndPartialChecks(): void {
  const plusCostByYear = buildSignalElorelatoUl001CollectionFeePlusCostByYear(
    {
      durationUnit: "year",
      durationValue: 20,
      yearlyExtraTaxEligiblePaymentsPlan: [0, 1_000_000, 4_000_000],
      yearlyExtraImmediateAccessPaymentsPlan: [0, 0, 9_000_000],
    } as any,
    20,
  )
  assertClose(plusCostByYear[1], 30_000)
  assertClose(plusCostByYear[2], 260_000)

  assertClose(estimateSignalElorelatoUl001PartialSurrenderFixedFee(30_000), 300)
  assertClose(estimateSignalElorelatoUl001PartialSurrenderFixedFee(500_000), 1_500)
}

function runBonusChecks(): void {
  const bonusesWithLoyalty = buildSignalElorelatoUl001BonusAmountByYear(
    {
      yearlyPaymentsPlan: Array(21).fill(320_000),
      durationUnit: "year",
      durationValue: 20,
    } as any,
    20,
    "bank-transfer",
    true,
  )
  assert.ok((bonusesWithLoyalty[1] ?? 0) > 0)
  assert.ok((bonusesWithLoyalty[10] ?? 0) > (bonusesWithLoyalty[9] ?? 0))

  const bonusesWithoutLoyalty = buildSignalElorelatoUl001BonusAmountByYear(
    {
      yearlyPaymentsPlan: Array(21).fill(320_000),
      durationUnit: "year",
      durationValue: 20,
    } as any,
    20,
    "postal-check",
    false,
  )
  assert.equal(bonusesWithoutLoyalty[1], 3_200)
}

function runProductIntegrationChecks(): void {
  const result = signalElorelatoUl001.calculate({
    currency: "HUF",
    durationUnit: "year",
    durationValue: 20,
    annualYieldPercent: 6,
    frequency: "havi",
    yearsPlanned: 20,
    yearlyPaymentsPlan: Array(21).fill(320_000),
    yearlyWithdrawalsPlan: Array(21).fill(0),
    yearlyExtraTaxEligiblePaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessPaymentsPlan: Array(21).fill(0),
    yearlyExtraImmediateAccessWithdrawalsPlan: Array(21).fill(0),
    productVariant: toSignalElorelatoUl001ProductVariantId({
      paymentMethodProfile: "direct-debit",
      vakProfile: "reduced-funds",
      loyaltyBonusEnabled: true,
    }),
  })

  assert.equal(result.currency, "HUF")
  assertClose(result.totalTaxCredit, 0)
}

runIdentityAndProfilesChecks()
runDurationAndMinPaymentChecks()
runInitialCostAndVakChecks()
runExtraAndPartialChecks()
runBonusChecks()
runProductIntegrationChecks()

console.log("Signal Előrelátó UL001 smoke checks passed")
