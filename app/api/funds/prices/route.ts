import { NextRequest, NextResponse } from "next/server"
import { computeFundSeriesStats } from "@/lib/funds/normalize"
import { fetchInsurerPublicFundSeries } from "@/lib/funds/providers/insurer-public"

type CacheEntry = {
  expiresAt: number
  payload: unknown
}

const CACHE_TTL_MS = 15 * 60 * 1000
const memoryCache = new Map<string, CacheEntry>()

function makeCacheKey(
  fundId: string,
  from?: string,
  to?: string,
  provider?: string,
  currency?: string,
  program?: string,
  mode?: string,
  cursorTo?: string,
) {
  return `${provider || "auto"}::${program || ""}::${currency || ""}::${mode || ""}::${fundId}::${from || ""}::${to || ""}::${cursorTo || ""}`
}

function clampIsoDate(value: string, min?: string, max?: string): string {
  let out = value
  if (min && out < min) out = min
  if (max && out > max) out = max
  return out
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function normalizeFundCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
}

type AllianzTermRatesResponse = {
  data?: {
    rates?: Array<{
      term?: string
      currency?: string
      funds?: Array<{ id?: number; name?: string; initRate?: number }>
    }>
  }
}

type AllianzMaxTermsResponse = {
  data?: {
    startDate?: string
    endDate?: string
  }
}

function addDaysIso(dateIso: string, deltaDays: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso)
  if (!m) return dateIso
  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])
  const dt = new Date(y, mo - 1, d, 12, 0, 0, 0)
  dt.setDate(dt.getDate() + deltaDays)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
}

async function fetchAllianzMaxTerms(program: string): Promise<{ startDate: string; endDate: string } | null> {
  const candidates = [
    `https://ulexchange.allianz.hu/api/${encodeURIComponent(program)}/max-terms`,
    // Observed on the site as well
    `https://ulexchange.allianz.hu/api/hungalap/max-terms`,
  ]

  for (const url of candidates) {
    try {
      const res = await fetch(url, { next: { revalidate: 60 * 60 } })
      if (!res.ok) continue
      const json = (await res.json()) as AllianzMaxTermsResponse
      const startDate = typeof json?.data?.startDate === "string" ? json.data.startDate : null
      const endDate = typeof json?.data?.endDate === "string" ? json.data.endDate : null
      if (startDate && endDate && /^\d{4}-\d{2}-\d{2}$/.test(startDate) && /^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return { startDate, endDate }
      }
    } catch {
      // ignore and try next candidate
    }
  }
  return null
}

async function fetchAllianzUlexchangeSeries(options: {
  fundCode: string
  from?: string
  to?: string
  currency?: string
  program?: string
}) {
  const program = (options.program || "ul2005").trim() || "ul2005"
  const endpoint = `https://ulexchange.allianz.hu/api/${encodeURIComponent(program)}/term-rates`

  let startDate = options.from || options.to
  let endDate = options.to || options.from
  if (!startDate || !endDate) {
    // default: last ~1 year ending at latest available date
    const maxTerms = await fetchAllianzMaxTerms(program)
    if (!maxTerms) {
      throw new Error("Allianz provider requires from/to or max-terms to build a price series.")
    }
    endDate = maxTerms.endDate
    startDate = addDaysIso(endDate, -365)
  }

  const targetCurrency = options.currency ? options.currency.trim().toUpperCase() : undefined
  const fundCodeNormalized = normalizeFundCode(options.fundCode)

  // Build {term -> price} map
  const map = new Map<string, number>()
  const body = {
    term: { startDate, endDate },
    exclude: false,
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 60 * 30 },
  })

  if (!response.ok) {
    throw new Error(`Allianz ulexchange request failed with status ${response.status}`)
  }

  const json = (await response.json()) as AllianzTermRatesResponse
  const rates = json?.data?.rates ?? []

  for (const rateBlock of rates) {
    const term = typeof rateBlock.term === "string" ? rateBlock.term : null
    const currency = typeof rateBlock.currency === "string" ? rateBlock.currency.toUpperCase() : null
    if (!term) continue
    if (targetCurrency && currency && currency !== targetCurrency) continue

    const funds = rateBlock.funds ?? []
    for (const fund of funds) {
      const name = typeof fund.name === "string" ? fund.name : ""
      const code = name.split(" - ")[0] ?? ""
      const codeNormalized = normalizeFundCode(code)
      if (!codeNormalized) continue
      if (codeNormalized !== fundCodeNormalized) continue
      const price = typeof fund.initRate === "number" && Number.isFinite(fund.initRate) ? fund.initRate : null
      if (price && price > 0) {
        map.set(term, price)
      }
    }
  }

  const points = Array.from(map.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date))

  if (points.length === 0) {
    throw new Error("Allianz ulexchange returned no matching fund points for the requested range/currency.")
  }

  return {
    fundId: options.fundCode,
    source: endpoint,
    currency: targetCurrency,
    updatedAt: points[points.length - 1]?.date,
    points,
  }
}

async function fetchAllianzUlexchangePage(options: {
  fundCode: string
  from: string
  to: string
  currency?: string
  program?: string
}) {
  const program = (options.program || "ul2005").trim() || "ul2005"
  const endpoint = `https://ulexchange.allianz.hu/api/${encodeURIComponent(program)}/term-rates`
  const targetCurrency = options.currency ? options.currency.trim().toUpperCase() : undefined
  const fundCodeNormalized = normalizeFundCode(options.fundCode)

  const body = {
    term: { startDate: options.from, endDate: options.to },
    exclude: false,
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    next: { revalidate: 60 * 30 },
  })

  if (!response.ok) {
    throw new Error(`Allianz ulexchange request failed with status ${response.status}`)
  }

  const json = (await response.json()) as AllianzTermRatesResponse
  const rates = json?.data?.rates ?? []

  const map = new Map<string, number>()
  const terms: string[] = []

  for (const rateBlock of rates) {
    const term = typeof rateBlock.term === "string" ? rateBlock.term : null
    const currency = typeof rateBlock.currency === "string" ? rateBlock.currency.toUpperCase() : null
    if (!term) continue
    terms.push(term)
    if (targetCurrency && currency && currency !== targetCurrency) continue

    const funds = rateBlock.funds ?? []
    for (const fund of funds) {
      const name = typeof fund.name === "string" ? fund.name : ""
      const code = name.split(" - ")[0] ?? ""
      const codeNormalized = normalizeFundCode(code)
      if (!codeNormalized) continue
      if (codeNormalized !== fundCodeNormalized) continue
      const price = typeof fund.initRate === "number" && Number.isFinite(fund.initRate) ? fund.initRate : null
      if (price && price > 0) {
        map.set(term, price)
      }
    }
  }

  const uniqueTerms = Array.from(new Set(terms)).sort()
  const earliestTerm = uniqueTerms[0]
  const latestTerm = uniqueTerms.length > 0 ? uniqueTerms[uniqueTerms.length - 1] : undefined

  const points = Array.from(map.entries())
    .map(([date, price]) => ({ date, price }))
    .sort((a, b) => a.date.localeCompare(b.date))

  return {
    endpoint,
    currency: targetCurrency,
    earliestTerm,
    latestTerm,
    points,
  }
}

export async function GET(request: NextRequest) {
  try {
    const fundId = request.nextUrl.searchParams.get("fundId")?.trim() || ""
    const from = request.nextUrl.searchParams.get("from")
    const to = request.nextUrl.searchParams.get("to")
    const provider = request.nextUrl.searchParams.get("provider")?.trim() || ""
    const currency = request.nextUrl.searchParams.get("currency")?.trim() || ""
    const program = request.nextUrl.searchParams.get("program")?.trim() || ""
    const mode = request.nextUrl.searchParams.get("mode")?.trim() || ""
    const cursorTo = request.nextUrl.searchParams.get("cursorTo")?.trim() || ""

    if (!fundId) {
      return NextResponse.json({ error: "Missing fundId query parameter" }, { status: 400 })
    }
    if (from && !isIsoDate(from)) {
      return NextResponse.json({ error: "Invalid from date. Expected YYYY-MM-DD." }, { status: 400 })
    }
    if (to && !isIsoDate(to)) {
      return NextResponse.json({ error: "Invalid to date. Expected YYYY-MM-DD." }, { status: 400 })
    }
    if (from && to && from > to) {
      return NextResponse.json({ error: "from cannot be later than to." }, { status: 400 })
    }

    const msPerDay = 24 * 60 * 60 * 1000
    const rangeDays =
      from && to
        ? Math.round((new Date(`${to}T12:00:00Z`).getTime() - new Date(`${from}T12:00:00Z`).getTime()) / msPerDay)
        : null

    const resolvedProgram = (program || "ul2005").trim() || "ul2005"

    // Clamp Allianz requests to max-terms, otherwise the API can return 0 points.
    const maxTerms =
      provider === "allianz-ulexchange" && (from || to) ? await fetchAllianzMaxTerms(resolvedProgram) : null
    const effectiveFrom =
      typeof from === "string" && isIsoDate(from) ? clampIsoDate(from, maxTerms?.startDate, maxTerms?.endDate) : undefined
    const effectiveTo =
      typeof to === "string" && isIsoDate(to) ? clampIsoDate(to, maxTerms?.startDate, maxTerms?.endDate) : undefined

    if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
      return NextResponse.json(
        { error: `A megadott dátumtartomány kívül esik az elérhető idősoron (${maxTerms?.startDate} → ${maxTerms?.endDate}).` },
        { status: 400 },
      )
    }

    const now = Date.now()

    // Replay paging: return one page so the UI can loop without serverless timeouts.
    if (mode === "replay" && provider === "allianz-ulexchange" && effectiveFrom && effectiveTo) {
      const rawPageTo = isIsoDate(cursorTo) ? cursorTo : effectiveTo
      const pageTo = clampIsoDate(rawPageTo, maxTerms?.startDate, maxTerms?.endDate)
      const key = makeCacheKey(fundId, effectiveFrom, effectiveTo, provider, currency, resolvedProgram, mode, pageTo)
      const cached = memoryCache.get(key)
      if (cached && cached.expiresAt > now) {
        return NextResponse.json(cached.payload, {
          headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
        })
      }

      const page = await fetchAllianzUlexchangePage({
        fundCode: fundId,
        from: effectiveFrom,
        to: pageTo,
        currency: currency || undefined,
        program: resolvedProgram,
      })

      const nextCursor =
        page.earliestTerm && page.earliestTerm > effectiveFrom ? addDaysIso(page.earliestTerm, -1) : null
      const payload = {
        fundId,
        source: page.endpoint,
        currency: page.currency,
        updatedAt: page.latestTerm,
        stats: computeFundSeriesStats(page.points),
        points: page.points,
        page: {
          cursorTo: pageTo,
          earliestTerm: page.earliestTerm,
          latestTerm: page.latestTerm,
          nextCursorTo: nextCursor,
        },
      }
      memoryCache.set(key, { expiresAt: now + CACHE_TTL_MS, payload })
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
      })
    }

    // Averaged mode can still be clamped (cheap + stable).
    const MAX_AVERAGED_RANGE_DAYS = 365 * 2
    const shouldClampAveraged =
      mode === "averaged" &&
      provider === "allianz-ulexchange" &&
      typeof rangeDays === "number" &&
      Number.isFinite(rangeDays) &&
      rangeDays > MAX_AVERAGED_RANGE_DAYS &&
      effectiveTo

    const averagedFrom = shouldClampAveraged && effectiveTo ? addDaysIso(effectiveTo, -MAX_AVERAGED_RANGE_DAYS) : effectiveFrom
    const averagedTo = effectiveTo

    const key = makeCacheKey(fundId, averagedFrom, averagedTo, provider, currency, resolvedProgram, mode)
    const cached = memoryCache.get(key)
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.payload, {
        headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
      })
    }

    const series =
      provider === "allianz-ulexchange"
        ? await fetchAllianzUlexchangeSeries({
            fundCode: fundId,
            from: averagedFrom,
            to: averagedTo,
            currency: currency || undefined,
            program: resolvedProgram,
          })
        : await fetchInsurerPublicFundSeries({
            fundId,
            from: from || undefined,
            to: to || undefined,
          })
    const stats = computeFundSeriesStats(series.points)
    const payload = {
      fundId: series.fundId,
      source: series.source,
      currency: series.currency,
      updatedAt: series.updatedAt,
      stats,
      points: series.points,
    }

    memoryCache.set(key, { expiresAt: now + CACHE_TTL_MS, payload })

    return NextResponse.json(payload, {
      headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fund price fetch failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
