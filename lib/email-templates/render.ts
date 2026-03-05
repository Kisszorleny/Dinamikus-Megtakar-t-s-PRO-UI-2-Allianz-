import type { EmailTemplate, EmailTemplateFieldKey } from "@/lib/email-templates/types"
import { getFixedAmountPairValues } from "@/lib/email-templates/fixed-amounts"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function stripDangerousTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
}

export type RenderTemplateInput = {
  template: Pick<EmailTemplate, "htmlContent" | "textContent" | "mappings">
  values: Partial<Record<EmailTemplateFieldKey, string>>
  calculatorTableHtml?: string
  calculatorTablePlain?: string
  accountGoalPhrase?: string
  isAllianzEletprogram?: boolean
}

function replaceFirst(input: string, needle: string, replacement: string): string {
  if (!needle) return input
  const index = input.indexOf(needle)
  if (index < 0) return input
  return `${input.slice(0, index)}${replacement}${input.slice(index + needle.length)}`
}

function replaceFirstOutsideHtmlTags(inputHtml: string, needle: string, replacement: string): string {
  if (!needle) return inputHtml
  let replaced = false
  return inputHtml
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (replaced || !part || part.startsWith("<")) return part
      const index = part.indexOf(needle)
      if (index < 0) return part
      replaced = true
      return `${part.slice(0, index)}${replacement}${part.slice(index + needle.length)}`
    })
    .join("")
}

function replaceOutsideTables(inputHtml: string, replacer: (segment: string) => string): string {
  const replaceOutsideHtmlTags = (segment: string): string =>
    segment
      .split(/(<[^>]+>)/g)
      .map((part) => {
        if (!part || part.startsWith("<")) return part
        return replacer(part)
      })
      .join("")

  const tableRegex = /<table\b[\s\S]*?<\/table>/gi
  let result = ""
  let cursor = 0
  let match = tableRegex.exec(inputHtml)
  while (match) {
    const tableStart = match.index
    const tableEnd = tableStart + match[0].length
    result += replaceOutsideHtmlTags(inputHtml.slice(cursor, tableStart))
    result += match[0]
    cursor = tableEnd
    match = tableRegex.exec(inputHtml)
  }
  result += replaceOutsideHtmlTags(inputHtml.slice(cursor))
  return result
}

function replaceFixedAmountVariants(
  input: string,
  key: "fixed_small_amount" | "fixed_large_amount",
  replacement: string,
): string {
  const pair = getFixedAmountPairValues()
  const normalizedReplacement = replacement.toLowerCase()
  const isEurReplacement = /\beur|euro|€/.test(normalizedReplacement)
  const selectedReplacement = replacement

  const smallHufPattern = String.raw`(?:990\s*(?:ft|forint|huf)(?:-os)?)`
  const smallEurPattern = String.raw`(?:3[.,]3\s*(?:eur[oó]?|euro|eur|€)(?:-s)?)`
  const largeHufPattern = String.raw`(?:(?:3(?:[ .]\s*000){2}|3000000|3\s*milli[oó])\s*(?:ft|forint|huf)(?:-os)?)`
  const largeEurPattern = String.raw`(?:(?:12(?:[ .]\s*000)|12000)\s*(?:eur[oó]?|euro|eur|€)(?:-s)?)`

  const pairPatterns =
    key === "fixed_small_amount"
      ? [
          new RegExp(`${smallHufPattern}\\s*(?:\\/|\\(|\\[|,|;|\\-)?\\s*${smallEurPattern}\\)?`, "gi"),
          new RegExp(`${smallEurPattern}\\s*(?:\\/|\\(|\\[|,|;|\\-)?\\s*${smallHufPattern}\\)?`, "gi"),
        ]
      : [
          new RegExp(`${largeHufPattern}\\s*(?:\\/|\\(|\\[|,|;|\\-)?\\s*${largeEurPattern}\\)?`, "gi"),
          new RegExp(`${largeEurPattern}\\s*(?:\\/|\\(|\\[|,|;|\\-)?\\s*${largeHufPattern}\\)?`, "gi"),
        ]

  const canonicalPairReplacement =
    key === "fixed_small_amount"
      ? `${pair.fixedSmallAmountHuf}/${pair.fixedSmallAmountEur}`
      : `${pair.fixedLargeAmountHuf} (${pair.fixedLargeAmountEur})`

  const placeholders: string[] = []
  let next = input
  for (const pattern of pairPatterns) {
    next = next.replace(pattern, () => {
      const token = `__DM_FIXED_PAIR_${key}_${placeholders.length}__`
      placeholders.push(token)
      return token
    })
  }

  // Single-currency occurrences still follow the active product currency.
  const singlePatterns =
    key === "fixed_small_amount"
      ? isEurReplacement
        ? [new RegExp(smallHufPattern, "gi")]
        : [new RegExp(smallEurPattern, "gi")]
      : isEurReplacement
        ? [new RegExp(largeHufPattern, "gi")]
        : [new RegExp(largeEurPattern, "gi")]

  for (const pattern of singlePatterns) {
    next = next.replace(pattern, selectedReplacement)
  }

  // Restore dual-currency contexts as canonical HUF/EUR pairs to prevent duplicates.
  for (const token of placeholders) {
    next = next.replace(token, canonicalPairReplacement)
  }

  // If explicit EUR replacement is active, normalize comma decimal to dot in small amount text.
  if (key === "fixed_small_amount" && isEurReplacement) {
    next = next.replace(/\b3,3\s*(?:eur|eur[oó]?|euro|€)\b/gi, pair.fixedSmallAmountEur)
  }

  return next
}

function extractTableId(html: string): string {
  const match = html.match(/\bid\s*=\s*["']([^"']+)["']/i)
  return (match?.[1] || "").trim()
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ""
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ""
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

function extractTableRowLabels(tableHtml: string): string[] {
  const rows = tableHtml.match(/<tr\b[\s\S]*?<\/tr>/gi) || []
  const labels: string[] = []
  for (const row of rows) {
    const firstCell = row.match(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/i)
    if (!firstCell) continue
    const normalized = normalizeComparableText(firstCell[2] || "").replace(/[:;,.!?]+$/g, "").trim()
    if (!normalized) continue
    labels.push(normalized)
  }
  return labels.slice(0, 12)
}

function replaceTableById(inputHtml: string, tableSnippet: string, tableHtml: string): string {
  const tableId = extractTableId(tableSnippet)
  if (!tableId) return inputHtml
  const escapedId = tableId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const tablePattern = new RegExp(`<table\\b[^>]*\\bid\\s*=\\s*["']${escapedId}["'][^>]*>[\\s\\S]*?<\\/table>`, "i")
  return inputHtml.replace(tablePattern, tableHtml)
}

function replaceBestMatchingTable(inputHtml: string, tableSnippet: string, tableHtml: string): string {
  const candidates = inputHtml.match(/<table\b[\s\S]*?<\/table>/gi) || []
  if (candidates.length === 0) return inputHtml
  const labels = extractTableRowLabels(tableSnippet)
  if (labels.length === 0) return inputHtml

  let bestIndex = -1
  let bestScore = 0

  for (let idx = 0; idx < candidates.length; idx += 1) {
    const candidate = normalizeComparableText(candidates[idx])
    let score = 0
    for (const label of labels) {
      if (label.length >= 4 && candidate.includes(label)) score += 1
    }
    if (score > bestScore) {
      bestScore = score
      bestIndex = idx
    }
  }

  if (bestIndex < 0 || bestScore <= 0) return inputHtml
  return inputHtml.replace(candidates[bestIndex], tableHtml)
}

const CALCULATOR_TABLE_MARKERS = [
  "megtakaritasi szamla megnevezese",
  "megtakaritasi havi osszeg",
  "teljes befizetes",
  "hozam strategia",
  "eves netto hozam",
  "varhato hozam",
  "megtakaritas szamlan varhato osszeg",
  "jelen arfolyamon szamolva",
]

function looksLikeCalculatorTable(tableHtml: string, expectedCalculatorTable?: string): boolean {
  const normalized = normalizeComparableText(tableHtml)
  if (expectedCalculatorTable) {
    const expected = normalizeComparableText(expectedCalculatorTable)
    if (expected && normalized === expected) return true
  }
  let hits = 0
  for (const marker of CALCULATOR_TABLE_MARKERS) {
    if (normalized.includes(marker)) hits += 1
  }
  return hits >= 3
}

function extractComparableTokens(input: string): string[] {
  return normalizeComparableText(input)
    .split(/[^a-z0-9]+/g)
    .map((part) => part.trim())
    .filter((part) => part.length >= 3)
}

function scoreCalculatorTableCandidate(tableHtml: string, expectedCalculatorTable = "", expectedCalculatorPlain = ""): number {
  const normalizedTable = normalizeComparableText(tableHtml)
  if (!normalizedTable) return 0

  let score = 0
  const normalizedExpectedTable = expectedCalculatorTable ? normalizeComparableText(expectedCalculatorTable) : ""
  const normalizedExpectedPlain = expectedCalculatorPlain ? normalizeComparableText(expectedCalculatorPlain) : ""
  if (normalizedExpectedTable && normalizedTable === normalizedExpectedTable) score += 1000

  for (const marker of CALCULATOR_TABLE_MARKERS) {
    if (normalizedTable.includes(marker)) score += 10
  }

  const plainTokens = extractComparableTokens(expectedCalculatorPlain)
  for (const token of plainTokens) {
    if (normalizedTable.includes(token)) score += 2
  }

  const htmlTokens = extractComparableTokens(expectedCalculatorTable)
  for (const token of htmlTokens) {
    if (normalizedTable.includes(token)) score += 1
  }

  // Strongly prefer candidates that preserve the FX-current row when expected by live calculator data.
  const expectsCurrentFxRow = normalizedExpectedTable.includes("jelen arfolyam") || normalizedExpectedPlain.includes("jelen arfolyam")
  if (expectsCurrentFxRow) {
    score += normalizedTable.includes("jelen arfolyam") ? 200 : -200
  }

  return score
}

function collapseCalculatorTablesToSingle(
  inputHtml: string,
  expectedCalculatorTable?: string,
  expectedCalculatorPlain?: string,
): string {
  const tableRegex = /<table\b[\s\S]*?<\/table>/gi
  const tables: Array<{ html: string; start: number; end: number; keep: boolean }> = []
  let match = tableRegex.exec(inputHtml)
  while (match) {
    const start = match.index
    const end = start + match[0].length
    tables.push({ html: match[0], start, end, keep: true })
    match = tableRegex.exec(inputHtml)
  }
  if (tables.length === 0) return inputHtml

  const calculatorIndexes: number[] = []
  for (let idx = 0; idx < tables.length; idx += 1) {
    if (looksLikeCalculatorTable(tables[idx].html, expectedCalculatorTable)) {
      calculatorIndexes.push(idx)
    }
  }
  if (calculatorIndexes.length <= 1) return inputHtml

  let keepCalculatorIndex = calculatorIndexes[0]
  let bestScore = Number.NEGATIVE_INFINITY
  for (const idx of calculatorIndexes) {
    const score = scoreCalculatorTableCandidate(tables[idx].html, expectedCalculatorTable, expectedCalculatorPlain)
    if (score > bestScore) {
      bestScore = score
      keepCalculatorIndex = idx
    }
  }

  for (const idx of calculatorIndexes) {
    if (idx !== keepCalculatorIndex) {
      tables[idx].keep = false
    }
  }

  let cursor = 0
  let result = ""
  for (const table of tables) {
    const start = table.start
    const end = table.end
    result += inputHtml.slice(cursor, start)
    if (table.keep) result += table.html
    cursor = end
  }
  result += inputHtml.slice(cursor)
  return result
}

function replaceGreetingName(input: string, name: string, htmlMode: boolean): string {
  const safeName = htmlMode ? escapeHtml(name) : name
  return input.replace(/(Kedves|Tisztelt)\s+([^!<\n]{1,120})!/i, `$1 ${safeName}!`)
}

function toGoalPhrase(input: string): string {
  const trimmed = input.trim().replace(/[!?.:,;]+$/g, "")
  if (!trimmed) return ""
  const first = trimmed[0]
  return `${first.toLocaleLowerCase("hu-HU")}${trimmed.slice(1)} célú`
}

function replaceSavingsGoalPhrase(input: string, goalPhrase: string): string {
  if (!goalPhrase) return input
  return input.replace(/szabad(?:\s+|-)?felhaszn[aá]l[aá]s[úu]/gi, goalPhrase)
}

function normalizeHunComparable(input: string): string {
  return decodeHtmlEntities(input)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function isRetirementGoal(goalPhrase: string): boolean {
  return normalizeHunComparable(goalPhrase).includes("nyugd")
}

const RETIREMENT_BLOCK_KEYWORDS = [
  "gondoskodjon a jovojerol",
  "nyugdijcelu megtakaritas",
  "allami tamogatas",
]

const TAX_CREDIT_KEYWORDS = [
  "adojovairas",
  "alanyi jogon",
  "szemelyi jovedelemadojabol",
]

const BONUS_BLOCK_KEYWORDS = [
  "fix bonusz jovairas a hozamokon felul",
  "minden evben kap bonusz jovairast",
  "1 evben 1 bonusz",
  "es igy tovabb",
]

const RETIREMENT_FAST_PATTERN =
  /gondoskodjon|nyugd[ií]j|[aá]llami\s+t[aá]mogat[aá]s|ad[oó]j[oó]v[aá][ií]r[aá]s|alanyi\s+jogon/i
const BONUS_FAST_PATTERN = /bonusz|b[oó]nuszj[oó]v[aá][ií]r[aá]s|hozamokon\s+fel[uü]l/i

function containsAnyNormalizedKeyword(input: string, keywords: string[]): boolean {
  const normalized = normalizeHunComparable(input)
  return keywords.some((keyword) => normalized.includes(keyword))
}

function removeHtmlBlocksByPredicate(input: string, predicate: (blockText: string) => boolean): string {
  // Common e-mail building blocks where headings/paragraphs are usually wrapped.
  const pattern = /<(div|p|li|h[1-6]|tr|td)\b[^>]*>[\s\S]*?<\/\1>/gi
  return input.replace(pattern, (block) => (predicate(block) ? "" : block))
}

function removePlainLinesByPredicate(input: string, predicate: (line: string) => boolean): string {
  return input
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => !predicate(line))
    .join("\n")
}

function removeTaxCreditSentences(input: string): string {
  return input
    .replace(/[^.!?\n]*ad[oó]j[oó]v[aá][ií]r[aá]s[^.!?\n]*[.!?]?/gi, "")
    .replace(/[^.!?\n]*alanyi\s+jogon[^.!?\n]*[.!?]?/gi, "")
}

function removeRetirementSectionHeuristic(input: string, htmlMode: boolean): string {
  if (!RETIREMENT_FAST_PATTERN.test(input)) {
    return input
  }

  const shouldRemoveBlock = (block: string) =>
    containsAnyNormalizedKeyword(block, RETIREMENT_BLOCK_KEYWORDS) || containsAnyNormalizedKeyword(block, TAX_CREDIT_KEYWORDS)

  let output = htmlMode ? removeHtmlBlocksByPredicate(input, shouldRemoveBlock) : removePlainLinesByPredicate(input, shouldRemoveBlock)

  // Fallback for inline/non-block templates: remove tax-credit statements globally.
  output = removeTaxCreditSentences(output)

  // Legacy fallback for heavily styled fragments split across many tags.
  output = output.replace(
    /(?:Az\s+állam[\s\S]{0,1600}?ad[oó]j[oó]v[aá][ií]r[aá]st[\s\S]{0,2000}?alanyi\s+jogon\.?)/gi,
    "",
  )

  return output
}

function removeBonusSectionHeuristic(input: string, htmlMode: boolean): string {
  if (!BONUS_FAST_PATTERN.test(input)) {
    return input
  }
  const shouldRemoveBlock = (block: string) => containsAnyNormalizedKeyword(block, BONUS_BLOCK_KEYWORDS)

  if (htmlMode) {
    // Keep table rows intact; remove textual bonus sections only.
    const pattern = /<(div|p|li|h[1-6]|section)\b[^>]*>[\s\S]*?<\/\1>/gi
    return input.replace(pattern, (block) => (shouldRemoveBlock(block) ? "" : block))
  }

  return removePlainLinesByPredicate(input, shouldRemoveBlock)
}

export function renderEmailTemplate({
  template,
  values,
  calculatorTableHtml = "",
  calculatorTablePlain = "",
  accountGoalPhrase = "",
  isAllianzEletprogram = false,
}: RenderTemplateInput): { html: string; plain: string } {
  let htmlOutput = template.htmlContent?.trim() || ""
  let plainOutput = template.textContent?.trim() || ""
  let hasCalculatorMapping = false
  const retirementEnabled = isRetirementGoal(accountGoalPhrase)
  const retirementSectionMapping = template.mappings.find((mapping) => mapping.key === "retirement_section")
  const bonusSectionMapping = template.mappings.find((mapping) => mapping.key === "bonus_section")
  const hasConfiguredRetirementSection = Boolean(
    retirementSectionMapping?.sourceSnippet?.trim() ||
      (retirementSectionMapping?.token?.trim() && htmlOutput.includes(retirementSectionMapping.token.trim())),
  )
  const hasConfiguredBonusSection = Boolean(
    bonusSectionMapping?.sourceSnippet?.trim() || (bonusSectionMapping?.token?.trim() && htmlOutput.includes(bonusSectionMapping.token.trim())),
  )

  for (const mapping of template.mappings) {
    const isTableMapping = mapping.key === "calculator_table"
    if (isTableMapping) hasCalculatorMapping = true
    const isRetirementSectionMapping = mapping.key === "retirement_section"
    const isBonusSectionMapping = mapping.key === "bonus_section"
    const rawValue = values[mapping.key] ?? ""
    const htmlValue = isTableMapping ? calculatorTableHtml || rawValue : escapeHtml(rawValue)
    const plainValue = isTableMapping ? calculatorTablePlain || rawValue || "[Kalkulátor táblázat]" : rawValue

    if (isRetirementSectionMapping) {
      const snippet = mapping.sourceSnippet?.trim() || ""
      if (retirementEnabled && mapping.token?.trim()) {
        const sectionValue = snippet || rawValue
        const tokenPattern = new RegExp(escapeRegExp(mapping.token), "g")
        htmlOutput = htmlOutput.replace(tokenPattern, sectionValue)
        plainOutput = plainOutput.replace(tokenPattern, sectionValue)
      }
      if (!retirementEnabled) {
        if (mapping.token?.trim()) {
          const tokenPattern = new RegExp(escapeRegExp(mapping.token), "g")
          htmlOutput = htmlOutput.replace(tokenPattern, "")
          plainOutput = plainOutput.replace(tokenPattern, "")
        }
        if (snippet) {
          htmlOutput = replaceFirst(htmlOutput, snippet, "")
          plainOutput = replaceFirst(plainOutput, snippet, "")
        }
      }
      continue
    }

    if (isBonusSectionMapping) {
      const snippet = mapping.sourceSnippet?.trim() || ""
      if (isAllianzEletprogram) {
        if (mapping.token?.trim()) {
          const tokenPattern = new RegExp(escapeRegExp(mapping.token), "g")
          htmlOutput = htmlOutput.replace(tokenPattern, "")
          plainOutput = plainOutput.replace(tokenPattern, "")
        }
        if (snippet) {
          htmlOutput = replaceFirst(htmlOutput, snippet, "")
          plainOutput = replaceFirst(plainOutput, snippet, "")
        }
      } else if (mapping.token?.trim()) {
        const sectionValue = snippet || rawValue
        const tokenPattern = new RegExp(escapeRegExp(mapping.token), "g")
        htmlOutput = htmlOutput.replace(tokenPattern, sectionValue)
        plainOutput = plainOutput.replace(tokenPattern, sectionValue)
      }
      continue
    }

    if (mapping.token?.trim()) {
      const tokenPattern = new RegExp(escapeRegExp(mapping.token), "g")
      htmlOutput = htmlOutput.replace(tokenPattern, htmlValue)
      plainOutput = plainOutput.replace(tokenPattern, plainValue)
    }

    if (isTableMapping && mapping.sourceSnippet?.trim()) {
      hasCalculatorMapping = true
      const snippet = mapping.sourceSnippet.trim()
      const htmlBeforeSnippetReplace = htmlOutput
      if (snippet && htmlValue) {
        htmlOutput = replaceFirst(htmlOutput, snippet, htmlValue)
      }
      if (snippet && htmlValue && htmlBeforeSnippetReplace === htmlOutput) {
        htmlOutput = replaceTableById(htmlOutput, snippet, htmlValue)
      }
      if (snippet && htmlValue && htmlBeforeSnippetReplace === htmlOutput) {
        htmlOutput = replaceBestMatchingTable(htmlOutput, snippet, htmlValue)
      }
      if (snippet && plainValue) {
        plainOutput = replaceFirst(plainOutput, snippet, plainValue)
      }
      continue
    }

    if (
      !isTableMapping &&
      mapping.key !== "tone" &&
      mapping.key !== "fixed_small_amount" &&
      mapping.key !== "fixed_large_amount" &&
      mapping.sourceSnippet?.trim() &&
      rawValue.trim()
    ) {
      const snippet = mapping.sourceSnippet.trim()
      htmlOutput = replaceFirstOutsideHtmlTags(htmlOutput, snippet, htmlValue)
      plainOutput = replaceFirst(plainOutput, snippet, plainValue)
    }

    if (
      (mapping.key === "fixed_small_amount" || mapping.key === "fixed_large_amount") &&
      mapping.sourceSnippet?.trim() &&
      rawValue.trim()
    ) {
      htmlOutput = replaceOutsideTables(htmlOutput, (segment) =>
        replaceFixedAmountVariants(segment, mapping.key, htmlValue),
      )
      plainOutput = replaceFixedAmountVariants(plainOutput, mapping.key, plainValue)
    }
  }

  if (hasCalculatorMapping) {
    htmlOutput = collapseCalculatorTablesToSingle(htmlOutput, calculatorTableHtml, calculatorTablePlain)
  }

  const safeName = String(values.name ?? "").trim()
  if (safeName) {
    htmlOutput = replaceGreetingName(htmlOutput, safeName, true)
    plainOutput = replaceGreetingName(plainOutput, safeName, false)
  }

  const goalPhrase = toGoalPhrase(accountGoalPhrase)
  if (goalPhrase) {
    htmlOutput = replaceSavingsGoalPhrase(htmlOutput, escapeHtml(goalPhrase))
    plainOutput = replaceSavingsGoalPhrase(plainOutput, goalPhrase)
  }

  if (!retirementEnabled && hasConfiguredRetirementSection) {
    htmlOutput = removeRetirementSectionHeuristic(htmlOutput, true)
    plainOutput = removeRetirementSectionHeuristic(plainOutput, false)
  }

  if (isAllianzEletprogram && hasConfiguredBonusSection) {
    htmlOutput = removeBonusSectionHeuristic(htmlOutput, true)
    plainOutput = removeBonusSectionHeuristic(plainOutput, false)
  }

  return {
    html: htmlOutput ? stripDangerousTags(htmlOutput) : "",
    plain: plainOutput,
  }
}
