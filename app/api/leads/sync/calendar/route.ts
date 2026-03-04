import { NextResponse } from "next/server"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import {
  cleanupGoogleCalendarDuplicates,
  deleteGoogleCalendarEvent,
  listGoogleCalendarEvents,
  upsertGoogleCalendarEvent,
  type GoogleCalendarEvent,
} from "@/lib/integrations/google/calendar/client"
import {
  CALENDAR_SYNC_DB_FIELDS,
  createLeadFromGoogleCalendarEvent,
  deleteLeadById,
  getSyncStateValue,
  listLeads,
  markLeadCalendarFieldTimestamps,
  markLeadSyncMeta,
  setSyncStateValue,
  updateLeadFromGoogleCalendarSync,
} from "@/lib/leads/repository"
import {
  mapCalendarLabelToReportText,
  mapReportToCalendarLabel,
  normalizeReportTextForTitle,
} from "@/lib/leads/report-parser"
import {
  normalizeComparableDate,
  normalizeComparablePhone,
  normalizeComparableText,
  normalizeComparableTime,
  parseDateKey,
  parseTimeKey,
  shouldSkipMassDelete,
} from "@/lib/leads/sync-guards"

const GOOGLE_PULL_CHECKPOINT_KEY = "calendar_google_pull_checkpoint"
const GOOGLE_PUSH_HASH_STATE_KEY = "calendar_google_push_fingerprint_v1"
const CHANGE_LOG_LIMIT = 50
const SYNC_META_SKEW_MS = 5_000

type CalendarSyncDbField = (typeof CALENDAR_SYNC_DB_FIELDS)[number]

function toLocalDateTimeString(year: number, month: number, day: number, hour: number, minute: number) {
  const y = String(year).padStart(4, "0")
  const m = String(month).padStart(2, "0")
  const d = String(day).padStart(2, "0")
  const h = String(hour).padStart(2, "0")
  const mm = String(minute).padStart(2, "0")
  return `${y}-${m}-${d}T${h}:${mm}:00`
}

function asText(value?: string | null) {
  const text = String(value ?? "").trim()
  return text || null
}

function formatAgeForCalendar(value?: string | null) {
  const text = asText(value)
  if (!text) return null
  const normalized = text.replace(/\s/g, "").replace(",", ".")
  const numeric = Number(normalized.replace(/[^\d.+-]/g, ""))
  if (!Number.isFinite(numeric)) return text
  return String(Math.floor(numeric))
}

function formatDeadlineWithWeekday(value?: string | null) {
  const text = asText(value)
  if (!text) return null

  const parsed = parseDateKey(text)
  if (!parsed) return text

  const date = new Date(parsed.year, parsed.month - 1, parsed.day)
  const weekdayNames = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"]
  const weekday = weekdayNames[date.getDay()]
  const y = String(parsed.year).padStart(4, "0")
  const m = String(parsed.month).padStart(2, "0")
  const d = String(parsed.day).padStart(2, "0")
  return `${y}.${m}.${d} ${weekday}`
}

function formatDayTextFromDate(date: Date) {
  const y = String(date.getFullYear()).padStart(4, "0")
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}.${m}.${d}`
}

function formatTimeTextFromDate(date: Date) {
  const h = String(date.getHours()).padStart(2, "0")
  const m = String(date.getMinutes()).padStart(2, "0")
  return `${h}:${m}`
}

function formatCallTimeFromDate(date: Date) {
  const yy = String(date.getFullYear()).slice(-2)
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const h = String(date.getHours()).padStart(2, "0")
  const mm = String(date.getMinutes()).padStart(2, "0")
  return `${yy}.${m}.${d}. ${h}:${mm}`
}

function parseEventTitle(summary?: string | null) {
  const raw = String(summary ?? "").trim()
  if (!raw) {
    return {
      contactName: null,
      source: null,
      report: null,
      hasContactName: false,
      hasSource: false,
      hasReport: false,
    }
  }
  const parts = raw.split("/").map((part) => part.trim()).filter(Boolean)
  if (parts.length <= 1) {
    return {
      contactName: raw,
      source: null,
      report: null,
      hasContactName: true,
      hasSource: false,
      hasReport: false,
    }
  }
  if (parts.length === 2) {
    return {
      contactName: parts[0] || null,
      source: parts[1] || null,
      report: null,
      hasContactName: true,
      hasSource: true,
      hasReport: false,
    }
  }
  return {
    contactName: parts.slice(0, -2).join("/") || null,
    source: parts[parts.length - 2] || null,
    report: parts[parts.length - 1] || null,
    hasContactName: true,
    hasSource: true,
    hasReport: true,
  }
}

type ParsedCalendarDescription = {
  contactPhone?: string
  contactEmail?: string
  ageText?: string
  callTime?: string
  savingsAmountText?: string
  goalText?: string
  durationText?: string
  deadlineDate?: string
  deadlineReason?: string
  note?: string
  clientNumber?: string
}

function parseCalendarDescription(description?: string | null): ParsedCalendarDescription {
  const lines = String(description ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const fields: ParsedCalendarDescription = {}
  const noteLines: string[] = []

  for (const line of lines) {
    if (/^-{5,}$/.test(line)) continue
    const match = line.match(/^([^:]{1,40}):\s*(.+)$/)
    if (!match) {
      noteLines.push(line)
      continue
    }
    const key = match[1].trim().toLowerCase()
    const value = match[2].trim()
    if (!value) continue

    if (key === "telefon") fields.contactPhone = value
    else if (key === "mail" || key === "e-mail" || key === "email") fields.contactEmail = value
    else if (key === "életkor" || key === "eletkor" || key === "kor") fields.ageText = value
    else if (key === "hívás ideje" || key === "hivas ideje") fields.callTime = value
    else if (key === "összeg" || key === "osszeg") fields.savingsAmountText = value
    else if (key === "cél" || key === "cel") fields.goalText = value
    else if (key === "időtáv" || key === "idotav" || key === "táv" || key === "tav") fields.durationText = value
    else if (key === "határidő" || key === "hatarido") fields.deadlineDate = value
    else if (key === "határidő oka" || key === "hatarido oka") fields.deadlineReason = value
    else if (key === "megjegyzés" || key === "megjegyzes") fields.note = value
    else if (key === "üa" || key === "ua" || key === "ügyf szám" || key === "ugyf szam") fields.clientNumber = value
  }

  if (!fields.note && noteLines.length > 0) {
    fields.note = noteLines.join(" ")
  }

  return fields
}

function parseGoogleCalendarEventForLead(event: GoogleCalendarEvent) {
  const startDateTime = event.start?.dateTime
  if (!startDateTime) return null
  const date = new Date(startDateTime)
  if (Number.isNaN(date.getTime())) return null

  const title = parseEventTitle(event.summary)
  const desc = parseCalendarDescription(event.description)

  return {
    eventId: event.id ?? null,
    contactName: title.hasContactName ? title.contactName : undefined,
    source: title.hasSource ? title.source : undefined,
    reportText: title.hasReport ? mapCalendarLabelToReportText(title.report) : undefined,
    dayText: formatDayTextFromDate(date),
    timeText: formatTimeTextFromDate(date),
    callTimeFromStart: formatCallTimeFromDate(date),
    ...desc,
  }
}

function normalizeKeyPart(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
}

function buildFallbackMatchKey(input: { contactName?: string | null; source?: string | null; clientNumber?: string | null }) {
  const name = normalizeKeyPart(input.contactName)
  const source = normalizeKeyPart(input.source)
  const clientNumber = normalizeKeyPart(input.clientNumber).replace(/\s+/g, "")
  if (!name || !source || !clientNumber) return null
  return `${name}|${source}|${clientNumber}`
}

function buildSlotFallbackMatchKey(input: {
  contactName?: string | null
  source?: string | null
  dayText?: string | null
  timeText?: string | null
}) {
  const name = normalizeKeyPart(input.contactName)
  const source = normalizeKeyPart(input.source)
  const day = normalizeComparableDate(input.dayText)
  const time = normalizeComparableTime(input.timeText)
  if (!name || !source || !day || !time) return null
  return `${name}|${source}|${day}|${time}`
}

function toTimestamp(value?: string | null) {
  if (!value) return null
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) ? ts : null
}

function isLeadDirtyForCalendarPush(lead: Awaited<ReturnType<typeof listLeads>>[number]) {
  if (!lead.calendar_google_event_id) return true
  if (!lead.last_synced_at) return true

  const updatedAt = toTimestamp(lead.updated_at)
  const lastSyncedAt = toTimestamp(lead.last_synced_at)
  if (!updatedAt || !lastSyncedAt) return true
  // `markLeadSyncMeta` updates `last_synced_at`, but DB trigger also bumps `updated_at`.
  // Ignore tiny timestamp drifts caused by sync metadata writes.
  return updatedAt - lastSyncedAt > SYNC_META_SKEW_MS
}

function buildCalendarPushFingerprint(lead: Awaited<ReturnType<typeof listLeads>>[number]) {
  const reportLabel = mapReportToCalendarLabel(lead.report_text)
  const payload = {
    contactName: normalizeComparableText(lead.contact_name),
    source: normalizeComparableText(lead.source),
    reportLabel: normalizeComparableText(reportLabel),
    contactEmail: normalizeComparableText(lead.contact_email),
    contactPhone: normalizeComparablePhone(lead.contact_phone),
    ageText: normalizeComparableText(formatAgeForCalendar(lead.age_text)),
    callTime: normalizeComparableText(lead.call_time),
    savingsAmountText: normalizeComparableText(lead.savings_amount_text),
    goalText: normalizeComparableText(lead.goal_text),
    durationText: normalizeComparableText(lead.duration_text),
    deadlineDate: normalizeComparableDate(lead.deadline_date),
    deadlineReason: normalizeComparableText(lead.deadline_reason),
    note: normalizeComparableText(lead.note),
    clientNumber: normalizeComparableText(lead.client_number),
    dayText: normalizeComparableDate(lead.day_text),
    timeText: normalizeComparableTime(lead.time_text),
  }
  return JSON.stringify(payload)
}

type PullFieldDiff = {
  field: CalendarSyncDbField
  dbValue: string | null
  calendarValue: string | null
}

function getLeadPullFieldDiffs(
  lead: Awaited<ReturnType<typeof listLeads>>[number],
  parsed: ReturnType<typeof parseGoogleCalendarEventForLead>,
) {
  if (!parsed) return [] as PullFieldDiff[]
  const diffs: PullFieldDiff[] = []
  const pushDiff = (field: CalendarSyncDbField, dbValue: string | null, calendarValue: string | null) => {
    diffs.push({ field, dbValue, calendarValue })
  }

  if (parsed.contactName !== undefined && normalizeComparableText(lead.contact_name) !== normalizeComparableText(parsed.contactName)) {
    pushDiff("contact_name", asText(lead.contact_name), asText(parsed.contactName))
  }
  if (parsed.source !== undefined && normalizeComparableText(lead.source) !== normalizeComparableText(parsed.source)) {
    pushDiff("source", asText(lead.source), asText(parsed.source))
  }
  if (parsed.reportText !== undefined && normalizeReportTextForTitle(lead.report_text) !== normalizeReportTextForTitle(parsed.reportText)) {
    pushDiff("report_text", asText(lead.report_text), asText(parsed.reportText))
  }
  if (parsed.contactEmail !== undefined && normalizeComparableText(lead.contact_email) !== normalizeComparableText(parsed.contactEmail)) {
    pushDiff("contact_email", asText(lead.contact_email), asText(parsed.contactEmail))
  }
  if (parsed.contactPhone !== undefined && normalizeComparablePhone(lead.contact_phone) !== normalizeComparablePhone(parsed.contactPhone)) {
    pushDiff("contact_phone", asText(lead.contact_phone), asText(parsed.contactPhone))
  }

  const leadAgeComparable = formatAgeForCalendar(lead.age_text)
  const parsedAgeComparable = parsed.ageText === undefined ? undefined : formatAgeForCalendar(parsed.ageText)
  if (parsedAgeComparable !== undefined && normalizeComparableText(leadAgeComparable) !== normalizeComparableText(parsedAgeComparable)) {
    pushDiff("age_text", asText(lead.age_text), asText(parsed.ageText))
  }

  if (normalizeComparableText(lead.call_time) !== normalizeComparableText(parsed.callTime ?? parsed.callTimeFromStart)) {
    pushDiff("call_time", asText(lead.call_time), asText(parsed.callTime ?? parsed.callTimeFromStart))
  }
  if (
    parsed.savingsAmountText !== undefined &&
    normalizeComparableText(lead.savings_amount_text) !== normalizeComparableText(parsed.savingsAmountText)
  ) {
    pushDiff("savings_amount_text", asText(lead.savings_amount_text), asText(parsed.savingsAmountText))
  }
  if (parsed.goalText !== undefined && normalizeComparableText(lead.goal_text) !== normalizeComparableText(parsed.goalText)) {
    pushDiff("goal_text", asText(lead.goal_text), asText(parsed.goalText))
  }
  if (parsed.durationText !== undefined && normalizeComparableText(lead.duration_text) !== normalizeComparableText(parsed.durationText)) {
    pushDiff("duration_text", asText(lead.duration_text), asText(parsed.durationText))
  }
  if (parsed.deadlineDate !== undefined && normalizeComparableDate(lead.deadline_date) !== normalizeComparableDate(parsed.deadlineDate)) {
    pushDiff("deadline_date", asText(lead.deadline_date), asText(parsed.deadlineDate))
  }
  if (
    parsed.deadlineReason !== undefined &&
    normalizeComparableText(lead.deadline_reason) !== normalizeComparableText(parsed.deadlineReason)
  ) {
    pushDiff("deadline_reason", asText(lead.deadline_reason), asText(parsed.deadlineReason))
  }
  if (parsed.note !== undefined && normalizeComparableText(lead.note) !== normalizeComparableText(parsed.note)) {
    pushDiff("note", asText(lead.note), asText(parsed.note))
  }
  if (
    parsed.clientNumber !== undefined &&
    normalizeComparableText(lead.client_number) !== normalizeComparableText(parsed.clientNumber)
  ) {
    pushDiff("client_number", asText(lead.client_number), asText(parsed.clientNumber))
  }
  if (normalizeComparableDate(lead.day_text) !== normalizeComparableDate(parsed.dayText)) {
    pushDiff("day_text", asText(lead.day_text), asText(parsed.dayText))
  }
  if (normalizeComparableTime(lead.time_text) !== normalizeComparableTime(parsed.timeText)) {
    pushDiff("time_text", asText(lead.time_text), asText(parsed.timeText))
  }

  return diffs
}

function getLeadFieldTimestampMap(lead: Awaited<ReturnType<typeof listLeads>>[number]) {
  const raw =
    lead.calendar_field_updated_at && typeof lead.calendar_field_updated_at === "object"
      ? (lead.calendar_field_updated_at as Record<string, unknown>)
      : {}
  const out: Partial<Record<CalendarSyncDbField, number>> = {}
  for (const field of CALENDAR_SYNC_DB_FIELDS) {
    const ts = toTimestamp(typeof raw[field] === "string" ? String(raw[field]) : null)
    if (ts !== null) out[field] = ts
  }
  return out
}

function pickFieldWinner(input: {
  lead: Awaited<ReturnType<typeof listLeads>>[number]
  field: CalendarSyncDbField
  eventUpdatedAt: number | null
}) {
  const leadFieldMap = getLeadFieldTimestampMap(input.lead)
  const dbFieldTs = leadFieldMap[input.field] ?? toTimestamp(input.lead.updated_at)
  const calendarFieldTs = input.eventUpdatedAt
  if (calendarFieldTs !== null && dbFieldTs !== null) return calendarFieldTs >= dbFieldTs ? "calendar" : "db"
  if (calendarFieldTs !== null) return "calendar"
  if (dbFieldTs !== null) return "db"
  return "calendar"
}

type SyncChange = {
  leadId: string
  leadName: string
  direction: "calendar_to_db" | "db_to_calendar" | "none"
  winner: "calendar" | "db" | "none"
  changedFields: string[]
  fieldDiffs?: Array<{
    field: string
    winner: "calendar" | "db"
    oldValue: string | null
    newValue: string | null
  }>
  action: "created" | "updated" | "skipped_no_change" | "skipped_unmatched" | "deferred"
  message: string
}

function pushChange(changes: SyncChange[], entry: SyncChange) {
  if (changes.length >= CHANGE_LOG_LIMIT) return
  changes.push(entry)
}

function buildCalendarDescription(lead: Awaited<ReturnType<typeof listLeads>>[number]) {
  const headerLines: string[] = []
  const detailLines: string[] = []
  const footerLines: string[] = []
  const separator = "------------------------------------------------------"

  const pushLine = (target: string[], label: string, value?: string | null) => {
    const text = asText(value)
    if (text) target.push(`${label}: ${text}`)
  }

  pushLine(headerLines, "Telefon", lead.contact_phone)
  pushLine(headerLines, "Mail", lead.contact_email)

  const age = formatAgeForCalendar(lead.age_text)
  if (age) headerLines.push(`Életkor: ${age}`)

  pushLine(detailLines, "Hívás ideje", lead.call_time)

  const amount = asText(lead.savings_amount_text)
  if (amount) detailLines.push(`Összeg: ${amount}`)

  const goal = asText(lead.goal_text)
  if (goal) detailLines.push(`Cél: ${goal}`)

  const duration = asText(lead.duration_text)
  if (duration) detailLines.push(`Időtáv: ${duration}`)

  const deadline = formatDeadlineWithWeekday(lead.deadline_date)
  if (deadline) detailLines.push(`Határidő: ${deadline}`)

  const deadlineReason = asText(lead.deadline_reason)
  if (deadlineReason) detailLines.push(`Határidő oka: ${deadlineReason}`)

  const note = asText(lead.note)
  if (note) footerLines.push(note)

  const clientNumber = asText(lead.client_number)
  if (clientNumber) footerLines.push(`ÜA: ${clientNumber}`)

  const blocks: string[] = []
  if (headerLines.length > 0) blocks.push(headerLines.join("\n"))
  if (detailLines.length > 0) {
    if (blocks.length > 0) blocks.push(separator)
    blocks.push(detailLines.join("\n"))
  }
  if (note) {
    if (blocks.length > 0) blocks.push(separator)
    blocks.push(note)
  }
  if (clientNumber) {
    if (blocks.length > 0) blocks.push(separator)
    blocks.push(`ÜA: ${clientNumber}`)
  }

  return blocks.join("\n")
}

function isLikelyAppManagedCalendarEvent(event: GoogleCalendarEvent) {
  const summary = String(event.summary ?? "").trim()
  const summaryLower = summary.toLowerCase()
  const hasSlashTitleShape = summary.includes("/") && summary.length >= 3
  const hasLegacyLeadTitle = summaryLower.startsWith("lead:")
  if (!hasSlashTitleShape && !hasLegacyLeadTitle) return false
  return true
}

function isStronglyAppManagedCalendarEvent(event: GoogleCalendarEvent) {
  const hasLegacyLeadTitle = String(event.summary ?? "")
    .trim()
    .toLowerCase()
    .startsWith("lead:")
  if (hasLegacyLeadTitle) return true

  const privateMarker = String(event.extendedProperties?.private?.dm_lead_sync_managed ?? "")
    .trim()
    .toLowerCase()
  if (privateMarker === "1" || privateMarker === "true" || privateMarker === "yes") return true

  const serviceAccountEmail = String(process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL ?? "")
    .trim()
    .toLowerCase()
  if (!serviceAccountEmail) return false

  const creatorEmail = String(event.creator?.email ?? "")
    .trim()
    .toLowerCase()
  const organizerEmail = String(event.organizer?.email ?? "")
    .trim()
    .toLowerCase()

  return creatorEmail === serviceAccountEmail || organizerEmail === serviceAccountEmail
}

function hasManagedPrivateMarker(event: GoogleCalendarEvent) {
  const privateMarker = String(event.extendedProperties?.private?.dm_lead_sync_managed ?? "")
    .trim()
    .toLowerCase()
  return privateMarker === "1" || privateMarker === "true" || privateMarker === "yes"
}

function shouldAutoDeleteOrphanCalendarEvent(event: GoogleCalendarEvent) {
  const hasLegacyLeadTitle = String(event.summary ?? "")
    .trim()
    .toLowerCase()
    .startsWith("lead:")
  return hasLegacyLeadTitle || hasManagedPrivateMarker(event)
}

export async function POST(request: Request) {
  try {
    const isInternalCall = request.headers.get("x-internal-sync") === "1"
    if (!isInternalCall) {
      const user = getSessionUserFromRequest(request)
      if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
        return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
      }
    }

    const leads = await listLeads({ limit: 2000 })

    let pushAttempted = 0
    let pushCandidatesCount = 0
    let missingSlot = 0
    let invalidSlot = 0
    let pushSynced = 0
    let deletedDuplicates = 0
    const changes: SyncChange[] = []
    const errors: Array<{ leadId: string; message: string }> = []

    // Phase 1: Google -> DB (or conflict detect for DB winner)
    const byEventId = new Map<string, (typeof leads)[number]>()
    const byFallbackKey = new Map<string, (typeof leads)[number]>()
    const bySlotFallbackKey = new Map<string, Array<(typeof leads)[number]>>()
    for (const lead of leads) {
      if (lead.calendar_google_event_id) {
        byEventId.set(lead.calendar_google_event_id, lead)
      }
      const fallbackKey = buildFallbackMatchKey({
        contactName: lead.contact_name,
        source: lead.source,
        clientNumber: lead.client_number,
      })
      if (fallbackKey) byFallbackKey.set(fallbackKey, lead)

      const slotFallbackKey = buildSlotFallbackMatchKey({
        contactName: lead.contact_name,
        source: lead.source,
        dayText: lead.day_text,
        timeText: lead.time_text,
      })
      if (slotFallbackKey) {
        const current = bySlotFallbackKey.get(slotFallbackKey) ?? []
        current.push(lead)
        bySlotFallbackKey.set(slotFallbackKey, current)
      }
    }

    const pullStartedAt = new Date().toISOString()
    const checkpoint = await getSyncStateValue(GOOGLE_PULL_CHECKPOINT_KEY)
    const checkpointDate = checkpoint ? new Date(checkpoint) : null
    const validCheckpoint =
      checkpointDate && Number.isFinite(checkpointDate.getTime()) ? checkpointDate.toISOString() : null

    const now = new Date()
    const fallbackTimeMin = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate(), 0, 0, 0).toISOString()
    const fallbackTimeMax = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate(), 23, 59, 59).toISOString()

    const pullMode = validCheckpoint ? "incremental" : "full-fallback"
    const googleEvents = await listGoogleCalendarEvents(
      validCheckpoint
        ? { updatedMin: validCheckpoint, maxResults: 500 }
        : { timeMin: fallbackTimeMin, timeMax: fallbackTimeMax, maxResults: 2000 },
    )
    // Incremental pull only returns recently modified calendar events, so
    // unchanged orphan events would be missed. Run a separate orphan sweep
    // over the full active time window to catch and delete stale events.
    const orphanSweepEvents = validCheckpoint
      ? await listGoogleCalendarEvents({ timeMin: fallbackTimeMin, timeMax: fallbackTimeMax, maxResults: 2000 })
      : googleEvents

    const pullCandidates = googleEvents.length
    let pullProcessed = 0
    let pullUpdated = 0
    let pullSkipped = 0
    let conflicts = 0
    let unchangedSkipped = 0
    let deletedOrphans = 0
    let deletedLeadsFromCalendar = 0
    let createdFromCalendar = 0
    let safetySkipped = 0
    const forcedPushLeadIds = new Set<string>()
    const createdLeadFingerprints: Record<string, string> = {}
    const forcedPushFieldHints = new Map<string, CalendarSyncDbField[]>()
    const forcedPushFieldDiffs = new Map<
      string,
      Array<{ field: string; winner: "calendar" | "db"; oldValue: string | null; newValue: string | null }>
    >()

    for (const event of googleEvents) {
      const parsed = parseGoogleCalendarEventForLead(event)
      if (!parsed) {
        pullSkipped += 1
        continue
      }
      pullProcessed += 1

      let matchedLead: (typeof leads)[number] | undefined
      let matchedBySlotFallback = false
      let slotFallbackConflict = false
      if (parsed.eventId && byEventId.has(parsed.eventId)) {
        matchedLead = byEventId.get(parsed.eventId)
      } else {
        const fallbackKey = buildFallbackMatchKey({
          contactName: parsed.contactName,
          source: parsed.source,
          clientNumber: parsed.clientNumber,
        })
        if (fallbackKey) {
          matchedLead = byFallbackKey.get(fallbackKey)
        }
        if (!matchedLead) {
          const slotFallbackKey = buildSlotFallbackMatchKey({
            contactName: parsed.contactName,
            source: parsed.source,
            dayText: parsed.dayText,
            timeText: parsed.timeText,
          })
          if (slotFallbackKey) {
            const candidates = bySlotFallbackKey.get(slotFallbackKey) ?? []
            if (candidates.length === 1) {
              matchedLead = candidates[0]
              matchedBySlotFallback = true
            } else if (candidates.length > 1) {
              slotFallbackConflict = true
            }
          }
        }
      }

      if (!matchedLead) {
        const eventId = String(event.id ?? parsed.eventId ?? "").trim()
        if (slotFallbackConflict) {
          pullSkipped += 1
          pushChange(changes, {
            leadId: eventId || "unknown",
            leadName: parsed.contactName ?? "Ismeretlen",
            direction: "none",
            winner: "none",
            changedFields: [],
            action: "skipped_unmatched",
            message:
              "Esemény kihagyva: több potenciális lead találat ugyanarra a Név+Forrás+VH slot kulcsra (biztonsági ütközés).",
          })
          continue
        }
        const likelyLeadShape = isLikelyAppManagedCalendarEvent(event)
        const stronglyAppManaged = isStronglyAppManagedCalendarEvent(event)
        const safeToDelete = shouldAutoDeleteOrphanCalendarEvent(event)
        if (eventId && likelyLeadShape && stronglyAppManaged && safeToDelete) {
          try {
            await deleteGoogleCalendarEvent(eventId)
            deletedOrphans += 1
            pushChange(changes, {
              leadId: eventId,
              leadName: parsed.contactName ?? "Ismeretlen",
              direction: "db_to_calendar",
              winner: "db",
              changedFields: ["calendar_event_deleted"],
              action: "updated",
              message: "Árva naptár esemény törölve (lead már nincs a honlapon).",
            })
          } catch (error) {
            conflicts += 1
            pullSkipped += 1
            errors.push({
              leadId: eventId,
              message: `Google árva törlés: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
            })
          }
        } else {
          pullSkipped += 1
          if (eventId && likelyLeadShape && stronglyAppManaged && !safeToDelete) {
            safetySkipped += 1
            pushChange(changes, {
              leadId: eventId,
              leadName: parsed.contactName ?? "Ismeretlen",
              direction: "none",
              winner: "none",
              changedFields: ["orphan_delete_guard"],
              action: "skipped_unmatched",
              message: "Árva esemény törlése kihagyva (nincs egyértelmű app-managed marker).",
            })
            continue
          }
          const name = asText(parsed.contactName)
          const day = asText(parsed.dayText)
          const time = asText(parsed.timeText)
          if (!eventId) {
            conflicts += 1
            pushChange(changes, {
              leadId: "unknown",
              leadName: parsed.contactName ?? "Ismeretlen",
              direction: "none",
              winner: "none",
              changedFields: [],
              action: "skipped_unmatched",
              message: "Google eseménynek nincs event ID-je, ezért kimaradt.",
            })
            continue
          }

          if (!name || !day || !time) {
            pushChange(changes, {
              leadId: eventId,
              leadName: name ?? "Ismeretlen",
              direction: "none",
              winner: "none",
              changedFields: [],
              action: "skipped_unmatched",
              message: "Új naptár esemény kihagyva: minimum mezők hiányoznak (Név + VH napja + VH ip.).",
            })
            continue
          }

          try {
            const createdLead = await createLeadFromGoogleCalendarEvent({
              eventId,
              fieldTimestamp: event.updated ?? event.created ?? null,
              contactName: name,
              source: parsed.source,
              reportText: parsed.reportText,
              contactEmail: parsed.contactEmail,
              contactPhone: parsed.contactPhone,
              ageText: parsed.ageText,
              callTime: parsed.callTime ?? parsed.callTimeFromStart,
              savingsAmountText: parsed.savingsAmountText,
              goalText: parsed.goalText,
              durationText: parsed.durationText,
              deadlineDate: parsed.deadlineDate,
              deadlineReason: parsed.deadlineReason,
              note: parsed.note,
              clientNumber: parsed.clientNumber,
              dayText: day,
              timeText: time,
            })
            createdFromCalendar += 1
            pullUpdated += 1
            byEventId.set(eventId, createdLead)
            const fallbackKey = buildFallbackMatchKey({
              contactName: createdLead.contact_name,
              source: createdLead.source,
              clientNumber: createdLead.client_number,
            })
            if (fallbackKey) byFallbackKey.set(fallbackKey, createdLead)
            const slotFallbackKey = buildSlotFallbackMatchKey({
              contactName: createdLead.contact_name,
              source: createdLead.source,
              dayText: createdLead.day_text,
              timeText: createdLead.time_text,
            })
            if (slotFallbackKey) {
              const current = bySlotFallbackKey.get(slotFallbackKey) ?? []
              current.push(createdLead)
              bySlotFallbackKey.set(slotFallbackKey, current)
            }
            createdLeadFingerprints[createdLead.id] = buildCalendarPushFingerprint(createdLead)
            const createdFields = [
              "contact_name",
              "day_text",
              "time_text",
              parsed.source ? "source" : null,
              parsed.reportText ? "report_text" : null,
              parsed.contactPhone ? "contact_phone" : null,
              parsed.contactEmail ? "contact_email" : null,
              parsed.goalText ? "goal_text" : null,
            ].filter((field): field is string => Boolean(field))
            pushChange(changes, {
              leadId: createdLead.id,
              leadName: createdLead.contact_name,
              direction: "calendar_to_db",
              winner: "calendar",
              changedFields: createdFields,
              action: "created",
              message: "Új lead létrehozva Google Naptár eseményből (nem volt meglévő, egyértelmű párosítás).",
            })
          } catch (error) {
            errors.push({
              leadId: eventId,
              message: `Google pull létrehozás: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
            })
          }
        }
        continue
      }

      const diffs = getLeadPullFieldDiffs(matchedLead, parsed)
      const changedFields = diffs.map((diff) => diff.field)
      const hasFieldChanges = diffs.length > 0
      const hasEventIdChanges = Boolean(parsed.eventId && parsed.eventId !== matchedLead.calendar_google_event_id)
      if (!hasFieldChanges && !hasEventIdChanges) {
        unchangedSkipped += 1
        continue
      }

      if (!hasFieldChanges && hasEventIdChanges) {
        try {
          await markLeadSyncMeta(matchedLead.id, {
            sheetRowId: matchedLead.sheet_row_id,
            googleEventId: parsed.eventId,
            icloudEventId: matchedLead.calendar_icloud_event_id,
          })
          pullUpdated += 1
          pushChange(changes, {
            leadId: matchedLead.id,
            leadName: matchedLead.contact_name,
            direction: "calendar_to_db",
            winner: "calendar",
            changedFields: ["calendar_google_event_id"],
            action: "updated",
            message: matchedBySlotFallback
              ? "Meglévő leadhez társítva Google esemény (slot fallback alapján)."
              : "Meglévő leadhez társítva Google esemény.",
          })
        } catch (error) {
          pullSkipped += 1
          errors.push({
            leadId: matchedLead.id,
            message: `Google pull: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
          })
        }
        continue
      }

      const eventUpdatedAt = toTimestamp(event.updated ?? event.created ?? null)
      const calendarWins: PullFieldDiff[] = []
      const dbWins: PullFieldDiff[] = []
      for (const diff of diffs) {
        const winner = pickFieldWinner({
          lead: matchedLead,
          field: diff.field,
          eventUpdatedAt,
        })
        if (winner === "calendar") calendarWins.push(diff)
        else dbWins.push(diff)
      }
      if (dbWins.length > 0) {
        forcedPushLeadIds.add(matchedLead.id)
        const fields = dbWins.map((item) => item.field)
        forcedPushFieldHints.set(matchedLead.id, fields)
        forcedPushFieldDiffs.set(
          matchedLead.id,
          dbWins.map((item) => ({
            field: item.field,
            winner: "db" as const,
            oldValue: item.calendarValue,
            newValue: item.dbValue,
          })),
        )
      }

      if (calendarWins.length === 0) {
        pushChange(changes, {
          leadId: matchedLead.id,
          leadName: matchedLead.contact_name,
          direction: "db_to_calendar",
          winner: "db",
          changedFields: dbWins.map((item) => item.field),
          fieldDiffs: dbWins.map((item) => ({
            field: item.field,
            winner: "db",
            oldValue: item.calendarValue,
            newValue: item.dbValue,
          })),
          action: "deferred",
          message: "Honlap frissebb mezők push ágon kerülnek naptárba.",
        })
        continue
      }

      const calendarPatch = {
        contactName: calendarWins.find((item) => item.field === "contact_name")?.calendarValue ?? undefined,
        source: calendarWins.find((item) => item.field === "source")?.calendarValue ?? undefined,
        reportText: calendarWins.find((item) => item.field === "report_text")?.calendarValue ?? undefined,
        contactEmail: calendarWins.find((item) => item.field === "contact_email")?.calendarValue ?? undefined,
        contactPhone: calendarWins.find((item) => item.field === "contact_phone")?.calendarValue ?? undefined,
        ageText: calendarWins.find((item) => item.field === "age_text")?.calendarValue ?? undefined,
        callTime: calendarWins.find((item) => item.field === "call_time")?.calendarValue ?? undefined,
        savingsAmountText: calendarWins.find((item) => item.field === "savings_amount_text")?.calendarValue ?? undefined,
        goalText: calendarWins.find((item) => item.field === "goal_text")?.calendarValue ?? undefined,
        durationText: calendarWins.find((item) => item.field === "duration_text")?.calendarValue ?? undefined,
        deadlineDate: calendarWins.find((item) => item.field === "deadline_date")?.calendarValue ?? undefined,
        deadlineReason: calendarWins.find((item) => item.field === "deadline_reason")?.calendarValue ?? undefined,
        note: calendarWins.find((item) => item.field === "note")?.calendarValue ?? undefined,
        clientNumber: calendarWins.find((item) => item.field === "client_number")?.calendarValue ?? undefined,
        dayText: calendarWins.find((item) => item.field === "day_text")?.calendarValue ?? undefined,
        timeText: calendarWins.find((item) => item.field === "time_text")?.calendarValue ?? undefined,
      }

      try {
        await updateLeadFromGoogleCalendarSync(matchedLead.id, {
          ...calendarPatch,
          changedFields: calendarWins.map((item) => item.field),
          fieldTimestamp: event.updated ?? event.created ?? null,
          currentFieldUpdatedAt: matchedLead.calendar_field_updated_at,
        })
        await markLeadSyncMeta(matchedLead.id, {
          sheetRowId: matchedLead.sheet_row_id,
          googleEventId: parsed.eventId ?? matchedLead.calendar_google_event_id,
          icloudEventId: matchedLead.calendar_icloud_event_id,
        })
        pullUpdated += 1
        pushChange(changes, {
          leadId: matchedLead.id,
          leadName: matchedLead.contact_name,
          direction: "calendar_to_db",
          winner: "calendar",
          changedFields: calendarWins.map((item) => item.field),
          fieldDiffs: calendarWins.map((item) => ({
            field: item.field,
            winner: "calendar",
            oldValue: item.dbValue,
            newValue: item.calendarValue,
          })),
          action: "updated",
          message:
            dbWins.length > 0
              ? "Google Naptár frissebb mezői átvezetve a honlapra, DB-frissebb mezők push ágra kerültek."
              : "Google Naptár változás átvezetve a honlapra.",
        })
      } catch (error) {
        pullSkipped += 1
        errors.push({
          leadId: matchedLead.id,
          message: `Google pull: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
        })
      }
    }

    if (validCheckpoint) {
      const seenEventIds = new Set(
        googleEvents.map((event) => event.id).filter((id): id is string => Boolean(id && id.trim())),
      )

      for (const event of orphanSweepEvents) {
        const eventId = String(event.id ?? "").trim()
        if (!eventId || seenEventIds.has(eventId)) continue
        if (!isLikelyAppManagedCalendarEvent(event)) continue
        if (!isStronglyAppManagedCalendarEvent(event)) continue
        if (!shouldAutoDeleteOrphanCalendarEvent(event)) continue

        const parsed = parseGoogleCalendarEventForLead(event)
        if (!parsed) continue

        let matchedLead: (typeof leads)[number] | undefined
        let slotFallbackConflict = false
        if (byEventId.has(eventId)) {
          matchedLead = byEventId.get(eventId)
        } else {
          const fallbackKey = buildFallbackMatchKey({
            contactName: parsed.contactName,
            source: parsed.source,
            clientNumber: parsed.clientNumber,
          })
          if (fallbackKey) {
            matchedLead = byFallbackKey.get(fallbackKey)
          }
          if (!matchedLead) {
            const slotFallbackKey = buildSlotFallbackMatchKey({
              contactName: parsed.contactName,
              source: parsed.source,
              dayText: parsed.dayText,
              timeText: parsed.timeText,
            })
            if (slotFallbackKey) {
              const candidates = bySlotFallbackKey.get(slotFallbackKey) ?? []
              if (candidates.length === 1) {
                matchedLead = candidates[0]
              } else if (candidates.length > 1) {
                slotFallbackConflict = true
              }
            }
          }
        }

        if (matchedLead) continue
        if (slotFallbackConflict) continue

        try {
          await deleteGoogleCalendarEvent(eventId)
          deletedOrphans += 1
          pushChange(changes, {
            leadId: eventId,
            leadName: parsed.contactName ?? "Ismeretlen",
            direction: "db_to_calendar",
            winner: "db",
            changedFields: ["calendar_event_deleted"],
            action: "updated",
            message: "Árva naptár esemény törölve (incremental sweep).",
          })
          seenEventIds.add(eventId)
        } catch (error) {
          errors.push({
            leadId: eventId,
            message: `Google árva sweep törlés: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
          })
        }
      }
    }

    let pushFingerprintByLeadId: Record<string, string> = {}
    const pushFingerprintRaw = await getSyncStateValue(GOOGLE_PUSH_HASH_STATE_KEY)
    if (pushFingerprintRaw) {
      try {
        const parsed = JSON.parse(pushFingerprintRaw) as unknown
        if (parsed && typeof parsed === "object") {
          pushFingerprintByLeadId = parsed as Record<string, string>
        }
      } catch {
        pushFingerprintByLeadId = {}
      }
    }
    if (Object.keys(createdLeadFingerprints).length > 0) {
      pushFingerprintByLeadId = {
        ...pushFingerprintByLeadId,
        ...createdLeadFingerprints,
      }
    }

    // Phase 2: DB cleanup for calendar-side deletions, then DB -> Google push
    const postPullLeads = await listLeads({ limit: 2000 })
    const activeCalendarEventIds = new Set(
      orphanSweepEvents.map((event) => String(event.id ?? "").trim()).filter((id) => id.length > 0),
    )
    const windowStartDate = fallbackTimeMin.slice(0, 10)
    const windowEndDate = fallbackTimeMax.slice(0, 10)

    const calendarDeletionCandidates: typeof postPullLeads = []
    const leadsAfterCalendarDeletionSweep: typeof postPullLeads = []
    for (const lead of postPullLeads) {
      const eventId = String(lead.calendar_google_event_id ?? "").trim()
      if (!eventId) {
        leadsAfterCalendarDeletionSweep.push(lead)
        continue
      }

      // Avoid accidental deletions outside the active sync window.
      const slotDate = parseDateKey(lead.day_text)
      if (!slotDate) {
        leadsAfterCalendarDeletionSweep.push(lead)
        continue
      }
      const leadDayKey = `${String(slotDate.year).padStart(4, "0")}-${String(slotDate.month).padStart(2, "0")}-${String(slotDate.day).padStart(2, "0")}`
      if (leadDayKey < windowStartDate || leadDayKey > windowEndDate) {
        leadsAfterCalendarDeletionSweep.push(lead)
        continue
      }

      if (activeCalendarEventIds.has(eventId)) {
        leadsAfterCalendarDeletionSweep.push(lead)
        continue
      }

      calendarDeletionCandidates.push(lead)
    }

    const skipCalendarDeletionSweep = shouldSkipMassDelete({
      candidateDeleteCount: calendarDeletionCandidates.length,
      totalManagedCount: postPullLeads.length,
      minCandidateCount: 15,
      maxDeleteRatio: 0.4,
    })

    if (skipCalendarDeletionSweep) {
      safetySkipped += calendarDeletionCandidates.length
      leadsAfterCalendarDeletionSweep.push(...calendarDeletionCandidates)
      pushChange(changes, {
        leadId: "bulk-delete-guard",
        leadName: "Biztonsági védelem",
        direction: "none",
        winner: "none",
        changedFields: ["calendar_delete_guard"],
        action: "skipped_unmatched",
        message: `Naptár törlés -> honlap törlés tömegesen kihagyva (${calendarDeletionCandidates.length} jelölt / ${postPullLeads.length} lead).`,
      })
    } else {
      for (const lead of calendarDeletionCandidates) {
        try {
          const deleted = await deleteLeadById(lead.id)
          if (deleted.count > 0) {
            deletedLeadsFromCalendar += deleted.count
            delete pushFingerprintByLeadId[lead.id]
            pushChange(changes, {
              leadId: lead.id,
              leadName: lead.contact_name,
              direction: "calendar_to_db",
              winner: "calendar",
              changedFields: ["lead_deleted_from_calendar"],
              action: "updated",
              message: "Naptárból törölt esemény miatt a lead törölve lett a honlapról.",
            })
            continue
          }
        } catch (error) {
          errors.push({
            leadId: lead.id,
            message: `Naptár törlés -> honlap törlés: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
          })
        }

        leadsAfterCalendarDeletionSweep.push(lead)
      }
    }

    const pushCandidates = leadsAfterCalendarDeletionSweep.filter((lead) => {
      if (forcedPushLeadIds.has(lead.id)) return true
      if (!lead.calendar_google_event_id) return true
      if (!lead.last_synced_at) return true

      // Keep backward-compatible fallback for obviously dirty rows.
      if (isLeadDirtyForCalendarPush(lead)) {
        const currentFingerprint = buildCalendarPushFingerprint(lead)
        return pushFingerprintByLeadId[lead.id] !== currentFingerprint
      }

      const currentFingerprint = buildCalendarPushFingerprint(lead)
      return pushFingerprintByLeadId[lead.id] !== currentFingerprint
    })
    pushCandidatesCount = pushCandidates.length

    for (const lead of pushCandidates) {
      if (!lead.day_text || !lead.time_text) {
        missingSlot += 1
        continue
      }

      const date = parseDateKey(lead.day_text)
      const time = parseTimeKey(lead.time_text)
      if (!date || !time) {
        invalidSlot += 1
        continue
      }
      pushAttempted += 1

      const startAt = toLocalDateTimeString(date.year, date.month, date.day, time.hour, time.minute)
      const endDate = new Date(startAt)
      endDate.setMinutes(endDate.getMinutes() + 30)
      const endAt = toLocalDateTimeString(
        endDate.getFullYear(),
        endDate.getMonth() + 1,
        endDate.getDate(),
        endDate.getHours(),
        endDate.getMinutes(),
      )

      const sourceText = String(lead.source ?? "").trim()
      const reportLabel = mapReportToCalendarLabel(lead.report_text)
      const titleParts = [lead.contact_name, sourceText, reportLabel].map((part) => String(part ?? "").trim()).filter(Boolean)
      const title = titleParts.length > 0 ? titleParts.join("/") : lead.contact_name
      const legacyTitle = sourceText ? `${lead.contact_name}/${sourceText}` : lead.contact_name
      const description = buildCalendarDescription(lead)

      let googleEventId: string | null = lead.calendar_google_event_id
      const previousGoogleEventId = lead.calendar_google_event_id
      const currentFingerprint = buildCalendarPushFingerprint(lead)

      try {
        const dedupeTitles = Array.from(new Set([title, legacyTitle, `Lead: ${lead.contact_name}`]))
        googleEventId = await upsertGoogleCalendarEvent({
          eventId: lead.calendar_google_event_id,
          title,
          description,
          startAt,
          endAt,
          dedupeTitles,
        })
        if (googleEventId) {
          deletedDuplicates += await cleanupGoogleCalendarDuplicates({
            keepEventId: googleEventId,
            startAt,
            endAt,
            dedupeTitles,
          })
        }
        await markLeadSyncMeta(lead.id, {
          sheetRowId: lead.sheet_row_id,
          googleEventId,
          icloudEventId: lead.calendar_icloud_event_id,
        })
        const forcedFields = forcedPushFieldHints.get(lead.id) ?? []
        const fieldsToStamp = forcedFields.length > 0 ? forcedFields : [...CALENDAR_SYNC_DB_FIELDS]
        await markLeadCalendarFieldTimestamps(lead.id, fieldsToStamp, {
          timestamp: new Date().toISOString(),
          currentFieldUpdatedAt: lead.calendar_field_updated_at,
        })
        pushFingerprintByLeadId[lead.id] = currentFingerprint
        pushSynced += 1
        if (forcedFields.length > 0) {
          pushChange(changes, {
            leadId: lead.id,
            leadName: lead.contact_name,
            direction: "db_to_calendar",
            winner: "db",
            changedFields: forcedFields,
            fieldDiffs: forcedPushFieldDiffs.get(lead.id),
            action: "updated",
            message: "Honlap változás átvezetve a Google Naptárba.",
          })
        } else if (!previousGoogleEventId && googleEventId) {
          pushChange(changes, {
            leadId: lead.id,
            leadName: lead.contact_name,
            direction: "db_to_calendar",
            winner: "db",
            changedFields: ["calendar_google_event_id"],
            action: "updated",
            message: "Új lead feltöltve a Google Naptárba.",
          })
        } else {
          pushChange(changes, {
            leadId: lead.id,
            leadName: lead.contact_name,
            direction: "db_to_calendar",
            winner: "db",
            changedFields: ["calendar_payload"],
            action: "updated",
            message: "Változott lead adatok frissítve a Google Naptárban.",
          })
        }
      } catch (error) {
        errors.push({
          leadId: lead.id,
          message: `Google: ${error instanceof Error ? error.message : "Ismeretlen hiba"}`,
        })
      }
    }

    await setSyncStateValue(GOOGLE_PULL_CHECKPOINT_KEY, pullStartedAt)
    await setSyncStateValue(GOOGLE_PUSH_HASH_STATE_KEY, JSON.stringify(pushFingerprintByLeadId))

    return NextResponse.json({
      ok: true,
      mode: "google-only",
      processed: leads.length,
      pushCandidates: pushCandidatesCount,
      pushAttempted,
      missingSlot,
      invalidSlot,
      pushSynced,
      deletedDuplicates,
      pullMode,
      pullCandidates,
      pullProcessed,
      pullUpdated,
      pullSkipped,
      conflicts,
      unchangedSkipped,
      deletedOrphans,
      deletedLeadsFromCalendar,
      createdFromCalendar,
      safetySkipped,
      changes,
      errors,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen naptár sync hiba." },
      { status: 500 },
    )
  }
}
