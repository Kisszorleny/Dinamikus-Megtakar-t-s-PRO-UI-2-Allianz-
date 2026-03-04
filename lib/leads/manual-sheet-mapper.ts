import type { LeadRow } from "@/lib/leads/repository"
import type { ManualLeadUpsert } from "@/lib/leads/schema"
import { normalizeReportOption } from "@/lib/leads/constants"

export const LEAD_SHEET_HEADERS = [
  "LeadID",
  "Születési dátum",
  "Email cim",
  "Hívás ideje",
  "Megjegyzés",
  "Tárgyalás",
  "Költs",
  "20% bünti",
  "Nettó",
  "Mekkora összeget tenne félre?",
  "Milyen célra?",
  "Milyen időtáv?",
  "Határidő",
  "Határidő oka",
  "Szerző",
  "Fizetett?",
  "Lead típusa",
  "ÜGYF SZÁM",
  "Naptár link",
  "Ajánlható termék",
  "Lead/nap",
  "Nap",
  "Időpont",
  "Név",
  "Telefonszám",
  "Életkor",
  "Későbbi megjegyzés",
  "Riport",
  "Átnézni is",
] as const

type Header = (typeof LEAD_SHEET_HEADERS)[number]

function asText(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text ? text : null
}

function normalizeEmail(value: unknown): string | null {
  const raw = asText(value)
  if (!raw) return null
  const lower = raw.toLowerCase()
  const emailLike = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lower)
  return emailLike ? lower : null
}

function normalizePhone(value: unknown): string | null {
  const raw = asText(value)
  if (!raw) return null

  const compact = raw.replace(/[()\s-]/g, "")
  const keepPlusAndDigits = compact.replace(/[^+\d]/g, "")
  if (!keepPlusAndDigits) return null

  let normalized = keepPlusAndDigits

  if (normalized.startsWith("00")) {
    normalized = `+${normalized.slice(2)}`
  } else if (normalized.startsWith("06")) {
    normalized = `+36${normalized.slice(2)}`
  } else if (normalized.startsWith("36")) {
    normalized = `+${normalized}`
  } else if (!normalized.startsWith("+")) {
    if (normalized.startsWith("0")) {
      normalized = `+36${normalized.slice(1)}`
    } else if (normalized.startsWith("6") && normalized.length === 10) {
      // Missing leading 0 in local HU format: 630... -> +3630...
      normalized = `+3${normalized}`
    } else if (normalized.startsWith("62")) {
      // Common typo: missing "3" from +36 prefix, e.g. 620... instead of 3620...
      normalized = `+36${normalized.slice(1)}`
    } else if (normalized.startsWith("66")) {
      // Common typo: +66... should be +36...
      normalized = `+36${normalized.slice(2)}`
    } else if (normalized.length === 9) {
      normalized = `+36${normalized}`
    } else {
      normalized = `+${normalized}`
    }
  }

  // Correct common mistaken country prefixes for Hungarian numbers.
  if (normalized.startsWith("+62")) {
    normalized = `+36${normalized.slice(2)}`
  } else if (normalized.startsWith("+66")) {
    normalized = `+36${normalized.slice(3)}`
  }

  const digitsOnly = normalized.replace(/[^\d]/g, "")
  if (!digitsOnly.startsWith("36")) return null
  if (digitsOnly.length < 11 || digitsOnly.length > 12) return null
  return `+${digitsOnly}`
}

function asBool(value: unknown): boolean {
  if (typeof value === "boolean") return value
  if (typeof value === "number") return value !== 0
  const text = String(value ?? "")
    .trim()
    .toLowerCase()
  return ["1", "x", "true", "igen", "yes", "y", "✓"].includes(text)
}

function parseDate(value: unknown): string | null {
  const raw = asText(value)
  if (!raw) return null
  const cleaned = raw
    .replace(/hétfő|kedd|szerda|csütörtök|péntek|szombat|vasárnap/gi, "")
    .replace(/\s+/g, " ")
    .trim()
  const ymdMatch = cleaned.match(/^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
  if (ymdMatch) {
    const year = ymdMatch[1]
    const month = ymdMatch[2].padStart(2, "0")
    const day = ymdMatch[3].padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const dmyMatch = cleaned.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})$/)
  if (dmyMatch) {
    const year = dmyMatch[3]
    const month = dmyMatch[2].padStart(2, "0")
    const day = dmyMatch[1].padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const shortDot = cleaned.match(/^(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})$/)
  if (shortDot) {
    const year = String(Number(shortDot[1]) + 2000)
    const month = shortDot[2].padStart(2, "0")
    const day = shortDot[3].padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const dt = new Date(cleaned)
  if (!Number.isNaN(dt.getTime())) return dt.toISOString().slice(0, 10)
  return null
}

function parseIntOrNull(value: unknown): number | null {
  const text = asText(value)
  if (!text) return null
  const n = Number(text.replace(/[^\d-]/g, ""))
  if (!Number.isFinite(n)) return null
  // Postgres integer is int4 (-2147483648..2147483647)
  if (n > 2147483647 || n < -2147483648) return null
  return Math.trunc(n)
}

function asUuidOrUndefined(value: unknown): string | undefined {
  const text = asText(value)
  if (!text) return undefined
  const uuidV4Like =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidV4Like.test(text) ? text : undefined
}

function normalizeHeaderKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/gi, "")
    .toLowerCase()
}

function getCellValue(row: Record<string, unknown>, aliases: string[]) {
  const rawHeaders = Array.isArray(row._sheetHeaders) ? row._sheetHeaders.map((h) => String(h ?? "")) : []
  const rawCells = Array.isArray(row._sheetCells) ? row._sheetCells : []
  if (rawHeaders.length > 0) {
    for (const alias of aliases) {
      const aliasKey = normalizeHeaderKey(alias)
      // Prefer the first non-empty matching header cell; this handles duplicated headers reliably.
      for (let i = 0; i < rawHeaders.length; i += 1) {
        if (normalizeHeaderKey(rawHeaders[i]) !== aliasKey) continue
        const value = rawCells[i]
        if (asText(value) !== null) return value
      }
      // If only empty matches exist, still return the first matched cell.
      for (let i = 0; i < rawHeaders.length; i += 1) {
        if (normalizeHeaderKey(rawHeaders[i]) === aliasKey) return rawCells[i]
      }
    }
  }

  const normalizedMap = new Map<string, unknown>()
  for (const [key, value] of Object.entries(row)) {
    normalizedMap.set(normalizeHeaderKey(key), value)
  }
  for (const alias of aliases) {
    const exact = row[alias]
    if (exact !== undefined) return exact
    const normalized = normalizedMap.get(normalizeHeaderKey(alias))
    if (normalized !== undefined) return normalized
  }
  return undefined
}

export function mapRowObjectToManualLead(
  row: Record<string, unknown>,
  _fallbackIndex: number,
): ManualLeadUpsert | null {
  const leadId = getCellValue(row, ["LeadID", "Lead ID", "Azonosító", "ID"])
  const nameValue = getCellValue(row, ["Név", "Nev", "Név*"])
  const emailValue = getCellValue(row, ["Email cim", "Email cím", "E-mail", "Email", "E mail"])
  const phoneValue = getCellValue(row, ["Telefonszám", "Telefonszam", "Telefon"])
  const reportPrimary = getCellValue(row, ["Riport Megjegyzés", "Riport megjegyzes"])
  const reportSecondary = getCellValue(row, ["Riport Megjegyzés 2", "Riport megjegyzes 2"])
  const reportValue = getCellValue(row, ["Riport"])
  const reviewedValue = getCellValue(row, ["Átnézve?", "Atnezve?", "Átnézni?", "Atnezni?"])
  const callDate = getCellValue(row, ["VH Napja", "VH napja", "Visszahívás napja", "Visszahivas napja", "Nap"])
  const callTime = getCellValue(row, ["VH Ideje", "VH ideje", "Visszahívás időpontja", "Visszahivas idopontja", "Időpont", "Idopont"])
  const nameText = asText(nameValue)
  const emailText = normalizeEmail(emailValue)
  const phoneText = normalizePhone(phoneValue)

  // Strict guard: imported leads must have a name; otherwise skip malformed rows.
  if (!nameText) {
    return null
  }

  return {
    // Older sheets often store custom text IDs in LeadID (e.g. "NVF").
    // DB id is UUID, so we only reuse it when it's a valid UUID.
    id: asUuidOrUndefined(leadId),
    sourceType: "manual_import",
    source: asText(getCellValue(row, ["Forrás", "Forras"])) ?? "manual_upload",
    requestType: "A",
    contactName: nameText,
    contactEmail: emailText ?? "",
    contactPhone: phoneText ?? "N/A",
    birthDate: parseDate(getCellValue(row, ["Születési dátum", "Szuletesi datum", "Születésnap", "Szuletesnap"])),
    ageText: asText(getCellValue(row, ["Életkor", "Eletkor"])),
    callTime: asText(getCellValue(row, ["Hívás ideje", "Hivas ideje", "Hívás időpontha", "Hivas idopontha", "Hívás Időpontja", "Hivas Idopontja"])),
    note: asText(getCellValue(row, ["Megjegyzés", "Megjegyzes"])),
    subject: asText(getCellValue(row, ["Tárgyalás", "Targyalas"])),
    costFlag: asBool(getCellValue(row, ["Költs", "Kolts"])),
    tax20Flag: asBool(getCellValue(row, ["20% bünti", "20% bunti"])),
    netFlag: asBool(getCellValue(row, ["Nettó", "Netto"])),
    savingsAmountText: asText(getCellValue(row, ["Mekkora összeget tenne félre?", "Tervezett összeg", "Összeg", "Osszeg"])),
    goalText: asText(getCellValue(row, ["Milyen célra?", "Cél"])),
    durationText: asText(getCellValue(row, ["Milyen időtáv?", "Milyen idotav?", "Időtáv", "Idotav"])),
    deadlineDate: parseDate(getCellValue(row, ["Határidő", "Hatarido"])),
    deadlineReason: asText(getCellValue(row, ["Határidő oka", "Hatarido oka"])),
    owner: asText(getCellValue(row, ["Szerző", "Szerzo", "Szervező", "Szervezo", "Felelős", "Felelos"])),
    paidFlag: asBool(getCellValue(row, ["Fizetett?"])),
    leadTypeText: asText(getCellValue(row, ["Lead típusa", "Lead tipusa"])),
    clientNumber: asText(getCellValue(row, ["ÜGYF SZÁM", "UGYF SZAM", "ÜA", "UA", "ID"])),
    calendarLink: asText(getCellValue(row, ["Naptár link", "Naptar link"])),
    helpNeeded: asText(
      getCellValue(row, [
        "Ajánlható termék",
        "Ajanlhato termek",
        "Mit lehet neki kötni?",
        "Mi köthető neki",
        "Mi kotheto neki",
      ]),
    ),
    leadsPerDay: parseIntOrNull(getCellValue(row, ["Lead/nap"])),
    dayText: asText(callDate),
    timeText: asText(callTime),
    followupNote: asText(getCellValue(row, ["Későbbi megjegyzés", "Kesobbi megjegyzes", "Átnézve?", "Atnezve?"])),
    reportText: normalizeReportOption(asText(reportValue)),
    revisitText: asText(getCellValue(row, ["Átnézni is", "Atnezni is"])),
    sheetRowId: asText(row._sheetRowId),
    formPayload: {
      reportNote1: asText(reportPrimary),
      reportNote2: asText(reportSecondary),
      reviewed: asText(reviewedValue),
    },
    calcSnapshot: {},
    calcSummary: {},
  }
}

export function mapLeadToSheetRow(lead: LeadRow): Record<Header, string | number | boolean> {
  return {
    LeadID: lead.id,
    "Születési dátum": lead.birth_date ?? "",
    "Email cim": lead.contact_email ?? "",
    "Hívás ideje": lead.call_time ?? "",
    Megjegyzés: lead.note ?? "",
    Tárgyalás: lead.subject ?? "",
    Költs: Boolean(lead.cost_flag),
    "20% bünti": Boolean(lead.tax20_flag),
    Nettó: Boolean(lead.net_flag),
    "Mekkora összeget tenne félre?": lead.savings_amount_text ?? "",
    "Milyen célra?": lead.goal_text ?? "",
    "Milyen időtáv?": lead.duration_text ?? "",
    Határidő: lead.deadline_date ?? "",
    "Határidő oka": lead.deadline_reason ?? "",
    Szerző: lead.owner ?? "",
    "Fizetett?": Boolean(lead.paid_flag),
    "Lead típusa": lead.lead_type_text ?? "",
    "ÜGYF SZÁM": lead.client_number ?? "",
    "Naptár link": lead.calendar_link ?? "",
    "Ajánlható termék": lead.help_needed ?? "",
    "Lead/nap": lead.leads_per_day ?? "",
    Nap: lead.day_text ?? "",
    Időpont: lead.time_text ?? "",
    Név: lead.contact_name ?? "",
    Telefonszám: lead.contact_phone ?? "",
    Életkor: lead.age_text ?? "",
    "Későbbi megjegyzés": lead.followup_note ?? "",
    Riport: normalizeReportOption(lead.report_text) ?? "",
    "Átnézni is": lead.revisit_text ?? "",
  }
}
