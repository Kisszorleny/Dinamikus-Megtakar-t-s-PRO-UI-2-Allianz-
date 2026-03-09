type BuildEmlMessageInput = {
  from: string
  to: string
  subject: string
  html: string
  plain: string
  date?: Date
}

function toCrlf(input: string): string {
  return input.replace(/\r?\n/g, "\r\n")
}

function toSingleLineHeader(input: string): string {
  return input.replace(/[\r\n]+/g, " ").trim()
}

function encodeHeaderIfNeeded(input: string): string {
  const trimmed = toSingleLineHeader(input)
  if (!trimmed) return ""
  if (/^[\x20-\x7E]*$/.test(trimmed)) return trimmed
  const encoded = Buffer.from(trimmed, "utf8").toString("base64")
  return `=?UTF-8?B?${encoded}?=`
}

function buildMessageId(fromAddress: string): string {
  const domain = (fromAddress.split("@")[1] || "dinamikus.local").replace(/[^\w.-]/g, "") || "dinamikus.local"
  const random = Math.random().toString(36).slice(2, 12)
  return `<${Date.now()}.${random}@${domain}>`
}

export function buildEmlMessage(input: BuildEmlMessageInput): string {
  const now = input.date ?? new Date()
  const boundary = `DM_BOUNDARY_${Math.random().toString(36).slice(2, 12)}_${Date.now()}`
  const from = toSingleLineHeader(input.from)
  const to = toSingleLineHeader(input.to)
  const subject = encodeHeaderIfNeeded(input.subject || "Megtakarítási ajánlat")
  const plain = toCrlf(input.plain || "")
  const html = toCrlf(input.html || "")
  const headers = [
    `Date: ${now.toUTCString()}`,
    `From: ${from || "Dinamikus Megtakarítás <noreply@dinamikus.local>"}`,
    `To: ${to || "undisclosed-recipients:;"}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Message-ID: ${buildMessageId(from)}`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ]

  const body = [
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    plain,
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 8bit",
    "",
    html,
    `--${boundary}--`,
    "",
  ]

  return toCrlf([...headers, ...body].join("\n"))
}

export function slugifyVariantFileName(input: string): string {
  const normalized = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized || "email-variant"
}
