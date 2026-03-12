import type { EmailTemplateSourceType, TemplateDocument } from "@/lib/email-templates/types"

export const STRIP_CLOSING_SECTION_MARKER = "<!--dm-strip-closing-section-->"

const CLOSING_TEXT_MARKER_REGEX =
  /(^|\n)\s*(?:üdvözlettel|tisztelettel|köszönettel|best regards|kind regards|regards)[ \t]*:?[ \t]*(?=\n|$)/im

function trimTrailingWhitespace(input: string): string {
  return input.replace(/\s+$/g, "")
}

function hasMeaningfulHtmlTail(input: string): boolean {
  return input
    .replace(/<\/?(?:body|html)\b[^>]*>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim().length > 0
}

function getSignatureSignalScore(input: string): number {
  const text = String(input || "")
  let score = 0
  if (/\b(?:mobil|mobile|tel|telefon|phone)\b\s*:?\s*(?:\+?\d[\d\s()./-]{5,})/i.test(text)) score += 2
  if (/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(text) || /mailto:/i.test(text)) score += 2
  if (/\bcid:/i.test(text)) score += 1
  if (/\b(?:tanácsadó|tanacsado|advisor|consultant|igazgató|igazgato|manager|specialista)\b/i.test(text)) score += 1
  if (/\b(?:zrt\.|kft\.|nyrt\.|ltd\.|inc\.|gmbh|corp\.)\b/i.test(text)) score += 1
  if (/\b(?:budapest|utca|u\.|út|ut|krt\.|körút|korut|tér|területi|teruleti|igazgatóság|igazgatosag)\b/i.test(text)) score += 1
  return score
}

function looksLikePersonNameLine(input: string): boolean {
  return /^\s*[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű.-]+(?:\s+[A-ZÁÉÍÓÖŐÚÜŰ][a-záéíóöőúüű.-]+){1,2}\s*$/.test(String(input || "").trim())
}

function isSignatureLeadLine(input: string): boolean {
  const line = String(input || "").trim()
  if (!line) return false
  if (looksLikePersonNameLine(line)) return true
  return (
    /\b(?:mobil|mobile|tel|telefon|phone)\b\s*:?\s*(?:\+?\d[\d\s()./-]{5,})/i.test(line) ||
    /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/i.test(line) ||
    /\b(?:tanácsadó|tanacsado|advisor|consultant|igazgató|igazgato|manager|specialista)\b/i.test(line) ||
    /\b(?:zrt\.|kft\.|nyrt\.|ltd\.|inc\.|gmbh|corp\.)\b/i.test(line) ||
    /\bcid:/i.test(line)
  )
}

function findSignatureCutIndexInText(input: string): number | null {
  const text = String(input || "")
  const lines = text.split("\n")
  let offset = 0
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const startIndex = offset
    offset += line.length + 1
    if (index < 2) continue
    const tail = lines.slice(index).join("\n")
    if (getSignatureSignalScore(tail) < 4) continue
    const previousLine = lines[index - 1] ?? ""
    const nextTwoLines = lines.slice(index, index + 3).join("\n")
    if (isSignatureLeadLine(line) || (!previousLine.trim() && getSignatureSignalScore(nextTwoLines) >= 3)) {
      return startIndex
    }
  }
  return null
}

function findSignatureCutIndexInHtml(input: string): number | null {
  const html = String(input || "")
  const signatureContainerMatch = html.match(/<(?:div|table|section|p)\b[^>]*(?:id|class)=["'][^"']*signature[^"']*["'][^>]*>/i)
  if (signatureContainerMatch?.index !== undefined) {
    return signatureContainerMatch.index
  }
  const paragraphStarts = [...html.matchAll(/<(?:div|p|table|tr)\b[^>]*>/gi)].map((match) => match.index ?? -1).filter((index) => index >= 0)
  for (const startIndex of paragraphStarts) {
    const tail = html.slice(startIndex)
    if (getSignatureSignalScore(tail) >= 4) {
      return startIndex
    }
  }
  return null
}

export function stripClosingSectionFromText(input: string): { content: string; stripped: boolean } {
  const text = String(input || "")
  const match = CLOSING_TEXT_MARKER_REGEX.exec(text)
  if (!match) {
    const signatureCutIndex = findSignatureCutIndexInText(text)
    if (signatureCutIndex === null) {
      return { content: text, stripped: false }
    }
    return {
      content: trimTrailingWhitespace(text.slice(0, signatureCutIndex)),
      stripped: true,
    }
  }
  const markerStart = match.index + (match[1] ? match[1].length : 0)
  const afterMarkerStart = match.index + match[0].length
  const nextNewlineIndex = text.indexOf("\n", afterMarkerStart)
  const cutIndex = nextNewlineIndex >= 0 ? nextNewlineIndex : text.length
  const tail = text.slice(cutIndex)
  if (!tail.trim()) {
    return { content: text, stripped: false }
  }
  return {
    content: trimTrailingWhitespace(text.slice(0, cutIndex)),
    stripped: true,
  }
}

export function stripClosingSectionFromHtml(input: string): { content: string; stripped: boolean } {
  const html = String(input || "")
  if (!html.trim()) {
    return { content: html, stripped: false }
  }
  const markerRegex = /(?:Üdvözlettel|Tisztelettel|Köszönettel|Best regards|Kind regards|Regards)\s*:?/i
  const match = markerRegex.exec(html)
  if (!match || typeof match.index !== "number") {
    const signatureCutIndex = findSignatureCutIndexInHtml(html)
    if (signatureCutIndex === null) {
      return { content: html, stripped: false }
    }
    let next = trimTrailingWhitespace(html.slice(0, signatureCutIndex))
    if (/<\/body>/i.test(html) && !/<\/body>/i.test(next)) {
      next += "</body>"
    }
    if (/<\/html>/i.test(html) && !/<\/html>/i.test(next)) {
      next += "</html>"
    }
    return { content: next, stripped: true }
  }

  const markerEnd = match.index + match[0].length
  const closingTagPatterns = ["</p>", "</div>", "</span>", "</td>", "</th>", "</li>", "<br>", "<br/>", "<br />"]
  let cutIndex = markerEnd
  for (const pattern of closingTagPatterns) {
    const index = html.toLowerCase().indexOf(pattern.toLowerCase(), markerEnd)
    if (index >= 0) {
      cutIndex = index + pattern.length
      break
    }
  }
  const tail = html.slice(cutIndex)
  if (!hasMeaningfulHtmlTail(tail)) {
    return { content: html, stripped: false }
  }

  let next = trimTrailingWhitespace(html.slice(0, cutIndex))
  if (/<\/body>/i.test(html) && !/<\/body>/i.test(next)) {
    next += "</body>"
  }
  if (/<\/html>/i.test(html) && !/<\/html>/i.test(next)) {
    next += "</html>"
  }
  return {
    content: next,
    stripped: true,
  }
}

export function applyClosingSectionPolicyToDocument(
  document: TemplateDocument,
  options?: {
    removeClosingSection?: boolean
    markHtml?: boolean
  },
): { document: TemplateDocument; stripped: boolean } {
  if (!options?.removeClosingSection) {
    return { document, stripped: false }
  }

  const nextSourceType: EmailTemplateSourceType = document.sourceType
  const raw =
    nextSourceType === "html"
      ? stripClosingSectionFromHtml(document.rawContent)
      : nextSourceType === "text"
        ? stripClosingSectionFromText(document.rawContent)
        : { content: document.rawContent, stripped: false }
  const html = stripClosingSectionFromHtml(document.htmlContent)
  const text = stripClosingSectionFromText(document.textContent)
  const stripped = raw.stripped || html.stripped || text.stripped
  const markedHtml = stripped && options.markHtml && html.content.trim()
    ? `${STRIP_CLOSING_SECTION_MARKER}\n${html.content}`
    : html.content

  return {
    stripped,
    document: {
      ...document,
      rawContent: raw.content,
      htmlContent: markedHtml,
      textContent: text.content,
    },
  }
}

export function hasStripClosingSectionMarker(input: string | undefined): boolean {
  return String(input || "").includes(STRIP_CLOSING_SECTION_MARKER)
}

export function stripClosingSectionMarker(input: string | undefined): string {
  return String(input || "").replace(STRIP_CLOSING_SECTION_MARKER, "").trim()
}
