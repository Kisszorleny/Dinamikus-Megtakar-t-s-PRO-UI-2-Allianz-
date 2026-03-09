import type {
  TemplateDocument,
  TemplateToneConversionLlmStatus,
  TemplateToneConversionMode,
  TemplateToneConversionSuggestion,
} from "@/lib/email-templates/types"

type MaskResult = {
  masked: string
  placeholders: string[]
}

type ConvertTextInput = {
  subject?: string
  htmlContent: string
  textContent: string
  contextHint?: string
}

type ConvertTextResult = {
  subject?: string
  htmlContent: string
  textContent: string
}

type LlmRefineResult = {
  result: ConvertTextResult | null
  errorNote?: string
}

type ModelResolution = {
  model: string | null
  errorNote?: string
}

const FORMAL_SIGNAL_PATTERNS: RegExp[] = [
  /\bTisztelt\b/gi,
  /Ön(?:nek|nel|nél|höz|ről|re|től|ért|é)?/gi,
  /\bKérj(?:ük|ük,\s+hogy)\b/gi,
  /\bTájékoztatjuk\b/gi,
  /\bMellékeljük\b/gi,
  /\bmegkeresését\b/gi,
]

const PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bTisztelt\b/g, "Kedves"],
  [/\bamennyiben kérdése merül fel\b/gi, "ha kérdésed merül fel"],
  [/\bamennyiben kérdése van\b/gi, "ha kérdésed van"],
  [/\bKöszönjük megtisztelő bizalmát\b/gi, "Köszönjük a bizalmadat"],
  [/\bforduljon hozzánk bizalommal\b/gi, "fordulj hozzánk bizalommal"],
  [/Az Ön által/g, "Az általad"],
  [/az Ön által/g, "az általad"],
  [/Ön által/g, "általad"],
  [/ön által/g, "általad"],
  [/Az Ön/g, "A te"],
  [/az Ön/g, "a te"],
  [/\bKérjük,\s*hogy\b/gi, "Kérlek,"],
  [/\bKérjük\b/g, "Kérlek"],
  [/\bkérjük\b/g, "kérlek"],
  [/\bTájékoztatjuk\b/g, "Tájékoztatlak"],
  [/\btájékoztatjuk\b/g, "tájékoztatlak"],
  [/\bMellékeljük\b/g, "Mellékelem"],
  [/\bmellékeljük\b/g, "mellékelem"],
  [/\bÜdvözlettel\b/g, "Üdv"],
  [/\büdvözlettel\b/g, "üdv"],
  [/\bbiztosítjuk\s+Önt\b/gi, "biztosítunk"],
  [/\bbiztosítjuk\s+önt\b/gi, "biztosítunk"],
  [/\bVelem\b/g, "velem"],
]

const PRONOUN_REPLACEMENTS: Array<[string, string]> = [
  ["Önnek", "neked"],
  ["önnek", "neked"],
  ["Önnel", "veled"],
  ["önnel", "veled"],
  ["Öntől", "tőled"],
  ["öntől", "tőled"],
  ["Önről", "rólad"],
  ["önről", "rólad"],
  ["Önre", "rád"],
  ["önre", "rád"],
  ["Önhöz", "hozzád"],
  ["önhöz", "hozzád"],
  ["Önnél", "nálad"],
  ["önnél", "nálad"],
  ["Önért", "érted"],
  ["önért", "érted"],
  ["Önt", "téged"],
  ["önt", "téged"],
  ["Öné", "tiéd"],
  ["öné", "tiéd"],
  ["Ön", "te"],
  ["ön", "te"],
]

const TABLE_TEXT_MARKERS = [
  "Megtakarítási havi összeg",
  "Teljes befizetés",
  "Hozam stratégia",
  "Éves nettó hozam",
  "Várható hozam",
  "Megtakarítás számlán várható összeg",
  "Teljes megtakarítás nettó értéke",
  "Jelen árfolyamon számolva",
  "500 Ft-os Euróval számolva",
  "600 Ft-os Euróval számolva",
]

function countRegexMatches(input: string, pattern: RegExp): number {
  const matches = input.match(pattern)
  return matches?.length ?? 0
}

function detectFormalScore(subject: string, htmlContent: string, textContent: string): number {
  const corpus = [subject, htmlContent, textContent].filter(Boolean).join("\n")
  if (!corpus.trim()) return 0
  let score = 0
  for (const pattern of FORMAL_SIGNAL_PATTERNS) {
    score += countRegexMatches(corpus, pattern)
  }
  return score
}

function maskTemplateTokens(input: string): MaskResult {
  const placeholders: string[] = []
  const masked = input.replace(/\{\{[^{}]+\}\}/g, (token) => {
    const placeholder = `__DM_TOKEN_${placeholders.length}__`
    placeholders.push(token)
    return placeholder
  })
  return { masked, placeholders }
}

function maskByRegex(input: string, pattern: RegExp, label: string): MaskResult {
  const placeholders: string[] = []
  const masked = input.replace(pattern, (matched) => {
    const placeholder = `[[DM_KEEP_${label}_${placeholders.length}]]`
    placeholders.push(matched)
    return placeholder
  })
  return { masked, placeholders }
}

function unmaskTemplateTokens(input: string, placeholders: string[]): string {
  let output = input
  for (let index = 0; index < placeholders.length; index += 1) {
    const placeholder = `__DM_TOKEN_${index}__`
    output = output.replace(new RegExp(placeholder, "g"), placeholders[index])
  }
  return output
}

function unmaskKeepBlocks(input: string, label: string, placeholders: string[]): string {
  let output = input
  for (let index = 0; index < placeholders.length; index += 1) {
    const placeholder = `[[DM_KEEP_${label}_${index}]]`
    output = output.replace(new RegExp(escapeRegExp(placeholder), "g"), placeholders[index])
  }
  return output
}

function extractTemplateTokens(input: string): string[] {
  return input.match(/\{\{[^{}]+\}\}/g) ?? []
}

function hasSameTemplateTokens(source: string, candidate: string): boolean {
  const sourceTokens = extractTemplateTokens(source).sort()
  const candidateTokens = extractTemplateTokens(candidate).sort()
  return JSON.stringify(sourceTokens) === JSON.stringify(candidateTokens)
}

function extractTagNames(input: string): string[] {
  const tags: string[] = []
  for (const match of input.matchAll(/<\/?([a-z0-9-]+)\b[^>]*>/gi)) {
    const tagName = (match[1] || "").toLowerCase()
    if (tagName) tags.push(tagName)
  }
  return tags.sort()
}

function hasCompatibleHtmlStructure(sourceHtml: string, candidateHtml: string): boolean {
  if (!sourceHtml.trim()) return true
  const sourceTags = extractTagNames(sourceHtml)
  const candidateTags = extractTagNames(candidateHtml)
  return JSON.stringify(sourceTags) === JSON.stringify(candidateTags)
}

function applyFormalToInformalRulesText(input: string): string {
  let output = input
  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    output = output.replace(pattern, replacement)
  }
  for (const [from, to] of PRONOUN_REPLACEMENTS) {
    output = replaceWholeWord(output, from, to)
  }
  output = output.replace(/te befizetéseire/gi, "a befizetéseidre")
  output = output.replace(/\bte is tudja\b/gi, "te is tudod")
  output = output.replace(/\bkeressen bizalommal\b/gi, "keress bizalommal")
  output = output.replace(/\btudja a befektetését\b/gi, "tudod a befektetésedet")
  output = output.replace(/\s{2,}/g, " ")
  return output
}

function applyFormalToInformalRulesHtml(input: string): string {
  return input
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (!part || part.startsWith("<")) return part
      return applyFormalToInformalRulesText(part)
    })
    .join("")
}

function parseJsonObject(input: string): Record<string, unknown> | null {
  const tryParse = (raw: string): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null
    } catch {
      return null
    }
  }

  const direct = tryParse(input)
  if (direct) return direct

  const fenced = input.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim()
  if (fenced) {
    const parsedFenced = tryParse(fenced)
    if (parsedFenced) return parsedFenced
  }

  const firstBrace = input.indexOf("{")
  const lastBrace = input.lastIndexOf("}")
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const sliced = input.slice(firstBrace, lastBrace + 1).trim()
    const parsedSliced = tryParse(sliced)
    if (parsedSliced) return parsedSliced
  }

  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function replaceWholeWord(input: string, from: string, to: string): string {
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegExp(from)}(?![\\p{L}\\p{N}_])`, "gu")
  return input.replace(pattern, to)
}

function isLikelySignatureStart(line: string): boolean {
  const normalized = line.trim().toLowerCase()
  if (!normalized) return false
  return (
    normalized.startsWith("üdvözlettel") ||
    normalized.startsWith("tisztelette") ||
    normalized.startsWith("best regards") ||
    normalized.startsWith("kind regards") ||
    normalized.startsWith("köszönettel")
  )
}

function maskTrailingSignatureBlock(text: string): MaskResult {
  const lines = text.split("\n")
  const startIndex = lines.findIndex((line) => isLikelySignatureStart(line))
  if (startIndex < 0) return { masked: text, placeholders: [] }
  const signature = lines.slice(startIndex).join("\n")
  const before = lines.slice(0, startIndex).join("\n")
  return {
    masked: `${before}\n[[DM_KEEP_SIGNATURE_0]]`.trim(),
    placeholders: [signature],
  }
}

function maskTableLikeLines(text: string): MaskResult {
  const lines = text.split("\n")
  const placeholders: string[] = []
  const maskedLines = lines.map((line) => {
    const hasMarker = TABLE_TEXT_MARKERS.some((marker) => line.toLowerCase().includes(marker.toLowerCase()))
    if (!hasMarker) return line
    const placeholder = `[[DM_KEEP_TABLE_${placeholders.length}]]`
    placeholders.push(line)
    return placeholder
  })
  return { masked: maskedLines.join("\n"), placeholders }
}

function buildLlmSafeTextInput(text: string): { safeText: string; signatureMasked: string[]; tableMasked: string[] } {
  const signatureMasked = maskTrailingSignatureBlock(text)
  const tableMasked = maskTableLikeLines(signatureMasked.masked)
  const safeText = tableMasked.masked.replace(/\n{3,}/g, "\n\n").trim()
  return { safeText, signatureMasked: signatureMasked.placeholders, tableMasked: tableMasked.placeholders }
}

function buildLlmSafeHtmlInput(html: string): { safeHtml: string; tableMasked: string[]; imageMasked: string[] } {
  const tableMasked = maskByRegex(html, /<table\b[\s\S]*?<\/table>/gi, "HTML_TABLE")
  const imageMasked = maskByRegex(tableMasked.masked, /<img\b[^>]*>/gi, "HTML_IMG")
  return {
    safeHtml: imageMasked.masked,
    tableMasked: tableMasked.placeholders,
    imageMasked: imageMasked.placeholders,
  }
}

type HtmlTextNodeMap = {
  htmlTemplate: string
  entries: Array<{ placeholder: string; original: string }>
}

function extractHtmlTextNodeMap(inputHtml: string): HtmlTextNodeMap {
  const entries: Array<{ placeholder: string; original: string }> = []
  const htmlTemplate = inputHtml
    .split(/(<[^>]+>)/g)
    .map((part) => {
      if (!part || part.startsWith("<") || !part.trim()) return part
      // Keep protected HTML placeholders untouched, otherwise table/image blocks may be lost.
      if (/\[\[DM_KEEP_HTML_(?:TABLE|IMG)_\d+\]\]/.test(part)) return part
      const placeholder = `[[DM_HTML_TEXT_${entries.length}]]`
      entries.push({ placeholder, original: part })
      return placeholder
    })
    .join("")
  return { htmlTemplate, entries }
}

function buildHtmlNodeMapPayload(entries: Array<{ placeholder: string; original: string }>): string {
  const mapObject = Object.fromEntries(entries.map((entry) => [entry.placeholder, entry.original]))
  return JSON.stringify(mapObject)
}

function parseHtmlNodeMapPayload(
  payload: string,
  entries: Array<{ placeholder: string; original: string }>,
): { values: Record<string, string>; matchedCount: number } {
  const output: Record<string, string> = {}
  let matchedCount = 0
  for (const entry of entries) {
    output[entry.placeholder] = entry.original
  }

  let parsedPayload: unknown = null
  try {
    parsedPayload = JSON.parse(payload)
  } catch {
    parsedPayload = null
  }
  if (parsedPayload && typeof parsedPayload === "object") {
    const payloadRecord = parsedPayload as Record<string, unknown>
    for (const entry of entries) {
      const nextValue = payloadRecord[entry.placeholder]
      if (typeof nextValue !== "string") continue
      output[entry.placeholder] = nextValue
      matchedCount += 1
    }
  }
  return { values: output, matchedCount }
}

function applyHtmlNodeMapPayload(template: string, values: Record<string, string>): string {
  const decodeCommonEntities = (input: string): string =>
    input
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
  const escapeHtmlText = (input: string): string =>
    input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
  let output = template
  for (const [placeholder, value] of Object.entries(values)) {
    // Protect HTML structure: replace only text node content, never allow injected tags.
    output = output.replace(new RegExp(escapeRegExp(placeholder), "g"), escapeHtmlText(decodeCommonEntities(value)))
  }
  return output
}

function splitIntoChunks(input: string, maxChars = 3200): string[] {
  const text = input.trim()
  if (!text) return []
  const paragraphs = text.split(/\n{2,}/g).map((part) => part.trim()).filter(Boolean)
  if (paragraphs.length === 0) return [text]

  const chunks: string[] = []
  let current = ""
  for (const paragraph of paragraphs) {
    if (!current) {
      if (paragraph.length <= maxChars) {
        current = paragraph
        continue
      }
      // Split oversized paragraph by lines to stay within model limits.
      const lines = paragraph.split("\n")
      let lineChunk = ""
      for (const line of lines) {
        const candidate = lineChunk ? `${lineChunk}\n${line}` : line
        if (candidate.length > maxChars && lineChunk) {
          chunks.push(lineChunk)
          lineChunk = line
        } else {
          lineChunk = candidate
        }
      }
      if (lineChunk) chunks.push(lineChunk)
      continue
    }
    const candidate = `${current}\n\n${paragraph}`
    if (candidate.length > maxChars) {
      chunks.push(current)
      current = paragraph
    } else {
      current = candidate
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function resolveToneConversionModel(): ModelResolution {
  const model = process.env.OPENAI_TONE_CONVERSION_MODEL?.trim()
  if (!model) {
    return {
      model: null,
      errorNote: "OPENAI_TONE_CONVERSION_MODEL nincs beállítva, ezért AI átírás helyett fallback futott.",
    }
  }
  return { model }
}

async function tryLlmRefine(input: ConvertTextInput, modelOverride?: string): Promise<LlmRefineResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim()
  if (!apiKey) return { result: null, errorNote: "OPENAI_API_KEY hiányzik a szerveren." }

  const resolved = modelOverride ? { model: modelOverride } : resolveToneConversionModel()
  if (!resolved.model) return { result: null, errorNote: resolved.errorNote || "Hiányzó OpenAI modell konfiguráció." }
  const model = resolved.model
  const timeoutRaw = Number.parseInt(process.env.OPENAI_TONE_CONVERSION_TIMEOUT_MS || "", 10)
  const timeoutMs = Number.isFinite(timeoutRaw) ? Math.max(8_000, Math.min(timeoutRaw, 120_000)) : 25_000
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const systemPrompt =
      "Magyar email szöveget alakítasz át magázóról tegezőre nyelvtanilag helyesen. Jelentést őrizd meg, tokeneket ne módosíts."
    const userPrompt = [
      "Feladat:",
      "- Magázó -> tegező átírás magyarul.",
      "- Nyelvtani korrektség elsődleges.",
      "- A {{...}} tokeneket pontosan változatlanul hagyd.",
      "- A [[DM_KEEP_*]] placeholder blokkokat pontosan változatlanul hagyd.",
      "- Minden magázó igealakot és megszólítást tegezőre alakíts át, ahol a mondat ezt igényli.",
      "- A kimenetben NE maradjon magázó forma (példák: Ön, Önt, Önnek, kérjük, keresse).",
      "- A textContent legyen természetes, gördülékeny, nyelvtanilag hibátlan magyar szöveg.",
      "- A htmlContent mező JSON objektum legyen, ahol a kulcsok [[DM_HTML_TEXT_n]] markerek, érték pedig az átírt szöveg.",
      "- A htmlContent objektumban minden marker szerepeljen pontosan egyszer.",
      "",
      "Kimenet kizárólag JSON objektum legyen a következő kulcsokkal:",
      '{ "subject": "...", "htmlContent": "...", "textContent": "..." }',
      "",
      `subject:\n${input.subject || ""}`,
      `htmlContent:\n${input.htmlContent || ""}`,
      `textContent:\n${input.textContent || ""}`,
      input.contextHint ? `context:\n${input.contextHint}` : "",
    ].join("\n")

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    })
    const payload = (await response.json().catch(() => null)) as
      | {
          choices?: Array<{ message?: { content?: string } }>
          error?: { message?: string; code?: string; type?: string }
        }
      | null
    if (!response.ok) {
      const errorMessage = payload?.error?.message?.trim() || "ismeretlen OpenAI hiba"
      const errorCode = payload?.error?.code?.trim() || "n/a"
      const shortened = errorMessage.length > 180 ? `${errorMessage.slice(0, 177)}...` : errorMessage
      return {
        result: null,
        errorNote: `OpenAI hívás sikertelen (${response.status}, code=${errorCode}): ${shortened}`,
      }
    }
    const content = payload?.choices?.[0]?.message?.content
    if (!content) {
      return { result: null, errorNote: "OpenAI válasz üres contentet adott." }
    }
    const parsed = parseJsonObject(content)
    if (!parsed) return { result: null, errorNote: "OpenAI válasz nem parse-olható JSON-ként." }
    return {
      result: {
        subject: typeof parsed.subject === "string" ? parsed.subject : input.subject,
        htmlContent:
          typeof parsed.htmlContent === "string"
            ? parsed.htmlContent
            : parsed.htmlContent && typeof parsed.htmlContent === "object"
              ? JSON.stringify(parsed.htmlContent)
              : input.htmlContent,
        textContent: typeof parsed.textContent === "string" ? parsed.textContent : input.textContent,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "ismeretlen hiba"
    return {
      result: null,
      errorNote: `OpenAI kérés kivétellel leállt: ${message}`,
    }
  } finally {
    clearTimeout(timeout)
  }
}

function buildRuleBasedRewrite(input: ConvertTextInput): ConvertTextResult {
  return {
    subject: input.subject ? applyFormalToInformalRulesText(input.subject) : undefined,
    htmlContent: applyFormalToInformalRulesHtml(input.htmlContent || ""),
    textContent: applyFormalToInformalRulesText(input.textContent || ""),
  }
}

export async function buildTegezoConversionSuggestion(
  document: Pick<TemplateDocument, "subject" | "htmlContent" | "textContent">,
  options?: {
    mode?: TemplateToneConversionMode
    aiContext?: {
      accountGoal?: string
      currency?: "HUF" | "EUR" | "USD"
      isAllianzEletprogram?: boolean
    }
  },
): Promise<TemplateToneConversionSuggestion | null> {
  const mode = options?.mode === "builtin" ? "builtin" : "ai_full"
  const subject = document.subject || ""
  const htmlContent = document.htmlContent || ""
  const textContent = document.textContent || ""
  const formalScore = detectFormalScore(subject, htmlContent, textContent)
  if (formalScore <= 0) return null

  const notes: string[] = []
  const maskedSubject = maskTemplateTokens(subject)
  const maskedHtml = maskTemplateTokens(htmlContent)
  const maskedText = maskTemplateTokens(textContent)
  const llmSafeText = buildLlmSafeTextInput(maskedText.masked)
  const llmSafeHtml = buildLlmSafeHtmlInput(maskedHtml.masked)
  const htmlNodeMap = extractHtmlTextNodeMap(llmSafeHtml.safeHtml)
  const htmlNodePayload = buildHtmlNodeMapPayload(htmlNodeMap.entries)
  const skipHtmlNodeMapForAi =
    htmlNodeMap.entries.length > 180 || htmlNodePayload.length > 18_000 || llmSafeText.safeText.length > 18_000

  const ruleResultMasked = buildRuleBasedRewrite({
    subject: maskedSubject.masked,
    htmlContent: maskedHtml.masked,
    textContent: maskedText.masked,
  })

  let llmStatus: TemplateToneConversionLlmStatus = mode === "builtin" ? "builtin_fallback" : "llm_unavailable_fallback"
  let modelUsed: string | undefined
  let llmResultMasked: ConvertTextResult | null = null
  const contextHint =
    options?.aiContext
      ? [
          options.aiContext.accountGoal ? `cél: ${options.aiContext.accountGoal}` : "",
          options.aiContext.currency ? `pénznem: ${options.aiContext.currency}` : "",
          typeof options.aiContext.isAllianzEletprogram === "boolean"
            ? `termék: ${options.aiContext.isAllianzEletprogram ? "Allianz Életprogram" : "Allianz Bónusz Életprogram"}`
            : "",
          "A teljes szöveget ehhez a kontextushoz igazítsd (tegező hangnem, pénznem/cél/termék konzisztencia).",
        ]
          .filter(Boolean)
          .join("\n")
      : undefined
  if (mode === "builtin") {
    notes.push("Beépített tegező mód futott (LLM kikapcsolva).")
  } else if (process.env.OPENAI_API_KEY?.trim()) {
    const resolvedModel = resolveToneConversionModel()
    if (!resolvedModel.model) {
      notes.push(resolvedModel.errorNote || "OpenAI modell nincs beállítva.")
    } else {
      modelUsed = resolvedModel.model
      notes.push(`LLM modell: ${resolvedModel.model}`)
      notes.push("Text-only single-shot LLM mód: 1 API hívás / konverzió (képek és táblázatok nélkül).")
      if (skipHtmlNodeMapForAi) {
        notes.push("Nagy bemenet miatt HTML node-map átírás kihagyva a timeout elkerüléséhez.")
      }
      const llmRefine = await tryLlmRefine(
        {
          subject: maskedSubject.masked,
          // Text-only OpenAI mode: no raw HTML is sent.
          htmlContent: skipHtmlNodeMapForAi ? "" : htmlNodePayload,
          textContent: llmSafeText.safeText,
          contextHint,
        },
        resolvedModel.model,
      )
      if (!llmRefine.result) {
        notes.push(llmRefine.errorNote || "Single-shot LLM átírás sikertelen, szabályalapú fallback történt.")
        notes.push("Single-shot fallback aktiválva.")
        llmStatus = "llm_partial_fallback"
      } else {
        llmStatus = "llm_full"
        llmResultMasked = {
          subject: llmRefine.result.subject || maskedSubject.masked,
          htmlContent: skipHtmlNodeMapForAi ? "" : llmRefine.result.htmlContent || htmlNodePayload,
          textContent: llmRefine.result.textContent || llmSafeText.safeText,
        }
      }
    }
  } else {
    notes.push("OPENAI_API_KEY nincs beállítva, szabályalapú javaslat készült.")
  }

  // AI full mode: never surface rule-based conversion in suggestion fields.
  if (mode === "ai_full") {
    if (!llmResultMasked) {
      notes.push("AI teljes mód: nem érkezett használható OpenAI kimenet.")
      return {
        status: "pending_review",
        targetTone: "tegezo",
        modeUsed: mode,
        llmStatus,
        modelUsed,
        detectedFormal: true,
        detectedFormalScore: formalScore,
        convertedSubject: undefined,
        convertedHtmlContent: undefined,
        convertedTextContent: undefined,
        notes,
      }
    }

    const llmTextWithRestoredBlocks = unmaskKeepBlocks(
      unmaskKeepBlocks(llmResultMasked.textContent, "TABLE", llmSafeText.tableMasked),
      "SIGNATURE",
      llmSafeText.signatureMasked,
    )
    const unresolvedKeepPlaceholder =
      /\[\[DM_KEEP_(?:TABLE|SIGNATURE)_\d+\]\]/.test(llmTextWithRestoredBlocks) ||
      /\[?DM_KEEP_(?:TABLE|SIGNATURE)_\d+\]?/.test(llmTextWithRestoredBlocks)
    const normalizedLlmText = unresolvedKeepPlaceholder
      ? llmTextWithRestoredBlocks
          .replace(/\[\[DM_KEEP_(?:TABLE|SIGNATURE)_\d+\]\]/g, "")
          .replace(/\[?DM_KEEP_(?:TABLE|SIGNATURE)_\d+\]?/g, "")
      : llmTextWithRestoredBlocks

    const aiSubjectRaw = unmaskTemplateTokens(llmResultMasked.subject || "", maskedSubject.placeholders) || undefined
    const mappedHtml = skipHtmlNodeMapForAi
      ? { values: {} as Record<string, string>, matchedCount: 0 }
      : parseHtmlNodeMapPayload(llmResultMasked.htmlContent || "", htmlNodeMap.entries)
    const aiTextRaw = unmaskTemplateTokens(normalizedLlmText, maskedText.placeholders)
    // Keep AI output as source of truth, but apply minimal post-correction for leftover formal forms.
    const aiSubject = aiSubjectRaw ? applyFormalToInformalRulesText(aiSubjectRaw) : undefined
    const aiText = applyFormalToInformalRulesText(aiTextRaw)
    const rebuiltSafeHtml = skipHtmlNodeMapForAi ? "" : applyHtmlNodeMapPayload(htmlNodeMap.htmlTemplate, mappedHtml.values)
    const aiHtmlWithRestoredBlocks = unmaskKeepBlocks(
      unmaskKeepBlocks(rebuiltSafeHtml, "HTML_IMG", llmSafeHtml.imageMasked),
      "HTML_TABLE",
      llmSafeHtml.tableMasked,
    )
    const aiHtml = skipHtmlNodeMapForAi ? "" : unmaskTemplateTokens(aiHtmlWithRestoredBlocks, maskedHtml.placeholders)

    const subjectTokensOk = hasSameTemplateTokens(subject, aiSubject || "")
    const textTokensOk = hasSameTemplateTokens(textContent, aiText)
    const htmlTokensOk = skipHtmlNodeMapForAi ? false : hasSameTemplateTokens(htmlContent, aiHtml)
    const htmlStructureOk = skipHtmlNodeMapForAi ? false : hasCompatibleHtmlStructure(htmlContent, aiHtml)
    const htmlCoverage = htmlNodeMap.entries.length > 0 ? mappedHtml.matchedCount / htmlNodeMap.entries.length : 1
    const htmlCoverageOk = htmlCoverage >= 0.7

    if (unresolvedKeepPlaceholder) {
      notes.push("Néhány zárolt blokkjelölő nem állt vissza pontosan, részleges restore történt.")
      llmStatus = "llm_partial_fallback"
    }
    if (!subjectTokensOk || !textTokensOk) {
      notes.push("AI teljes mód: token-ellenőrzés miatt csak részlegesen használható AI kimenet.")
      llmStatus = "llm_partial_fallback"
    }
    if (aiText !== aiTextRaw || aiSubject !== aiSubjectRaw) {
      notes.push("AI kimeneten minimális tegező utókorrekció futott a bent maradt magázó alakok miatt.")
    }
    if (!htmlTokensOk || !htmlStructureOk || !htmlCoverageOk) {
      notes.push("AI teljes mód: HTML biztonsági/coverage ellenőrzés miatt a visszaépített HTML kimenet el lett dobva.")
      llmStatus = "llm_partial_fallback"
    }
    notes.push(`DEBUG html-node-map matched: ${mappedHtml.matchedCount}/${htmlNodeMap.entries.length}`)
    notes.push(`DEBUG html-validation: tokens=${htmlTokensOk} tags=${htmlStructureOk} coverage=${htmlCoverage.toFixed(2)}`)

    return {
      status: "pending_review",
      targetTone: "tegezo",
      modeUsed: mode,
      llmStatus,
      modelUsed,
      detectedFormal: true,
      detectedFormalScore: formalScore,
      convertedSubject: subjectTokensOk ? aiSubject : undefined,
      convertedHtmlContent: htmlTokensOk && htmlStructureOk && htmlCoverageOk ? aiHtml : undefined,
      convertedTextContent: textTokensOk ? aiText : undefined,
      notes,
    }
  }

  const fallback = {
    subject: unmaskTemplateTokens(ruleResultMasked.subject || "", maskedSubject.placeholders) || undefined,
    htmlContent: unmaskTemplateTokens(ruleResultMasked.htmlContent, maskedHtml.placeholders),
    textContent: unmaskTemplateTokens(ruleResultMasked.textContent, maskedText.placeholders),
  }
  return {
    status: "pending_review",
    targetTone: "tegezo",
    modeUsed: mode,
    llmStatus,
    modelUsed,
    detectedFormal: true,
    detectedFormalScore: formalScore,
    convertedSubject: fallback.subject,
    convertedHtmlContent: fallback.htmlContent,
    convertedTextContent: fallback.textContent,
    notes,
  }
}
