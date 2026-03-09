import { PDFDocument, StandardFonts } from "pdf-lib"

type BuildPdfFromEmailInput = {
  subject: string
  plain: string
}

function sanitizePdfLine(input: string): string {
  return input.replace(/\r/g, "").replace(/\t/g, "  ")
}

function toWinAnsiSafe(input: string): string {
  const normalized = input
    .replace(/Ő/g, "O")
    .replace(/ő/g, "o")
    .replace(/Ű/g, "U")
    .replace(/ű/g, "u")
    .replace(/≠/g, "!=")
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\u00A0/g, " ")
  // Standard Helvetica in pdf-lib supports WinAnsi; replace anything outside that set.
  return normalized.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?")
}

function splitIntoLines(input: string): string[] {
  return input
    .split("\n")
    .map((line) => sanitizePdfLine(line))
    .flatMap((line) => {
      if (line.length <= 110) return [line]
      const chunks: string[] = []
      let rest = line
      while (rest.length > 110) {
        chunks.push(rest.slice(0, 110))
        rest = rest.slice(110)
      }
      chunks.push(rest)
      return chunks
    })
}

export async function buildPdfFromEmail({ subject, plain }: BuildPdfFromEmailInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const pageWidth = 595
  const pageHeight = 842
  const margin = 48
  const lineHeight = 14
  const fontSize = 11
  let page = pdf.addPage([pageWidth, pageHeight])
  let y = pageHeight - margin

  const drawLine = (line: string, isTitle = false) => {
    if (y < margin) {
      page = pdf.addPage([pageWidth, pageHeight])
      y = pageHeight - margin
    }
    page.drawText(toWinAnsiSafe(line || " "), {
      x: margin,
      y,
      size: isTitle ? 13 : fontSize,
      font,
    })
    y -= isTitle ? lineHeight + 4 : lineHeight
  }

  drawLine(subject || "Megtakarítási ajánlat", true)
  drawLine("")
  for (const line of splitIntoLines(plain || "")) {
    drawLine(line)
  }

  return pdf.save()
}
