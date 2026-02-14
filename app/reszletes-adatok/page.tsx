"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { useCalculatorData } from "@/lib/calculator-context"
import { convertForDisplay } from "@/lib/currency-conversion"
import { formatNumber } from "@/lib/format-number"
import { buildYearlyPlan } from "@/lib/plan"
import { calculate, type InputsDaily, type Currency, type ProductId } from "@/lib/engine"

type StoredInputs = InputsDaily & {
  regularPayment: number
  annualIndexPercent: number
  keepYearlyPayment: boolean
  eurToHufRate: number
  usdToHufRate: number
  calculationMode: "simple" | "calendar"
  startDate: string
  bonusPercent: number
  bonusStartYear: number
  bonusStopYear: number
  investedShareDefaultPercent: number
}

type StoredState = {
  inputs: StoredInputs
  durationUnit: "year" | "month" | "day"
  durationValue: number
  displayCurrency: Currency
  enableRealValue: boolean
  inflationRate: number
  indexByYear: Record<number, number>
  paymentByYear: Record<number, number>
  withdrawalByYear: Record<number, number>
  taxCreditAmountByYear: Record<number, number>
  taxCreditLimitByYear: Record<number, number>
  investedShareByYear: Record<number, number>
  redemptionFeeByYear: Record<number, number>
  assetCostPercentByYear: Record<number, number>
  plusCostByYear: Record<number, number>
  bonusPercentByYear: Record<number, number>
  isAccountSplitOpen: boolean
  isRedemptionOpen: boolean
  isTaxBonusSeparateAccount: boolean
  selectedInsurer: string | null
  selectedProduct: string | null
  selectedProductVariant: string | null
}

export default function ReszletesAdatokPage() {
  const router = useRouter()
  const { data: contextData, isHydrated } = useCalculatorData()

  const [storedState, setStoredState] = useState<StoredState | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") return

    const readJSON = <T,>(key: string, fallback: T): T => {
      try {
        const raw = sessionStorage.getItem(key)
        if (!raw) return fallback
        return JSON.parse(raw) as T
      } catch {
        return fallback
      }
    }

    try {
      const defaultInputs: StoredInputs = {
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
        yearlyManagementFeePercent: 0,
        yearlyFixedManagementFeeAmount: 0,
        managementFeeStartYear: 1,
        managementFeeStopYear: 0,
        assetBasedFeePercent: 0,
        bonusMode: "none",
        bonusOnContributionPercent: 0,
        bonusFromYear: 1,
        enableTaxCredit: false,
        taxCreditRatePercent: 20,
        taxCreditCapPerYear: 130000,
        taxCreditStartYear: 1,
        taxCreditEndYear: undefined,
        stopTaxCreditAfterFirstWithdrawal: false,
        taxCreditYieldPercent: 12,
        calculationMode: "simple",
        startDate: new Date().toISOString().split("T")[0],
        bonusPercent: 0,
        bonusStartYear: 1,
        bonusStopYear: 0,
        investedShareDefaultPercent: 100,
        managementFeeFrequency: "éves",
        managementFeeValueType: "percent",
        managementFeeValue: 0,
        yearsPlanned: 0,
        yearlyPaymentsPlan: [],
        yearlyWithdrawalsPlan: [],
      }

      const storedInputs = readJSON<Partial<InputsDaily>>("calculator-inputs", {})
      const durationUnit = readJSON<"year" | "month" | "day">("calculator-durationUnit", "year")
      const durationValue = readJSON<number>("calculator-durationValue", 10)
      const displayCurrency = readJSON<Currency>("calculator-displayCurrency", "HUF")
      const enableRealValue = readJSON<boolean>("calculator-enableRealValue", false)
      const inflationRate = readJSON<number>("calculator-inflationRate", 3)

      setStoredState({
        inputs: { ...defaultInputs, ...storedInputs },
        durationUnit,
        durationValue,
        displayCurrency,
        enableRealValue,
        inflationRate,
        indexByYear: readJSON("calculator-indexByYear", {}),
        paymentByYear: readJSON("calculator-paymentByYear", {}),
        withdrawalByYear: readJSON("calculator-withdrawalByYear", {}),
        taxCreditAmountByYear: readJSON("calculator-taxCreditAmountByYear", {}),
        taxCreditLimitByYear: readJSON("calculator-taxCreditLimitByYear", {}),
        investedShareByYear: readJSON("calculator-investedShareByYear", {}),
        redemptionFeeByYear: readJSON("calculator-redemptionFeeByYear", {}),
        assetCostPercentByYear: readJSON("calculator-assetCostPercentByYear", {}),
        plusCostByYear: readJSON("calculator-plusCostByYear", {}),
        bonusPercentByYear: readJSON("calculator-bonusPercentByYear", {}),
        isAccountSplitOpen: readJSON("isAccountSplitOpen", false),
        isRedemptionOpen: readJSON("isRedemptionOpen", false),
        isTaxBonusSeparateAccount: readJSON("isTaxBonusSeparateAccount", false),
        selectedInsurer: readJSON("calculator-selectedInsurer", null),
        selectedProduct: readJSON("calculator-selectedProduct", null),
        selectedProductVariant: readJSON("calculator-selectedProductVariant", null),
      })
    } catch (e) {
      console.error("[v0] Failed to load data from sessionStorage:", e)
    }
  }, [])

  const totalYears = useMemo(() => {
    if (!storedState) return 10
    const totalDays =
      storedState.durationUnit === "year"
        ? storedState.durationValue * 365
        : storedState.durationUnit === "month"
          ? Math.round(storedState.durationValue * (365 / 12))
          : storedState.durationValue
    return Math.max(1, Math.ceil(totalDays / 365))
  }, [storedState])

  const productId = useMemo<ProductId>(() => {
    if (!storedState) return "dm-pro"
    const selectedInsurer = storedState.selectedInsurer ?? contextData?.selectedInsurer ?? null
    const selectedProduct = storedState.selectedProduct ?? contextData?.selectedProduct ?? null
    if (selectedInsurer === "Alfa" && selectedProduct === "alfa_exclusive_plus") {
      return "alfa-exclusive-plus"
    }
    if (
      selectedInsurer === "Allianz" ||
      (selectedProduct && selectedProduct.includes("allianz"))
    ) {
      if (selectedProduct === "allianz_eletprogram" || selectedProduct === "allianz_bonusz_eletprogram") {
        return "allianz-eletprogram"
      }
    }
    return "dm-pro"
  }, [storedState, contextData])

  const plan = useMemo(() => {
    if (!storedState) return null
    const periodsPerYear =
      storedState.inputs.frequency === "havi"
        ? 12
        : storedState.inputs.frequency === "negyedéves"
          ? 4
          : storedState.inputs.frequency === "féléves"
            ? 2
            : 1

    const baseYear1Payment = storedState.inputs.keepYearlyPayment
      ? storedState.inputs.regularPayment * 12
      : storedState.inputs.regularPayment * periodsPerYear

    return buildYearlyPlan({
      years: totalYears,
      baseYear1Payment,
      baseAnnualIndexPercent: storedState.inputs.annualIndexPercent,
      indexByYear: storedState.indexByYear,
      paymentByYear: storedState.paymentByYear,
      withdrawalByYear: storedState.withdrawalByYear,
    })
  }, [storedState, totalYears])

  const monthlyData = useMemo(() => {
    if (!storedState || !plan) return []

    const calcCurrency = (storedState.inputs.currency ?? contextData?.currency ?? "HUF") as Currency
    const isAllianzProduct = productId === "allianz-eletprogram"
    const effectiveProductVariant =
      storedState.selectedProduct === "alfa_exclusive_plus"
        ? storedState.selectedProductVariant === "alfa_exclusive_plus_tr08"
          ? "alfa_exclusive_plus_tr08"
          : "alfa_exclusive_plus_ny05"
        : (storedState.selectedProduct ?? contextData?.selectedProduct ?? undefined)
    const adminFeeMonthlyAmount = isAllianzProduct ? (calcCurrency === "EUR" ? 3.3 : 990) : undefined

    const dailyInputs: InputsDaily = {
      ...storedState.inputs,
      currency: calcCurrency,
      productVariant: effectiveProductVariant,
      durationUnit: storedState.durationUnit,
      durationValue: storedState.durationValue,
      yearsPlanned: totalYears,
      yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
      yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
      assetCostPercentByYear: storedState.assetCostPercentByYear,
      plusCostByYear: storedState.plusCostByYear,
      bonusPercentByYear: storedState.bonusPercentByYear,
      investedShareByYear: storedState.investedShareByYear,
      redemptionFeeByYear: storedState.redemptionFeeByYear,
      redemptionEnabled: storedState.isRedemptionOpen,
      isAccountSplitOpen: storedState.isAccountSplitOpen,
      isTaxBonusSeparateAccount: storedState.isTaxBonusSeparateAccount,
      taxCreditAmountByYear: storedState.taxCreditAmountByYear,
      taxCreditLimitByYear: storedState.taxCreditLimitByYear,
      adminFeeMonthlyAmount,
    }

    const results = calculate(productId, dailyInputs)
    return results.monthlyBreakdown
  }, [storedState, plan, totalYears, productId, contextData?.selectedProduct])

  const formatValue = (value: number, currency: Currency) => {
    const displayValue = convertForDisplay(
      value,
      storedState?.inputs.currency || "HUF",
      currency,
      storedState?.inputs.currency === "USD" ? storedState?.inputs.usdToHufRate : storedState?.inputs.eurToHufRate,
    )
    const formatGroupedInt = (num: number) =>
      Math.round(num)
        .toString()
        .replace(/\B(?=(\d{3})+(?!\d))/g, " ")
    if (currency === "EUR") {
      const formatted = displayValue
        .toLocaleString("hu-HU", { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true })
        .replace(/\u00A0/g, " ")
      return `${formatted}\u00A0€`
    }
    if (currency === "USD") {
      const formatted = formatGroupedInt(displayValue)
      return `${formatted}\u00A0$`
    }
    const formatted = formatGroupedInt(displayValue)
    return `${formatted}\u00A0Ft`
  }

  const formatValueRounded = (value: number, currency: Currency) => {
    const displayValue = convertForDisplay(
      value,
      storedState?.inputs.currency || "HUF",
      currency,
      storedState?.inputs.currency === "USD" ? storedState?.inputs.usdToHufRate : storedState?.inputs.eurToHufRate,
    )
    return formatNumber(Math.round(displayValue))
  }

  const applyRealValue = (value: number, monthsFromStart: number) => {
    if (!storedState?.enableRealValue) return value
    const yearsFromStart = monthsFromStart / 12
    const inflationMultiplier = Math.pow(1 + storedState.inflationRate / 100, yearsFromStart)
    if (!isFinite(inflationMultiplier) || inflationMultiplier <= 0) return value
    return value / inflationMultiplier
  }

  if (!storedState) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Adatok betöltése...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/#yearly-table")}
                className="h-9 px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Vissza
              </Button>
              <h1 className="text-xl md:text-2xl font-bold">Részletes adatok</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardContent className="p-4">
            <div className="max-h-[calc(100vh-180px)] overflow-auto">
              <table className="w-full border-separate border-spacing-0 text-sm whitespace-nowrap">
                <thead>
                  <tr className="bg-blue-50 text-slate-900">
                    <th className="border border-gray-200 py-2 px-3 text-left font-semibold bg-blue-50 sticky top-0 left-0 z-30 w-[60px] min-w-[60px]">
                      Év
                    </th>
                    <th className="border border-gray-200 py-2 px-3 text-left font-semibold bg-blue-50 sticky top-0 left-[60px] z-30 w-[80px] min-w-[80px]">
                      Hónap
                    </th>
                    <th className="border border-gray-200 py-2 px-3 text-left font-semibold bg-blue-50 sticky top-0 left-[140px] z-30 w-[100px] min-w-[100px]">
                      Hónapok
                    </th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20">Befizetés</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-red-600">Admin díj</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-red-600">Akkvizíciós költség</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-purple-600">Kocka díj</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-red-600">Vagyonarányos költség</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-red-600">Plusz költség</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-emerald-600">Bónusz</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20 text-emerald-600">Adójóv.</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20">Hozam</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20">Költség összesen</th>
                    <th className="border border-gray-200 py-2 px-3 text-right font-semibold bg-blue-50 sticky top-0 z-20">Egyenleg</th>
                  </tr>
                </thead>
                <tbody>
                {monthlyData.map((row, index) => {
                  const isLastMonthOfYear = row.month === 12
                  const isYearColumn = true // Year column is always highlighted

                  return (
                    <tr key={index} className={isLastMonthOfYear ? "bg-yellow-200 dark:bg-yellow-900/30" : ""}>
                      <td
                        className={`border border-gray-300 py-2 px-3 text-left sticky left-0 z-20 w-[60px] min-w-[60px] ${
                          isLastMonthOfYear
                            ? "bg-yellow-200 dark:bg-yellow-900/30"
                            : isYearColumn
                              ? "bg-blue-100 dark:bg-blue-900/30 font-medium"
                              : "bg-background"
                        }`}
                      >
                        {row.year}
                      </td>
                      <td className={`border border-gray-300 py-2 px-3 text-left sticky left-[60px] z-20 w-[80px] min-w-[80px] ${isLastMonthOfYear ? "bg-yellow-200 dark:bg-yellow-900/30" : "bg-background"}`}>
                        {row.month}
                      </td>
                      <td className={`border border-gray-300 py-2 px-3 text-left sticky left-[140px] z-20 w-[100px] min-w-[100px] ${isLastMonthOfYear ? "bg-yellow-200 dark:bg-yellow-900/30" : "bg-background"}`}>
                        {row.cumulativeMonth}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.payment, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.adminFeeCost, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.upfrontCost, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(
                          applyRealValue(row.riskInsuranceCost, row.cumulativeMonth),
                          storedState.inputs.currency,
                        )}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(
                          applyRealValue(row.assetBasedCost, row.cumulativeMonth),
                          storedState.inputs.currency,
                        )}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.plusCost, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.bonus, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.taxCredit, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums">
                        {formatValue(applyRealValue(row.interest, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td
                        className={`border border-gray-300 py-2 px-3 text-right tabular-nums ${
                          isLastMonthOfYear ? "bg-yellow-200 dark:bg-yellow-900/30" : ""
                        }`}
                      >
                        {formatValue(applyRealValue(row.costTotal, row.cumulativeMonth), storedState.inputs.currency)}
                      </td>
                      <td className="border border-gray-300 py-2 px-3 text-right tabular-nums font-medium">
                        {formatValue(applyRealValue(row.endBalance, row.cumulativeMonth), storedState.inputs.currency)}
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
  )
}

