"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, Table2, LayoutGrid, Mail, Copy } from "lucide-react"
import { useCalculatorData } from "@/lib/calculator-context"
import { convertForDisplay } from "@/lib/currency-conversion"
import { formatNumber, parseNumber } from "@/lib/format-number"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
// TODO: Replace with real calculation import when implementing business logic
// import { calculateResultsDaily, type InputsDaily, type Currency } from "@/lib/engine/calculate-results-daily"
type InputsDaily = any
type Currency = "HUF" | "EUR" | "USD"
import { buildYearlyPlan } from "@/lib/plan"
import { calculate, type ProductId } from "@/lib/engine"

type RowKey =
  | "accountName"
  | "accountGoal"
  | "monthlyPayment"
  | "yearlyPayment"
  | "years"
  | "totalContributions"
  | "strategy"
  | "annualYield"
  | "totalReturn"
  | "endBalance"
  | "totalTaxCredit"
  | "totalBonus"
  | "netEndBalance"
  | "netEndBalanceWithTax"
  | "endBalanceHufCurrent"
  | "endBalanceEUR500"
  | "endBalanceEUR600"
  | "finalEndBalance"
  | "netFinalEndBalance"

type SummaryOverrides = {
  [key in RowKey]?: {
    label?: string
    value?: number | string
  }
}

export default function OsszesitesPage() {
  const router = useRouter()
  const { data: contextData, isHydrated, updateData } = useCalculatorData()

  const [computedData, setComputedData] = useState<typeof contextData>(null)
  const [isComputing, setIsComputing] = useState(false)
  const [fallbackProductLabel, setFallbackProductLabel] = useState<string | null>(null)
  const [enableRealValue, setEnableRealValue] = useState(false)
  const [inflationRate, setInflationRate] = useState(3)

  const [isExcelView, setIsExcelView] = useState(false)
  const [summaryOverrides, setSummaryOverrides] = useState<SummaryOverrides>({})
  const [editingCell, setEditingCell] = useState<{ key: RowKey; type: "label" | "value" } | null>(null)
  const [editingText, setEditingText] = useState<string>("")
  const [isActivelyEditing, setIsActivelyEditing] = useState(false)

  const [emailClientName, setEmailClientName] = useState("Viktor")
  const [emailOfferUntil, setEmailOfferUntil] = useState("2026.02.14")
  const [emailCopyStatus, setEmailCopyStatus] = useState<"idle" | "copied" | "failed">("idle")
  const [emailTegezo, setEmailTegezo] = useState(false)

  const copyHtmlToClipboard = async (html: string, plain: string) => {
    // 1) Modern Clipboard API (works on most desktops; limited on mobile)
    try {
      const ClipboardItemCtor: any = (window as any).ClipboardItem
      if (ClipboardItemCtor && navigator.clipboard?.write) {
        const item = new ClipboardItemCtor({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plain], { type: "text/plain" }),
        })
        await navigator.clipboard.write([item])
        return true
      }
    } catch {
      // fall through
    }

    // 2) Legacy execCommand('copy') using DOM selection (often works better on iOS/Safari)
    try {
      const container = document.createElement("div")
      container.style.position = "fixed"
      container.style.left = "-9999px"
      container.style.top = "0"
      container.style.opacity = "0"
      container.style.pointerEvents = "none"
      container.setAttribute("aria-hidden", "true")
      container.innerHTML = html
      document.body.appendChild(container)

      const selection = window.getSelection()
      if (!selection) throw new Error("No selection")
      selection.removeAllRanges()
      const range = document.createRange()
      range.selectNodeContents(container)
      selection.addRange(range)

      const ok = document.execCommand("copy")
      selection.removeAllRanges()
      document.body.removeChild(container)
      if (ok) return true
    } catch {
      // fall through
    }

    // 3) Plain text fallback
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(plain)
        return true
      }
    } catch {
      // ignore
    }

    return false
  }

  const getEmailSubject = () => {
    const goal = String(getValue("accountGoal") ?? "").trim()
    return goal || "Megtakarítási ajánlat"
  }

  const getEmailTone = () => {
    if (emailTegezo) {
      return {
        youNom: "Te",
        youDative: "Neked",
        youAcc: "Téged",
        yourBy: "az általad",
        yourByCap: "Az általad",
        contactVerb: "keress",
        canVerb: "tudd",
        canVerbSimple: "tudod",
      }
    }
    return {
      youNom: "Ön",
      youDative: "Önnek",
      youAcc: "Önt",
      yourBy: "az Ön által",
      yourByCap: "Ön által",
      contactVerb: "keressen",
      canVerb: "tudja",
      canVerbSimple: "tudja",
    }
  }

  const getProductLabel = (productValue: string): string => {
    const productMap: Record<string, string> = {
      alfa_exclusive_plus: "Alfa Exclusive Plus",
      allianz_eletprogram: "Allianz Életprogram",
      allianz_bonusz_eletprogram: "Allianz Bónusz Életprogram",
    }
    return productMap[productValue] || productValue
  }

  const mapSelectedProductToProductId = (productValue: string | null, insurer: string | null): ProductId => {
    if (insurer === "Allianz") {
      if (productValue === "allianz_eletprogram" || productValue === "allianz_bonusz_eletprogram") {
        return "allianz-eletprogram"
      }
    }
    return "dm-pro"
  }

  useEffect(() => {
    if (!isHydrated || computedData) return

    // Try to load and compute from sessionStorage
    setIsComputing(true)
    try {
      const storedInputs = sessionStorage.getItem("calculator-inputs")
      const storedUnit = sessionStorage.getItem("calculator-durationUnit")
      const storedValue = sessionStorage.getItem("calculator-durationValue")
      const storedInsurer = sessionStorage.getItem("calculator-selectedInsurer")
      const storedProduct = sessionStorage.getItem("calculator-selectedProduct")
      const storedNetting = sessionStorage.getItem("calculator-enableNetting")
      const storedIndexByYear = sessionStorage.getItem("calculator-indexByYear")
      const storedPaymentByYear = sessionStorage.getItem("calculator-paymentByYear")
      const storedWithdrawalByYear = sessionStorage.getItem("calculator-withdrawalByYear")
      const storedTaxCreditAmountByYear = sessionStorage.getItem("calculator-taxCreditAmountByYear")
      const storedTaxCreditLimitByYear = sessionStorage.getItem("calculator-taxCreditLimitByYear")
      const storedInvestedShareByYear = sessionStorage.getItem("calculator-investedShareByYear")
      const storedRedemptionFeeByYear = sessionStorage.getItem("calculator-redemptionFeeByYear")
      const storedAssetCostPercentByYear = sessionStorage.getItem("calculator-assetCostPercentByYear")
      const storedPlusCostByYear = sessionStorage.getItem("calculator-plusCostByYear")
      const storedBonusPercentByYear = sessionStorage.getItem("calculator-bonusPercentByYear")
      const storedIsAccountSplitOpen = sessionStorage.getItem("isAccountSplitOpen")
      const storedIsRedemptionOpen = sessionStorage.getItem("isRedemptionOpen")
      const storedIsTaxBonusSeparateAccount = sessionStorage.getItem("isTaxBonusSeparateAccount")
      const storedEnableRealValue = sessionStorage.getItem("calculator-enableRealValue")
      const storedInflationRate = sessionStorage.getItem("calculator-inflationRate")

      if (!storedInputs || !storedUnit || !storedValue) {
        setIsComputing(false)
        return
      }

      // Parse with fallbacks
      let inputs: any
      let durationUnit: "year" | "month" | "day" = "year"
      let durationValue = 10
      let selectedInsurer: string | null = null
      let selectedProduct: string | null = null
      let enableNetting = false
      let indexByYear: Record<number, number> = {}
      let paymentByYear: Record<number, number> = {}
      let withdrawalByYear: Record<number, number> = {}
      let taxCreditAmountByYear: Record<number, number> = {}
      let taxCreditLimitByYear: Record<number, number> = {}
      let investedShareByYear: Record<number, number> = {}
      let redemptionFeeByYear: Record<number, number> = {}
      let assetCostPercentByYear: Record<number, number> = {}
      let plusCostByYear: Record<number, number> = {}
      let bonusPercentByYear: Record<number, number> = {}
      let isAccountSplitOpen = false
      let isRedemptionOpen = false
      let isTaxBonusSeparateAccount = false

      try {
        inputs = JSON.parse(storedInputs)
      } catch (e) {
        console.error("[v0] /osszesites failed to parse inputs:", e)
        setIsComputing(false)
        return
      }

      try {
        const parsed = JSON.parse(storedUnit)
        if (parsed === "year" || parsed === "month" || parsed === "day") {
          durationUnit = parsed
        }
      } catch (e) {
        console.error("[v0] /osszesites failed to parse durationUnit, using default 'year':", e)
      }

      try {
        const parsed = JSON.parse(storedValue)
        if (typeof parsed === "number" && parsed > 0) {
          durationValue = parsed
        }
      } catch (e) {
        console.error("[v0] /osszesites failed to parse durationValue, using default 10:", e)
      }

      try {
        selectedInsurer = storedInsurer ? JSON.parse(storedInsurer) : null
      } catch (e) {
        console.error("[v0] /osszesites failed to parse selectedInsurer:", e)
      }

      try {
        selectedProduct = storedProduct ? JSON.parse(storedProduct) : null
      } catch (e) {
        console.error("[v0] /osszesites failed to parse selectedProduct:", e)
      }
      if (selectedProduct) {
        setFallbackProductLabel(getProductLabel(selectedProduct))
      } else if (selectedInsurer) {
        setFallbackProductLabel(selectedInsurer)
      } else {
        setFallbackProductLabel(null)
      }

      try {
        enableNetting = storedNetting ? JSON.parse(storedNetting) : false
      } catch (e) {
        console.error("[v0] /osszesites failed to parse enableNetting:", e)
      }

      const parseRecord = (raw: string | null): Record<number, number> => {
        if (!raw) return {}
        try {
          return JSON.parse(raw)
        } catch {
          return {}
        }
      }

      indexByYear = parseRecord(storedIndexByYear)
      paymentByYear = parseRecord(storedPaymentByYear)
      withdrawalByYear = parseRecord(storedWithdrawalByYear)
      taxCreditAmountByYear = parseRecord(storedTaxCreditAmountByYear)
      taxCreditLimitByYear = parseRecord(storedTaxCreditLimitByYear)
      investedShareByYear = parseRecord(storedInvestedShareByYear)
      redemptionFeeByYear = parseRecord(storedRedemptionFeeByYear)
      assetCostPercentByYear = parseRecord(storedAssetCostPercentByYear)
      plusCostByYear = parseRecord(storedPlusCostByYear)
      bonusPercentByYear = parseRecord(storedBonusPercentByYear)

      isAccountSplitOpen = storedIsAccountSplitOpen ? JSON.parse(storedIsAccountSplitOpen) : false
      isRedemptionOpen = storedIsRedemptionOpen ? JSON.parse(storedIsRedemptionOpen) : false
      isTaxBonusSeparateAccount = storedIsTaxBonusSeparateAccount ? JSON.parse(storedIsTaxBonusSeparateAccount) : false
      setEnableRealValue(storedEnableRealValue ? JSON.parse(storedEnableRealValue) : false)
      setInflationRate(storedInflationRate ? JSON.parse(storedInflationRate) : 3)

      // Validate required fields in inputs
      if (!inputs.currency || !inputs.frequency) {
        console.error("[v0] /osszesites inputs missing required fields:", {
          hasCurrency: !!inputs.currency,
          hasFrequency: !!inputs.frequency,
        })
        setIsComputing(false)
        return
      }

      let yearsValue = durationValue
      if (durationUnit === "month") {
        yearsValue = durationValue / 12
      } else if (durationUnit === "day") {
        yearsValue = durationValue / 365
      }

      const totalYearsForPlan = Math.max(1, Math.ceil(yearsValue))
      const periodsPerYear =
        inputs.frequency === "havi"
          ? 12
          : inputs.frequency === "negyedéves"
            ? 4
            : inputs.frequency === "féléves"
              ? 2
              : 1
      const baseYear1Payment = inputs.keepYearlyPayment
        ? (inputs.regularPayment || 0) * 12
        : (inputs.regularPayment || 0) * periodsPerYear

      const plan = buildYearlyPlan({
        years: totalYearsForPlan,
        baseYear1Payment,
        baseAnnualIndexPercent: inputs.annualIndexPercent || 0,
        indexByYear,
        paymentByYear,
        withdrawalByYear,
      })

      const monthlyPayment = inputs.regularPayment || 0
      const yearlyPayment = monthlyPayment * 12

      let results: any
      let totalBonus = 0
      try {
        const productId = mapSelectedProductToProductId(selectedProduct, selectedInsurer)
        const dailyInputs: InputsDaily = {
          ...inputs,
          durationUnit,
          durationValue,
          yearsPlanned: totalYearsForPlan,
          yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
          yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
          assetCostPercentByYear,
          plusCostByYear,
          bonusPercentByYear,
          investedShareByYear,
          redemptionFeeByYear,
          redemptionEnabled: isRedemptionOpen,
          isAccountSplitOpen,
          isTaxBonusSeparateAccount,
          taxCreditAmountByYear,
          taxCreditLimitByYear,
          productVariant: selectedProduct ?? undefined,
        }
        results = calculate(productId, dailyInputs)
        totalBonus = results.totalBonus ?? 0
      } catch (error) {
        console.error("[v0] /osszesites calculation failed, using defaults for results:", error)
        results = {
          totalContributions: 0,
          totalBonus: 0,
          endBalance: 0,
          totalTaxCredit: 0,
          totalCosts: 0,
          totalAssetBasedCost: 0,
          totalWithdrawals: 0,
        }
      }

      // Determine if product has bonus
      const productHasBonus = inputs.bonusMode !== "none"

      // Build context data structure
      const hufRate =
        inputs.currency === "EUR" ? inputs.eurToHufRate || 400 : inputs.currency === "USD" ? inputs.usdToHufRate || 360 : 1
      const endBalanceHufCurrent =
        inputs.currency && inputs.currency !== "HUF" ? (results.endBalance || 0) * hufRate : undefined
      const endBalanceHuf500 =
        inputs.currency === "EUR" ? (results.endBalance || 0) * 500 : undefined
      const endBalanceHuf600 =
        inputs.currency === "EUR" ? (results.endBalance || 0) * 600 : undefined

      const computed = {
        monthlyPayment, // Always from inputs, never from calculation
        yearlyPayment, // Always calculated as monthly * 12
        years: yearsValue, // Always from duration inputs
        currency: inputs.currency as Currency,
        displayCurrency: inputs.currency as Currency,
        eurToHufRate: inputs.eurToHufRate || 400,
        totalContributions: results.totalContributions,
        totalReturn: results.endBalance - results.totalContributions,
        endBalance: results.endBalance,
        totalTaxCredit: results.totalTaxCredit,
        totalBonus, // From results.totalBonus with fallback to 0
        totalCost: results.totalCosts,
        totalAssetBasedCost: results.totalAssetBasedCost,
        totalRiskInsuranceCost: 0,
        annualYieldPercent: inputs.annualYieldPercent || 0,
        selectedInsurer: selectedInsurer || undefined,
        selectedProduct: selectedProduct || undefined,
        enableTaxCredit: inputs.enableTaxCredit || false,
        enableNetting,
        productHasBonus,
        netEndBalance: results.endBalance,
        netEndBalanceWithTax: results.endBalance + results.totalTaxCredit,
        endBalanceHufCurrent,
        endBalanceEUR500: endBalanceHuf500,
        endBalanceEUR600: endBalanceHuf600,
      }

      setComputedData(computed)
      updateData(computed)
    } catch (error) {
      console.error("[v0] /osszesites failed to compute data from sessionStorage:", error)
    } finally {
      setIsComputing(false)
    }
  }, [isHydrated, contextData, updateData, computedData])

  // Use computed data instead of contextData
  const data = computedData

  if (!isHydrated || isComputing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Betöltés...</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Nincs elérhető adat</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza a kalkulátorhoz
          </Button>
        </div>
      </div>
    )
  }

  const getComputedValue = (key: RowKey): number | string => {
    switch (key) {
      case "accountName":
        if (data.selectedProduct) {
          return getProductLabel(data.selectedProduct)
        }
        if (contextData?.selectedProduct) {
          return getProductLabel(contextData.selectedProduct)
        }
        return fallbackProductLabel || "—"
      case "accountGoal":
        return data.enableTaxCredit ? "Nyugdíjmegtakarítás és tőkenövelés" : "Tőkenövelés"
      case "strategy":
        return "Vegyes" // Always default to "Vegyes", never from context
      case "annualYield":
        return data.annualYieldPercent !== undefined && !isNaN(data.annualYieldPercent)
          ? `${data.annualYieldPercent.toFixed(data.annualYieldPercent % 1 === 0 ? 0 : 1)}%`
          : "—"
      case "finalEndBalance":
        return (data.endBalance as number) || 0
      case "netFinalEndBalance":
        return (data.netEndBalance as number) || 0
      default:
        return (data[key] as number) || 0
    }
  }

  const getValue = (key: RowKey): number | string => {
    if (summaryOverrides[key]?.value !== undefined) {
      return summaryOverrides[key]!.value!
    }
    return getComputedValue(key)
  }

  const getLabel = (key: RowKey, defaultLabel: string): string => {
    if (summaryOverrides[key]?.label !== undefined) {
      return summaryOverrides[key]!.label!
    }
    return defaultLabel
  }

  const formatValue = (
    value: number | string,
    showCurrency = true,
    suffix = "",
    valueCurrency?: Currency,
    displayCurrencyOverride?: Currency,
  ): string => {
    if (typeof value === "string") return value

    let adjustedValue = value
    if (enableRealValue) {
      const yearsForReal = typeof data?.years === "number" ? data.years : 0
      const inflationMultiplier = Math.pow(1 + inflationRate / 100, yearsForReal)
      if (isFinite(inflationMultiplier) && inflationMultiplier > 0) {
        adjustedValue = value / inflationMultiplier
      }
    }

    const fromCurrency = valueCurrency ?? data.currency
    const displayCurrency = displayCurrencyOverride ?? data.displayCurrency
    const displayValue = Math.round(convertForDisplay(adjustedValue, fromCurrency, displayCurrency, data.eurToHufRate))
    const formatted = formatNumber(displayValue)
    if (!showCurrency) return formatted + suffix
    return `${formatted} ${displayCurrency === "HUF" ? "Ft" : "€"}${suffix}`
  }

  const handleCellClick = (key: RowKey, type: "label" | "value", currentValue: string) => {
    setEditingCell({ key, type })
    setEditingText(currentValue)
    setIsActivelyEditing(true)
  }

  const handleSaveEdit = () => {
    if (!editingCell) return

    const { key, type } = editingCell

    if (type === "label") {
      // Save label override
      const trimmed = editingText.trim()
      setSummaryOverrides({
        ...summaryOverrides,
        [key]: {
          ...summaryOverrides[key],
          label: trimmed,
        },
      })
    } else {
      // Save value override
      const originalValue = getComputedValue(key)

      if (typeof originalValue === "string") {
        // String value (strategy, annualYield, etc.)
        setSummaryOverrides({
          ...summaryOverrides,
          [key]: {
            ...summaryOverrides[key],
            value: editingText.trim(),
          },
        })
      } else {
        // Numeric value (allow suffixes like "év")
        const sanitized = editingText.replace(/[^0-9,.\-]/g, "")
        const parsed = parseNumber(sanitized)
        if (!isNaN(parsed) && parsed >= 0) {
          const calcValue = convertForDisplay(parsed, data.displayCurrency, data.currency, data.eurToHufRate)

          // If value matches computed, remove override
          if (Math.abs(calcValue - (originalValue as number)) < 0.01) {
            const newOverrides = { ...summaryOverrides }
            if (newOverrides[key]) {
              delete newOverrides[key].value
              if (!newOverrides[key].label) {
                delete newOverrides[key]
              }
            }
            setSummaryOverrides(newOverrides)
          } else {
            setSummaryOverrides({
              ...summaryOverrides,
              [key]: {
                ...summaryOverrides[key],
                value: calcValue,
              },
            })
          }
        }
      }
    }

    setEditingCell(null)
    setEditingText("")
    setIsActivelyEditing(false)
  }

  type SummaryRow = {
    key: RowKey
    defaultLabel: string
    value: number | string
    isNumeric: boolean
    suffix?: string
    showCurrency?: boolean
    isHighlight?: boolean
    bgColor?: string
    valueCurrency?: Currency
    displayCurrency?: Currency
    textClass?: string
    textColor?: string
  }

  const sections: Array<{
    title: string
    highlight?: boolean
    rows: SummaryRow[]
  }> = [
    {
      title: "Alapadatok",
      rows: [
        {
          key: "accountName" as RowKey,
          defaultLabel: "Megtakarítási számla megnevezése",
          value: getValue("accountName"),
          isNumeric: false,
        },
        {
          key: "accountGoal" as RowKey,
          defaultLabel: "Megtakarítási számla célja",
          value: getValue("accountGoal"),
          isNumeric: false,
        },
        {
          key: "monthlyPayment" as RowKey,
          defaultLabel: "Megtakarítási havi összeg",
          value: getValue("monthlyPayment"),
          isNumeric: true,
        },
        {
          key: "yearlyPayment" as RowKey,
          defaultLabel: "Megtakarítási éves összeg",
          value: getValue("yearlyPayment"),
          isNumeric: true,
        },
        {
          key: "years" as RowKey,
          defaultLabel: "Tervezett időtartam",
          value: getValue("years"),
          isNumeric: true,
          suffix: " év",
          showCurrency: false,
        },
        {
          key: "totalContributions" as RowKey,
          defaultLabel: "Teljes befizetés",
          value: getValue("totalContributions"),
          isNumeric: true,
        },
        {
          key: "strategy" as RowKey,
          defaultLabel: "Hozam stratégia",
          value: getValue("strategy"),
          isNumeric: false,
        },
        {
          key: "annualYield" as RowKey,
          defaultLabel: "Éves nettó hozam",
          value: getValue("annualYield"),
          isNumeric: false,
        },
      ],
    },
    {
      title: "Hozamok és jóváírások",
      rows: [
        {
          key: "totalReturn" as RowKey,
          defaultLabel: "Várható hozam",
          value: getValue("totalReturn"),
          isNumeric: true,
        },
        {
          key: "endBalance" as RowKey,
          defaultLabel: "Megtakarítás számlán várható összeg",
          value: getValue("endBalance"),
          isNumeric: true,
        },
        ...(data.enableTaxCredit
          ? [
              {
                key: "totalTaxCredit" as RowKey,
                defaultLabel: "Adójóváírás a tartam alatt összesen",
                value: getValue("totalTaxCredit"),
                isNumeric: true,
              },
            ]
          : []),
        ...(data.productHasBonus
          ? [
              {
                key: "totalBonus" as RowKey,
                defaultLabel: "Bónuszjóváírás tartam alatt összesen",
                value: getValue("totalBonus"),
                isNumeric: true,
              },
            ]
          : []),
      ],
    },
    {
      title: "Végösszegek",
      highlight: true,
      rows: [
        {
          key: "finalEndBalance" as RowKey,
          defaultLabel: "Megtakarítási számlán várható összeg",
          value: getValue("finalEndBalance"),
          isNumeric: true,
          isHighlight: true,
          bgColor: "bg-primary text-primary-foreground",
        },
        ...(data.enableNetting
          ? [
              {
                key: "netFinalEndBalance" as RowKey,
                defaultLabel: "Megtakarítási számlán várható nettó összeg",
                value: getValue("netFinalEndBalance"),
                isNumeric: true,
                isHighlight: false,
                bgColor: "bg-secondary/80 text-secondary-foreground font-semibold",
              },
            ]
          : []),
        ...(data.endBalanceHufCurrent !== undefined
          ? [
              {
                key: "endBalanceHufCurrent" as RowKey,
                defaultLabel: "Jelen árfolyamon számolva",
                value: getValue("endBalanceHufCurrent"),
                isNumeric: true,
                bgColor: "bg-amber-700 dark:bg-amber-800",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
        ...(data.endBalanceEUR500 !== undefined
          ? [
              {
                key: "endBalanceEUR500" as RowKey,
                defaultLabel: "500 Ft-os Euróval számolva",
                value: getValue("endBalanceEUR500"),
                isNumeric: true,
                bgColor: "bg-amber-800 dark:bg-amber-900",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
        ...(data.endBalanceEUR600 !== undefined
          ? [
              {
                key: "endBalanceEUR600" as RowKey,
                defaultLabel: "600 Ft-os Euróval számolva",
                value: getValue("endBalanceEUR600"),
                isNumeric: true,
                bgColor: "bg-amber-900 dark:bg-amber-950",
                valueCurrency: "HUF",
                displayCurrency: "HUF",
                textClass: "text-white",
                textColor: "#ffffff",
              },
            ]
          : []),
      ],
    },
  ]

  const allRows = sections.flatMap((section) => section.rows)

  const buildOutlookEmail = (safeName: string, safeUntil: string) => {
    const tone = getEmailTone()

    const FONT = "Calibri, Arial, Helvetica, sans-serif"
    const BLUE = "#2F5597"
    const ORANGE = "#ED7D31"
    const ORANGE_DARK = "#C55A11"
    const ORANGE_DARKER = "#8a4b12"
    const BORDER = "#c9c9c9"

    const esc = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;")

    const spanOrange = (text: string) =>
      `<span style="display:inline-block; background:${ORANGE}; color:#ffffff; font-weight:700; padding:2px 8px;">${esc(text)}</span>`

    const heading = (text: string) =>
      `<div style="margin: 34px 0 12px 0;"><span style="display:inline-block; background:${ORANGE}; color:#ffffff; font-weight:700; padding:6px 12px; font-family:${FONT}; font-size:22px;">${esc(text)}</span></div>`

    const p = (text: string, bold = false) =>
      `<div style="color:${BLUE}; font-family:${FONT}; font-size:18px; line-height:1.35; ${bold ? "font-weight:700;" : "font-weight:600;"} margin: 0 0 6px 0;">${text}</div>`

    const pSpacer = (h = 14) => `<div style="height:${h}px; line-height:${h}px;">&nbsp;</div>`

    const getText = (key: RowKey) => String(getValue(key) ?? "")
    const getMoney = (key: RowKey) => formatValue(getValue(key) as number, true, "", undefined, data.displayCurrency)
    const getMoneyOrBlank = (key: RowKey) => {
      const v = getValue(key)
      if (v === undefined || v === null || v === "") return ""
      return typeof v === "number" ? formatValue(v, true, "", undefined, data.displayCurrency) : String(v)
    }

    const cellBase = `border:1px solid ${BORDER}; padding:7px 10px; font-family:${FONT}; font-size:16px; line-height:1.2;`
    const cellLabel = `${cellBase} color:#000000; font-weight:600;`
    const cellValue = `${cellBase} color:${BLUE}; font-weight:700; text-align:left; white-space:nowrap;`

    const tableRow = (label: string, valueText: string) => `
      <tr>
        <td style="${cellLabel}">${esc(label)}</td>
        <td style="${cellValue}">${esc(valueText)}</td>
      </tr>
    `

    const spacerRow = () => `
      <tr>
        <td style="${cellBase} background:#ffffff; height:16px;">&nbsp;</td>
        <td style="${cellBase} background:#ffffff; height:16px;">&nbsp;</td>
      </tr>
    `

    const highlightRow = (label: string, valueText: string) => `
      <tr>
        <td style="${cellBase} background:${ORANGE_DARK}; color:#ffffff; font-weight:700; font-size:18px;">${esc(label)}</td>
        <td style="${cellBase} background:${ORANGE_DARKER}; color:#ffffff; font-weight:700; font-size:18px; text-align:left; white-space:nowrap;">${esc(
          valueText,
        )}</td>
      </tr>
    `

    const productName = getText("accountName")
    const goal = getText("accountGoal")
    const monthly = getMoney("monthlyPayment")
    const yearly = getMoney("yearlyPayment")
    const years = formatValue(getValue("years") as number, false, " év", undefined, data.displayCurrency)
    const total = getMoney("totalContributions")
    const strategy = getText("strategy")
    const annualYield = getText("annualYield")
    const expectedReturn = getMoney("totalReturn")
    const expectedBalance = getMoney("endBalance")
    const totalBonus = data.productHasBonus ? getMoneyOrBlank("totalBonus") : ""
    const finalNet = getMoney("endBalance")

    const yearlyReviewLines = emailTegezo
      ? [
          "Évente egyszer a megtakarítási évforduló",
          "alkalmával kötelezően felkereslek és Velem,",
          "mint megtakarítási szakértőddel közösen,",
          "felülvizsgáljuk a megtakarítás számlád értékét.",
          "Valamint segítek eligazodni a hozamok,",
          "befektetési alapok között.",
        ]
      : [
          "Évente egyszer a megtakarítási évforduló",
          "alkalmával kötelezően felkeresem és Velem,",
          "mint megtakarítási szakértője támogatásával,",
          "felülvizsgáljuk a megtakarítás számla értékét.",
          "Valamint segítek eligazodni a hozamok,",
          "befektetési alapok között.",
        ]

    const rugalmasLines = emailTegezo
      ? [
          "amennyiben a megtakarítási időszak alatt szeretnél a",
          "Bónusz számládról pénzt kivenni, erre is van lehetőséged",
          "akár már harmadik év után.",
        ]
      : [
          "amennyiben a megtakarítási időszak alatt szeretne a",
          "Bónusz számlájáról pénzt kivenni, erre van lehetősége",
          "akár már harmadik év után.",
        ]

    const kamatadoLine = emailTegezo ? "Kamatadó mentes a megtakarítás 10 év után." : "Kamatadó mentes a megtakarítása 10 év után."

    const summaryTableHtml = `
      <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:760px; margin: 18px 0;">
        <tbody>
          ${tableRow("Megtakarítási számla megnevezése", productName)}
          ${tableRow("Megtakarítási számla célja:", goal)}
          ${tableRow("Megtakarítási havi összeg:", monthly)}
          ${tableRow("Megtakarítási éves összeg:", yearly)}
          ${tableRow("Tervezett időtartam:", years)}
          ${spacerRow()}
          ${tableRow("Teljes befizetés:", total)}
          ${tableRow("Hozam stratégia:", strategy)}
          ${tableRow("Éves nettó hozam:", annualYield)}
          ${tableRow("Várható hozam:", expectedReturn)}
          ${tableRow("Megtakarítás számlán várható összeg:", expectedBalance)}
          ${totalBonus ? tableRow("Bónuszjóváírás tartam alatt összesen:", totalBonus) : ""}
          ${highlightRow("Teljes megtakarítás nettó értéke:", finalNet)}
        </tbody>
      </table>
    `

    const tegezoHtml = `
      <div style="background:#ffffff; padding:0; margin:0;">
        <div style="padding-left: 40px;">
          <div style="font-family:${FONT}; color:${BLUE}; font-size:36px; font-style:italic; font-weight:700; margin: 0 0 18px 0;">
            ${esc(`Kedves ${safeName}!`)}
          </div>

          ${p("Telefonos megbeszélésünkre hivatkozva küldöm, Neked a")}
          ${p(`<span style="font-weight:700;">${esc(getEmailSubject())}</span>`)}
          ${p("terméktájékoztatóját, valamint a megtakarítási tervezetet.")}

          ${pSpacer(18)}

          ${p("Az alábbi ajánlat, Allianz prémium ügyfeleknek szóló konstrukció,", true)}
          ${p(
            `mely &nbsp; ${safeUntil ? `${spanOrange(safeUntil)}.-` : spanOrange("...")} ig érhető el.`,
            true,
          )}

          ${summaryTableHtml}

          ${pSpacer(24)}

          ${heading("Teljes költségmutató (TKM)")}
          ${p("A biztosítók más és más költséggel dolgoznak,")}
          ${p("ezt a mutatót az MNB hozta létre melynek célja,")}
          ${p("hogy a megtakarító tudjon mérlegelni, hogy")}
          ${p("melyik biztosítónál helyezi el a megtakarítását.")}
          ${pSpacer(16)}
          ${p("Látszólag mindegy, hogy hol takarítunk meg ugyanis,")}
          ${p("1-3 % különbség van a biztosítók TKM értékében,")}
          ${p("azonban ez a százalékos különbség hosszútávon")}
          ${p("Milliós különbséget tud jelenteni.", true)}

          ${heading("Díjmentes számlavezetés")}
          ${p("990 Ft a havi számlavezetési költség,")}
          ${p("melyet most az első évben elengedünk.", true)}

          ${heading("Díjmentes eszközalap váltás")}
          ${p("A piacon egyedülálló módon tudod a befektetésed")}
          ${p("kezelni, ugyanis az Allianznál limit nélkül tudsz a befektetési")}
          ${p("alapok között váltani.", true)}
          ${pSpacer(16)}
          ${p("Évente egyszer a megtakarítási évforduló")}
          ${p("alkalmával kötelezően felkereslek és Velem,")}
          ${p("mint megtakarítási szakértőddel közösen,")}
          ${p("felülvizsgáljuk a megtakarítás számlád értékét.")}
          ${p("Valamint segítek eligazodni a hozamok,")}
          ${p("befektetési alapok között.")}

          ${heading("FIX Bónusz jóváírás a hozamokon felül")}
          ${p("Minden évben kapsz bónusz jóváírást is,")}
          ${p("pontosan annyi százalékot,")}
          ${p("ahányadik évben jár a megtakarítási")}
          ${p("számlálád a következőképpen:", true)}
          ${p(`1. évben ${spanOrange("+1 % bónusz")}`)}
          ${p(`2. évben ${spanOrange("+2 % bónusz")}`)}
          ${p(`3. évben ${spanOrange("+3 % bónusz")}`)}
          ${p(`4. évben ${spanOrange("+4 % bónusz")}`)}
          ${p("..és így tovább egészen az utolsó megtakarítási évig bezárólag.")}
          ${p("Megéri tovább tervezni")}
          ${p(`ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kapsz az éves megtakarításaid után.`, true)}

          ${pSpacer(24)}
          ${p("<span style=\"font-weight:700;\">Világgazdasági Részvény</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("33,6 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("106,80 % / 5év")}`)}
          ${pSpacer(10)}
          ${p("<span style=\"font-weight:700;\">Ipari Nyersanyag Eszközalap</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,53 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("144,91 % / 5év")}`)}
          ${pSpacer(10)}
          ${p("<span style=\"font-weight:700;\">Környezettudatos Részvény</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,01 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("89,02 % / 5év")}`)}
          ${pSpacer(10)}
          <div style="font-family:${FONT}; font-size:12px; color:#000000; font-weight:700; margin-top: 6px;">
            forrás: profitline.hu - Ön is tudja ellenőrizni jelen megtakarítási hozamokat.
          </div>

          ${pSpacer(24)}
          ${p("amennyiben a fent meghatározott promóciós időszakban")}
          ${p(`indítod el megtakarítási számládat, &nbsp; <span style="font-weight:700;">3 000 000 Ft</span> összegre`)}
          ${p("biztosítjuk Téged közlekedési baleseti halál esetén,")}
          ${p("melyet az általad megjelölt kedvezményezett fog kapni", true)}

          ${heading("Biztonságos megtakarítási forma")}
          ${p("jogilag meghatározott formája nem teszi lehetővé,")}
          ${p("hogy az állam vagy a NAV inkasszálja az")}
          ${p("általad félretett összeget.", true)}
          ${p("Szociális hozzájárulási adó, valamint")}
          ${p("Kamatadó mentes a megtakarítás 10 év után.", true)}

          ${heading("Rugalmas")}
          ${p("amennyiben a megtakarítási időszak alatt szeretnél a")}
          ${p("Bónusz számládról pénzt kivenni, erre is van lehetőséged", true)}
          ${p("akár már harmadik év után.")}

          ${heading("Örökölhető")}
          ${p("halál esetén az általad megjelölt kedvezményezett kapja")}
          ${p("a megtakarítási számla összegét hagyatéki eljárás alá nem vonható,")}
          ${p("8 napon belül a kedvezményezett számlájára a teljes összeg kiutalásra kerül", true)}

          ${pSpacer(24)}
          ${p(
            "A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetésed és segíteni fogok Neked,",
          )}
          ${p(
            "hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket tudd meghozni a pénzügyeidet illetően.",
            true,
          )}
          ${p("Hiszem, hogy a folyamatos és rendszeres kommunikáció a siker alapja.", true)}
        </div>
      </div>
    `.trim()

    const magazosHtml = `
      <div style="background:#ffffff; padding:0; margin:0;">
        <div style="padding-left: 40px;">
          <div style="font-family:${FONT}; color:${BLUE}; font-size:36px; font-style:italic; font-weight:700; margin: 0 0 18px 0;">
            ${esc(`Kedves ${safeName}!`)}
          </div>

          ${p(`Telefonos megbeszélésünkre hivatkozva küldöm, <span style="font-weight:700;">${tone.youDative}</span> a`)}
          ${p(`<span style="font-weight:700;">${esc(getEmailSubject())}</span>`)}
          ${p("terméktájékoztatóját, valamint a megtakarítási tervezetet.")}

          ${pSpacer(18)}

          ${p(`Az alábbi ajánlat, Allianz prémium ügyfeleknek szóló konstrukció,`, true)}
          ${p(
            `mely ${safeUntil ? spanOrange(safeUntil) : spanOrange("...")} <span style="font-weight:700;">- ig</span> érhető el.`,
            true,
          )}

          ${summaryTableHtml}

          ${heading("Teljes költségmutató (TKM)")}
          ${p("A biztosítók más és más költséggel dolgoznak,")}
          ${p("ezt a mutatót az MNB hozta létre melynek célja,")}
          ${p("hogy a megtakarító tudjon mérlegelni, hogy")}
          ${p(
            emailTegezo
              ? "melyik biztosítónál helyezed el a megtakarításod."
              : "melyik biztosítónál helyezi el a megtakarítását.",
          )}
          ${pSpacer(16)}
          ${p(
            emailTegezo
              ? "Látszólag mindegy, hogy hol takarítunk meg ugyanis,"
              : "Látszólag mindegy, hogy hol takarít meg ugyanis,",
          )}
          ${p("1-3 % különbség van a biztosítók TKM értékében,")}
          ${p("azonban ez a százalékos különbség hosszútávon")}
          ${p(emailTegezo ? "Milliós különbséget tud jelenteni." : `${tone.youDative} milliós különbséget jelent.`, true)}

          ${heading("Díjmentes számlavezetés")}
          ${p(data.displayCurrency === "HUF" ? "990 Ft a havi számlavezetési költség," : "3.3 Euro a havi számlavezetési költség,")}
          ${p("melyet most az első évben elengedünk.", true)}

          ${heading("Díjmentes eszközalap váltás")}
          ${p(
            emailTegezo
              ? "A piacon egyedülálló módon tudod a befektetésed"
              : "Piacon egyedülálló módon tudja a befektetését",
          )}
          ${p(
            emailTegezo
              ? "kezelni, ugyanis az Allianznál limit nélkül tudsz a befektetési"
              : "kezelni, ugyanis limit nélkül tud a befektetési",
          )}
          ${p("alapok között váltani.", true)}
          ${pSpacer(16)}
          ${yearlyReviewLines.map((line) => p(line)).join("")}

          ${pSpacer(22)}
          ${p("<span style=\"font-weight:700;\">Világgazdasági Részvény</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("33,6 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("106,80 % / 5év")}`)}
          ${pSpacer(12)}
          ${p("<span style=\"font-weight:700;\">Ipari Nyersanyag Eszközalap</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,53 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("144,91 % / 5év")}`)}
          ${pSpacer(12)}
          ${p("<span style=\"font-weight:700;\">Környezettudatos Részvény</span>")}
          ${p(`2024 01. - 2025 01. hozam: ${spanOrange("27,01 % / év")}`)}
          ${p(`2020 01. - 2025 01. hozam: ${spanOrange("89,02 % / 5év")}`)}
          ${pSpacer(10)}
          <div style="font-family:${FONT}; font-size:12px; color:#000000; font-weight:700; margin-top: 6px;">
            forrás: profilline.hu - ${tone.youNom} is ${tone.canVerbSimple} ellenőrizni jelen megtakarítási hozamokat.
          </div>

          ${heading("FIX Bónusz jóváírás a hozamokon felül")}
          ${p(emailTegezo ? "Minden évben kapsz bónusz jóváírást is," : "Minden évben kap bónusz jóváírást,")}
          ${p("pontosan annyi százalékot,")}
          ${p("ahányadik évben jár a megtakarítási")}
          ${p(emailTegezo ? "számlád a következőképpen:" : "számlája a következőképpen:", true)}
          ${p(`1. évben ${spanOrange("+1 % bónusz")}`)}
          ${p(`2. évben ${spanOrange("+2 % bónusz")}`)}
          ${p(`3. évben ${spanOrange("+3 % bónusz")}`)}
          ${p(`4. évben ${spanOrange("+4 % bónusz")}`)}
          ${p("..és így tovább egészen az utolsó megtakarítási évig bezárólag.")}
          ${p("Megéri tovább tervezni", true)}
          ${p(
            emailTegezo
              ? `ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kapsz az éves megtakarításaid után.`
              : `ugyanis például a 10. évben már ${spanOrange("+10% jóváírást")} kap az éves megtakarításai után.`,
            true,
          )}

          ${pSpacer(26)}
          ${p("amennyiben a fent meghatározott promóciós időszakban")}
          ${p(
            data.displayCurrency === "HUF"
              ? emailTegezo
                ? `indítod el megtakarítási számládat, <span style="font-weight:700;">3 000 000 Ft</span> összegre`
                : `indítja el megtakarítási számláját, <span style="font-weight:700;">3 000 000 Ft</span> összegre`
              : emailTegezo
                ? `indítod el megtakarítási számládat, <span style="font-weight:700;">12 000 Euro</span> összegre`
                : `indítja el megtakarítási számláját, <span style="font-weight:700;">12 000 Euro</span> összegre`,
          )}
          ${p(`biztosítjuk ${tone.youAcc} közlekedési baleseti halál esetén,`)}
          ${p(`melyet ${tone.yourBy} megjelölt kedvezményezett fog kapni`, true)}

          ${heading("Biztonságos megtakarítási forma")}
          ${p("jogilag meghatározott formája nem teszi lehetővé,")}
          ${p("hogy az állam vagy a NAV inkasszálja az")}
          ${p(emailTegezo ? "általad félretett összeget." : `${tone.yourByCap} félretett összeget.`, true)}
          ${p("Szociális hozzájárulási adó, valamint")}
          ${p(kamatadoLine, true)}

          ${heading("Rugalmas")}
          ${rugalmasLines.map((line, idx) => p(line, idx === 1)).join("")}

          ${heading("Örökölhető")}
          ${p(`halál esetén ${tone.yourBy} megjelölt kedvezményezett kapja`)}
          ${p("a megtakarítási számla összegét hagyatéki eljárás alá nem vonható,")}
          ${p("8 napon belül a kedvezményezett számlájára a teljes összeg kiutalásra kerül", true)}

          ${pSpacer(26)}
          ${p(
            emailTegezo
              ? `A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetésed és segíteni fogok ${tone.youDative},`
              : `A közös munkánk során én folyamatosan figyelemmel fogom kísérni befektetését és segíteni fogok ${tone.youDative},`,
          )}
          ${p(
            emailTegezo
              ? `hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket ${tone.canVerb} meghozni a pénzügyeidet illetően.`
              : `hogy mindig a legkedvezőbb és az éppen aktuális élethelyzetéhez leginkább igazodó döntéseket ${tone.canVerb} meghozni a pénzügyeit illetően.`,
            true,
          )}
          ${p("Hiszem, hogy a folyamatos és rendszeres kommunikáció a siker alapja.", true)}
          ${pSpacer(22)}
          ${p(`További információért vagy bármilyen kérdés esetén ${tone.contactVerb} bizalommal:`, true)}
        </div>
      </div>
    `.trim()

    const html = emailTegezo ? tegezoHtml : magazosHtml

    const plainInstruction = emailTegezo
      ? "A formázott sablont a kalkulátorban a „Formázott sablon másolása” gombbal tudod kimásolni."
      : "A formázott sablont a kalkulátorban a „Formázott sablon másolása” gombbal tudja kimásolni."

    const plain = [
      `Kedves ${safeName}!`,
      "",
      plainInstruction,
      "",
      `Megnyitás: ${window.location.origin}/osszesites`,
    ].join("\n")

    return { html, plain }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="mb-6 flex flex-wrap gap-3 items-center">
          <Button
            variant="outline"
            onClick={() => router.push("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>

          <Button variant={isExcelView ? "default" : "outline"} onClick={() => setIsExcelView(!isExcelView)}>
            {isExcelView ? (
              <>
                <LayoutGrid className="w-4 h-4 mr-2" />
                Normál nézet
              </>
            ) : (
              <>
                <Table2 className="w-4 h-4 mr-2" />
                Excel nézet
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const subjectText = getEmailSubject()

              const lines: string[] = []
              lines.push("Szia,")
              lines.push("")
              lines.push("Az alábbi megtakarítási kalkuláció összesítést küldöm:")
              lines.push("")

              for (const section of sections) {
                lines.push(section.title)
                lines.push("—".repeat(section.title.length))

                for (const row of section.rows) {
                  const label = getLabel(row.key, row.defaultLabel)
                  const valueText = row.isNumeric
                    ? formatValue(
                        getValue(row.key) as number,
                        row.showCurrency !== false,
                        row.suffix || "",
                        row.valueCurrency,
                        row.displayCurrency,
                      )
                    : String(getValue(row.key))

                  lines.push(`${label}: ${valueText}`)
                }

                lines.push("")
              }

              lines.push(`Megnyitás: ${window.location.origin}/osszesites`)
              lines.push("")
              lines.push("Üdv,")

              const subject = encodeURIComponent(subjectText)
              const body = encodeURIComponent(lines.join("\n"))
              window.location.href = `mailto:?subject=${subject}&body=${body}`
            }}
          >
            <Mail className="w-4 h-4 mr-2" />
            E-mail küldése
          </Button>

          <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card px-3 py-2">
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground" htmlFor="emailClientName">
                Név (megszólítás)
              </Label>
              <Input
                id="emailClientName"
                value={emailClientName}
                onChange={(e) => setEmailClientName(e.target.value)}
                className="h-9 w-[180px]"
                placeholder="pl. Viktor"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground" htmlFor="emailOfferUntil">
                Ajánlat érvényes (YYYY.MM.DD)
              </Label>
              <Input
                id="emailOfferUntil"
                value={emailOfferUntil}
                onChange={(e) => setEmailOfferUntil(e.target.value)}
                className="h-9 w-[160px]"
                placeholder="2026.02.14"
              />
            </div>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground" htmlFor="emailTegezo">
                Tegező
              </Label>
              <div className="flex items-center gap-2">
                <Switch id="emailTegezo" checked={emailTegezo} onCheckedChange={setEmailTegezo} />
                <span className="text-xs text-muted-foreground">{emailTegezo ? "Tegező" : "Magázó"}</span>
              </div>
            </div>
            <Button
              variant="default"
              className="h-9"
              onClick={async () => {
                setEmailCopyStatus("idle")

                const safeName = (emailClientName || "Ügyfél").trim()
                const safeUntil = (emailOfferUntil || "").trim()
                const { html, plain } = buildOutlookEmail(safeName, safeUntil)

                try {
                  const ok = await copyHtmlToClipboard(html, plain)
                  setEmailCopyStatus(ok ? "copied" : "failed")
                } catch {
                  setEmailCopyStatus("failed")
                }
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              {emailCopyStatus === "copied"
                ? "Másolva!"
                : emailCopyStatus === "failed"
                  ? "Másolás sikertelen"
                  : "Formázott sablon másolása"}
            </Button>

            <Button
              variant="secondary"
              className="h-9"
              onClick={async () => {
                setEmailCopyStatus("idle")

                const safeName = (emailClientName || "Ügyfél").trim()
                const safeUntil = (emailOfferUntil || "").trim()
                const { html, plain } = buildOutlookEmail(safeName, safeUntil)

                const subjectText = getEmailSubject()
                const subject = encodeURIComponent(subjectText)
                const body = encodeURIComponent(
                  "A formázott sablont megpróbáltam a vágólapra másolni. Illeszd be ide (Ctrl/Cmd+V).",
                )

                const ok = await copyHtmlToClipboard(html, plain)
                setEmailCopyStatus(ok ? "copied" : "failed")

                // Try to open mail app after copy (not guaranteed on all mobiles)
                window.location.href = `mailto:?subject=${subject}&body=${body}`
              }}
            >
              <Copy className="w-4 h-4 mr-2" />
              Másol + e-mail
            </Button>

            <Button
              variant="outline"
              className="h-9"
              onClick={() => {
                const subjectText = getEmailSubject()
                const subject = encodeURIComponent(subjectText)
                const body = encodeURIComponent(
                  "A formázott sablont előbb másold a vágólapra a „Formázott sablon másolása” gombbal, majd illeszd be ide (Ctrl/Cmd+V).",
                )
                window.location.href = `mailto:?subject=${subject}&body=${body}`
              }}
            >
              <Mail className="w-4 h-4 mr-2" />
              Új e-mail megnyitása
            </Button>

            <div className="text-xs text-muted-foreground max-w-[520px]">
              Mobilon a `mailto:` gyakran csak sima szöveget támogat. Nyomd meg a{" "}
              <span className="font-medium">Formázott sablon másolása</span> gombot, majd az Outlook levélbe illeszd be.
            </div>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl">Összesítés</CardTitle>
          </CardHeader>
        </Card>

        {isExcelView ? (
          <Card>
            <CardContent className="p-4 overflow-x-auto">
              <table
                className="w-full border-collapse"
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  userSelect: "text",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "14px",
                  lineHeight: "1.3",
                }}
              >
                <thead></thead>
                <tbody>
                  {allRows.map((row, index) => {
                    const label = getLabel(row.key, row.defaultLabel)
                    const isEditingLabel = editingCell?.key === row.key && editingCell?.type === "label"
                    const isEditingValue = editingCell?.key === row.key && editingCell?.type === "value"
                    const displayValue = row.isNumeric
                      ? formatValue(
                          row.value as number,
                          row.showCurrency !== false,
                          row.suffix || "",
                          row.valueCurrency,
                          row.displayCurrency,
                        )
                      : (row.value as string)

                    const highlightStyle = row.isHighlight
                      ? { background: "#c66a2c", color: "#ffffff", fontWeight: 700 }
                      : {}

                    const labelStyle = row.isHighlight
                      ? { color: "#ffffff" }
                      : { color: "#1f2937", fontWeight: 600 }
                    const valueStyle = row.isHighlight ? { color: "#ffffff" } : { color: "#2b6cb0", fontWeight: 600 }
                    const labelStyleWithOverride = row.textColor ? { ...labelStyle, color: row.textColor } : labelStyle
                    const valueStyleWithOverride = row.textColor ? { ...valueStyle, color: row.textColor } : valueStyle

                    return (
                      <tr
                        key={index}
                        className={`border-b border-border ${
                          row.isHighlight
                            ? "bg-primary text-primary-foreground font-bold"
                            : row.bgColor
                              ? row.bgColor
                              : ""
                        }`}
                        style={highlightStyle}
                      >
                        <td
                          className="py-2 px-3 text-sm"
                          style={{ border: "1px solid #cfcfcf", padding: "6px 10px", ...labelStyleWithOverride }}
                          onClick={() => {
                            if (!isEditingLabel) handleCellClick(row.key, "label", label)
                          }}
                        >
                          {isEditingLabel ? (
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className="text-sm bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                            />
                          ) : (
                            <span>{label}</span>
                          )}
                        </td>
                        <td
                          className="py-2 px-3 text-sm text-right tabular-nums"
                          style={{
                            border: "1px solid #cfcfcf",
                            padding: "6px 10px",
                            textAlign: "right",
                            ...valueStyleWithOverride,
                          }}
                          onClick={() => {
                            if (!isEditingValue) handleCellClick(row.key, "value", displayValue)
                          }}
                        >
                          {isEditingValue ? (
                            <input
                              type="text"
                              inputMode={row.isNumeric ? "numeric" : "text"}
                              value={
                                isActivelyEditing
                                  ? editingText
                                  : row.isNumeric
                                    ? formatNumber(parseNumber(editingText))
                                    : editingText
                              }
                              onChange={(e) => setEditingText(e.target.value)}
                              onFocus={() => setIsActivelyEditing(true)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className="text-sm tabular-nums text-right bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                            />
                          ) : (
                            <span>{displayValue}</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {sections.map((section, sectionIndex) => (
                  <div key={sectionIndex}>
                    {section.rows.map((row, rowIndex) => {
                      const label = getLabel(row.key, row.defaultLabel)
                      const isEditingLabel = editingCell?.key === row.key && editingCell?.type === "label"
                      const isEditingValue = editingCell?.key === row.key && editingCell?.type === "value"

                      const displayValue = row.isNumeric
                        ? formatValue(
                            row.value as number,
                            row.showCurrency !== false,
                            row.suffix || "",
                            row.valueCurrency,
                            row.displayCurrency,
                          )
                        : (row.value as string)

                      return (
                        <div
                          key={`${sectionIndex}-${rowIndex}`}
                          className={`grid grid-cols-2 gap-4 px-4 md:px-6 py-3 md:py-4 transition-colors ${
                            row.isHighlight ? "summary-highlight-row hover:bg-primary/80" : "hover:bg-muted/30"
                          } ${row.bgColor || ""} ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                        >
                          {isEditingLabel ? (
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className={`text-sm md:text-base bg-transparent border-none focus:outline-none focus:ring-0 w-full ${
                                row.textClass || ""
                              } ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                            />
                          ) : (
                            <div
                              className={`text-sm md:text-base cursor-pointer ${row.isHighlight ? "font-bold" : ""} ${
                                row.textClass || ""
                              }`}
                              onClick={() => handleCellClick(row.key, "label", label)}
                            >
                              {label}:
                            </div>
                          )}

                          {isEditingValue ? (
                            <input
                              type="text"
                              inputMode={row.isNumeric ? "numeric" : "text"}
                              value={
                                isActivelyEditing
                                  ? editingText
                                  : row.isNumeric
                                    ? formatNumber(parseNumber(editingText))
                                    : editingText
                              }
                              onChange={(e) => setEditingText(e.target.value)}
                              onFocus={() => setIsActivelyEditing(true)}
                              onBlur={handleSaveEdit}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit()
                                if (e.key === "Escape") {
                                  setEditingCell(null)
                                  setEditingText("")
                                  setIsActivelyEditing(false)
                                }
                              }}
                              autoFocus
                              className={`text-sm md:text-base tabular-nums font-medium text-right bg-transparent border-none focus:outline-none focus:ring-0 w-full ${
                                row.textClass ? `${row.textClass} placeholder:text-inherit/70` : ""
                              } ${row.isHighlight ? "font-bold text-base md:text-xl" : ""}`}
                            />
                          ) : (
                            <div
                              className={`text-sm md:text-base tabular-nums font-medium text-right cursor-pointer ${
                                row.isHighlight ? "font-bold text-base md:text-xl" : ""
                              } ${row.textClass || ""}`}
                              onClick={() => handleCellClick(row.key, "value", displayValue)}
                            >
                              {displayValue}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
