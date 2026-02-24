"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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
          label: "Alfa Jáde",
          productType: "Életbiztosítás",
          mnbCode: "13415 / 13416",
          productCode: "TR19 / TR29",
          variants: [
            { label: "Alfa Jáde EUR", productType: "Életbiztosítás", mnbCode: "13415", productCode: "TR19" },
            { label: "Alfa Jáde USD", productType: "Életbiztosítás", mnbCode: "13416", productCode: "TR29" },
          ],
        },
        {
          value: "alfa_jovokep",
          label: "Alfa Jövőkép",
          productType: "Életbiztosítás",
          mnbCode: "13452",
          productCode: "TR10",
          variants: [{ label: "Alfa Jövőkép", productType: "Életbiztosítás", mnbCode: "13452", productCode: "TR10" }],
        },
        {
          value: "alfa_jovotervezo",
          label: "Alfa Jövőtervező",
          productType: "Életbiztosítás",
          mnbCode: "13403",
          productCode: "TR03",
          variants: [{ label: "Alfa Jövőtervező", productType: "Életbiztosítás", mnbCode: "13403", productCode: "TR03" }],
        },
        {
          value: "alfa_premium_selection",
          label: "Alfa Premium Selection",
          productType: "Nyugdíjbiztosítás / Életbiztosítás",
          mnbCode: "13431 / 13451 / 13413 / 13422 / 13414 / 13423",
          productCode: "TR09 / NY06 / TR18 / NY12 / TR28 / NY22",
          variants: [
            { label: "Alfa Premium Selection TR09", productType: "Életbiztosítás", mnbCode: "13431", productCode: "TR09" },
            { label: "Alfa Premium Selection NY06", productType: "Nyugdíjbiztosítás", mnbCode: "13451", productCode: "NY06" },
            { label: "Alfa Premium Selection TR18", productType: "Életbiztosítás", mnbCode: "13413", productCode: "TR18" },
            { label: "Alfa Premium Selection NY12", productType: "Nyugdíjbiztosítás", mnbCode: "13422", productCode: "NY12" },
            { label: "Alfa Premium Selection TR28", productType: "Életbiztosítás", mnbCode: "13414", productCode: "TR28" },
            { label: "Alfa Premium Selection NY22", productType: "Nyugdíjbiztosítás", mnbCode: "13423", productCode: "NY22" },
          ],
        },
        {
          value: "alfa_zen",
          label: "Alfa Zen",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "13424 / 13425",
          productCode: "NY13 / NY23",
          variants: [
            { label: "Alfa Zen NY13 (EUR)", productType: "Nyugdíjbiztosítás", mnbCode: "13424", productCode: "NY13" },
            { label: "Alfa Zen NY23 (USD)", productType: "Nyugdíjbiztosítás", mnbCode: "13425", productCode: "NY23" },
          ],
        },
        {
          value: "alfa_zen_pro",
          label: "Alfa Zen Pro",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "13433 / 13426 / 13427",
          productCode: "NY-08 / NY-14 / NY-24",
          variants: [
            { label: "Alfa Zen Pro NY-08 (HUF)", productType: "Nyugdíjbiztosítás", mnbCode: "13433", productCode: "NY-08" },
            { label: "Alfa Zen Pro NY-14 (EUR)", productType: "Nyugdíjbiztosítás", mnbCode: "13426", productCode: "NY-14" },
            { label: "Alfa Zen Pro NY-24 (USD)", productType: "Nyugdíjbiztosítás", mnbCode: "13427", productCode: "NY-24" },
          ],
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
      return [
        {
          value: "cig_esszenciae",
          label: "CIG Pannonia EsszenciaE",
          productType: "Életbiztosítás",
          mnbCode: "P0151 / P0251",
          productCode: "-",
        },
        {
          value: "cig_nyugdijkotvenye",
          label: "CIG Pannonia NyugdijkotvenyE",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "NyugdijkotvenyE",
          productCode: "NyugdijkotvenyE",
        },
      ]
    case "Generali":
      return [
        {
          value: "generali_kabala",
          label: "Generali Kabala",
          productType: "Életbiztosítás / Nyugdíjbiztosítás",
          mnbCode: "TODO",
          productCode: "U91",
          variants: [
            { label: "U91 Élet", productType: "Életbiztosítás", mnbCode: "TODO", productCode: "U91" },
            { label: "U91 Nyugdíj", productType: "Nyugdíjbiztosítás", mnbCode: "TODO", productCode: "U91" },
          ],
        },
        {
          value: "generali_mylife_extra_plusz",
          label: "Generali MyLife Extra Plusz",
          productType: "Életbiztosítás / Nyugdíjbiztosítás",
          mnbCode: "U67P",
          productCode: "U67P",
          variants: [
            { label: "U67P Élet", productType: "Életbiztosítás", mnbCode: "U67P", productCode: "U67P" },
            { label: "U67P Nyugdíj", productType: "Nyugdíjbiztosítás", mnbCode: "U67P", productCode: "U67P" },
          ],
        },
      ]
    case "Grupama":
      return [
        {
          value: "groupama_easy",
          label: "Groupama Easy Életbiztosítás",
          productType: "Életbiztosítás",
          mnbCode: "EASY",
          productCode: "EASY",
          variants: [
            { label: "Easy Life (adójóváírás nélkül)", productType: "Életbiztosítás", mnbCode: "EASY", productCode: "EASY" },
            { label: "Easy Life (adójóváírással)", productType: "Életbiztosítás", mnbCode: "EASY", productCode: "EASY" },
          ],
        },
        {
          value: "groupama_next",
          label: "Groupama Next Életbiztosítás",
          productType: "Életbiztosítás",
          mnbCode: "NEXT",
          productCode: "NEXT",
          variants: [
            { label: "100% UL / 0% hagyományos", productType: "Életbiztosítás", mnbCode: "NEXT", productCode: "NEXT" },
            { label: "75% UL / 25% hagyományos", productType: "Életbiztosítás", mnbCode: "NEXT", productCode: "NEXT" },
            { label: "0% UL / 100% hagyományos", productType: "Életbiztosítás", mnbCode: "NEXT", productCode: "NEXT" },
          ],
        },
      ]
    case "KnH":
      return []
    case "Magyar Posta":
      return []
    case "MetLife":
      return []
    case "NN":
      return []
    case "Signal Iduna":
      return [
        {
          value: "signal_elorelato_ul001",
          label: "Előrelátó Program",
          productType: "Életbiztosítás",
          mnbCode: "UL001",
          productCode: "UL001",
          variants: [{ label: "UL001", productType: "Életbiztosítás", mnbCode: "UL001", productCode: "UL001" }],
        },
        {
          value: "signal_nyugdij_terv_plusz_ny010",
          label: "SIGNAL Nyugdíj terv Plusz",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "NY010",
          productCode: "NY010",
          variants: [{ label: "NY010", productType: "Nyugdíjbiztosítás", mnbCode: "NY010", productCode: "NY010" }],
        },
        {
          value: "signal_nyugdijprogram_sn005",
          label: "SIGNAL IDUNA Nyugdíjprogram",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "SN005",
          productCode: "SN005",
          variants: [{ label: "SN005", productType: "Nyugdíjbiztosítás", mnbCode: "SN005", productCode: "SN005" }],
        },
        {
          value: "signal_ongondoskodasi_wl009",
          label: "Öngondoskodási terv 2.0 Plusz",
          productType: "Életbiztosítás",
          mnbCode: "WL009",
          productCode: "WL009",
          variants: [{ label: "WL009", productType: "Életbiztosítás", mnbCode: "WL009", productCode: "WL009" }],
        },
      ]
    case "Union":
      return [
        {
          value: "union_vienna_age_505",
          label: "UNION Vienna Age Nyugdíjbiztosítás",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "505",
          productCode: "505",
          variants: [
            { label: "505 (HUF)", productType: "Nyugdíjbiztosítás", mnbCode: "505", productCode: "505" },
            { label: "505 (EUR)", productType: "Nyugdíjbiztosítás", mnbCode: "505", productCode: "505" },
            { label: "505 (USD)", productType: "Nyugdíjbiztosítás", mnbCode: "505", productCode: "505" },
          ],
        },
        {
          value: "union_vienna_plan_500",
          label: "UNION Vienna Plan Életbiztosítás",
          productType: "Életbiztosítás",
          mnbCode: "500",
          productCode: "500",
          variants: [
            { label: "500 (HUF)", productType: "Életbiztosítás", mnbCode: "500", productCode: "500" },
            { label: "500 (EUR)", productType: "Életbiztosítás", mnbCode: "500", productCode: "500" },
            { label: "500 (USD)", productType: "Életbiztosítás", mnbCode: "500", productCode: "500" },
          ],
        },
        {
          value: "union_vienna_time",
          label: "UNION Vienna Time Nyugdíjbiztosítás",
          productType: "Nyugdíjbiztosítás",
          mnbCode: "564 / 584 / 606",
          productCode: "564 / 584 / 606",
          variants: [
            { label: "Erste 564 (HUF)", productType: "Nyugdíjbiztosítás", mnbCode: "564", productCode: "564" },
            { label: "Standard 584 (HUF)", productType: "Nyugdíjbiztosítás", mnbCode: "584", productCode: "584" },
            { label: "Select 606 (HUF)", productType: "Nyugdíjbiztosítás", mnbCode: "606", productCode: "606" },
          ],
        },
        {
          value: "union_classic",
          label: "Classic",
          productType: "Életbiztosítás",
          mnbCode: "98765",
          productCode: "UN-01",
        },
      ]
    case "Uniqa":
      return [
        {
          value: "uniqa_eletcel_275",
          label: "Életcél",
          productType: "Életbiztosítás",
          mnbCode: "275",
          productCode: "275",
          variants: [{ label: "275 (HUF)", productType: "Életbiztosítás", mnbCode: "275", productCode: "275" }],
        },
        {
          value: "uniqa_premium_life_190",
          label: "Premium Life",
          productType: "Életbiztosítás",
          mnbCode: "190",
          productCode: "190",
          variants: [{ label: "190 (HUF)", productType: "Életbiztosítás", mnbCode: "190", productCode: "190" }],
        },
      ]
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

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()

export default function OsszehasonlitasPage() {
  const router = useRouter()
  const [productSearch, setProductSearch] = useState("")
  const allProductsForComparison = useMemo(() => getAllProductsForComparison(), [])
  const filteredProductsForComparison = useMemo(() => {
    const normalizedQuery = normalizeSearchText(productSearch)
    if (!normalizedQuery) return allProductsForComparison
    return allProductsForComparison.filter(({ insurer, product }) => {
      const haystack = normalizeSearchText(`${insurer} ${product.label}`)
      return haystack.includes(normalizedQuery)
    })
  }, [allProductsForComparison, productSearch])

  const [selectedProductsForComparison, setSelectedProductsForComparison] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("calculator-selectedProductsForComparison")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          if (Array.isArray(parsed)) {
            return parsed
              .filter((entry): entry is string => typeof entry === "string")
              .map((entry) => entry.replace("-alfa_zen_eur", "-alfa_zen"))
          }
          return []
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
      const validKeys = new Set(allProductsForComparison.map(({ insurer, product }) => `${insurer}-${product.value}`))
      const sanitized = selectedProductsForComparison
        .map((key) => key.replace("-alfa_zen_eur", "-alfa_zen"))
        .filter((key) => validKeys.has(key))
      sessionStorage.setItem("calculator-selectedProductsForComparison", JSON.stringify(sanitized))
      if (sanitized.length !== selectedProductsForComparison.length) {
        setSelectedProductsForComparison(sanitized)
      }
    }
  }, [selectedProductsForComparison, allProductsForComparison])

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
        currency: inputs?.currency,
        selectedProductsForComparison,
      }),
    [inputs?.enableTaxCredit, inputs?.currency, selectedProductsForComparison],
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
    if (productValue === "alfa_jovokep") return "alfa-jovokep"
    if (productValue === "alfa_jovotervezo") return "alfa-jovotervezo"
    if (productValue === "alfa_premium_selection") return "alfa-premium-selection"
    if (productValue === "alfa_relax_plusz") return "alfa-relax-plusz"
    if (productValue === "alfa_zen" || productValue === "alfa_zen_eur") return "alfa-zen"
    if (productValue === "alfa_zen_pro") return "alfa-zen-pro"
    if (productValue === "generali_kabala") return "generali-kabala-u91"
    if (productValue === "generali_mylife_extra_plusz") return "generali-mylife-extra-plusz"
    if (productValue === "cig_esszenciae") return "cig-esszenciae"
    if (productValue === "cig_nyugdijkotvenye") return "cig-nyugdijkotvenye"
    if (productValue === "signal_elorelato_ul001") return "signal-elorelato-ul001"
    if (productValue === "signal_nyugdij_terv_plusz_ny010") return "signal-nyugdij-terv-plusz-ny010"
    if (productValue === "signal_nyugdijprogram_sn005") return "signal-nyugdijprogram-sn005"
    if (productValue === "signal_ongondoskodasi_wl009") return "signal-ongondoskodasi-wl009"
    if (productValue === "union_vienna_age_505") return "union-vienna-age-505"
    if (productValue === "union_vienna_plan_500") return "union-vienna-plan-500"
    if (productValue === "union_vienna_time") return "union-vienna-time-584"
    if (productValue === "uniqa_eletcel_275") return "uniqa-eletcel-275"
    if (productValue === "uniqa_premium_life_190") return "uniqa-premium-life-190"
    if (productValue === "groupama_next") return "groupama-next"
    if (productValue === "groupama_easy") return "groupama-easy"
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
        if (typeof productKey !== "string") return null
        const allProducts = getAllProductsForComparison()
        const legacyNormalizedKey = productKey.replace("-alfa_zen_eur", "-alfa_zen")
        const productData = allProducts.find((p) => `${p.insurer}-${p.product.value}` === legacyNormalizedKey)
        if (!productData) return null

        try {
          const insurer = productData.insurer
          const productValue = productData.product.value
          const productId = mapSelectedProductToProductId(insurer, productValue)
          const isAllianzProduct = productId === "allianz-eletprogram"
          const isBonusVariant = productValue === "allianz_bonusz_eletprogram"
          const effectiveCurrency =
            productValue === "alfa_jade"
              ? (inputs.currency === "USD" ? "USD" : "EUR")
              : productValue === "alfa_jovokep"
                ? "HUF"
                : productValue === "alfa_jovotervezo"
                  ? "HUF"
                : productValue === "alfa_relax_plusz"
                  ? "HUF"
                : productValue === "generali_kabala"
                  ? "HUF"
                : productValue === "generali_mylife_extra_plusz"
                  ? "HUF"
                : productValue === "cig_esszenciae"
                  ? (inputs.currency === "EUR" ? "EUR" : "HUF")
                : productValue === "cig_nyugdijkotvenye"
                  ? "HUF"
                : productValue === "alfa_zen_pro"
                  ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
                : productValue === "alfa_zen" || productValue === "alfa_zen_eur"
                  ? (inputs.currency === "USD" ? "USD" : "EUR")
                : productValue === "alfa_premium_selection"
                  ? inputs.currency === "USD"
                    ? "USD"
                    : inputs.enableTaxCredit
                      ? (inputs.currency === "EUR" ? "EUR" : "HUF")
                      : inputs.currency === "EUR"
                        ? "EUR"
                        : "HUF"
                : productValue === "signal_elorelato_ul001"
                  ? "HUF"
                : productValue === "signal_nyugdij_terv_plusz_ny010"
                  ? "HUF"
                : productValue === "signal_nyugdijprogram_sn005"
                  ? "HUF"
                : productValue === "signal_ongondoskodasi_wl009"
                  ? "HUF"
                : productValue === "union_vienna_age_505"
                  ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
                : productValue === "union_vienna_plan_500"
                  ? (inputs.currency === "USD" ? "USD" : inputs.currency === "EUR" ? "EUR" : "HUF")
                : productValue === "union_vienna_time"
                  ? "HUF"
                : productValue === "uniqa_eletcel_275"
                  ? "HUF"
                : productValue === "uniqa_premium_life_190"
                  ? "HUF"
                : productValue === "groupama_next"
                  ? "HUF"
                : productValue === "groupama_easy"
                  ? "HUF"
                : inputs.currency
          const effectiveProductVariant =
            productValue === "alfa_exclusive_plus"
              ? inputs.enableTaxCredit
                ? "alfa_exclusive_plus_ny05"
                : "alfa_exclusive_plus_tr08"
              : productValue === "alfa_jade"
                ? effectiveCurrency === "USD"
                  ? "alfa_jade_tr29"
                  : "alfa_jade_tr19"
                : productValue === "alfa_jovokep"
                  ? "alfa_jovokep_tr10"
                : productValue === "alfa_jovotervezo"
                  ? "alfa_jovotervezo_tr03"
                : productValue === "alfa_relax_plusz"
                  ? "alfa_relax_plusz_ny01"
                : productValue === "alfa_zen_pro"
                  ? (effectiveCurrency === "USD"
                      ? "alfa_zen_pro_ny24"
                      : effectiveCurrency === "EUR"
                        ? "alfa_zen_pro_ny14"
                        : "alfa_zen_pro_ny08")
                : productValue === "alfa_zen" || productValue === "alfa_zen_eur"
                  ? (effectiveCurrency === "USD" ? "alfa_zen_ny23" : "alfa_zen_ny13")
                : productValue === "generali_kabala"
                  ? (inputs.enableTaxCredit ? "generali_kabala_u91_pension" : "generali_kabala_u91_life")
                : productValue === "generali_mylife_extra_plusz"
                  ? (inputs.enableTaxCredit
                      ? "generali_mylife_extra_plusz_u67p_pension"
                      : "generali_mylife_extra_plusz_u67p_life")
                : productValue === "cig_esszenciae"
                  ? (effectiveCurrency === "EUR" ? "cig_esszenciae_eur" : "cig_esszenciae_huf")
                : productValue === "cig_nyugdijkotvenye"
                  ? "cig_nyugdijkotvenye_nyugdij"
                : productValue === "alfa_premium_selection"
                  ? effectiveCurrency === "USD"
                    ? (inputs.enableTaxCredit ? "alfa_premium_selection_ny22" : "alfa_premium_selection_tr28")
                    : inputs.enableTaxCredit
                    ? effectiveCurrency === "EUR"
                      ? "alfa_premium_selection_ny12"
                      : "alfa_premium_selection_ny06"
                    : effectiveCurrency === "EUR"
                      ? "alfa_premium_selection_tr18"
                      : "alfa_premium_selection_tr09"
                : productValue === "signal_elorelato_ul001"
                  ? "signal_elorelato_ul001_huf"
                : productValue === "signal_nyugdij_terv_plusz_ny010"
                  ? "signal_nyugdij_terv_plusz_ny010_huf"
                : productValue === "signal_nyugdijprogram_sn005"
                  ? "signal_nyugdijprogram_sn005_huf"
                : productValue === "signal_ongondoskodasi_wl009"
                  ? "signal_ongondoskodasi_wl009_huf"
                : productValue === "union_vienna_age_505"
                  ? (
                      effectiveCurrency === "USD"
                        ? ((inputs.productVariant ?? "").includes("__bonus_blocked")
                            ? "union_vienna_age_505_usd__bonus_blocked"
                            : "union_vienna_age_505_usd")
                        : effectiveCurrency === "EUR"
                          ? ((inputs.productVariant ?? "").includes("__bonus_blocked")
                              ? "union_vienna_age_505_eur__bonus_blocked"
                              : "union_vienna_age_505_eur")
                          : ((inputs.productVariant ?? "").includes("__bonus_blocked")
                              ? "union_vienna_age_505_huf__bonus_blocked"
                              : "union_vienna_age_505_huf")
                    )
                : productValue === "union_vienna_plan_500"
                  ? (
                      effectiveCurrency === "USD"
                        ? "union_vienna_plan_500_usd"
                        : effectiveCurrency === "EUR"
                          ? "union_vienna_plan_500_eur"
                          : "union_vienna_plan_500_huf"
                    )
                : productValue === "union_vienna_time"
                  ? (inputs.productVariant?.includes("564")
                      ? "union_vienna_time_564"
                      : inputs.productVariant?.includes("606")
                        ? "union_vienna_time_606"
                        : "union_vienna_time_584")
                : productValue === "uniqa_eletcel_275"
                  ? "uniqa_eletcel_275_huf"
                : productValue === "uniqa_premium_life_190"
                  ? "uniqa_premium_life_190_huf"
                : productValue === "groupama_next"
                  ? (
                      (inputs.productVariant ?? "").includes("ul0")
                        ? "groupama_next_ul0_trad100_huf"
                        : (inputs.productVariant ?? "").includes("ul75")
                          ? "groupama_next_ul75_trad25_huf"
                          : "groupama_next_ul100_trad0_huf"
                    )
                : productValue === "groupama_easy"
                  ? (inputs.enableTaxCredit ? "groupama_easy_life_tax_huf" : "groupama_easy_life_huf")
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
            Array.from({ length: durationInYears }, (_, i) => [i + 1, i < 3 ? 0 : 0.145]),
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
        } catch (error) {
          console.error("[v0] Comparison calculation failed for product key:", productKey, error)
          return null
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
              <Input
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
                placeholder="Keresés terméknévre vagy biztosítóra..."
                className="h-9"
              />
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {filteredProductsForComparison.map(({ insurer, product }) => {
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
                {filteredProductsForComparison.length === 0 && (
                  <p className="text-sm text-muted-foreground py-2">Nincs találat a keresésre.</p>
                )}
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

