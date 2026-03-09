import type { ParsedTemplateCandidate, TemplateDocument, TemplateFieldMapping } from "@/lib/email-templates/types"

type DetectionRule = {
  key: TemplateFieldMapping["key"]
  label: string
  regexes: RegExp[]
}

const CALCULATOR_TABLE_LABELS = [
  "megtakarítási számla megnevezése",
  "megtakaritasi szamla megnevezese",
  "megtakarítási számla célja",
  "megtakaritasi szamla celja",
  "megtakarítási havi összeg",
  "megtakaritasi havi osszeg",
  "havi összeg",
  "havi osszeg",
  "megtakarítási éves összeg",
  "megtakaritasi eves osszeg",
  "teljes befizetés",
  "teljes befizetes",
  "hozam stratégia",
  "hozam strategia",
  "éves nettó hozam",
  "eves netto hozam",
  "várható hozam",
  "varhato hozam",
  "megtakarítás számlán várható összeg",
  "megtakaritas szamlan varhato osszeg",
  "bónuszjóváírás tartam alatt összesen",
  "bonuszjovairas tartam alatt osszesen",
  "tervezett időtartam",
  "tervezett idotartam",
  "teljes megtakarítás nettó értéke",
  "teljes megtakaritas netto erteke",
]

const detectionRules: DetectionRule[] = [
  {
    key: "name",
    label: "Név",
    regexes: [
      /(?:kedves|tisztelt)\s+([A-ZÁÉÍÓÖŐÚÜŰ][^\n,]{1,40})/i,
      /(?:név|ügyfél neve)\s*[:\-]\s*([^\n]{2,60})/i,
    ],
  },
  {
    key: "amount",
    label: "Összeg",
    regexes: [
      /(?:összeg|fizetendő|befizetés|díj)\s*[:\-]?\s*((?:\d{1,3}(?:[ .]\d{3})*|\d+)(?:[,.]\d{1,2})?\s*(?:Ft|HUF|EUR|USD))/i,
      /((?:\d{1,3}(?:[ .]\d{3})*|\d+)(?:[,.]\d{1,2})?\s*(?:Ft|HUF|EUR|USD))/i,
    ],
  },
  {
    key: "deadline",
    label: "Határidő",
    regexes: [
      /(?:határidő|érvényes(?:\séddig)?|fizetési határidő)\s*[:\-]?\s*((?:20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})|(?:\d{1,2}[.\-/]\d{1,2}[.\-/]20\d{2}))/i,
      /((?:20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2})|(?:\d{1,2}[.\-/]\d{1,2}[.\-/]20\d{2}))/i,
    ],
  },
  {
    key: "currency",
    label: "Pénznem",
    regexes: [/\b(HUF|Ft|EUR|USD)\b/i],
  },
  {
    key: "tone",
    label: "Hangnem",
    regexes: [/\b(tegez[őo]|mag[aá]z[óo]|kedves|tisztelt|ön|te)\b/i],
  },
  {
    key: "fixed_small_amount",
    label: "Fix kis összeg",
    regexes: [
      /\b(990\s*(?:ft|forint|huf)|990(?:ft|forint|huf)|3[.,]3\s*(?:eur|eur[oó]?|euro)(?:t|ban|ben)?)\b/i,
    ],
  },
  {
    key: "fixed_large_amount",
    label: "Fix nagy összeg",
    regexes: [
      /\b((?:3(?:[ .]\s*000){2}|3000000|3\s*milli[oó])\s*(?:ft|forint|huf)|(?:12(?:[ .]\s*000)|12000)\s*(?:eur|eur[oó]?|euro)(?:t|ban|ben)?)\b/i,
    ],
  },
  {
    key: "retirement_section",
    label: "Nyugdíj szekció",
    regexes: [
      /((?:\d+\s*[,.)-]?\s*)?(?:🧓💼\s*)?gondoskodjon[\s\S]{0,2200}?alanyi\s+jogon\.?)/i,
      /((?:✅\s*)?állami\s+támogatás[\s\S]{0,1600}?adójóváírást[\s\S]{0,1200}?alanyi\s+jogon\.?)/i,
    ],
  },
  {
    key: "bonus_section",
    label: "Bónusz szekció",
    regexes: [
      /((?:\d+\s*[,.)-]?\s*)?(?:🎁\s*)?fix\s*b[oó]nusz\s*j[oó]v[aá][ií]r[aá]s[\s\S]{0,1600}?minden\s*[ée]vben\s*kap\s*b[oó]nusz\s*j[oó]v[aá][ií]r[aá]st[\s\S]{0,2200}?(?:1\.\s*[ée]vben\s*1\s*%?\s*b[oó]nusz|[ée]s\s+[ií]gy\s+tov[aá]bb))/i,
      /((?:minden\s*[ée]vben\s*kap\s*b[oó]nusz\s*j[oó]v[aá][ií]r[aá]st[\s\S]{0,1200}?(?:1\.\s*[ée]vben\s*1\s*%?\s*b[oó]nusz|2\.\s*[ée]vben\s*2\s*%?\s*b[oó]nusz)[\s\S]{0,1200}?[ií]gy\s+tov[aá]bb))/i,
    ],
  },
]

function normalizeSnippet(input: string): string {
  return input.replace(/\s+/g, " ").trim().slice(0, 120)
}

function normalizeFieldSnippet(key: TemplateFieldMapping["key"], input: string): string {
  const normalized =
    key === "retirement_section" || key === "bonus_section"
      ? input.replace(/\s+/g, " ").trim().slice(0, 2500)
      : normalizeSnippet(input)
  if (key === "name") {
    return normalized.replace(/[!?,.;:]+$/g, "").trim()
  }
  return normalized
}

function buildToken(key: TemplateFieldMapping["key"]) {
  return `{{${key}}}`
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, code: string) => {
      const parsed = Number.parseInt(code, 10)
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : _
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => {
      const parsed = Number.parseInt(code, 16)
      return Number.isFinite(parsed) ? String.fromCharCode(parsed) : _
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function normalizeComparableText(input: string): string {
  return decodeHtmlEntities(input)
    .replace(/<[^>]+>/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function detectCalculatorTableSnippet(document: TemplateDocument): { snippet?: string; confidence: number } {
  const html = document.htmlContent || ""
  if (!html.trim()) return { confidence: 0 }
  const matches = html.match(/<table\b[\s\S]*?<\/table>/gi) || []
  if (matches.length === 0) return { confidence: 0 }

  let bestSnippet = ""
  let bestScore = 0
  let bestLength = 0

  for (const tableHtml of matches) {
    const normalized = normalizeComparableText(tableHtml)
    const rowCount = (tableHtml.match(/<tr\b/gi) || []).length
    let score = 0
    for (const label of CALCULATOR_TABLE_LABELS) {
      const normalizedLabel = normalizeComparableText(label)
      if (normalized.includes(normalizedLabel)) score += 1
    }
    if (normalized.includes("megtakar")) {
      score += 1
    }
    if (normalized.includes("hozam")) {
      score += 1
    }
    const weightedScore = score * 100 + rowCount
    if (weightedScore > bestScore * 100 + bestLength) {
      bestScore = score
      bestLength = rowCount
      bestSnippet = tableHtml
    }
  }

  if (!bestSnippet) return { confidence: 0 }
  if (bestScore < 1) {
    // Conservative fallback for templates that contain exactly one table block.
    if (matches.length === 1) {
      return { snippet: bestSnippet, confidence: 0.45 }
    }
    return { confidence: 0 }
  }
  return {
    snippet: bestSnippet,
    confidence: bestScore >= 4 ? 0.92 : 0.78,
  }
}

export function suggestTemplateMappings(document: TemplateDocument): TemplateFieldMapping[] {
  // Use subject+plain text for regex detection, but cap scanned size to keep uploads snappy.
  const fullCorpus = [document.subject ?? "", document.textContent].filter(Boolean).join("\n")
  const MAX_CORPUS_CHARS = 120_000
  const corpus =
    fullCorpus.length <= MAX_CORPUS_CHARS
      ? fullCorpus
      : `${fullCorpus.slice(0, 80_000)}\n${fullCorpus.slice(-40_000)}`
  const suggestions: TemplateFieldMapping[] = []

  for (const rule of detectionRules) {
    let snippet = ""
    let confidence = 0

    for (let idx = 0; idx < rule.regexes.length; idx += 1) {
      const regex = rule.regexes[idx]
      const match = corpus.match(regex)
      if (!match) continue
      snippet = normalizeFieldSnippet(rule.key, match[1] ?? match[0] ?? "")
      confidence = idx === 0 ? 0.9 : 0.65
      break
    }

    suggestions.push({
      key: rule.key,
      label: rule.label,
      token: buildToken(rule.key),
      sourceSnippet: snippet || undefined,
      confidence,
    })
  }

  const detectedTable = detectCalculatorTableSnippet(document)
  suggestions.push({
    key: "calculator_table",
    label: "Kalkulátor táblázat",
    token: buildToken("calculator_table"),
    sourceSnippet: detectedTable.snippet,
    confidence: detectedTable.confidence,
  })

  return suggestions
}

export function buildParsedTemplateCandidate(document: TemplateDocument): ParsedTemplateCandidate {
  return {
    ...document,
    suggestedMappings: suggestTemplateMappings(document),
  }
}
