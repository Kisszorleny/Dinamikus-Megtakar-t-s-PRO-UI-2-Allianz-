import { normalizeFundRows, sliceFundSeries } from "@/lib/funds/normalize"
import type { FundPriceSeries } from "@/lib/funds/types"

type ProviderFetchOptions = {
  fundId: string
  from?: string
  to?: string
}

type JsonRecord = Record<string, unknown>

const DATE_KEYS = ["date", "datum", "day", "asOfDate", "navDate", "tradingDate"]
const PRICE_KEYS = ["price", "nav", "close", "value", "arfolyam", "unitPrice"]
const CURRENCY_KEYS = ["currency", "deviza"]

function getEnvMap(): Record<string, string> {
  const raw = process.env.FUND_PRICE_SOURCE_MAP_JSON
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === "object" && parsed ? (parsed as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function resolveEndpoint(fundId: string): string | null {
  const mapped = getEnvMap()[fundId]
  if (mapped) return mapped

  const template = process.env.FUND_PRICE_SOURCE_URL_TEMPLATE
  if (!template) return null
  return template.replace("{fundId}", encodeURIComponent(fundId))
}

function detectCurrency(records: JsonRecord[]): string | undefined {
  for (const rec of records) {
    for (const key of CURRENCY_KEYS) {
      const value = rec[key]
      if (typeof value === "string" && value.trim()) return value.trim().toUpperCase()
    }
  }
  return undefined
}

function parseJsonRows(payload: unknown): Array<{ date: string; price: number }> {
  const candidates: JsonRecord[] = []

  if (Array.isArray(payload)) {
    for (const item of payload) {
      if (item && typeof item === "object") candidates.push(item as JsonRecord)
    }
  } else if (payload && typeof payload === "object") {
    const obj = payload as JsonRecord
    const nested = [obj.data, obj.items, obj.values, obj.prices, obj.rows]
    for (const branch of nested) {
      if (Array.isArray(branch)) {
        for (const item of branch) {
          if (item && typeof item === "object") candidates.push(item as JsonRecord)
        }
      }
    }
  }

  const rows: Array<{ date: string; price: number }> = []
  for (const rec of candidates) {
    let dateRaw: unknown
    let priceRaw: unknown
    for (const key of DATE_KEYS) {
      if (rec[key] !== undefined) {
        dateRaw = rec[key]
        break
      }
    }
    for (const key of PRICE_KEYS) {
      if (rec[key] !== undefined) {
        priceRaw = rec[key]
        break
      }
    }
    if (typeof dateRaw !== "string") continue
    const num =
      typeof priceRaw === "number"
        ? priceRaw
        : typeof priceRaw === "string"
          ? Number(priceRaw.replace(/\s/g, "").replace(",", "."))
          : Number.NaN
    if (!Number.isFinite(num)) continue
    rows.push({ date: dateRaw, price: num })
  }
  return rows
}

function parseCsvRows(csv: string): Array<{ date: string; price: number }> {
  const lines = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return []

  const delimiter = lines[0].includes(";") ? ";" : ","
  const headers = lines[0].split(delimiter).map((h) => h.trim())
  let dateIndex = -1
  let priceIndex = -1

  headers.forEach((header, idx) => {
    const h = header.toLowerCase()
    if (dateIndex === -1 && DATE_KEYS.some((k) => h.includes(k.toLowerCase()))) dateIndex = idx
    if (priceIndex === -1 && PRICE_KEYS.some((k) => h.includes(k.toLowerCase()))) priceIndex = idx
  })

  if (dateIndex === -1 || priceIndex === -1) {
    dateIndex = 0
    priceIndex = 1
  }

  const rows: Array<{ date: string; price: number }> = []
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ""))
    const date = cells[dateIndex]
    const priceRaw = cells[priceIndex]
    if (!date || !priceRaw) continue
    const price = Number(priceRaw.replace(/\s/g, "").replace(",", "."))
    if (!Number.isFinite(price)) continue
    rows.push({ date, price })
  }
  return rows
}

function parseXmlRows(xml: string): Array<{ date: string; price: number }> {
  const dateMatches = Array.from(xml.matchAll(/<(?:date|datum|day|navDate)>\s*([^<]+)\s*<\/(?:date|datum|day|navDate)>/gi))
  const priceMatches = Array.from(
    xml.matchAll(/<(?:price|nav|close|value|arfolyam|unitPrice)>\s*([^<]+)\s*<\/(?:price|nav|close|value|arfolyam|unitPrice)>/gi),
  )

  const rows: Array<{ date: string; price: number }> = []
  const len = Math.min(dateMatches.length, priceMatches.length)
  for (let i = 0; i < len; i++) {
    const date = (dateMatches[i][1] ?? "").trim()
    const price = Number((priceMatches[i][1] ?? "").trim().replace(/\s/g, "").replace(",", "."))
    if (!date || !Number.isFinite(price)) continue
    rows.push({ date, price })
  }
  return rows
}

export async function fetchInsurerPublicFundSeries(options: ProviderFetchOptions): Promise<FundPriceSeries> {
  const endpoint = resolveEndpoint(options.fundId)
  if (!endpoint) {
    throw new Error("No public fund endpoint configured for this fund.")
  }

  const response = await fetch(endpoint, {
    next: { revalidate: 60 * 30 },
    headers: { Accept: "application/json, text/csv, text/plain, application/xml, text/xml" },
  })

  if (!response.ok) {
    throw new Error(`Fund source request failed with status ${response.status}`)
  }

  const contentType = (response.headers.get("content-type") || "").toLowerCase()
  const body = await response.text()

  let parsedRows: Array<{ date: string; price: number }> = []
  let currency: string | undefined
  if (contentType.includes("application/json")) {
    const json = JSON.parse(body) as unknown
    parsedRows = parseJsonRows(json)
    const records = Array.isArray(json)
      ? (json.filter((item) => item && typeof item === "object") as JsonRecord[])
      : ([(json as JsonRecord)].filter(Boolean) as JsonRecord[])
    currency = detectCurrency(records)
  } else if (contentType.includes("xml")) {
    parsedRows = parseXmlRows(body)
  } else {
    parsedRows = parseCsvRows(body)
  }

  const points = sliceFundSeries(normalizeFundRows(parsedRows), options.from, options.to)
  if (points.length === 0) {
    throw new Error("No valid fund price points found in source response.")
  }

  return {
    fundId: options.fundId,
    source: endpoint,
    currency,
    updatedAt: points[points.length - 1]?.date,
    points,
  }
}
