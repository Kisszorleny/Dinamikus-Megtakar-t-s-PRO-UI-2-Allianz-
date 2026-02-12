import type { FundPricePoint, FundSeriesStats } from "./types"

type RawFundRow = {
  date: string
  price: number
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function toIsoDate(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  if (ISO_DATE_RE.test(value)) return value

  const ymdDot = /^(\d{4})\.(\d{2})\.(\d{2})$/.exec(value)
  if (ymdDot) return `${ymdDot[1]}-${ymdDot[2]}-${ymdDot[3]}`

  const dmyDot = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value)
  if (dmyDot) return `${dmyDot[3]}-${dmyDot[2]}-${dmyDot[1]}`

  const dt = new Date(value)
  if (Number.isNaN(dt.getTime())) return null
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

function sanitizePrice(value: number): number | null {
  if (!Number.isFinite(value)) return null
  if (value <= 0) return null
  return Number(value)
}

export function normalizeFundRows(rows: RawFundRow[]): FundPricePoint[] {
  const dedup = new Map<string, number>()

  for (const row of rows) {
    const date = toIsoDate(row.date)
    const price = sanitizePrice(row.price)
    if (!date || price === null) continue
    dedup.set(date, price)
  }

  return Array.from(dedup.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function sliceFundSeries(points: FundPricePoint[], from?: string, to?: string): FundPricePoint[] {
  if (!from && !to) return points
  return points.filter((point) => {
    if (from && point.date < from) return false
    if (to && point.date > to) return false
    return true
  })
}

export function computeFundSeriesStats(points: FundPricePoint[]): FundSeriesStats {
  if (points.length === 0) return { observations: 0 }

  const first = points[0]
  const last = points[points.length - 1]
  const firstDate = new Date(first.date)
  const lastDate = new Date(last.date)
  const msPerDay = 24 * 60 * 60 * 1000
  const days = Math.max(1, Math.round((lastDate.getTime() - firstDate.getTime()) / msPerDay))

  let annualizedReturnPercent: number | undefined
  if (first.price > 0 && last.price > 0) {
    const annualized = Math.pow(last.price / first.price, 365 / days) - 1
    if (Number.isFinite(annualized)) annualizedReturnPercent = Number((annualized * 100).toFixed(4))
  }

  return {
    firstDate: first.date,
    lastDate: last.date,
    firstPrice: first.price,
    lastPrice: last.price,
    observations: points.length,
    annualizedReturnPercent,
  }
}
