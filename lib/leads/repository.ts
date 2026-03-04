import { createSupabaseAdminClient } from "@/lib/supabase/server"
import type { LeadPayload, ManualLeadUpsert } from "@/lib/leads/schema"
import { normalizeReportOption, REPORT_OPTIONS, UNKNOWN_REPORT_LABEL } from "@/lib/leads/constants"
import { shouldSkipMassDelete } from "@/lib/leads/sync-guards"

type LeadInsert = {
  source: string
  request_type: "A" | "B" | "C"
  contact_name: string
  contact_email: string
  contact_phone: string
  form_payload: Record<string, unknown>
  calc_snapshot: Record<string, unknown>
  calc_summary: Record<string, unknown>
  email_status: "queued" | "sent" | "failed"
}

export type LeadRow = {
  id: string
  created_at: string
  updated_at: string
  source: string
  source_type: "landing_form" | "manual_import" | "sheets" | "app_edit"
  request_type: "A" | "B" | "C"
  contact_name: string
  contact_email: string
  contact_phone: string
  birth_date: string | null
  age_text: string | null
  call_time: string | null
  note: string | null
  subject: string | null
  cost_flag: boolean | null
  tax20_flag: boolean | null
  net_flag: boolean | null
  savings_amount_text: string | null
  goal_text: string | null
  duration_text: string | null
  deadline_date: string | null
  deadline_reason: string | null
  owner: string | null
  paid_flag: boolean | null
  lead_type_text: string | null
  client_number: string | null
  calendar_link: string | null
  help_needed: string | null
  leads_per_day: number | null
  day_text: string | null
  time_text: string | null
  followup_note: string | null
  report_text: string | null
  revisit_text: string | null
  sheet_row_id: string | null
  last_synced_at: string | null
  calendar_google_event_id: string | null
  calendar_icloud_event_id: string | null
  calendar_field_updated_at: Record<string, string> | null
  form_payload: Record<string, unknown>
  calc_snapshot: Record<string, unknown>
  calc_summary: Record<string, unknown>
  email_status: "queued" | "sent" | "failed"
  email_error: string | null
}

export const CALENDAR_SYNC_DB_FIELDS = [
  "contact_name",
  "source",
  "report_text",
  "contact_email",
  "contact_phone",
  "age_text",
  "call_time",
  "savings_amount_text",
  "goal_text",
  "duration_text",
  "deadline_date",
  "deadline_reason",
  "note",
  "client_number",
  "day_text",
  "time_text",
] as const

export type CalendarSyncDbField = (typeof CALENDAR_SYNC_DB_FIELDS)[number]
export type CalendarFieldUpdatedAtMap = Partial<Record<CalendarSyncDbField, string>>

export async function createLeadSubmission(payload: LeadPayload): Promise<{ id: string }> {
  const supabase = createSupabaseAdminClient()

  const leadInsert: LeadInsert = {
    source: payload.source,
    request_type: payload.requestType,
    contact_name: payload.contact.name,
    contact_email: payload.contact.email,
    contact_phone: payload.contact.phone,
    form_payload: payload.formPayload ?? {},
    calc_snapshot: payload.calcSnapshot ?? {},
    calc_summary: payload.calcSummary ?? {},
    email_status: "queued",
  }

  const { data, error } = await supabase.from("lead_submissions").insert(leadInsert).select("id").single()
  if (error || !data?.id) {
    throw new Error(error?.message ?? "Nem sikerült menteni a lead adatot.")
  }
  return { id: data.id }
}

export async function markLeadEmailStatus(
  id: string,
  status: "sent" | "failed",
  emailError?: string,
): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("lead_submissions")
    .update({
      email_status: status,
      email_error: emailError ?? null,
    })
    .eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
}

function normalizeDate(value?: string | null) {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function toDateOnlyKey(value?: string | null): string | null {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  // Prefer strict YYYY-MM-DD style if present in free-form text.
  const isoLike = trimmed.match(/\b(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/)
  if (isoLike) {
    const year = isoLike[1]
    const month = isoLike[2].padStart(2, "0")
    const day = isoLike[3].padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Support common Hungarian short date style too (YY.MM.DD...).
  const shortYearLike = trimmed.match(/\b(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})\b/)
  if (shortYearLike) {
    const year = `20${shortYearLike[1]}`
    const month = shortYearLike[2].padStart(2, "0")
    const day = shortYearLike[3].padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  const parsed = new Date(trimmed)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function asTextOrNull(value?: string | null) {
  const text = String(value ?? "").trim()
  return text || null
}

function asIsoTimestampOrNull(value: unknown): string | null {
  if (typeof value !== "string") return null
  const ts = new Date(value).getTime()
  if (!Number.isFinite(ts)) return null
  return new Date(ts).toISOString()
}

function normalizeCalendarFieldUpdatedAtMap(value: unknown): CalendarFieldUpdatedAtMap {
  if (!value || typeof value !== "object") return {}
  const input = value as Record<string, unknown>
  const out: CalendarFieldUpdatedAtMap = {}
  for (const field of CALENDAR_SYNC_DB_FIELDS) {
    const iso = asIsoTimestampOrNull(input[field])
    if (iso) out[field] = iso
  }
  return out
}

function mergeCalendarFieldUpdatedAtMap(
  baseValue: unknown,
  fields: CalendarSyncDbField[],
  timestamp: string,
): CalendarFieldUpdatedAtMap {
  const base = normalizeCalendarFieldUpdatedAtMap(baseValue)
  const out: CalendarFieldUpdatedAtMap = { ...base }
  for (const field of fields) out[field] = timestamp
  return out
}

function normalizeHuPhoneForPatch(value?: string | null) {
  const raw = asTextOrNull(value)
  if (!raw) return null
  const compact = raw.replace(/[()\s-]/g, "")
  const keep = compact.replace(/[^+\d]/g, "")
  if (!keep) return null

  let normalized = keep
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`
  if (!normalized.startsWith("+") && normalized.startsWith("0")) normalized = `+36${normalized.slice(1)}`
  if (!normalized.startsWith("+") && normalized.startsWith("6") && normalized.length === 10) normalized = `+3${normalized}`
  if (!normalized.startsWith("+")) normalized = `+${normalized}`
  if (normalized.startsWith("+62")) normalized = `+36${normalized.slice(2)}`
  if (normalized.startsWith("+66")) normalized = `+36${normalized.slice(3)}`
  if (normalized.startsWith("+06")) normalized = `+36${normalized.slice(3)}`

  const digits = normalized.replace(/[^\d]/g, "")
  if (!digits.startsWith("36")) return raw
  if (digits.length < 11 || digits.length > 12) return raw
  return `+${digits}`
}

function normalizeEmailForPatch(value?: string | null) {
  const raw = asTextOrNull(value)
  if (!raw) return null
  if (/^unknown-\d+@example\.com$/i.test(raw)) return null
  return raw.toLowerCase()
}

function normalizeJsonForCompare(value: unknown): string {
  if (!value || typeof value !== "object") return "{}"
  try {
    return JSON.stringify(value)
  } catch {
    return "{}"
  }
}

function sameText(a: unknown, b: unknown) {
  return String(a ?? "").trim() === String(b ?? "").trim()
}

function sameNullableText(a: unknown, b: unknown) {
  const left = String(a ?? "").trim()
  const right = String(b ?? "").trim()
  return (left || null) === (right || null)
}

function sameNullableNumber(a: unknown, b: unknown) {
  const left = typeof a === "number" && Number.isFinite(a) ? a : null
  const right = typeof b === "number" && Number.isFinite(b) ? b : null
  return left === right
}

function sameBool(a: unknown, b: unknown) {
  return Boolean(a) === Boolean(b)
}

function hasSheetLeadChanges(existing: LeadRow, incoming: ManualLeadUpsert) {
  const normalizedIncoming = toManualInsertRow({ ...incoming, sourceType: "sheets", id: existing.id })

  if (!sameText(existing.source_type, "sheets")) return true
  if (!sameText(existing.source, normalizedIncoming.source)) return true
  if (!sameText(existing.request_type, normalizedIncoming.request_type)) return true
  if (!sameText(existing.contact_name, normalizedIncoming.contact_name)) return true
  if (!sameText(existing.contact_email, normalizedIncoming.contact_email)) return true
  if (!sameText(existing.contact_phone, normalizedIncoming.contact_phone)) return true
  if (!sameNullableText(existing.birth_date, normalizedIncoming.birth_date)) return true
  if (!sameNullableText(existing.age_text, normalizedIncoming.age_text)) return true
  if (!sameNullableText(existing.call_time, normalizedIncoming.call_time)) return true
  if (!sameNullableText(existing.note, normalizedIncoming.note)) return true
  if (!sameNullableText(existing.subject, normalizedIncoming.subject)) return true
  if (!sameBool(existing.cost_flag, normalizedIncoming.cost_flag)) return true
  if (!sameBool(existing.tax20_flag, normalizedIncoming.tax20_flag)) return true
  if (!sameBool(existing.net_flag, normalizedIncoming.net_flag)) return true
  if (!sameNullableText(existing.savings_amount_text, normalizedIncoming.savings_amount_text)) return true
  if (!sameNullableText(existing.goal_text, normalizedIncoming.goal_text)) return true
  if (!sameNullableText(existing.duration_text, normalizedIncoming.duration_text)) return true
  if (!sameNullableText(existing.deadline_date, normalizedIncoming.deadline_date)) return true
  if (!sameNullableText(existing.deadline_reason, normalizedIncoming.deadline_reason)) return true
  if (!sameNullableText(existing.owner, normalizedIncoming.owner)) return true
  if (!sameBool(existing.paid_flag, normalizedIncoming.paid_flag)) return true
  if (!sameNullableText(existing.lead_type_text, normalizedIncoming.lead_type_text)) return true
  if (!sameNullableText(existing.client_number, normalizedIncoming.client_number)) return true
  if (!sameNullableText(existing.calendar_link, normalizedIncoming.calendar_link)) return true
  if (!sameNullableText(existing.help_needed, normalizedIncoming.help_needed)) return true
  if (!sameNullableNumber(existing.leads_per_day, normalizedIncoming.leads_per_day)) return true
  if (!sameNullableText(existing.day_text, normalizedIncoming.day_text)) return true
  if (!sameNullableText(existing.time_text, normalizedIncoming.time_text)) return true
  if (!sameNullableText(existing.followup_note, normalizedIncoming.followup_note)) return true
  if (!sameNullableText(existing.report_text, normalizedIncoming.report_text)) return true
  if (!sameNullableText(existing.revisit_text, normalizedIncoming.revisit_text)) return true
  if (!sameNullableText(existing.sheet_row_id, normalizedIncoming.sheet_row_id)) return true
  if (normalizeJsonForCompare(existing.form_payload) !== normalizeJsonForCompare(normalizedIncoming.form_payload)) return true
  if (normalizeJsonForCompare(existing.calc_snapshot) !== normalizeJsonForCompare(normalizedIncoming.calc_snapshot)) return true
  if (normalizeJsonForCompare(existing.calc_summary) !== normalizeJsonForCompare(normalizedIncoming.calc_summary)) return true
  return false
}

function toManualInsertRow(lead: ManualLeadUpsert) {
  return {
    id: lead.id,
    source_type: lead.sourceType,
    source: lead.source,
    request_type: lead.requestType,
    contact_name: lead.contactName,
    contact_email: lead.contactEmail,
    contact_phone: lead.contactPhone,
    birth_date: normalizeDate(lead.birthDate),
    age_text: lead.ageText ?? null,
    call_time: lead.callTime ?? null,
    note: lead.note ?? null,
    subject: lead.subject ?? null,
    cost_flag: lead.costFlag,
    tax20_flag: lead.tax20Flag,
    net_flag: lead.netFlag,
    savings_amount_text: lead.savingsAmountText ?? null,
    goal_text: lead.goalText ?? null,
    duration_text: lead.durationText ?? null,
    deadline_date: normalizeDate(lead.deadlineDate),
    deadline_reason: lead.deadlineReason ?? null,
    owner: lead.owner ?? null,
    paid_flag: lead.paidFlag,
    lead_type_text: lead.leadTypeText ?? null,
    client_number: lead.clientNumber ?? null,
    calendar_link: lead.calendarLink ?? null,
    help_needed: lead.helpNeeded ?? null,
    leads_per_day: lead.leadsPerDay ?? null,
    day_text: lead.dayText ?? null,
    time_text: lead.timeText ?? null,
    followup_note: lead.followupNote ?? null,
    report_text: normalizeReportOption(lead.reportText ?? null),
    revisit_text: lead.revisitText ?? null,
    sheet_row_id: lead.sheetRowId ?? null,
    form_payload: lead.formPayload ?? {},
    calc_snapshot: lead.calcSnapshot ?? {},
    calc_summary: lead.calcSummary ?? {},
    email_status: "queued" as const,
  }
}

export async function upsertManualLeads(leads: ManualLeadUpsert[]): Promise<{ count: number }> {
  const supabase = createSupabaseAdminClient()
  const rows = leads.map((lead) => toManualInsertRow(lead))

  const rowsWithId = rows.filter((row) => typeof row.id === "string" && row.id.length > 0)
  const rowsWithoutId = rows
    .filter((row) => !row.id)
    .map((row) => {
      const { id, ...rest } = row
      return rest
    })

  if (rowsWithId.length > 0) {
    const { error } = await supabase.from("lead_submissions").upsert(rowsWithId, { onConflict: "id" })
    if (error) {
      throw new Error(error.message)
    }
  }

  if (rowsWithoutId.length > 0) {
    const { error } = await supabase.from("lead_submissions").insert(rowsWithoutId)
    if (error) {
      throw new Error(error.message)
    }
  }

  return { count: rows.length }
}

export async function upsertSheetsLeadsByRowId(
  leads: ManualLeadUpsert[],
): Promise<{ count: number; created: number; updated: number }> {
  const supabase = createSupabaseAdminClient()
  if (leads.length === 0) return { count: 0, created: 0, updated: 0 }

  const rowIds = Array.from(
    new Set(
      leads
        .map((lead) => lead.sheetRowId?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  )

  const existingByRowId = new Map<string, LeadRow>()
  if (rowIds.length > 0) {
    const { data, error } = await supabase
      .from("lead_submissions")
      .select("*")
      .in("sheet_row_id", rowIds)

    if (error) throw new Error(error.message)

    for (const row of data ?? []) {
      const rowId = typeof row.sheet_row_id === "string" ? row.sheet_row_id : null
      if (!rowId || typeof row.id !== "string") continue
      existingByRowId.set(rowId, row as LeadRow)
    }
  }

  let updated = 0
  let created = 0
  const writeQueue: ManualLeadUpsert[] = []
  for (const lead of leads) {
    const rowId = lead.sheetRowId?.trim()
    const existing = rowId ? existingByRowId.get(rowId) : undefined
    if (existing?.id) {
      if (hasSheetLeadChanges(existing, lead)) {
        updated += 1
        writeQueue.push({ ...lead, id: existing.id, sourceType: "sheets" as const })
      }
      continue
    }
    created += 1
    writeQueue.push({ ...lead, sourceType: "sheets" as const })
  }

  if (writeQueue.length > 0) {
    await upsertManualLeads(writeQueue)
  }

  // Keep `count` as processed mapped rows for stable UI messaging.
  return { count: leads.length, created, updated }
}

export async function deleteSheetsLeadsMissingRowIds(
  activeRowIds: string[],
  options?: { minCandidateCount?: number; maxDeleteRatio?: number },
): Promise<{ deleted: number; skippedSafety: boolean; candidateCount: number; totalManagedCount: number }> {
  const supabase = createSupabaseAdminClient()

  let candidateQuery = supabase
    .from("lead_submissions")
    .select("id")
    .in("source_type", ["sheets", "manual_import"])
    .not("sheet_row_id", "is", null)
  if (activeRowIds.length > 0) {
    candidateQuery = candidateQuery.not("sheet_row_id", "in", `(${activeRowIds.map((id) => `"${id}"`).join(",")})`)
  }
  const { data: candidateRows, error: candidateError } = await candidateQuery
  if (candidateError) throw new Error(candidateError.message)

  const candidateCount = candidateRows?.length ?? 0
  const { count: totalManagedCountRaw, error: totalManagedError } = await supabase
    .from("lead_submissions")
    .select("id", { count: "exact", head: true })
    .in("source_type", ["sheets", "manual_import"])
    .not("sheet_row_id", "is", null)
  if (totalManagedError) throw new Error(totalManagedError.message)
  const totalManagedCount = totalManagedCountRaw ?? 0

  const skippedSafety = shouldSkipMassDelete({
    candidateDeleteCount: candidateCount,
    totalManagedCount,
    minCandidateCount: options?.minCandidateCount ?? 20,
    maxDeleteRatio: options?.maxDeleteRatio ?? 0.45,
  })
  if (skippedSafety) {
    return { deleted: 0, skippedSafety: true, candidateCount, totalManagedCount }
  }

  let deleteQuery = supabase
    .from("lead_submissions")
    .delete()
    .in("source_type", ["sheets", "manual_import"])
    .not("sheet_row_id", "is", null)
  if (activeRowIds.length > 0) {
    deleteQuery = deleteQuery.not("sheet_row_id", "in", `(${activeRowIds.map((id) => `"${id}"`).join(",")})`)
  }

  const { data, error } = await deleteQuery.select("id")
  if (error) throw new Error(error.message)
  return { deleted: data?.length ?? 0, skippedSafety: false, candidateCount, totalManagedCount }
}

export async function listLeads(options?: { limit?: number; sourceType?: string; search?: string }): Promise<LeadRow[]> {
  const supabase = createSupabaseAdminClient()
  const limit = Math.min(Math.max(options?.limit ?? 200, 1), 2000)

  let query = supabase
    .from("lead_submissions")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (options?.sourceType) {
    query = query.eq("source_type", options.sourceType)
  }

  if (options?.search?.trim()) {
    const q = options.search.trim()
    query = query.or(`contact_name.ilike.%${q}%,contact_email.ilike.%${q}%,contact_phone.ilike.%${q}%,note.ilike.%${q}%`)
  }

  const { data, error } = await query
  if (error) {
    throw new Error(error.message)
  }
  return (data ?? []) as LeadRow[]
}

export async function updateLeadById(id: string, lead: Partial<ManualLeadUpsert>): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const patch: Record<string, unknown> = {}
  const touchedCalendarFields: CalendarSyncDbField[] = []

  if (lead.sourceType !== undefined) patch.source_type = lead.sourceType
  if (lead.source !== undefined) {
    patch.source = lead.source
    touchedCalendarFields.push("source")
  }
  if (lead.requestType !== undefined) patch.request_type = lead.requestType
  if (lead.contactName !== undefined) {
    patch.contact_name = lead.contactName
    touchedCalendarFields.push("contact_name")
  }
  if (lead.contactEmail !== undefined) {
    patch.contact_email = lead.contactEmail
    touchedCalendarFields.push("contact_email")
  }
  if (lead.contactPhone !== undefined) {
    patch.contact_phone = lead.contactPhone
    touchedCalendarFields.push("contact_phone")
  }
  if (lead.birthDate !== undefined) patch.birth_date = normalizeDate(lead.birthDate)
  if (lead.ageText !== undefined) {
    patch.age_text = lead.ageText
    touchedCalendarFields.push("age_text")
  }
  if (lead.callTime !== undefined) {
    patch.call_time = lead.callTime
    touchedCalendarFields.push("call_time")
  }
  if (lead.note !== undefined) {
    patch.note = lead.note
    touchedCalendarFields.push("note")
  }
  if (lead.subject !== undefined) patch.subject = lead.subject
  if (lead.costFlag !== undefined) patch.cost_flag = lead.costFlag
  if (lead.tax20Flag !== undefined) patch.tax20_flag = lead.tax20Flag
  if (lead.netFlag !== undefined) patch.net_flag = lead.netFlag
  if (lead.savingsAmountText !== undefined) {
    patch.savings_amount_text = lead.savingsAmountText
    touchedCalendarFields.push("savings_amount_text")
  }
  if (lead.goalText !== undefined) {
    patch.goal_text = lead.goalText
    touchedCalendarFields.push("goal_text")
  }
  if (lead.durationText !== undefined) {
    patch.duration_text = lead.durationText
    touchedCalendarFields.push("duration_text")
  }
  if (lead.deadlineDate !== undefined) {
    patch.deadline_date = normalizeDate(lead.deadlineDate)
    touchedCalendarFields.push("deadline_date")
  }
  if (lead.deadlineReason !== undefined) {
    patch.deadline_reason = lead.deadlineReason
    touchedCalendarFields.push("deadline_reason")
  }
  if (lead.owner !== undefined) patch.owner = lead.owner
  if (lead.paidFlag !== undefined) patch.paid_flag = lead.paidFlag
  if (lead.leadTypeText !== undefined) patch.lead_type_text = lead.leadTypeText
  if (lead.clientNumber !== undefined) {
    patch.client_number = lead.clientNumber
    touchedCalendarFields.push("client_number")
  }
  if (lead.calendarLink !== undefined) patch.calendar_link = lead.calendarLink
  if (lead.helpNeeded !== undefined) patch.help_needed = lead.helpNeeded
  if (lead.leadsPerDay !== undefined) patch.leads_per_day = lead.leadsPerDay
  if (lead.dayText !== undefined) {
    patch.day_text = lead.dayText
    touchedCalendarFields.push("day_text")
  }
  if (lead.timeText !== undefined) {
    patch.time_text = lead.timeText
    touchedCalendarFields.push("time_text")
  }
  if (lead.followupNote !== undefined) patch.followup_note = lead.followupNote
  if (lead.reportText !== undefined) patch.report_text = normalizeReportOption(lead.reportText)
  if (lead.revisitText !== undefined) patch.revisit_text = lead.revisitText
  if (lead.sheetRowId !== undefined) patch.sheet_row_id = lead.sheetRowId
  if (lead.formPayload !== undefined) patch.form_payload = lead.formPayload
  if (lead.calcSnapshot !== undefined) patch.calc_snapshot = lead.calcSnapshot
  if (lead.calcSummary !== undefined) patch.calc_summary = lead.calcSummary
  if (Object.keys(patch).length === 0) return

  if (touchedCalendarFields.length > 0) {
    const { data: existing, error: existingError } = await supabase
      .from("lead_submissions")
      .select("calendar_field_updated_at")
      .eq("id", id)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)
    patch.calendar_field_updated_at = mergeCalendarFieldUpdatedAtMap(
      existing?.calendar_field_updated_at,
      Array.from(new Set(touchedCalendarFields)),
      new Date().toISOString(),
    )
  }

  const { error } = await supabase.from("lead_submissions").update(patch).eq("id", id)
  if (error) {
    throw new Error(error.message)
  }
}

export async function updateLeadFromGoogleCalendarSync(
  id: string,
  patchInput: {
    contactName?: string | null
    source?: string | null
    reportText?: string | null
    contactEmail?: string | null
    contactPhone?: string | null
    ageText?: string | null
    callTime?: string | null
    savingsAmountText?: string | null
    goalText?: string | null
    durationText?: string | null
    deadlineDate?: string | null
    deadlineReason?: string | null
    note?: string | null
    clientNumber?: string | null
    dayText?: string | null
    timeText?: string | null
    fieldTimestamp?: string | null
    changedFields?: CalendarSyncDbField[]
    currentFieldUpdatedAt?: unknown
  },
): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const patch: Record<string, unknown> = {}

  if (patchInput.contactName !== undefined) patch.contact_name = asTextOrNull(patchInput.contactName)
  if (patchInput.source !== undefined) patch.source = asTextOrNull(patchInput.source)
  if (patchInput.reportText !== undefined) patch.report_text = normalizeReportOption(patchInput.reportText)
  if (patchInput.contactEmail !== undefined) patch.contact_email = normalizeEmailForPatch(patchInput.contactEmail) ?? ""
  if (patchInput.contactPhone !== undefined) patch.contact_phone = normalizeHuPhoneForPatch(patchInput.contactPhone) ?? "N/A"
  if (patchInput.ageText !== undefined) patch.age_text = asTextOrNull(patchInput.ageText)
  if (patchInput.callTime !== undefined) patch.call_time = asTextOrNull(patchInput.callTime)
  if (patchInput.savingsAmountText !== undefined) patch.savings_amount_text = asTextOrNull(patchInput.savingsAmountText)
  if (patchInput.goalText !== undefined) patch.goal_text = asTextOrNull(patchInput.goalText)
  if (patchInput.durationText !== undefined) patch.duration_text = asTextOrNull(patchInput.durationText)
  if (patchInput.deadlineDate !== undefined) patch.deadline_date = normalizeDate(patchInput.deadlineDate)
  if (patchInput.deadlineReason !== undefined) patch.deadline_reason = asTextOrNull(patchInput.deadlineReason)
  if (patchInput.note !== undefined) patch.note = asTextOrNull(patchInput.note)
  if (patchInput.clientNumber !== undefined) patch.client_number = asTextOrNull(patchInput.clientNumber)
  if (patchInput.dayText !== undefined) patch.day_text = asTextOrNull(patchInput.dayText)
  if (patchInput.timeText !== undefined) patch.time_text = asTextOrNull(patchInput.timeText)

  if (Object.keys(patch).length === 0) return

  const changedFields = Array.from(new Set(patchInput.changedFields ?? []))
  if (changedFields.length > 0) {
    const timestamp = asIsoTimestampOrNull(patchInput.fieldTimestamp) ?? new Date().toISOString()
    const baseValue = patchInput.currentFieldUpdatedAt
    if (baseValue !== undefined) {
      patch.calendar_field_updated_at = mergeCalendarFieldUpdatedAtMap(baseValue, changedFields, timestamp)
    } else {
      const { data: existing, error: existingError } = await supabase
        .from("lead_submissions")
        .select("calendar_field_updated_at")
        .eq("id", id)
        .maybeSingle()
      if (existingError) throw new Error(existingError.message)
      patch.calendar_field_updated_at = mergeCalendarFieldUpdatedAtMap(
        existing?.calendar_field_updated_at,
        changedFields,
        timestamp,
      )
    }
  }

  const { error } = await supabase.from("lead_submissions").update(patch).eq("id", id)
  if (error) throw new Error(error.message)
}

export async function createLeadFromGoogleCalendarEvent(input: {
  eventId: string
  fieldTimestamp?: string | null
  contactName: string
  source?: string | null
  reportText?: string | null
  contactEmail?: string | null
  contactPhone?: string | null
  ageText?: string | null
  callTime?: string | null
  savingsAmountText?: string | null
  goalText?: string | null
  durationText?: string | null
  deadlineDate?: string | null
  deadlineReason?: string | null
  note?: string | null
  clientNumber?: string | null
  dayText: string
  timeText: string
}): Promise<LeadRow> {
  const supabase = createSupabaseAdminClient()
  const timestamp = asIsoTimestampOrNull(input.fieldTimestamp) ?? new Date().toISOString()
  const changedFields: CalendarSyncDbField[] = []

  const contactName = asTextOrNull(input.contactName)
  if (!contactName) {
    throw new Error("Naptárból lead létrehozás: hiányzó név.")
  }

  const dayText = asTextOrNull(input.dayText)
  const timeText = asTextOrNull(input.timeText)
  if (!dayText || !timeText) {
    throw new Error("Naptárból lead létrehozás: hiányzó VH napja vagy VH ideje.")
  }

  const source = asTextOrNull(input.source) ?? "google_calendar"
  const reportText = normalizeReportOption(input.reportText)
  const contactEmail = normalizeEmailForPatch(input.contactEmail) ?? ""
  const contactPhone = normalizeHuPhoneForPatch(input.contactPhone) ?? "N/A"
  const ageText = asTextOrNull(input.ageText)
  const callTime = asTextOrNull(input.callTime)
  const savingsAmountText = asTextOrNull(input.savingsAmountText)
  const goalText = asTextOrNull(input.goalText)
  const durationText = asTextOrNull(input.durationText)
  const deadlineDate = normalizeDate(input.deadlineDate)
  const deadlineReason = asTextOrNull(input.deadlineReason)
  const note = asTextOrNull(input.note)
  const clientNumber = asTextOrNull(input.clientNumber)

  changedFields.push("contact_name", "day_text", "time_text")
  if (source) changedFields.push("source")
  if (reportText) changedFields.push("report_text")
  if (contactEmail) changedFields.push("contact_email")
  if (contactPhone && contactPhone !== "N/A") changedFields.push("contact_phone")
  if (ageText) changedFields.push("age_text")
  if (callTime) changedFields.push("call_time")
  if (savingsAmountText) changedFields.push("savings_amount_text")
  if (goalText) changedFields.push("goal_text")
  if (durationText) changedFields.push("duration_text")
  if (deadlineDate) changedFields.push("deadline_date")
  if (deadlineReason) changedFields.push("deadline_reason")
  if (note) changedFields.push("note")
  if (clientNumber) changedFields.push("client_number")

  const uniqueChangedFields = Array.from(new Set(changedFields))
  const calendarFieldUpdatedAt = mergeCalendarFieldUpdatedAtMap({}, uniqueChangedFields, timestamp)

  const insertRow = {
    source_type: "app_edit" as const,
    source,
    report_text: reportText,
    request_type: "A" as const,
    contact_name: contactName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    age_text: ageText,
    call_time: callTime,
    savings_amount_text: savingsAmountText,
    goal_text: goalText,
    duration_text: durationText,
    deadline_date: deadlineDate,
    deadline_reason: deadlineReason,
    note,
    client_number: clientNumber,
    day_text: dayText,
    time_text: timeText,
    calendar_google_event_id: input.eventId,
    last_synced_at: new Date().toISOString(),
    calendar_field_updated_at: calendarFieldUpdatedAt,
    form_payload: {},
    calc_snapshot: {},
    calc_summary: {},
    email_status: "queued" as const,
  }

  const { data, error } = await supabase.from("lead_submissions").insert(insertRow).select("*").single()
  if (error || !data) {
    throw new Error(error?.message ?? "Nem sikerült naptár eseményből leadet létrehozni.")
  }
  return data as LeadRow
}

export async function markLeadSyncMeta(
  id: string,
  meta: {
    sheetRowId?: string | null
    googleEventId?: string | null
    icloudEventId?: string | null
  },
): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase
    .from("lead_submissions")
    .update({
      sheet_row_id: meta.sheetRowId ?? null,
      calendar_google_event_id: meta.googleEventId ?? null,
      calendar_icloud_event_id: meta.icloudEventId ?? null,
      last_synced_at: new Date().toISOString(),
    })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function markLeadCalendarFieldTimestamps(
  id: string,
  fields: CalendarSyncDbField[],
  input?: {
    timestamp?: string | null
    currentFieldUpdatedAt?: unknown
  },
): Promise<void> {
  const uniqueFields = Array.from(new Set(fields))
  if (uniqueFields.length === 0) return
  const supabase = createSupabaseAdminClient()
  const timestamp = asIsoTimestampOrNull(input?.timestamp) ?? new Date().toISOString()
  let baseValue = input?.currentFieldUpdatedAt
  if (baseValue === undefined) {
    const { data: existing, error: existingError } = await supabase
      .from("lead_submissions")
      .select("calendar_field_updated_at")
      .eq("id", id)
      .maybeSingle()
    if (existingError) throw new Error(existingError.message)
    baseValue = existing?.calendar_field_updated_at
  }
  const merged = mergeCalendarFieldUpdatedAtMap(baseValue, uniqueFields, timestamp)
  const { error } = await supabase.from("lead_submissions").update({ calendar_field_updated_at: merged }).eq("id", id)
  if (error) throw new Error(error.message)
}

export type LeadSourceTypeFilter = "landing_form" | "manual_import" | "sheets" | "app_edit"

export async function getLeadMonthsWithData(options?: { sourceType?: LeadSourceTypeFilter }): Promise<string[]> {
  const supabase = createSupabaseAdminClient()
  let query = supabase.from("lead_submissions").select("call_time")
  if (options?.sourceType) {
    query = query.eq("source_type", options.sourceType)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)

  const monthSet = new Set<string>()
  for (const row of data ?? []) {
    const callTimeKey = toDateOnlyKey(typeof row.call_time === "string" ? row.call_time : null)
    if (!callTimeKey) continue
    monthSet.add(callTimeKey.slice(0, 7))
  }

  return Array.from(monthSet).sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
}

export async function getLeadStatsSummary(options?: { monthKey?: string; sourceType?: LeadSourceTypeFilter }) {
  const supabase = createSupabaseAdminClient()
  let query = supabase
    .from("lead_submissions")
    .select("created_at, source_type, paid_flag, owner, day_text, call_time, report_text")
  if (options?.sourceType) {
    query = query.eq("source_type", options.sourceType)
  }
  const { data, error } = await query
  if (error) throw new Error(error.message)

  const rows = data ?? []
  const today = new Date()
  const keyToday = today.toISOString().slice(0, 10)
  const fallbackMonthKey = today.toISOString().slice(0, 7)
  const keyMonth = options?.monthKey && /^\d{4}-\d{2}$/.test(options.monthKey) ? options.monthKey : fallbackMonthKey
  const monthStartKey = `${keyMonth}-01`
  const monthEndDate = new Date(`${monthStartKey}T00:00:00.000Z`)
  monthEndDate.setUTCMonth(monthEndDate.getUTCMonth() + 1, 0)
  const monthEndKey = monthEndDate.toISOString().slice(0, 10)

  let callToday = 0
  let monthByCallTime = 0
  let paidCount = 0
  const bySource: Record<string, number> = {}
  const byOwner: Record<string, number> = {}
  const reportTotals: Record<string, number> = Object.fromEntries(REPORT_OPTIONS.map((option) => [option, 0]))
  reportTotals[UNKNOWN_REPORT_LABEL] = 0
  const reportMonthly: Record<string, number> = Object.fromEntries(REPORT_OPTIONS.map((option) => [option, 0]))
  reportMonthly[UNKNOWN_REPORT_LABEL] = 0
  const breakdown = {
    total: { form: 0, excel: 0 },
    callToday: { form: 0, excel: 0 },
    monthByCallTime: { form: 0, excel: 0 },
    paidCount: { form: 0, excel: 0 },
  }

  for (const row of rows) {
    const sourceType = String(row.source_type ?? "unknown")
    const isForm = sourceType === "landing_form"
    const isExcel = sourceType === "manual_import" || sourceType === "sheets" || sourceType === "app_edit"

    if (isForm) breakdown.total.form += 1
    if (isExcel) breakdown.total.excel += 1

    const dayKey = toDateOnlyKey(typeof row.day_text === "string" ? row.day_text : null)
    if (dayKey === keyToday) {
      callToday += 1
      if (isForm) breakdown.callToday.form += 1
      if (isExcel) breakdown.callToday.excel += 1
    }

    const callTimeKey = toDateOnlyKey(typeof row.call_time === "string" ? row.call_time : null)
    if (callTimeKey && callTimeKey >= monthStartKey && callTimeKey <= monthEndKey) {
      monthByCallTime += 1
      if (isForm) breakdown.monthByCallTime.form += 1
      if (isExcel) breakdown.monthByCallTime.excel += 1
    }

    if (row.paid_flag) {
      paidCount += 1
      if (isForm) breakdown.paidCount.form += 1
      if (isExcel) breakdown.paidCount.excel += 1
    }

    const source = String(row.source_type ?? "unknown")
    bySource[source] = (bySource[source] ?? 0) + 1
    const owner = String(row.owner ?? "N/A")
    byOwner[owner] = (byOwner[owner] ?? 0) + 1

    const reportText = typeof row.report_text === "string" ? row.report_text.trim() : ""
    const reportKey = normalizeReportOption(reportText) ?? UNKNOWN_REPORT_LABEL
    reportTotals[reportKey] = (reportTotals[reportKey] ?? 0) + 1
    if (callTimeKey && callTimeKey >= monthStartKey && callTimeKey <= monthEndKey) {
      reportMonthly[reportKey] = (reportMonthly[reportKey] ?? 0) + 1
    }
  }

  return {
    total: rows.length,
    leadsToday: callToday,
    leadsMonth: monthByCallTime,
    paidCount,
    bySource,
    byOwner,
    reportTotals,
    reportMonthly,
    breakdown,
  }
}

export async function deleteLeadsBySourceTypes(
  sourceTypes: Array<"landing_form" | "manual_import" | "sheets" | "app_edit">,
): Promise<{ count: number }> {
  const supabase = createSupabaseAdminClient()
  if (sourceTypes.length === 0) return { count: 0 }

  const { data, error } = await supabase
    .from("lead_submissions")
    .delete()
    .in("source_type", sourceTypes)
    .select("id")

  if (error) {
    throw new Error(error.message)
  }

  return { count: data?.length ?? 0 }
}

export async function deleteLeadById(id: string): Promise<{ count: number }> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase.from("lead_submissions").delete().eq("id", id).select("id")

  if (error) {
    throw new Error(error.message)
  }

  return { count: data?.length ?? 0 }
}

export async function getSyncStateValue(stateKey: string): Promise<string | null> {
  const supabase = createSupabaseAdminClient()
  const { data, error } = await supabase
    .from("sync_state")
    .select("value_text")
    .eq("state_key", stateKey)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return typeof data?.value_text === "string" ? data.value_text : null
}

export async function setSyncStateValue(stateKey: string, valueText: string | null): Promise<void> {
  const supabase = createSupabaseAdminClient()
  const { error } = await supabase.from("sync_state").upsert(
    {
      state_key: stateKey,
      value_text: valueText,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "state_key" },
  )
  if (error) throw new Error(error.message)
}

const CALENDAR_GOOGLE_AUTO_ENABLED_KEY = "calendar_google_auto_enabled"

export async function getCalendarAutoSyncEnabled(): Promise<boolean> {
  const raw = await getSyncStateValue(CALENDAR_GOOGLE_AUTO_ENABLED_KEY)
  if (!raw) return false
  return String(raw).trim().toLowerCase() === "true"
}

export async function setCalendarAutoSyncEnabled(enabled: boolean): Promise<void> {
  await setSyncStateValue(CALENDAR_GOOGLE_AUTO_ENABLED_KEY, enabled ? "true" : "false")
}
