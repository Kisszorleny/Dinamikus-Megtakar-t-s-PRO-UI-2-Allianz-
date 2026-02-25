const SNAPSHOT_KEYS = [
  "calculator-inputs",
  "calculator-durationUnit",
  "calculator-durationValue",
  "calculator-selectedInsurer",
  "calculator-selectedProduct",
  "calculator-taxCreditAmountByYear",
  "calculator-taxCreditLimitByYear",
]

function parseJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function collectCalcSnapshotFromSession() {
  if (typeof window === "undefined") return {}
  const snapshot: Record<string, unknown> = {}
  for (const key of SNAPSHOT_KEYS) {
    const raw = sessionStorage.getItem(key)
    if (!raw) continue
    snapshot[key] = parseJSON(raw, raw)
  }
  return snapshot
}

export function buildCalcSummary(snapshot: Record<string, unknown>) {
  const inputs = (snapshot["calculator-inputs"] as Record<string, unknown> | undefined) ?? {}
  const durationUnit = snapshot["calculator-durationUnit"]
  const durationValue = snapshot["calculator-durationValue"]
  const insurer = snapshot["calculator-selectedInsurer"]
  const product = snapshot["calculator-selectedProduct"]

  const regularPayment = Number((inputs.regularPayment as number | string | undefined) ?? 0)
  const frequency = String((inputs.frequency as string | undefined) ?? "")
  const duration = Number((durationValue as number | undefined) ?? 0)

  const periodsPerYear = frequency === "havi" ? 12 : frequency === "negyedéves" ? 4 : frequency === "féléves" ? 2 : 1
  const years = durationUnit === "month" ? duration / 12 : durationUnit === "day" ? duration / 365 : duration
  const totalContributions = Number.isFinite(regularPayment * periodsPerYear * years)
    ? Math.round(regularPayment * periodsPerYear * years)
    : undefined

  return {
    insurer: typeof insurer === "string" ? insurer : undefined,
    product: typeof product === "string" ? product : undefined,
    durationUnit: typeof durationUnit === "string" ? durationUnit : undefined,
    durationValue: Number.isFinite(duration) ? duration : undefined,
    frequency: frequency || undefined,
    regularPayment: Number.isFinite(regularPayment) ? regularPayment : undefined,
    totalContributions,
    currency: typeof inputs.currency === "string" ? inputs.currency : undefined,
  }
}
