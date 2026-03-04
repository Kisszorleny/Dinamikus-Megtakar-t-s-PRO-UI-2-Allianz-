export const REPORT_OPTIONS = [
  "Elértem kötés",
  "Adatbekérő kiment",
  "Elértem elutasít",
  "Elértem új ip.",
  "Nem értem el új ip-ra",
  "Nem értem el",
  "Többször nvf, hagyom..",
  "Később térjünk rá vissza",
  "Később megkeresni szerintem.",
  "Keres ha érdekes",
  "Keres ha érdekes/nem keresett",
] as const

export const UNKNOWN_REPORT_LABEL = "Még nem hívtam"

export type ReportOption = (typeof REPORT_OPTIONS)[number]

export function isReportOption(value: string): value is ReportOption {
  return REPORT_OPTIONS.includes(value as ReportOption)
}

function normalizeReportText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

const REPORT_OPTION_ALIASES: Record<ReportOption, string[]> = {
  "Elértem kötés": ["Elértem kötés", "A: Elértem, kötés", "A Elértem kötés", "Megkötve"],
  "Adatbekérő kiment": ["Adatbekérő kiment"],
  "Elértem elutasít": ["Elértem elutasít", "B: Elértem, elutasít", "B Elértem elutasít", "OFF"],
  "Elértem új ip.": ["Elértem új ip.", "C: Elértem, új ip.", "C Elértem új ip.", "VH"],
  "Nem értem el új ip-ra": ["Nem értem el új ip-ra", "VH NVF", "NVF VH"],
  "Nem értem el": ["Nem értem el", "D: Nem értem el", "D Nem értem el", "NVF"],
  "Többször nvf, hagyom..": ["Többször nvf, hagyom..", "Tobbszor nvf, hagyom..", "Sokszor NVF"],
  "Később térjünk rá vissza": ["Később térjünk rá vissza", "Majd vh"],
  "Később megkeresni szerintem.": ["Később megkeresni szerintem.", "Kesobb megkeresni szerintem.", "Majd vh (szerintem)"],
  "Keres ha érdekes": ["Keres ha érdekes", "Ő keres", "O keres"],
  "Keres ha érdekes/nem keresett": ["Keres ha érdekes/nem keresett", "Ő keres (nem keresett)", "O keres (nem keresett)"],
}

const REPORT_ALIAS_LOOKUP: Record<string, ReportOption> = Object.fromEntries(
  Object.entries(REPORT_OPTION_ALIASES).flatMap(([canonical, aliases]) =>
    aliases.map((alias) => [normalizeReportText(alias), canonical as ReportOption]),
  ),
)

export function normalizeReportOption(value: string | null | undefined): ReportOption | null {
  const text = String(value ?? "").trim()
  if (!text) return null
  const fromAlias = REPORT_ALIAS_LOOKUP[normalizeReportText(text)]
  if (fromAlias) return fromAlias
  return null
}
