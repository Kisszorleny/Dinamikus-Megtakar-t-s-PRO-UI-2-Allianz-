import type { EmailTemplateSourceType, TemplateDocument } from "@/lib/email-templates/types"

function normalizeLineBreaks(input: string): string {
  return input.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function stripHtmlToText(html: string): string {
  const withoutScripts = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
  return withoutScripts
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function decodeQuotedPrintable(input: string): string {
  const softWrapped = input.replace(/=\n/g, "")
  return softWrapped.replace(/=([A-Fa-f0-9]{2})/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
}

type MimeHeaders = Record<string, string>
type InlineImageMap = Record<string, string>

function splitHeaderAndBody(raw: string): { headersRaw: string; bodyRaw: string } {
  const separatorIndex = raw.indexOf("\n\n")
  if (separatorIndex < 0) {
    return { headersRaw: raw, bodyRaw: "" }
  }
  return {
    headersRaw: raw.slice(0, separatorIndex),
    bodyRaw: raw.slice(separatorIndex + 2),
  }
}

function parseHeaders(headersRaw: string): MimeHeaders {
  const headers: MimeHeaders = {}
  const unfolded = headersRaw.replace(/\n[ \t]+/g, " ")
  const lines = unfolded.split("\n")
  for (const line of lines) {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex <= 0) continue
    const key = line.slice(0, separatorIndex).trim().toLowerCase()
    const value = line.slice(separatorIndex + 1).trim()
    if (!key) continue
    headers[key] = headers[key] ? `${headers[key]} ${value}` : value
  }
  return headers
}

function extractBoundary(contentType: string): string | null {
  const boundaryMatch = contentType.match(/boundary="?([^";]+)"?/i)
  return boundaryMatch?.[1]?.trim() || null
}

function decodeTransferEncoding(content: string, transferEncoding: string): string {
  const encoding = transferEncoding.trim().toLowerCase()
  if (encoding === "quoted-printable") {
    return decodeQuotedPrintable(content)
  }
  if (encoding === "base64") {
    const compact = content.replace(/\s+/g, "")
    if (!compact) return ""
    try {
      return Buffer.from(compact, "base64").toString("utf8")
    } catch {
      return content
    }
  }
  return content
}

function normalizeContentId(raw: string): string {
  return raw.trim().replace(/^<|>$/g, "").toLowerCase()
}

function toDataUrl(contentType: string, bodyRaw: string, transferEncoding: string): string {
  const encoding = transferEncoding.trim().toLowerCase()
  let base64Payload = ""
  if (encoding === "base64") {
    base64Payload = bodyRaw.replace(/\s+/g, "")
  } else if (encoding === "quoted-printable") {
    base64Payload = Buffer.from(decodeQuotedPrintable(bodyRaw), "utf8").toString("base64")
  } else {
    base64Payload = Buffer.from(bodyRaw, "utf8").toString("base64")
  }
  return `data:${contentType};base64,${base64Payload}`
}

function registerInlineImage(inlineImages: InlineImageMap, keyRaw: string, dataUrl: string) {
  const key = normalizeContentId(keyRaw)
  if (!key) return
  inlineImages[key] = dataUrl
  inlineImages[`cid:${key}`] = dataUrl
}

function replaceInlineImageSrc(html: string, inlineImages: InlineImageMap): string {
  let next = html
  for (const [key, dataUrl] of Object.entries(inlineImages)) {
    const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    next = next.replace(new RegExp(`(["'])${escaped}\\1`, "gi"), (_m, quote) => `${quote}${dataUrl}${quote}`)
  }
  return next
}

function splitMimeByBoundary(bodyRaw: string, boundary: string): string[] {
  const marker = `--${boundary}`
  return bodyRaw
    .split(marker)
    .map((part) => part.trim())
    .filter((part) => part && part !== "--")
    .map((part) => (part.endsWith("--") ? part.slice(0, -2).trim() : part))
}

function extractMimeBodies(headers: MimeHeaders, bodyRaw: string): { html?: string; text?: string; inlineImages: InlineImageMap } {
  const contentType = (headers["content-type"] || "").toLowerCase()
  const transferEncoding = headers["content-transfer-encoding"] || ""
  const inlineImages: InlineImageMap = {}

  if (contentType.startsWith("multipart/")) {
    const boundary = extractBoundary(headers["content-type"] || "")
    if (!boundary) return { inlineImages }
    let html: string | undefined
    let text: string | undefined
    const parts = splitMimeByBoundary(bodyRaw, boundary)
    for (const part of parts) {
      const { headersRaw: childHeadersRaw, bodyRaw: childBodyRaw } = splitHeaderAndBody(part)
      const childHeaders = parseHeaders(childHeadersRaw)
      const childResult = extractMimeBodies(childHeaders, childBodyRaw)
      Object.assign(inlineImages, childResult.inlineImages)
      if (!text && childResult.text) text = childResult.text
      if (!html && childResult.html) html = childResult.html
    }
    return { html, text, inlineImages }
  }

  if (contentType.includes("text/plain")) {
    const decodedBody = decodeTransferEncoding(bodyRaw, transferEncoding).trim()
    return { text: decodedBody, inlineImages }
  }
  if (contentType.includes("text/html")) {
    const decodedBody = decodeTransferEncoding(bodyRaw, transferEncoding).trim()
    return { html: decodedBody, inlineImages }
  }

  if (contentType.startsWith("image/")) {
    const contentId = headers["content-id"] || ""
    const contentLocation = headers["content-location"] || ""
    const dataUrl = toDataUrl(contentType.split(";")[0].trim(), bodyRaw, transferEncoding)
    if (contentId) registerInlineImage(inlineImages, contentId, dataUrl)
    if (contentLocation) registerInlineImage(inlineImages, contentLocation, dataUrl)
    return { inlineImages }
  }
  return { inlineImages }
}

function extractEmlBody(rawEml: string): { subject?: string; html?: string; text?: string } {
  const normalized = normalizeLineBreaks(rawEml)
  const { headersRaw, bodyRaw } = splitHeaderAndBody(normalized)
  const headers = parseHeaders(headersRaw)
  const subject = headers["subject"]?.trim() || undefined

  const mimeResult = extractMimeBodies(headers, bodyRaw)
  let html = mimeResult.html?.trim()
  let text = mimeResult.text?.trim()

  if (!html && !text) {
    const maybeHtml = /<\/?[a-z][\s\S]*>/i.test(bodyRaw)
    if (maybeHtml) {
      html = bodyRaw.trim()
      text = stripHtmlToText(html)
    } else {
      text = bodyRaw.trim()
    }
  }

  if (html && !text) text = stripHtmlToText(html)
  if (!html && text && /<\/?[a-z][\s\S]*>/i.test(text)) {
    html = text
    text = stripHtmlToText(html)
  }

  if (html && Object.keys(mimeResult.inlineImages).length > 0) {
    html = replaceInlineImageSrc(html, mimeResult.inlineImages)
  }

  return { subject, html, text }
}

export function parseTemplateContent(sourceType: EmailTemplateSourceType, rawContent: string): TemplateDocument {
  const raw = normalizeLineBreaks(rawContent)
  if (!raw.trim()) {
    throw new Error("A sablon tartalma üres.")
  }

  if (sourceType === "html") {
    return {
      sourceType,
      rawContent: raw,
      htmlContent: raw,
      textContent: stripHtmlToText(raw),
    }
  }

  if (sourceType === "text") {
    return {
      sourceType,
      rawContent: raw,
      htmlContent: "",
      textContent: raw.trim(),
    }
  }

  const parsedEml = extractEmlBody(raw)
  const htmlContent = parsedEml.html ?? ""
  const textContent = (parsedEml.text ?? (htmlContent ? stripHtmlToText(htmlContent) : "")).trim() || raw.slice(0, 4000).trim()
  return {
    sourceType,
    rawContent: raw,
    subject: parsedEml.subject,
    htmlContent,
    textContent,
  }
}
