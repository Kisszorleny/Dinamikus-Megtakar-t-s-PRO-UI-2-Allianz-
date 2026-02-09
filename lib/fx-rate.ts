export type RateSource = "live" | "cache" | "default"

export type FxState = {
  rate: number
  date: string | null
  source: RateSource
}

const FX_CACHE_KEY = "fx_EURHUF_cache_v1"
const FX_USD_CACHE_KEY = "fx_USDHUF_cache_v1"

// Beégetett fallback, ha semmi más nincs:
const DEFAULT_EURHUF: FxState = { rate: 400, date: null, source: "default" }
const DEFAULT_USDHUF: FxState = { rate: 380, date: null, source: "default" }

function loadCachedFx(): FxState | null {
  try {
    const raw = localStorage.getItem(FX_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { rate: number; date: string | null; ts: number }
    if (!parsed?.rate || typeof parsed.rate !== "number") return null
    return { rate: parsed.rate, date: parsed.date ?? null, source: "cache" }
  } catch {
    return null
  }
}

function saveCachedFx(rate: number, date: string | null) {
  try {
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify({ rate, date, ts: Date.now() }))
  } catch {
    // storage full / blocked -> ignore
  }
}

function loadCachedFxGeneric(cacheKey: string): FxState | null {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { rate: number; date: string | null; ts: number }
    if (!parsed?.rate || typeof parsed.rate !== "number") return null
    return { rate: parsed.rate, date: parsed.date ?? null, source: "cache" }
  } catch {
    return null
  }
}

function saveCachedFxGeneric(cacheKey: string, rate: number, date: string | null) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ rate, date, ts: Date.now() }))
  } catch {
    // storage full / blocked -> ignore
  }
}

async function fetchEurHufLive(): Promise<{ rate: number; date: string | null }> {
  const url = "https://api.frankfurter.dev/v1/latest?base=EUR&symbols=HUF"
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`)
  const data = await res.json()
  const rate = data?.rates?.HUF
  const date = data?.date ?? null
  if (typeof rate !== "number") throw new Error("FX rate missing")
  return { rate, date }
}

async function fetchFxRateLive(
  baseCurrency: string,
  targetCurrency: string,
): Promise<{ rate: number; date: string | null }> {
  const url = `https://api.frankfurter.dev/v1/latest?base=${baseCurrency}&symbols=${targetCurrency}`
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error(`FX fetch failed: ${res.status}`)
  const data = await res.json()
  const rate = data?.rates?.[targetCurrency]
  const date = data?.date ?? null
  if (typeof rate !== "number") throw new Error("FX rate missing")
  return { rate, date }
}

/**
 * Lekéri az élő árfolyamot, de offline/hibánál cache -> default.
 * Ha a user manuálisan felülírta, ezt ne hívd rá automatikusan.
 */
export async function getFxEurHufWithFallback(): Promise<FxState> {
  try {
    const live = await fetchEurHufLive()
    saveCachedFx(live.rate, live.date)
    return { rate: live.rate, date: live.date, source: "live" }
  } catch {
    const cached = loadCachedFx()
    if (cached) return cached
    return DEFAULT_EURHUF
  }
}

export async function getFxRateWithFallback(
  baseCurrency: "EUR" | "USD",
  targetCurrency: "HUF" = "HUF",
): Promise<FxState> {
  const cacheKey = baseCurrency === "EUR" ? FX_CACHE_KEY : FX_USD_CACHE_KEY
  const defaultRate = baseCurrency === "EUR" ? 400 : 380

  try {
    const live = await fetchFxRateLive(baseCurrency, targetCurrency)
    saveCachedFxGeneric(cacheKey, live.rate, live.date)
    return { rate: live.rate, date: live.date, source: "live" }
  } catch {
    const cached = loadCachedFxGeneric(cacheKey)
    if (cached) return cached
    return { rate: defaultRate, date: null, source: "default" }
  }
}
