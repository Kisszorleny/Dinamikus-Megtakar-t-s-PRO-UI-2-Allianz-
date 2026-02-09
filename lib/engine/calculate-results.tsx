export type Currency = "HUF" | "EUR"
export type PaymentFrequency = "havi" | "negyedéves" | "féléves" | "éves"

export type BonusMode =
  | "none"
  | "percentOnContribution" // manuális: X% minden befizetésre
  | "refundInitialCostIncreasing" // „Bónusz" logika: első évi költség növekvő visszaírása

export type YearlyIndexOverride = {
  year: number // pl. 3
  indexPercent: number // pl. 10 vagy -5
}

export type YearlyContributionOverride = {
  year: number // pl. 5
  yearlyAmount: number // teljes éves befizetés abban az évben
}

export type YearlyWithdrawal = {
  year: number // pl. 12
  amount: number // kivonás összege (pozitív szám!)
}

export interface Inputs {
  /** Devizanem: HUF vagy EUR */
  currency?: Currency

  /** Csak akkor van értelme, ha currency = "EUR" */
  eurToHufRate?: number // pl. 400, 410, 420 ...

  /** M2 – Rendszeres befizetés (egy alkalommal) */
  regularPayment: number
  /** M6 – Fizetési gyakoriság */
  frequency: PaymentFrequency
  /** M9 – Futamidő (év) */
  years: number
  /** M4 – Éves átlagos hozam (%) pl. 12 → 12% */
  annualYieldPercent: number
  /** M10 – Éves indexálás (%) pl. 3 → 3% (díjemelés évente) */
  annualIndexPercent: number
  /**
   * O6 – "Éves díjat tart"
   * - true  → M2 mindig HAVI díj, éves díj = M2 * 12
   * - false → M2 egy periódus díja (havi / negyedéves / stb.)
   */
  keepYearlyPayment?: boolean
  /** Kezdő eszközalap árfolyam (X induló érték, tipikusan 1) */
  startingPrice?: number

  // ----- KÖLTSÉGEK -----

  /**
   * Kezdeti költség a befizetésen, %:
   * pl. 5 → 5% a befizetésből levonva (elsődleges költség).
   */
  upfrontCostPercent?: number

  /**
   * Folyamatos éves költség a teljes állományra, %:
   * pl. 1.5 → 1.5% / év, havonta arányosítva.
   */
  yearlyManagementFeePercent?: number

  /**
   * Folyamatos fix éves költség (összegszerűen, a teljes állományról levonva),
   * ugyanabban a devizában, mint a befizetés (pl. Ft/év).
   */
  yearlyFixedManagementFeeAmount?: number

  /**
   * Melyik évtől VAN rendszeres költség (százalék + fix)?
   * pl. 2 → a 2. évtől kezdve indul a rendszeres költség.
   * Ha nincs megadva, vegyük 1-nek (az első évtől).
   */
  managementFeeStartYear?: number

  /**
   * Hanyadik évtől NE legyen rendszeres költség (százalék + fix).
   * Pl. 10 → a 10. évtől kezdve már nincs folyamatos költség.
   * Ha undefined vagy 0, akkor a teljes tartam alatt van költség.
   */
  managementFeeStopYear?: number

  /**
   * Vagyonarányos éves költség % (napi elvonással).
   * Pl. 1.8 → évi 1,8%, naponta 1.8 / 365 százalék jön le a bent lévő vagyonból.
   */
  assetBasedFeePercent?: number

  // ----- BÓNUSZ -----

  /** Bónusz mód (lenyíló) */
  bonusMode?: BonusMode

  /**
   * Manuális bónusz (% a bruttó befizetésre),
   * csak akkor számít, ha bonusMode = "percentOnContribution".
   */
  bonusOnContributionPercent?: number

  /**
   * Hanyadik évtől járjon manuális bónusz?
   * Csak bonusMode = "percentOnContribution" mellett.
   */
  bonusFromYear?: number

  // ----- ADÓJÓVÁÍRÁS -----

  /** Adójóváírás engedélyezve? (checkbox) */
  enableTaxCredit?: boolean

  /** Adójóváírás mértéke % az adott év bruttó befizetésére (pl. 20) */
  taxCreditRatePercent?: number

  /** Adójóváírás éves maximuma (plafon) Ft/év (pl. 130000). Ha nincs, Infinity. */
  taxCreditCapPerYear?: number

  /** Melyik évtől jár adójóváírás? (pl. 1) */
  taxCreditStartYear?: number

  /** Melyik évig jár adójóváírás? (pl. 20). Ha nincs, a tartam végéig. */
  taxCreditEndYear?: number

  /** Évenként eltérő indexálás */
  yearlyIndexOverrides?: YearlyIndexOverride[]

  /** Évenként eltérő éves befizetés */
  yearlyContributionOverrides?: YearlyContributionOverride[]

  /** Pénzkivonások évente */
  yearlyWithdrawals?: YearlyWithdrawal[]

  /** Pre-built yearly payments plan (1-indexed array) */
  yearlyPaymentsPlan?: number[]

  /** Pre-built yearly withdrawals plan (1-indexed array) */
  yearlyWithdrawalsPlan?: number[]

  /** Stop tax credit after first withdrawal (nyugdíjzáradék) */
  stopTaxCreditAfterFirstWithdrawal?: boolean

  /** Manual tax credit limits per year (can only cap, not increase) */
  taxCreditLimitByYear?: Record<number, number>

  /** Invested share percentage by year (Többletdíj számlára kerülő %) */
  investedShareByYear?: Record<number, number>

  /** Default invested share percentage if not specified for a year */
  investedShareDefaultPercent?: number
  // </CHANGE>
}

export interface YearRow {
  year: number
  yearlyPayment: number // adott év bruttó befizetése
  totalContributions: number // addig összes bruttó befizetés
  interestForYear: number // adott év hozama (bruttó)
  costForYear: number // adott év teljes költsége (kezdeti + folyamatos)
  assetBasedCostForYear: number // adott év vagyonarányos költsége külön
  bonusForYear: number // adott év jóváírt bónusza
  taxCreditForYear: number // adott év adójóváírása
  withdrawalForYear: number // adott év kivonása
  endBalance: number // év végi nettó egyenleg (díjak, bónusz után)
}

export interface Results {
  /** Ugyanaz a devizanem, mint a bemeneteknél */
  currency: Currency

  endBalance: number // futamidő végén nettó egyenleg

  /** Ha EUR-ban számoltunk, itt kapja meg a HUF végeredményt */
  endBalanceHuf?: number

  totalContributions: number // teljes bruttó befizetés
  totalInterestNet: number // teljes nettó hozam (befizetés, költség, bónusz után)
  totalCosts: number // összes költség
  totalBonus: number // összes bónusz
  totalTaxCredit: number // összes adójóváírás
  totalAssetBasedCost: number // összes vagyonarányos költség külön
  yearlyBreakdown: YearRow[] // éves bontás
}

/**
 * Find the first year where withdrawal > 0
 */
function getFirstWithdrawalYear(yearlyWithdrawalsPlan: number[] | undefined, years: number): number | null {
  if (!yearlyWithdrawalsPlan) return null
  for (let y = 1; y <= years; y++) {
    if ((yearlyWithdrawalsPlan[y] ?? 0) > 0) return y
  }
  return null
}

/**
 * Dinamikus megtakarítás havi szintű szimulációja
 * – rendszeres befizetéssel (Excel "Hozam hozama" logikájához közelítve).
 */
export function calculateResultsMonthly(inputs: Inputs): Results {
  const {
    currency = "HUF",
    regularPayment,
    frequency,
    years,
    annualYieldPercent,
    keepYearlyPayment = false,
    startingPrice = 1,
    upfrontCostPercent = 0,
    yearlyManagementFeePercent = 0,
    yearlyFixedManagementFeeAmount = 0,
    managementFeeStartYear = 1,
    managementFeeStopYear = 0,
    bonusMode = "none",
    bonusOnContributionPercent = 0,
    bonusFromYear = 1,
    enableTaxCredit = false,
    taxCreditRatePercent = 0,
    taxCreditCapPerYear,
    taxCreditStartYear,
    taxCreditEndYear,
    assetBasedFeePercent = 0,
    eurToHufRate,
    yearlyPaymentsPlan,
    yearlyWithdrawalsPlan,
    stopTaxCreditAfterFirstWithdrawal = false,
    taxCreditLimitByYear,
    investedShareByYear,
    investedShareDefaultPercent = 100,
    // </CHANGE>
  } = inputs

  const getInvestedSharePercent = (year: number): number => {
    return investedShareByYear?.[year] ?? investedShareDefaultPercent
  }
  // </CHANGE>

  const taxCreditCapInCalcCurrency =
    taxCreditCapPerYear !== undefined && currency === "EUR" && eurToHufRate
      ? taxCreditCapPerYear / eurToHufRate
      : taxCreditCapPerYear

  let price = startingPrice // X
  let investedUnits = 0 // csak ezek generálnak hozamot
  let clientUnits = 0 // nem befektetett rész, nem termel hozamot
  // </CHANGE>

  if (currency === "EUR" && eurToHufRate) {
    price *= eurToHufRate
  }

  const periodsPerYear = frequency === "havi" ? 12 : frequency === "negyedéves" ? 4 : frequency === "féléves" ? 2 : 1 // "éves"

  const monthsPerYear = 12
  const totalMonths = years * monthsPerYear
  const monthsBetweenPayments = monthsPerYear / periodsPerYear

  const yearlyBasePaymentYear1 = keepYearlyPayment ? regularPayment * 12 : regularPayment * periodsPerYear

  const r = annualYieldPercent / 100 // éves hozam
  const upfrontCostRate = upfrontCostPercent / 100
  const yearlyFeeRate = yearlyManagementFeePercent / 100
  const bonusRate = bonusOnContributionPercent / 100

  // Havi hozam (bruttó, költség előtt)
  const monthlyYieldFactor = Math.pow(1 + r, 1 / 12)
  // Havi folyamatos költségfaktor (éves díjból)
  const monthlyFeeFactor = Math.pow(1 - yearlyFeeRate, 1 / 12)
  // Havi fix költség
  const monthlyFixedFee = yearlyFixedManagementFeeAmount / 12

  // Vagyonarányos éves díj → napi díj faktor
  const assetFeeAnnualRate = assetBasedFeePercent / 100
  const daysPerMonth = 365 / 12
  const assetFeeDailyRate = assetFeeAnnualRate / 365
  const assetFeeMonthlyFactor = Math.pow(1 - assetFeeDailyRate, daysPerMonth)

  let firstYearUpfrontCostTotal = 0
  let firstYearTotalCosts = 0

  if (bonusMode === "refundInitialCostIncreasing") {
    // Előszámítás: az első év teljes kezdeti költségének becslése
    const yearlyPaymentYear1 = yearlyBasePaymentYear1
    firstYearTotalCosts = yearlyPaymentYear1 * upfrontCostRate
  }

  let totalContributions = 0 // bruttó befizetés
  let totalInterest = 0
  let totalCosts = 0
  let totalBonus = 0
  let totalTaxCredit = 0
  let totalAssetBasedCost = 0
  let totalWithdrawals = 0

  const yearlyBreakdown: YearRow[] = []

  // Éves gyűjtők
  let currentYear = 1
  let paymentThisYear = 0
  let interestThisYear = 0
  let costThisYear = 0
  let bonusThisYear = 0
  let taxCreditThisYear = 0
  let assetBasedCostThisYear = 0
  let withdrawalsThisYear = 0

  const firstWithdrawalYear = stopTaxCreditAfterFirstWithdrawal
    ? getFirstWithdrawalYear(yearlyWithdrawalsPlan, years)
    : null

  for (let monthIndex = 0; monthIndex < totalMonths; monthIndex++) {
    const yearIndex = Math.floor(monthIndex / monthsPerYear) // 0..years-1
    const monthInYear = (monthIndex % monthsPerYear) + 1 // 1..12
    currentYear = yearIndex + 1

    if (monthInYear === 1) {
      if (bonusMode === "refundInitialCostIncreasing" && currentYear >= 2 && firstYearUpfrontCostTotal > 0) {
        const bonusPercentForThisYear = currentYear - 1 // 2. év: 1%, 3. év: 2%, ...
        const bonusAmountThisYear = firstYearUpfrontCostTotal * (bonusPercentForThisYear / 100)

        const bonusUnits = bonusAmountThisYear / price
        investedUnits += bonusUnits
        // </CHANGE>

        totalBonus += bonusAmountThisYear
        bonusThisYear += bonusAmountThisYear
      }
    }

    const yearlyPaymentForThisYear = yearlyPaymentsPlan?.[currentYear] ?? yearlyBasePaymentYear1
    const paymentPerEvent = yearlyPaymentForThisYear / periodsPerYear

    let grossPaymentThisMonth = 0
    if (periodsPerYear === 12) {
      grossPaymentThisMonth = paymentPerEvent
    } else {
      const zeroBasedMonthInYear = monthInYear - 1 // 0..11
      if (zeroBasedMonthInYear % monthsBetweenPayments === 0) {
        grossPaymentThisMonth = paymentPerEvent
      }
    }

    let netContributionThisMonth = 0
    let upfrontCostThisMonth = 0
    let bonusOnContributionThisMonth = 0

    if (grossPaymentThisMonth > 0) {
      if (currentYear === 1) {
        upfrontCostThisMonth = grossPaymentThisMonth * upfrontCostRate
      } else {
        upfrontCostThisMonth = 0
      }

      netContributionThisMonth = grossPaymentThisMonth - upfrontCostThisMonth

      if (currentYear === 1) {
        firstYearUpfrontCostTotal += upfrontCostThisMonth
      }

      if (bonusMode === "percentOnContribution" && currentYear >= bonusFromYear && bonusRate > 0) {
        bonusOnContributionThisMonth = grossPaymentThisMonth * bonusRate
        netContributionThisMonth += bonusOnContributionThisMonth

        totalBonus += bonusOnContributionThisMonth
        bonusThisYear += bonusOnContributionThisMonth
      }

      const investedSharePercent = getInvestedSharePercent(currentYear)
      const investedPortion = netContributionThisMonth * (investedSharePercent / 100)
      const clientPortion = netContributionThisMonth - investedPortion

      const investedUnitsBought = investedPortion / price
      const clientUnitsBought = clientPortion / price

      investedUnits += investedUnitsBought
      clientUnits += clientUnitsBought
      // </CHANGE>

      totalContributions += grossPaymentThisMonth
      paymentThisYear += grossPaymentThisMonth

      totalCosts += upfrontCostThisMonth
      costThisYear += upfrontCostThisMonth
    }

    const priceBefore = price
    const investedValueBeforeYield = investedUnits * priceBefore
    const clientValueBeforeYield = clientUnits * priceBefore
    // </CHANGE>

    price = price * monthlyYieldFactor
    const investedValueAfterYield = investedUnits * price
    const clientValueAfterYield = clientUnits * priceBefore // no yield for client account
    // </CHANGE>

    const interestThisMonth = investedValueAfterYield - investedValueBeforeYield
    // </CHANGE>
    totalInterest += interestThisMonth
    interestThisYear += interestThisMonth

    const isFeeActive =
      currentYear >= managementFeeStartYear && (managementFeeStopYear === 0 || currentYear < managementFeeStopYear)

    let ongoingCostThisMonth = 0
    let assetBasedCostThisMonth = 0

    const totalUnits = investedUnits + clientUnits
    if (isFeeActive && totalUnits > 0) {
      const totalValueAfterYield = investedValueAfterYield + clientValueAfterYield
      let valueAfterFees = totalValueAfterYield

      if (assetBasedFeePercent > 0) {
        const valueBeforeAssetFee = valueAfterFees
        const valueAfterAssetFee = valueBeforeAssetFee * assetFeeMonthlyFactor
        assetBasedCostThisMonth = valueBeforeAssetFee - valueAfterAssetFee
        ongoingCostThisMonth += assetBasedCostThisMonth
        valueAfterFees = valueAfterAssetFee
      }

      if (yearlyFeeRate > 0) {
        const valueBeforeFee = valueAfterFees
        const valueAfterPercentFee = valueBeforeFee * monthlyFeeFactor
        const percentCost = valueBeforeFee - valueAfterPercentFee
        ongoingCostThisMonth += percentCost
        valueAfterFees = valueAfterPercentFee
      }

      if (monthlyFixedFee > 0) {
        const fixedCost = Math.min(monthlyFixedFee, valueAfterFees)
        ongoingCostThisMonth += fixedCost
        valueAfterFees -= fixedCost
      }

      totalCosts += ongoingCostThisMonth
      costThisYear += ongoingCostThisMonth

      if (assetBasedCostThisMonth > 0) {
        totalAssetBasedCost += assetBasedCostThisMonth
        assetBasedCostThisYear += assetBasedCostThisMonth
      }

      // Proportionally reduce units based on fees
      if (valueAfterFees > 0) {
        const reductionRatio = valueAfterFees / totalValueAfterYield
        investedUnits = investedUnits * reductionRatio
        clientUnits = clientUnits * reductionRatio
      } else {
        investedUnits = 0
        clientUnits = 0
      }
    }
    // </CHANGE>

    const isLastMonthOfYear = monthInYear === 12
    const isLastMonthOverall = monthIndex === totalMonths - 1

    if (isLastMonthOfYear || isLastMonthOverall) {
      const withdrawalThisYear = yearlyWithdrawalsPlan?.[currentYear] ?? 0
      if (withdrawalThisYear > 0) {
        const totalValue = (investedUnits + clientUnits) * price
        const withdrawalValue = Math.min(withdrawalThisYear, totalValue)
        const withdrawalUnits = withdrawalValue / price

        const totalUnitsBeforeWithdrawal = investedUnits + clientUnits
        if (totalUnitsBeforeWithdrawal > 0) {
          const investedRatio = investedUnits / totalUnitsBeforeWithdrawal
          const clientRatio = clientUnits / totalUnitsBeforeWithdrawal

          investedUnits -= withdrawalUnits * investedRatio
          clientUnits -= withdrawalUnits * clientRatio
        }
        // </CHANGE>

        withdrawalsThisYear += withdrawalValue
        totalWithdrawals += withdrawalValue
      }

      taxCreditThisYear = 0
      const isTaxActive =
        enableTaxCredit &&
        currentYear >= (taxCreditStartYear ?? 1) &&
        (!taxCreditEndYear || currentYear <= taxCreditEndYear) &&
        (!firstWithdrawalYear || currentYear < firstWithdrawalYear)

      if (isTaxActive && taxCreditRatePercent > 0 && (taxCreditCapInCalcCurrency ?? Number.POSITIVE_INFINITY) > 0) {
        const eligibleBase = paymentThisYear
        const rawCredit = eligibleBase * (taxCreditRatePercent / 100)
        const autoTaxCredit = Math.min(rawCredit, taxCreditCapInCalcCurrency ?? Number.POSITIVE_INFINITY)

        // Apply manual limit if set
        const manualLimit = taxCreditLimitByYear?.[currentYear]
        if (manualLimit !== undefined && manualLimit > 0) {
          taxCreditThisYear = Math.min(autoTaxCredit, manualLimit)
        } else {
          taxCreditThisYear = autoTaxCredit
        }

        if (taxCreditThisYear > 0) {
          const taxUnits = taxCreditThisYear / price
          investedUnits += taxUnits
          // </CHANGE>

          totalTaxCredit += taxCreditThisYear
        }
      }

      const endBalance = (investedUnits + clientUnits) * price
      // </CHANGE>

      yearlyBreakdown.push({
        year: currentYear,
        yearlyPayment: paymentThisYear,
        totalContributions,
        interestForYear: interestThisYear,
        costForYear: costThisYear,
        assetBasedCostForYear: assetBasedCostThisYear,
        bonusForYear: bonusThisYear,
        taxCreditForYear: taxCreditThisYear,
        withdrawalForYear: withdrawalsThisYear,
        endBalance,
      })

      paymentThisYear = 0
      interestThisYear = 0
      costThisYear = 0
      bonusThisYear = 0
      taxCreditThisYear = 0
      assetBasedCostThisYear = 0
      withdrawalsThisYear = 0
    }
  }

  const finalBalance = (investedUnits + clientUnits) * price
  // </CHANGE>

  const totalInterestNet = finalBalance - totalContributions - totalBonus - totalTaxCredit + totalCosts

  let endBalanceHuf: number | undefined = undefined
  if (currency === "EUR" && eurToHufRate) {
    endBalanceHuf = finalBalance * eurToHufRate
  }

  return {
    currency,
    endBalance: finalBalance,
    endBalanceHuf,
    totalContributions,
    totalInterestNet,
    totalCosts,
    totalBonus,
    totalTaxCredit,
    totalAssetBasedCost,
    yearlyBreakdown,
  }
}
