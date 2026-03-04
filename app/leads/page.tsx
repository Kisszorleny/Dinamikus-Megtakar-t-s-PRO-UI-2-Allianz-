"use client"

import { Fragment, type FormEvent, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { normalizeReportOption, REPORT_OPTIONS, UNKNOWN_REPORT_LABEL } from "@/lib/leads/constants"

type Lead = {
  id: string
  updated_at: string
  source: string
  source_type: string
  request_type?: "A" | "B" | "C"
  sheet_row_id: string | null
  contact_name: string
  contact_email: string
  contact_phone: string
  birth_date: string | null
  age_text: string | null
  call_time: string | null
  subject: string | null
  cost_flag: boolean | null
  tax20_flag: boolean | null
  net_flag: boolean | null
  day_text: string | null
  time_text: string | null
  report_text: string | null
  revisit_text: string | null
  followup_note: string | null
  help_needed: string | null
  leads_per_day: number | null
  lead_type_text: string | null
  client_number: string | null
  savings_amount_text: string | null
  goal_text: string | null
  duration_text: string | null
  deadline_reason: string | null
  owner: string | null
  deadline_date: string | null
  paid_flag: boolean | null
  note: string | null
  form_payload?: {
    reportNote1?: string | null
    reportNote2?: string | null
    reviewed?: string | null
  } | null
}

type LeadEditDraft = {
  source: string
  requestType: "A" | "B" | "C"
  contactName: string
  contactEmail: string
  contactPhone: string
  birthDate: string
  ageText: string
  callTime: string
  note: string
  subject: string
  costFlag: boolean
  tax20Flag: boolean
  netFlag: boolean
  savingsAmountText: string
  goalText: string
  durationText: string
  deadlineDate: string
  deadlineReason: string
  owner: string
  paidFlag: boolean
  leadTypeText: string
  clientNumber: string
  helpNeeded: string
  leadsPerDay: string
  dayText: string
  timeText: string
  followupNote: string
  reportText: string
  revisitText: string
  reportNote1: string
  reportNote2: string
  reviewed: string
}

type InlineEditableField =
  | "reportNote1"
  | "reportNote2"
  | "reviewed"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "ageText"
  | "birthDate"
  | "dayText"
  | "timeText"
  | "callTime"
  | "note"
  | "savingsAmountText"
  | "goalText"
  | "durationText"
  | "deadlineDate"
  | "deadlineReason"
  | "owner"
  | "source"
  | "clientNumber"
  | "helpNeeded"

function normalizeInlineComparable(value: string): string {
  return value.trim()
}

type Stats = {
  total: number
  leadsToday: number
  leadsMonth: number
  paidCount: number
  bySource: Record<string, number>
  byOwner: Record<string, number>
  reportTotals?: Record<string, number>
  reportMonthly?: Record<string, number>
  breakdown?: {
    total: { form: number; excel: number }
    callToday: { form: number; excel: number }
    monthByCallTime: { form: number; excel: number }
    paidCount: { form: number; excel: number }
  }
}

type CalendarSyncChange = {
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

const calendarFieldLabelMap: Record<string, string> = {
  lead_created_from_calendar: "új lead naptárból",
  calendar_google_event_id: "naptár esemény azonosító",
  calendar_payload: "naptár szöveg/idő mezők",
  contact_name: "név",
  source: "forrás",
  contact_email: "e-mail",
  contact_phone: "telefonszám",
  age_text: "életkor",
  call_time: "hívás időpontja",
  savings_amount_text: "összeg",
  goal_text: "cél",
  duration_text: "időtáv",
  deadline_date: "határidő",
  deadline_reason: "határidő oka",
  note: "megjegyzés",
  client_number: "ÜA",
  day_text: "VH napja",
  time_text: "VH ideje",
  orphan_delete_guard: "árva törlés védőkorlát",
  calendar_delete_guard: "naptár törlés védőkorlát",
}

type SortDirection = "asc" | "desc" | null
type SortKind = "text" | "number" | "date" | "boolean"

type ImportedSortKey =
  | "sheetRowId"
  | "reportNote1"
  | "reportNote2"
  | "reportText"
  | "reviewed"
  | "dayText"
  | "timeText"
  | "contactName"
  | "contactPhone"
  | "ageText"
  | "birthDate"
  | "contactEmail"
  | "callTime"
  | "note"
  | "savingsAmount"
  | "goal"
  | "duration"
  | "deadlineDate"
  | "deadlineReason"
  | "owner"
  | "source"
  | "clientNumber"
  | "followupNote"
  | "helpNeeded"
  | "sourceType"
  | "paidFlag"

type FormSortKey =
  | "rowNumber"
  | "contactName"
  | "contactEmail"
  | "contactPhone"
  | "sourceType"
  | "owner"
  | "deadlineDate"
  | "paidFlag"

type SortState<K extends string> = {
  key: K | null
  direction: SortDirection
}

const reportColorClassMap: Record<(typeof REPORT_OPTIONS)[number], string> = {
  "Elértem kötés": "bg-lime-400 text-emerald-900",
  "Adatbekérő kiment": "bg-lime-200 text-emerald-900",
  "Elértem elutasít": "bg-red-200 text-red-700",
  "Elértem új ip.": "bg-amber-200 text-amber-900",
  "Nem értem el új ip-ra": "bg-yellow-400 text-black",
  "Nem értem el": "bg-zinc-200 text-zinc-700",
  "Többször nvf, hagyom..": "bg-rose-300 text-indigo-700",
  "Később térjünk rá vissza": "bg-violet-200 text-violet-800",
  "Később megkeresni szerintem.": "bg-purple-300 text-purple-900",
  "Keres ha érdekes": "bg-purple-300 text-black",
  "Keres ha érdekes/nem keresett": "bg-rose-200 text-black",
}

const reportRowColorClassMap: Record<(typeof REPORT_OPTIONS)[number], string> = {
  "Elértem kötés": "bg-lime-100/70",
  "Adatbekérő kiment": "bg-lime-50/80",
  "Elértem elutasít": "bg-red-50/80",
  "Elértem új ip.": "bg-amber-50/80",
  "Nem értem el új ip-ra": "bg-yellow-50/80",
  "Nem értem el": "bg-zinc-100/80",
  "Többször nvf, hagyom..": "bg-rose-100/70",
  "Később térjünk rá vissza": "bg-violet-100/70",
  "Később megkeresni szerintem.": "bg-purple-100/70",
  "Keres ha érdekes": "bg-purple-100/70",
  "Keres ha érdekes/nem keresett": "bg-rose-50/80",
}

const reportStickySolidColorClassMap: Record<(typeof REPORT_OPTIONS)[number], string> = {
  "Elértem kötés": "bg-lime-100",
  "Adatbekérő kiment": "bg-lime-50",
  "Elértem elutasít": "bg-red-50",
  "Elértem új ip.": "bg-amber-50",
  "Nem értem el új ip-ra": "bg-yellow-50",
  "Nem értem el": "bg-zinc-100",
  "Többször nvf, hagyom..": "bg-rose-100",
  "Később térjünk rá vissza": "bg-violet-100",
  "Később megkeresni szerintem.": "bg-purple-100",
  "Keres ha érdekes": "bg-purple-100",
  "Keres ha érdekes/nem keresett": "bg-rose-50",
}

type SortConfig<T, K extends string> = Record<
  K,
  {
    kind: SortKind
    getValue: (row: T) => unknown
  }
>

type IndexedLead = {
  lead: Lead
  rowNumber: number
}

const importedSortConfig: SortConfig<Lead, ImportedSortKey> = {
  sheetRowId: { kind: "number", getValue: (lead) => lead.sheet_row_id },
  reportNote1: { kind: "text", getValue: (lead) => lead.form_payload?.reportNote1 },
  reportNote2: { kind: "text", getValue: (lead) => lead.form_payload?.reportNote2 },
  reportText: { kind: "text", getValue: (lead) => lead.report_text },
  reviewed: { kind: "text", getValue: (lead) => lead.form_payload?.reviewed },
  dayText: { kind: "date", getValue: (lead) => lead.day_text },
  timeText: { kind: "text", getValue: (lead) => lead.time_text },
  contactName: { kind: "text", getValue: (lead) => lead.contact_name },
  contactPhone: { kind: "text", getValue: (lead) => lead.contact_phone },
  ageText: { kind: "number", getValue: (lead) => lead.age_text },
  birthDate: { kind: "date", getValue: (lead) => lead.birth_date },
  contactEmail: { kind: "text", getValue: (lead) => lead.contact_email },
  callTime: { kind: "text", getValue: (lead) => lead.call_time },
  note: { kind: "text", getValue: (lead) => lead.note },
  savingsAmount: { kind: "number", getValue: (lead) => lead.savings_amount_text },
  goal: { kind: "text", getValue: (lead) => lead.goal_text },
  duration: { kind: "text", getValue: (lead) => lead.duration_text },
  deadlineDate: { kind: "date", getValue: (lead) => lead.deadline_date },
  deadlineReason: { kind: "text", getValue: (lead) => lead.deadline_reason },
  owner: { kind: "text", getValue: (lead) => lead.owner },
  source: { kind: "text", getValue: (lead) => lead.source },
  clientNumber: { kind: "text", getValue: (lead) => lead.client_number },
  followupNote: { kind: "text", getValue: (lead) => lead.followup_note },
  helpNeeded: { kind: "text", getValue: (lead) => lead.help_needed },
  sourceType: { kind: "text", getValue: (lead) => lead.source_type },
  paidFlag: { kind: "boolean", getValue: (lead) => lead.paid_flag },
}

const formSortConfig: SortConfig<IndexedLead, FormSortKey> = {
  rowNumber: { kind: "number", getValue: (row) => row.rowNumber },
  contactName: { kind: "text", getValue: (row) => row.lead.contact_name },
  contactEmail: { kind: "text", getValue: (row) => row.lead.contact_email },
  contactPhone: { kind: "text", getValue: (row) => row.lead.contact_phone },
  sourceType: { kind: "text", getValue: (row) => row.lead.source_type },
  owner: { kind: "text", getValue: (row) => row.lead.owner },
  deadlineDate: { kind: "date", getValue: (row) => row.lead.deadline_date },
  paidFlag: { kind: "boolean", getValue: (row) => row.lead.paid_flag },
}

async function readApiResponse(res: Response) {
  const rawText = await res.text()
  if (!rawText) {
    return { ok: false as const, message: `Üres szerver válasz (HTTP ${res.status}).` }
  }

  try {
    const json = JSON.parse(rawText) as { ok?: boolean; message?: string; [key: string]: unknown }
    return { ok: true as const, json }
  } catch {
    const trimmed = rawText.replace(/\s+/g, " ").trim()
    return {
      ok: false as const,
      message: `A szerver nem JSON választ adott (HTTP ${res.status}). ${trimmed.slice(0, 220)}`,
    }
  }
}

function toComparableText(value: unknown) {
  if (value === null || value === undefined) return ""
  const text = String(value).trim()
  return text === "-" ? "" : text
}

function parseComparableDate(value: unknown) {
  const text = toComparableText(value)
  if (!text) return Number.NaN
  const normalized = text.replace(/\./g, "-").replace(/\s+/g, "")
  const parsed = Date.parse(normalized)
  return Number.isNaN(parsed) ? Number.NaN : parsed
}

function parseComparableNumber(value: unknown) {
  const text = toComparableText(value)
  if (!text) return Number.NaN
  const normalized = text.replace(/\s/g, "").replace(",", ".")
  const parsed = Number(normalized.replace(/[^\d.+-]/g, ""))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function compareValues(a: unknown, b: unknown, kind: SortKind) {
  const aText = toComparableText(a)
  const bText = toComparableText(b)
  const aEmpty = aText.length === 0
  const bEmpty = bText.length === 0

  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  if (kind === "boolean") {
    const aBool = Boolean(a)
    const bBool = Boolean(b)
    if (aBool === bBool) return 0
    return aBool ? 1 : -1
  }

  if (kind === "number") {
    const aNum = parseComparableNumber(a)
    const bNum = parseComparableNumber(b)
    const aInvalid = Number.isNaN(aNum)
    const bInvalid = Number.isNaN(bNum)
    if (!aInvalid && !bInvalid) return aNum - bNum
    if (aInvalid && bInvalid) return aText.localeCompare(bText, "hu", { sensitivity: "base", numeric: true })
    return aInvalid ? 1 : -1
  }

  if (kind === "date") {
    const aDate = parseComparableDate(a)
    const bDate = parseComparableDate(b)
    const aInvalid = Number.isNaN(aDate)
    const bInvalid = Number.isNaN(bDate)
    if (!aInvalid && !bInvalid) return aDate - bDate
    if (aInvalid && bInvalid) return aText.localeCompare(bText, "hu", { sensitivity: "base", numeric: true })
    return aInvalid ? 1 : -1
  }

  return aText.localeCompare(bText, "hu", { sensitivity: "base", numeric: true })
}

function parseDateParts(value: unknown): { year: number; month: number; day: number } | null {
  const text = toComparableText(value)
  if (!text) return null

  const cleaned = text.replace(/\s+/g, " ").trim()

  const ymd = cleaned.match(/(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?/)
  if (ymd) {
    return {
      year: Number(ymd[1]),
      month: Number(ymd[2]),
      day: Number(ymd[3]),
    }
  }

  const ymdShortYear = cleaned.match(/(\d{2})[.\-/](\d{1,2})[.\-/](\d{1,2})\.?/)
  if (ymdShortYear) {
    return {
      year: 2000 + Number(ymdShortYear[1]),
      month: Number(ymdShortYear[2]),
      day: Number(ymdShortYear[3]),
    }
  }

  const dmy = cleaned.match(/(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{4})\.?/)
  if (dmy) {
    return {
      year: Number(dmy[3]),
      month: Number(dmy[2]),
      day: Number(dmy[1]),
    }
  }

  const parsed = new Date(cleaned)
  if (!Number.isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    }
  }

  return null
}

function toDisplayDate(value: unknown): string | null {
  const parts = parseDateParts(value)
  if (!parts) return null
  return `${String(parts.year).padStart(4, "0")}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`
}

function formatDateForCell(value: unknown): string {
  const parts = parseDateParts(value)
  if (!parts) return String(value ?? "-")
  const formatted = `${String(parts.year).padStart(4, "0")}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`
  return formatted
}

function formatDeadlineForCell(value: unknown): string {
  const parts = parseDateParts(value)
  if (!parts) return String(value ?? "-")
  const formattedDate = `${String(parts.year).padStart(4, "0")}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`
  const weekdayNames = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"]
  const weekday = weekdayNames[new Date(parts.year, parts.month - 1, parts.day).getDay()]
  return `${formattedDate} ${weekday}`
}

function formatDateTimeForCell(value: unknown): string {
  const text = toComparableText(value)
  if (!text) return String(value ?? "-")

  const parts = parseDateParts(text)
  if (!parts) return String(value ?? "-")

  const datePart = `${String(parts.year).padStart(4, "0")}.${String(parts.month).padStart(2, "0")}.${String(parts.day).padStart(2, "0")}`
  const timeMatch = text.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return datePart

  const hour = timeMatch[1].padStart(2, "0")
  const minute = timeMatch[2]
  return `${datePart} ${hour}:${minute}`
}

function formatPhoneForCell(value: unknown): string {
  const text = toComparableText(value)
  if (!text) return String(value ?? "-")

  const raw = text.replace(/[^\d+]/g, "")
  if (!raw) return String(value ?? "-")

  let normalized = raw
  if (normalized.startsWith("00")) normalized = `+${normalized.slice(2)}`
  if (!normalized.startsWith("+") && normalized.startsWith("6") && normalized.length === 10) {
    normalized = `+3${normalized}`
  }
  if (!normalized.startsWith("+")) normalized = `+${normalized}`

  if (normalized.startsWith("+62")) {
    normalized = `+36${normalized.slice(2)}`
  } else if (normalized.startsWith("+66")) {
    normalized = `+36${normalized.slice(3)}`
  }

  if (normalized.startsWith("+06")) {
    normalized = `+36${normalized.slice(3)}`
  }

  const digits = normalized.replace(/[^\d]/g, "")
  if (!digits.startsWith("36")) return String(value ?? "-")
  if (digits.length < 11 || digits.length > 12) return String(value ?? "-")
  return `+${digits}`
}

function formatAgeForCell(value: unknown): string {
  const text = toComparableText(value)
  if (!text) return String(value ?? "-")

  const normalized = text.replace(/\s/g, "").replace(",", ".")
  const numeric = Number(normalized.replace(/[^\d.+-]/g, ""))
  if (!Number.isFinite(numeric)) return String(value ?? "-")

  // Age should be displayed as completed years.
  const floored = Math.floor(numeric)
  return String(floored)
}

function formatEmailForCell(value: unknown): string {
  const text = toComparableText(value)
  if (!text) return "-"
  if (/^unknown-\d+@example\.com$/i.test(text)) return "-"
  return text
}

function sortRows<T, K extends string>(rows: T[], sortState: SortState<K>, config: SortConfig<T, K>) {
  if (!sortState.key || !sortState.direction) return rows
  const { key, direction } = sortState
  const { kind, getValue } = config[key]

  return [...rows].sort((left, right) => {
    const compared = compareValues(getValue(left), getValue(right), kind)
    return direction === "asc" ? compared : -compared
  })
}

function CellText({ value, widthClass = "w-28" }: { value: unknown; widthClass?: string }) {
  const text = value === null || value === undefined || value === "" ? "-" : String(value)
  const content = <span className={`block truncate ${widthClass}`}>{text}</span>
  if (text.length <= 18) return content

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent sideOffset={6} className="max-w-sm break-words">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}

function SortHeadButton({
  label,
  direction,
  onClick,
}: {
  label: string
  direction: SortDirection
  onClick: () => void
}) {
  const marker = direction === "asc" ? "↑" : direction === "desc" ? "↓" : "·"

  return (
    <button type="button" onClick={onClick} className="inline-flex w-full items-center gap-1 text-left">
      <span className="truncate">{label}</span>
      <span className="text-muted-foreground text-xs">{marker}</span>
    </button>
  )
}

function getReportRowClass(reportText: string | null | undefined) {
  const normalized = normalizeReportOption(reportText)
  if (!normalized) return ""
  return reportRowColorClassMap[normalized] ?? ""
}

function getReportStickyCellClass(reportText: string | null | undefined) {
  const normalized = normalizeReportOption(reportText)
  if (!normalized) return "bg-background"
  return reportStickySolidColorClassMap[normalized] ?? "bg-background"
}

function toInputDate(value: string | null | undefined): string {
  if (!value) return ""
  const parts = parseDateParts(value)
  if (!parts) return ""
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
}

function buildEditDraft(lead: Lead): LeadEditDraft {
  return {
    source: lead.source ?? "",
    requestType: lead.request_type ?? "A",
    contactName: lead.contact_name ?? "",
    contactEmail: lead.contact_email ?? "",
    contactPhone: lead.contact_phone ?? "",
    birthDate: toInputDate(lead.birth_date),
    ageText: lead.age_text ?? "",
    callTime: lead.call_time ?? "",
    note: lead.note ?? "",
    subject: lead.subject ?? "",
    costFlag: Boolean(lead.cost_flag),
    tax20Flag: Boolean(lead.tax20_flag),
    netFlag: Boolean(lead.net_flag),
    savingsAmountText: lead.savings_amount_text ?? "",
    goalText: lead.goal_text ?? "",
    durationText: lead.duration_text ?? "",
    deadlineDate: toInputDate(lead.deadline_date),
    deadlineReason: lead.deadline_reason ?? "",
    owner: lead.owner ?? "",
    paidFlag: Boolean(lead.paid_flag),
    leadTypeText: lead.lead_type_text ?? "",
    clientNumber: lead.client_number ?? "",
    helpNeeded: lead.help_needed ?? "",
    leadsPerDay: lead.leads_per_day === null || lead.leads_per_day === undefined ? "" : String(lead.leads_per_day),
    dayText: toInputDate(lead.day_text),
    timeText: lead.time_text ?? "",
    followupNote: lead.followup_note ?? "",
    reportText: lead.report_text ?? "",
    revisitText: lead.revisit_text ?? "",
    reportNote1: String(lead.form_payload?.reportNote1 ?? ""),
    reportNote2: String(lead.form_payload?.reportNote2 ?? ""),
    reviewed: String(lead.form_payload?.reviewed ?? ""),
  }
}

function textOrNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [calendarSyncChanges, setCalendarSyncChanges] = useState<CalendarSyncChange[]>([])
  const [calendarAutoSyncEnabled, setCalendarAutoSyncEnabled] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importedSort, setImportedSort] = useState<SortState<ImportedSortKey>>({
    key: null,
    direction: null,
  })
  const [birthDateColumnOpen, setBirthDateColumnOpen] = useState(false)
  const [formSort, setFormSort] = useState<SortState<FormSortKey>>({
    key: null,
    direction: null,
  })
  const [editingLeadId, setEditingLeadId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<LeadEditDraft | null>(null)
  const [inlineEditing, setInlineEditing] = useState<{ leadId: string; field: InlineEditableField } | null>(null)
  const [inlineValue, setInlineValue] = useState("")
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [leadAccessChecked, setLeadAccessChecked] = useState(false)
  const [leadAccessGranted, setLeadAccessGranted] = useState(false)
  const [leadAccessCode, setLeadAccessCode] = useState("")
  const [leadAccessUnlocking, setLeadAccessUnlocking] = useState(false)
  const [leadAccessError, setLeadAccessError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const qRaw = search.trim().toLowerCase()
    if (!qRaw) return leads

    const normalizeForSearch = (value: unknown) =>
      String(value ?? "")
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/[.\-/]/g, "")

    const qNormalized = normalizeForSearch(qRaw)
    const qDate = toDisplayDate(qRaw)
    const qDateNormalized = qDate ? normalizeForSearch(qDate) : null

    return leads.filter((lead) => {
      const fields = [
        lead.contact_name,
        lead.contact_email,
        lead.contact_phone,
        lead.report_text,
        lead.note,
        lead.day_text,
        lead.time_text,
        lead.call_time,
        lead.birth_date,
        lead.deadline_date,
        lead.followup_note,
        lead.owner,
      ]

      return fields.some((field) => {
        const raw = String(field ?? "").toLowerCase()
        if (raw.includes(qRaw)) return true
        const rawNormalized = normalizeForSearch(raw)
        if (rawNormalized.includes(qNormalized)) return true

        const asDate = toDisplayDate(raw)
        if (!asDate) return false
        const asDateNormalized = normalizeForSearch(asDate)
        if (asDateNormalized.includes(qNormalized)) return true
        if (qDateNormalized && asDateNormalized.includes(qDateNormalized)) return true
        return false
      })
    })
  }, [leads, search])

  const importedLeads = useMemo(
    () =>
      filtered.filter(
        (lead) => lead.source_type === "manual_import" || lead.source_type === "sheets" || lead.source_type === "app_edit",
      ),
    [filtered],
  )
  const formLeads = useMemo(
    () => filtered.filter((lead) => lead.source_type === "landing_form"),
    [filtered],
  )
  const formIndexedLeads = useMemo(
    () => formLeads.map((lead, index) => ({ lead, rowNumber: index + 1 })),
    [formLeads],
  )
  const sortedImportedLeads = useMemo(
    () => sortRows(importedLeads, importedSort, importedSortConfig),
    [importedLeads, importedSort],
  )
  const sortedFormLeads = useMemo(
    () => sortRows(formIndexedLeads, formSort, formSortConfig),
    [formIndexedLeads, formSort],
  )
  const selectableLeadIds = useMemo(
    () => [...sortedImportedLeads.map((lead) => lead.id), ...sortedFormLeads.map(({ lead }) => lead.id)],
    [sortedImportedLeads, sortedFormLeads],
  )

  function toggleImportedSort(key: ImportedSortKey) {
    setImportedSort((prev) => {
      if (prev.key !== key || prev.direction === null) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      return { key: null, direction: null }
    })
  }

  function toggleFormSort(key: FormSortKey) {
    setFormSort((prev) => {
      if (prev.key !== key || prev.direction === null) return { key, direction: "asc" }
      if (prev.direction === "asc") return { key, direction: "desc" }
      return { key: null, direction: null }
    })
  }

  async function loadData() {
    setLoading(true)
    try {
      const [adminRes, statsRes, autoRes] = await Promise.all([
        fetch("/api/leads/admin?limit=5000"),
        fetch("/api/leads/stats"),
        fetch("/api/leads/sync/calendar/auto"),
      ])
      const adminParsed = await readApiResponse(adminRes)
      if (!adminParsed.ok) throw new Error(adminParsed.message)
      const statsParsed = await readApiResponse(statsRes)
      if (!statsParsed.ok) throw new Error(statsParsed.message)
      const autoParsed = await readApiResponse(autoRes)
      if (!autoParsed.ok) throw new Error(autoParsed.message)

      const adminJson = adminParsed.json
      const statsJson = statsParsed.json
      const autoJson = autoParsed.json
      if (!adminRes.ok || !adminJson?.ok) {
        throw new Error(adminJson?.message ?? "Nem sikerült lekérni a leadeket.")
      }
      if (!statsRes.ok || !statsJson?.ok) {
        throw new Error(statsJson?.message ?? "Nem sikerült lekérni a statisztikát.")
      }
      if (!autoRes.ok || !autoJson?.ok) {
        throw new Error(autoJson?.message ?? "Nem sikerült lekérni az auto sync állapotot.")
      }
      setLeads(Array.isArray(adminJson.leads) ? (adminJson.leads as Lead[]) : [])
      setStats((statsJson.stats as Stats | null) ?? null)
      setCalendarAutoSyncEnabled(Boolean(autoJson.enabled))
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ismeretlen hiba."
      if (message.toLowerCase().includes("jogosults")) {
        const unlocked = await checkLeadAccess()
        if (unlocked) {
          setLeadAccessError("A lead kod rendben van, de ehhez a felhasznalohoz nincs admin jogosultsag.")
        } else {
          setLeadAccessError("A lead oldal feloldasa lejart, add meg ujra a lead kodot.")
        }
      }
      setStatus(message)
    } finally {
      setLoading(false)
    }
  }

  async function checkLeadAccess(): Promise<boolean> {
    try {
      const res = await fetch("/api/auth/lead-access", { cache: "no-store" })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Nem sikerült lekérni a lead hozzáférést.")
      }
      const unlocked = Boolean(json.unlocked)
      setLeadAccessGranted(unlocked)
      setLeadAccessError(null)
      return unlocked
    } catch (error) {
      setLeadAccessGranted(false)
      setLeadAccessError(error instanceof Error ? error.message : "Ismeretlen hiba.")
      return false
    } finally {
      setLeadAccessChecked(true)
    }
  }

  async function unlockLeadAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const code = leadAccessCode.trim()
    if (!code) {
      setLeadAccessError("Add meg a lead oldali kodot.")
      return
    }

    setLeadAccessUnlocking(true)
    setLeadAccessError(null)
    try {
      const res = await fetch("/api/auth/lead-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Hibas lead kod.")
      }
      setLeadAccessCode("")
      const unlocked = await checkLeadAccess()
      if (!unlocked) {
        throw new Error("A lead feloldas nem mentodott el. Probald ujra.")
      }
    } catch (error) {
      setLeadAccessError(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLeadAccessUnlocking(false)
    }
  }

  useEffect(() => {
    void checkLeadAccess()
  }, [])

  useEffect(() => {
    if (!leadAccessGranted) return
    void loadData()
  }, [leadAccessGranted])

  useEffect(() => {
    function isTypingTarget(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) return false
      const tag = target.tagName.toLowerCase()
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable ||
        Boolean(target.closest("[contenteditable='true']"))
      )
    }

    function onKeyDown(event: KeyboardEvent) {
      if (!selectedLeadId || loading) return
      if (isTypingTarget(event.target)) return
      const selectedIndex = selectableLeadIds.indexOf(selectedLeadId)

      if (event.key === "ArrowDown") {
        event.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < selectableLeadIds.length - 1) {
          setSelectedLeadId(selectableLeadIds[selectedIndex + 1])
        }
        return
      }

      if (event.key === "ArrowUp") {
        event.preventDefault()
        if (selectedIndex > 0) {
          setSelectedLeadId(selectableLeadIds[selectedIndex - 1])
        }
        return
      }

      if (event.key === "Home") {
        event.preventDefault()
        if (selectableLeadIds.length > 0) setSelectedLeadId(selectableLeadIds[0])
        return
      }

      if (event.key === "End") {
        event.preventDefault()
        if (selectableLeadIds.length > 0) setSelectedLeadId(selectableLeadIds[selectableLeadIds.length - 1])
        return
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        const selectedLead = leads.find((item) => item.id === selectedLeadId)
        if (!selectedLead) return
        event.preventDefault()
        void deleteLead(selectedLead.id, selectedLead.contact_name)
      }
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [selectedLeadId, loading, leads, selectableLeadIds])

  useEffect(() => {
    if (!selectedLeadId) return
    if (!selectableLeadIds.includes(selectedLeadId)) {
      setSelectedLeadId(null)
    }
  }, [selectedLeadId, selectableLeadIds])

  async function runImport(previewOnly: boolean) {
    if (!importFile) {
      setStatus("Válassz ki egy CSV/XLSX fájlt.")
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const formData = new FormData()
      formData.set("file", importFile)
      formData.set("previewOnly", previewOnly ? "true" : "false")
      const res = await fetch("/api/leads/manual-import", {
        method: "POST",
        body: formData,
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) {
        throw new Error(json?.message ?? "Import hiba.")
      }
      if (previewOnly) {
        setStatus(`Preview kész: ${json.totalRows} sor.`)
      } else {
        setStatus(`Import kész: ${json.imported} lead.`)
        await loadData()
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ismeretlen hiba."
      if (message.toLowerCase().includes("jogosults")) {
        const unlocked = await checkLeadAccess()
        if (unlocked) {
          setLeadAccessError("A lead kod rendben van, de ehhez a felhasznalohoz nincs admin jogosultsag.")
        } else {
          setLeadAccessError("A lead oldal feloldasa lejart, add meg ujra a lead kodot.")
        }
      }
      setStatus(message)
    } finally {
      setLoading(false)
    }
  }

  async function runSheetsSync(mode: "pull" | "push" | "both") {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/leads/sync/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Sheets sync hiba.")
      const created = typeof json.created === "number" ? json.created : 0
      const updated = typeof json.updated === "number" ? json.updated : 0
      const unchanged = typeof json.unchanged === "number" ? json.unchanged : 0
      const deleted = typeof json.deleted === "number" ? json.deleted : 0
      const deleteSafetySkipped = Boolean(json.deleteSafetySkipped)
      const deleteCandidateCount = typeof json.deleteCandidateCount === "number" ? json.deleteCandidateCount : 0
      const deleteTotalManaged = typeof json.deleteTotalManaged === "number" ? json.deleteTotalManaged : 0
      const pushSkipped = Boolean(json.pushSkipped)
      const pushNote = pushSkipped ? " | push: kihagyva (Apps Script kompatibilitás)" : ""
      const safetyNote = deleteSafetySkipped
        ? ` | törlés biztonsági okból kihagyva (${deleteCandidateCount}/${deleteTotalManaged})`
        : ""
      if (mode === "pull") {
        setStatus(
          `Sheets sync kész (${mode}) - új: ${created}, frissített: ${updated}, változatlan: ${unchanged}, törölt: ${deleted}${safetyNote}`,
        )
      } else {
        setStatus(
          `Sheets sync kész (${mode}) - pull: ${json.pulled}, push: ${json.pushed}, új: ${created}, frissített: ${updated}, változatlan: ${unchanged}, törölt: ${deleted}${safetyNote}${pushNote}`,
        )
      }
      await loadData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  async function runCalendarSync() {
    setLoading(true)
    setStatus(null)
    setCalendarSyncChanges([])
    try {
      const res = await fetch("/api/leads/sync/calendar", { method: "POST" })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Naptár sync hiba.")
      const failed = Array.isArray(json.errors) ? json.errors.length : 0
      const pullMode = typeof json.pullMode === "string" ? json.pullMode : "ismeretlen"
      const pushCandidates = typeof json.pushCandidates === "number" ? json.pushCandidates : 0
      const pushAttempted = typeof json.pushAttempted === "number" ? json.pushAttempted : 0
      const pushSynced = typeof json.pushSynced === "number" ? json.pushSynced : 0
      const missingSlot = typeof json.missingSlot === "number" ? json.missingSlot : 0
      const invalidSlot = typeof json.invalidSlot === "number" ? json.invalidSlot : 0
      const deletedDuplicates = typeof json.deletedDuplicates === "number" ? json.deletedDuplicates : 0
      const deletedOrphans = typeof json.deletedOrphans === "number" ? json.deletedOrphans : 0
      const deletedLeadsFromCalendar =
        typeof json.deletedLeadsFromCalendar === "number" ? json.deletedLeadsFromCalendar : 0
      const createdFromCalendar = typeof json.createdFromCalendar === "number" ? json.createdFromCalendar : 0
      const pullCandidates = typeof json.pullCandidates === "number" ? json.pullCandidates : 0
      const pullUpdated = typeof json.pullUpdated === "number" ? json.pullUpdated : 0
      const pullProcessed = typeof json.pullProcessed === "number" ? json.pullProcessed : 0
      const pullSkipped = typeof json.pullSkipped === "number" ? json.pullSkipped : 0
      const conflicts = typeof json.conflicts === "number" ? json.conflicts : 0
      const unchangedSkipped = typeof json.unchangedSkipped === "number" ? json.unchangedSkipped : 0
      const safetySkipped = typeof json.safetySkipped === "number" ? json.safetySkipped : 0
      const syncMode = typeof json.mode === "string" ? json.mode : "ismeretlen"
      const rawDetails = Array.isArray(json.changes) ? (json.changes as CalendarSyncChange[]) : []
      const details = rawDetails.filter((change) => {
        if (change.action !== "skipped_unmatched" && change.action !== "skipped_no_change") return true
        return Array.isArray(change.changedFields)
          ? change.changedFields.includes("orphan_delete_guard") || change.changedFields.includes("calendar_delete_guard")
          : false
      })
      const firstError =
        failed > 0 && Array.isArray(json.errors) && typeof json.errors[0]?.message === "string"
          ? ` | első hiba: ${json.errors[0].message}`
          : ""
      setCalendarSyncChanges(details)
      setStatus(
        `Naptár sync kész (${pullMode}, ${syncMode}) | push jelölt: ${pushCandidates}, push: ${pushSynced}/${pushAttempted}, pull jelölt: ${pullCandidates}, pull frissítve: ${pullUpdated}/${pullProcessed}, új lead naptárból: ${createdFromCalendar}, változatlan kihagyva: ${unchangedSkipped}, pull kihagyva: ${pullSkipped}, konfliktus: ${conflicts}, biztonsági kihagyva: ${safetySkipped} (összes lead: ${json.processed}, hiányzó VH mező: ${missingSlot}, hibás VH formátum: ${invalidSlot}, törölt duplikátum: ${deletedDuplicates}, törölt árva esemény: ${deletedOrphans}, honlapról törölt: ${deletedLeadsFromCalendar}, hibák: ${failed}, részletek: ${details.length})${firstError}`,
      )
      await loadData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  async function toggleCalendarAutoSync(nextEnabled: boolean) {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/leads/sync/calendar/auto", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled }),
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Auto sync mentési hiba.")
      setCalendarAutoSyncEnabled(Boolean(json.enabled))
      setStatus(`Automatikus naptár sync: ${json.enabled ? "BE" : "KI"}.`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  async function patchLead(id: string, payload: Record<string, unknown>) {
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/leads/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...payload }),
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Mentési hiba.")
      await loadData()
      setStatus("Lead frissítve.")
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  function startInlineEdit(lead: Lead, field: InlineEditableField) {
    let next = ""
    if (field === "reportNote1") next = String(lead.form_payload?.reportNote1 ?? "")
    else if (field === "reportNote2") next = String(lead.form_payload?.reportNote2 ?? "")
    else if (field === "reviewed") next = String(lead.form_payload?.reviewed ?? "")
    if (field === "birthDate") next = toInputDate(lead.birth_date)
    else if (field === "dayText") next = toInputDate(lead.day_text)
    else if (field === "deadlineDate") next = toInputDate(lead.deadline_date)
    else if (field === "contactName") next = lead.contact_name ?? ""
    else if (field === "contactEmail") next = lead.contact_email ?? ""
    else if (field === "contactPhone") next = lead.contact_phone ?? ""
    else if (field === "ageText") next = lead.age_text ?? ""
    else if (field === "timeText") next = lead.time_text ?? ""
    else if (field === "callTime") next = lead.call_time ?? ""
    else if (field === "note") next = lead.note ?? ""
    else if (field === "savingsAmountText") next = lead.savings_amount_text ?? ""
    else if (field === "goalText") next = lead.goal_text ?? ""
    else if (field === "durationText") next = lead.duration_text ?? ""
    else if (field === "deadlineReason") next = lead.deadline_reason ?? ""
    else if (field === "owner") next = lead.owner ?? ""
    else if (field === "source") next = lead.source ?? ""
    else if (field === "clientNumber") next = lead.client_number ?? ""
    else if (field === "helpNeeded") next = lead.help_needed ?? ""

    setInlineEditing({ leadId: lead.id, field })
    setInlineValue(next)
  }

  function cancelInlineEdit() {
    setInlineEditing(null)
    setInlineValue("")
  }

  async function saveInlineEdit(lead: Lead) {
    if (!inlineEditing || inlineEditing.leadId !== lead.id) return
    const field = inlineEditing.field
    const raw = inlineValue.trim()
    let payload: Record<string, unknown> | null = null
    const currentFormPayload = lead.form_payload ?? {}

    let originalValue = ""
    if (field === "reportNote1") originalValue = String(lead.form_payload?.reportNote1 ?? "")
    else if (field === "reportNote2") originalValue = String(lead.form_payload?.reportNote2 ?? "")
    else if (field === "reviewed") originalValue = String(lead.form_payload?.reviewed ?? "")
    else if (field === "birthDate") originalValue = toInputDate(lead.birth_date)
    else if (field === "dayText") originalValue = toInputDate(lead.day_text)
    else if (field === "deadlineDate") originalValue = toInputDate(lead.deadline_date)
    else if (field === "contactName") originalValue = lead.contact_name ?? ""
    else if (field === "contactEmail") originalValue = lead.contact_email ?? ""
    else if (field === "contactPhone") originalValue = lead.contact_phone ?? ""
    else if (field === "ageText") originalValue = lead.age_text ?? ""
    else if (field === "timeText") originalValue = lead.time_text ?? ""
    else if (field === "callTime") originalValue = lead.call_time ?? ""
    else if (field === "note") originalValue = lead.note ?? ""
    else if (field === "savingsAmountText") originalValue = lead.savings_amount_text ?? ""
    else if (field === "goalText") originalValue = lead.goal_text ?? ""
    else if (field === "durationText") originalValue = lead.duration_text ?? ""
    else if (field === "deadlineReason") originalValue = lead.deadline_reason ?? ""
    else if (field === "owner") originalValue = lead.owner ?? ""
    else if (field === "source") originalValue = lead.source ?? ""
    else if (field === "clientNumber") originalValue = lead.client_number ?? ""
    else if (field === "helpNeeded") originalValue = lead.help_needed ?? ""

    if (normalizeInlineComparable(inlineValue) === normalizeInlineComparable(originalValue)) {
      cancelInlineEdit()
      return
    }

    if (field === "reportNote1") {
      payload = { formPayload: { ...currentFormPayload, reportNote1: textOrNull(inlineValue) } }
    } else if (field === "reportNote2") {
      payload = { formPayload: { ...currentFormPayload, reportNote2: textOrNull(inlineValue) } }
    } else if (field === "reviewed") {
      payload = { formPayload: { ...currentFormPayload, reviewed: textOrNull(inlineValue) } }
    } else if (field === "contactName") payload = { contactName: raw || lead.contact_name }
    else if (field === "contactEmail") payload = { contactEmail: raw || lead.contact_email }
    else if (field === "contactPhone") payload = { contactPhone: raw || lead.contact_phone }
    else if (field === "ageText") payload = { ageText: textOrNull(inlineValue) }
    else if (field === "birthDate") payload = { birthDate: textOrNull(inlineValue) }
    else if (field === "dayText") payload = { dayText: textOrNull(inlineValue) }
    else if (field === "timeText") payload = { timeText: textOrNull(inlineValue) }
    else if (field === "callTime") payload = { callTime: textOrNull(inlineValue) }
    else if (field === "note") payload = { note: textOrNull(inlineValue) }
    else if (field === "savingsAmountText") payload = { savingsAmountText: textOrNull(inlineValue) }
    else if (field === "goalText") payload = { goalText: textOrNull(inlineValue) }
    else if (field === "durationText") payload = { durationText: textOrNull(inlineValue) }
    else if (field === "deadlineDate") payload = { deadlineDate: textOrNull(inlineValue) }
    else if (field === "deadlineReason") payload = { deadlineReason: textOrNull(inlineValue) }
    else if (field === "owner") payload = { owner: textOrNull(inlineValue) }
    else if (field === "source") payload = { source: raw || lead.source }
    else if (field === "clientNumber") payload = { clientNumber: textOrNull(inlineValue) }
    else if (field === "helpNeeded") payload = { helpNeeded: textOrNull(inlineValue) }

    if (payload) {
      await patchLead(lead.id, payload)
    }
    cancelInlineEdit()
  }

  function renderInlineCell(
    lead: Lead,
    field: InlineEditableField,
    value: unknown,
    options?: { widthClass?: string; inputType?: "text" | "date" },
  ) {
    const isEditing = inlineEditing?.leadId === lead.id && inlineEditing.field === field
    if (isEditing) {
      return (
        <Input
          autoFocus
          type={options?.inputType ?? "text"}
          value={inlineValue}
          onChange={(e) => setInlineValue(e.target.value)}
          onBlur={() => void saveInlineEdit(lead)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              void saveInlineEdit(lead)
            }
            if (e.key === "Escape") {
              e.preventDefault()
              cancelInlineEdit()
            }
          }}
          className={`h-auto rounded-none border-0 bg-transparent px-0 py-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 ${options?.widthClass ?? "w-28"}`}
        />
      )
    }

    return (
      <div
        role="button"
        tabIndex={0}
        className="cursor-text text-left"
        onClick={() => {
          if (!loading) startInlineEdit(lead, field)
        }}
        onKeyDown={(e) => {
          if (loading) return
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            startInlineEdit(lead, field)
          }
        }}
      >
        <CellText value={value} widthClass={options?.widthClass ?? "w-28"} />
      </div>
    )
  }

  function startLeadEdit(lead: Lead) {
    setEditingLeadId(lead.id)
    setEditDraft(buildEditDraft(lead))
  }

  function cancelLeadEdit() {
    setEditingLeadId(null)
    setEditDraft(null)
  }

  function updateEditDraft<Key extends keyof LeadEditDraft>(key: Key, value: LeadEditDraft[Key]) {
    setEditDraft((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  async function saveLeadEdit(lead: Lead) {
    if (!editDraft || editingLeadId !== lead.id) return
    const currentFormPayload = lead.form_payload ?? {}
    const sourceValue = editDraft.source.trim() || lead.source
    const contactNameValue = editDraft.contactName.trim() || lead.contact_name
    const contactEmailValue = editDraft.contactEmail.trim() || lead.contact_email
    const contactPhoneValue = editDraft.contactPhone.trim() || lead.contact_phone
    const leadsPerDayRaw = textOrNull(editDraft.leadsPerDay)
    const leadsPerDayValue =
      leadsPerDayRaw && Number.isFinite(Number(leadsPerDayRaw)) ? Number(leadsPerDayRaw) : null
    const payload = {
      source: sourceValue,
      requestType: editDraft.requestType,
      contactName: contactNameValue,
      contactEmail: contactEmailValue,
      contactPhone: contactPhoneValue,
      birthDate: textOrNull(editDraft.birthDate),
      ageText: textOrNull(editDraft.ageText),
      callTime: textOrNull(editDraft.callTime),
      note: textOrNull(editDraft.note),
      subject: textOrNull(editDraft.subject),
      costFlag: editDraft.costFlag,
      tax20Flag: editDraft.tax20Flag,
      netFlag: editDraft.netFlag,
      savingsAmountText: textOrNull(editDraft.savingsAmountText),
      goalText: textOrNull(editDraft.goalText),
      durationText: textOrNull(editDraft.durationText),
      deadlineDate: textOrNull(editDraft.deadlineDate),
      deadlineReason: textOrNull(editDraft.deadlineReason),
      owner: textOrNull(editDraft.owner),
      paidFlag: editDraft.paidFlag,
      leadTypeText: textOrNull(editDraft.leadTypeText),
      clientNumber: textOrNull(editDraft.clientNumber),
      helpNeeded: textOrNull(editDraft.helpNeeded),
      leadsPerDay: leadsPerDayValue,
      dayText: textOrNull(editDraft.dayText),
      timeText: textOrNull(editDraft.timeText),
      followupNote: textOrNull(editDraft.followupNote),
      reportText: textOrNull(editDraft.reportText),
      revisitText: textOrNull(editDraft.revisitText),
      formPayload: {
        ...currentFormPayload,
        reportNote1: textOrNull(editDraft.reportNote1),
        reportNote2: textOrNull(editDraft.reportNote2),
        reviewed: textOrNull(editDraft.reviewed),
      },
    }
    await patchLead(lead.id, payload)
    cancelLeadEdit()
  }

  async function deleteLead(id: string, name: string) {
    const deletingIndex = selectableLeadIds.indexOf(id)
    const nextSelectedLeadId =
      deletingIndex >= 0
        ? (selectableLeadIds[deletingIndex + 1] ?? selectableLeadIds[deletingIndex - 1] ?? null)
        : null

    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch(`/api/leads/admin?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Törlési hiba.")
      setStatus("Lead törölve.")
      if (editingLeadId === id) cancelLeadEdit()
      setSelectedLeadId(nextSelectedLeadId)
      await loadData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  async function clearImportedLeads() {
    const confirmed = window.confirm(
      "Biztosan törlöd az importált leadeket? (manual_import + sheets)\nA landing_form leadek megmaradnak.",
    )
    if (!confirmed) return

    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch("/api/leads/admin?scope=imported", {
        method: "DELETE",
      })
      const parsed = await readApiResponse(res)
      if (!parsed.ok) throw new Error(parsed.message)
      const json = parsed.json
      if (!res.ok || !json?.ok) throw new Error(json?.message ?? "Törlési hiba.")
      setStatus(`Importált leadek törölve: ${json.deleted} db.`)
      await loadData()
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Ismeretlen hiba.")
    } finally {
      setLoading(false)
    }
  }

  function splitLine(form: number | undefined, excel: number | undefined) {
    const formValue = typeof form === "number" ? form : 0
    const excelValue = typeof excel === "number" ? excel : 0
    return `Űrlap: ${formValue} | Excel: ${excelValue}`
  }

  function renderLeadEditRow(lead: Lead) {
    if (editingLeadId !== lead.id || !editDraft) return null
    return (
      <TableRow>
        <TableCell colSpan={99}>
          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-3 text-sm font-medium">Teljes szerkesztés: {lead.contact_name || "Névtelen lead"}</p>
            <div className="grid gap-2 md:grid-cols-4">
              <Input value={editDraft.contactName} onChange={(e) => updateEditDraft("contactName", e.target.value)} placeholder="Név" />
              <Input value={editDraft.contactEmail} onChange={(e) => updateEditDraft("contactEmail", e.target.value)} placeholder="E-mail" />
              <Input value={editDraft.contactPhone} onChange={(e) => updateEditDraft("contactPhone", e.target.value)} placeholder="Telefon" />
              <Input value={editDraft.source} onChange={(e) => updateEditDraft("source", e.target.value)} placeholder="Forrás" />
              <Input type="date" value={editDraft.dayText} onChange={(e) => updateEditDraft("dayText", e.target.value)} />
              <Input value={editDraft.timeText} onChange={(e) => updateEditDraft("timeText", e.target.value)} placeholder="VH idő" />
              <Input value={editDraft.callTime} onChange={(e) => updateEditDraft("callTime", e.target.value)} placeholder="Hívás időpontja" />
              <Input type="date" value={editDraft.birthDate} onChange={(e) => updateEditDraft("birthDate", e.target.value)} />
              <Input value={editDraft.ageText} onChange={(e) => updateEditDraft("ageText", e.target.value)} placeholder="Életkor" />
              <Input value={editDraft.savingsAmountText} onChange={(e) => updateEditDraft("savingsAmountText", e.target.value)} placeholder="Tervezett összeg" />
              <Input value={editDraft.goalText} onChange={(e) => updateEditDraft("goalText", e.target.value)} placeholder="Cél" />
              <Input value={editDraft.durationText} onChange={(e) => updateEditDraft("durationText", e.target.value)} placeholder="Időtáv" />
              <Input type="date" value={editDraft.deadlineDate} onChange={(e) => updateEditDraft("deadlineDate", e.target.value)} />
              <Input value={editDraft.deadlineReason} onChange={(e) => updateEditDraft("deadlineReason", e.target.value)} placeholder="Határidő oka" />
              <Input value={editDraft.owner} onChange={(e) => updateEditDraft("owner", e.target.value)} placeholder="Felelős" />
              <Input value={editDraft.clientNumber} onChange={(e) => updateEditDraft("clientNumber", e.target.value)} placeholder="ÜA / ID" />
              <Input value={editDraft.helpNeeded} onChange={(e) => updateEditDraft("helpNeeded", e.target.value)} placeholder="Ajánlható termék" />
              <Input value={editDraft.followupNote} onChange={(e) => updateEditDraft("followupNote", e.target.value)} placeholder="Utánkövetés" />
              <Input value={editDraft.reportNote1} onChange={(e) => updateEditDraft("reportNote1", e.target.value)} placeholder="Riport megjegyzés 1" />
              <Input value={editDraft.reportNote2} onChange={(e) => updateEditDraft("reportNote2", e.target.value)} placeholder="Riport megjegyzés 2" />
              <Input value={editDraft.reviewed} onChange={(e) => updateEditDraft("reviewed", e.target.value)} placeholder="Átnézve?" />
              <Input value={editDraft.leadTypeText} onChange={(e) => updateEditDraft("leadTypeText", e.target.value)} placeholder="Lead típus" />
              <Input
                type="number"
                value={editDraft.leadsPerDay}
                onChange={(e) => updateEditDraft("leadsPerDay", e.target.value)}
                placeholder="Lead/nap"
              />
              <Input value={editDraft.revisitText} onChange={(e) => updateEditDraft("revisitText", e.target.value)} placeholder="Újra felkeresés" />
              <Select
                value={normalizeReportOption(editDraft.reportText) ?? "__unknown__"}
                onValueChange={(value) => updateEditDraft("reportText", value === "__unknown__" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Riport státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unknown__">{UNKNOWN_REPORT_LABEL}</SelectItem>
                  {REPORT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={editDraft.requestType}
                onValueChange={(value) => updateEditDraft("requestType", value as "A" | "B" | "C")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Request típus" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">A</SelectItem>
                  <SelectItem value="B">B</SelectItem>
                  <SelectItem value="C">C</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editDraft.paidFlag ? "true" : "false"}
                onValueChange={(value) => updateEditDraft("paidFlag", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Fizetett státusz" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Nyitott</SelectItem>
                  <SelectItem value="true">Fizetett</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editDraft.costFlag ? "true" : "false"}
                onValueChange={(value) => updateEditDraft("costFlag", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Költség jelző" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Nem</SelectItem>
                  <SelectItem value="true">Igen</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editDraft.tax20Flag ? "true" : "false"}
                onValueChange={(value) => updateEditDraft("tax20Flag", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="20% adójóváírás" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Nem</SelectItem>
                  <SelectItem value="true">Igen</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={editDraft.netFlag ? "true" : "false"}
                onValueChange={(value) => updateEditDraft("netFlag", value === "true")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Nettó jelző" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Nem</SelectItem>
                  <SelectItem value="true">Igen</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              <Textarea value={editDraft.note} onChange={(e) => updateEditDraft("note", e.target.value)} placeholder="Megjegyzés" />
              <Textarea value={editDraft.subject} onChange={(e) => updateEditDraft("subject", e.target.value)} placeholder="Tárgy" />
            </div>
            <div className="mt-3 flex gap-2">
              <Button size="sm" disabled={loading} onClick={() => void saveLeadEdit(lead)}>
                Mentés
              </Button>
              <Button size="sm" variant="secondary" disabled={loading} onClick={cancelLeadEdit}>
                Mégse
              </Button>
            </div>
          </div>
        </TableCell>
      </TableRow>
    )
  }

  if (!leadAccessChecked) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Lead hozzaferes ellenorzese</CardTitle>
            <CardDescription>Kerlek varj, ellenorizzuk a lead oldal feloldasat.</CardDescription>
          </CardHeader>
        </Card>
      </main>
    )
  }

  if (!leadAccessGranted) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Lead oldal feloldasa</CardTitle>
            <CardDescription>A Lead oldal megnyitasahoz kulon kod megadasa szukseges.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-3" onSubmit={unlockLeadAccess}>
              <Input
                type="password"
                value={leadAccessCode}
                onChange={(event) => setLeadAccessCode(event.target.value)}
                placeholder="Lead kod"
                autoComplete="current-password"
                required
              />
              {leadAccessError ? <p className="text-sm text-destructive">{leadAccessError}</p> : null}
              <Button type="submit" disabled={leadAccessUnlocking || !leadAccessCode.trim()}>
                {leadAccessUnlocking ? "Ellenorzes..." : "Feloldas"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Lead menedzsment</CardTitle>
          <CardDescription>
            Import (CSV/XLSX), Google Sheets kétirányú sync, Google naptár események, statisztika.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              type="file"
              accept=".csv,.xlsx,.xls"
              className="max-w-sm"
              onChange={(event) => setImportFile(event.target.files?.[0] ?? null)}
            />
            <Button disabled={loading} onClick={() => void runImport(true)}>
              Preview import
            </Button>
            <Button disabled={loading} onClick={() => void runImport(false)}>
              Import mentés
            </Button>
            <Button disabled={loading} variant="secondary" onClick={() => void runSheetsSync("pull")}>
              Sheets - pull
            </Button>
            <Button disabled={loading} variant="secondary" onClick={() => void runSheetsSync("push")}>
              Sheets - push (tiltva)
            </Button>
            <Button disabled={loading} variant="secondary" onClick={() => void runSheetsSync("both")}>
              Sheets - both (pull)
            </Button>
            <Button disabled={loading} variant="outline" onClick={() => void runCalendarSync()}>
              Naptár sync
            </Button>
            <Button
              disabled={loading}
              variant={calendarAutoSyncEnabled ? "default" : "secondary"}
              onClick={() => void toggleCalendarAutoSync(!calendarAutoSyncEnabled)}
            >
              Auto naptár sync: {calendarAutoSyncEnabled ? "BE" : "KI"}
            </Button>
            <Button asChild variant="secondary">
              <Link href="/leads/stats">Statisztika oldal</Link>
            </Button>
            <Button disabled={loading} variant="destructive" onClick={() => void clearImportedLeads()}>
              Importált leadek törlése
            </Button>
          </div>
          {status ? <p className="text-sm">{status}</p> : null}
          {calendarSyncChanges.length > 0 ? (
            <details className="rounded-md border p-3 text-sm">
              <summary className="cursor-pointer font-medium">
                Naptár sync részletek ({calendarSyncChanges.length} tétel)
              </summary>
              <div className="mt-2 space-y-1">
                {calendarSyncChanges.map((change, idx) => {
                  const fields =
                    Array.isArray(change.changedFields) && change.changedFields.length > 0
                      ? ` | mezők: ${change.changedFields
                          .map((field) => calendarFieldLabelMap[field] ?? field)
                          .join(", ")}`
                      : ""
                  const fieldDiffText =
                    Array.isArray(change.fieldDiffs) && change.fieldDiffs.length > 0
                      ? ` | diff: ${change.fieldDiffs
                          .map((diff) => {
                            const label = calendarFieldLabelMap[diff.field] ?? diff.field
                            const oldText = String(diff.oldValue ?? "-")
                            const newText = String(diff.newValue ?? "-")
                            return `${label}: ${oldText} -> ${newText}`
                          })
                          .join(" | ")}`
                      : ""
                  const direction =
                    change.direction === "calendar_to_db"
                      ? "naptár -> honlap"
                      : change.direction === "db_to_calendar"
                        ? "honlap -> naptár"
                        : "nincs irány"
                  return (
                    <p key={`${change.leadId}-${idx}`} className="text-muted-foreground">
                      {change.leadName} ({direction}) - {change.action}: {change.message}
                      {fields}
                      {fieldDiffText}
                    </p>
                  )
                })}
              </div>
            </details>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Összes lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{stats?.total ?? "-"}</p>
            <p className="text-muted-foreground text-xs">
              {splitLine(stats?.breakdown?.total.form, stats?.breakdown?.total.excel)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Havi lead</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{stats?.leadsMonth ?? "-"}</p>
            <p className="text-muted-foreground text-xs">A hónapban készült leadek</p>
            <p className="text-muted-foreground text-xs">
              {splitLine(stats?.breakdown?.monthByCallTime.form, stats?.breakdown?.monthByCallTime.excel)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ma felhívandó</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{stats?.leadsToday ?? "-"}</p>
            <p className="text-muted-foreground text-xs">Visszahívás napja = ma</p>
            <p className="text-muted-foreground text-xs">
              {splitLine(stats?.breakdown?.callToday.form, stats?.breakdown?.callToday.excel)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fizetett</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-3xl font-semibold">{stats?.paidCount ?? "-"}</p>
            <p className="text-muted-foreground text-xs">
              {splitLine(stats?.breakdown?.paidCount.form, stats?.breakdown?.paidCount.excel)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Importált leadek (Excel/Sheets)</CardTitle>
          <CardDescription>
            Ebben a táblában a `manual_import`, `sheets` és `app_edit` (naptárból érkező) leadek látszanak.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Keresés név/email/telefon/megjegyzés"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-md"
          />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-30 w-14 min-w-14 bg-background">
                  <SortHeadButton
                    label="#"
                    direction={importedSort.key === "sheetRowId" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("sheetRowId")}
                  />
                </TableHead>
                <TableHead className="w-40 min-w-40">
                  <SortHeadButton
                    label="Riport Megjegyzés"
                    direction={importedSort.key === "reportNote1" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("reportNote1")}
                  />
                </TableHead>
                <TableHead className="w-40 min-w-40">
                  <SortHeadButton
                    label="Riport Megjegyzés 2"
                    direction={importedSort.key === "reportNote2" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("reportNote2")}
                  />
                </TableHead>
                <TableHead className="w-28 min-w-28">
                  <SortHeadButton
                    label="Riport"
                    direction={importedSort.key === "reportText" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("reportText")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="VH napja"
                    direction={importedSort.key === "dayText" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("dayText")}
                  />
                </TableHead>
                <TableHead className="w-20 min-w-20">
                  <SortHeadButton
                    label="VH ip."
                    direction={importedSort.key === "timeText" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("timeText")}
                  />
                </TableHead>
                <TableHead className="sticky left-14 z-30 w-36 min-w-36 bg-background">
                  <SortHeadButton
                    label="Név"
                    direction={importedSort.key === "contactName" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("contactName")}
                  />
                </TableHead>
                <TableHead className="w-32 min-w-32">
                  <SortHeadButton
                    label="Telefonszám"
                    direction={importedSort.key === "contactPhone" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("contactPhone")}
                  />
                </TableHead>
                <TableHead className="w-16 min-w-16">
                  <SortHeadButton
                    label="Életkor"
                    direction={importedSort.key === "ageText" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("ageText")}
                  />
                </TableHead>
                <TableHead className={birthDateColumnOpen ? "w-28 min-w-28" : "w-14 min-w-14"}>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-between gap-1 text-left"
                    onClick={() => setBirthDateColumnOpen((prev) => !prev)}
                    title={birthDateColumnOpen ? "Születési dátum oszlop bezárása" : "Születési dátum oszlop megnyitása"}
                  >
                    <span className="truncate">{birthDateColumnOpen ? "Születési dátum" : "Szül. dát."}</span>
                    <span className="text-muted-foreground text-xs">{birthDateColumnOpen ? "▾" : "▸"}</span>
                  </button>
                </TableHead>
                <TableHead className="min-w-max">
                  <SortHeadButton
                    label="E-mail"
                    direction={importedSort.key === "contactEmail" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("contactEmail")}
                  />
                </TableHead>
                <TableHead className="w-36 min-w-36">
                  <SortHeadButton
                    label="Hívás időpontja"
                    direction={importedSort.key === "callTime" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("callTime")}
                  />
                </TableHead>
                <TableHead className="w-36 min-w-36">
                  <SortHeadButton
                    label="Megjegyzés"
                    direction={importedSort.key === "note" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("note")}
                  />
                </TableHead>
                <TableHead className="w-20 min-w-20">
                  <SortHeadButton
                    label="Átnézve?"
                    direction={importedSort.key === "reviewed" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("reviewed")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="Tervezett összeg"
                    direction={importedSort.key === "savingsAmount" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("savingsAmount")}
                  />
                </TableHead>
                <TableHead className="w-28 min-w-28">
                  <SortHeadButton
                    label="Cél"
                    direction={importedSort.key === "goal" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("goal")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="Időtáv"
                    direction={importedSort.key === "duration" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("duration")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="Határidő"
                    direction={importedSort.key === "deadlineDate" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("deadlineDate")}
                  />
                </TableHead>
                <TableHead className="w-28 min-w-28">
                  <SortHeadButton
                    label="Határidő oka"
                    direction={importedSort.key === "deadlineReason" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("deadlineReason")}
                  />
                </TableHead>
                <TableHead className="w-28 min-w-28">
                  <SortHeadButton
                    label="Felelős"
                    direction={importedSort.key === "owner" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("owner")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="Forrás"
                    direction={importedSort.key === "source" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("source")}
                  />
                </TableHead>
                <TableHead className="w-20 min-w-20">
                  <SortHeadButton
                    label="ID"
                    direction={importedSort.key === "clientNumber" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("clientNumber")}
                  />
                </TableHead>
                <TableHead className="w-36 min-w-36">
                  <SortHeadButton
                    label="Ajánlható termék"
                    direction={importedSort.key === "helpNeeded" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("helpNeeded")}
                  />
                </TableHead>
                <TableHead className="w-20 min-w-20">
                  <SortHeadButton
                    label="Típus"
                    direction={importedSort.key === "sourceType" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("sourceType")}
                  />
                </TableHead>
                <TableHead className="w-24 min-w-24">
                  <SortHeadButton
                    label="Státusz"
                    direction={importedSort.key === "paidFlag" ? importedSort.direction : null}
                    onClick={() => toggleImportedSort("paidFlag")}
                  />
                </TableHead>
                <TableHead>Művelet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedImportedLeads.map((lead) => (
                <Fragment key={lead.id}>
                <TableRow
                  className={`${getReportRowClass(lead.report_text)} ${
                    selectedLeadId === lead.id
                      ? "[&>td]:border-y-2 [&>td]:border-blue-500 [&>td:first-child]:border-l-2 [&>td:last-child]:border-r-2"
                      : ""
                  }`}
                >
                  <TableCell
                    className={`sticky left-0 z-20 cursor-pointer ${getReportStickyCellClass(lead.report_text)} ${selectedLeadId === lead.id ? "z-40" : ""}`}
                    onClick={() => setSelectedLeadId(lead.id)}
                    title="Sor kijelölése (Delete: törlés)"
                  >
                    <span className="font-mono tabular-nums">{lead.sheet_row_id?.trim() || "-"}</span>
                  </TableCell>
                  <TableCell>{renderInlineCell(lead, "reportNote1", lead.form_payload?.reportNote1, { widthClass: "w-40" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "reportNote2", lead.form_payload?.reportNote2, { widthClass: "w-40" })}</TableCell>
                  <TableCell>
                    {(() => {
                      const selected = normalizeReportOption(lead.report_text) ?? undefined
                      const selectedClass = selected
                        ? reportColorClassMap[selected]
                        : "bg-zinc-100 text-zinc-600"

                      return (
                        <Select
                          value={selected}
                          onValueChange={(value) => void patchLead(lead.id, { reportText: value })}
                          disabled={loading}
                        >
                          <SelectTrigger
                            className={`h-8 w-48 rounded-full border-none px-3 shadow-none ${selectedClass}`}
                          >
                            <SelectValue placeholder={UNKNOWN_REPORT_LABEL} />
                          </SelectTrigger>
                          <SelectContent>
                            {REPORT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option} className="py-1">
                                <span
                                  className={`inline-flex rounded-full px-3 py-1 font-medium ${reportColorClassMap[option]}`}
                                >
                                  {option}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )
                    })()}
                  </TableCell>
                  <TableCell>{renderInlineCell(lead, "dayText", formatDateForCell(lead.day_text), { widthClass: "w-24", inputType: "date" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "timeText", lead.time_text, { widthClass: "w-20" })}</TableCell>
                  <TableCell
                    className={`sticky left-14 z-20 ${getReportStickyCellClass(lead.report_text)} ${selectedLeadId === lead.id ? "z-40" : ""}`}
                  >
                    {renderInlineCell(lead, "contactName", lead.contact_name, { widthClass: "w-36" })}
                  </TableCell>
                  <TableCell>{renderInlineCell(lead, "contactPhone", formatPhoneForCell(lead.contact_phone), { widthClass: "w-32" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "ageText", formatAgeForCell(lead.age_text), { widthClass: "w-16" })}</TableCell>
                  <TableCell>
                    {birthDateColumnOpen ? (
                      renderInlineCell(lead, "birthDate", formatDateForCell(lead.birth_date), { widthClass: "w-28", inputType: "date" })
                    ) : (
                      <CellText value="-" widthClass="w-14" />
                    )}
                  </TableCell>
                  <TableCell>{renderInlineCell(lead, "contactEmail", formatEmailForCell(lead.contact_email), { widthClass: "w-40" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "callTime", formatDateTimeForCell(lead.call_time), { widthClass: "w-36" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "note", lead.note, { widthClass: "w-36" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "reviewed", lead.form_payload?.reviewed, { widthClass: "w-20" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "savingsAmountText", lead.savings_amount_text, { widthClass: "w-24" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "goalText", lead.goal_text, { widthClass: "w-28" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "durationText", lead.duration_text, { widthClass: "w-24" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "deadlineDate", formatDeadlineForCell(lead.deadline_date), { widthClass: "w-24", inputType: "date" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "deadlineReason", lead.deadline_reason, { widthClass: "w-28" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "owner", lead.owner, { widthClass: "w-28" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "source", lead.source, { widthClass: "w-24" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "clientNumber", lead.client_number, { widthClass: "w-20" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "helpNeeded", lead.help_needed, { widthClass: "w-36" })}</TableCell>
                  <TableCell><CellText value={lead.source_type} widthClass="w-20" /></TableCell>
                  <TableCell>
                    <Badge variant={lead.paid_flag ? "default" : "outline"}>
                      {lead.paid_flag ? "Fizetett" : "Nyitott"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => void patchLead(lead.id, { paidFlag: !lead.paid_flag })}
                      >
                        {lead.paid_flag ? "Nyitottra" : "Fizetettre"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading}
                        onClick={() => void deleteLead(lead.id, lead.contact_name)}
                      >
                        Törlés
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Űrlapos / Supabase leadek</CardTitle>
          <CardDescription>
            Ebben a táblában a webes űrlapról mentett `landing_form` leadek látszanak.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 z-30 w-14 min-w-14 bg-background">
                  <SortHeadButton
                    label="#"
                    direction={formSort.key === "rowNumber" ? formSort.direction : null}
                    onClick={() => toggleFormSort("rowNumber")}
                  />
                </TableHead>
                <TableHead className="sticky left-14 z-30 bg-background">
                  <SortHeadButton
                    label="Név"
                    direction={formSort.key === "contactName" ? formSort.direction : null}
                    onClick={() => toggleFormSort("contactName")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="E-mail"
                    direction={formSort.key === "contactEmail" ? formSort.direction : null}
                    onClick={() => toggleFormSort("contactEmail")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="Telefon"
                    direction={formSort.key === "contactPhone" ? formSort.direction : null}
                    onClick={() => toggleFormSort("contactPhone")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="Típus"
                    direction={formSort.key === "sourceType" ? formSort.direction : null}
                    onClick={() => toggleFormSort("sourceType")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="Felelős"
                    direction={formSort.key === "owner" ? formSort.direction : null}
                    onClick={() => toggleFormSort("owner")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="Határidő"
                    direction={formSort.key === "deadlineDate" ? formSort.direction : null}
                    onClick={() => toggleFormSort("deadlineDate")}
                  />
                </TableHead>
                <TableHead>
                  <SortHeadButton
                    label="Státusz"
                    direction={formSort.key === "paidFlag" ? formSort.direction : null}
                    onClick={() => toggleFormSort("paidFlag")}
                  />
                </TableHead>
                <TableHead>Művelet</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedFormLeads.map(({ lead, rowNumber }) => (
                <Fragment key={lead.id}>
                <TableRow
                  className={
                    selectedLeadId === lead.id
                      ? "[&>td]:border-y-2 [&>td]:border-blue-500 [&>td:first-child]:border-l-2 [&>td:last-child]:border-r-2"
                      : ""
                  }
                >
                  <TableCell
                    className={`sticky left-0 z-20 cursor-pointer bg-background ${selectedLeadId === lead.id ? "z-40" : ""}`}
                    onClick={() => setSelectedLeadId(lead.id)}
                    title="Sor kijelölése (Delete: törlés)"
                  >
                    <span className="font-mono tabular-nums">{rowNumber}</span>
                  </TableCell>
                  <TableCell className={`sticky left-14 z-20 bg-background ${selectedLeadId === lead.id ? "z-40" : ""}`}>
                    {renderInlineCell(lead, "contactName", lead.contact_name, { widthClass: "w-36" })}
                  </TableCell>
                  <TableCell>{renderInlineCell(lead, "contactEmail", formatEmailForCell(lead.contact_email), { widthClass: "w-40" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "contactPhone", formatPhoneForCell(lead.contact_phone), { widthClass: "w-32" })}</TableCell>
                  <TableCell>{lead.source_type}</TableCell>
                  <TableCell>{renderInlineCell(lead, "owner", lead.owner, { widthClass: "w-28" })}</TableCell>
                  <TableCell>{renderInlineCell(lead, "deadlineDate", formatDeadlineForCell(lead.deadline_date), { widthClass: "w-24", inputType: "date" })}</TableCell>
                  <TableCell>
                    <Badge variant={lead.paid_flag ? "default" : "outline"}>
                      {lead.paid_flag ? "Fizetett" : "Nyitott"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={loading}
                        onClick={() => void patchLead(lead.id, { paidFlag: !lead.paid_flag })}
                      >
                        {lead.paid_flag ? "Nyitottra" : "Fizetettre"}
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={loading}
                        onClick={() => void deleteLead(lead.id, lead.contact_name)}
                      >
                        Törlés
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  )
}
