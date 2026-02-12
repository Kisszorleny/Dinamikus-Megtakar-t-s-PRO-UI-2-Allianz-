import { NextRequest, NextResponse } from "next/server"
import { computeFundSeriesStats } from "@/lib/funds/normalize"
import { fetchInsurerPublicFundSeries } from "@/lib/funds/providers/insurer-public"

type CacheEntry = {
  expiresAt: number
  payload: unknown
}

const CACHE_TTL_MS = 15 * 60 * 1000
const memoryCache = new Map<string, CacheEntry>()

function makeCacheKey(fundId: string, from?: string, to?: string) {
  return `${fundId}::${from || ""}::${to || ""}`
}

function isIsoDate(value: string | null): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(request: NextRequest) {
  try {
    const fundId = request.nextUrl.searchParams.get("fundId")?.trim() || ""
    const from = request.nextUrl.searchParams.get("from")
    const to = request.nextUrl.searchParams.get("to")

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

    const key = makeCacheKey(fundId, from || undefined, to || undefined)
    const now = Date.now()
    const cached = memoryCache.get(key)
    if (cached && cached.expiresAt > now) {
      return NextResponse.json(cached.payload, {
        headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600" },
      })
    }

    const series = await fetchInsurerPublicFundSeries({
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
