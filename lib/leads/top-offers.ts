import { calculate } from "@/lib/engine/calculate"
import { PRODUCTS, type ProductId } from "@/lib/engine/products"
import type { InputsDaily, PaymentFrequency } from "@/lib/engine/calculate-results-daily"
import type { LeadPayload } from "@/lib/leads/schema"
import { buildYearlyPlan } from "@/lib/plan"

type LeadCurrency = "HUF" | "EUR" | "USD"

export type LeadTopOffer = {
  productId: ProductId
  insurer: string
  label: string
  surrenderValue: number
  endBalance: number
  totalContributions: number
  ratioPercent: number
}

export type LeadMetricKey = "surrenderValue" | "endBalance" | "totalContributions"

export type LeadChartSeries = {
  key: LeadMetricKey
  label: string
  items: Array<{
    productId: ProductId
    insurer: string
    label: string
    value: number
    ratioPercent: number
  }>
}

export type LeadEmailInsights = {
  requestType: LeadPayload["requestType"]
  horizonYears: number
  currency: LeadCurrency
  offers: LeadTopOffer[]
  chartSeries: LeadChartSeries[]
  evaluatedCount: number
  additionalOptionsCount: number
}

const EXCLUDED_PRODUCT_IDS = new Set<ProductId>(["dm-pro", "alfa-zen-eur", "metlife-manhattan-eur"])

function toRecordNumber(value: unknown): Record<number, number> {
  if (!value || typeof value !== "object") return {}
  const entries = Object.entries(value as Record<string, unknown>)
  const output: Record<number, number> = {}
  for (const [key, raw] of entries) {
    const year = Number(key)
    const num = Number(raw)
    if (Number.isFinite(year) && Number.isFinite(num)) {
      output[year] = num
    }
  }
  return output
}

function toNumber(value: unknown, fallback = 0): number {
  const num = typeof value === "string" ? Number(value.replace(",", ".")) : Number(value)
  return Number.isFinite(num) ? num : fallback
}

function getInsurerByProductId(productId: ProductId): string {
  if (productId.startsWith("alfa-")) return "Alfa"
  if (productId.startsWith("allianz-")) return "Allianz"
  if (productId.startsWith("cig-")) return "CIG Pannonia"
  if (productId.startsWith("generali-")) return "Generali"
  if (productId.startsWith("groupama-")) return "Groupama"
  if (productId.startsWith("knh-")) return "K&H"
  if (productId.startsWith("metlife-")) return "MetLife"
  if (productId.startsWith("nn-")) return "NN"
  if (productId.startsWith("posta-")) return "Magyar Posta"
  if (productId.startsWith("signal-")) return "Signal Iduna"
  if (productId.startsWith("union-")) return "Union"
  if (productId.startsWith("uniqa-")) return "UNIQA"
  return "Egyéb"
}

function getDurationUnit(payload: LeadPayload): "year" | "month" | "day" {
  const fromSnapshot = payload.calcSnapshot["calculator-durationUnit"]
  if (fromSnapshot === "year" || fromSnapshot === "month" || fromSnapshot === "day") return fromSnapshot
  const fromSummary = payload.calcSummary.durationUnit
  if (fromSummary === "year" || fromSummary === "month" || fromSummary === "day") return fromSummary
  return "year"
}

function getHorizonValue(payload: LeadPayload): number {
  const fromSnapshot = toNumber(payload.calcSnapshot["calculator-durationValue"], NaN)
  if (Number.isFinite(fromSnapshot) && fromSnapshot > 0) return fromSnapshot
  const fromSummary = toNumber(payload.calcSummary.durationValue, NaN)
  if (Number.isFinite(fromSummary) && fromSummary > 0) return fromSummary
  const fromForm = toNumber(payload.formPayload.horizon, NaN)
  if (Number.isFinite(fromForm) && fromForm > 0) return fromForm
  return 10
}

function getHorizonYears(unit: "year" | "month" | "day", value: number): number {
  if (unit === "month") return Math.max(1, Math.ceil(value / 12))
  if (unit === "day") return Math.max(1, Math.ceil(value / 365))
  return Math.max(1, Math.ceil(value))
}

function getFrequency(payload: LeadPayload, rawInputs: Record<string, unknown>): PaymentFrequency {
  const raw = rawInputs.frequency ?? payload.formPayload.frequency
  if (raw === "havi" || raw === "negyedéves" || raw === "féléves" || raw === "éves") return raw
  return "havi"
}

function getCurrency(payload: LeadPayload, rawInputs: Record<string, unknown>): LeadCurrency {
  const value = rawInputs.currency ?? payload.calcSummary.currency
  if (value === "HUF" || value === "EUR" || value === "USD") return value
  return "HUF"
}

function getProductIds(): ProductId[] {
  return (Object.keys(PRODUCTS) as ProductId[]).filter((productId) => !EXCLUDED_PRODUCT_IDS.has(productId))
}

function toMetricChartSeries(key: LeadMetricKey, label: string, offers: LeadTopOffer[]): LeadChartSeries {
  const maxValue = Math.max(1, ...offers.map((offer) => offer[key]))
  return {
    key,
    label,
    items: offers.map((offer) => ({
      productId: offer.productId,
      insurer: offer.insurer,
      label: offer.label,
      value: offer[key],
      ratioPercent: Math.max(8, Math.round((offer[key] / maxValue) * 100)),
    })),
  }
}

export function computeLeadEmailInsights(payload: LeadPayload): LeadEmailInsights | null {
  if (!["A", "B", "C"].includes(payload.requestType)) return null

  const rawInputs = (payload.calcSnapshot["calculator-inputs"] as Record<string, unknown> | undefined) ?? {}
  const durationUnit = getDurationUnit(payload)
  const durationValue = getHorizonValue(payload)
  const horizonYears = getHorizonYears(durationUnit, durationValue)
  const frequency = getFrequency(payload, rawInputs)
  const currency = getCurrency(payload, rawInputs)

  const regularPayment = toNumber(rawInputs.regularPayment ?? payload.formPayload.amount ?? payload.formPayload.bcAmount, 0)
  const keepYearlyPayment = Boolean(rawInputs.keepYearlyPayment)
  const annualIndexPercent = toNumber(rawInputs.annualIndexPercent, 0)
  const annualYieldPercent = toNumber(rawInputs.annualYieldPercent, 12)
  const enableTaxCredit = Boolean(rawInputs.enableTaxCredit)
  const taxCreditAmountByYear = toRecordNumber(payload.calcSnapshot["calculator-taxCreditAmountByYear"])
  const taxCreditLimitByYear = toRecordNumber(payload.calcSnapshot["calculator-taxCreditLimitByYear"])
  const indexByYear = toRecordNumber(payload.calcSnapshot["calculator-indexByYear"])
  const paymentByYear = toRecordNumber(payload.calcSnapshot["calculator-paymentByYear"])
  const withdrawalByYear = toRecordNumber(payload.calcSnapshot["calculator-withdrawalByYear"])

  const periodsPerYear = frequency === "havi" ? 12 : frequency === "negyedéves" ? 4 : frequency === "féléves" ? 2 : 1
  const baseYear1Payment = keepYearlyPayment ? regularPayment * 12 : regularPayment * periodsPerYear
  if (!Number.isFinite(baseYear1Payment) || baseYear1Payment <= 0) return null

  const plan = buildYearlyPlan({
    years: horizonYears,
    baseYear1Payment,
    baseAnnualIndexPercent: annualIndexPercent,
    indexByYear,
    paymentByYear,
    withdrawalByYear,
  })

  const baseInputs: InputsDaily = {
    ...rawInputs,
    currency,
    durationUnit,
    durationValue,
    frequency,
    annualYieldPercent,
    enableTaxCredit,
    yearsPlanned: horizonYears,
    yearlyPaymentsPlan: plan.yearlyPaymentsPlan,
    yearlyWithdrawalsPlan: plan.yearlyWithdrawalsPlan,
    taxCreditAmountByYear,
    taxCreditLimitByYear,
  } as InputsDaily

  const evaluated: Array<Omit<LeadTopOffer, "ratioPercent">> = []
  for (const productId of getProductIds()) {
    try {
      const result = calculate(productId, baseInputs)
      const targetRow = result.yearlyBreakdown.find((row) => row.year === horizonYears) ?? result.yearlyBreakdown.at(-1)
      const surrenderValue = targetRow?.surrenderValue ?? result.endBalance
      const endBalance = targetRow?.endBalance ?? result.endBalance
      const totalContributions = targetRow?.totalContributions ?? result.totalContributions
      if (!Number.isFinite(surrenderValue) || surrenderValue <= 0) continue

      evaluated.push({
        productId,
        insurer: getInsurerByProductId(productId),
        label: PRODUCTS[productId].label,
        surrenderValue,
        endBalance: Number.isFinite(endBalance) ? endBalance : 0,
        totalContributions: Number.isFinite(totalContributions) ? totalContributions : 0,
      })
    } catch {
      continue
    }
  }

  if (evaluated.length === 0) return null

  const dedupedByLabel = new Map<string, Omit<LeadTopOffer, "ratioPercent">>()
  for (const row of evaluated) {
    const key = `${row.insurer}:${row.label}`
    const previous = dedupedByLabel.get(key)
    if (!previous || row.surrenderValue > previous.surrenderValue) dedupedByLabel.set(key, row)
  }

  const ranked = Array.from(dedupedByLabel.values()).sort((a, b) => b.surrenderValue - a.surrenderValue)
  const top3Raw = ranked.slice(0, 3)
  const maxValue = top3Raw[0]?.surrenderValue ?? 1
  const offers: LeadTopOffer[] = top3Raw.map((offer) => ({
    ...offer,
    ratioPercent: Math.max(8, Math.round((offer.surrenderValue / maxValue) * 100)),
  }))

  const chartSeries: LeadChartSeries[] = [
    toMetricChartSeries("endBalance", "Egyenleg", offers),
    toMetricChartSeries("totalContributions", "Összes befizetés", offers),
    toMetricChartSeries("surrenderValue", "Visszavásárlási érték", offers),
  ]

  return {
    requestType: payload.requestType,
    horizonYears,
    currency,
    offers,
    chartSeries,
    evaluatedCount: ranked.length,
    additionalOptionsCount: Math.max(0, ranked.length - offers.length),
  }
}
