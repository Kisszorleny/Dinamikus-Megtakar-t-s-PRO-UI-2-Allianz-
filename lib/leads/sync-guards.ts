type MaybeText = string | null | undefined

const PLACEHOLDER_VALUES = new Set(["", "-", "n/a", "na", "null", "undefined", "ismeretlen", "unknown"])
const EXPLICIT_CLEAR_VALUES = new Set(["-", "n/a", "na", "null", "undefined", "torolve", "törölve", "ures", "üres"])

export function normalizeComparableText(value: MaybeText): string {
  const text = String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
  return PLACEHOLDER_VALUES.has(text) ? "" : text
}

export function parseCalendarTextValue(value: MaybeText): { present: boolean; value: string | null } {
  if (value === undefined) return { present: false, value: null }
  const text = String(value ?? "").trim()
  if (!text) return { present: true, value: null }
  const normalized = text.toLowerCase()
  if (EXPLICIT_CLEAR_VALUES.has(normalized)) return { present: true, value: null }
  return { present: true, value: text }
}

export function normalizeComparablePhone(value: MaybeText): string {
  const raw = String(value ?? "").trim()
  if (!raw) return ""
  const compact = raw.replace(/[()\s-]/g, "").replace(/[^+\d]/g, "")
  if (!compact) return ""

  let normalized = compact
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`
  if (!normalized.startsWith("+") && normalized.startsWith("06")) normalized = `+36${normalized.slice(2)}`
  if (!normalized.startsWith("+") && normalized.startsWith("0")) normalized = `+36${normalized.slice(1)}`
  if (!normalized.startsWith("+") && /^6\d{9}$/.test(normalized)) normalized = `+3${normalized}`
  if (!normalized.startsWith("+") && /^\d{9}$/.test(normalized)) normalized = `+36${normalized}`
  if (normalized.startsWith("+62")) normalized = `+36${normalized.slice(2)}`
  if (normalized.startsWith("+66")) normalized = `+36${normalized.slice(3)}`
  if (normalized.startsWith("+06")) normalized = `+36${normalized.slice(3)}`
  if (!normalized.startsWith("+")) normalized = `+${normalized}`

  const digits = normalized.replace(/[^\d]/g, "")
  if (!digits.startsWith("36")) return digits ? `+${digits}` : ""
  if (digits.length < 11 || digits.length > 12) return `+${digits}`
  return `+${digits}`
}

export function parseDateKey(value: MaybeText): { year: number; month: number; day: number } | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null

  const ymd = raw.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (ymd) {
    return {
      year: Number(ymd[1]),
      month: Number(ymd[2]),
      day: Number(ymd[3]),
    }
  }

  const shortYmd = raw.match(/(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})/)
  if (shortYmd) {
    return {
      year: 2000 + Number(shortYmd[1]),
      month: Number(shortYmd[2]),
      day: Number(shortYmd[3]),
    }
  }

  return null
}

export function parseTimeKey(value: MaybeText): { hour: number; minute: number } | null {
  const raw = String(value ?? "").trim()
  if (!raw) return null

  if (/^\d{1,2}$/.test(raw)) {
    const hour = Number(raw)
    if (hour >= 0 && hour <= 23) return { hour, minute: 0 }
  }
  if (/^\d{3,4}$/.test(raw)) {
    const padded = raw.padStart(4, "0")
    const hour = Number(padded.slice(0, 2))
    const minute = Number(padded.slice(2))
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return { hour, minute }
  }

  const hhmm = raw.match(/(\d{1,2})[:.](\d{2})/)
  if (!hhmm) return null
  const hour = Number(hhmm[1])
  const minute = Number(hhmm[2])
  if (!Number.isInteger(hour) || !Number.isInteger(minute)) return null
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null
  return { hour, minute }
}

export function normalizeComparableDate(value: MaybeText): string {
  const parsed = parseDateKey(value)
  if (!parsed) return normalizeComparableText(value)
  const y = String(parsed.year).padStart(4, "0")
  const m = String(parsed.month).padStart(2, "0")
  const d = String(parsed.day).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function normalizeComparableTime(value: MaybeText): string {
  const parsed = parseTimeKey(value)
  if (!parsed) return normalizeComparableText(value)
  return `${String(parsed.hour).padStart(2, "0")}:${String(parsed.minute).padStart(2, "0")}`
}

export function shouldSkipMassDelete(input: {
  candidateDeleteCount: number
  totalManagedCount: number
  minCandidateCount?: number
  maxDeleteRatio?: number
}): boolean {
  const minCandidateCount = input.minCandidateCount ?? 20
  const maxDeleteRatio = input.maxDeleteRatio ?? 0.35
  const candidateDeleteCount = Math.max(0, input.candidateDeleteCount)
  const totalManagedCount = Math.max(0, input.totalManagedCount)
  if (candidateDeleteCount === 0 || totalManagedCount === 0) return false
  if (candidateDeleteCount < minCandidateCount) return false
  return candidateDeleteCount / totalManagedCount > maxDeleteRatio
}
