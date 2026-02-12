"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Settings,
  Calculator,
  BarChart3,
  Table2,
  Info,
  Plus,
  X,
  GitCompare,
  FileText,
} from "lucide-react"
import {
  calculate,
  type InputsDaily,
  type Currency,
  type PaymentFrequency,
  type ManagementFeeFrequency, // Added import
  type ManagementFeeValueType, // Added import
  type ProductId,
} from "@/lib/engine"
import { getFxRateWithFallback, type FxState } from "@/lib/fx-rate" // Updated import
import { Button } from "@/components/ui/button"
import { buildYearlyPlan } from "@/lib/plan"
import { convertForDisplay, convertFromDisplayToCalc, formatMoney } from "@/lib/currency-conversion"
import { formatNumber, parseNumber } from "@/lib/format-number"
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useRouter } from "next/navigation"
import { useCalculatorData, type CalculatorData } from "@/lib/calculator-context"
import { useMobile } from "@/lib/mobile-context"
import { InitialCostByYear } from "./initial-cost-by-year"
import { RedemptionFeeByYear } from "@/components/redemption-fee-by-year" // Added import
import { InvestedShareByYear } from "./invested-share-by-year" // Added import

type DurationUnit = "year" | "month" | "day"

type ExtraServiceFrequency = "daily" | "monthly" | "quarterly" | "semi-annual" | "annual"
type ExtraServiceType = "amount" | "percent"

interface ExtraService {
  id: string
  name: string
  type: ExtraServiceType
  value: number
  frequency: ExtraServiceFrequency
}

interface YieldMonitoringService {
  enabled: boolean
  fundCount: number
}

interface ManagementFee {
  id: string
  frequency: ManagementFeeFrequency
  valueType: ManagementFeeValueType
  value: number
  account: "client" | "invested" | "taxBonus"
}

interface Bonus {
  id: string
  valueType: "percent" | "amount"
  value: number
  account: "client" | "invested" | "taxBonus"
}

// Added product metadata types
interface ProductMetadata {
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
  variants?: {
    productType: string
    mnbCode: string
    productCode: string
  }[]
}

// Added taxBonus view mode to YearRow type
type YearRow = {
  year: number
  totalContributions: number
  endBalance: number
  interestForYear: number
  costForYear: number
  assetBasedCostForYear: number
  plusCostForYear: number
  wealthBonusForYear: number
  taxCreditForYear: number
  withdrawalForYear: number
  surrenderCharge: number
  surrenderValue: number
  endingInvestedValue: number
  endingClientValue: number
  endingTaxBonusValue?: number // Added for tooltip display
  client: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
  }
  invested: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
  }
  taxBonus: {
    endBalance: number
    interestForYear: number
    costForYear: number
    assetBasedCostForYear: number
    plusCostForYear: number
    wealthBonusForYear: number
  }
}
// </CHANGE>

type NetRow = {
  year: number
  grossBalance: number
  grossProfit: number
  taxRate: number
  taxDeduction: number
  netProfit: number
  netBalance: number
}

const mainTaxRateByYear = (year: number, isCorporate: boolean) => {
  if (year <= 5) return isCorporate ? 0.15 : 0.28
  if (year <= 10) return isCorporate ? 0.075 : 0.14
  return 0
}

const esetiTaxRateByLotAge = (ageYears: number, isCorporate: boolean) => {
  if (ageYears <= 3) return isCorporate ? 0.15 : 0.28
  if (ageYears <= 5) return isCorporate ? 0.075 : 0.14
  return 0
}

function calculateNetValuesMain(
  yearlyBreakdown: Array<{ year: number; endBalance: number; totalContributions: number }>,
  isCorporate: boolean,
): NetRow[] {
  return yearlyBreakdown.map((row) => {
    const totalContributions = Number.isFinite(row.totalContributions) ? row.totalContributions : 0
    const grossProfit = row.endBalance - totalContributions
    const taxRate = mainTaxRateByYear(row.year, isCorporate)
    const taxDeduction = grossProfit > 0 ? grossProfit * taxRate : 0
    const netProfit = grossProfit - taxDeduction
    const netBalance = totalContributions + netProfit

    return {
      year: row.year,
      grossBalance: row.endBalance,
      grossProfit,
      taxRate,
      taxDeduction,
      netProfit,
      netBalance,
    }
  })
}

function calculateNetValuesEseti(
  yearlyBreakdown: Array<{ year: number; endBalance: number; totalContributions: number; withdrawalForYear?: number }>,
  isCorporate: boolean,
): NetRow[] {
  type Lot = { year: number; principalRemaining: number }
  const lots: Lot[] = []
  let previousTotalContributions = 0

  return yearlyBreakdown.map((row) => {
    const totalContributions = Number.isFinite(row.totalContributions) ? row.totalContributions : 0
    const paymentThisYear = Math.max(0, totalContributions - previousTotalContributions)
    previousTotalContributions = totalContributions

    if (paymentThisYear > 0) {
      lots.push({ year: row.year, principalRemaining: paymentThisYear })
    }

    const withdrawalThisYear = Math.max(0, row.withdrawalForYear ?? 0)
    if (withdrawalThisYear > 0) {
      const principalBeforeWithdrawal = lots.reduce((sum, lot) => sum + lot.principalRemaining, 0)
      if (principalBeforeWithdrawal > 0) {
        const reductionFactor = Math.max(0, (principalBeforeWithdrawal - withdrawalThisYear) / principalBeforeWithdrawal)
        for (const lot of lots) {
          lot.principalRemaining *= reductionFactor
        }
      }
    }

    const remainingPrincipal = lots.reduce((sum, lot) => sum + lot.principalRemaining, 0)
    const grossProfit = row.endBalance - remainingPrincipal

    const weightedTaxBase = lots.reduce((sum, lot) => {
      if (lot.principalRemaining <= 0) return sum
      const lotAge = row.year - lot.year + 1
      return sum + lot.principalRemaining * esetiTaxRateByLotAge(lotAge, isCorporate)
    }, 0)
    const taxRate = remainingPrincipal > 0 ? weightedTaxBase / remainingPrincipal : 0

    const taxDeduction = grossProfit > 0 ? grossProfit * taxRate : 0
    const netProfit = grossProfit - taxDeduction
    const netBalance = remainingPrincipal + netProfit

    return {
      year: row.year,
      grossBalance: row.endBalance,
      grossProfit,
      taxRate,
      taxDeduction,
      netProfit,
      netBalance,
    }
  })
}

function combineNetRows(mainRows: NetRow[], esetiRows: NetRow[]): NetRow[] {
  const maxLength = Math.max(mainRows.length, esetiRows.length)
  const rows: NetRow[] = []
  for (let index = 0; index < maxLength; index++) {
    const main = mainRows[index]
    const eseti = esetiRows[index]
    const grossBalance = (main?.grossBalance ?? 0) + (eseti?.grossBalance ?? 0)
    const grossProfit = (main?.grossProfit ?? 0) + (eseti?.grossProfit ?? 0)
    const taxDeduction = (main?.taxDeduction ?? 0) + (eseti?.taxDeduction ?? 0)
    const netProfit = grossProfit - taxDeduction
    const netBalance = (main?.netBalance ?? 0) + (eseti?.netBalance ?? 0)
    rows.push({
      year: main?.year ?? eseti?.year ?? index + 1,
      grossBalance,
      grossProfit,
      taxRate: grossProfit > 0 ? taxDeduction / grossProfit : 0,
      taxDeduction,
      netProfit,
      netBalance,
    })
  }
  return rows
}

const buildCumulativeByYear = (yearlyBreakdown: Array<any> = []) => {
  const map: Record<number, any> = {}
  let acc = {
    interestForYear: 0,
    costForYear: 0,
    assetBasedCostForYear: 0,
    plusCostForYear: 0,
    bonusForYear: 0,
    wealthBonusForYear: 0,
    taxCreditForYear: 0,
    withdrawalForYear: 0,
    riskInsuranceCostForYear: 0,
    client: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
    invested: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
    taxBonus: {
      interestForYear: 0,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    },
  }

  for (const row of yearlyBreakdown) {
    if (!row) continue
    acc = {
      interestForYear: acc.interestForYear + (row.interestForYear ?? 0),
      costForYear: acc.costForYear + (row.costForYear ?? 0),
      assetBasedCostForYear: acc.assetBasedCostForYear + (row.assetBasedCostForYear ?? 0),
      plusCostForYear: acc.plusCostForYear + (row.plusCostForYear ?? 0),
      bonusForYear: acc.bonusForYear + (row.bonusForYear ?? 0),
      wealthBonusForYear: acc.wealthBonusForYear + (row.wealthBonusForYear ?? 0),
      taxCreditForYear: acc.taxCreditForYear + (row.taxCreditForYear ?? 0),
      withdrawalForYear: acc.withdrawalForYear + (row.withdrawalForYear ?? 0),
      riskInsuranceCostForYear: acc.riskInsuranceCostForYear + (row.riskInsuranceCostForYear ?? 0),
      client: {
        interestForYear: acc.client.interestForYear + (row.client?.interestForYear ?? 0),
        costForYear: acc.client.costForYear + (row.client?.costForYear ?? 0),
        assetBasedCostForYear: acc.client.assetBasedCostForYear + (row.client?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.client.plusCostForYear + (row.client?.plusCostForYear ?? 0),
        bonusForYear: acc.client.bonusForYear + (row.client?.bonusForYear ?? 0),
        wealthBonusForYear: acc.client.wealthBonusForYear + (row.client?.wealthBonusForYear ?? 0),
      },
      invested: {
        interestForYear: acc.invested.interestForYear + (row.invested?.interestForYear ?? 0),
        costForYear: acc.invested.costForYear + (row.invested?.costForYear ?? 0),
        assetBasedCostForYear: acc.invested.assetBasedCostForYear + (row.invested?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.invested.plusCostForYear + (row.invested?.plusCostForYear ?? 0),
        bonusForYear: acc.invested.bonusForYear + (row.invested?.bonusForYear ?? 0),
        wealthBonusForYear: acc.invested.wealthBonusForYear + (row.invested?.wealthBonusForYear ?? 0),
      },
      taxBonus: {
        interestForYear: acc.taxBonus.interestForYear + (row.taxBonus?.interestForYear ?? 0),
        costForYear: acc.taxBonus.costForYear + (row.taxBonus?.costForYear ?? 0),
        assetBasedCostForYear: acc.taxBonus.assetBasedCostForYear + (row.taxBonus?.assetBasedCostForYear ?? 0),
        plusCostForYear: acc.taxBonus.plusCostForYear + (row.taxBonus?.plusCostForYear ?? 0),
        bonusForYear: acc.taxBonus.bonusForYear + (row.taxBonus?.bonusForYear ?? 0),
        wealthBonusForYear: acc.taxBonus.wealthBonusForYear + (row.taxBonus?.wealthBonusForYear ?? 0),
      },
    }

    map[row.year] = {
      ...row,
      interestForYear: acc.interestForYear,
      costForYear: acc.costForYear,
      assetBasedCostForYear: acc.assetBasedCostForYear,
      plusCostForYear: acc.plusCostForYear,
      bonusForYear: acc.bonusForYear,
      wealthBonusForYear: acc.wealthBonusForYear,
      taxCreditForYear: acc.taxCreditForYear,
      withdrawalForYear: acc.withdrawalForYear,
      riskInsuranceCostForYear: acc.riskInsuranceCostForYear,
      client: {
        ...row.client,
        interestForYear: acc.client.interestForYear,
        costForYear: acc.client.costForYear,
        assetBasedCostForYear: acc.client.assetBasedCostForYear,
        plusCostForYear: acc.client.plusCostForYear,
        bonusForYear: acc.client.bonusForYear,
        wealthBonusForYear: acc.client.wealthBonusForYear,
      },
      invested: {
        ...row.invested,
        interestForYear: acc.invested.interestForYear,
        costForYear: acc.invested.costForYear,
        assetBasedCostForYear: acc.invested.assetBasedCostForYear,
        plusCostForYear: acc.invested.plusCostForYear,
        bonusForYear: acc.invested.bonusForYear,
        wealthBonusForYear: acc.invested.wealthBonusForYear,
      },
      taxBonus: {
        ...row.taxBonus,
        interestForYear: acc.taxBonus.interestForYear,
        costForYear: acc.taxBonus.costForYear,
        assetBasedCostForYear: acc.taxBonus.assetBasedCostForYear,
        plusCostForYear: acc.taxBonus.plusCostForYear,
        bonusForYear: acc.taxBonus.bonusForYear,
        wealthBonusForYear: acc.taxBonus.wealthBonusForYear,
      },
    }
  }

  return map
}

const numeric = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : 0)

const mergeYearRows = (mainRow?: any, esetiRow?: any) => {
  const main = mainRow ?? {}
  const eseti = esetiRow ?? {}

  return {
    year: main.year ?? eseti.year ?? 0,
    yearlyPayment: numeric(main.yearlyPayment) + numeric(eseti.yearlyPayment),
    totalContributions: numeric(main.totalContributions) + numeric(eseti.totalContributions),
    interestForYear: numeric(main.interestForYear) + numeric(eseti.interestForYear),
    costForYear: numeric(main.costForYear) + numeric(eseti.costForYear),
    assetBasedCostForYear: numeric(main.assetBasedCostForYear) + numeric(eseti.assetBasedCostForYear),
    plusCostForYear: numeric(main.plusCostForYear) + numeric(eseti.plusCostForYear),
    bonusForYear: numeric(main.bonusForYear) + numeric(eseti.bonusForYear),
    wealthBonusForYear: numeric(main.wealthBonusForYear) + numeric(eseti.wealthBonusForYear),
    taxCreditForYear: numeric(main.taxCreditForYear) + numeric(eseti.taxCreditForYear),
    withdrawalForYear: numeric(main.withdrawalForYear) + numeric(eseti.withdrawalForYear),
    riskInsuranceCostForYear: numeric(main.riskInsuranceCostForYear) + numeric(eseti.riskInsuranceCostForYear),
    endBalance: numeric(main.endBalance) + numeric(eseti.endBalance),
    endingInvestedValue: numeric(main.endingInvestedValue) + numeric(eseti.endingInvestedValue),
    endingClientValue: numeric(main.endingClientValue) + numeric(eseti.endingClientValue),
    endingTaxBonusValue: numeric(main.endingTaxBonusValue) + numeric(eseti.endingTaxBonusValue),
    surrenderValue: numeric(main.surrenderValue) + numeric(eseti.surrenderValue),
    surrenderCharge: numeric(main.surrenderCharge) + numeric(eseti.surrenderCharge),
    client: {
      endBalance: numeric(main.client?.endBalance) + numeric(eseti.client?.endBalance),
      interestForYear: numeric(main.client?.interestForYear) + numeric(eseti.client?.interestForYear),
      costForYear: numeric(main.client?.costForYear) + numeric(eseti.client?.costForYear),
      assetBasedCostForYear: numeric(main.client?.assetBasedCostForYear) + numeric(eseti.client?.assetBasedCostForYear),
      plusCostForYear: numeric(main.client?.plusCostForYear) + numeric(eseti.client?.plusCostForYear),
      bonusForYear: numeric(main.client?.bonusForYear) + numeric(eseti.client?.bonusForYear),
      wealthBonusForYear: numeric(main.client?.wealthBonusForYear) + numeric(eseti.client?.wealthBonusForYear),
    },
    invested: {
      endBalance: numeric(main.invested?.endBalance) + numeric(eseti.invested?.endBalance),
      interestForYear: numeric(main.invested?.interestForYear) + numeric(eseti.invested?.interestForYear),
      costForYear: numeric(main.invested?.costForYear) + numeric(eseti.invested?.costForYear),
      assetBasedCostForYear:
        numeric(main.invested?.assetBasedCostForYear) + numeric(eseti.invested?.assetBasedCostForYear),
      plusCostForYear: numeric(main.invested?.plusCostForYear) + numeric(eseti.invested?.plusCostForYear),
      bonusForYear: numeric(main.invested?.bonusForYear) + numeric(eseti.invested?.bonusForYear),
      wealthBonusForYear: numeric(main.invested?.wealthBonusForYear) + numeric(eseti.invested?.wealthBonusForYear),
    },
    taxBonus: {
      endBalance: numeric(main.taxBonus?.endBalance) + numeric(eseti.taxBonus?.endBalance),
      interestForYear: numeric(main.taxBonus?.interestForYear) + numeric(eseti.taxBonus?.interestForYear),
      costForYear: numeric(main.taxBonus?.costForYear) + numeric(eseti.taxBonus?.costForYear),
      assetBasedCostForYear:
        numeric(main.taxBonus?.assetBasedCostForYear) + numeric(eseti.taxBonus?.assetBasedCostForYear),
      plusCostForYear: numeric(main.taxBonus?.plusCostForYear) + numeric(eseti.taxBonus?.plusCostForYear),
      bonusForYear: numeric(main.taxBonus?.bonusForYear) + numeric(eseti.taxBonus?.bonusForYear),
      wealthBonusForYear: numeric(main.taxBonus?.wealthBonusForYear) + numeric(eseti.taxBonus?.wealthBonusForYear),
    },
  }
}

function MobileYearCard({
  row,
  planIndex,
  planPayment,
  indexByYear,
  paymentByYear,
  withdrawalByYear,
  taxCreditLimitByYear,
  displayCurrency,
  resultsCurrency,
  eurToHufRate,
  enableTaxCredit,
  editingFields,
  setFieldEditing,
  updateIndex,
  updatePayment,
  updateWithdrawal,
  updateTaxCreditLimit,
  formatValue,
  getRealValueForYear,
  enableNetting,
  netData,
  riskInsuranceCostForYear,
  isAccountSplitOpen,
  isRedemptionOpen,
  plusCostByYear,
  inputs,
  updatePlusCost,
  assetCostPercentByYear,
  updateAssetCostPercent,
  bonusPercentByYear,
  updateBonusPercent,
  yearlyViewMode, // Added prop
  yearlyAccountView,
  cumulativeByYear,
  shouldApplyTaxCreditPenalty,
  isTaxBonusSeparateAccount, // Added prop
}: {
  row: any
  planIndex: Record<number, number>
  planPayment: Record<number, number>
  indexByYear: Record<number, number>
  paymentByYear: Record<number, number>
  withdrawalByYear: Record<number, number>
  taxCreditLimitByYear: Record<number, number>
  displayCurrency: Currency
  resultsCurrency: Currency
  eurToHufRate: number
  enableTaxCredit: boolean
  editingFields: Record<string, boolean | undefined>
  setFieldEditing: (field: string, isEditing: boolean) => void
  updateIndex: (year: number, value: number) => void
  updatePayment: (year: number, value: number) => void
  updateWithdrawal: (year: number, value: number) => void
  updateTaxCreditLimit: (year: number, value: number) => void
  formatValue: (value: number, currency: Currency) => string
  getRealValueForYear?: (value: number, year: number) => number
  enableNetting?: boolean
  netData?: {
    grossBalance: number
    grossProfit: number
    taxRate: number
    taxDeduction: number
    netProfit: number
    netBalance: number
  }
  riskInsuranceCostForYear?: number
  isAccountSplitOpen?: boolean
  isRedemptionOpen?: boolean
  plusCostByYear?: Record<number, number>
  inputs?: any
  updatePlusCost?: (year: number, value: number) => void
  assetCostPercentByYear?: Record<number, number>
  updateAssetCostPercent?: (year: number, value: number) => void
  bonusPercentByYear?: Record<number, number>
  updateBonusPercent?: (year: number, percent: number) => void
  yearlyViewMode?: "total" | "client" | "invested" | "taxBonus" // Added prop
  yearlyAccountView?: "summary" | "main" | "eseti"
  cumulativeByYear?: Record<number, any>
  shouldApplyTaxCreditPenalty?: boolean
  isTaxBonusSeparateAccount?: boolean // Added prop
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const currentIndex = planIndex[row.year]
  const currentPayment = planPayment[row.year]
  const currentWithdrawal = withdrawalByYear[row.year] || 0
  const currentTaxCreditLimit = taxCreditLimitByYear[row.year]

  const isIndexModified = indexByYear[row.year] !== undefined
  const isPaymentModified = paymentByYear[row.year] !== undefined
  const isWithdrawalModified = withdrawalByYear[row.year] !== undefined
  const isTaxCreditLimited = currentTaxCreditLimit !== undefined
  const isYearlyReadOnly = yearlyAccountView === "summary"
  const isEsetiView = yearlyAccountView === "eseti"
  const effectiveYearlyViewMode = yearlyAccountView === "main" ? yearlyViewMode : "total"
  const effectiveCurrentIndex = isEsetiView ? indexByYear?.[row.year] ?? currentIndex ?? 0 : currentIndex
  const effectiveCurrentPayment = isEsetiView ? paymentByYear?.[row.year] ?? currentPayment ?? 0 : currentPayment

  let displayData = {
    endBalance: row.endBalance,
    interestForYear: row.interestForYear,
    costForYear: row.costForYear,
    assetBasedCostForYear: row.assetBasedCostForYear,
    plusCostForYear: row.plusCostForYear,
    wealthBonusForYear: row.wealthBonusForYear,
  }

  if (effectiveYearlyViewMode === "client") {
    displayData = {
      endBalance: row.client.endBalance,
      interestForYear: row.client.interestForYear,
      costForYear: row.client.costForYear,
      assetBasedCostForYear: row.client.assetBasedCostForYear,
      plusCostForYear: row.client.plusCostForYear,
      wealthBonusForYear: row.client.wealthBonusForYear,
    }
  } else if (effectiveYearlyViewMode === "invested") {
    displayData = {
      endBalance: row.invested.endBalance,
      interestForYear: row.invested.interestForYear,
      costForYear: row.invested.costForYear,
      assetBasedCostForYear: row.invested.assetBasedCostForYear,
      plusCostForYear: row.invested.plusCostForYear,
      wealthBonusForYear: row.invested.wealthBonusForYear,
    }
  } else if (effectiveYearlyViewMode === "taxBonus") {
    displayData = {
      endBalance: row.taxBonus.endBalance,
      interestForYear: row.taxBonus.interestForYear,
      costForYear: row.taxBonus.costForYear,
      assetBasedCostForYear: row.taxBonus.assetBasedCostForYear,
      plusCostForYear: row.taxBonus.plusCostForYear,
      wealthBonusForYear: row.taxBonus.wealthBonusForYear,
    }
  }
  // </CHANGE>

  if (isEsetiView) {
    displayData = {
      ...displayData,
      costForYear: 0,
      assetBasedCostForYear: 0,
      plusCostForYear: 0,
      bonusForYear: 0,
      wealthBonusForYear: 0,
    }
  }

  const cumulativeRow = cumulativeByYear?.[row.year] ?? row
  let displayBalance = enableNetting && netData ? netData.netBalance : displayData.endBalance
  if (shouldApplyTaxCreditPenalty) {
    displayBalance = Math.max(0, displayBalance - (cumulativeRow.taxCreditForYear ?? 0) * 1.2)
  }
  const effectiveWithdrawn = row.withdrawalForYear ?? currentWithdrawal
  const preWithdrawalBalance = displayBalance + effectiveWithdrawn
  const maxWithdrawalDisplay = convertForDisplay(preWithdrawalBalance, resultsCurrency, displayCurrency, eurToHufRate)
  displayBalance = Math.max(0, preWithdrawalBalance - effectiveWithdrawn)
  const applyRealValue = (value: number) => (getRealValueForYear ? getRealValueForYear(value, row.year) : value)

  const showBreakdown = isAccountSplitOpen || isRedemptionOpen

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="font-semibold text-lg">{row.year}. év</div>
          <div className="text-2xl font-bold tabular-nums">
            {formatValue(applyRealValue(displayBalance), displayCurrency)}
          </div>
          {showBreakdown && (
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              {/* CASE A: Split is open - show full breakdown */}
              {isAccountSplitOpen && row.endingInvestedValue !== undefined && row.endingClientValue !== undefined && (
                <>
                  <div>Lejárati többletdíj: {formatValue(applyRealValue(row.endingInvestedValue), displayCurrency)}</div>
                  <div>Ügyfélérték: {formatValue(applyRealValue(row.endingClientValue), displayCurrency)}</div>
                  {isTaxBonusSeparateAccount && row.endingTaxBonusValue > 0 && (
                    <div>Adójóváírás: {formatValue(applyRealValue(row.endingTaxBonusValue), displayCurrency)}</div>
                  )}
                  {/* </CHANGE> */}
                  <div className="font-medium">
                    Összesen: {formatValue(applyRealValue(displayBalance), displayCurrency)}
                  </div>
                  {isRedemptionOpen && row.surrenderCharge > 0 && (
                    <>
                      <div className="text-orange-600 dark:text-orange-400">
                        Visszavásárlási költség: {formatValue(applyRealValue(row.surrenderCharge), displayCurrency)}
                      </div>
                      <div className="text-orange-600 dark:text-orange-400">
                        Visszavásárlási érték: {formatValue(applyRealValue(row.surrenderValue), displayCurrency)}
                      </div>
                    </>
                  )}
                </>
              )}
              {/* CASE B: Split is closed but redemption is open - show only redemption value */}
              {!isAccountSplitOpen && isRedemptionOpen && row.surrenderCharge > 0 && (
                <div className="text-orange-600 dark:text-orange-400">
                  Visszavásárlási érték: {formatValue(applyRealValue(row.surrenderValue), displayCurrency)}
                </div>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-muted-foreground hover:text-foreground p-2 -mr-2"
        >
          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* Always visible: editable fields */}
      <div
        className={`grid ${isYearlyReadOnly ? "grid-cols-1" : "grid-cols-2"} gap-3 mb-3 ${isYearlyReadOnly ? "opacity-60 pointer-events-none" : ""}`}
      >
        {!isYearlyReadOnly && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Indexálás (%)</Label>
            <Input
              type="text"
              inputMode="numeric"
              value={
                editingFields[`index-${row.year}`]
                  ? String(effectiveCurrentIndex)
                  : formatNumber(effectiveCurrentIndex)
              }
              onFocus={() => setFieldEditing(`index-${row.year}`, true)}
              onBlur={() => setFieldEditing(`index-${row.year}`, false)}
              onChange={(e) => {
                const parsed = parseNumber(e.target.value)
                if (!isNaN(parsed)) updateIndex(row.year, parsed)
              }}
              className={`h-11 text-base tabular-nums ${isIndexModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
            />
          </div>
        )}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Befizetés / év</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={
              editingFields[`payment-${row.year}`]
                ? String(
                    Math.round(convertForDisplay(effectiveCurrentPayment, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
                : formatNumber(
                    Math.round(convertForDisplay(effectiveCurrentPayment, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
            }
            onFocus={() => setFieldEditing(`payment-${row.year}`, true)}
            onBlur={() => setFieldEditing(`payment-${row.year}`, false)}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value)
              if (!isNaN(parsed)) updatePayment(row.year, parsed) // Fixed: 'year' to 'row.year'
            }}
            className={`h-11 text-base tabular-nums ${isPaymentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Pénzkivonás</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={
              editingFields[`withdrawal-${row.year}`]
                ? String(
                    Math.round(convertForDisplay(currentWithdrawal, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
                : formatNumber(
                    Math.round(convertForDisplay(currentWithdrawal, resultsCurrency, displayCurrency, eurToHufRate)),
                  )
            }
            onFocus={() => setFieldEditing(`withdrawal-${row.year}`, true)}
            onBlur={() => setFieldEditing(`withdrawal-${row.year}`, false)}
            onChange={(e) => {
              const parsed = parseNumber(e.target.value)
              if (!isNaN(parsed)) {
                const capped = Math.min(parsed, maxWithdrawalDisplay)
                updateWithdrawal(row.year, capped)
              }
            }}
            className={`h-11 text-base tabular-nums ${isWithdrawalModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
          />
        </div>
        {enableTaxCredit && (
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Adójóváírás limit</Label>
            <div className="flex items-center gap-1">
              <Input
                type="text"
                inputMode="numeric"
                value={
                  editingFields[`taxLimit-${row.year}`]
                    ? currentTaxCreditLimit !== undefined
                      ? String(
                          Math.round(
                            convertForDisplay(currentTaxCreditLimit, resultsCurrency, displayCurrency, eurToHufRate),
                          ),
                        )
                      : ""
                    : currentTaxCreditLimit !== undefined
                      ? formatNumber(
                          Math.round(
                            convertForDisplay(currentTaxCreditLimit, resultsCurrency, displayCurrency, eurToHufRate),
                          ),
                        )
                      : ""
                }
                onFocus={() => setFieldEditing(`taxLimit-${row.year}`, true)}
                onBlur={() => setFieldEditing(`taxLimit-${row.year}`, false)}
                onChange={(e) => {
                  const parsed = parseNumber(e.target.value)
                  if (!isNaN(parsed)) updateTaxCreditLimit(row.year, parsed)
                }}
                placeholder="Auto"
                className={`h-11 text-base tabular-nums flex-1 ${isTaxCreditLimited ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
              />
              {isTaxCreditLimited && (
                <button
                  type="button"
                  onClick={() => updateTaxCreditLimit(row.year, 0)}
                  className="text-muted-foreground hover:text-foreground h-11 w-8 flex items-center justify-center"
                >
                  ×
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              Tényleges: {formatValue(applyRealValue(row.taxCreditForYear), displayCurrency)}
            </p>
          </div>
        )}
      </div>

      {/* Expandable details */}
      {isExpanded && (
        <div
          className={`mt-4 pt-3 border-t space-y-2 ${
            isYearlyReadOnly ? "opacity-60 pointer-events-none" : ""
          }`}
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Összes befizetés</span>
            <span className="tabular-nums">
              {formatValue(applyRealValue(displayData.endBalance), displayCurrency)}
            </span>{" "}
            {/* Display current view's balance */}
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Hozam</span>
            <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatValue(applyRealValue(displayData.interestForYear), displayCurrency)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Költség</span>
            <span className="text-destructive tabular-nums">
              {formatValue(applyRealValue(displayData.costForYear), displayCurrency)}
            </span>
          </div>
          {row.assetBasedCostForYear > 0 &&
            inputs &&
            assetCostPercentByYear &&
            updateAssetCostPercent &&
            !(isAccountSplitOpen && effectiveYearlyViewMode === "total") && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Vagyon%</Label>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={isEsetiView ? 0 : assetCostPercentByYear[row.year] ?? inputs.assetBasedFeePercent}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      if (!isNaN(val) && val >= 0 && val <= 100) {
                        updateAssetCostPercent(row.year, val)
                      }
                    }}
                    min={0}
                    max={100}
                    step={0.1}
                    className={`h-11 text-base tabular-nums flex-1 ${assetCostPercentByYear[row.year] !== undefined ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                  />
                  {assetCostPercentByYear[row.year] !== undefined && (
                    <button
                      type="button"
                      onClick={() => updateAssetCostPercent(row.year, inputs.assetBasedFeePercent)}
                      className="text-muted-foreground hover:text-foreground h-11 w-8 flex items-center justify-center"
                    >
                      ×
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground tabular-nums">
                  Összeg: {formatValue(applyRealValue(isEsetiView ? 0 : row.assetBasedCostForYear), displayCurrency)}
                </p>
              </div>
            )}
          {/* </CHANGE> */}
          {plusCostByYear !== undefined && updatePlusCost && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Plusz költség (Ft)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={
                    editingFields[`plusCost-${row.year}`]
                      ? String(
                          Math.round(
                            convertForDisplay(
                              isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                              resultsCurrency,
                              displayCurrency,
                              eurToHufRate,
                            ),
                          ),
                        )
                      : formatNumber(
                          Math.round(
                            convertForDisplay(
                              isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                              resultsCurrency,
                              displayCurrency,
                              eurToHufRate,
                            ),
                          ),
                        )
                  }
                  onFocus={() => setFieldEditing(`plusCost-${row.year}`, true)}
                  onBlur={() => setFieldEditing(`plusCost-${row.year}`, false)}
                  onChange={(e) => {
                    const parsed = parseNumber(e.target.value)
                    if (!isNaN(parsed) && parsed >= 0) {
                      const calcValue = convertFromDisplayToCalc(parsed, resultsCurrency, displayCurrency, eurToHufRate)
                      updatePlusCost(row.year, calcValue)
                    }
                  }}
                  className={`h-11 text-base tabular-nums flex-1 ${plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                />
                {plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 && (
                  <button
                    type="button"
                    onClick={() => updatePlusCost(row.year, 0)}
                    className="text-muted-foreground hover:text-foreground h-11 w-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {/* </CHANGE> */}
          {/* </CHANGE> Added bonusPercentByYear and updateBonusPercent */}
          {bonusPercentByYear !== undefined && updateBonusPercent && (
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Bónusz (%)</Label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  inputMode="decimal"
                  value={isEsetiView ? 0 : bonusPercentByYear[row.year] ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    if (!isNaN(val) && val >= 0 && val <= 100) {
                      updateBonusPercent(row.year, val)
                    }
                  }}
                  min={0}
                  max={100}
                  step={0.1}
                  className={`h-11 text-base tabular-nums flex-1 ${bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                />
                {bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 && (
                  <button
                    type="button"
                    onClick={() => updateBonusPercent(row.year, 0)}
                    className="text-muted-foreground hover:text-foreground h-11 w-8 flex items-center justify-center"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          {/* </CHANGE> */}
          {riskInsuranceCostForYear !== undefined && riskInsuranceCostForYear > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Kockázati biztosítás</span>
              <span className="text-purple-600 dark:text-purple-400 tabular-nums">
                {formatValue(applyRealValue(riskInsuranceCostForYear), displayCurrency)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Bónusz</span>
            <span className="text-blue-600 dark:text-blue-400 tabular-nums">
              {formatValue(applyRealValue(displayData.wealthBonusForYear), displayCurrency)} {/* Use displayData */}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Adójóváírás</span>
            <span className="text-chart-3 tabular-nums">
              {formatValue(applyRealValue(row.taxCreditForYear), displayCurrency)}
            </span>
          </div>
          {row.withdrawalForYear > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pénzkivonás</span>
              <span className="text-orange-600 dark:text-orange-400 tabular-nums">
                {formatValue(applyRealValue(row.withdrawalForYear), displayCurrency)}
              </span>
            </div>
          )}
          {enableNetting && netData && (
            <>
              <div className="border-t pt-2 mt-2">
                <p className="text-xs font-medium text-muted-foreground mb-2">Nettósítás</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bruttó hozam</span>
                <span className="tabular-nums">
                  {formatValue(applyRealValue(netData.grossProfit), displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Adó ({Math.round(netData.taxRate * 100)}%)</span>
                <span className="text-destructive tabular-nums">
                  -{formatValue(applyRealValue(netData.taxDeduction), displayCurrency)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-muted-foreground">Nettó hozam</span>
                <span className="text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {formatValue(applyRealValue(netData.netProfit), displayCurrency)}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  )
}

export function SavingsCalculator() {
  const router = useRouter()
  const { updateData } = useCalculatorData()
  const { isMobile } = useMobile()

  const isHydratingRef = useRef(true)

  useEffect(() => {
    isHydratingRef.current = false
  }, [])

  const [yearlyViewMode, setYearlyViewMode] = useState<"total" | "client" | "invested" | "taxBonus">("total")
  const [yearlyAccountView, setYearlyAccountView] = useState<"summary" | "main" | "eseti">("summary")
  const [yearlyAggregationMode, setYearlyAggregationMode] = useState<"year" | "sum">("year")
  const [showCostBreakdown, setShowCostBreakdown] = useState(false)
  const [showBonusBreakdown, setShowBonusBreakdown] = useState(false)
  // </CHANGE>

  // Annual yield mode: "manual" for percentage input, "fund" for fund selector
  const [annualYieldMode, setAnnualYieldMode] = useState<"manual" | "fund">(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-annualYieldMode")
      if (stored === "manual" || stored === "fund") {
        return stored
      }
    }
    return "manual"
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-annualYieldMode", annualYieldMode)
    }
  }, [annualYieldMode])

  // Selected fund ID for annual yield
  const [selectedFundId, setSelectedFundId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedFundId")
      return stored || null
    }
    return null
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (selectedFundId) {
        sessionStorage.setItem("calculator-selectedFundId", selectedFundId)
      } else {
        sessionStorage.removeItem("calculator-selectedFundId")
      }
    }
  }, [selectedFundId])

  // Default fund data (non-Allianz or non-HUF)
  const baseFundOptions = [
    { id: "fund-1", name: "OTP Alapkezelő Részvényalap", historicalYield: 8.5 },
    { id: "fund-2", name: "ERSTE Alapkezelő Magyar Tőkepiaci Alap", historicalYield: 10.2 },
    { id: "fund-3", name: "K&H Alapkezelő Kétszínű Alap", historicalYield: 7.8 },
    { id: "fund-4", name: "Concordia Alapkezelő Konzervatív Alap", historicalYield: 5.3 },
    { id: "fund-5", name: "Raiffeisen Alapkezelő Kötvényalap", historicalYield: 6.1 },
    { id: "fund-6", name: "CIB Alapkezelő Részvényalap", historicalYield: 9.7 },
    { id: "fund-7", name: "MKB Alapkezelő Kevert Alap", historicalYield: 8.0 },
    { id: "fund-8", name: "Magyar Nemzeti Bank Devizaalap", historicalYield: 4.5 },
  ]

  // Allianz HUF fund data (use longest available horizon, not "Indulástól")
  const allianzHufFundOptions = [
    { id: "AGA", name: "Allianz Állampapír Alap", historicalYield: 3.0 },
    { id: "AHA", name: "Allianz Aktív Menedzselt Hozamkereső Alap", historicalYield: 11.19 },
    { id: "AKA", name: "Allianz Aktív Menedzselt Kiegyensúlyozott Alap", historicalYield: 7.51 },
    { id: "AMA", name: "Allianz Menedzselt Alap", historicalYield: 7.0 },
    { id: "CDA", name: "Allianz Céldátum 2025 Alap", historicalYield: 4.0 },
    { id: "CDB", name: "Allianz Céldátum 2030 Alap", historicalYield: 5.0 },
    { id: "CDC", name: "Allianz Céldátum 2035 Alap", historicalYield: 6.0 },
    { id: "CDD", name: "Allianz Céldátum 2040 Alap", historicalYield: 7.0 },
    { id: "CDE", name: "Allianz Céldátum 2045 Alap", historicalYield: 5.45 },
    { id: "CDF", name: "Allianz Céldátum 2050 Alap", historicalYield: 3.84 },
    { id: "CDG", name: "Allianz Céldátum 2055 Alap", historicalYield: 5.43 },
    { id: "DMA", name: "Allianz Demográfia Részvény Alap", historicalYield: 11.0 },
    { id: "EKA", name: "Allianz Európai Kötvény Alap", historicalYield: 1.0 },
    { id: "ERA", name: "Európai Részvény Alap", historicalYield: 11.0 },
    { id: "FPA", name: "Feltörekvő Piacok Részvény Alap", historicalYield: 11.16 },
    { id: "IPA", name: "Allianz Ipari Nyersanyagok Részvény Alap", historicalYield: 18.0 },
    { id: "KLA", name: "Klíma- és Környezetvédelem Részvény Alap", historicalYield: -4.23 },
    { id: "KTA", name: "Allianz Korszerű Energiatrendek Részvény Alap", historicalYield: 13.0 },
    { id: "MKA", name: "Allianz Magyar Kötvény Alap", historicalYield: 2.0 },
    { id: "MRA", name: "Allianz Magyar Részvény Alap", historicalYield: 17.0 },
    { id: "ORA", name: "Allianz Közép- és Kelet-Európa Részvény Alap", historicalYield: 16.0 },
    { id: "PPA", name: "Allianz Pénzpiaci Alap", historicalYield: 3.0 },
    { id: "VRA", name: "Allianz Világgazdasági Részvény Alap", historicalYield: 13.0 },
  ]

  // Allianz EUR fund data (use longest available horizon, not "Indulástól")
  const allianzEurFundOptions = [
    { id: "AHE", name: "Allianz Aktív Menedzselt Hozamkereső Euró Alap", historicalYield: 12.83 },
    { id: "AKE", name: "Allianz Aktív Menedzselt Kiegyensúlyozott Euró Alap", historicalYield: 9.54 },
    { id: "BKE", name: "Allianz Biztonságos Kötvény Euró Alap", historicalYield: -0.36 },
    { id: "CEC", name: "Allianz Céldátum 2035 Vegyes Euró Alap", historicalYield: 5.56 },
    { id: "CED", name: "Allianz Céldátum 2040 Vegyes Euró Alap", historicalYield: 6.26 },
    { id: "CEE", name: "Allianz Céldátum 2045 Vegyes Euró Alap", historicalYield: 7.4 },
    { id: "EKE", name: "Allianz Európai Kötvény Euró Alap", historicalYield: 0.62 },
    { id: "ERE", name: "Európai Részvény Euró Alap", historicalYield: 6.59 },
    { id: "FPE", name: "Feltörekvő Piacok Részvény Euró Alap", historicalYield: 13.23 },
    { id: "KLE", name: "Klíma- és Környezetvédelem Részvény Euró Alap", historicalYield: 4.76 },
    { id: "NPE", name: "Allianz Nemzetközi Pénzpiaci Euró Alap", historicalYield: 1.89 },
    { id: "VRE", name: "Allianz Világgazdasági Részvény Euró Alap", historicalYield: 10.09 },
  ]

  const [durationUnit, setDurationUnit] = useState<DurationUnit>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationUnit")
      if (stored) {
        try {
          return JSON.parse(stored) as DurationUnit
        } catch (e) {
          console.error("[v0] Failed to parse stored durationUnit:", e)
        }
      }
    }
    return "year"
  })

  const [durationValue, setDurationValue] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-durationValue")
      if (stored) {
        try {
          // </CHANGE> Fixed typo: JSON.Parse -> JSON.parse
          return JSON.parse(stored) as number
        } catch (e) {
          console.error("[v0] Failed to parse stored durationValue:", e)
        }
      }
    }
    return 10
  })
  const [esetiDurationUnit, setEsetiDurationUnit] = useState<DurationUnit>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiDurationUnit")
      if (stored) {
        try {
          return JSON.parse(stored) as DurationUnit
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiDurationUnit:", e)
        }
      }
    }
    return "year"
  })
  const [esetiDurationValue, setEsetiDurationValue] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiDurationValue")
      if (stored) {
        try {
          return JSON.parse(stored) as number
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiDurationValue:", e)
        }
      }
    }
    return 10
  })

  const [inputs, setInputs] = useState<
    Omit<InputsDaily, "yearsPlanned" | "yearlyPaymentsPlan" | "yearlyWithdrawalsPlan" | "taxCreditLimitByYear">
  >(() => {
    const defaultInputs = {
      currency: "HUF",
      eurToHufRate: 400,
      usdToHufRate: 380,
      regularPayment: 20000,
      frequency: "havi",
      annualYieldPercent: 12,
      annualIndexPercent: 3,
      keepYearlyPayment: false,
      initialCostByYear: {},
      initialCostDefaultPercent: 0,
      yearlyManagementFeePercent: 0, // This is now replaced by managementFeeValue
      yearlyFixedManagementFeeAmount: 0, // This is now replaced by managementFeeValue
      managementFeeStartYear: 1,
      managementFeeStopYear: 0,
      assetBasedFeePercent: 0,
      bonusMode: "none",
      bonusOnContributionPercent: 0, // This field seems unused in current logic, but kept for potential future use
      bonusFromYear: 1, // This field seems unused in current logic, but kept for potential future use
      enableTaxCredit: false,
      taxCreditRatePercent: 20,
      taxCreditCapPerYear: 130000,
      taxCreditStartYear: 1,
      taxCreditEndYear: undefined,
      stopTaxCreditAfterFirstWithdrawal: false,
      taxCreditYieldPercent: 12,
      calculationMode: "simple",
      startDate: new Date().toISOString().split("T")[0],
      bonusPercent: 0, // Added for bonus functionality
      bonusStartYear: 1, // Added for bonus functionality
      bonusStopYear: 0, // Added for bonus functionality
      investedShareByYear: {},
      investedShareDefaultPercent: 100,
      // Added fields for management fee
      managementFeeFrequency: "éves",
      managementFeeValueType: "percent",
      managementFeeValue: 0,
      // </CHANGE>
    }

    // Try to load from sessionStorage first
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inputs")
      if (stored) {
        try {
          // Deserialize the stored data, ensuring startDate is a string
          const parsedData = JSON.parse(stored)
          if (parsedData.startDate && typeof parsedData.startDate === "string" && parsedData.startDate.split("T")[0]) {
            return { ...defaultInputs, ...parsedData, startDate: parsedData.startDate.split("T")[0] }
          }
          return { ...defaultInputs, ...parsedData }
        } catch (e) {
          console.error("[v0] Failed to parse stored inputs:", e)
        }
      }
    }

    // Default values if nothing stored
    return defaultInputs
  })
  const [esetiBaseInputs, setEsetiBaseInputs] = useState<{
    regularPayment: number
    frequency: PaymentFrequency
    annualYieldPercent: number
    annualIndexPercent: number
    keepYearlyPayment: boolean
  }>(() => {
    const defaults = {
      regularPayment: 20000,
      frequency: "éves" as PaymentFrequency,
      annualYieldPercent: 12,
      annualIndexPercent: 0,
      keepYearlyPayment: true,
    }
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiBaseInputs")
      if (stored) {
        try {
          return { ...defaults, ...(JSON.parse(stored) as Partial<typeof defaults>) }
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiBaseInputs:", e)
        }
      }
    }
    return defaults
  })

  const [indexByYear, setIndexByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-indexByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored indexByYear:", e)
        }
      }
    }
    return {}
  })

  const [paymentByYear, setPaymentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-paymentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
          // </CHANGE>
        } catch (e) {
          console.error("[v0] Failed to parse stored paymentByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiPaymentByYear, setEsetiPaymentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiPaymentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiPaymentByYear:", e)
        }
      }
    }
    return {}
  })

  const [withdrawalByYear, setWithdrawalByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-withdrawalByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored withdrawalByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiWithdrawalByYear, setEsetiWithdrawalByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiWithdrawalByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiWithdrawalByYear:", e)
        }
      }
    }
    return {}
  })

  const [taxCreditLimitByYear, setTaxCreditLimitByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-taxCreditLimitByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored taxCreditLimitByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiIndexByYear, setEsetiIndexByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiIndexByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored esetiIndexByYear:", e)
        }
      }
    }
    return {}
  })
  const [esetiFrequency, setEsetiFrequency] = useState<PaymentFrequency>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-esetiFrequency")
      if (stored === "havi" || stored === "negyedéves" || stored === "féléves" || stored === "éves") {
        return stored
      }
    }
    return "éves"
  })
  useEffect(() => {
    if (esetiFrequency !== esetiBaseInputs.frequency) {
      setEsetiFrequency(esetiBaseInputs.frequency)
    }
  }, [esetiBaseInputs.frequency, esetiFrequency])

  const [taxCreditAmountByYear, setTaxCreditAmountByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-taxCreditAmountByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored taxCreditAmountByYear:", e)
        }
      }
    }
    return {}
  })
  const [taxCreditNotUntilRetirement, setTaxCreditNotUntilRetirement] = useState(false)

  const [investedShareByYear, setInvestedShareByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-investedShareByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored investedShareByYear:", e)
        }
      }
    }
    return {}
  })

  const [assetCostPercentByYear, setAssetCostPercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-assetCostPercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored assetCostPercentByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>

  const [plusCostByYear, setPlusCostByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-plusCostByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored plusCostByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>

  // Bonuses array (multiple bonuses can be added)
  // Initialize with default value to avoid hydration mismatch
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  
  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("bonuses")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            setBonuses(parsed)
          }
        } catch (e) {
          console.error("[v0] Failed to parse stored bonuses:", e)
        }
      }
    }
  }, [])

  // Save bonuses to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("bonuses", JSON.stringify(bonuses))
    }
  }, [bonuses])

  const addBonus = () => {
    const newBonus: Bonus = {
      id: `bonus-${Date.now()}`,
      valueType: "percent",
      value: 0,
      account: "client",
    }
    setBonuses([...bonuses, newBonus])
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const removeBonus = (id: string) => {
    setBonuses(bonuses.filter((b) => b.id !== id))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updateBonus = (id: string, updates: Partial<Bonus>) => {
    setBonuses(bonuses.map((b) => (b.id === id ? { ...b, ...updates } : b)))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  // Keep bonusPercentByYear for backward compatibility (deprecated, will be removed later)
  const [bonusPercentByYear, setBonusPercentByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-bonusPercentByYear")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored bonusPercentByYear:", e)
        }
      }
    }
    return {}
  })
  // </CHANGE>

  const [isTaxBonusSeparateAccount, setIsTaxBonusSeparateAccount] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isTaxBonusSeparateAccount")
      return stored ? JSON.parse(stored) : false
    }
    return false
  })
  // </CHANGE>

  const [displayCurrency, setDisplayCurrency] = useState<Currency>("HUF")
  const [isDisplayCurrencyUserOverridden, setIsDisplayCurrencyUserOverridden] = useState(false)
  const [eurRateManuallyChanged, setEurRateManuallyChanged] = useState(false)
  const [fxState, setFxState] = useState<FxState>({ rate: 400, date: null, source: "default" })
  const [isLoadingFx, setIsLoadingFx] = useState(false)

  const [enableNetting, setEnableNetting] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-enableNetting")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored enableNetting:", e)
        }
      }
    }
    return false
  })

  // Added isAccountSplitOpen and isRedemptionOpen state variables
  const [isAccountSplitOpen, setIsAccountSplitOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isAccountSplitOpen")
      return stored ? JSON.parse(stored) : false
    }
    return false
  })

  const [isRedemptionOpen, setIsRedemptionOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("isRedemptionOpen")
      return stored ? JSON.parse(stored) : true // Default to open
    }
    return true
  })
  // </CHANGE>

  // Management fees array (multiple fees can be added)
  // Initialize with default value to avoid hydration mismatch
  const [managementFees, setManagementFees] = useState<ManagementFee[]>([
    {
      id: "fee-default",
      frequency: "éves" as ManagementFeeFrequency,
      valueType: "percent" as ManagementFeeValueType,
      value: 0,
      account: "client" as "client" | "invested" | "taxBonus",
    },
  ])

  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("managementFees")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setManagementFees(parsed)
          }
        } catch (e) {
          console.error("[v0] Failed to parse stored managementFees:", e)
        }
      }
    }
  }, [])

  // Save managementFees to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("managementFees", JSON.stringify(managementFees))
    }
  }, [managementFees])

  const addManagementFee = () => {
    const newFee: ManagementFee = {
      id: `fee-${Date.now()}`,
      frequency: "éves",
      valueType: "percent",
      value: 0,
      account: "client",
    }
    setManagementFees([...managementFees, newFee])
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const removeManagementFee = (id: string) => {
    if (managementFees.length > 1) {
      setManagementFees(managementFees.filter((f) => f.id !== id))
      if (appliedPresetLabel) setAppliedPresetLabel(null)
    }
  }

  const updateManagementFee = (id: string, updates: Partial<ManagementFee>) => {
    setManagementFees(managementFees.map((f) => (f.id === id ? { ...f, ...updates } : f)))
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const [redemptionFeeByYear, setRedemptionFeeByYear] = useState<Record<number, number>>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("redemptionFeeByYear")
      return stored ? JSON.parse(stored) : {} // Corrected from JSON.Parse
    }
    return {}
  })

  const [redemptionFeeDefaultPercent, setRedemptionFeeDefaultPercent] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-redemptionFeeDefaultPercent")
      return stored ? JSON.parse(stored) : 0
    }
    return 0
  })
  // </CHANGE>

  // Initialize with default value to avoid hydration mismatch
  const [redemptionBaseMode, setRedemptionBaseMode] = useState<"surplus-only" | "total-account">("surplus-only")
  
  // Load from sessionStorage after hydration
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("redemptionBaseMode")
      if (stored === "surplus-only" || stored === "total-account") {
        setRedemptionBaseMode(stored)
    }
    }
  }, [])
  // </CHANGE>

  const [isCorporateBond, setIsCorporateBond] = useState(false)

  const [enableRealValue, setEnableRealValue] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-enableRealValue")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-enableRealValue", String(enableRealValue))
    }
  }, [enableRealValue])

  const [inflationRate, setInflationRate] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inflationRate")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored inflationRate:", e)
        }
      }
    }
    return 3.0 // Default 3%
  })
  const [inflationAutoEnabled, setInflationAutoEnabled] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-inflationAutoEnabled")
      if (stored) {
        return stored === "true"
      }
    }
    return true
  })
  const [inflationKshYear, setInflationKshYear] = useState<number | null>(null)
  const [inflationKshValue, setInflationKshValue] = useState<number | null>(null)
  const [inflationKshLoading, setInflationKshLoading] = useState(false)
  const [inflationKshError, setInflationKshError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inflationRate", JSON.stringify(inflationRate))
    }
  }, [inflationRate])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inflationAutoEnabled", String(inflationAutoEnabled))
    }
  }, [inflationAutoEnabled])

  useEffect(() => {
    if (!enableRealValue || !inflationAutoEnabled) return
    let cancelled = false

    const loadInflation = async () => {
      setInflationKshLoading(true)
      setInflationKshError(null)
      try {
        const response = await fetch("/api/ksh/inflation")
        if (!response.ok) {
          throw new Error("KSH adat nem elerheto")
        }
        const data = await response.json()
        if (cancelled) return
        if (typeof data?.inflationPercent === "number") {
          setInflationRate(data.inflationPercent)
          setInflationKshYear(typeof data?.year === "number" ? data.year : null)
          setInflationKshValue(data.inflationPercent)
        } else {
          throw new Error("KSH adat nem ertelmezheto")
        }
      } catch (error) {
        if (!cancelled) {
          setInflationKshError("KSH adat nem elerheto")
        }
      } finally {
        if (!cancelled) {
          setInflationKshLoading(false)
        }
      }
    }

    loadInflation()
    return () => {
      cancelled = true
    }
  }, [enableRealValue, inflationAutoEnabled])

  // Collapsible states for cards

  const [isPresetCardOpen, setIsPresetCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isPresetCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isPresetCardOpen", String(isPresetCardOpen))
    }
  }, [isPresetCardOpen])

  const [isCostsCardOpen, setIsCostsCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isCostsCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isCostsCardOpen", String(isCostsCardOpen))
    }
  }, [isCostsCardOpen])

  const [isCustomCostsCardOpen, setIsCustomCostsCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isCustomCostsCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isCustomCostsCardOpen", String(isCustomCostsCardOpen))
    }
  }, [isCustomCostsCardOpen])


  const [isServicesCardOpen, setIsServicesCardOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-isServicesCardOpen")
      return stored === "true"
    }
    return false
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-isServicesCardOpen", String(isServicesCardOpen))
    }
  }, [isServicesCardOpen])
  const [selectedInsurer, setSelectedInsurer] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedInsurer")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored selectedInsurer:", e)
        }
      }
    }
    return null
  })

  const [selectedProduct, setSelectedProduct] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedProduct")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored selectedProduct:", e)
        }
      }
    }
    return null
  })

  const normalizedInsurer = (selectedInsurer ?? "").trim().toLowerCase()
  const isAllianzFundMode =
    normalizedInsurer.includes("allianz") ||
    (selectedProduct !== null &&
      (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram"))

  const fundOptions = isAllianzFundMode
    ? inputs.currency === "HUF"
      ? allianzHufFundOptions
      : inputs.currency === "EUR"
        ? allianzEurFundOptions
        : baseFundOptions
    : baseFundOptions

  useEffect(() => {
    if (annualYieldMode !== "fund") return
    if (fundOptions.length === 0) return
    const currentFund = fundOptions.find((f) => f.id === selectedFundId)
    const nextFund = currentFund ?? fundOptions[0]

    if (!currentFund) {
      setSelectedFundId(nextFund.id)
    }
    setInputs((prev) =>
      prev.annualYieldPercent === nextFund.historicalYield
        ? prev
        : { ...prev, annualYieldPercent: nextFund.historicalYield },
    )
  }, [annualYieldMode, fundOptions, selectedFundId])

  const getAcquisitionCostTitle = () => {
    const baseTitle = "Akvizíciós költség (év szerint)"
    if (appliedPresetLabel && appliedPresetLabel.includes("Alfa Exclusive Plus")) {
      return `${baseTitle} – Szerződéskötési költség`
    }
    return baseTitle
  }

  const [appliedPresetLabel, setAppliedPresetLabel] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<string>("settings")
  const [editingFields, setEditingFields] = useState<Record<string, boolean | undefined>>({})
  const [assetCostInputByYear, setAssetCostInputByYear] = useState<Record<number, string>>({})

  const getAvailableProductsForInsurer = (insurer: string): ProductMetadata[] => {
    switch (insurer) {
      case "Alfa":
        return [
          {
            value: "alfa_exclusive_plus",
            label: "Alfa Exclusive Plus",
            productType: "Nyugdíjbiztosítás / Életbiztosítás",
            mnbCode: "13430 / 13450",
            productCode: "NY-05 / TR-08",
            variants: [
              { productType: "Nyugdíjbiztosítás", mnbCode: "13430", productCode: "NY-05" },
              { productType: "Életbiztosítás", mnbCode: "13450", productCode: "TR-08" },
            ],
          },
          {
            value: "alfa_fortis",
            label: "Alfa Fortis",
            productType: "Életbiztosítás",
            mnbCode: "13470 / 13471 / 13472",
            productCode: "WL-02 / WL-12 / WL-22",
            variants: [
              { label: "Alfa Fortis", productType: "Életbiztosítás", mnbCode: "13470", productCode: "WL-02" },
              { label: "Alfa Fortis EUR", productType: "Életbiztosítás", mnbCode: "13471", productCode: "WL-12" },
              { label: "Alfa Fortis USD", productType: "Életbiztosítás", mnbCode: "13472", productCode: "WL-22" },
            ],
          },
          // </CHANGE>
        ]
      case "Allianz":
        return [
          {
            value: "allianz_eletprogram",
            label: "Allianz Életprogram",
            productType: "Életbiztosítás",
            mnbCode: "12345",
            productCode: "AL-01",
          },
          {
            value: "allianz_bonusz_eletprogram",
            label: "Allianz Bónusz Életprogram",
            productType: "Életbiztosítás",
            mnbCode: "12346",
            productCode: "AL-02",
          },
        ]
      case "CIG Pannonia":
        return []
      case "Generali":
        return []
      case "Grupama":
        return []
      case "KnH":
        return []
      case "Magyar Posta":
        return []
      case "MetLife":
        return []
      case "NN":
        return []
      case "Signal Iduna":
        return []
      case "Union":
        return [
          {
            value: "union_classic",
            label: "Classic",
            productType: "Életbiztosítás",
            mnbCode: "98765",
            productCode: "UN-01",
          },
        ]
      case "Uniqa":
        return []
      default:
        return []
    }
  }

  const getAvailableProducts = () => {
    if (!selectedInsurer) return []
    return getAvailableProductsForInsurer(selectedInsurer)
  }

  const mapSelectedProductToProductId = (productValue: string | null, insurer: string | null): ProductId => {
    if (insurer === "Allianz") {
      if (productValue === "allianz_eletprogram" || productValue === "allianz_bonusz_eletprogram") {
        return "allianz-eletprogram"
      }
    }

    return "dm-pro"
  }

  const setFieldEditing = (field: string, isEditing: boolean) => {
    setEditingFields((prev) => ({ ...prev, [field]: isEditing }))
  }

  const loadFxRate = async (currency: "EUR" | "USD" = "EUR") => {
    setIsLoadingFx(true)
    const rate = await getFxRateWithFallback(currency) // Use getFxRateWithFallback to support both EUR and USD
    setFxState({ rate: rate.rate, date: rate.date, source: rate.source })

    if (currency === "EUR") {
      setInputs((prev) => ({ ...prev, eurToHufRate: rate.rate }))
    } else {
      setInputs((prev) => ({ ...prev, usdToHufRate: rate.rate }))
    }

    setEurRateManuallyChanged(rate.source !== "default")
    setIsLoadingFx(false)
  }

  const applyPreset = () => {
    const products = getAvailableProducts()
    const selected = products.find((p) => p.value === selectedProduct)
    if (selectedInsurer && selectedProduct && selected) {
      setAppliedPresetLabel(`${selectedInsurer} - ${selected.label}`)

      if (selectedProduct === "alfa_exclusive_plus") {
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )

        const investedShareConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            investedShareConfig[year] = 20
          } else if (year === 2) {
            investedShareConfig[year] = 50
          } else {
            investedShareConfig[year] = 80
          }
        }

        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year <= 10) {
            redemptionFeeConfig[year] = 100
          } else {
            redemptionFeeConfig[year] = 15
          }
        }

        const initialCostConfig: Record<number, number> = {}
        if (durationInYears >= 5 && durationInYears <= 10) {
          // 5-10 years: Year 1 = 49%, Year 2 = 0%, Year 3 = 0%
          initialCostConfig[1] = 49
          initialCostConfig[2] = 0
          initialCostConfig[3] = 0
        } else if (durationInYears === 11) {
          // 11 years: Year 1 = 55%, Year 2 = 5%, Year 3 = 0%
          initialCostConfig[1] = 55
          initialCostConfig[2] = 5
          initialCostConfig[3] = 0
        } else if (durationInYears === 12) {
          // 12 years: Year 1 = 55%, Year 2 = 15%, Year 3 = 0%
          initialCostConfig[1] = 55
          initialCostConfig[2] = 15
          initialCostConfig[3] = 0
        } else if (durationInYears === 13) {
          // 13 years: Year 1 = 60%, Year 2 = 25%, Year 3 = 0%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 25
          initialCostConfig[3] = 0
        } else if (durationInYears === 14) {
          // 14 years: Year 1 = 60%, Year 2 = 35%, Year 3 = 0%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 35
          initialCostConfig[3] = 0
        } else if (durationInYears >= 15) {
          // 15+ years: Year 1 = 60%, Year 2 = 40%, Year 3 = 10%
          initialCostConfig[1] = 60
          initialCostConfig[2] = 40
          initialCostConfig[3] = 10
        }

        // Client account: 0% for years 1-3, 0.145% from year 4 onwards
        // Invested and taxBonus accounts: 0.145% from year 1
        // Since the current system uses a single assetCostPercentByYear (not per-account),
        // we set a default that applies globally. Per-account logic would require
        // extending the calculation system which is beyond preset configuration.
        const assetCostConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          // Setting 0.145% for all years as a baseline
          // Note: true per-account fees (client 0% for years 1-3) requires calculation logic changes
          assetCostConfig[year] = 0.145
        }
        // </CHANGE>

        // Apply preset values
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // This field is now replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // This field is now replaced by managementFeeValue
          assetBasedFeePercent: 0.145, // Set default asset fee to 0.145%
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))

        setInvestedShareByYear(investedShareConfig)
        setAssetCostPercentByYear(assetCostConfig)
        // </CHANGE>

        setIsTaxBonusSeparateAccount(true)
        // </CHANGE>

        // Open both collapsible sections
        setIsAccountSplitOpen(true)
        setIsRedemptionOpen(true)

        // Set redemption configuration
        setRedemptionBaseMode("surplus-only")
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(15) // Default for years beyond term
      } else if (selectedProduct === "allianz_eletprogram") {
        const fixedCost = inputs.currency === "HUF" ? 11880 : 39.6
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: { 1: 33 },
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "amount", // Reset to default
          managementFeeValue: fixedCost, // Set the fixed cost
          assetBasedFeePercent: 1.19,
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for this preset
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      } else if (selectedProduct === "allianz_bonusz_eletprogram") {
        const fixedCost = inputs.currency === "HUF" ? 11880 : 39.6
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: { 1: 79 },
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "amount", // Reset to default
          managementFeeValue: fixedCost, // Set the fixed cost
          assetBasedFeePercent: 1.19,
          bonusMode: "refundInitialCostIncreasing", // Changed from "upfront" to "refundInitialCostIncreasing"
          bonusPercent: 0, // Bonus percent is not directly used in this model, it's implicitly handled by the cost refund logic
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for this preset
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      } else if (selectedProduct === "alfa_fortis") {
        const durationInYears = Math.ceil(
          durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
        )

        // Acquisition cost schedule (szerződéskötési költség):
        // Year 1: 75%, Year 2: 42%, Year 3: 15%, Year 4+: 0%
        const initialCostConfig: Record<number, number> = {
          1: 75,
          2: 42,
          3: 15,
        }

        // Redemption/Surrender fee schedule (visszavásárlási költség):
        // Year 1: 3.50%, Years 2-8: 1.95%, Years 9-15: 1.50%, Year 16+: 0.00%
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            redemptionFeeConfig[year] = 3.5
          } else if (year >= 2 && year <= 8) {
            redemptionFeeConfig[year] = 1.95
          } else if (year >= 9 && year <= 15) {
            redemptionFeeConfig[year] = 1.5
          } else {
            redemptionFeeConfig[year] = 0
          }
        }

        setInputs((prev) => ({
          ...prev,
          initialCostByYear: initialCostConfig,
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "percent", // Reset to default
          managementFeeValue: 0, // Reset to default
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))

        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        setIsAccountSplitOpen(false)
        setIsRedemptionOpen(true)
        // </CHANGE>
      } else {
        // Default placeholder for other products
        setInputs((prev) => ({
          ...prev,
          initialCostByYear: {},
          initialCostDefaultPercent: 0,
          yearlyManagementFeePercent: 0, // Replaced by managementFeeValue
          yearlyFixedManagementFeeAmount: 0, // Replaced by managementFeeValue
          managementFeeFrequency: "éves", // Reset to default
          managementFeeValueType: "percent", // Reset to default
          managementFeeValue: 0, // Reset to default
          assetBasedFeePercent: 0,
          bonusMode: "none",
          bonusPercent: 0,
          bonusStartYear: 1,
          bonusStopYear: 0,
        }))
        // Reset specific per-year configurations for default
        setInvestedShareByYear({})
        setAssetCostPercentByYear({})
        setRedemptionFeeByYear({})
        setRedemptionFeeDefaultPercent(0)
        setRedemptionBaseMode("surplus-only")
        setIsTaxBonusSeparateAccount(false)
        // </CHANGE>
      }
    }
  }

  useEffect(() => {
    // Only auto-apply the preset when product changes
    if (isHydratingRef.current || !selectedProduct || !selectedInsurer) {
      return
    }

    // Auto-apply the preset when product changes
    applyPreset()
  }, [selectedProduct, selectedInsurer])

  useEffect(() => {
    // Only auto-update if Alfa Exclusive Plus or Alfa Fortis is the applied preset
    if (
      appliedPresetLabel &&
      (appliedPresetLabel.includes("Alfa Exclusive Plus") || appliedPresetLabel.includes("Alfa Fortis"))
    ) {
      const durationInYears = Math.ceil(
        durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 / 12 : 365 / 12),
      )

      // Rebuild initial cost configuration based on new duration
      const initialCostConfig: Record<number, number> = {}
      if (appliedPresetLabel.includes("Alfa Exclusive Plus")) {
        if (durationInYears >= 5 && durationInYears <= 10) {
          initialCostConfig[1] = 49
          initialCostConfig[2] = 0
          initialCostConfig[3] = 0
        } else if (durationInYears === 11) {
          initialCostConfig[1] = 55
          initialCostConfig[2] = 5
          initialCostConfig[3] = 0
        } else if (durationInYears === 12) {
          initialCostConfig[1] = 55
          initialCostConfig[2] = 15
          initialCostConfig[3] = 0
        } else if (durationInYears === 13) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 25
          initialCostConfig[3] = 0
        } else if (durationInYears === 14) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 35
          initialCostConfig[3] = 0
        } else if (durationInYears >= 15) {
          initialCostConfig[1] = 60
          initialCostConfig[2] = 40
          initialCostConfig[3] = 10
        }
      } else if (appliedPresetLabel.includes("Alfa Fortis")) {
        // Alfa Fortis initial cost schedule
        initialCostConfig[1] = 75
        initialCostConfig[2] = 42
        initialCostConfig[3] = 15
      }

      // Update initial costs without clearing the preset label
      setInputs((prev) => ({
        ...prev,
        initialCostByYear: initialCostConfig,
        initialCostDefaultPercent: 0,
      }))

      // Also rebuild invested share and redemption configs if relevant
      if (appliedPresetLabel.includes("Alfa Exclusive Plus")) {
        const investedShareConfig: Record<number, number> = {}
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            investedShareConfig[year] = 20
          } else if (year === 2) {
            investedShareConfig[year] = 50
          } else {
            investedShareConfig[year] = 80
          }

          if (year <= 10) {
            redemptionFeeConfig[year] = 100
          } else {
            redemptionFeeConfig[year] = 15
          }
        }
        setInvestedShareByYear(investedShareConfig)
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(15)
      } else if (appliedPresetLabel.includes("Alfa Fortis")) {
        // Alfa Fortis redemption fee schedule
        const redemptionFeeConfig: Record<number, number> = {}
        for (let year = 1; year <= durationInYears; year++) {
          if (year === 1) {
            redemptionFeeConfig[year] = 3.5
          } else if (year >= 2 && year <= 8) {
            redemptionFeeConfig[year] = 1.95
          } else if (year >= 9 && year <= 15) {
            redemptionFeeConfig[year] = 1.5
          } else {
            redemptionFeeConfig[year] = 0
          }
        }
        setInvestedShareByYear({}) // Reset invested share for Fortis
        setRedemptionFeeByYear(redemptionFeeConfig)
        setRedemptionFeeDefaultPercent(0) // Reset default redemption fee for Fortis
      }
    }
  }, [durationValue, durationUnit, appliedPresetLabel])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationUnit", JSON.stringify(durationUnit))
    }
  }, [durationUnit])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-durationValue", JSON.stringify(durationValue))
    }
  }, [durationValue])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiDurationUnit", JSON.stringify(esetiDurationUnit))
    }
  }, [esetiDurationUnit])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiDurationValue", JSON.stringify(esetiDurationValue))
    }
  }, [esetiDurationValue])

  // Persist inputs to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-inputs", JSON.stringify(inputs))
    }
  }, [inputs])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiBaseInputs", JSON.stringify(esetiBaseInputs))
    }
  }, [esetiBaseInputs])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-indexByYear", JSON.stringify(indexByYear))
    }
  }, [indexByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-paymentByYear", JSON.stringify(paymentByYear))
    }
  }, [paymentByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-withdrawalByYear", JSON.stringify(withdrawalByYear))
    }
  }, [withdrawalByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiWithdrawalByYear", JSON.stringify(esetiWithdrawalByYear))
    }
  }, [esetiWithdrawalByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-taxCreditAmountByYear", JSON.stringify(taxCreditAmountByYear))
    }
  }, [taxCreditAmountByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-taxCreditLimitByYear", JSON.stringify(taxCreditLimitByYear))
    }
  }, [taxCreditLimitByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiIndexByYear", JSON.stringify(esetiIndexByYear))
    }
  }, [esetiIndexByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiPaymentByYear", JSON.stringify(esetiPaymentByYear))
    }
  }, [esetiPaymentByYear])
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-esetiFrequency", esetiFrequency)
    }
  }, [esetiFrequency])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-investedShareByYear", JSON.stringify(investedShareByYear))
    }
  }, [investedShareByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-assetCostPercentByYear", JSON.stringify(assetCostPercentByYear))
    }
  }, [assetCostPercentByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-redemptionFeeByYear", JSON.stringify(redemptionFeeByYear))
    }
  }, [redemptionFeeByYear])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isTaxBonusSeparateAccount", JSON.stringify(isTaxBonusSeparateAccount))
    }
  }, [isTaxBonusSeparateAccount])
  // </CHANGE>

  // Persist isAccountSplitOpen and isRedemptionOpen
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isAccountSplitOpen", JSON.stringify(isAccountSplitOpen))
    }
  }, [isAccountSplitOpen])
  // </CHANGE>

  // Persist redemptionFeeByYear
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redemptionFeeByYear", JSON.stringify(redemptionFeeByYear))
    }
  }, [redemptionFeeByYear])

  // Persist redemptionFeeDefaultPercent
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-redemptionFeeDefaultPercent", JSON.stringify(redemptionFeeDefaultPercent))
    }
  }, [redemptionFeeDefaultPercent])
  // </CHANGE>

  // Persist isRedemptionOpen
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("isRedemptionOpen", JSON.stringify(isRedemptionOpen))
    }
  }, [isRedemptionOpen])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-selectedInsurer", JSON.stringify(selectedInsurer))
    }
  }, [selectedInsurer])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-selectedProduct", JSON.stringify(selectedProduct))
    }
  }, [selectedProduct])

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-enableNetting", JSON.stringify(enableNetting))
    }
  }, [enableNetting])

  // Persist redemptionBaseMode
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("redemptionBaseMode", redemptionBaseMode)
    }
  }, [redemptionBaseMode])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-plusCostByYear", JSON.stringify(plusCostByYear))
    }
  }, [plusCostByYear])
  // </CHANGE>

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("calculator-bonusPercentByYear", JSON.stringify(bonusPercentByYear))
    }
  }, [bonusPercentByYear])
  // </CHANGE>

  useEffect(() => {
    if (inputs.calculationMode === "simple" && durationUnit !== "year") {
      setDurationUnit("year")
    }
  }, [inputs.calculationMode, durationUnit])

  const toYearsFromDuration = (unit: DurationUnit, value: number) => {
    const totalDays = unit === "year" ? value * 365 : unit === "month" ? Math.round(value * (365 / 12)) : value
    return Math.max(1, Math.ceil(totalDays / 365))
  }

  const totalYearsForPlan = useMemo(() => toYearsFromDuration(durationUnit, durationValue), [durationUnit, durationValue])
  const esetiDurationMaxByUnit = useMemo(() => {
    return {
      year: totalYearsForPlan,
      month: totalYearsForPlan * 12,
      day: totalYearsForPlan * 365,
    } as const
  }, [totalYearsForPlan])
  useEffect(() => {
    const maxForUnit = esetiDurationMaxByUnit[esetiDurationUnit]
    if (esetiDurationValue > maxForUnit) {
      setEsetiDurationValue(maxForUnit)
    }
  }, [esetiDurationValue, esetiDurationUnit, esetiDurationMaxByUnit])
  const esetiTotalYearsForPlan = useMemo(() => {
    const cappedValue = Math.min(esetiDurationValue, esetiDurationMaxByUnit[esetiDurationUnit])
    return toYearsFromDuration(esetiDurationUnit, cappedValue)
  }, [esetiDurationUnit, esetiDurationValue, esetiDurationMaxByUnit])

  const { planIndex, planPayment, yearlyBasePaymentYear1 } = useMemo(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const baseYear1Payment = inputs.keepYearlyPayment
      ? inputs.regularPayment * 12
      : inputs.regularPayment * periodsPerYear

    const planIdx: Record<number, number> = {}
    const planPay: Record<number, number> = {}

    for (let y = 1; y <= totalYearsForPlan; y++) {
      planIdx[y] = indexByYear[y] ?? inputs.annualIndexPercent
    }

    planPay[1] = paymentByYear[1] ?? baseYear1Payment

    // TODO: Replace with real chaining calculation when implementing business logic
    // For UI-only: use base payment for all years (no chaining calculation)
    for (let y = 2; y <= totalYearsForPlan; y++) {
      planPay[y] = paymentByYear[y] ?? baseYear1Payment // Use base payment, no chaining
    }

    return { planIndex: planIdx, planPayment: planPay, yearlyBasePaymentYear1: baseYear1Payment }
  }, [
    inputs.regularPayment,
    inputs.frequency,
    inputs.keepYearlyPayment,
    totalYearsForPlan,
    inputs.annualIndexPercent,
    indexByYear,
    paymentByYear,
  ])

  const plan = useMemo(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const baseYear1Payment = inputs.keepYearlyPayment
      ? inputs.regularPayment * 12
      : inputs.regularPayment * periodsPerYear

    return buildYearlyPlan({
      years: totalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: inputs.annualIndexPercent,
      indexByYear,
      paymentByYear,
      withdrawalByYear,
    })
  }, [
    totalYearsForPlan,
    inputs.regularPayment,
    inputs.frequency,
    inputs.keepYearlyPayment,
    inputs.annualIndexPercent,
    indexByYear,
    paymentByYear,
    withdrawalByYear,
  ])

  const esetiPlan = useMemo(() => {
    const periodsPerYear =
      esetiBaseInputs.frequency === "havi"
        ? 12
        : esetiBaseInputs.frequency === "negyedéves"
          ? 4
          : esetiBaseInputs.frequency === "féléves"
            ? 2
            : 1
    const baseYear1Payment = esetiBaseInputs.keepYearlyPayment
      ? esetiBaseInputs.regularPayment * 12
      : esetiBaseInputs.regularPayment * periodsPerYear
    return buildYearlyPlan({
      years: esetiTotalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: esetiBaseInputs.annualIndexPercent,
      indexByYear: esetiIndexByYear,
      paymentByYear: esetiPaymentByYear,
      withdrawalByYear: esetiWithdrawalByYear,
    })
  }, [esetiBaseInputs, esetiTotalYearsForPlan, esetiIndexByYear, esetiPaymentByYear, esetiWithdrawalByYear])
  const esetiPlanIndex = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlan.indexEffective[y] ?? 0
    }
    return map
  }, [esetiPlan, esetiTotalYearsForPlan])
  const esetiPlanPayment = useMemo(() => {
    const map: Record<number, number> = {}
    for (let y = 1; y <= esetiTotalYearsForPlan; y++) {
      map[y] = esetiPlan.yearlyPaymentsPlan[y] ?? 0
    }
    return map
  }, [esetiPlan, esetiTotalYearsForPlan])

  // Risk Insurance Cost Calculation
  const [enableRiskInsurance, setEnableRiskInsurance] = useState(false)
  const [riskInsuranceType, setRiskInsuranceType] = useState<string>("")
  const [riskInsuranceFeePercentOfMonthlyPayment, setRiskInsuranceFeePercentOfMonthlyPayment] = useState(0)
  const [riskInsuranceMonthlyFeeAmount, setRiskInsuranceMonthlyFeeAmount] = useState(0)
  const [riskInsuranceStartYear, setRiskInsuranceStartYear] = useState(1)
  const [riskInsuranceEndYear, setRiskInsuranceEndYear] = useState<number | undefined>(undefined)
  const [riskInsuranceAnnualIndexPercent, setRiskInsuranceAnnualIndexPercent] = useState(0)

  const dailyInputs = useMemo<InputsDaily>(() => {
    const taxCreditLimits = Object.entries(taxCreditLimitByYear).reduce(
      (acc, [year, limit]) => {
        acc[Number(year)] = limit
        return acc
      },
      {} as Record<number, number>,
    )

    const exchangeRate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate

    return {
      currency: inputs.currency,
      durationUnit,
      durationValue,
      annualYieldPercent: inputs.annualYieldPercent,
      frequency: inputs.frequency,
      yearsPlanned: totalYearsForPlan,
      yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
      initialCostByYear: inputs.initialCostByYear,
      initialCostDefaultPercent: inputs.initialCostDefaultPercent,
      yearlyManagementFeePercent: inputs.yearlyManagementFeePercent, // This is now replaced by managementFeeValue
      yearlyFixedManagementFeeAmount: inputs.yearlyFixedManagementFeeAmount, // This is now replaced by managementFeeValue
      managementFeeStartYear: inputs.managementFeeStartYear,
      managementFeeStopYear: inputs.managementFeeStopYear || undefined,
      assetBasedFeePercent: inputs.assetBasedFeePercent,
      assetCostPercentByYear: assetCostPercentByYear,
      plusCostByYear: plusCostByYear,
      // </CHANGE>
      managementFeeFrequency: inputs.managementFeeFrequency, // Added managementFeeFrequency
      managementFeeValueType: inputs.managementFeeValueType, // Added managementFeeValueType
      managementFeeValue: inputs.managementFeeValue, // Added managementFeeValue
      // </CHANGE>
      bonusPercentByYear: bonusPercentByYear, // Added bonusPercentByYear to daily inputs
      // </CHANGE>
      bonusMode: inputs.bonusMode,
      bonusOnContributionPercent: inputs.bonusOnContributionPercent,
      bonusFromYear: inputs.bonusFromYear,
      enableTaxCredit: inputs.enableTaxCredit,
      taxCreditRatePercent: inputs.taxCreditRatePercent,
      taxCreditCapPerYear: inputs.taxCreditCapPerYear,
      taxCreditStartYear: inputs.taxCreditStartYear,
      taxCreditEndYear: inputs.taxCreditEndYear,
      stopTaxCreditAfterFirstWithdrawal: inputs.stopTaxCreditAfterFirstWithdrawal,
      taxCreditLimitByYear: taxCreditLimits,
      taxCreditAmountByYear: taxCreditAmountByYear,
      taxCreditYieldPercent: inputs.taxCreditYieldPercent,
      productVariant: selectedProduct ?? undefined,
      calculationMode: inputs.calculationMode,
      startDate: inputs.startDate,
      bonusPercent: inputs.bonusPercent,
      bonusStartYear: inputs.bonusStartYear,
      bonusStopYear: inputs.bonusStopYear,
      investedShareByYear,
      investedShareDefaultPercent: inputs.investedShareDefaultPercent,
      // Pass isAccountSplitOpen to calculation
      isAccountSplitOpen: isAccountSplitOpen,
      // </CHANGE>
      redemptionFeeByYear: redemptionFeeByYear,
      redemptionFeeDefaultPercent: redemptionFeeDefaultPercent,
      redemptionBaseMode: redemptionBaseMode, // Pass redemption base mode to calculation
      redemptionEnabled: isRedemptionOpen,
      isTaxBonusSeparateAccount,
      // </CHANGE>
      eurToHufRate: exchangeRate, // Pass the correct rate based on currency
      riskInsuranceEnabled: enableRiskInsurance,
      riskInsuranceMonthlyFeeAmount: riskInsuranceMonthlyFeeAmount,
      riskInsuranceFeePercentOfMonthlyPayment: riskInsuranceFeePercentOfMonthlyPayment,
      riskInsuranceAnnualIndexPercent: riskInsuranceAnnualIndexPercent,
      riskInsuranceStartYear: riskInsuranceStartYear,
      riskInsuranceEndYear: riskInsuranceEndYear,
    }
  }, [
    inputs.currency,
    inputs.frequency,
    inputs.regularPayment,
    inputs.keepYearlyPayment,
    inputs.annualYieldPercent,
    inputs.annualIndexPercent,
    inputs.upfrontCostPercent,
    inputs.yearlyManagementFeePercent, // This is now replaced by managementFeeValue
    inputs.yearlyFixedManagementFeeAmount, // This is now replaced by managementFeeValue
    inputs.managementFeeStartYear,
    inputs.managementFeeStopYear,
    inputs.assetBasedFeePercent,
    inputs.bonusMode,
    inputs.bonusOnContributionPercent,
    inputs.bonusFromYear,
    inputs.enableTaxCredit,
    inputs.taxCreditRatePercent,
    inputs.taxCreditCapPerYear,
    inputs.taxCreditStartYear,
    inputs.taxCreditEndYear,
    inputs.stopTaxCreditAfterFirstWithdrawal,
    inputs.calculationMode,
    inputs.startDate,
    inputs.bonusPercent,
    inputs.bonusStartYear,
    inputs.bonusStopYear,
    inputs.eurToHufRate, // Added dependency
    inputs.usdToHufRate, // Added dependency
    durationUnit,
    durationValue,
    totalYearsForPlan,
    plan.yearlyPaymentsPlan,
    plan.yearlyWithdrawalsPlan,
    indexByYear,
    paymentByYear,
    withdrawalByYear,
    taxCreditLimitByYear,
    // Added dependencies for new fields
    inputs.initialCostByYear,
    inputs.initialCostDefaultPercent,
    investedShareByYear,
    withdrawalByYear,
    inputs.investedShareDefaultPercent,
    isAccountSplitOpen, // Added dependency
    redemptionFeeByYear,
    redemptionFeeDefaultPercent,
    redemptionBaseMode, // Added to dependency array
    isRedemptionOpen, // Added to dependency array
    assetCostPercentByYear,
    plusCostByYear, // Added dependency
    bonusPercentByYear, // Added bonusPercentByYear dependency
    // Added dependencies for new management fee fields
    inputs.managementFeeFrequency,
    inputs.managementFeeValueType,
    inputs.managementFeeValue,
    // </CHANGE>
    isTaxBonusSeparateAccount, // Added dependency
    // </CHANGE>
    enableRiskInsurance,
    riskInsuranceFeePercentOfMonthlyPayment,
    riskInsuranceMonthlyFeeAmount,
    riskInsuranceAnnualIndexPercent,
    riskInsuranceStartYear,
    riskInsuranceEndYear,
    // Removed: surplusToExtraFeeDefaultPercent
  ])
  const productId = useMemo(
    () => mapSelectedProductToProductId(selectedProduct, selectedInsurer),
    [selectedProduct, selectedInsurer],
  )

  const results = useMemo(() => calculate(productId, dailyInputs), [productId, dailyInputs])
  const mainTaxCreditByYear = useMemo(() => {
    const map: Record<number, number> = {}
    for (const row of results.yearlyBreakdown ?? []) {
      if (!row) continue
      map[row.year] = row.taxCreditForYear ?? 0
    }
    return map
  }, [results.yearlyBreakdown])
  const esetiTaxCreditLimitsByYear = useMemo(() => {
    const map: Record<number, number> = {}
    const defaultCap = inputs.taxCreditCapPerYear ?? 0
    for (let year = 1; year <= totalYearsForPlan; year++) {
      const yearCap = taxCreditLimitByYear[year] ?? defaultCap
      const mainUsed = mainTaxCreditByYear[year] ?? 0
      map[year] = Math.max(0, yearCap - mainUsed)
    }
    return map
  }, [inputs.taxCreditCapPerYear, totalYearsForPlan, taxCreditLimitByYear, mainTaxCreditByYear])
  const dailyInputsEseti = useMemo<InputsDaily>(
    () => ({
      ...dailyInputs,
      disableProductDefaults: true,
      durationUnit: esetiDurationUnit,
      durationValue: Math.min(esetiDurationValue, esetiDurationMaxByUnit[esetiDurationUnit]),
      annualYieldPercent: esetiBaseInputs.annualYieldPercent,
      frequency: esetiFrequency,
      yearlyPaymentsPlan: esetiPlan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: esetiPlan.yearlyWithdrawalsPlan,
      taxCreditLimitByYear: esetiTaxCreditLimitsByYear,
      annualIndexPercent: esetiBaseInputs.annualIndexPercent,
      initialCostByYear: {},
      initialCostDefaultPercent: 0,
      yearlyManagementFeePercent: 0,
      yearlyFixedManagementFeeAmount: 0,
      managementFeeValue: 0,
      assetBasedFeePercent: 0,
      assetCostPercentByYear: {},
      plusCostByYear: {},
      bonusMode: "none",
      bonusOnContributionPercent: 0,
      bonusFromYear: 1,
      bonusPercent: 0,
      bonusStartYear: 1,
      bonusStopYear: 0,
      bonusPercentByYear: {},
      adminFeeMonthlyAmount: 0,
      riskInsuranceEnabled: false,
      riskInsuranceMonthlyFeeAmount: 0,
      riskInsuranceFeePercentOfMonthlyPayment: 0,
      riskInsuranceAnnualIndexPercent: 0,
    }),
    [
      dailyInputs,
      esetiDurationUnit,
      esetiDurationValue,
      esetiDurationMaxByUnit,
      esetiBaseInputs,
      esetiPlan,
      esetiFrequency,
      esetiTaxCreditLimitsByYear,
    ],
  )
  const resultsEseti = useMemo(() => calculate(productId, dailyInputsEseti), [productId, dailyInputsEseti])
  const dailyInputsWithoutTaxCredit = useMemo(
    () => ({
      ...dailyInputs,
      enableTaxCredit: false,
      taxCreditRatePercent: 0,
      taxCreditCapPerYear: 0,
      taxCreditStartYear: 1,
      taxCreditEndYear: 0,
      taxCreditLimitByYear: {},
      taxCreditAmountByYear: {},
      taxCreditYieldPercent: 0,
    }),
    [dailyInputs],
  )
  const resultsWithoutTaxCredit = useMemo(
    () => calculate(productId, dailyInputsWithoutTaxCredit),
    [productId, dailyInputsWithoutTaxCredit],
  )
  const totalRiskInsuranceCost = results.totalRiskInsuranceCost ?? 0

  // TODO: Replace with real net calculation logic
  // Static placeholder net values - NO calculations, just placeholder data for UI display
  const cumulativeByYear = useMemo(
    () => buildCumulativeByYear(results?.yearlyBreakdown ?? []),
    [results?.yearlyBreakdown],
  )
  const cumulativeByYearEseti = useMemo(
    () => buildCumulativeByYear(resultsEseti?.yearlyBreakdown ?? []),
    [resultsEseti?.yearlyBreakdown],
  )
  const summaryYearlyBreakdown = useMemo(() => {
    const mainByYear = new Map((results?.yearlyBreakdown ?? []).map((row: any) => [row.year, row]))
    const esetiByYear = new Map((resultsEseti?.yearlyBreakdown ?? []).map((row: any) => [row.year, row]))
    const years = Array.from(new Set([...mainByYear.keys(), ...esetiByYear.keys()])).sort((a, b) => a - b)
    return years.map((year) => mergeYearRows(mainByYear.get(year), esetiByYear.get(year)))
  }, [results?.yearlyBreakdown, resultsEseti?.yearlyBreakdown])
  const cumulativeByYearSummary = useMemo(
    () => buildCumulativeByYear(summaryYearlyBreakdown),
    [summaryYearlyBreakdown],
  )
  const netCalculationsMain = useMemo(() => {
    return calculateNetValuesMain(results.yearlyBreakdown, isCorporateBond)
  }, [results.yearlyBreakdown, isCorporateBond])
  const netCalculationsEseti = useMemo(() => {
    return calculateNetValuesEseti(resultsEseti.yearlyBreakdown, isCorporateBond)
  }, [resultsEseti.yearlyBreakdown, isCorporateBond])
  const netCalculationsSummary = useMemo(() => {
    return combineNetRows(netCalculationsMain, netCalculationsEseti)
  }, [netCalculationsMain, netCalculationsEseti])
  const yearlyNetCalculations = useMemo(() => {
    if (yearlyAccountView === "eseti") return netCalculationsEseti
    if (yearlyAccountView === "summary") return netCalculationsSummary
    return netCalculationsMain
  }, [yearlyAccountView, netCalculationsEseti, netCalculationsSummary, netCalculationsMain])

  const finalNetData = useMemo(() => {
    if (yearlyNetCalculations.length === 0) return null
    return yearlyNetCalculations[yearlyNetCalculations.length - 1]
  }, [yearlyNetCalculations])

  const formatValue = (value: number, displayCurr: Currency) => {
    // When displaying in USD, use usdToHufRate; when displaying in EUR, use eurToHufRate
    const rate = displayCurr === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const converted = convertForDisplay(value, results.currency, displayCurr, rate)
    return formatMoney(converted, displayCurr)
  }

  const formatCurrency = (value: number) => {
    const rate = displayCurrency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const converted = convertForDisplay(value, results.currency, displayCurrency, rate)
    return formatMoney(converted, displayCurrency)
  }

  const getRealValue = (value: number) => {
    if (!enableRealValue) return value
    const inflationMultiplier = Math.pow(1 + inflationRate / 100, totalYearsForPlan)
    if (!isFinite(inflationMultiplier) || inflationMultiplier <= 0) return value
    return value / inflationMultiplier
  }

  const getRealValueForYear = (value: number, year: number) => {
    if (!enableRealValue) return value
    const inflationMultiplier = Math.pow(1 + inflationRate / 100, year)
    if (!isFinite(inflationMultiplier) || inflationMultiplier <= 0) return value
    return value / inflationMultiplier
  }

  const shouldApplyTaxCreditPenalty = taxCreditNotUntilRetirement && inputs.enableTaxCredit
  const taxCreditPenaltyAmount = shouldApplyTaxCreditPenalty ? results.totalTaxCredit * 1.2 : 0
  const endBalanceWithTaxCreditPenalty = Math.max(0, results.endBalance - taxCreditPenaltyAmount)
  const endBalanceWithoutTaxCredit = resultsWithoutTaxCredit.endBalance
  const summaryTotalsByAccount = useMemo(
    () => ({
      main: {
        totalContributions: results.totalContributions,
        totalCosts: results.totalCosts,
        totalBonus: results.totalBonus,
        totalTaxCredit: results.totalTaxCredit,
        totalInterestNet: results.totalInterestNet,
        endBalance: results.endBalance,
        totalRiskInsuranceCost: results.totalRiskInsuranceCost ?? 0,
      },
      eseti: {
        totalContributions: resultsEseti.totalContributions,
        totalCosts: resultsEseti.totalCosts,
        totalBonus: resultsEseti.totalBonus,
        totalTaxCredit: resultsEseti.totalTaxCredit,
        totalInterestNet: resultsEseti.totalInterestNet,
        endBalance: resultsEseti.endBalance,
        totalRiskInsuranceCost: resultsEseti.totalRiskInsuranceCost ?? 0,
      },
      summary: {
        totalContributions: results.totalContributions + resultsEseti.totalContributions,
        totalCosts: results.totalCosts + resultsEseti.totalCosts,
        totalBonus: results.totalBonus + resultsEseti.totalBonus,
        totalTaxCredit: results.totalTaxCredit + resultsEseti.totalTaxCredit,
        totalInterestNet: results.totalInterestNet + resultsEseti.totalInterestNet,
        endBalance: results.endBalance + resultsEseti.endBalance,
        totalRiskInsuranceCost: (results.totalRiskInsuranceCost ?? 0) + (resultsEseti.totalRiskInsuranceCost ?? 0),
      },
    }),
    [results, resultsEseti],
  )
  const summaryAccountLabels: Record<"summary" | "main" | "eseti", string> = {
    summary: "Összesített",
    main: "Fő",
    eseti: "Eseti",
  }
  const summaryThemeByAccount: Record<
    "summary" | "main" | "eseti",
    { card: string; metric: string; final: string }
  > = {
    summary: {
      card: "border-sky-300 bg-sky-50/70 dark:border-sky-700 dark:bg-sky-950/25",
      metric: "bg-sky-50/65 dark:bg-sky-900/20",
      final: "bg-sky-700 text-sky-50 dark:bg-sky-800",
    },
    main: {
      card: "border-blue-300 bg-blue-50/65 dark:border-blue-700 dark:bg-blue-950/25",
      metric: "bg-blue-50/60 dark:bg-blue-900/20",
      final: "bg-primary text-primary-foreground",
    },
    eseti: {
      card: "border-orange-300 bg-orange-50/70 dark:border-orange-700 dark:bg-orange-950/25",
      metric: "bg-orange-50/60 dark:bg-orange-900/20",
      final: "bg-orange-700 text-orange-50 dark:bg-orange-800",
    },
  }
  const summaryAccountsOrder: Array<"summary" | "main" | "eseti"> = ["summary", "main", "eseti"]
  const activeSummaryTotals = summaryTotalsByAccount[yearlyAccountView]
  const activeSummaryTheme = summaryThemeByAccount[yearlyAccountView]
  const activeTaxCreditPenaltyAmount = shouldApplyTaxCreditPenalty ? activeSummaryTotals.totalTaxCredit * 1.2 : 0
  const summaryBaseBalance = enableNetting && finalNetData ? finalNetData.netBalance : activeSummaryTotals.endBalance
  const summaryBalanceWithPenalty = Math.max(0, summaryBaseBalance - activeTaxCreditPenaltyAmount)

  const handleDisplayCurrencyChange = (value: Currency) => {
    setDisplayCurrency(value)
    setIsDisplayCurrencyUserOverridden(true)
  }

  const convertBetweenCurrencies = (amount: number, from: Currency, to: Currency) => {
    if (from === to) return amount
    const eurRate = inputs.eurToHufRate || 400
    const usdRate = inputs.usdToHufRate || 380

    if (from === "HUF" && to === "EUR") return amount / eurRate
    if (from === "EUR" && to === "HUF") return amount * eurRate
    if (from === "HUF" && to === "USD") return amount / usdRate
    if (from === "USD" && to === "HUF") return amount * usdRate
    if (from === "EUR" && to === "USD") return (amount * eurRate) / usdRate
    if (from === "USD" && to === "EUR") return (amount * usdRate) / eurRate

    return amount
  }

  const handleCurrencyChange = (value: Currency) => {
    const previousCurrency = inputs.currency
    const convertedRegularPayment = convertBetweenCurrencies(inputs.regularPayment, previousCurrency, value)
    const convertedPaymentByYear = Object.fromEntries(
      Object.entries(paymentByYear).map(([year, amount]) => [
        year,
        convertBetweenCurrencies(amount as number, previousCurrency, value),
      ]),
    )

    setInputs({ ...inputs, currency: value, regularPayment: convertedRegularPayment })
    setPaymentByYear(convertedPaymentByYear)
    setDisplayCurrency(value)
    setIsDisplayCurrencyUserOverridden(false)
    setEurRateManuallyChanged(false) // Reset manual change flag when currency changes
    // Reset FX rate if currency changes and it wasn't manually set
    if (!eurRateManuallyChanged) {
      loadFxRate(value as "EUR" | "USD") // Reload FX rate for the new currency
    }
  }

  const handlePaymentChange = (year: number, value: number) => {
    // TODO: Replace with real chaining calculation when implementing business logic
    // For UI-only: always use base payment as chained value (no calculation)
    const chainedValue = yearlyBasePaymentYear1

    if (Math.abs(value - chainedValue) < 0.01) {
      const newMap = { ...paymentByYear }
      delete newMap[year]
      setPaymentByYear(newMap)
    } else {
      setPaymentByYear({ ...paymentByYear, [year]: value })
    }
  }

  const updateIndex = (year: number, value: number) => {
    setIndexByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        if (value === inputs.annualIndexPercent) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
  }

  const updatePayment = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    handlePaymentChange(year, calcValue)
  }

  const updateWithdrawal = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)

    if (calcValue === 0) {
      const newMap = { ...withdrawalByYear }
      delete newMap[year]
      setWithdrawalByYear(newMap)
    } else {
      setWithdrawalByYear({ ...withdrawalByYear, [year]: calcValue })
    }
  }

  const updateEsetiIndex = (year: number, value: number) => {
    setEsetiIndexByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        if (value === 0) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
  }

  const updateEsetiPayment = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    setEsetiPaymentByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= esetiTotalYearsForPlan; y++) {
        updated[y] = calcValue
      }
      return updated
    })
  }

  const updateEsetiWithdrawal = (year: number, displayValue: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const calcValue = convertFromDisplayToCalc(displayValue, results.currency, displayCurrency, rate)
    if (calcValue === 0) {
      const newMap = { ...esetiWithdrawalByYear }
      delete newMap[year]
      setEsetiWithdrawalByYear(newMap)
    } else {
      setEsetiWithdrawalByYear({ ...esetiWithdrawalByYear, [year]: calcValue })
    }
  }

  const clearAllModifications = () => {
    if (yearlyAccountView === "eseti") {
      setEsetiIndexByYear({})
      setEsetiPaymentByYear({})
      setEsetiWithdrawalByYear({})
      return
    }

    setIndexByYear({})
    setPaymentByYear({})
    setWithdrawalByYear({})
    setTaxCreditLimitByYear({})
    setTaxCreditAmountByYear({})
    // Also clear custom initial costs
    setInputs((prev) => ({
      ...prev,
      initialCostByYear: {},
      initialCostDefaultPercent: 0,
    }))
    // Clear new per-year configurations
    setInvestedShareByYear({})
    setInputs((prev) => ({
      ...prev,
      investedShareDefaultPercent: 100,
    }))
    // Clear redemption fee modifications
    setRedemptionFeeByYear({})
    setRedemptionFeeDefaultPercent(0)
    setRedemptionBaseMode("surplus-only")
    // Clear asset cost overrides
    setAssetCostPercentByYear({})
    setPlusCostByYear({})
    // </CHANGE>
    // Clear bonus percent overrides
    setBonusPercentByYear({})
    // </CHANGE>
    setAppliedPresetLabel(null) // Also clear applied preset
  }

  const updateTaxCreditLimit = (year: number, valueInDisplayCurrency: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const valueInCalc = convertFromDisplayToCalc(valueInDisplayCurrency, results.currency, displayCurrency, rate)

    if (valueInCalc <= 0 || !valueInDisplayCurrency) {
      setTaxCreditLimitByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
    } else {
      setTaxCreditLimitByYear((prev) => ({ ...prev, [year]: valueInCalc }))
    }
  }

  const updateTaxCreditAmount = (year: number, valueInDisplayCurrency: number, maxInCalcCurrency?: number) => {
    const rate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate
    const valueInCalc = convertFromDisplayToCalc(valueInDisplayCurrency, results.currency, displayCurrency, rate)

    if (Number.isNaN(valueInCalc)) {
      setTaxCreditAmountByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
      return
    }

    const safeMax = maxInCalcCurrency !== undefined ? Math.max(0, maxInCalcCurrency) : Number.POSITIVE_INFINITY
    setTaxCreditAmountByYear((prev) => ({ ...prev, [year]: Math.max(0, Math.min(valueInCalc, safeMax)) }))
  }

  const applyTaxCreditSettings = () => {
    setInputs({
      ...inputs,
      enableTaxCredit: true,
      taxCreditRatePercent: 20,
      taxCreditCapPerYear: 130000,
      taxCreditStartYear: 1,
      taxCreditEndYear: undefined,
      stopTaxCreditAfterFirstWithdrawal: false,
    })
  }

  // TODO: Replace with real tax credit future value calculation
  // Static placeholder values - NO calculations
  const estimateTaxCreditFV = useMemo(() => {
    if (!inputs.enableTaxCredit) return { futureValue: 0, estimatedReturn: 0 }
    // Static placeholder values
    const futureValue = results.totalTaxCredit + 100000 // Static placeholder addition
    const estimatedReturn = 100000 // Static placeholder
    return { futureValue, estimatedReturn }
  }, [results.totalTaxCredit, inputs.enableTaxCredit])

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId === "yearly-table" ? "yearly" : sectionId)
    const element = document.getElementById(sectionId)
    if (element) {
      const findScrollableParent = (node: HTMLElement | null): HTMLElement | null => {
        if (!node) return null
        const style = window.getComputedStyle(node)
        const overflowY = style.overflowY
        if (
          (overflowY === "auto" || overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        ) {
          return node
        }
        return findScrollableParent(node.parentElement)
      }

      const scrollParent = findScrollableParent(element.parentElement)
      if (scrollParent) {
        const parentRect = scrollParent.getBoundingClientRect()
        const elementRect = element.getBoundingClientRect()
        const offset = elementRect.top - parentRect.top + scrollParent.scrollTop - 16
        scrollParent.scrollTo({ top: offset, behavior: "smooth" })
      } else {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }

  // Extra Services Cost Calculation
  const [extraServices, setExtraServices] = useState<ExtraService[]>([])
  const [yieldMonitoring, setYieldMonitoring] = useState<YieldMonitoringService>({ enabled: false, fundCount: 1 })

  // TODO: Replace with real extra services cost calculation
  // Static placeholder values - NO calculations
  const extraServicesCostsByYear = useMemo(() => {
    // Static placeholder costs - no calculations
    const costsByYear: Record<number, number> = {}
    for (let year = 1; year <= totalYearsForPlan; year++) {
      // Static placeholder value - just counts services, doesn't calculate
      let yearCost = extraServices.length * 2000 // Static placeholder per service
      if (yieldMonitoring.enabled && yieldMonitoring.fundCount > 1) {
        yearCost += 3000 // Static placeholder for yield monitoring
      }
      costsByYear[year] = yearCost
    }
    return costsByYear
  }, [extraServices, yieldMonitoring, totalYearsForPlan])

  const totalExtraServicesCost = useMemo(() => {
    return Object.values(extraServicesCostsByYear).reduce((sum, cost) => sum + cost, 0)
  }, [extraServicesCostsByYear])

  const adjustedResults = useMemo(() => {
    if (yearlyAccountView === "summary") {
      return {
        ...results,
        yearlyBreakdown: summaryYearlyBreakdown,
      }
    }
    return yearlyAccountView === "eseti" ? resultsEseti : results
  }, [yearlyAccountView, results, resultsEseti, summaryYearlyBreakdown])

  const addExtraService = () => {
    const newService: ExtraService = {
      id: `service-${Date.now()}`,
      name: "Egyedi költség",
      type: "amount",
      value: 0,
      frequency: "monthly",
    }
    setExtraServices([...extraServices, newService])
  }

  const removeExtraService = (id: string) => {
    setExtraServices(extraServices.filter((s) => s.id !== id))
  }

  const updateExtraService = (id: string, updates: Partial<ExtraService>) => {
    setExtraServices(extraServices.map((s) => (s.id === id ? { ...s, ...updates } : s)))
  }

  const addYieldMonitoringService = () => {
    setYieldMonitoring({ enabled: true, fundCount: 1 })
  }

  const updateAssetCostPercent = (year: number, value: number) => {
    setAssetCostPercentByYear((prev) => {
      const updated = { ...prev }
      for (let y = year; y <= totalYearsForPlan; y++) {
        if (value === inputs.assetBasedFeePercent) {
          delete updated[y]
        } else {
          updated[y] = value
        }
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }

  const updatePlusCost = (year: number, value: number) => {
    if (value === 0) {
      setPlusCostByYear((prev) => {
        const updated = { ...prev }
        delete updated[year]
        return updated
      })
    } else {
      setPlusCostByYear((prev) => ({ ...prev, [year]: value }))
    }
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  // </CHANGE>

  const updateBonusPercent = (year: number, percent: number) => {
    setBonusPercentByYear((prev) => {
      const updated = { ...prev }
      if (percent === 0) {
        delete updated[year]
      } else {
        updated[year] = percent
      }
      return updated
    })
    if (appliedPresetLabel) setAppliedPresetLabel(null)
  }
  // </CHANGE>

  useEffect(() => {
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const monthlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment : inputs.regularPayment
    const yearlyPayment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear

    const endBalanceEUR500 =
      results.currency === "EUR" ? convertForDisplay(results.endBalance, "EUR", "HUF", 500) : undefined
    const endBalanceEUR600 =
      results.currency === "EUR" ? convertForDisplay(results.endBalance, "EUR", "HUF", 600) : undefined

    // Update the context with calculated data
    const productHasBonus = inputs.bonusMode !== "none"

    const contextData: CalculatorData = {
      monthlyPayment: results.baseMonthlyPayment,
      yearlyPayment: results.baseYearlyPayment,
      years: results.totalYears,
      currency: inputs.currency,
      displayCurrency: inputs.currency,
      eurToHufRate: inputs.eurToHufRate,
      totalContributions: results.totalContributions,
      totalReturn: results.endBalance - results.totalContributions,
      endBalance: results.endBalance,
      totalTaxCredit: results.totalTaxCredit,
      totalBonus: results.totalBonusGiven,
      totalCost: results.totalCosts,
      totalAssetBasedCost: results.totalAssetBasedCost,
      totalRiskInsuranceCost,
      annualYieldPercent: inputs.annualYieldPercent,
      selectedInsurer,
      selectedProduct,
      enableTaxCredit: inputs.enableTaxCredit,
      enableNetting,
      productHasBonus,
    }
    updateData(contextData)
  }, [
    inputs,
    results,
    displayCurrency,
    inputs.eurToHufRate,
    inputs.frequency,
    inputs.keepYearlyPayment,
    inputs.regularPayment,
    inputs.annualYieldPercent,
    totalYearsForPlan,
    enableNetting,
    finalNetData,
    totalRiskInsuranceCost,
    selectedInsurer,
    selectedProduct,
    appliedPresetLabel,
    updateData,
    inputs.enableTaxCredit, // Added as dependency
    inputs.usdToHufRate, // Added dependency
  ])

  const fxDate = fxState.date ? new Date(fxState.date).toLocaleDateString("hu-HU") : null

  // State for visible years in mobile view
  const [visibleYears, setVisibleYears] = useState(10)

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const isYearlyReadOnly = yearlyAccountView === "summary"
  const isYearlyMuted = yearlyAccountView === "summary"
  const isEsetiView = yearlyAccountView === "eseti"
  const settingsAccountView: "main" | "eseti" = yearlyAccountView === "eseti" ? "eseti" : "main"
  const isSettingsEseti = settingsAccountView === "eseti"
  const settingsDurationUnit = isSettingsEseti ? esetiDurationUnit : durationUnit
  const settingsDurationValue = isSettingsEseti ? esetiDurationValue : durationValue
  const settingsDurationMax =
    isSettingsEseti
      ? esetiDurationMaxByUnit[settingsDurationUnit]
      : settingsDurationUnit === "year"
        ? 50
        : settingsDurationUnit === "month"
          ? 600
          : 18250
  const effectiveYearlyViewMode = yearlyAccountView === "main" ? yearlyViewMode : "total"

  const canUseFundYield = Boolean(selectedProduct)

  useEffect(() => {
    if (!canUseFundYield && annualYieldMode === "fund") {
      setAnnualYieldMode("manual")
    }
  }, [canUseFundYield, annualYieldMode])

  useEffect(() => {
    if (!isMounted) return
    if (typeof window === "undefined") return
    const hash = window.location.hash
    if (!hash) return
    const target = document.querySelector(hash)
    if (target) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 50)
    }
  }, [isMounted])

  useEffect(() => {
    if (!isDisplayCurrencyUserOverridden && displayCurrency !== inputs.currency) {
      setDisplayCurrency(inputs.currency)
    }
  }, [inputs.currency, isDisplayCurrencyUserOverridden, displayCurrency])

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-lg font-bold truncate md:text-xl">Megtakarítás Számláló</h1>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/osszesites")}
                className="h-9 px-3 hidden sm:flex"
              >
                Összesítés
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/osszehasonlitas")}
                className="h-9 px-3 hidden sm:flex"
              >
                Összehasonlítás
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/reszletes-adatok")}
                className="h-9 px-3 hidden sm:flex"
              >
                Részletes adatok
              </Button>

              {/* Display currency selector */}
              <Select value={displayCurrency} onValueChange={handleDisplayCurrencyChange}>
                <SelectTrigger className="w-16 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HUF">Ft</SelectItem>
                  <SelectItem value="EUR">€</SelectItem>
                  <SelectItem value="USD">$</SelectItem>
                </SelectContent>
              </Select>

              {/* Calculation mode selector */}
              <Select
                value={inputs.calculationMode}
                onValueChange={(v) => setInputs({ ...inputs, calculationMode: v as "simple" | "calendar" })}
              >
                <SelectTrigger className="w-24 h-9 hidden sm:flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Egyszerű</SelectItem>
                  <SelectItem value="calendar">Naptár</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-1 mt-2 overflow-x-auto pb-1 md:hidden">
            <Button
              variant={activeSection === "settings" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("settings")}
            >
              <Settings className="w-3 h-3 mr-1" />
              Beállítások
            </Button>
            <Button
              variant={activeSection === "summary" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("summary")}
            >
              <Calculator className="w-3 h-3 mr-1" />
              Összegzés
            </Button>
            <Button
              variant={activeSection === "yearly" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => scrollToSection("yearly-table")}
            >
              <Table2 className="w-3 h-3 mr-1" />
              Éves bontás
            </Button>
            <Button
              variant={activeSection === "summary-link" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/osszesites")}
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Összesítés
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/osszehasonlitas")}
            >
              <GitCompare className="w-3 h-3 mr-1" />
              Összehasonlítás
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs whitespace-nowrap"
              onClick={() => router.push("/reszletes-adatok")}
            >
              <FileText className="w-3 h-3 mr-1" />
              Részletes adatok
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 md:py-6">
        {/* Desktop subtitle */}
        <p className="hidden md:block text-pretty text-muted-foreground">
          Számítsa ki befektetésének várható hozamát költségekkel, bónuszokkal és adó jóváírással
        </p>

        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-3">
          <div id="settings" className="lg:col-span-3 space-y-4 scroll-mt-28">
            <div className="space-y-6">
              <Card
                className={
                  isSettingsEseti
                    ? "border-orange-200 bg-orange-50/45 dark:border-orange-800/50 dark:bg-orange-950/15"
                    : ""
                }
              >
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span>Alapbeállítások</span>
                    {isSettingsEseti ? (
                      <span className="text-sm font-normal text-muted-foreground/70">- Eseti</span>
                    ) : null}
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setYearlyAccountView(settingsAccountView === "eseti" ? "main" : "eseti")}
                      aria-label="Váltás fő és eseti között"
                    >
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setYearlyAccountView(settingsAccountView === "eseti" ? "main" : "eseti")}
                      aria-label="Váltás fő és eseti között"
                    >
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`space-y-3 ${isSettingsEseti ? "opacity-60" : ""}`}>
                    {/* Compact row 1: frequency / payment / currency / index */}
                    <div className="grid items-end gap-1 md:gap-2 grid-cols-[minmax(60px,1.05fr)_minmax(112px,2fr)_minmax(64px,0.95fr)_minmax(52px,0.8fr)] md:grid-cols-12">
                      <div className="min-w-0 space-y-1 md:col-span-2">
                        <Label htmlFor="frequency" className="text-xs text-muted-foreground">
                          Fiz. gyak.
                        </Label>
                        <Select
                          value={isSettingsEseti ? esetiBaseInputs.frequency : inputs.frequency}
                          disabled={isSettingsEseti}
                          onValueChange={(value: PaymentFrequency) => {
                            if (isSettingsEseti) {
                              setEsetiBaseInputs((prev) => ({ ...prev, frequency: value }))
                              setEsetiFrequency(value)
                            } else {
                              setInputs({ ...inputs, frequency: value })
                            }
                          }}
                        >
                          <SelectTrigger id="frequency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="havi">Havi</SelectItem>
                            <SelectItem value="negyedéves">Negyedéves</SelectItem>
                            <SelectItem value="féléves">Féléves</SelectItem>
                            <SelectItem value="éves">Éves</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0 space-y-1 md:col-span-6">
                        <Label htmlFor="regularPayment" className="text-xs text-muted-foreground">
                          Befizetés
                        </Label>
                        <Input
                          id="regularPayment"
                          type="text"
                          inputMode="numeric"
                          disabled={isSettingsEseti}
                          value={
                            editingFields.regularPayment
                              ? String(isSettingsEseti ? esetiBaseInputs.regularPayment : inputs.regularPayment)
                              : formatNumber(isSettingsEseti ? esetiBaseInputs.regularPayment : inputs.regularPayment)
                          }
                          onFocus={() => setFieldEditing("regularPayment", true)}
                          onBlur={() => setFieldEditing("regularPayment", false)}
                          onChange={(e) => {
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) {
                              if (isSettingsEseti) {
                                setEsetiBaseInputs((prev) => ({ ...prev, regularPayment: parsed }))
                              } else {
                                setInputs({ ...inputs, regularPayment: parsed })
                              }
                            }
                          }}
                        />
                      </div>

                      <div className="min-w-0 space-y-1 md:col-span-2">
                        <Label htmlFor="currency" className="text-xs text-muted-foreground">
                          Deviza
                        </Label>
                        <Select value={inputs.currency} onValueChange={handleCurrencyChange} disabled={isSettingsEseti}>
                          <SelectTrigger id="currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="HUF">HUF</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0 space-y-1 md:col-span-2">
                        <Label htmlFor="annualIndex" className="text-xs text-muted-foreground">
                          Index %
                        </Label>
                        <Input
                          id="annualIndex"
                          type="number"
                          disabled={isSettingsEseti}
                          value={isSettingsEseti ? esetiBaseInputs.annualIndexPercent : inputs.annualIndexPercent}
                          onChange={(e) => {
                            const nextValue = Number(e.target.value)
                            if (isSettingsEseti) {
                              setEsetiBaseInputs((prev) => ({ ...prev, annualIndexPercent: nextValue }))
                            } else {
                              setInputs({ ...inputs, annualIndexPercent: nextValue })
                            }
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </div>
                    </div>

                    {/* Compact row 2: duration value / unit / yield */}
                    <div className="grid items-end gap-1 md:gap-2 grid-cols-[minmax(58px,0.9fr)_minmax(64px,0.95fr)_minmax(132px,2.4fr)_minmax(18px,0.2fr)] md:grid-cols-12">
                      <div className={`min-w-0 space-y-1 md:col-span-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                        <Label className="text-xs text-muted-foreground">Futamidő</Label>
                        <Input
                          type="number"
                          disabled={isSettingsEseti}
                          value={settingsDurationValue}
                          onChange={(e) => {
                            const parsed = Number(e.target.value)
                            if (isSettingsEseti) {
                              setEsetiDurationValue(Math.min(parsed, settingsDurationMax))
                            } else {
                              setDurationValue(parsed)
                            }
                          }}
                          min={1}
                          max={settingsDurationMax}
                        />
                      </div>

                      <div className={`min-w-0 space-y-1 md:col-span-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                        <Label className="text-xs text-muted-foreground">Egység</Label>
                        <Select
                          value={settingsDurationUnit}
                          disabled={isSettingsEseti}
                          onValueChange={(v) => {
                            const nextUnit = v as DurationUnit
                            if (isSettingsEseti) {
                              const maxForUnit = esetiDurationMaxByUnit[nextUnit]
                              setEsetiDurationUnit(nextUnit)
                              setEsetiDurationValue((prev) => Math.min(prev, maxForUnit))
                            } else {
                              setDurationUnit(nextUnit)
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="year">Év</SelectItem>
                            <SelectItem value="month">Hónap</SelectItem>
                            <SelectItem value="day">Nap</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0 space-y-1 md:col-span-8">
                        <div className="flex items-center justify-between gap-2">
                          <Label htmlFor="annualYield" className="text-xs text-muted-foreground">
                            Hozam (%)
                          </Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground/60 hover:text-muted-foreground"
                            disabled={!canUseFundYield || isSettingsEseti}
                            onClick={() => setAnnualYieldMode(annualYieldMode === "fund" ? "manual" : "fund")}
                            aria-label="Hozam mód váltása"
                          >
                            {annualYieldMode === "fund" ? (
                              <ChevronUp className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronDown className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                        {annualYieldMode === "fund" && !isSettingsEseti ? (
                          <Select
                            value={selectedFundId || ""}
                            onValueChange={(value) => {
                              setSelectedFundId(value)
                              const selectedFund = fundOptions.find((f) => f.id === value)
                              if (selectedFund) {
                                setInputs({ ...inputs, annualYieldPercent: selectedFund.historicalYield })
                              }
                            }}
                          >
                            <SelectTrigger className="w-full min-w-0 max-w-full overflow-hidden text-left pr-8 h-8">
                              <SelectValue className="sr-only" placeholder="Válassz eszközalapot..." />
                              <span className="block min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs">
                                {selectedFundId
                                  ? `${fundOptions.find((f) => f.id === selectedFundId)?.name ?? ""} (${fundOptions.find((f) => f.id === selectedFundId)?.historicalYield ?? ""}%)`
                                  : "Válassz eszközalapot..."}
                              </span>
                            </SelectTrigger>
                            <SelectContent>
                              {fundOptions.map((fund) => (
                                <SelectItem key={fund.id} value={fund.id}>
                                  {fund.name} ({fund.historicalYield}%)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            id="annualYield"
                            type="number"
                            value={isSettingsEseti ? esetiBaseInputs.annualYieldPercent : inputs.annualYieldPercent}
                            onChange={(e) => {
                              const nextValue = Number(e.target.value)
                              if (isSettingsEseti) {
                                setEsetiBaseInputs((prev) => ({ ...prev, annualYieldPercent: nextValue }))
                              } else {
                                setInputs({ ...inputs, annualYieldPercent: nextValue })
                              }
                            }}
                            min={0}
                            max={100}
                            step={0.1}
                          />
                        )}
                        {!canUseFundYield ? (
                          <p className="text-[11px] text-muted-foreground">
                            Eszközalap módhoz előbb válassz terméket a termékválasztóban.
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {(selectedProduct === "alfa_exclusive_plus" || selectedProduct === "alfa_fortis" || isSettingsEseti) && (
                    <div className={`flex flex-wrap items-center gap-3 text-xs ${isSettingsEseti ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                      {selectedProduct === "alfa_exclusive_plus" && <p>Minimum éves díj: 360 000 Ft</p>}
                      {selectedProduct === "alfa_fortis" && <p>Minimum éves díj: 300 000 Ft</p>}
                      {isSettingsEseti ? <p>Az eseti futamidő legfeljebb a fő számla futamideje lehet.</p> : null}
                    </div>
                  )}

                  {inputs.currency === "EUR" || inputs.currency === "USD" ? (
                    <div className={`space-y-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                      <Label htmlFor={inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"} className="text-xs text-muted-foreground">
                        {inputs.currency === "USD" ? "USD/HUF árfolyam" : "EUR/HUF árfolyam"}
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"}
                          type="text"
                          inputMode="numeric"
                          disabled={isSettingsEseti}
                          value={
                            editingFields[inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate"]
                              ? String(inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate)
                              : formatNumber(inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate)
                          }
                          onFocus={() =>
                            setFieldEditing(inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate", true)
                          }
                          onBlur={() =>
                            setFieldEditing(inputs.currency === "USD" ? "usdToHufRate" : "eurToHufRate", false)
                          }
                          onChange={(e) => {
                            if (isSettingsEseti) return
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) {
                              if (inputs.currency === "USD") {
                                setInputs({ ...inputs, usdToHufRate: parsed })
                              } else {
                                setInputs({ ...inputs, eurToHufRate: parsed })
                              }
                              setEurRateManuallyChanged(true)
                            }
                          }}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => loadFxRate(inputs.currency as "EUR" | "USD")}
                          disabled={isLoadingFx || isSettingsEseti}
                          className="shrink-0 bg-transparent"
                        >
                          {isLoadingFx ? "Betöltés..." : "Aktuális árfolyam"}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {fxState.source === "live" && (
                          <>
                            <span className="text-emerald-600 font-medium">Élő árfolyam</span>
                            {fxState.date && ` (${fxDate})`}
                          </>
                        )}
                        {fxState.source === "cache" && (
                          <>
                            <span className="text-blue-600 font-medium">Gyorsítótárból betöltve</span>
                            {fxState.date && ` (${fxDate})`}
                          </>
                        )}
                        {fxState.source === "default" && (
                          <span className="text-amber-600 font-medium">Alapértelmezett érték (400)</span>
                        )}
                        {eurRateManuallyChanged && (
                          <span className="block text-muted-foreground mt-1">Manuálisan módosítva</span>
                        )}
                      </p>
                    </div>
                  ) : null}

                  <div className={`flex items-center gap-2 ${isSettingsEseti ? "opacity-60" : ""}`}>
                    <Checkbox
                      id="keepYearlyPayment"
                      disabled={isSettingsEseti}
                      checked={isSettingsEseti ? esetiBaseInputs.keepYearlyPayment : inputs.keepYearlyPayment}
                      onCheckedChange={(checked) => {
                        if (isSettingsEseti) {
                          setEsetiBaseInputs((prev) => ({ ...prev, keepYearlyPayment: checked === true }))
                        } else {
                          setInputs({ ...inputs, keepYearlyPayment: checked === true })
                        }
                      }}
                    />
                    <Label htmlFor="keepYearlyPayment" className="cursor-pointer">
                      Éves díjat tart
                    </Label>
                  </div>

                  {/* Tax Credit Section */}
                  <div className={`pt-4 border-t space-y-4 ${isSettingsEseti ? "opacity-60" : ""}`}>
                    <label className={`flex items-center gap-3 ${isSettingsEseti ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <Checkbox
                        checked={inputs.enableTaxCredit}
                        onCheckedChange={(checked) => {
                          if (!isSettingsEseti) {
                            setInputs({ ...inputs, enableTaxCredit: checked === true })
                          }
                        }}
                        disabled={isSettingsEseti}
                        className="w-5 h-5"
                      />
                      <span>Adójóváírás bekapcsolása</span>
                    </label>
                    {isSettingsEseti ? (
                      <p className="text-xs text-muted-foreground">
                        Itt csak megjelenítjük az alapbeállításokban kiválasztott adójóváírás állapotot.
                      </p>
                    ) : null}

                      {!isSettingsEseti && inputs.enableTaxCredit && (
                        <>
                      <div className="space-y-2">
                        <Label>Adójóváírás mértéke (%)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={inputs.taxCreditRatePercent}
                          onChange={(e) => setInputs({ ...inputs, taxCreditRatePercent: Number(e.target.value) })}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Adójóváírás hozama (%)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={inputs.taxCreditYieldPercent}
                          onChange={(e) => setInputs({ ...inputs, taxCreditYieldPercent: Number(e.target.value) || 0 })}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Maximális adójóváírás évente ({results.currency})</Label>
                        <Input
                          type="text"
                          inputMode="numeric"
                          value={
                            editingFields.taxCreditCapPerYear
                              ? String(inputs.taxCreditCapPerYear)
                              : formatNumber(inputs.taxCreditCapPerYear)
                          }
                          onFocus={() => setFieldEditing("taxCreditCapPerYear", true)}
                          onBlur={() => setFieldEditing("taxCreditCapPerYear", false)}
                          onChange={(e) => {
                            const parsed = parseNumber(e.target.value)
                            if (!isNaN(parsed)) setInputs({ ...inputs, taxCreditCapPerYear: parsed })
                          }}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Adójóváírás kezdete (év)</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={inputs.taxCreditStartYear || 1}
                            onChange={(e) => setInputs({ ...inputs, taxCreditStartYear: Number(e.target.value) || 1 })}
                            min={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Adójóváírás vége (év)</Label>
                          <Input
                            type="number"
                            inputMode="numeric"
                            value={inputs.taxCreditEndYear || ""}
                            onChange={(e) => setInputs({ ...inputs, taxCreditEndYear: Number(e.target.value) || 0 })}
                            min={0}
                            placeholder="0 = nincs"
                          />
                        </div>
                      </div>

                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={inputs.stopTaxCreditAfterFirstWithdrawal}
                          onCheckedChange={(checked) =>
                            setInputs({ ...inputs, stopTaxCreditAfterFirstWithdrawal: checked === true })
                          }
                          className="w-5 h-5"
                        />
                        <span>Adójóváírás leállítása első pénzkivonás után</span>
                      </label>

                      <div className="rounded-lg border bg-muted/20 p-3 space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <Checkbox
                            checked={taxCreditNotUntilRetirement}
                            onCheckedChange={(checked) => setTaxCreditNotUntilRetirement(checked === true)}
                            className="w-5 h-5"
                          />
                          <span>Nem nyugdíjig (20% visszafizetés)</span>
                        </label>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            {taxCreditNotUntilRetirement
                              ? "Végösszeg adójóváírással (20% büntetéssel)"
                              : "Végösszeg adójóváírással"}
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(
                              getRealValue(
                                taxCreditNotUntilRetirement ? endBalanceWithTaxCreditPenalty : results.endBalance,
                              ),
                            )}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Végösszeg adójóváírás nélkül</span>
                          <span className="font-semibold tabular-nums">
                            {formatCurrency(getRealValue(endBalanceWithoutTaxCredit))}
                          </span>
                        </div>
                      </div>
                        </>
                  )}
                  </div>
                </CardContent>
              </Card>

              <Card className="w-full p-4 md:p-6">
                <Collapsible open={isPresetCardOpen} onOpenChange={setIsPresetCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>Biztosító és termékválasztó</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isPresetCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <CardContent className="px-0 pb-0">
                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="preset-insurer">Biztosító</Label>
                            <Select value={selectedInsurer} onValueChange={setSelectedInsurer}>
                              <SelectTrigger id="preset-insurer">
                                <SelectValue placeholder="Válassz biztosítót" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Alfa">Alfa</SelectItem>
                                <SelectItem value="Allianz">Allianz</SelectItem>
                                <SelectItem value="CIG Pannonia">CIG Pannonia</SelectItem>
                                <SelectItem value="Generali">Generali</SelectItem>
                                <SelectItem value="Grupama">Grupama</SelectItem>
                                <SelectItem value="KnH">KnH</SelectItem>
                                <SelectItem value="Magyar Posta">Magyar Posta</SelectItem>
                                <SelectItem value="MetLife">MetLife</SelectItem>
                                <SelectItem value="NN">NN</SelectItem>
                                <SelectItem value="Signal Iduna">Signal Iduna</SelectItem>
                                <SelectItem value="Union">Union</SelectItem>
                                <SelectItem value="Uniqa">Uniqa</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="preset-product">Termék</Label>
                            <Select
                              value={selectedProduct}
                              onValueChange={setSelectedProduct}
                              disabled={!selectedInsurer || getAvailableProducts().length === 0}
                            >
                              <SelectTrigger id="preset-product">
                                <SelectValue placeholder="Válassz terméket" />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableProducts().map((product) => (
                                  <SelectItem key={product.value} value={product.value}>
                                    {product.label}
                                  </SelectItem>
                                ))}
                                {getAvailableProducts().length === 0 && (
                                  <SelectItem value="none" disabled>
                                    Nincs elérhető termék
                                  </SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2 pt-1">
                          <Button
                            onClick={applyPreset}
                            disabled={!selectedInsurer || !selectedProduct}
                            className="w-full"
                            variant="secondary"
                          >
                            Paraméterek alkalmazása
                          </Button>
                          <p className="text-xs text-muted-foreground text-center">
                            Az alkalmazás felülírja a költség- és bónusz mezők értékeit.
                          </p>
                        </div>

                        {selectedProduct &&
                          selectedInsurer &&
                          (() => {
                            const product = getAvailableProducts().find((p) => p.value === selectedProduct)
                            if (!product) return null

                            // Check if product has variants (Alfa Exclusive Plus)
                            if (product.variants && product.variants.length > 0) {
                              return (
                                <div className="mt-3 pt-3 border-t space-y-2">
                                  <p className="text-xs font-medium text-muted-foreground">Termékváltozatok:</p>
                                  {product.variants.map((variant, idx) => (
                                    <div key={idx} className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                                      <div>
                                        <span className="font-medium">Termék típusa:</span> {variant.productType}
                                      </div>
                                      <div>
                                        <span className="font-medium">MNB kód:</span> {variant.mnbCode}
                                      </div>
                                      <div>
                                        <span className="font-medium">Termékkód:</span> {variant.productCode}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )
                            }

                            // Default: single product display
                            return (
                              <div className="mt-3 pt-3 border-t space-y-1 text-xs text-muted-foreground">
                                <div>
                                  <span className="font-medium">Termék típusa:</span> {product.productType}
                                </div>
                                <div>
                                  <span className="font-medium">MNB kód:</span> {product.mnbCode}
                                </div>
                                <div>
                                  <span className="font-medium">Termékkód:</span> {product.productCode}
                                </div>
                              </div>
                            )
                          })()}
                    </div>
                </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              <Card className="w-full p-4 md:p-6">
                <Collapsible open={isCostsCardOpen} onOpenChange={setIsCostsCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                  <CardTitle>Költségek és bónuszok</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isCostsCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <CardContent className="px-0 pb-0 space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-base border-b pb-2">Költségek</h3>

                    {appliedPresetLabel && (
                      <div className="bg-muted/50 rounded-md p-2 text-xs text-muted-foreground flex items-center justify-between">
                        <span>
                          <span className="font-medium">Preset:</span> {appliedPresetLabel}
                        </span>
                        <span className="text-[10px]">(felülírható)</span>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">{getAcquisitionCostTitle()}</Label>
                      <InitialCostByYear
                        termYears={totalYearsForPlan}
                        initialCostByYear={inputs.initialCostByYear || {}}
                        defaultPercent={inputs.initialCostDefaultPercent || 0}
                        onUpdate={(byYear, defaultPercent) => {
                          setInputs({
                            ...inputs,
                            initialCostByYear: byYear,
                            initialCostDefaultPercent: defaultPercent,
                          })
                          if (appliedPresetLabel) setAppliedPresetLabel(null)
                        }}
                      />
                    </div>

                    {/* Management fees moved to separate card below */}
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Collapsible open={isAccountSplitOpen} onOpenChange={setIsAccountSplitOpen}>
                      <CollapsibleTrigger className="flex items-start justify-between w-full text-left group">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">
                            Számlaértékek megoszlása (befektetésre kerülő összeg)
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Ha meg van nyitva, az adott évben megadott % azt jelzi, a költségek levonása után a
                            számlaérték mekkora része kerül befektetésre, így a Többletdíj számlára. A maradék
                            automatikusan az Ügyfélérték számlára kerül.
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ml-2 flex-shrink-0 ${
                            isAccountSplitOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="mb-4 flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="taxBonusSeparate"
                            checked={isTaxBonusSeparateAccount}
                            onChange={(e) => {
                              setIsTaxBonusSeparateAccount(e.target.checked)
                              if (appliedPresetLabel) setAppliedPresetLabel(null)
                            }}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <label htmlFor="taxBonusSeparate" className="text-sm font-medium">
                            Adójóváírás külön számlán kezelve
                          </label>
                        </div>
                        {/* </CHANGE> */}
                        <InvestedShareByYear
                          termYears={totalYearsForPlan}
                          investedShareByYear={investedShareByYear}
                          defaultPercent={inputs.investedShareDefaultPercent || 100}
                          onUpdate={(byYear, defaultPercent) => {
                            setInvestedShareByYear(byYear)
                            setInputs({ ...inputs, investedShareDefaultPercent: defaultPercent })
                            if (appliedPresetLabel) setAppliedPresetLabel(null)
                          }}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  {/* </CHANGE> */}

                  <div className="space-y-3 pt-4 border-t">
                    <Collapsible open={isRedemptionOpen} onOpenChange={setIsRedemptionOpen}>
                      <CollapsibleTrigger className="flex items-start justify-between w-full text-left group">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">Visszavásárlási költség</h3>
                          <p className="text-sm text-muted-foreground">
                            Évenként megadható, hogy mekkora visszavásárlási költség terheli a számlaértéket.
                          </p>
                        </div>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ml-2 flex-shrink-0 ${
                            isRedemptionOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <RedemptionFeeByYear
                          termYears={totalYearsForPlan}
                          redemptionFeeByYear={redemptionFeeByYear}
                          defaultPercent={redemptionFeeDefaultPercent}
                          redemptionBaseMode={redemptionBaseMode}
                          isAccountSplitOpen={isAccountSplitOpen}
                          onUpdate={(byYear, defaultPercent) => {
                            setRedemptionFeeByYear(byYear)
                            setRedemptionFeeDefaultPercent(defaultPercent)
                            if (appliedPresetLabel) setAppliedPresetLabel(null)
                          }}
                          onBaseModeChange={(mode) => {
                            setRedemptionBaseMode(mode)
                            if (appliedPresetLabel) setAppliedPresetLabel(null)
                          }}
                        />
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  {/* </CHANGE> */}
                </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>

              {/* New card for custom costs and bonuses */}
              <Card className="w-full p-4 md:p-6">
                <Collapsible open={isCustomCostsCardOpen} onOpenChange={setIsCustomCostsCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle>Egyedi költségek és bónuszok</CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isCustomCostsCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="px-0 pb-0 space-y-6">
                  {/* Management Fees Section */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-base border-b pb-2">Egyedi költségek</h3>
                    <div className="space-y-3">
                      {managementFees.map((fee, index) => (
                        <div key={fee.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm flex items-center gap-1 flex-wrap">
                                <span>Rendszeres</span>
                                <Select
                                  value={fee.frequency}
                                  onValueChange={(value: ManagementFeeFrequency) => {
                                    updateManagementFee(fee.id, { frequency: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="napi">napi</SelectItem>
                                    <SelectItem value="havi">havi</SelectItem>
                                    <SelectItem value="negyedéves">negyedéves</SelectItem>
                                    <SelectItem value="féléves">féléves</SelectItem>
                                    <SelectItem value="éves">éves</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>költség (</span>
                                <Select
                                  value={fee.valueType}
                                  onValueChange={(value: ManagementFeeValueType) => {
                                    updateManagementFee(fee.id, { valueType: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="amount">{results.currency}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>)</span>
                                {isAccountSplitOpen && (
                                  <>
                                    <span> rész</span>
                                    <Select
                                      value={fee.account}
                                      onValueChange={(value: "client" | "invested" | "taxBonus") => {
                                        updateManagementFee(fee.id, { account: value })
                                      }}
                                    >
                                      <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="client">Ügyfélérték</SelectItem>
                                        <SelectItem value="invested">Többletdíj</SelectItem>
                                        {isTaxBonusSeparateAccount && (
                                          <SelectItem value="taxBonus">Adójóváírási számla</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  editingFields[`managementFee-${fee.id}`]
                                    ? String(fee.value)
                                    : formatNumber(fee.value)
                                }
                                onFocus={() => setFieldEditing(`managementFee-${fee.id}`, true)}
                                onBlur={() => setFieldEditing(`managementFee-${fee.id}`, false)}
                                onChange={(e) => {
                                  const parsed = parseNumber(e.target.value)
                                  if (!isNaN(parsed)) {
                                    updateManagementFee(fee.id, { value: parsed })
                                  }
                                }}
                                min={0}
                                className="h-11"
                              />
                            </div>
                            {managementFees.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeManagementFee(fee.id)}
                                className="mt-8 text-muted-foreground hover:text-foreground p-2"
                                title="Törlés"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addManagementFee}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Költség hozzáadása</span>
                      </button>
                    </div>
                  </div>

                  {/* Bonuses Section */}
                  <div className="space-y-3 pt-4 border-t">
                    <h3 className="font-semibold text-base border-b pb-2">Bónuszok</h3>
                    <div className="space-y-3">
                      {bonuses.map((bonus, index) => (
                        <div key={bonus.id} className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="flex-1 space-y-2">
                              <Label className="text-sm flex items-center gap-1 flex-wrap">
                                <span>Bónusz (</span>
                                <Select
                                  value={bonus.valueType}
                                  onValueChange={(value: "percent" | "amount") => {
                                    updateBonus(bonus.id, { valueType: value })
                                  }}
                                >
                                  <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="percent">%</SelectItem>
                                    <SelectItem value="amount">{results.currency}</SelectItem>
                                  </SelectContent>
                                </Select>
                                <span>)</span>
                                {isAccountSplitOpen && (
                                  <>
                                    <span> rész</span>
                                    <Select
                                      value={bonus.account}
                                      onValueChange={(value: "client" | "invested" | "taxBonus") => {
                                        updateBonus(bonus.id, { account: value })
                                      }}
                                    >
                                      <SelectTrigger className="h-6 w-auto px-2 py-0 text-sm font-normal inline-flex border-dashed">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="client">Ügyfélérték</SelectItem>
                                        <SelectItem value="invested">Többletdíj</SelectItem>
                                        {isTaxBonusSeparateAccount && (
                                          <SelectItem value="taxBonus">Adójóváírási számla</SelectItem>
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </>
                                )}
                              </Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={
                                  editingFields[`bonus-${bonus.id}`]
                                    ? String(bonus.value)
                                    : formatNumber(bonus.value)
                                }
                                onFocus={() => setFieldEditing(`bonus-${bonus.id}`, true)}
                                onBlur={() => setFieldEditing(`bonus-${bonus.id}`, false)}
                                onChange={(e) => {
                                  const parsed = parseNumber(e.target.value)
                                  if (!isNaN(parsed)) {
                                    updateBonus(bonus.id, { value: parsed })
                                  }
                                }}
                                min={0}
                                className="h-11"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBonus(bonus.id)}
                              className="mt-8 text-muted-foreground hover:text-foreground p-2"
                              title="Törlés"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addBonus}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Bónusz hozzáadása</span>
                      </button>
                    </div>
                  </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            </div>
          </div>

          <div id="summary-section" className="hidden scroll-mt-28">
            <Card className="w-full p-4 md:p-6 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/50">
              <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Kockázati biztosítások és kiegészítő szolgáltatások</CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isServicesCardOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-0 pb-0 space-y-6">
                    {/* Risk Insurance Section */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={enableRiskInsurance}
                          onCheckedChange={(checked) => setEnableRiskInsurance(checked === true)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">Kockázati biztosítás bekapcsolása</span>
                      </label>

                      {enableRiskInsurance && (
                        <>
                          <div className="space-y-2">
                            <Label>Kockázati biztosítás típusa</Label>
                            <Select value={riskInsuranceType} onValueChange={setRiskInsuranceType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Válassz biztosítási típust" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type1">Típus 1</SelectItem>
                                <SelectItem value="type2">Típus 2</SelectItem>
                                <SelectItem value="type3">Típus 3</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Jelenleg csak kiválasztásra szolgál, később lesz egyedi költségszámítás
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>A havi díj hány %-a kockázati biztosítás költség?</Label>
                            <Input
                              type="number"
                              value={riskInsuranceFeePercentOfMonthlyPayment}
                              onChange={(e) => setRiskInsuranceFeePercentOfMonthlyPayment(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Éves indexálás a kockázati költségre (%)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceAnnualIndexPercent}
                              onChange={(e) => setRiskInsuranceAnnualIndexPercent(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Kezdő év</Label>
                              <Input
                                type="number"
                                value={riskInsuranceStartYear}
                                onChange={(e) => setRiskInsuranceStartYear(Number(e.target.value) || 1)}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Záró év</Label>
                              <Input
                                type="number"
                                value={riskInsuranceEndYear || ""}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === "" || value === "Végéig") {
                                    setRiskInsuranceEndYear(undefined)
                                  } else {
                                    setRiskInsuranceEndYear(Number(value) || undefined)
                                  }
                                }}
                                placeholder="Végéig"
                                min={0}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Additional Services Section */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-base font-semibold">Kiegészítő szolgáltatások</h3>
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Előre definiált szolgáltatás hozzáadása</Label>
                        <div className="space-y-2">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <Checkbox
                              checked={yieldMonitoring.enabled}
                              onCheckedChange={(checked) => {
                                setYieldMonitoring({ ...yieldMonitoring, enabled: checked === true })
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-sm">Hozamfigyelő szolgáltatás</span>
                          </label>
                          
                          {yieldMonitoring.enabled && (
                            <div className="ml-8 space-y-2">
                              <Label className="text-sm font-medium">Hozamfigyelő szolgáltatás szabályai:</Label>
                              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-2">
                                <li>1 eszközalap ingyenes (további eszközalapokra lehet díj)</li>
                                <li>
                                  EUR: ingyenes 1.500 €/év befizetés felett vagy 40.000 € egyenleg felett, különben 0,5 €/hó/eszközalap
                                </li>
                                <li>
                                  HUF: ingyenes 180.000 Ft/év befizetés felett vagy 2.000.000 Ft egyenleg felett, különben 100 Ft/hó/eszközalap
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // TODO: Add custom cost functionality
                        }}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground py-2"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Egyedi költség hozzáadása</span>
                      </button>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {totalExtraServicesCost > 0 && (
              <Card className="border-purple-200 dark:border-purple-800">
                <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <span className="text-purple-600 dark:text-purple-400">Kiegészítő szolgáltatások</span>
                  </CardTitle>
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${
                            isServicesCardOpen ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Összes költség:</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {formatCurrency(totalExtraServicesCost)}
                      </span>
                    </div>
                    {yieldMonitoring.enabled && (
                      <p className="text-xs text-muted-foreground">
                        Hozamfigyelő: {yieldMonitoring.fundCount} eszközalap
                      </p>
                    )}
                    {extraServices.length > 0 && (
                      <p className="text-xs text-muted-foreground">{extraServices.length} egyedi költség</p>
                    )}
                  </div>
                </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}
          </div>

          <div id="yearly" className="lg:col-span-3 space-y-4 scroll-mt-28">
            <Card className="w-full p-4 md:p-6 bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-800/50">
              <Collapsible open={isServicesCardOpen} onOpenChange={setIsServicesCardOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="px-0 pt-0 cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle>Kockázati biztosítások és kiegészítő szolgáltatások</CardTitle>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${
                          isServicesCardOpen ? "transform rotate-180" : ""
                        }`}
                      />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="px-0 pb-0 space-y-6">
                    {/* Risk Insurance Section */}
                    <div className="space-y-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox
                          checked={enableRiskInsurance}
                          onCheckedChange={(checked) => setEnableRiskInsurance(checked === true)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">Kockázati biztosítás bekapcsolása</span>
                      </label>

                      {enableRiskInsurance && (
                        <>
                          <div className="space-y-2">
                            <Label>Kockázati biztosítás típusa</Label>
                            <Select value={riskInsuranceType} onValueChange={setRiskInsuranceType}>
                              <SelectTrigger>
                                <SelectValue placeholder="Válassz biztosítási típust" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="type1">Típus 1</SelectItem>
                                <SelectItem value="type2">Típus 2</SelectItem>
                                <SelectItem value="type3">Típus 3</SelectItem>
                              </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                              Jelenleg csak kiválasztásra szolgál, később lesz egyedi költségszámítás
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label>A havi díj hány %-a kockázati biztosítás költség?</Label>
                            <Input
                              type="number"
                              value={riskInsuranceFeePercentOfMonthlyPayment}
                              onChange={(e) => setRiskInsuranceFeePercentOfMonthlyPayment(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Kockázati biztosítás fix havi díja (Ft)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceMonthlyFeeAmount}
                              onChange={(e) => setRiskInsuranceMonthlyFeeAmount(Number(e.target.value))}
                              min={0}
                              step={100}
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Éves indexálás a kockázati költségre (%)</Label>
                            <Input
                              type="number"
                              value={riskInsuranceAnnualIndexPercent}
                              onChange={(e) => setRiskInsuranceAnnualIndexPercent(Number(e.target.value))}
                              min={0}
                              max={100}
                              step={0.1}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label>Indulás éve</Label>
                              <Input
                                type="number"
                                value={riskInsuranceStartYear}
                                onChange={(e) => setRiskInsuranceStartYear(Number(e.target.value))}
                                min={1}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Leállás éve (0 = soha)</Label>
                              <Input
                                type="number"
                                value={riskInsuranceEndYear}
                                onChange={(e) => setRiskInsuranceEndYear(Number(e.target.value))}
                                min={0}
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
            <Card
              id="summary"
              className={`w-full border-2 scroll-mt-28 ${activeSummaryTheme.card}`}
            >
              <CardHeader className="pb-2 md:pb-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg md:text-xl">
                  Összegzés - {summaryAccountLabels[yearlyAccountView]}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const currentIndex = summaryAccountsOrder.indexOf(yearlyAccountView)
                      const nextIndex = (currentIndex - 1 + summaryAccountsOrder.length) % summaryAccountsOrder.length
                      setYearlyAccountView(summaryAccountsOrder[nextIndex])
                    }}
                    aria-label="Előző számla"
                  >
                    <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const currentIndex = summaryAccountsOrder.indexOf(yearlyAccountView)
                      const nextIndex = (currentIndex + 1) % summaryAccountsOrder.length
                      setYearlyAccountView(summaryAccountsOrder[nextIndex])
                    }}
                    aria-label="Következő számla"
                  >
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Netting checkboxes */}
                <div className="space-y-1.5 mb-4 pb-4 border-b">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enableNetting}
                            onCheckedChange={(checked) => {
                              setEnableNetting(checked === true)
                              if (!checked) setIsCorporateBond(false)
                            }}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">Nettósítás</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Kamatadó és szochó levonása a hozamból. A nettósítás a hozamra vonatkozik, a befizetett tőke adómentes. A számítás a hatályos magyar kamatadó és szochó szabályok egyszerűsített modellje.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {enableNetting && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <Checkbox
                              checked={isCorporateBond}
                              onCheckedChange={(checked) => setIsCorporateBond(checked === true)}
                              className="w-4 h-4"
                            />
                            <span className="text-sm font-medium">Céges kötés</span>
                          </label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Csak kamatadó, szochó nélkül. Céges kötés esetén alacsonyabb adókulcs érvényes: 0-5 év: 15%, 5-10 év: 7,5%, 10+ év: adómentes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={enableRealValue}
                            onCheckedChange={(checked) => setEnableRealValue(checked === true)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm font-medium">Reálérték</span>
                        </label>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          A reálérték számítás az inflációt is figyelembe veszi, így a jövőbeli értékeket mai vásárlóerőben mutatja.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {enableRealValue && (
                    <div className="ml-6 space-y-1">
                      <Label htmlFor="inflationRate" className="text-xs text-muted-foreground">
                        Éves átlagos infláció (%)
                      </Label>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Input
                          id="inflationRate"
                          type="number"
                          value={inflationRate}
                          onChange={(e) => {
                            setInflationRate(Number(e.target.value))
                            if (inflationAutoEnabled) setInflationAutoEnabled(false)
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                          className="w-32 h-8 text-sm"
                        />
                        <label className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Checkbox
                            checked={inflationAutoEnabled}
                            onCheckedChange={(checked) => setInflationAutoEnabled(checked === true)}
                            className="w-4 h-4"
                          />
                          KSH alapján
                        </label>
                        {!inflationAutoEnabled && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => setInflationAutoEnabled(true)}
                          >
                            KSH vissza
                          </Button>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {inflationKshLoading && "KSH adat betöltése..."}
                        {!inflationKshLoading && inflationKshError && inflationKshError}
                        {!inflationKshLoading && !inflationKshError && inflationKshYear && inflationKshValue !== null && (
                          <>KSH {inflationKshYear}: {inflationKshValue.toFixed(1)}%</>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-1">
                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Teljes befizetés</span>
                    <span className="text-lg md:text-xl font-bold tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalContributions))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes költség</span>
                    <span className="text-lg md:text-xl font-bold text-destructive tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalCosts))}
                    </span>
                  </div>

                  {enableRiskInsurance && activeSummaryTotals.totalRiskInsuranceCost > 0 && (
                    <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">
                        Ebből kockázati bizt.
                      </span>
                      <span className="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400 tabular-nums">
                        {formatCurrency(getRealValue(activeSummaryTotals.totalRiskInsuranceCost))}
                      </span>
                    </div>
                  )}

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes bónusz</span>
                    <span className="text-lg md:text-xl font-bold text-chart-2 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalBonus))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Összes adójóváírás</span>
                    <span className="text-lg md:text-xl font-bold text-chart-3 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalTaxCredit))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 ${activeSummaryTheme.metric}`}>
                    <span className="text-xs md:text-sm font-medium text-muted-foreground">Teljes nettó hozam</span>
                    <span className="text-lg md:text-xl font-bold text-chart-1 tabular-nums">
                      {formatCurrency(getRealValue(activeSummaryTotals.totalInterestNet))}
                    </span>
                  </div>

                  <div className={`flex items-center justify-between rounded-lg p-3 md:p-4 sm:col-span-2 lg:col-span-1 ${activeSummaryTheme.final}`}>
                    <span className="text-xs md:text-sm font-medium">Egyenleg a futamidő végén</span>
                    <span className="text-xl md:text-2xl font-bold tabular-nums">
                      {formatCurrency(
                        getRealValue(shouldApplyTaxCreditPenalty ? summaryBalanceWithPenalty : summaryBaseBalance),
                      )}
                    </span>
                  </div>
                </div>

                {/* Netting results display */}
                {enableNetting && finalNetData && (
                  <div className="space-y-3 pt-4 mt-4 border-t">
                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border">
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Bruttó egyenleg</span>
                      <span className="text-base md:text-lg font-semibold tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.grossBalance))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border border-red-200 dark:border-red-800">
                      <div>
                        <span className="text-xs md:text-sm font-medium text-muted-foreground">Levonás összege</span>
                        <p className="text-xs text-muted-foreground">
                          {isCorporateBond ? "Csak kamatadó" : "Kamatadó + szochó"} (
                          {Math.round(finalNetData.taxRate * 100)}%)
                        </p>
                      </div>
                      <span className="text-base md:text-lg font-semibold text-red-600 dark:text-red-400 tabular-nums">
                        -{formatCurrency(getRealValue(finalNetData.taxDeduction))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-background p-2.5 md:p-3 border border-emerald-200 dark:border-emerald-800">
                      <span className="text-xs md:text-sm font-medium text-muted-foreground">Nettó hozam</span>
                      <span className="text-base md:text-lg font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.netProfit))}
                      </span>
                    </div>

                    <div className="flex items-center justify-between rounded-lg bg-yellow-100 dark:bg-yellow-950/40 p-2.5 md:p-3 border border-yellow-300 dark:border-yellow-700">
                      <span className="text-xs md:text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                        Nettó végösszeg
                      </span>
                      <span className="text-lg md:text-xl font-bold text-yellow-700 dark:text-yellow-400 tabular-nums">
                        {formatCurrency(getRealValue(finalNetData.netBalance))}
                      </span>
                    </div>

                    {/* Tax bracket info */}
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md space-y-1">
                      <p className="font-medium">Adósávok ({isCorporateBond ? "céges" : "lakossági"})</p>
                      {yearlyAccountView === "eseti" ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            0-3 év: {isCorporateBond ? "15%" : "28%"}{" "}
                            {!isCorporateBond && "(15% kamatadó + 13% szochó)"}
                          </li>
                          <li>
                            3-5 év: {isCorporateBond ? "7,5%" : "14%"} {!isCorporateBond && "(7,5% + 6,5%)"}
                          </li>
                          <li>5+ év: adómentes</li>
                        </ul>
                      ) : yearlyAccountView === "summary" ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            Fő számla: 0-5 év / 5-10 év / 10+ év sávok ({isCorporateBond ? "15% / 7,5% / 0%" : "28% / 14% / 0%"})
                          </li>
                          <li>
                            Eseti számla: 0-3 év / 3-5 év / 5+ év sávok ({isCorporateBond ? "15% / 7,5% / 0%" : "28% / 14% / 0%"})
                          </li>
                        </ul>
                      ) : (
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>
                            0-5 év: {isCorporateBond ? "15%" : "28%"}{" "}
                            {!isCorporateBond && "(15% kamatadó + 13% szochó)"}
                          </li>
                          <li>
                            5-10 év: {isCorporateBond ? "7,5%" : "14%"} {!isCorporateBond && "(7,5% + 6,5%)"}
                          </li>
                          <li>10+ év: adómentes</li>
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card id="yearly-table">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="text-lg md:text-xl">Éves bontás</CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  {isAccountSplitOpen && (
                    <div className="flex items-center gap-1 border rounded-md p-1">
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "total" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setYearlyViewMode("total")}
                        className="h-7 text-xs px-2"
                        disabled={isYearlyReadOnly}
                      >
                        Összesített
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "client" ? "default" : "ghost"}
                        size="sm"
                        className="text-xs"
                        onClick={() => setYearlyViewMode("client")}
                        disabled={isYearlyReadOnly}
                      >
                        Ügyfélérték számla
                      </Button>
                      <Button
                        type="button"
                        variant={effectiveYearlyViewMode === "invested" ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setYearlyViewMode("invested")}
                        className="h-7 text-xs px-2"
                        disabled={isYearlyReadOnly}
                      >
                        Többletdíj számla
                      </Button>
                      {isTaxBonusSeparateAccount && (
                        <Button
                          type="button"
                          variant={effectiveYearlyViewMode === "taxBonus" ? "default" : "ghost"}
                          size="sm"
                          onClick={() => setYearlyViewMode("taxBonus")}
                          className="h-7 text-xs px-2"
                          disabled={isYearlyReadOnly}
                        >
                          Adójóváírás számla
                        </Button>
                      )}
                    </div>
                  )}
                  {/* </CHANGE> */}

                  <Select
                    value={yearlyAccountView}
                    onValueChange={(value) => setYearlyAccountView(value as "summary" | "main" | "eseti")}
                  >
                    <SelectTrigger className="h-9 w-32 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="summary">Összesített</SelectItem>
                      <SelectItem value="main">Fő</SelectItem>
                      <SelectItem value="eseti">Eseti</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={yearlyAggregationMode}
                    onValueChange={(value) => setYearlyAggregationMode(value as "year" | "sum")}
                    disabled={isYearlyReadOnly}
                  >
                    <SelectTrigger className="h-9 w-28 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="year">Éves</SelectItem>
                      <SelectItem value="sum">Szum</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clearAllModifications}
                    disabled={
                      isYearlyReadOnly ||
                      Object.keys(indexByYear).length === 0 &&
                      Object.keys(paymentByYear).length === 0 &&
                      Object.keys(withdrawalByYear).length === 0 &&
                      Object.keys(taxCreditLimitByYear).length === 0 &&
                      Object.keys(taxCreditAmountByYear).length === 0 &&
                      Object.keys(assetCostPercentByYear).length === 0 &&
                      Object.keys(plusCostByYear).length === 0 &&
                      Object.keys(bonusPercentByYear).length === 0 &&
                      Object.keys(investedShareByYear).length === 0 &&
                      Object.keys(redemptionFeeByYear).length === 0 &&
                      Object.keys(inputs.initialCostByYear ?? {}).length === 0
                    }
                    className="h-9 text-xs md:text-sm bg-transparent"
                  >
                    Módosítások törlése
                  </Button>

                  {/* Display currency selector removed here; kept in top bar */}
                </div>
              </CardHeader>
              <CardContent>
                {/* Mobile view */}
                <div className={`md:hidden space-y-3 ${isYearlyMuted ? "opacity-60" : ""}`}>
                  {(adjustedResults?.yearlyBreakdown ?? []).slice(0, visibleYears).map((row, index) => (
                    <MobileYearCard
                      key={row.year}
                      row={row}
                      planIndex={isEsetiView ? esetiPlanIndex : planIndex}
                      planPayment={isEsetiView ? esetiPlanPayment : planPayment}
                      indexByYear={isEsetiView ? esetiIndexByYear : indexByYear}
                      paymentByYear={isEsetiView ? esetiPaymentByYear : paymentByYear}
                      withdrawalByYear={isEsetiView ? esetiWithdrawalByYear : withdrawalByYear}
                      taxCreditLimitByYear={taxCreditLimitByYear}
                      displayCurrency={displayCurrency}
                      resultsCurrency={adjustedResults?.currency ?? results.currency}
                      eurToHufRate={inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate}
                      enableTaxCredit={inputs.enableTaxCredit}
                      editingFields={editingFields}
                      setFieldEditing={setFieldEditing}
                      updateIndex={isEsetiView ? updateEsetiIndex : updateIndex}
                      updatePayment={isEsetiView ? updateEsetiPayment : updatePayment}
                      updateWithdrawal={isEsetiView ? updateEsetiWithdrawal : updateWithdrawal}
                      updateTaxCreditLimit={updateTaxCreditLimit}
                      formatValue={formatValue}
                      enableNetting={enableNetting}
                      netData={yearlyNetCalculations[index]}
                      riskInsuranceCostForYear={enableRiskInsurance ? row.riskInsuranceCostForYear : undefined}
                      isAccountSplitOpen={isAccountSplitOpen}
                      isRedemptionOpen={isRedemptionOpen}
                      plusCostByYear={plusCostByYear}
                      inputs={inputs}
                      updatePlusCost={updatePlusCost}
                      assetCostPercentByYear={assetCostPercentByYear}
                      updateAssetCostPercent={updateAssetCostPercent}
                      bonusPercentByYear={bonusPercentByYear}
                      updateBonusPercent={updateBonusPercent}
                      yearlyViewMode={effectiveYearlyViewMode}
                      yearlyAccountView={yearlyAccountView}
                      cumulativeByYear={
                        isEsetiView ? cumulativeByYearEseti : yearlyAccountView === "summary" ? cumulativeByYearSummary : cumulativeByYear
                      }
                      shouldApplyTaxCreditPenalty={shouldApplyTaxCreditPenalty}
                      isTaxBonusSeparateAccount={isTaxBonusSeparateAccount}
                      getRealValueForYear={getRealValueForYear}
                      // </CHANGE>
                    />
                  ))}
                  {/* Show more button */}
                  {visibleYears < (adjustedResults?.yearlyBreakdown?.length ?? 0) && (
                    <Button
                      variant="outline"
                      className="w-full h-11 mt-2 bg-transparent"
                      onClick={() =>
                        setVisibleYears((prev) =>
                          Math.min(prev + 10, adjustedResults?.yearlyBreakdown?.length ?? prev + 10),
                        )
                      }
                    >
                      Még {Math.min(10, (adjustedResults?.yearlyBreakdown?.length ?? 0) - visibleYears)} év mutatása
                    </Button>
                  )}

                  {visibleYears > 10 && (
                    <Button
                      variant="ghost"
                      className="w-full h-11 mt-2 text-muted-foreground"
                      onClick={() => setVisibleYears(10)}
                    >
                      Kevesebb mutatása
                    </Button>
                  )}
                </div>

                {/* Desktop table */}
                <div className={`hidden md:block overflow-x-auto ${isYearlyMuted ? "opacity-60" : ""}`}>
                  <table className="w-full min-w-[1100px] text-sm yearly-breakdown-table yearly-breakdown-table--auto">
                    <colgroup>
                      <col style={{ width: "60px" }} />
                      {!isYearlyReadOnly && <col style={{ width: "70px" }} />}
                      <col style={{ width: "120px" }} />
                      <col style={{ width: "100px" }} />
                      <col style={{ width: "100px" }} />
                      {showCostBreakdown && <col style={{ width: "110px" }} />}
                      {showCostBreakdown && !(isAccountSplitOpen && effectiveYearlyViewMode === "total") && (
                        <col style={{ width: "90px" }} />
                      )}
                      {showCostBreakdown && <col style={{ width: "120px" }} />}
                      {showCostBreakdown && <col style={{ width: "120px" }} />}
                      <col style={{ width: "100px" }} />
                      {showBonusBreakdown && <col style={{ width: "120px" }} />}
                      {showBonusBreakdown && <col style={{ width: "120px" }} />}
                      {enableRiskInsurance && <col style={{ width: "100px" }} />}
                      {totalExtraServicesCost > 0 && <col style={{ width: "100px" }} />}
                      {inputs.enableTaxCredit && <col style={{ width: "110px" }} />}
                      <col style={{ width: "110px" }} />
                      <col style={{ width: "1%" }} />
                    </colgroup>
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-3 text-center font-medium w-16 sticky left-0 z-20 bg-background/95">Év</th>
                        {!isYearlyReadOnly && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap">Index (%)</th>
                        )}
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap">
                          {isEsetiView ? (
                            <div className="flex items-center justify-end">
                              <Select
                                value={esetiFrequency}
                                onValueChange={(value) => {
                                  const nextFrequency = value as PaymentFrequency
                                  setEsetiFrequency(nextFrequency)
                                  setEsetiBaseInputs((prev) => ({ ...prev, frequency: nextFrequency }))
                                }}
                                disabled={isYearlyReadOnly}
                              >
                                <SelectTrigger className="h-5 w-auto border-0 bg-transparent px-0 py-0 text-sm font-medium shadow-none ring-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0 data-[size=default]:h-5 [&>svg]:size-3.5 [&>svg]:opacity-50">
                                  <span className="leading-none">Befizetés/év</span>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="éves">Éves</SelectItem>
                                  <SelectItem value="féléves">Féléves</SelectItem>
                                  <SelectItem value="negyedéves">Negyedéves</SelectItem>
                                  <SelectItem value="havi">Havi</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            "Befizetés/év"
                          )}
                        </th>
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap">Hozam</th>
                        <th className="py-3 px-2 text-right font-medium">
                          <button
                            type="button"
                            onClick={() => setShowCostBreakdown((prev) => !prev)}
                            className="text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                          >
                            Költség
                          </button>
                        </th>
                        {showCostBreakdown && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600">Admin. díj</th>
                        )}
                        {showCostBreakdown && !(isAccountSplitOpen && effectiveYearlyViewMode === "total") && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600">Vagyon (%)</th>
                        )}
                        {showCostBreakdown && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600">
                            Plusz költség (Ft)
                          </th>
                        )}
                        {showCostBreakdown && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-red-600">
                            Akkvizíciós költség
                          </th>
                        )}
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setShowBonusBreakdown((prev) => !prev)}
                            className="text-emerald-600 hover:text-emerald-700 transition-colors whitespace-nowrap"
                          >
                            Bónusz
                          </button>
                        </th>
                        {showBonusBreakdown && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600">
                            Vagyon bónusz (%)
                          </th>
                        )}
                        {showBonusBreakdown && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap text-emerald-600">
                            Bónusz (Ft)
                          </th>
                        )}
                        {/* </CHANGE> */}
                        {enableRiskInsurance && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap">Kock.bizt.</th>
                        )}
                        {/* Display extra services cost column if totalExtraServicesCost > 0 */}
                        {totalExtraServicesCost > 0 && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap">Extrák</th>
                        )}
                        {inputs.enableTaxCredit && (
                          <th className="py-3 px-3 text-right font-medium whitespace-nowrap w-28 min-w-28">Adójóv.</th>
                        )}
                        <th className="py-3 px-3 text-right font-medium whitespace-nowrap w-28 min-w-28">Kivonás</th>
                        <th className="py-3 pl-1 pr-[2ch] text-right text-xs md:text-sm font-semibold sticky right-0 z-20 bg-background/95 w-[1%] whitespace-nowrap">
                          {enableNetting ? "Nettó egyenleg" : "Egyenleg"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className={isYearlyReadOnly ? "pointer-events-none" : undefined}>
                  {(adjustedResults?.yearlyBreakdown ?? []).map((row, index) => {
                        if (!row) return null
                        const activePlanIndex = (isEsetiView ? esetiPlanIndex : planIndex) ?? {}
                        const activePlanPayment = (isEsetiView ? esetiPlanPayment : planPayment) ?? {}
                        const currentIndex = isEsetiView
                          ? esetiIndexByYear[row.year] ?? activePlanIndex[row.year] ?? 0
                          : activePlanIndex[row.year] ?? 0
                        const currentPayment = isEsetiView
                          ? esetiPaymentByYear[row.year] ?? activePlanPayment[row.year] ?? 0
                          : row.yearlyPayment ?? activePlanPayment[row.year] ?? 0
                        const activeWithdrawalByYear = isEsetiView ? esetiWithdrawalByYear : withdrawalByYear
                        const currentWithdrawal = activeWithdrawalByYear[row.year] || 0
                        const updateIndexForView = isEsetiView ? updateEsetiIndex : updateIndex
                        const updatePaymentForView = isEsetiView ? updateEsetiPayment : updatePayment
                        const updateWithdrawalForView = isEsetiView ? updateEsetiWithdrawal : updateWithdrawal
                        const isAllianzProduct =
                          selectedInsurer === "Allianz" &&
                          (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram")
                        const isAllianzBonusProduct =
                          selectedInsurer === "Allianz" && selectedProduct === "allianz_bonusz_eletprogram"
                        const monthlyAdminFee =
                          isAllianzProduct && inputs.currency === "EUR" ? 3.3 : isAllianzProduct ? 990 : 0
                        const getAdminFeeForYear = (targetYear: number) =>
                          isAllianzProduct
                            ? targetYear === 1
                              ? 0
                              : monthlyAdminFee * 12
                            : (inputs.yearlyFixedManagementFeeAmount ?? 0)
                        const adminFeeYear = getAdminFeeForYear(row.year)
                        const adminFeeDisplay =
                          yearlyAggregationMode === "sum"
                            ? Array.from({ length: row.year }, (_, idx) => getAdminFeeForYear(idx + 1)).reduce(
                                (total, value) => total + value,
                                0,
                              )
                            : adminFeeYear
                        const acquisitionCostRate = isAllianzBonusProduct ? 0.79 : 0.33
                        const acquisitionCostYear =
                          isAllianzProduct && row.year === 1 ? row.yearlyPayment * acquisitionCostRate : 0
                        const currentTaxCreditLimit = taxCreditLimitByYear[row.year]
                        const baseTaxCreditCapForYear =
                          currentTaxCreditLimit ?? inputs.taxCreditCapPerYear ?? Number.POSITIVE_INFINITY
                        const remainingTaxCreditCapForYear = isEsetiView
                          ? Math.max(0, baseTaxCreditCapForYear - (mainTaxCreditByYear[row.year] ?? 0))
                          : baseTaxCreditCapForYear
                        const remainingTaxCreditCapDisplayForYear = convertForDisplay(
                          remainingTaxCreditCapForYear,
                          results.currency,
                          displayCurrency,
                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                        )
                        const effectiveTaxCreditAmountForRow = Math.min(
                          taxCreditAmountByYear[row.year] ?? row.taxCreditForYear,
                          remainingTaxCreditCapForYear,
                        )

                        const isIndexModified = (isEsetiView ? esetiIndexByYear : indexByYear)[row.year] !== undefined
                        const isPaymentModified = (isEsetiView ? esetiPaymentByYear : paymentByYear)[row.year] !== undefined
                        const isWithdrawalModified = activeWithdrawalByYear[row.year] !== undefined
                        const isTaxCreditLimited = currentTaxCreditLimit !== undefined

                        const netData = yearlyNetCalculations[index]
                        const sourceCumulativeByYear = isEsetiView
                          ? cumulativeByYearEseti
                          : yearlyAccountView === "summary"
                            ? cumulativeByYearSummary
                            : cumulativeByYear
                        const sourceRow = yearlyAggregationMode === "sum" ? sourceCumulativeByYear[row.year] ?? row : row
                        const displayPaymentValue = isEsetiView ? currentPayment : row.yearlyPayment ?? currentPayment

                        let displayData = {
                          endBalance: sourceRow.endBalance,
                          interestForYear: sourceRow.interestForYear,
                          costForYear: sourceRow.costForYear,
                          assetBasedCostForYear: sourceRow.assetBasedCostForYear,
                          plusCostForYear: sourceRow.plusCostForYear,
                          bonusForYear: sourceRow.bonusForYear,
                          wealthBonusForYear: sourceRow.wealthBonusForYear,
                        }

                        if (effectiveYearlyViewMode === "client") {
                          displayData = {
                            endBalance: sourceRow.client.endBalance,
                            interestForYear: sourceRow.client.interestForYear,
                            costForYear: sourceRow.client.costForYear,
                            assetBasedCostForYear: sourceRow.client.assetBasedCostForYear,
                            plusCostForYear: sourceRow.client.plusCostForYear,
                            bonusForYear: sourceRow.client.bonusForYear,
                            wealthBonusForYear: sourceRow.client.wealthBonusForYear,
                          }
                        } else if (effectiveYearlyViewMode === "invested") {
                          displayData = {
                            endBalance: sourceRow.invested.endBalance,
                            interestForYear: sourceRow.invested.interestForYear,
                            costForYear: sourceRow.invested.costForYear,
                            assetBasedCostForYear: sourceRow.invested.assetBasedCostForYear,
                            plusCostForYear: sourceRow.invested.plusCostForYear,
                            bonusForYear: sourceRow.invested.bonusForYear,
                            wealthBonusForYear: sourceRow.invested.wealthBonusForYear,
                          }
                        } else if (effectiveYearlyViewMode === "taxBonus") {
                          // Use taxBonus breakdown for taxBonus view mode
                          displayData = {
                            endBalance: sourceRow.taxBonus.endBalance,
                            interestForYear: sourceRow.taxBonus.interestForYear,
                            costForYear: sourceRow.taxBonus.costForYear,
                            assetBasedCostForYear: sourceRow.taxBonus.assetBasedCostForYear,
                            plusCostForYear: sourceRow.taxBonus.plusCostForYear,
                            bonusForYear: sourceRow.taxBonus.bonusForYear,
                            wealthBonusForYear: sourceRow.taxBonus.wealthBonusForYear,
                          }
                          // </CHANGE>
                        }

                        if (isEsetiView) {
                          displayData = {
                            ...displayData,
                            costForYear: 0,
                            assetBasedCostForYear: 0,
                            plusCostForYear: 0,
                            bonusForYear: 0,
                            wealthBonusForYear: 0,
                          }
                        }

                        const cumulativeRow = sourceCumulativeByYear[row.year] ?? row
                        let displayBalance = enableNetting ? netData.netBalance : displayData.endBalance

                        const taxCreditCumulativeForRow =
                          sourceCumulativeByYear[row.year]?.taxCreditForYear ?? sourceRow.taxCreditForYear ?? 0
                        const taxCreditPenaltyForRow = shouldApplyTaxCreditPenalty ? taxCreditCumulativeForRow * 1.2 : 0
                        let displayBalanceWithPenalty = Math.max(0, displayBalance - taxCreditPenaltyForRow)
                        const effectiveWithdrawn =
                          yearlyAggregationMode === "sum"
                            ? sourceRow.withdrawalForYear ?? currentWithdrawal
                            : row.withdrawalForYear ?? currentWithdrawal
                        const preWithdrawalBalanceWithPenalty = displayBalanceWithPenalty + effectiveWithdrawn
                        const maxWithdrawalDisplay = convertForDisplay(
                          preWithdrawalBalanceWithPenalty,
                          results.currency,
                          displayCurrency,
                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                        )
                        displayBalanceWithPenalty = Math.max(0, preWithdrawalBalanceWithPenalty - effectiveWithdrawn)
                        const applyRealValueForYear = (value: number) => getRealValueForYear(value, row.year)
                        // </CHANGE>

                        return (
                          <tr key={row.year} className="border-b hover:bg-muted/50">
                            <td className="py-2 px-3 text-center font-medium sticky left-0 z-10 bg-background/95">{row.year}</td>

                            {!isYearlyReadOnly && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      editingFields[`index-${row.year}`] ? String(currentIndex) : formatNumber(currentIndex)
                                    }
                                    onFocus={() => setFieldEditing(`index-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`index-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed)) updateIndexForView(row.year, parsed)
                                    }}
                                    className={`w-14 h-8 text-right tabular-nums ${isIndexModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}

                            <td className="py-2 px-3 text-right align-top">
                              <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    editingFields[`payment-${row.year}`]
                                      ? String(
                                          Math.round(
                                            convertForDisplay(
                                              displayPaymentValue,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                      : formatNumber(
                                          Math.round(
                                            convertForDisplay(
                                              displayPaymentValue,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                  }
                                  onFocus={() => setFieldEditing(`payment-${row.year}`, true)}
                                  onBlur={() => setFieldEditing(`payment-${row.year}`, false)}
                                  onChange={(e) => {
                                    if (e.target.value.trim() === "") {
                                      updatePaymentForView(row.year, 0)
                                      return
                                    }
                                    const parsed = parseNumber(e.target.value)
                                    if (!isNaN(parsed)) updatePaymentForView(row.year, parsed)
                                  }}
                                  className={`w-full h-8 text-right tabular-nums ${isPaymentModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                />
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  {formatValue(applyRealValueForYear(sourceRow.totalContributions), displayCurrency)}
                                </p>
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap align-top">
                              <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(applyRealValueForYear(displayData.interestForYear), displayCurrency)}
                              </div>
                            </td>
                            <td className="py-2 px-3 text-right text-destructive tabular-nums whitespace-nowrap align-top">
                              <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(applyRealValueForYear(displayData.costForYear), displayCurrency)}
                              </div>
                            </td>
                            {showCostBreakdown && (
                              <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap align-top text-red-600">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(isEsetiView ? 0 : adminFeeDisplay),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && !(isAccountSplitOpen && effectiveYearlyViewMode === "total") && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={
                                      isEsetiView
                                        ? "0"
                                        : editingFields[`assetCost-${row.year}`]
                                          ? assetCostInputByYear[row.year] ?? ""
                                          : (assetCostPercentByYear[row.year] ?? inputs.assetBasedFeePercent)
                                              .toLocaleString("hu-HU", { maximumFractionDigits: 2 })
                                              .replace(/\u00A0/g, " ")
                                    }
                                    onFocus={() => {
                                      setFieldEditing(`assetCost-${row.year}`, true)
                                      setAssetCostInputByYear((prev) => ({
                                        ...prev,
                                        [row.year]: String(
                                          isEsetiView ? 0 : assetCostPercentByYear[row.year] ?? inputs.assetBasedFeePercent,
                                        ),
                                      }))
                                    }}
                                    onBlur={() => {
                                      setFieldEditing(`assetCost-${row.year}`, false)
                                      setAssetCostInputByYear((prev) => {
                                        const updated = { ...prev }
                                        delete updated[row.year]
                                        return updated
                                      })
                                    }}
                                    onChange={(e) => {
                                      const raw = e.target.value
                                      setAssetCostInputByYear((prev) => ({ ...prev, [row.year]: raw }))
                                      const val = parseNumber(e.target.value)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        updateAssetCostPercent(row.year, val)
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    className={`w-20 h-8 text-right tabular-nums text-red-600 ${assetCostPercentByYear[row.year] !== undefined ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums">
                                    {formatValue(
                                      applyRealValueForYear(
                                        isEsetiView
                                          ? 0
                                          : effectiveYearlyViewMode === "total"
                                            ? sourceRow.assetBasedCostForYear
                                            : displayData.assetBasedCostForYear,
                                      ),
                                      displayCurrency,
                                    )}
                                  </p>
                                </div>
                              </td>
                            )}

                            {showCostBreakdown && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      editingFields[`plusCost-${row.year}`]
                                        ? String(
                                            Math.round(
                                              convertForDisplay(
                                                isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                        : formatNumber(
                                            Math.round(
                                              convertForDisplay(
                                                isEsetiView ? 0 : plusCostByYear[row.year] ?? 0,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                    }
                                    onFocus={() => setFieldEditing(`plusCost-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`plusCost-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed) && parsed >= 0) {
                                        const calcValue = convertFromDisplayToCalc(
                                          parsed,
                                          results.currency,
                                          displayCurrency,
                                          inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                        )
                                        updatePlusCost(row.year, calcValue)
                                      }
                                    }}
                                    className={`w-full h-8 text-right tabular-nums text-red-600 ${plusCostByYear[row.year] !== undefined && plusCostByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}
                            {showCostBreakdown && (
                              <td className="py-2 px-3 text-right tabular-nums whitespace-nowrap align-top text-red-600">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(isEsetiView ? 0 : acquisitionCostYear),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}
                            <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                              <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(
                                  applyRealValueForYear(
                                    (displayData.bonusForYear ?? 0) + (displayData.wealthBonusForYear ?? 0),
                                  ),
                                  displayCurrency,
                                )}
                              </div>
                            </td>
                            {showBonusBreakdown && (
                              <td className="py-2 px-3 text-right align-top">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="decimal"
                                    value={isEsetiView ? 0 : bonusPercentByYear[row.year] ?? 0}
                                    onChange={(e) => {
                                      const val = parseNumber(e.target.value)
                                      if (!isNaN(val) && val >= 0 && val <= 100) {
                                        updateBonusPercent(row.year, val)
                                      }
                                    }}
                                    min={0}
                                    max={100}
                                    step={0.1}
                                    className={`w-full h-8 text-right tabular-nums text-emerald-600 ${bonusPercentByYear[row.year] !== undefined && bonusPercentByYear[row.year] > 0 ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}
                            {showBonusBreakdown && (
                              <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400 align-top whitespace-nowrap">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(applyRealValueForYear(displayData.wealthBonusForYear), displayCurrency)}
                                </div>
                              </td>
                            )}
                            {/* </CHANGE> */}
                            {enableRiskInsurance && (
                              <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400 tabular-nums align-top">
                                <div className="flex items-center justify-end min-h-[44px]">
                                {formatValue(
                                  applyRealValueForYear(sourceRow.riskInsuranceCostForYear || 0),
                                  displayCurrency,
                                )}
                                </div>
                              </td>
                            )}
                            {/* Display extra services cost if > 0 */}
                            {totalExtraServicesCost > 0 && (
                              <td className="py-2 px-3 text-right text-purple-600 dark:text-purple-400 tabular-nums align-top">
                                <div className="flex items-center justify-end min-h-[44px]">
                                  {formatValue(
                                    applyRealValueForYear(extraServicesCostsByYear[row.year] || 0),
                                    displayCurrency,
                                  )}
                                </div>
                              </td>
                            )}

                            {inputs.enableTaxCredit && (
                              <td className="py-2 px-3 text-right align-top w-28 min-w-28">
                                <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                  <Input
                                    type="text"
                                    inputMode="numeric"
                                    value={
                                      editingFields[`taxCreditAmount-${row.year}`]
                                        ? String(
                                            Math.round(
                                              convertForDisplay(
                                                effectiveTaxCreditAmountForRow,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                        : formatNumber(
                                            Math.round(
                                              convertForDisplay(
                                                effectiveTaxCreditAmountForRow,
                                                results.currency,
                                                displayCurrency,
                                                inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                              ),
                                            ),
                                          )
                                    }
                                    onFocus={() => setFieldEditing(`taxCreditAmount-${row.year}`, true)}
                                    onBlur={() => setFieldEditing(`taxCreditAmount-${row.year}`, false)}
                                    onChange={(e) => {
                                      const parsed = parseNumber(e.target.value)
                                      if (!isNaN(parsed) && parsed >= 0) {
                                        const capped = Math.min(parsed, remainingTaxCreditCapDisplayForYear)
                                        updateTaxCreditAmount(row.year, capped, remainingTaxCreditCapForYear)
                                      }
                                    }}
                                    className={`w-full h-8 text-right tabular-nums ${taxCreditAmountByYear[row.year] !== undefined ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                  />
                                  <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                                </div>
                              </td>
                            )}

                            <td className="py-2 px-3 text-right align-top w-28 min-w-28">
                              <div className="flex flex-col items-end gap-1 min-h-[44px]">
                                <Input
                                  type="text"
                                  inputMode="numeric"
                                  value={
                                    editingFields[`withdrawal-${row.year}`]
                                      ? String(
                                          Math.round(
                                            convertForDisplay(
                                              currentWithdrawal,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                      : formatNumber(
                                          Math.round(
                                            convertForDisplay(
                                              currentWithdrawal,
                                              results.currency,
                                              displayCurrency,
                                              inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                            ),
                                          ),
                                        )
                                  }
                                  onFocus={() => setFieldEditing(`withdrawal-${row.year}`, true)}
                                  onBlur={() => setFieldEditing(`withdrawal-${row.year}`, false)}
                                  onChange={(e) => {
                                    const parsed = parseNumber(e.target.value)
                                    if (!isNaN(parsed)) {
                                      const capped = Math.min(parsed, maxWithdrawalDisplay)
                                      updateWithdrawalForView(row.year, capped)
                                    }
                                  }}
                                  className={`w-full h-8 text-right tabular-nums ${isWithdrawalModified ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300" : ""}`}
                                />
                                <p className="text-xs text-muted-foreground tabular-nums opacity-0">0</p>
                              </div>
                            </td>
                            <td className="py-2 pl-1 pr-[2ch] text-right text-xs md:text-sm font-semibold tabular-nums sticky right-0 z-10 bg-background/95 w-[1%] align-top">
                              {(isAccountSplitOpen || isRedemptionOpen) &&
                              row.endingInvestedValue !== undefined &&
                              row.endingClientValue !== undefined ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className="cursor-help inline-flex justify-end">
                                        <span className="inline-flex w-fit whitespace-nowrap leading-tight text-right">
                                          {formatValue(
                                            applyRealValueForYear(displayBalanceWithPenalty),
                                            displayCurrency,
                                          ).replace(/ /g, "\u00A0")}
                                        </span>
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent side="left">
                                      <div className="space-y-1 text-xs">
                                        {/* CASE A: Split is open - show full breakdown */}
                                        {isAccountSplitOpen && (
                                          <>
                                            <div>
                                              Lejárati többletdíj:{" "}
                                              {formatValue(
                                                applyRealValueForYear(row.endingInvestedValue),
                                                displayCurrency,
                                              )}
                                            </div>
                                            <div>
                                              Ügyfélérték:{" "}
                                              {formatValue(
                                                applyRealValueForYear(row.endingClientValue),
                                                displayCurrency,
                                              )}
                                            </div>
                                            {isTaxBonusSeparateAccount && row.endingTaxBonusValue > 0 && (
                                              <div>
                                                Adójóváírás:{" "}
                                                {formatValue(
                                                  applyRealValueForYear(row.endingTaxBonusValue),
                                                  displayCurrency,
                                                )}
                                              </div>
                                            )}
                                            {/* </CHANGE> */}
                                            <div className="pt-1 border-t">
                                              Összesen:{" "}
                                              {formatValue(
                                                applyRealValueForYear(displayBalanceWithPenalty),
                                                displayCurrency,
                                              )}
                                            </div>
                                            {isRedemptionOpen && row.surrenderCharge > 0 && (
                                              <>
                                                <div className="text-orange-600 dark:text-orange-400 pt-1 border-t">
                                                  Visszavásárlási költség:{" "}
                                                  {formatValue(
                                                    applyRealValueForYear(row.surrenderCharge),
                                                    displayCurrency,
                                                  )}
                                                </div>
                                                <div className="text-orange-600 dark:text-orange-400">
                                                  Visszavásárlási érték:{" "}
                                                  {formatValue(
                                                    applyRealValueForYear(row.surrenderValue),
                                                    displayCurrency,
                                                  )}
                                                </div>
                                              </>
                                            )}
                                          </>
                                        )}
                                        {/* CASE B: Split is closed but redemption is open - show only redemption value */}
                                        {!isAccountSplitOpen && isRedemptionOpen && row.surrenderCharge > 0 && (
                                          <div className="text-orange-600 dark:text-orange-400">
                                            Visszavásárlási érték:{" "}
                                            {formatValue(
                                              applyRealValueForYear(row.surrenderValue),
                                              displayCurrency,
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                // CASE C: Both closed - plain text, no tooltip
                                <div className="flex items-center justify-end min-h-[44px]">
                                  <span className="inline-flex w-fit whitespace-nowrap leading-tight text-right">
                                    {formatValue(
                                      applyRealValueForYear(displayBalanceWithPenalty),
                                      displayCurrency,
                                    ).replace(/ /g, "\u00A0")}
                                  </span>
                                </div>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
