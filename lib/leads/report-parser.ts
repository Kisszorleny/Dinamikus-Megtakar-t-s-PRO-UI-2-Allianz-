import { normalizeReportOption } from "@/lib/leads/constants"

export function normalizeReportTextForTitle(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9/ ]/g, "")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
}

export const REPORT_TO_CALENDAR_LABEL: Record<string, string> = {
  "Elértem kötés": "Megkötve",
  "Adatbekérő kiment": "Adatbekérő kiment",
  "Elértem elutasít": "OFF",
  "Elértem új ip.": "VH",
  "Nem értem el új ip-ra": "VH NVF",
  "Nem értem el": "NVF",
  "Többször nvf, hagyom..": "Sokszor NVF",
  "Később térjünk rá vissza": "Majd vh",
  "Később megkeresni szerintem.": "Majd vh (szerintem)",
  "Keres ha érdekes": "Ő keres",
  "Keres ha érdekes/nem keresett": "Ő keres (nem keresett)",
}

const CALENDAR_LABEL_ALIASES: Record<string, string[]> = {
  "Nem értem el új ip-ra": ["VH NVF", "NVF VH"],
}

const CALENDAR_LABEL_ALIAS_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(CALENDAR_LABEL_ALIASES).flatMap(([report, aliases]) =>
    aliases.map((alias) => [normalizeReportTextForTitle(alias), report]),
  ),
)

const ORDER_INSENSITIVE_TOKEN_ALIASES: Record<string, string[][]> = {
  "Nem értem el új ip-ra": [["vh", "nvf"]],
}

const ORDER_INSENSITIVE_TOKEN_LOOKUP: Record<string, string> = Object.fromEntries(
  Object.entries(ORDER_INSENSITIVE_TOKEN_ALIASES).flatMap(([report, tokenGroups]) =>
    tokenGroups.map((group) => [buildTokenSignature(group), report]),
  ),
)

const TOKEN_SYNONYMS: Record<string, string> = {
  vhnvf: "vh nvf",
  nvfvh: "vh nvf",
}

function tokenizeLabel(value: string) {
  return value
    .replace(/\//g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
}

function buildTokenSignature(tokens: string[]) {
  return [...tokens].sort().join("|")
}

function normalizeToken(token: string) {
  return TOKEN_SYNONYMS[token] ?? token
}

function mapCalendarLabelByTokenSignature(reportLabel?: string | null) {
  const normalized = normalizeReportTextForTitle(reportLabel)
  if (!normalized) return null

  const tokens = tokenizeLabel(normalized).map(normalizeToken).flatMap((token) => tokenizeLabel(token))
  if (tokens.length === 0 || tokens.length > 3) return null

  const signature = buildTokenSignature(tokens)
  return ORDER_INSENSITIVE_TOKEN_LOOKUP[signature] ?? null
}

export function mapReportToCalendarLabel(reportText?: string | null) {
  const normalized = normalizeReportTextForTitle(reportText)
  if (!normalized) return null

  for (const [report, label] of Object.entries(REPORT_TO_CALENDAR_LABEL)) {
    if (normalizeReportTextForTitle(report) === normalized) return label
  }
  return null
}

export function mapCalendarLabelToReportText(reportLabel?: string | null) {
  const normalized = normalizeReportTextForTitle(reportLabel)
  if (!normalized) return null

  for (const [report, label] of Object.entries(REPORT_TO_CALENDAR_LABEL)) {
    if (normalizeReportTextForTitle(label) === normalized) return report
    if (normalizeReportTextForTitle(report) === normalized) return report
  }

  const aliasedReport = CALENDAR_LABEL_ALIAS_LOOKUP[normalized]
  if (aliasedReport) return aliasedReport

  const tokenMatchedReport = mapCalendarLabelByTokenSignature(reportLabel)
  if (tokenMatchedReport) return tokenMatchedReport

  return normalizeReportOption(reportLabel)
}
