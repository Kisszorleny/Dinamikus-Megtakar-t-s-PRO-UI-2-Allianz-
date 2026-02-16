"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft } from "lucide-react"
import { convertForDisplay, formatMoney } from "@/lib/currency-conversion"
import { buildYearlyPlan } from "@/lib/plan"
import { calculate, type InputsDaily, type ProductId } from "@/lib/engine"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ColumnHoverInfoPanel } from "@/components/column-hover-info-panel"
import { resolveProductContextKey } from "@/lib/column-explanations"
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from "recharts"

type Currency = "HUF" | "EUR" | "USD"

interface ProductMetadata {
  value: string
  label: string
  productType: string
  mnbCode: string
  productCode: string
  variants?: {
    label?: string
    productType: string
    mnbCode: string
    productCode: string
  }[]
}

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
        {
          value: "alfa_jade",
          label: "Alfa Jáde EUR",
          productType: "Életbiztosítás",
          mnbCode: "TR19",
          productCode: "TR19",
          variants: [{ label: "Alfa Jáde EUR", productType: "Életbiztosítás", mnbCode: "TR19", productCode: "TR19" }],
        },
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

const getAllProductsForComparison = (): Array<{ insurer: string; product: ProductMetadata }> => {
  const allProducts: Array<{ insurer: string; product: ProductMetadata }> = []
  const insurers = ["Alfa", "Allianz", "CIG Pannonia", "Generali", "Grupama", "KnH", "Magyar Posta", "MetLife", "NN", "Signal Iduna", "Union", "Uniqa"]
  
  insurers.forEach((insurer) => {
    const products = getAvailableProductsForInsurer(insurer)
    products.forEach((product) => {
      allProducts.push({ insurer, product })
    })
  })
  
  return allProducts
}

export default function OsszehasonlitasPage() {
  const router = useRouter()

  const [selectedProductsForComparison, setSelectedProductsForComparison] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedProductsForComparison")
      if (stored) {
        try {
          return JSON.parse(stored)
        } catch (e) {
          console.error("[v0] Failed to parse stored selectedProductsForComparison:", e)
        }
      }
    }
    return []
  })

  // Save selectedProductsForComparison to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const validKeys = new Set(getAllProductsForComparison().map(({ insurer, product }) => `${insurer}-${product.value}`))
      const sanitized = selectedProductsForComparison.filter((key) => validKeys.has(key))
      sessionStorage.setItem("calculator-selectedProductsForComparison", JSON.stringify(sanitized))
      if (sanitized.length !== selectedProductsForComparison.length) {
        setSelectedProductsForComparison(sanitized)
      }
    }
  }, [selectedProductsForComparison])

  // Load data from sessionStorage
  const [inputs, setInputs] = useState<any>(null)
  const [durationUnit, setDurationUnit] = useState<"year" | "month" | "day">("year")
  const [durationValue, setDurationValue] = useState<number>(10)
  const [displayCurrency, setDisplayCurrency] = useState<Currency>("HUF")
  const [activeColumnInfoKey, setActiveColumnInfoKey] = useState<string | null>(null)
  const [indexByYear, setIndexByYear] = useState<Record<number, number>>({})
  const [paymentByYear, setPaymentByYear] = useState<Record<number, number>>({})
  const [withdrawalByYear, setWithdrawalByYear] = useState<Record<number, number>>({})
  const [taxCreditAmountByYear, setTaxCreditAmountByYear] = useState<Record<number, number>>({})
  const [taxCreditLimitByYear, setTaxCreditLimitByYear] = useState<Record<number, number>>({})
  const getHeaderInfoHandlers = (key: string) => ({
    onMouseEnter: () => setActiveColumnInfoKey(key),
    onMouseLeave: () => setActiveColumnInfoKey(null),
    onFocus: () => setActiveColumnInfoKey(key),
    onBlur: () => setActiveColumnInfoKey(null),
    tabIndex: 0,
  })
  const comparisonPanelProductKey = useMemo(
    () =>
      resolveProductContextKey(null, {
        enableTaxCredit: inputs?.enableTaxCredit,
        selectedProductsForComparison,
      }),
    [inputs?.enableTaxCredit, selectedProductsForComparison],
  )

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
      const storedInputs = sessionStorage.getItem("calculator-inputs")
      const storedUnit = sessionStorage.getItem("calculator-durationUnit")
      const storedValue = sessionStorage.getItem("calculator-durationValue")
      const storedDisplayCurrency = sessionStorage.getItem("calculator-displayCurrency")

      if (storedInputs) {
        setInputs(JSON.parse(storedInputs))
      }
      if (storedUnit) {
        const parsed = JSON.parse(storedUnit)
        if (parsed === "year" || parsed === "month" || parsed === "day") {
          setDurationUnit(parsed)
        }
      }
      if (storedValue) {
        const parsed = JSON.parse(storedValue)
        if (typeof parsed === "number" && parsed > 0) {
          setDurationValue(parsed)
        }
      }
      if (storedDisplayCurrency) {
        const parsed = JSON.parse(storedDisplayCurrency)
        if (parsed === "HUF" || parsed === "EUR" || parsed === "USD") {
          setDisplayCurrency(parsed)
        }
      }

      setIndexByYear(readJSON("calculator-indexByYear", {}))
      setPaymentByYear(readJSON("calculator-paymentByYear", {}))
      setWithdrawalByYear(readJSON("calculator-withdrawalByYear", {}))
      setTaxCreditAmountByYear(readJSON("calculator-taxCreditAmountByYear", {}))
      setTaxCreditLimitByYear(readJSON("calculator-taxCreditLimitByYear", {}))
      // Intentionally do not reuse per-product preset maps from sessionStorage here.
      // Comparison must stay stable when the user switches product on the main page.
    } catch (e) {
      console.error("[v0] Failed to load data from sessionStorage:", e)
    }
  }, [])

  const totalYearsForPlan = useMemo(() => {
    if (!inputs) return 10
    const totalDays =
      durationUnit === "year"
        ? durationValue * 365
        : durationUnit === "month"
          ? Math.round(durationValue * (365 / 12))
          : durationValue
    return Math.max(1, Math.ceil(totalDays / 365))
  }, [durationUnit, durationValue, inputs])

  const plan = useMemo(() => {
    if (!inputs) return null
    const periodsPerYear =
      inputs.frequency === "havi" ? 12 : inputs.frequency === "negyedéves" ? 4 : inputs.frequency === "féléves" ? 2 : 1
    const baseYear1Payment = inputs.keepYearlyPayment ? inputs.regularPayment * 12 : inputs.regularPayment * periodsPerYear

    return buildYearlyPlan({
      years: totalYearsForPlan,
      baseYear1Payment,
      baseAnnualIndexPercent: inputs.annualIndexPercent || 0,
      indexByYear,
      paymentByYear,
      withdrawalByYear,
    })
  }, [inputs, totalYearsForPlan, indexByYear, paymentByYear, withdrawalByYear])

  const mapSelectedProductToProductId = (insurer: string, productValue: string): ProductId => {
    if (productValue === "alfa_exclusive_plus") {
      return "alfa-exclusive-plus"
    }
    if (productValue === "alfa_fortis") return "alfa-fortis"
    if (productValue === "alfa_jade") return "alfa-jade"
    if (insurer === "Allianz" && productValue.includes("allianz")) {
      return "allianz-eletprogram"
    }
    return "dm-pro"
  }

  const comparisonResults = useMemo(() => {
    if (!inputs || !plan) return []
    const fxRate = inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate

    return selectedProductsForComparison
      .map((productKey) => {
        const allProducts = getAllProductsForComparison()
        const productData = allProducts.find((p) => `${p.insurer}-${p.product.value}` === productKey)
        if (!productData) return null

        const insurer = productData.insurer
        const productValue = productData.product.value
        const productId = mapSelectedProductToProductId(insurer, productValue)
        const isAllianzProduct = productId === "allianz-eletprogram"
        const isBonusVariant = productValue === "allianz_bonusz_eletprogram"
        const effectiveCurrency = productValue === "alfa_jade" ? "EUR" : inputs.currency
        const effectiveProductVariant =
          productValue === "alfa_exclusive_plus"
            ? inputs.enableTaxCredit
              ? "alfa_exclusive_plus_ny05"
              : "alfa_exclusive_plus_tr08"
            : productValue === "alfa_jade"
              ? "alfa_jade_tr19"
            : productValue
        const durationInYears = Math.max(
          1,
          Math.ceil(
            durationValue / (durationUnit === "year" ? 1 : durationUnit === "month" ? 12 : 365),
          ),
        )

        const buildAlfaExclusiveInitialCosts = (years: number): Record<number, number> => {
          const initialCostConfig: Record<number, number> = {}
          if (years >= 5 && years <= 10) {
            initialCostConfig[1] = 49
            initialCostConfig[2] = 0
            initialCostConfig[3] = 0
          } else if (years === 11) {
            initialCostConfig[1] = 55
            initialCostConfig[2] = 5
            initialCostConfig[3] = 0
          } else if (years === 12) {
            initialCostConfig[1] = 55
            initialCostConfig[2] = 15
            initialCostConfig[3] = 0
          } else if (years === 13) {
            initialCostConfig[1] = 60
            initialCostConfig[2] = 25
            initialCostConfig[3] = 0
          } else if (years === 14) {
            initialCostConfig[1] = 60
            initialCostConfig[2] = 35
            initialCostConfig[3] = 0
          } else if (years >= 15) {
            initialCostConfig[1] = 60
            initialCostConfig[2] = 40
            initialCostConfig[3] = 10
          }
          return initialCostConfig
        }

        const buildAlfaExclusiveInvestedShare = (years: number): Record<number, number> => {
          const config: Record<number, number> = {}
          for (let year = 1; year <= years; year++) {
            config[year] = year === 1 ? 20 : year === 2 ? 50 : 80
          }
          return config
        }

        const buildAlfaExclusiveRedemption = (years: number, afterYear10Percent: number): Record<number, number> => {
          const config: Record<number, number> = {}
          for (let year = 1; year <= years; year++) {
            config[year] = year <= 10 ? 100 : afterYear10Percent
          }
          return config
        }

        const baseInputs: InputsDaily = {
          ...inputs,
          currency: effectiveCurrency,
          durationUnit,
          durationValue,
          yearsPlanned: totalYearsForPlan,
          yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
          yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
          taxCreditAmountByYear,
          taxCreditLimitByYear,
          productVariant: effectiveProductVariant,
          // Reset product-specific, preset-driven maps so they cannot leak from the main page selection.
          investedShareByYear: {},
          redemptionFeeByYear: {},
          assetCostPercentByYear: {},
          plusCostByYear: {},
          bonusPercentByYear: {},
          isAccountSplitOpen: false,
          redemptionEnabled: false,
          isTaxBonusSeparateAccount: false,
          // Reset fee layers that can leak from the currently selected main-page product preset.
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          adminFeeMonthlyAmount: 0,
        }

        const alfaExclusiveInputs: InputsDaily = {
          ...baseInputs,
          initialCostByYear: buildAlfaExclusiveInitialCosts(durationInYears),
          initialCostDefaultPercent: 0,
          assetBasedFeePercent: 0.145,
          assetCostPercentByYear: Object.fromEntries(
            Array.from({ length: durationInYears }, (_, i) => [i + 1, 0.145]),
          ) as Record<number, number>,
          investedShareByYear: buildAlfaExclusiveInvestedShare(durationInYears),
          redemptionFeeByYear: buildAlfaExclusiveRedemption(
            durationInYears,
            inputs.enableTaxCredit ? 15 : 20,
          ),
          redemptionEnabled: true,
          isAccountSplitOpen: true,
          isTaxBonusSeparateAccount: true,
          bonusMode: "none",
          bonusPercentByYear: {},
          yearlyManagementFeePercent: 0,
          yearlyFixedManagementFeeAmount: 0,
          managementFeeFrequency: "éves",
          managementFeeValueType: "percent",
          managementFeeValue: 0,
          adminFeeMonthlyAmount: 0,
        }

        const dailyInputs: InputsDaily =
          productValue === "alfa_exclusive_plus"
            ? alfaExclusiveInputs
            : isAllianzProduct
                ? {
                    ...baseInputs,
                    // Force Allianz-specific cost structure per product variant
                    // Do not merge global initialCostByYear; it can leak from the main page selected product.
                    initialCostByYear: { 1: isBonusVariant ? 79 : 33 },
                    initialCostDefaultPercent: 0,
                    bonusMode: isBonusVariant ? "refundInitialCostIncreasing" : "none",
                  }
                : baseInputs

        const results = calculate(productId, dailyInputs)
        const totalContributions = results.totalContributions ?? 0
        const endBalance = results.endBalance ?? 0
        const finalYearRow = results.yearlyBreakdown?.[results.yearlyBreakdown.length - 1]
        const withdrawableValue = finalYearRow?.surrenderValue ?? endBalance
        const totalTaxCredit = results.totalTaxCredit ?? 0
        const netReturn =
          results.totalInterestNet !== undefined
            ? results.totalInterestNet
            : endBalance - totalContributions + totalTaxCredit

        let cumulativeCosts = 0
        let cumulativeBonuses = 0
        let cumulativeContributions = 0
        const chartData = (results.yearlyBreakdown ?? []).map((row: any) => {
          cumulativeCosts += row.costForYear ?? 0
          cumulativeBonuses += (row.bonusForYear ?? 0) + (row.wealthBonusForYear ?? 0)
          cumulativeContributions = row.totalContributions ?? cumulativeContributions

          return {
            year: row.year.toString(),
            [`költségek-${productKey}`]: Math.round(convertForDisplay(cumulativeCosts, inputs.currency, displayCurrency, fxRate)),
            [`bónuszok-${productKey}`]: Math.round(
              convertForDisplay(cumulativeBonuses, inputs.currency, displayCurrency, fxRate),
            ),
            [`egyenleg-${productKey}`]: Math.round(
              convertForDisplay(row.endBalance ?? 0, inputs.currency, displayCurrency, fxRate),
            ),
            [`visszavásárlási-érték-${productKey}`]: Math.round(
              convertForDisplay(row.surrenderValue ?? row.endBalance ?? 0, inputs.currency, displayCurrency, fxRate),
            ),
            [`befizetés-${productKey}`]: Math.round(
              convertForDisplay(cumulativeContributions, inputs.currency, displayCurrency, fxRate),
            ),
          }
        })

        return {
          productKey,
          insurer,
          productData,
          totalContributions,
          endBalance,
          surrenderValue: withdrawableValue,
          totalTaxCredit,
          netReturn,
          chartData,
        }
      })
      .filter(Boolean) as Array<{
      productKey: string
      insurer: string
      productData: { insurer: string; product: ProductMetadata }
      totalContributions: number
      endBalance: number
      surrenderValue: number
      totalTaxCredit: number
      netReturn: number
      chartData: Array<Record<string, number | string>>
    }>
  }, [
    inputs,
    plan,
    durationUnit,
    durationValue,
    totalYearsForPlan,
    displayCurrency,
    selectedProductsForComparison,
    paymentByYear,
    taxCreditAmountByYear,
    taxCreditLimitByYear,
    withdrawalByYear,
  ])

  if (!inputs) {
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
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/")}
                className="h-9 px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Vissza
              </Button>
              <h1 className="text-xl md:text-2xl font-bold">Összehasonlítás</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg md:text-xl">Összehasonlítás</CardTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Hasonlítsa össze a különböző biztosítási termékeket a beírt adatok alapján (futamidő, befizetés, adójóváírás).
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Válasszon termékeket az összehasonlításhoz</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {getAllProductsForComparison().map(({ insurer, product }) => {
                  const productKey = `${insurer}-${product.value}`
                  return (
                    <div key={productKey} className="flex items-center space-x-2">
                      <Checkbox
                        id={productKey}
                        checked={selectedProductsForComparison.includes(productKey)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProductsForComparison([...selectedProductsForComparison, productKey])
                          } else {
                            setSelectedProductsForComparison(selectedProductsForComparison.filter((p) => p !== productKey))
                          }
                        }}
                      />
                      <Label
                        htmlFor={productKey}
                        className="text-sm font-normal cursor-pointer flex-1"
                      >
                        <span className="font-medium">{insurer}</span> - {product.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Comparison Table */}
            {selectedProductsForComparison.length > 0 && (
              <>
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium">Termék</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("duration")}>Futamidő</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("totalContributions")}>Összes befizetés</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("taxCredit")}>Adójóváírás</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("netReturn")}>Nettó hozam</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("balance")}>Egyenleg</th>
                        <th className="py-3 px-4 text-right font-medium" {...getHeaderInfoHandlers("surrenderValue")}>Visszavásárlási érték</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisonResults.map((row) => {
                        const durationInYears = totalYearsForPlan

                        return (
                          <tr key={row.productKey} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-4">
                              <div>
                                <div className="font-medium">{row.productData.product.label}</div>
                                <div className="text-xs text-muted-foreground">{row.insurer}</div>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">{durationInYears} év</td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {formatMoney(
                                convertForDisplay(
                                  row.totalContributions,
                                  inputs.currency,
                                  displayCurrency,
                                  inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                ),
                                displayCurrency,
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums">
                              {inputs.enableTaxCredit
                                ? formatMoney(
                                    convertForDisplay(
                                      row.totalTaxCredit,
                                      inputs.currency,
                                      displayCurrency,
                                      inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                    ),
                                    displayCurrency,
                                  )
                                : "-"}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-semibold text-green-600 dark:text-green-400">
                              {formatMoney(
                                convertForDisplay(
                                  row.netReturn,
                                  inputs.currency,
                                  displayCurrency,
                                  inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                ),
                                displayCurrency,
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-medium">
                              {formatMoney(
                                convertForDisplay(
                                  row.endBalance,
                                  inputs.currency,
                                  displayCurrency,
                                  inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                ),
                                displayCurrency,
                              )}
                            </td>
                            <td className="py-3 px-4 text-right tabular-nums font-medium">
                              {formatMoney(
                                convertForDisplay(
                                  row.surrenderValue,
                                  inputs.currency,
                                  displayCurrency,
                                  inputs.currency === "USD" ? inputs.usdToHufRate : inputs.eurToHufRate,
                                ),
                                displayCurrency,
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3">
                  <ColumnHoverInfoPanel activeKey={activeColumnInfoKey} productKey={comparisonPanelProductKey} />
                </div>

                {/* Line Charts - Comparison of all selected products */}
                {selectedProductsForComparison.length > 0 && (() => {
                  const allProductsData = comparisonResults.map((row) => ({
                    productKey: row.productKey,
                    productData: row.productData,
                    chartData: row.chartData,
                  }))

                  // Merge data by year
                  const mergedChartData = Array.from({ length: totalYearsForPlan }, (_, i) => {
                    const year = (i + 1).toString()
                    const yearData: any = { year }
                    
                    allProductsData.forEach(({ productKey, chartData }) => {
                      const yearRow = chartData[i]
                      if (yearRow) {
                        yearData[`költségek-${productKey}`] = yearRow[`költségek-${productKey}`]
                        yearData[`bónuszok-${productKey}`] = yearRow[`bónuszok-${productKey}`]
                        yearData[`egyenleg-${productKey}`] = yearRow[`egyenleg-${productKey}`]
                        yearData[`visszavásárlási-érték-${productKey}`] = yearRow[`visszavásárlási-érték-${productKey}`]
                        yearData[`befizetés-${productKey}`] = yearRow[`befizetés-${productKey}`]
                      }
                    })
                    
                    return yearData
                  })

                  // Get color for insurer
                  const getInsurerColor = (insurer: string): string => {
                    switch (insurer) {
                      case "Alfa":
                        return "hsl(280, 70%, 50%)" // Lila
                      case "Allianz":
                        return "hsl(210, 70%, 50%)" // Kék
                      case "Union":
                        return "hsl(0, 70%, 50%)" // Piros
                      case "CIG Pannonia":
                        return "hsl(120, 70%, 40%)" // Zöld
                      case "Generali":
                        return "hsl(30, 70%, 50%)" // Narancs
                      case "Grupama":
                        return "hsl(270, 60%, 50%)" // Lila-violet
                      case "KnH":
                        return "hsl(180, 70%, 45%)" // Tűzkék
                      case "Magyar Posta":
                        return "hsl(200, 80%, 40%)" // Sötétkék
                      case "MetLife":
                        return "hsl(15, 75%, 50%)" // Vöröses-narancs
                      case "NN":
                        return "hsl(150, 60%, 45%)" // Tűzöld
                      case "Signal Iduna":
                        return "hsl(240, 65%, 55%)" // Sötétkék
                      case "Uniqa":
                        return "hsl(330, 65%, 50%)" // Rózsaszín-lila
                      default:
                        return "hsl(var(--chart-1))"
                    }
                  }

                  // Build chart config with insurer-specific colors
                  const chartConfig: any = {}
                  const productColors: Record<string, string> = {}
                  allProductsData.forEach(({ productKey, productData }) => {
                    const color = getInsurerColor(productData.insurer)
                    productColors[productKey] = color
                    chartConfig[`költségek-${productKey}`] = {
                      label: `${productData.insurer} - ${productData.product.label}`,
                      color,
                    }
                    chartConfig[`bónuszok-${productKey}`] = {
                      label: `${productData.insurer} - ${productData.product.label}`,
                      color,
                    }
                    chartConfig[`egyenleg-${productKey}`] = {
                      label: `${productData.insurer} - ${productData.product.label}`,
                      color,
                    }
                    chartConfig[`visszavásárlási-érték-${productKey}`] = {
                      label: `${productData.insurer} - ${productData.product.label}`,
                      color,
                    }
                    chartConfig[`befizetés-${productKey}`] = {
                      label: `${productData.insurer} - ${productData.product.label}`,
                      color,
                    }
                  })

                  return (
                    <div className="mt-8 space-y-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Összehasonlító diagramok</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {/* Egyenleg Chart */}
                          <div>
                            <h3 className="text-sm font-medium mb-4" {...getHeaderInfoHandlers("compareBalanceChart")}>Egyenleg összehasonlítása</h3>
                            <ChartContainer config={chartConfig}>
                              <LineChart data={mergedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`balance-${productKey}`}
                                    type="monotone"
                                    dataKey={`egyenleg-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={4}
                                  />
                                ))}
                              </LineChart>
                            </ChartContainer>
                          </div>

                          <div>
                            <h3 className="text-sm font-medium mb-4" {...getHeaderInfoHandlers("compareContributionVsBalanceChart")}>Kumulált befizetés vs egyenleg</h3>
                            <ChartContainer config={chartConfig}>
                              <LineChart data={mergedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`contribution-${productKey}`}
                                    type="monotone"
                                    dataKey={`befizetés-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={2}
                                    strokeDasharray="6 3"
                                  />
                                ))}
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`balance-vs-${productKey}`}
                                    type="monotone"
                                    dataKey={`egyenleg-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={3}
                                  />
                                ))}
                              </LineChart>
                            </ChartContainer>
                          </div>

                          {/* Visszavásárlási érték Chart */}
                          <div>
                            <h3 className="text-sm font-medium mb-4" {...getHeaderInfoHandlers("compareSurrenderChart")}>Visszavásárlási érték összehasonlítása</h3>
                            <ChartContainer config={chartConfig}>
                              <LineChart data={mergedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`surrender-${productKey}`}
                                    type="monotone"
                                    dataKey={`visszavásárlási-érték-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={4}
                                  />
                                ))}
                              </LineChart>
                            </ChartContainer>
                          </div>

                          {/* Költségek Chart */}
                          <div>
                            <h3 className="text-sm font-medium mb-4" {...getHeaderInfoHandlers("compareCostChart")}>Költségek összehasonlítása</h3>
                            <ChartContainer config={chartConfig}>
                              <LineChart data={mergedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`costs-${productKey}`}
                                    type="monotone"
                                    dataKey={`költségek-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={2}
                                  />
                                ))}
                              </LineChart>
                            </ChartContainer>
                          </div>

                          {/* Bónuszok Chart */}
                          <div>
                            <h3 className="text-sm font-medium mb-4" {...getHeaderInfoHandlers("compareBonusChart")}>Bónuszok összehasonlítása</h3>
                            <ChartContainer config={chartConfig}>
                              <LineChart data={mergedChartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                {allProductsData.map(({ productKey }) => (
                                  <Line
                                    key={`bonuses-${productKey}`}
                                    type="monotone"
                                    dataKey={`bónuszok-${productKey}`}
                                    stroke={productColors[productKey]}
                                    strokeWidth={2}
                                  />
                                ))}
                              </LineChart>
                            </ChartContainer>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })()}
              </>
            )}

            {selectedProductsForComparison.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Válasszon legalább egy terméket az összehasonlításhoz.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

