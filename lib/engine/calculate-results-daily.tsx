import {
  getFortisVariantConfig,
  isFortisEurMoneyMarketFund,
  isFortisUsdMoneyMarketFund,
  resolveFortisVariant,
} from "./products/alfa-fortis-config"

export type PaymentFrequency = "havi" | "negyedéves" | "féléves" | "éves"
export type Currency = "HUF" | "EUR" | "USD"
export type ManagementFeeFrequency = "napi" | "havi" | "negyedéves" | "féléves" | "éves"
export type ManagementFeeValueType = "percent" | "amount"

export interface RiskFeeResolverContext {
  currentYear: number
  currentCalendarYear: number
  monthsElapsed: number
  monthsBetweenPayments: number
  paymentPerEvent: number
  yearlyPayment: number
  durationYears: number
  insuredEntryAge: number
}

export interface InputsDaily {
  currency: Currency
  disableProductDefaults?: boolean
  calculationMode?: "simple" | "calendar"
  startDate?: string
  referenceYear?: number
  // Legacy UI-only fields kept optional for compatibility with the calculator state shape.
  eurToHufRate?: number
  usdToHufRate?: number
  regularPayment?: number
  annualIndexPercent?: number
  keepYearlyPayment?: boolean
  stopTaxCreditAfterFirstWithdrawal?: boolean
  bonusPercent?: number
  bonusStartYear?: number
  bonusStopYear?: number

  // Duration
  durationUnit: "year" | "month" | "day"
  durationValue: number

  // Yield
  annualYieldPercent: number
  fundCalculationMode?: "replay" | "averaged"
  fundPriceSeries?: Array<{ date: string; price: number }>
  fundReplayWrap?: boolean
  selectedFundId?: string | null

  // Payment frequency
  frequency: PaymentFrequency

  // Yearly plan (in calculation currency)
  yearsPlanned: number
  yearlyPaymentsPlan: number[]
  yearlyWithdrawalsPlan: number[]

  // Costs
  upfrontCostPercent?: number // Legacy field for backward compatibility
  initialCostByYear?: Record<number, number> // Per-year initial cost percentages
  initialCostDefaultPercent?: number // Default percentage for years not specified
  initialCostBaseMode?: "payment" | "afterRisk"
  yearlyManagementFeePercent?: number
  yearlyFixedManagementFeeAmount?: number
  managementFeeFrequency?: ManagementFeeFrequency
  managementFeeValueType?: ManagementFeeValueType
  managementFeeValue?: number // The actual value (either % or amount based on valueType)
  managementFeeStartYear?: number
  managementFeeStopYear?: number

  // Asset-based cost (annual %, deducted daily)
  assetBasedFeePercent?: number
  assetCostPercentByYear?: Record<number, number> // Added per-year asset cost percentage overrides
  plusCostByYear?: Record<number, number> // Per-year additional fixed costs

  // Bonus mode
  bonusMode?: "none" | "percentOnContribution" | "refundInitialCostIncreasing"
  bonusOnContributionPercent?: number
  bonusOnContributionPercentByYear?: Record<number, number>
  refundInitialCostBonusPercentByYear?: Record<number, number>
  bonusFromYear?: number
  bonusPercentByYear?: Record<number, number>
  bonusAmountByYear?: Record<number, number>

  enableTaxCredit?: boolean
  taxCreditRatePercent?: number
  taxCreditCapPerYear?: number
  taxCreditStartYear?: number
  taxCreditEndYear?: number
  isTaxBonusSeparateAccount?: boolean // New flag for separate tax bonus account
  taxCreditToInvestedAccount?: boolean // If true, tax credit goes to invested account (yields apply)
  taxCreditLimitByYear?: Record<number, number>
  taxCreditAmountByYear?: Record<number, number>
  taxCreditYieldPercent?: number
  taxCreditCalendarPostingEnabled?: boolean
  adminFeeMonthlyAmount?: number
  adminFeePercentOfPayment?: number
  adminFeePercentByYear?: Record<number, number>
  adminFeeBaseMode?: "payment" | "afterRisk"
  accountMaintenanceMonthlyPercent?: number
  accountMaintenancePercentByYear?: Record<number, number>
  accountMaintenanceStartMonth?: number
  accountMaintenanceClientStartMonth?: number
  accountMaintenanceInvestedStartMonth?: number
  accountMaintenanceTaxBonusStartMonth?: number
  productVariant?: string

  // Account split
  isAccountSplitOpen?: boolean
  investedShareByYear?: Record<number, number>
  investedShareDefaultPercent?: number

  // Redemption
  redemptionEnabled?: boolean
  redemptionFeeByYear?: Record<number, number>
  redemptionFeeDefaultPercent?: number
  redemptionBaseMode?: "surplus-only" | "total" | "total-account"
  partialSurrenderFeeAmount?: number
  minimumBalanceAfterPartialSurrender?: number
  minimumPaidUpValue?: number

  // Risk insurance (deducted from regular payment, not invested)
  riskInsuranceEnabled?: boolean
  riskInsuranceMonthlyFeeAmount?: number
  riskInsuranceFeePercentOfMonthlyPayment?: number
  riskInsuranceDeathBenefitAmount?: number
  riskInsuranceDisabilityBenefitAmount?: number
  riskInsuranceAnnualIndexPercent?: number
  riskInsuranceStartYear?: number
  riskInsuranceEndYear?: number
  insuredEntryAge?: number
  riskFeeResolver?: (context: RiskFeeResolverContext) => number
  paidUpMaintenanceFeeMonthlyAmount?: number
  paidUpMaintenanceFeeStartMonth?: number
  bonusCreditOnAnniversaryDay20?: boolean
}

export interface YearRow {
  year: number
  periodType?: "year" | "partial"
  periodMonths?: number
  periodDays?: number
  periodLabel?: string
  yearlyPayment: number
  totalContributions: number
  interestForYear: number
  costForYear: number
  upfrontCostForYear: number
  adminCostForYear: number
  accountMaintenanceCostForYear: number
  managementFeeCostForYear: number
  assetBasedCostForYear: number
  plusCostForYear: number
  bonusForYear: number
  wealthBonusForYear: number
  taxCreditForYear: number
  withdrawalForYear: number
  riskInsuranceCostForYear: number
  endBalance: number
  endingInvestedValue: number
  endingClientValue: number
  endingTaxBonusValue: number
  surrenderValue: number
  surrenderCharge: number
  client: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    bonusForYear: number
    wealthBonusForYear: number
  }
  invested: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    bonusForYear: number
    wealthBonusForYear: number
  }
  taxBonus: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    bonusForYear: number
    wealthBonusForYear: number
  }
}

export interface MonthRow {
  year: number
  month: number
  cumulativeMonth: number
  payment: number
  upfrontCost: number
  adminFeeCost: number
  riskInsuranceCost: number
  managementFeeCost: number
  assetBasedCost: number
  plusCost: number
  bonus: number
  taxCredit: number
  interest: number
  costTotal: number
  endBalance: number
  endingInvestedValue: number
  endingClientValue: number
  endingTaxBonusValue: number
}

export interface ResultsDaily {
  currency: Currency
  endBalance: number
  totalContributions: number
  totalCosts: number
  totalBonus: number
  totalTaxCredit: number
  totalAssetBasedCost: number
  totalRiskInsuranceCost: number
  totalWithdrawals: number
  totalInterestNet: number
  yearlyBreakdown: YearRow[]
  monthlyBreakdown: MonthRow[]
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

function parseIsoDate(value?: string): Date | null {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!m) return null
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const parsed = new Date(y, mo - 1, d, 12, 0, 0, 0)
  if (parsed.getFullYear() !== y || parsed.getMonth() !== mo - 1 || parsed.getDate() !== d) return null
  return parsed
}

function toIsoDate(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`
}

function addMonthsClamped(base: Date, months: number): Date {
  const targetMonth = base.getMonth() + months
  const targetYear = base.getFullYear() + Math.floor(targetMonth / 12)
  const normalizedMonth = ((targetMonth % 12) + 12) % 12
  const maxDay = new Date(targetYear, normalizedMonth + 1, 0).getDate()
  const day = Math.min(base.getDate(), maxDay)
  return new Date(targetYear, normalizedMonth, day, 12, 0, 0, 0)
}

function addDurationFromStart(start: Date, unit: "year" | "month" | "day", value: number): Date {
  const safe = Math.max(0, Math.round(value))
  if (unit === "year") return addMonthsClamped(start, safe * 12)
  if (unit === "month") return addMonthsClamped(start, safe)
  const out = new Date(start)
  out.setDate(out.getDate() + safe)
  return out
}

function diffDays(start: Date, endExclusive: Date): number {
  return Math.max(0, Math.round((endExclusive.getTime() - start.getTime()) / MS_PER_DAY))
}

function formatPartialPeriodLabelFromDays(days: number): string {
  const safeDays = Math.max(1, Math.round(days))
  const monthLengthDays = 365 / 12

  let months = Math.floor(safeDays / monthLengthDays)
  let remDays = Math.round(safeDays - months * monthLengthDays)

  // Normalize edge case caused by rounding (e.g. 30.4 -> 30/31 split).
  if (remDays >= Math.round(monthLengthDays)) {
    months += 1
    remDays = 0
  }

  if (months <= 0) return `+${safeDays} nap`
  if (remDays <= 0) return `+${months} hónap`
  return `+${months} hónap és ${remDays} nap`
}

function periodsPerYear(freq: PaymentFrequency): number {
  return freq === "havi" ? 12 : freq === "negyedéves" ? 4 : freq === "féléves" ? 2 : 1
}

function periodsPerManagementFeeYear(freq: ManagementFeeFrequency): number {
  return freq === "napi" ? 365 : freq === "havi" ? 12 : freq === "negyedéves" ? 4 : freq === "féléves" ? 2 : 1
}

function getAssetBasedFeePercent(inputs: InputsDaily, year: number): number {
  if (inputs.assetCostPercentByYear && inputs.assetCostPercentByYear[year] !== undefined) {
    return inputs.assetCostPercentByYear[year] ?? 0
  }
  return inputs.assetBasedFeePercent ?? 0
}

function getAccountMaintenanceMonthlyPercent(inputs: InputsDaily, year: number): number {
  if (inputs.accountMaintenancePercentByYear && inputs.accountMaintenancePercentByYear[year] !== undefined) {
    return inputs.accountMaintenancePercentByYear[year] ?? 0
  }
  const fortisVariant = resolveFortisVariant(inputs.productVariant, inputs.currency)
  if (fortisVariant === "wl12" && isFortisEurMoneyMarketFund(inputs.selectedFundId)) {
    const variantConfig = getFortisVariantConfig(inputs.productVariant, inputs.currency)
    return variantConfig.eurMoneyMarketReducedMaintenancePercent ?? 0.03
  }
  if (fortisVariant === "wl22" && isFortisUsdMoneyMarketFund(inputs.selectedFundId)) {
    const variantConfig = getFortisVariantConfig(inputs.productVariant, inputs.currency)
    return variantConfig.usdMoneyMarketReducedMaintenancePercent ?? 0.13
  }
  return inputs.accountMaintenanceMonthlyPercent ?? 0
}

function getAdminFeePercentOfPayment(inputs: InputsDaily, year: number): number {
  if (inputs.adminFeePercentByYear && inputs.adminFeePercentByYear[year] !== undefined) {
    return inputs.adminFeePercentByYear[year] ?? 0
  }
  return inputs.adminFeePercentOfPayment ?? 0
}

function buildFundDailyReturns(series?: Array<{ date: string; price: number }>): number[] {
  if (!series || series.length < 2) return []

  const normalized = series
    .filter((point) => point && typeof point.date === "string" && Number.isFinite(point.price) && point.price > 0)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))

  const returns: number[] = []
  for (let i = 1; i < normalized.length; i++) {
    const prev = normalized[i - 1].price
    const curr = normalized[i].price
    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0 || curr <= 0) continue
    const dailyReturn = curr / prev - 1
    if (Number.isFinite(dailyReturn)) returns.push(dailyReturn)
  }
  return returns
}

export function calculateResultsDaily(inputs: InputsDaily): ResultsDaily {
  const DAYS_PER_YEAR = 365

  const fallbackReferenceYear =
    typeof inputs.referenceYear === "number" && Number.isFinite(inputs.referenceYear)
      ? Math.max(1970, Math.round(inputs.referenceYear))
      : new Date().getFullYear()
  const referenceStartDate = new Date(fallbackReferenceYear, 0, 1, 12, 0, 0, 0)
  const parsedStartDate = parseIsoDate(inputs.startDate)
  const startDate =
    inputs.calculationMode === "calendar" && parsedStartDate ? parsedStartDate : referenceStartDate
  const endExclusiveDate = addDurationFromStart(startDate, inputs.durationUnit, inputs.durationValue)
  const totalDays = diffDays(startDate, endExclusiveDate)

  const fullYearEndOffsets: number[] = []
  for (let y = 1; y <= 300; y++) {
    const anniversary = addMonthsClamped(startDate, y * 12)
    const anniversaryOffset = diffDays(startDate, anniversary)
    if (anniversaryOffset > totalDays) break
    fullYearEndOffsets.push(anniversaryOffset - 1)
  }
  const lastFullYearEnd = fullYearEndOffsets.length > 0 ? fullYearEndOffsets[fullYearEndOffsets.length - 1] : -1
  const hasPartialFinalPeriod = totalDays - (lastFullYearEnd + 1) > 0
  const totalYears = fullYearEndOffsets.length + (hasPartialFinalPeriod ? 1 : 0)

  const ppy = periodsPerYear(inputs.frequency)
  const daysBetweenPayments = DAYS_PER_YEAR / ppy
  const durationYears = Math.max(1, Math.ceil(totalDays / DAYS_PER_YEAR))

  const taxCreditYieldPercent = inputs.taxCreditYieldPercent ?? 0
  const taxCreditCalendarPostingEnabled = inputs.taxCreditCalendarPostingEnabled === true
  const r = inputs.annualYieldPercent / 100
  const dailyYieldFactor = Math.pow(1 + r, 1 / DAYS_PER_YEAR)
  const fundMode = inputs.fundCalculationMode
  const fundPriceSeries = inputs.fundPriceSeries

  const fundReturns = fundMode === "averaged" ? buildFundDailyReturns(fundPriceSeries) : []
  const averagedFundDailyFactor = (() => {
    if (fundMode !== "averaged" || fundReturns.length === 0) return dailyYieldFactor
    const cumulativeFactor = fundReturns.reduce((acc, value) => acc * (1 + value), 1)
    if (!Number.isFinite(cumulativeFactor) || cumulativeFactor <= 0) return dailyYieldFactor
    const factor = Math.pow(cumulativeFactor, 1 / fundReturns.length)
    return Number.isFinite(factor) && factor > 0 ? factor : dailyYieldFactor
  })()

  const fundReplay = (() => {
    if (fundMode !== "replay" || !fundPriceSeries || fundPriceSeries.length < 2) return null
    const normalized = fundPriceSeries
      .filter((p) => p && typeof p.date === "string" && Number.isFinite(p.price) && p.price > 0)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
    if (normalized.length < 2) return null

    const priceByDate = new Map<string, number>()
    for (const p of normalized) {
      priceByDate.set(p.date, p.price)
    }

    const first = normalized[0]
    if (!first) return null
    let lastSeenPrice = first.price
    return {
      priceByDate,
      getFactorForDateIso: (dateIso: string) => {
        const price = priceByDate.get(dateIso)
        if (!price || price <= 0 || !Number.isFinite(price)) return 1
        const factor = price / lastSeenPrice
        if (!Number.isFinite(factor) || factor <= 0) return 1
        lastSeenPrice = price
        return factor
      },
    }
  })()

  const getInvestedDailyFactor = (dateIso: string) => {
    if (fundMode === "replay" && fundReplay) return fundReplay.getFactorForDateIso(dateIso)
    if (fundMode === "averaged" && fundReturns.length > 0) return averagedFundDailyFactor
    return dailyYieldFactor
  }
  const taxBonusYieldRate = taxCreditYieldPercent / 100
  const taxBonusDailyYieldFactor = Math.pow(1 + taxBonusYieldRate, 1 / DAYS_PER_YEAR)

  const getInitialCostRate = (year: number): number => {
    if (inputs.initialCostByYear) {
      const yearPercent = inputs.initialCostByYear[year] ?? inputs.initialCostDefaultPercent ?? 0
      return yearPercent / 100
    }
    // Fallback to legacy upfrontCostPercent
    return year === 1 ? (inputs.upfrontCostPercent ?? 0) / 100 : 0
  }

  const managementFeeFrequency = inputs.managementFeeFrequency ?? "éves"
  const managementFeeValueType = inputs.managementFeeValueType ?? "percent"
  const managementFeeValue = inputs.managementFeeValue ?? 0
  const feeStartYear = inputs.managementFeeStartYear ?? 1
  const feeStopYear = inputs.managementFeeStopYear

  const ppyManagementFee = periodsPerManagementFeeYear(managementFeeFrequency)
  const daysBetweenManagementFees = DAYS_PER_YEAR / ppyManagementFee

  const bonusMode = inputs.bonusMode ?? "none"
  const bonusFromYear = inputs.bonusFromYear ?? 1

  const enableTax = !!inputs.enableTaxCredit
  const taxRate = (inputs.taxCreditRatePercent ?? 0) / 100
  const taxCap = inputs.taxCreditCapPerYear ?? (enableTax ? Number.POSITIVE_INFINITY : 0)
  const taxStart = inputs.taxCreditStartYear ?? 1
  const taxEnd = inputs.taxCreditEndYear
  const isTaxBonusSeparate = inputs.isTaxBonusSeparateAccount ?? false
  const isTaxCreditInvested = inputs.taxCreditToInvestedAccount ?? false
  const taxCreditLimitByYear = inputs.taxCreditLimitByYear ?? {}
  const taxCreditAmountByYear = inputs.taxCreditAmountByYear ?? {}

  const initialCostTotalByYear: Record<number, number> = {}

  // Invested account (grows with returns)
  let investedPrice = 1
  let investedUnits = 0

  // Client account (NEVER grows, price always 1)
  const clientPrice = 1
  let clientUnits = 0

  let taxBonusPrice = 1
  let taxBonusUnits = 0

  let totalContributions = 0
  let totalCosts = 0
  let totalBonus = 0
  let totalTaxCredit = 0
  let totalAssetBasedCost = 0
  let totalRiskInsuranceCost = 0
  let totalWithdrawals = 0

  const yearlyBreakdown: YearRow[] = []
  const monthlyBreakdown: MonthRow[] = []

  let currentYear = 1
  let payThisYear = 0
  let interestThisYear = 0
  let costThisYear = 0
  let assetCostThisYear = 0
  let upfrontCostThisYear = 0
  let adminCostThisYear = 0
  let accountMaintenanceCostThisYear = 0
  let managementFeeCostThisYear = 0
  let bonusThisYear = 0
  let wealthBonusThisYear = 0
  let taxThisYear = 0
  let plannedTaxCreditThisYear = 0
  let withdrawalThisYear = 0
  let riskInsuranceCostThisYear = 0

  let clientInterestThisYear = 0
  let investedInterestThisYear = 0
  let clientCostThisYear = 0
  let investedCostThisYear = 0
  let clientAssetCostThisYear = 0
  let investedAssetCostThisYear = 0
  let clientBonusThisYear = 0
  let investedBonusThisYear = 0
  let clientWealthBonusThisYear = 0
  let investedWealthBonusThisYear = 0
  let clientPlusCostThisYear = 0
  let investedPlusCostThisYear = 0

  let taxBonusInterestThisYear = 0
  let taxBonusCostThisYear = 0
  let taxBonusAssetCostThisYear = 0
  let taxBonusBonusThisYear = 0
  let taxBonusWealthBonusThisYear = 0
  let taxBonusPlusCostThisYear = 0

  let cumulativeMonth = 0
  let paymentThisMonth = 0
  let upfrontCostThisMonth = 0
  let adminFeeCostThisMonth = 0
  let riskInsuranceCostThisMonth = 0
  let managementFeeCostThisMonth = 0
  let assetCostThisMonth = 0
  let plusCostThisMonth = 0
  let bonusThisMonth = 0
  let taxCreditThisMonth = 0
  let interestThisMonth = 0
  let costThisMonth = 0

  const applyTaxCredit = (amount: number) => {
    if (amount <= 0) return

    totalTaxCredit += amount
    taxThisYear += amount
    taxCreditThisMonth += amount

    const useTaxBonusAccount = isTaxBonusSeparate || taxCreditYieldPercent > 0
    if (useTaxBonusAccount) {
      taxBonusUnits += amount / taxBonusPrice
      taxBonusBonusThisYear += amount
    } else if (isTaxCreditInvested) {
      investedUnits += amount / investedPrice
      investedBonusThisYear += amount
    } else {
      clientUnits += amount / clientPrice
      clientBonusThisYear += amount
    }
  }

  let lastPaymentPeriodKey = -1
  let lastRefundInitialCostBonusAppliedYear = 0
  let nextManagementFeeDay = 0
  let currentFullYearIndex = 0
  const pendingCalendarTaxCredits: Array<{ amount: number; postingDateIso: string }> = []

  const getInvestedSharePercent = (year: number): number => {
    // If account split is collapsed, always use 100%
    if (inputs.isAccountSplitOpen === false || inputs.isAccountSplitOpen === undefined) {
      return 100
    }
    // Otherwise use configured percentages
    if (inputs.investedShareByYear) {
      return inputs.investedShareByYear[year] ?? inputs.investedShareDefaultPercent ?? 100
    }
    return 100
  }

  const getRedemptionFeePercent = (year: number): number => {
    // If redemption is disabled, always return 0
    if (!inputs.redemptionEnabled) {
      return 0
    }
    if (inputs.redemptionFeeByYear) {
      return inputs.redemptionFeeByYear[year] ?? inputs.redemptionFeeDefaultPercent ?? 0
    }
    return 0
  }

  const getFrequencyDays = (freq: ManagementFeeFrequency): number => {
    switch (freq) {
      case "napi":
        return 1
      case "havi":
        return 30
      case "negyedéves":
        return 91
      case "féléves":
        return 182
      case "éves":
        return 365
      default:
        return 365
    }
  }

  const mgmtFeeIntervalDays = getFrequencyDays(managementFeeFrequency)

  const monthsPerPayment = 12 / ppy
  const paidUpMaintenanceFeeMonthlyAmount = Math.max(0, inputs.paidUpMaintenanceFeeMonthlyAmount ?? 0)
  const paidUpMaintenanceFeeStartMonth = Math.max(1, Math.round(inputs.paidUpMaintenanceFeeStartMonth ?? 10))
  const accountMaintenanceStartMonth = Math.max(1, Math.round(inputs.accountMaintenanceStartMonth ?? 1))
  const accountMaintenanceClientStartMonth = Math.max(
    1,
    Math.round(inputs.accountMaintenanceClientStartMonth ?? accountMaintenanceStartMonth),
  )
  const accountMaintenanceInvestedStartMonth = Math.max(
    1,
    Math.round(inputs.accountMaintenanceInvestedStartMonth ?? accountMaintenanceStartMonth),
  )
  const accountMaintenanceTaxBonusStartMonth = Math.max(
    1,
    Math.round(inputs.accountMaintenanceTaxBonusStartMonth ?? accountMaintenanceStartMonth),
  )
  const minimumPaidUpValue = Math.max(0, inputs.minimumPaidUpValue ?? 0)
  const partialSurrenderFeeAmount = Math.max(0, inputs.partialSurrenderFeeAmount ?? 0)
  const minimumBalanceAfterPartialSurrender = Math.max(0, inputs.minimumBalanceAfterPartialSurrender ?? 0)
  const insuredEntryAge = Math.max(0, Math.round(inputs.insuredEntryAge ?? 38))

  for (let day = 0; day < totalDays; day++) {
    while (currentFullYearIndex < fullYearEndOffsets.length && day > fullYearEndOffsets[currentFullYearIndex]) {
      currentFullYearIndex += 1
    }

    currentYear = currentFullYearIndex + 1
    const prevYearEnd = currentFullYearIndex === 0 ? -1 : fullYearEndOffsets[currentFullYearIndex - 1]
    const dayOfYear = day - prevYearEnd
    const currentYearEnd =
      currentFullYearIndex < fullYearEndOffsets.length ? fullYearEndOffsets[currentFullYearIndex] : totalDays - 1
    const currentYearLength = Math.max(1, currentYearEnd - prevYearEnd)

    const currentDate = new Date(startDate)
    currentDate.setDate(currentDate.getDate() + day)
    const nextDate = new Date(currentDate)
    nextDate.setDate(nextDate.getDate() + 1)

    const monthOfYear = currentDate.getMonth() + 1
    const isMonthEnd = day === totalDays - 1 || currentDate.getMonth() !== nextDate.getMonth()

    const currentCalendarYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1
    const currentDayOfMonth = currentDate.getDate()
    const currentDateIso = toIsoDate(currentDate)
    const isCalendarTaxPostingDay = currentMonth === 6 && currentDayOfMonth === 20

    if (currentYear >= 2 && !(hasPartialFinalPeriod && currentYear === totalYears)) {
      if (bonusMode === "refundInitialCostIncreasing" && lastRefundInitialCostBonusAppliedYear !== currentYear) {
        const shouldApplyToday = (() => {
          if (inputs.bonusCreditOnAnniversaryDay20 === true) {
            const anniversaryMonth = startDate.getMonth() + 1
            return currentMonth === anniversaryMonth && currentDayOfMonth === 20
          }
          return dayOfYear === 1
        })()

        if (shouldApplyToday) {
          const prevYearInitialCostTotal = initialCostTotalByYear[1] ?? 0
          if (prevYearInitialCostTotal > 0) {
            const configuredRefundPercent = inputs.refundInitialCostBonusPercentByYear?.[currentYear]
            const bonusPercentForYear = Math.max(0, configuredRefundPercent ?? (currentYear - 1))
            const bonusForYear = prevYearInitialCostTotal * (bonusPercentForYear / 100)

            if (bonusForYear > 0) {
              // Bonus goes to invested account
              investedUnits += bonusForYear / investedPrice
              totalBonus += bonusForYear
              bonusThisYear += bonusForYear
            }
          }
          lastRefundInitialCostBonusAppliedYear = currentYear
        }
      }
    }

    let shouldPayThisMonth = false
    const startMonthIndex = startDate.getFullYear() * 12 + startDate.getMonth()
    const currentMonthIndex = currentCalendarYear * 12 + (currentMonth - 1)
    const monthsElapsed = currentMonthIndex - startMonthIndex
    const daysInCurrentMonth = new Date(currentCalendarYear, currentMonth, 0).getDate()
    const dueDayOfMonth = Math.min(startDate.getDate(), daysInCurrentMonth)
    const isDueMonth = monthsElapsed >= 0 && monthsElapsed % monthsPerPayment === 0

    if (isDueMonth && currentDayOfMonth === dueDayOfMonth && currentMonthIndex !== lastPaymentPeriodKey) {
      shouldPayThisMonth = true
      lastPaymentPeriodKey = currentMonthIndex
    }

    if (shouldPayThisMonth) {
      const yearlyPayment = inputs.yearlyPaymentsPlan[currentYear] ?? 0
      const paymentPerEventRaw = yearlyPayment / ppy
      const roundingFactor = inputs.currency === "HUF" ? 1 : 100
      const paymentPerEvent =
        inputs.frequency === "havi"
          ? Math.round(paymentPerEventRaw * roundingFactor) / roundingFactor
          : paymentPerEventRaw

      let upfrontCost = 0
      let adminFeeCost = 0
      let bonusOnContribution = 0
      let riskInsuranceCost = 0

      if (paymentPerEvent > 0) {
        const riskEnabled = inputs.riskInsuranceEnabled === true
        const riskStartYear = inputs.riskInsuranceStartYear ?? 1
        const riskEndYear = inputs.riskInsuranceEndYear
        const isRiskActive = riskEnabled && currentYear >= riskStartYear && (!riskEndYear || currentYear <= riskEndYear)

        if (isRiskActive) {
          const monthsBetweenPayments = 12 / ppy
          if (typeof inputs.riskFeeResolver === "function") {
            const resolvedRiskFee = inputs.riskFeeResolver({
              currentYear,
              currentCalendarYear,
              monthsElapsed,
              monthsBetweenPayments,
              paymentPerEvent,
              yearlyPayment,
              durationYears,
              insuredEntryAge,
            })
            riskInsuranceCost = Math.min(paymentPerEvent, Math.max(0, resolvedRiskFee))
          } else {
            const baseMonthlyPayment = inputs.frequency === "havi" ? paymentPerEvent : yearlyPayment / 12
            const baseMonthlyRiskFee =
              inputs.riskInsuranceMonthlyFeeAmount ??
              (baseMonthlyPayment * ((inputs.riskInsuranceFeePercentOfMonthlyPayment ?? 0) / 100))

            const annualIndexRate = (inputs.riskInsuranceAnnualIndexPercent ?? 0) / 100
            const yearsSinceStart = Math.max(0, currentYear - riskStartYear)
            const indexedMonthlyRiskFee = baseMonthlyRiskFee * Math.pow(1 + annualIndexRate, yearsSinceStart)
            const riskFeeForEvent = indexedMonthlyRiskFee * monthsBetweenPayments
            riskInsuranceCost = Math.min(paymentPerEvent, Math.max(0, riskFeeForEvent))
          }
        }

        const initialCostRate = getInitialCostRate(currentYear)
        if (initialCostRate > 0) {
          const initialCostBase =
            inputs.initialCostBaseMode === "afterRisk" ? Math.max(0, paymentPerEvent - riskInsuranceCost) : paymentPerEvent
          upfrontCost = initialCostBase * initialCostRate
          initialCostTotalByYear[currentYear] = (initialCostTotalByYear[currentYear] ?? 0) + upfrontCost
        }

        const adminFeePercentOfPayment = Math.max(0, getAdminFeePercentOfPayment(inputs, currentYear))
        if (adminFeePercentOfPayment > 0) {
          const adminFeeBase =
            inputs.adminFeeBaseMode === "afterRisk" ? Math.max(0, paymentPerEvent - riskInsuranceCost) : paymentPerEvent
          adminFeeCost = adminFeeBase * (adminFeePercentOfPayment / 100)
        }

        const bonusRateForCurrentYear =
          ((inputs.bonusOnContributionPercentByYear?.[currentYear] ??
            (currentYear >= bonusFromYear ? inputs.bonusOnContributionPercent ?? 0 : 0)) /
            100)
        if (bonusMode === "percentOnContribution" && bonusRateForCurrentYear > 0) {
          bonusOnContribution = paymentPerEvent * bonusRateForCurrentYear
          totalBonus += bonusOnContribution
          bonusThisYear += bonusOnContribution
          bonusThisMonth += bonusOnContribution
        }

        if (enableTax && currentYear >= taxStart && (!taxEnd || currentYear <= taxEnd)) {
          const manualTotalForYear = taxCreditAmountByYear[currentYear]
          const manualLimitForYear = taxCreditLimitByYear[currentYear]
          const effectiveYearCap = Math.min(taxCap, manualLimitForYear ?? Number.POSITIVE_INFINITY)

          if (manualTotalForYear !== undefined) {
            plannedTaxCreditThisYear = Math.min(Math.max(0, manualTotalForYear), effectiveYearCap)
          } else {
            plannedTaxCreditThisYear += paymentPerEvent * taxRate
          }

          if (!taxCreditCalendarPostingEnabled) {
            const cappedPlannedTotal = Math.min(Math.max(0, plannedTaxCreditThisYear), effectiveYearCap)
            const remainingToPost = Math.max(0, cappedPlannedTotal - taxThisYear)
            if (remainingToPost > 0) {
              applyTaxCredit(remainingToPost)
            }
          }
        }

        const netPayment = paymentPerEvent - upfrontCost - riskInsuranceCost - adminFeeCost + bonusOnContribution
        if (netPayment > 0) {
          // SPLIT AT DEPOSIT TIME based on current year's invested share percentage
          const investedSharePercent = getInvestedSharePercent(currentYear) / 100

          const investmentPart = netPayment * investedSharePercent
          const clientPart = netPayment * (1 - investedSharePercent)

          // Add to respective accounts at current prices
          if (investmentPart > 0) {
            investedUnits += investmentPart / investedPrice
          }
          if (clientPart > 0) {
            clientUnits += clientPart / clientPrice // clientPrice is always 1
          }
        }
      }

      totalContributions += paymentPerEvent
      payThisYear += paymentPerEvent
      upfrontCostThisYear += upfrontCost
      adminCostThisYear += adminFeeCost
      paymentThisMonth += paymentPerEvent
      upfrontCostThisMonth += upfrontCost
      adminFeeCostThisMonth += adminFeeCost
      riskInsuranceCostThisMonth += riskInsuranceCost
      costThisMonth += upfrontCost + adminFeeCost + riskInsuranceCost
      totalCosts += upfrontCost + adminFeeCost + riskInsuranceCost
      costThisYear += upfrontCost + adminFeeCost + riskInsuranceCost
      clientCostThisYear += adminFeeCost
      totalRiskInsuranceCost += riskInsuranceCost
      riskInsuranceCostThisYear += riskInsuranceCost
    }

    if (day >= Math.round(nextManagementFeeDay)) {
      const totalValue = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice

      const clientValueBeforeFees = clientUnits * clientPrice
      const investedValueBeforeFees = investedUnits * investedPrice
      const taxBonusValueBeforeFees = taxBonusUnits * taxBonusPrice

      if (managementFeeValueType === "percent") {
        const managementFeeRate = managementFeeValue / 100
        const dailyFeeFactor = Math.pow(1 - managementFeeRate, 1 / DAYS_PER_YEAR)

        const v0 = totalValue
        const v1 = v0 * dailyFeeFactor
        const c = v0 - v1
        if (c > 0) {
          totalCosts += c
          costThisYear += c
          managementFeeCostThisYear += c
          managementFeeCostThisMonth += c
          costThisMonth += c
          const clientRatio = clientValueBeforeFees / totalValue
          const investedRatio = investedValueBeforeFees / totalValue
          const taxBonusRatio = taxBonusValueBeforeFees / totalValue
          clientCostThisYear += c * clientRatio
          investedCostThisYear += c * investedRatio
          taxBonusCostThisYear += c * taxBonusRatio
          // Apply reduction to all accounts proportionally
          investedUnits *= dailyFeeFactor
          clientUnits *= dailyFeeFactor
          taxBonusUnits *= dailyFeeFactor
        }
      } else if (managementFeeValueType === "amount") {
        const dailyFixedFee = managementFeeValue / DAYS_PER_YEAR

        const v0 = totalValue
        const c = Math.min(dailyFixedFee, v0)
        if (c > 0) {
          totalCosts += c
          costThisYear += c
          managementFeeCostThisYear += c
          managementFeeCostThisMonth += c
          costThisMonth += c
          const clientRatio = clientValueBeforeFees / totalValue
          const investedRatio = investedValueBeforeFees / totalValue
          const taxBonusRatio = taxBonusValueBeforeFees / totalValue
          clientCostThisYear += c * clientRatio
          investedCostThisYear += c * investedRatio
          taxBonusCostThisYear += c * taxBonusRatio
          // Apply reduction to all accounts proportionally
          const reductionFactor = (v0 - c) / v0
          investedUnits *= reductionFactor
          clientUnits *= reductionFactor
          taxBonusUnits *= reductionFactor
        }
      }

      nextManagementFeeDay += daysBetweenManagementFees
    }

    const clientValueBefore = clientUnits * clientPrice
    const investedValueBefore = investedUnits * investedPrice
    const taxBonusValueBefore = taxBonusUnits * taxBonusPrice

    investedPrice *= getInvestedDailyFactor(currentDateIso)
    taxBonusPrice *= taxBonusDailyYieldFactor

    const investedValueAfter = investedUnits * investedPrice
    const taxBonusValueAfter = taxBonusUnits * taxBonusPrice

    const investedSurplus = investedValueAfter - investedValueBefore
    const taxBonusSurplus = taxBonusValueAfter - taxBonusValueBefore

    // Client account never grows (clientPrice stays at 1)
    investedInterestThisYear += investedSurplus
    taxBonusInterestThisYear += taxBonusSurplus

    interestThisYear += investedSurplus + taxBonusSurplus
    interestThisMonth += investedSurplus + taxBonusSurplus

    const isFeeActive = currentYear >= feeStartYear && (!feeStopYear || currentYear < feeStopYear)

    if (isFeeActive) {
      const totalValue = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice

      const clientValueBeforeFees = clientUnits * clientPrice
      const investedValueBeforeFees = investedUnits * investedPrice
      const taxBonusValueBeforeFees = taxBonusUnits * taxBonusPrice

      // Percentage-based management fee
      const yearlyFeeRate = (inputs.yearlyManagementFeePercent ?? 0) / 100
      const dailyMgmtFeeFactor = yearlyFeeRate > 0 ? Math.pow(1 - yearlyFeeRate, 1 / DAYS_PER_YEAR) : 1

      if (dailyMgmtFeeFactor !== 1) {
        const v0 = totalValue
        const v1 = v0 * dailyMgmtFeeFactor
        const c = v0 - v1
        if (c > 0) {
          totalCosts += c
          costThisYear += c
          managementFeeCostThisYear += c
          managementFeeCostThisMonth += c
          costThisMonth += c
          const clientRatio = clientValueBeforeFees / totalValue
          const investedRatio = investedValueBeforeFees / totalValue
          const taxBonusRatio = taxBonusValueBeforeFees / totalValue
          clientCostThisYear += c * clientRatio
          investedCostThisYear += c * investedRatio
          taxBonusCostThisYear += c * taxBonusRatio
          // Apply reduction to all accounts proportionally
          investedUnits *= dailyMgmtFeeFactor
          clientUnits *= dailyMgmtFeeFactor
          taxBonusUnits *= dailyMgmtFeeFactor
        }
      }

      const feePercentForYear = getAssetBasedFeePercent(inputs, currentYear)
      const assetAnnual = feePercentForYear / 100
      const assetDailyRate = assetAnnual / DAYS_PER_YEAR

      if (assetDailyRate > 0) {
        const v0 = totalValue
        const v1 = v0 * (1 - assetDailyRate)
        const c = v0 - v1
        if (c > 0) {
          totalCosts += c
          costThisYear += c
          totalAssetBasedCost += c
          assetCostThisYear += c
          assetCostThisMonth += c
          costThisMonth += c
          const clientRatio = clientValueBeforeFees / totalValue
          const investedRatio = investedValueBeforeFees / totalValue
          const taxBonusRatio = taxBonusValueBeforeFees / totalValue
          clientAssetCostThisYear += c * clientRatio
          investedAssetCostThisYear += c * investedRatio
          taxBonusAssetCostThisYear += c * taxBonusRatio
          clientCostThisYear += c * clientRatio
          investedCostThisYear += c * investedRatio
          taxBonusCostThisYear += c * taxBonusRatio
          // Apply reduction to all accounts proportionally
          const reductionFactor = 1 - assetDailyRate
          investedUnits *= reductionFactor
          clientUnits *= reductionFactor
          taxBonusUnits *= reductionFactor
        }
      }

      // Fixed fee
      const dailyFixedFee = (inputs.yearlyFixedManagementFeeAmount ?? 0) / DAYS_PER_YEAR
      if (dailyFixedFee > 0) {
        const v0 = totalValue
        const c = Math.min(dailyFixedFee, v0)
        if (c > 0) {
          totalCosts += c
          costThisYear += c
          managementFeeCostThisYear += c
          managementFeeCostThisMonth += c
          costThisMonth += c
          const clientRatio = clientValueBeforeFees / totalValue
          const investedRatio = investedValueBeforeFees / totalValue
          const taxBonusRatio = taxBonusValueBeforeFees / totalValue
          clientCostThisYear += c * clientRatio
          investedCostThisYear += c * investedRatio
          taxBonusCostThisYear += c * taxBonusRatio
          // Apply reduction to all accounts proportionally
          const reductionFactor = (v0 - c) / v0
          investedUnits *= reductionFactor
          clientUnits *= reductionFactor
          taxBonusUnits *= reductionFactor
        }
      }
    }

    const isYearEnd = day === currentYearEnd && currentFullYearIndex < fullYearEndOffsets.length
    const isLastDay = day === totalDays - 1

    if (isMonthEnd) {
      const currentMonthNumber = monthsElapsed + 1
      const accountMaintenanceMonthlyPercent = Math.max(0, getAccountMaintenanceMonthlyPercent(inputs, currentYear))
      const isAccountMaintenanceActive = currentMonthNumber >= accountMaintenanceStartMonth
      if (accountMaintenanceMonthlyPercent > 0 && isAccountMaintenanceActive) {
        const hasAccountSpecificMaintenanceStart =
          inputs.accountMaintenanceClientStartMonth !== undefined ||
          inputs.accountMaintenanceInvestedStartMonth !== undefined ||
          inputs.accountMaintenanceTaxBonusStartMonth !== undefined

        if (hasAccountSpecificMaintenanceStart) {
          const clientValue = clientUnits * clientPrice
          const investedValue = investedUnits * investedPrice
          const taxBonusValue = taxBonusUnits * taxBonusPrice
          const clientFee =
            currentMonthNumber >= accountMaintenanceClientStartMonth
              ? clientValue * (accountMaintenanceMonthlyPercent / 100)
              : 0
          const investedFee =
            currentMonthNumber >= accountMaintenanceInvestedStartMonth
              ? investedValue * (accountMaintenanceMonthlyPercent / 100)
              : 0
          const taxBonusFee =
            currentMonthNumber >= accountMaintenanceTaxBonusStartMonth
              ? taxBonusValue * (accountMaintenanceMonthlyPercent / 100)
              : 0
          const accountMaintenanceFee = clientFee + investedFee + taxBonusFee
          if (accountMaintenanceFee > 0) {
            totalCosts += accountMaintenanceFee
            costThisYear += accountMaintenanceFee
            accountMaintenanceCostThisYear += accountMaintenanceFee
            adminFeeCostThisMonth += accountMaintenanceFee
            costThisMonth += accountMaintenanceFee
            clientCostThisYear += clientFee
            investedCostThisYear += investedFee
            taxBonusCostThisYear += taxBonusFee
            if (clientValue > 0 && clientFee > 0) {
              clientUnits *= Math.max(0, (clientValue - clientFee) / clientValue)
            }
            if (investedValue > 0 && investedFee > 0) {
              investedUnits *= Math.max(0, (investedValue - investedFee) / investedValue)
            }
            if (taxBonusValue > 0 && taxBonusFee > 0) {
              taxBonusUnits *= Math.max(0, (taxBonusValue - taxBonusFee) / taxBonusValue)
            }
          }
        } else {
          const totalValue = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
          const accountMaintenanceFee = totalValue * (accountMaintenanceMonthlyPercent / 100)
          if (accountMaintenanceFee > 0 && totalValue > 0) {
            totalCosts += accountMaintenanceFee
            costThisYear += accountMaintenanceFee
            accountMaintenanceCostThisYear += accountMaintenanceFee
            adminFeeCostThisMonth += accountMaintenanceFee
            costThisMonth += accountMaintenanceFee
            const clientRatio = (clientUnits * clientPrice) / totalValue
            const investedRatio = (investedUnits * investedPrice) / totalValue
            const taxBonusRatio = (taxBonusUnits * taxBonusPrice) / totalValue
            clientCostThisYear += accountMaintenanceFee * clientRatio
            investedCostThisYear += accountMaintenanceFee * investedRatio
            taxBonusCostThisYear += accountMaintenanceFee * taxBonusRatio
            const reductionFactor = (totalValue - accountMaintenanceFee) / totalValue
            investedUnits *= reductionFactor
            clientUnits *= reductionFactor
            taxBonusUnits *= reductionFactor
          }
        }
      }

      const adminFeeMonthlyAmount = inputs.adminFeeMonthlyAmount ?? 0
      const isAdminFeeActive = currentYear > 1
      if (adminFeeMonthlyAmount > 0 && isAdminFeeActive) {
        const totalValue = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
        const adminFee = Math.min(adminFeeMonthlyAmount, totalValue)
        if (adminFee > 0) {
          totalCosts += adminFee
          costThisYear += adminFee
          adminCostThisYear += adminFee
          adminFeeCostThisMonth += adminFee
          costThisMonth += adminFee

          if (totalValue > 0) {
            const clientRatio = (clientUnits * clientPrice) / totalValue
            const investedRatio = (investedUnits * investedPrice) / totalValue
            const taxBonusRatio = (taxBonusUnits * taxBonusPrice) / totalValue
            clientCostThisYear += adminFee * clientRatio
            investedCostThisYear += adminFee * investedRatio
            taxBonusCostThisYear += adminFee * taxBonusRatio

            const reductionFactor = (totalValue - adminFee) / totalValue
            investedUnits *= reductionFactor
            clientUnits *= reductionFactor
            taxBonusUnits *= reductionFactor
          }
        }
      }

      const totalValueBeforePaidUpCheck = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
      const isPaidUpYear =
        (inputs.yearlyPaymentsPlan[currentYear] ?? 0) <= 0 &&
        (minimumPaidUpValue <= 0 || totalValueBeforePaidUpCheck >= minimumPaidUpValue)
      const isPaidUpMaintenanceActive = isPaidUpYear && currentMonthNumber >= paidUpMaintenanceFeeStartMonth
      if (paidUpMaintenanceFeeMonthlyAmount > 0 && isPaidUpMaintenanceActive) {
        const totalValue = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
        const maintenanceFee = Math.min(paidUpMaintenanceFeeMonthlyAmount, totalValue)
        if (maintenanceFee > 0) {
          totalCosts += maintenanceFee
          costThisYear += maintenanceFee
          adminCostThisYear += maintenanceFee
          adminFeeCostThisMonth += maintenanceFee
          costThisMonth += maintenanceFee

          if (totalValue > 0) {
            const clientRatio = (clientUnits * clientPrice) / totalValue
            const investedRatio = (investedUnits * investedPrice) / totalValue
            const taxBonusRatio = (taxBonusUnits * taxBonusPrice) / totalValue
            clientCostThisYear += maintenanceFee * clientRatio
            investedCostThisYear += maintenanceFee * investedRatio
            taxBonusCostThisYear += maintenanceFee * taxBonusRatio

            const reductionFactor = (totalValue - maintenanceFee) / totalValue
            investedUnits *= reductionFactor
            clientUnits *= reductionFactor
            taxBonusUnits *= reductionFactor
          }
        }
      }
    }

    const isPeriodClose = isYearEnd || isLastDay
    const isPartialPeriod = isLastDay && !isYearEnd
    const periodDays = isPartialPeriod ? dayOfYear : currentYearLength
    const periodMonths = isPartialPeriod ? Math.max(0, Math.floor((periodDays * 12) / DAYS_PER_YEAR)) : 12

    if (taxCreditCalendarPostingEnabled && isCalendarTaxPostingDay && pendingCalendarTaxCredits.length > 0) {
      for (let i = pendingCalendarTaxCredits.length - 1; i >= 0; i--) {
        const pendingItem = pendingCalendarTaxCredits[i]
        if (!pendingItem || pendingItem.postingDateIso !== currentDateIso) continue
        applyTaxCredit(pendingItem.amount)
        pendingCalendarTaxCredits.splice(i, 1)
      }
    }

    if (isPeriodClose) {
      if (
        taxCreditCalendarPostingEnabled &&
        !isPartialPeriod &&
        enableTax &&
        currentYear >= taxStart &&
        (!taxEnd || currentYear <= taxEnd)
      ) {
        const manualTotalForYear = taxCreditAmountByYear[currentYear]
        const manualLimitForYear = taxCreditLimitByYear[currentYear]
        const effectiveYearCap = Math.min(taxCap, manualLimitForYear ?? Number.POSITIVE_INFINITY)
        const plannedTotal =
          manualTotalForYear !== undefined
            ? Math.min(Math.max(0, manualTotalForYear), effectiveYearCap)
            : Math.min(Math.max(0, plannedTaxCreditThisYear), effectiveYearCap)
        if (plannedTotal > 0) {
          const postingDateYear =
            currentMonth < 6 || (currentMonth === 6 && currentDayOfMonth < 20) ? currentCalendarYear : currentCalendarYear + 1
          const postingDate = new Date(postingDateYear, 5, 20, 12, 0, 0, 0)
          pendingCalendarTaxCredits.push({ amount: plannedTotal, postingDateIso: toIsoDate(postingDate) })
        }
      }
      // Handle withdrawals (proportional reduction from all accounts)
      const plannedW = !isPartialPeriod ? Math.max(0, inputs.yearlyWithdrawalsPlan[currentYear] ?? 0) : 0
      if (plannedW > 0) {
        const totalBalance = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
        const maxWithdrawByMinimum = Math.max(
          0,
          totalBalance - minimumBalanceAfterPartialSurrender - partialSurrenderFeeAmount,
        )
        const w = Math.min(plannedW, totalBalance, maxWithdrawByMinimum)
        if (totalBalance > 0) {
          const withdrawalRatio = w / totalBalance
          investedUnits *= 1 - withdrawalRatio
          clientUnits *= 1 - withdrawalRatio
          taxBonusUnits *= 1 - withdrawalRatio
        }
        totalWithdrawals += w
        if (w > 0 && partialSurrenderFeeAmount > 0) {
          const valueAfterWithdrawal = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
          const appliedPartialSurrenderFee = Math.min(
            partialSurrenderFeeAmount,
            Math.max(0, valueAfterWithdrawal - minimumBalanceAfterPartialSurrender),
          )
          if (appliedPartialSurrenderFee > 0 && valueAfterWithdrawal > 0) {
            totalCosts += appliedPartialSurrenderFee
            costThisYear += appliedPartialSurrenderFee
            plusCostThisMonth += appliedPartialSurrenderFee
            costThisMonth += appliedPartialSurrenderFee
            clientCostThisYear += appliedPartialSurrenderFee * ((clientUnits * clientPrice) / valueAfterWithdrawal)
            investedCostThisYear += appliedPartialSurrenderFee * ((investedUnits * investedPrice) / valueAfterWithdrawal)
            taxBonusCostThisYear += appliedPartialSurrenderFee * ((taxBonusUnits * taxBonusPrice) / valueAfterWithdrawal)
            const feeReductionFactor = (valueAfterWithdrawal - appliedPartialSurrenderFee) / valueAfterWithdrawal
            investedUnits *= feeReductionFactor
            clientUnits *= feeReductionFactor
            taxBonusUnits *= feeReductionFactor
          }
        }
        withdrawalThisYear = w
      } else {
        withdrawalThisYear = 0
      }

      // Handle plusCost for this year
      const plusCostForCurrentYear = !isPartialPeriod ? (inputs.plusCostByYear?.[currentYear] ?? 0) : 0
      if (plusCostForCurrentYear > 0) {
        costThisYear += plusCostForCurrentYear
        totalCosts += plusCostForCurrentYear
        plusCostThisMonth += plusCostForCurrentYear
        costThisMonth += plusCostForCurrentYear
        const clientValueBeforePlus = clientUnits * clientPrice
        const investedValueBeforePlus = investedUnits * investedPrice
        const taxBonusValueBeforePlus = taxBonusUnits * taxBonusPrice
        const totalValueBeforePlus = clientValueBeforePlus + investedValueBeforePlus + taxBonusValueBeforePlus
        if (totalValueBeforePlus > 0) {
          const clientRatio = clientValueBeforePlus / totalValueBeforePlus
          const investedRatio = investedValueBeforePlus / totalValueBeforePlus
          const taxBonusRatio = taxBonusValueBeforePlus / totalValueBeforePlus
          clientPlusCostThisYear = plusCostForCurrentYear * clientRatio
          investedPlusCostThisYear = plusCostForCurrentYear * investedRatio
          taxBonusPlusCostThisYear = plusCostForCurrentYear * taxBonusRatio
          clientCostThisYear += clientPlusCostThisYear
          investedCostThisYear += investedPlusCostThisYear
          taxBonusCostThisYear += taxBonusPlusCostThisYear
        }
      }

      const bonusPercent = !isPartialPeriod ? (inputs.bonusPercentByYear?.[currentYear] ?? 0) : 0
      if (bonusPercent > 0) {
        // Calculate current total wealth BEFORE bonus
        const totalWealthBeforeBonus =
          investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
        const wealthBonusAmount = totalWealthBeforeBonus * (bonusPercent / 100)

        if (wealthBonusAmount > 0) {
          // Add bonus to invested account (grows with returns)
          investedUnits += wealthBonusAmount / investedPrice
          totalBonus += wealthBonusAmount
          wealthBonusThisYear = wealthBonusAmount
          investedWealthBonusThisYear = wealthBonusAmount
          bonusThisMonth += wealthBonusAmount
        }
      }

      const bonusAmount = !isPartialPeriod ? Math.max(0, inputs.bonusAmountByYear?.[currentYear] ?? 0) : 0
      if (bonusAmount > 0) {
        investedUnits += bonusAmount / investedPrice
        totalBonus += bonusAmount
        wealthBonusThisYear += bonusAmount
        investedWealthBonusThisYear += bonusAmount
        bonusThisMonth += bonusAmount
      }

      const endingSurplusValue = investedUnits * investedPrice
      const endingClientValue = clientUnits * clientPrice
      const endingTaxBonusValue = taxBonusUnits * taxBonusPrice
      const endingTotalValue = endingSurplusValue + endingClientValue + endingTaxBonusValue

      const redemptionPercent = getRedemptionFeePercent(currentYear) / 100
      let surrenderCharge = 0
      let surrenderValue = endingTotalValue // Default: same as total if no redemption

      const baseMode = inputs.redemptionBaseMode ?? "surplus-only"

      if (inputs.redemptionEnabled && redemptionPercent > 0) {
        if (baseMode === "surplus-only") {
          // Redemption base is the invested (surplus) account only
          const redemptionBase = endingSurplusValue
          surrenderCharge = redemptionBase * redemptionPercent
        } else {
          // Redemption base is the total account value
          const redemptionBase = endingTotalValue
          surrenderCharge = redemptionBase * redemptionPercent
        }
        surrenderValue = endingTotalValue - surrenderCharge
      }

      yearlyBreakdown.push({
        year: currentYear,
        periodType: isPartialPeriod ? "partial" : "year",
        periodMonths,
        periodDays,
        periodLabel: isPartialPeriod ? formatPartialPeriodLabelFromDays(periodDays) : `${currentYear}. év`,
        yearlyPayment: payThisYear,
        totalContributions,
        interestForYear: interestThisYear,
        costForYear: costThisYear,
        upfrontCostForYear: upfrontCostThisYear,
        adminCostForYear: adminCostThisYear,
        accountMaintenanceCostForYear: accountMaintenanceCostThisYear,
        managementFeeCostForYear: managementFeeCostThisYear,
        assetBasedCostForYear: assetCostThisYear,
        plusCostForYear: plusCostForCurrentYear,
        bonusForYear: bonusThisYear,
        wealthBonusForYear: wealthBonusThisYear,
        taxCreditForYear: taxThisYear,
        withdrawalForYear: withdrawalThisYear,
        riskInsuranceCostForYear: riskInsuranceCostThisYear,
        endBalance: endingTotalValue,
        endingInvestedValue: endingSurplusValue,
        endingClientValue: endingClientValue,
        endingTaxBonusValue: endingTaxBonusValue,
        surrenderValue: surrenderValue,
        surrenderCharge: surrenderCharge,
        client: {
          endBalance: endingClientValue,
          interestForYear: clientInterestThisYear,
          costForYear: clientCostThisYear,
          assetBasedCostForYear: clientAssetCostThisYear,
          plusCostForYear: clientPlusCostThisYear,
          bonusForYear: clientBonusThisYear,
          wealthBonusForYear: clientWealthBonusThisYear,
        },
        invested: {
          endBalance: endingSurplusValue,
          interestForYear: investedInterestThisYear,
          costForYear: investedCostThisYear,
          assetBasedCostForYear: investedAssetCostThisYear,
          plusCostForYear: investedPlusCostThisYear,
          bonusForYear: investedBonusThisYear,
          wealthBonusForYear: investedWealthBonusThisYear,
        },
        taxBonus: {
          endBalance: endingTaxBonusValue,
          interestForYear: taxBonusInterestThisYear,
          costForYear: taxBonusCostThisYear,
          assetBasedCostForYear: taxBonusAssetCostThisYear,
          plusCostForYear: taxBonusPlusCostThisYear,
          bonusForYear: taxBonusBonusThisYear,
          wealthBonusForYear: taxBonusWealthBonusThisYear,
        },
      })

      // Reset yearly accumulators
      payThisYear = 0
      interestThisYear = 0
      costThisYear = 0
      upfrontCostThisYear = 0
      adminCostThisYear = 0
      accountMaintenanceCostThisYear = 0
      managementFeeCostThisYear = 0
      assetCostThisYear = 0
      bonusThisYear = 0
      wealthBonusThisYear = 0
      taxThisYear = 0
      plannedTaxCreditThisYear = 0
      withdrawalThisYear = 0
      riskInsuranceCostThisYear = 0
      clientInterestThisYear = 0
      investedInterestThisYear = 0
      clientCostThisYear = 0
      investedCostThisYear = 0
      clientAssetCostThisYear = 0
      investedAssetCostThisYear = 0
      clientBonusThisYear = 0
      investedBonusThisYear = 0
      clientWealthBonusThisYear = 0
      investedWealthBonusThisYear = 0
      clientPlusCostThisYear = 0
      investedPlusCostThisYear = 0
      taxBonusInterestThisYear = 0
      taxBonusCostThisYear = 0
      taxBonusAssetCostThisYear = 0
      taxBonusBonusThisYear = 0
      taxBonusWealthBonusThisYear = 0
      taxBonusPlusCostThisYear = 0
    }

    if (isMonthEnd) {
      cumulativeMonth += 1
      monthlyBreakdown.push({
        year: currentYear,
        month: monthOfYear,
        cumulativeMonth,
        payment: paymentThisMonth,
        upfrontCost: upfrontCostThisMonth,
        adminFeeCost: adminFeeCostThisMonth,
        riskInsuranceCost: riskInsuranceCostThisMonth,
        managementFeeCost: managementFeeCostThisMonth,
        assetBasedCost: assetCostThisMonth,
        plusCost: plusCostThisMonth,
        bonus: bonusThisMonth,
        taxCredit: taxCreditThisMonth,
        interest: interestThisMonth,
        costTotal: costThisMonth,
        endBalance: investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice,
        endingInvestedValue: investedUnits * investedPrice,
        endingClientValue: clientUnits * clientPrice,
        endingTaxBonusValue: taxBonusUnits * taxBonusPrice,
      })

      paymentThisMonth = 0
      upfrontCostThisMonth = 0
      adminFeeCostThisMonth = 0
      riskInsuranceCostThisMonth = 0
      managementFeeCostThisMonth = 0
      assetCostThisMonth = 0
      plusCostThisMonth = 0
      bonusThisMonth = 0
      taxCreditThisMonth = 0
      interestThisMonth = 0
      costThisMonth = 0
    }
  }

  const endBalance = investedUnits * investedPrice + clientUnits * clientPrice + taxBonusUnits * taxBonusPrice
  const totalInterestNet = endBalance - totalContributions - totalBonus - totalTaxCredit + totalCosts + totalWithdrawals
  return {
    currency: inputs.currency,
    endBalance,
    totalContributions,
    totalCosts,
    totalBonus,
    totalTaxCredit,
    totalAssetBasedCost,
    totalRiskInsuranceCost,
    totalWithdrawals,
    totalInterestNet,
    yearlyBreakdown,
    monthlyBreakdown,
  }
}
