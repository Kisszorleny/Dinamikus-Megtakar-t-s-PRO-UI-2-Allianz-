export type CalculatorTableValues = {
  accountName: string
  accountGoal: string
  monthlyPayment: string
  yearlyPayment: string
  years: string
  totalContributions: string
  strategy: string
  annualYield: string
  totalReturn: string
  totalTaxCredit?: string
  endBalance: string
  totalBonus?: string
  finalNet: string
  endBalanceHufCurrent?: string
  endBalanceEUR500?: string
  endBalanceEUR600?: string
}

export type CalculatorTableStyleOptions = {
  fxBaseColor?: string
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function row(label: string, value: string): string {
  return `<tr><td style="padding:8px 10px; border:1px solid #d1d5db; text-align:left; font-size:14px; color:#1f2937; font-weight:600;">${esc(label)}</td><td style="padding:8px 10px; border:1px solid #d1d5db; text-align:right; font-size:14px; color:#111827;">${esc(value)}</td></tr>`
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function normalizeText(input: string): string {
  const namedEntityMap: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
    aacute: "á",
    eacute: "é",
    iacute: "í",
    oacute: "ó",
    ouml: "ö",
    odblac: "ő",
    uacute: "ú",
    uuml: "ü",
    udblac: "ű",
    Aacute: "Á",
    Eacute: "É",
    Iacute: "Í",
    Oacute: "Ó",
    Ouml: "Ö",
    Odblac: "Ő",
    Uacute: "Ú",
    Uuml: "Ü",
    Udblac: "Ű",
  }
  return input
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n: string) => {
      const code = Number(n)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ""
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = Number.parseInt(hex, 16)
      return Number.isFinite(code) ? String.fromCodePoint(code) : ""
    })
    .replace(/&([a-zA-Z]+);/g, (_m, name: string) => namedEntityMap[name] ?? _m)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function replaceRowValueByLabel(tableHtml: string, labelNeedle: string, value: string): string {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex)
  if (!rows || rows.length === 0) return tableHtml

  const targetLabel = normalizeText(labelNeedle).replace(/:$/, "")
  let replaced = false

  const updatedRows = rows.map((rowHtml) => {
    if (replaced) return rowHtml
    const cells = Array.from(rowHtml.matchAll(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/gi)).map((m) => m[0])
    if (cells.length < 2) return rowHtml

    const firstLabel = normalizeText(cells[0]).replace(/:$/, "")
    if (!firstLabel.includes(targetLabel)) return rowHtml

    const nextRaw = String(value ?? "").trim()
    if (!nextRaw) return rowHtml

    const secondCell = cells[1]
    const currentVisibleValue = normalizeText(secondCell)
    const nextVisibleValue = normalizeText(nextRaw)
    if (currentVisibleValue === nextVisibleValue) {
      replaced = true
      return rowHtml
    }

    const replaceLastTagContent = (input: string, tagName: "span" | "p"): string | null => {
      // Prefer leaf tags (no nested markup), so original inner wrappers/styles are preserved.
      const leafRegex = new RegExp(`<${tagName}\\b([^>]*)>([^<]*)<\\/${tagName}>`, "gi")
      const leafMatches = Array.from(input.matchAll(leafRegex))
      const lastLeaf = leafMatches.at(-1)
      if (lastLeaf) {
        const full = lastLeaf[0]
        const attrs = lastLeaf[1] ?? ""
        const replacement = `<${tagName}${attrs}>${esc(value)}</${tagName}>`
        return input.replace(full, replacement)
      }

      const tagRegex = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi")
      const matches = Array.from(input.matchAll(tagRegex))
      const last = matches.at(-1)
      if (!last) return null
      const full = last[0]
      const replaced = full.replace(
        new RegExp(`^(<${tagName}\\b[^>]*>)[\\s\\S]*?(<\\/${tagName}>$)`, "i"),
        `$1${esc(value)}$2`,
      )
      return input.replace(full, replaced)
    }

    const secondCellUpdated = secondCell.replace(/^(<(td|th)\b[^>]*>)([\s\S]*?)(<\/\2>)$/i, (_, openTag, _tag, inner, closeTag) => {
      const nextValue = esc(nextRaw)
      if (!String(inner).includes("<")) {
        return `${openTag}${nextValue}${closeTag}`
      }

      const spanPreferred = replaceLastTagContent(String(inner), "span")
      if (spanPreferred && spanPreferred !== inner) {
        return `${openTag}${spanPreferred}${closeTag}`
      }
      const paragraphPreferred = replaceLastTagContent(String(inner), "p")
      if (paragraphPreferred && paragraphPreferred !== inner) {
        return `${openTag}${paragraphPreferred}${closeTag}`
      }

      const innerWithPreservedMarkup = String(inner).replace(
        /(^|>)([^<>]*\S[^<>]*)(?=<|$)/,
        (_match: string, prefix: string) => `${prefix}${nextValue}`,
      )

      if (innerWithPreservedMarkup === inner) {
        return `${openTag}${nextValue}${closeTag}`
      }
      return `${openTag}${innerWithPreservedMarkup}${closeTag}`
    })
    replaced = true
    return rowHtml.replace(secondCell, secondCellUpdated)
  })

  if (!replaced) return tableHtml

  let next = tableHtml
  for (let idx = 0; idx < rows.length; idx += 1) {
    next = next.replace(rows[idx], updatedRows[idx])
  }
  return next
}

function removeRowByLabel(tableHtml: string, labelNeedle: string): string {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex)
  if (!rows || rows.length === 0) return tableHtml

  const targetLabel = normalizeText(labelNeedle).replace(/:$/, "")
  for (const rowHtml of rows) {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    if (!normalizedLabel.includes(targetLabel)) continue
    return tableHtml.replace(rowHtml, "")
  }
  return tableHtml
}

function buildInsertedRowFromReference(referenceRowHtml: string, label: string, value: string): string {
  const rowMatch = referenceRowHtml.match(/^<tr\b([^>]*)>([\s\S]*?)<\/tr>$/i)
  if (!rowMatch) {
    return `<tr><td>${esc(label)}:</td><td>${esc(value)}</td></tr>`
  }
  const rowAttrs = rowMatch[1] || ""
  const cells = Array.from(referenceRowHtml.matchAll(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/gi)).map((m) => m[0])
  if (cells.length < 2) {
    return `<tr${rowAttrs}><td>${esc(label)}:</td><td>${esc(value)}</td></tr>`
  }

  const setCellInnerText = (cellHtml: string, text: string): string => {
    return cellHtml.replace(/^(<(td|th)\b[^>]*>)([\s\S]*?)(<\/\2>)$/i, (_m, openTag, _tag, inner, closeTag) => {
      const currentVisibleValue = normalizeText(String(inner))
      const nextVisibleValue = normalizeText(text)
      if (currentVisibleValue === nextVisibleValue) {
        return `${openTag}${inner}${closeTag}`
      }

      const replaceLastTagContent = (input: string, tagName: "span" | "p"): string | null => {
        const leafRegex = new RegExp(`<${tagName}\\b([^>]*)>([^<]*)<\\/${tagName}>`, "gi")
        const leafMatches = Array.from(input.matchAll(leafRegex))
        const lastLeaf = leafMatches.at(-1)
        if (lastLeaf) {
          const full = lastLeaf[0]
          const attrs = lastLeaf[1] ?? ""
          const replacement = `<${tagName}${attrs}>${esc(text)}</${tagName}>`
          return input.replace(full, replacement)
        }
        const tagRegex = new RegExp(`<${tagName}\\b[^>]*>[\\s\\S]*?<\\/${tagName}>`, "gi")
        const matches = Array.from(input.matchAll(tagRegex))
        const last = matches.at(-1)
        if (!last) return null
        const full = last[0]
        const replaced = full.replace(
          new RegExp(`^(<${tagName}\\b[^>]*>)[\\s\\S]*?(<\\/${tagName}>$)`, "i"),
          `$1${esc(text)}$2`,
        )
        return input.replace(full, replaced)
      }

      if (!String(inner).includes("<")) {
        return `${openTag}${esc(text)}${closeTag}`
      }

      const spanPreferred = replaceLastTagContent(String(inner), "span")
      if (spanPreferred && spanPreferred !== inner) {
        return `${openTag}${spanPreferred}${closeTag}`
      }
      const paragraphPreferred = replaceLastTagContent(String(inner), "p")
      if (paragraphPreferred && paragraphPreferred !== inner) {
        return `${openTag}${paragraphPreferred}${closeTag}`
      }

      const innerWithPreservedMarkup = String(inner).replace(
        /(^|>)([^<>]*\S[^<>]*)(?=<|$)/,
        (_match: string, prefix: string) => `${prefix}${esc(text)}`,
      )
      if (innerWithPreservedMarkup === inner) {
        return `${openTag}${esc(text)}${closeTag}`
      }
      return `${openTag}${innerWithPreservedMarkup}${closeTag}`
    })
  }

  const labelCell = setCellInnerText(cells[0], `${label}:`)
  const valueCell = setCellInnerText(cells[1], value)
  return `<tr${rowAttrs}>${labelCell}${valueCell}</tr>`
}

function insertRowAfterLabel(tableHtml: string, afterLabel: string, newLabel: string, newValue: string): string {
  if (!newValue.trim()) return tableHtml
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex)
  if (!rows || rows.length === 0) return tableHtml

  const alreadyHasRow = rows.some((rowHtml) => {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    return normalizedLabel.includes(normalizeText(newLabel).replace(/:$/, ""))
  })
  if (alreadyHasRow) {
    return replaceRowValueByLabel(tableHtml, newLabel, newValue)
  }

  const target = normalizeText(afterLabel).replace(/:$/, "")
  for (const rowHtml of rows) {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    if (!normalizedLabel.includes(target)) continue
    const newRow = buildInsertedRowFromReference(rowHtml, newLabel, newValue)
    return tableHtml.replace(rowHtml, `${rowHtml}${newRow}`)
  }
  return tableHtml
}

function insertRowBeforeLabel(tableHtml: string, beforeLabel: string, newLabel: string, newValue: string): string {
  if (!newValue.trim()) return tableHtml
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex)
  if (!rows || rows.length === 0) return tableHtml

  const alreadyHasRow = rows.some((rowHtml) => {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    return normalizedLabel.includes(normalizeText(newLabel).replace(/:$/, ""))
  })
  if (alreadyHasRow) {
    return replaceRowValueByLabel(tableHtml, newLabel, newValue)
  }

  const target = normalizeText(beforeLabel).replace(/:$/, "")
  for (const rowHtml of rows) {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    if (!normalizedLabel.includes(target)) continue
    const newRow = buildInsertedRowFromReference(rowHtml, newLabel, newValue)
    return tableHtml.replace(rowHtml, `${newRow}${rowHtml}`)
  }
  return tableHtml
}

function findRowHtmlByLabel(tableHtml: string, labelNeedle: string): string | null {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex) || []
  const targetLabel = normalizeText(labelNeedle).replace(/:$/, "")
  for (const rowHtml of rows) {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    if (normalizedLabel.includes(targetLabel)) return rowHtml
  }
  return null
}

function findRowHtmlByFirstCellPredicate(tableHtml: string, predicate: (normalizedFirstCell: string) => boolean): string | null {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex) || []
  for (const rowHtml of rows) {
    const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
    const normalizedLabel = normalizeText(firstCell).replace(/:$/, "")
    if (predicate(normalizedLabel)) return rowHtml
  }
  return null
}

function isFx500Label(normalizedFirstCell: string): boolean {
  return /\b500\b/.test(normalizedFirstCell) && normalizedFirstCell.includes("eur") && normalizedFirstCell.includes("arfolyam")
}

function isFx600Label(normalizedFirstCell: string): boolean {
  return /\b600\b/.test(normalizedFirstCell) && normalizedFirstCell.includes("eur") && normalizedFirstCell.includes("arfolyam")
}

function isCurrentFxLabel(normalizedFirstCell: string): boolean {
  return normalizedFirstCell.includes("jelen") && normalizedFirstCell.includes("arfolyam")
}

type TemplateRow = {
  rowHtml: string
  normalizedLabel: string
}

type CanonicalTableRow = {
  label: string
  value: string
  type: "standard" | "final" | "fxCurrent" | "fx500" | "fx600"
  include: boolean
  matchers: string[]
}

function buildCanonicalRows(values: CalculatorTableValues): CanonicalTableRow[] {
  return [
    { label: "Megtakarítási számla megnevezése", value: values.accountName, type: "standard", include: true, matchers: ["megtakaritasi szamla megnevezese"] },
    { label: "Megtakarítási számla célja", value: values.accountGoal, type: "standard", include: true, matchers: ["megtakaritasi szamla celja"] },
    { label: "Megtakarítási havi összeg", value: values.monthlyPayment, type: "standard", include: true, matchers: ["megtakaritasi havi osszeg"] },
    { label: "Megtakarítási éves összeg", value: values.yearlyPayment, type: "standard", include: true, matchers: ["megtakaritasi eves osszeg"] },
    { label: "Tervezett időtartam", value: values.years, type: "standard", include: true, matchers: ["tervezett idotartam"] },
    { label: "Teljes befizetés", value: values.totalContributions, type: "standard", include: true, matchers: ["teljes befizetes"] },
    { label: "Hozam stratégia", value: values.strategy, type: "standard", include: true, matchers: ["hozam strategia"] },
    { label: "Éves nettó hozam", value: values.annualYield, type: "standard", include: true, matchers: ["eves netto hozam"] },
    { label: "Várható hozam", value: values.totalReturn, type: "standard", include: true, matchers: ["varhato hozam"] },
    {
      label: "Adójóváírás a tartam alatt összesen",
      value: values.totalTaxCredit ?? "",
      type: "standard",
      include: Boolean(values.totalTaxCredit?.trim()),
      matchers: ["adojovairas a tartam alatt osszesen"],
    },
    {
      label: "Megtakarítás számlán várható összeg",
      value: values.endBalance,
      type: "standard",
      include: true,
      matchers: ["megtakaritas szamlan varhato osszeg"],
    },
    {
      label: "Bónuszjóváírás tartam alatt összesen",
      value: values.totalBonus ?? "",
      type: "standard",
      include: Boolean(values.totalBonus?.trim()),
      matchers: ["bonuszjovairas tartam alatt osszesen"],
    },
    {
      label: "Teljes megtakarítás nettó értéke",
      value: values.finalNet,
      type: "final",
      include: true,
      matchers: ["teljes megtakaritas netto erteke", "megtakaritasi szamlan varhato osszeg"],
    },
    {
      label: "Jelen árfolyamon számolva",
      value: values.endBalanceHufCurrent ?? "",
      type: "fxCurrent",
      include: Boolean(values.endBalanceHufCurrent?.trim()),
      matchers: ["jelen", "arfolyam"],
    },
    {
      label: "500 Ft-os Euróval számolva",
      value: values.endBalanceEUR500 ?? "",
      type: "fx500",
      include: Boolean(values.endBalanceEUR500?.trim()),
      matchers: ["500", "eur", "arfolyam"],
    },
    {
      label: "600 Ft-os Euróval számolva",
      value: values.endBalanceEUR600 ?? "",
      type: "fx600",
      include: Boolean(values.endBalanceEUR600?.trim()),
      matchers: ["600", "eur", "arfolyam"],
    },
  ]
}

function extractTemplateRows(tableHtml: string): TemplateRow[] {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const rows = tableHtml.match(rowRegex) || []
  return rows
    .map((rowHtml) => {
      const firstCell = rowHtml.match(/<(td|th)\b[^>]*>[\s\S]*?<\/\1>/i)?.[0] || ""
      return {
        rowHtml,
        normalizedLabel: normalizeText(firstCell).replace(/:$/, ""),
      }
    })
    .filter((row) => Boolean(row.normalizedLabel))
}

function findTemplateRowByMatchers(rows: TemplateRow[], matchers: string[]): TemplateRow | null {
  for (const row of rows) {
    if (matchers.every((matcher) => row.normalizedLabel.includes(matcher))) return row
  }
  return null
}

function replaceTableRows(tableHtml: string, nextRows: string[]): string {
  const rowRegex = /<tr\b[\s\S]*?<\/tr>/gi
  const matches = Array.from(tableHtml.matchAll(rowRegex))
  if (matches.length === 0) return tableHtml
  const first = matches[0]
  const last = matches[matches.length - 1]
  const firstIndex = first.index ?? 0
  const lastIndex = last.index ?? 0
  const lastEnd = lastIndex + last[0].length
  return `${tableHtml.slice(0, firstIndex)}${nextRows.join("")}${tableHtml.slice(lastEnd)}`
}

function toSixHex(hex: string): string {
  const normalized = hex.trim().replace(/^#/, "")
  if (normalized.length === 3) {
    return normalized
      .split("")
      .map((ch) => `${ch}${ch}`)
      .join("")
  }
  return normalized
}

function darkenHex(hex: string, ratio = 0.12): string {
  const normalized = toSixHex(hex)
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `#${normalized}`
  const r = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(0, 2), 16) * (1 - ratio))))
  const g = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(2, 4), 16) * (1 - ratio))))
  const b = Math.max(0, Math.min(255, Math.round(Number.parseInt(normalized.slice(4, 6), 16) * (1 - ratio))))
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function parseRgbColor(input: string): [number, number, number] | null {
  const match = input.match(/rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i)
  if (!match) return null
  const r = Number(match[1])
  const g = Number(match[2])
  const b = Number(match[3])
  if (![r, g, b].every((v) => Number.isFinite(v) && v >= 0 && v <= 255)) return null
  return [r, g, b]
}

function darkenColor(input: string, ratio = 0.12): string {
  const hexMatch = input.match(/#[0-9a-fA-F]{3,6}/)
  if (hexMatch) return darkenHex(hexMatch[0], ratio)
  const rgb = parseRgbColor(input)
  if (!rgb) return input
  const [r, g, b] = rgb
  const dr = Math.max(0, Math.min(255, Math.round(r * (1 - ratio))))
  const dg = Math.max(0, Math.min(255, Math.round(g * (1 - ratio))))
  const db = Math.max(0, Math.min(255, Math.round(b * (1 - ratio))))
  return `rgb(${dr}, ${dg}, ${db})`
}

function normalizeHexColor(input: string): string | null {
  const raw = String(input ?? "").trim()
  if (!raw) return null
  const match = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
  if (!match) return null
  return `#${toSixHex(match[1]).toLowerCase()}`
}

function buildFxPalette(baseColor: string): { fxCurrent: string; fx500: string; fx600: string } {
  return {
    fxCurrent: baseColor,
    fx500: darkenColor(baseColor, 0.12),
    fx600: darkenColor(baseColor, 0.24),
  }
}

function extractBackgroundColor(rowHtml: string): string | null {
  const styleColor = rowHtml.match(/background(?:-color)?\s*:\s*(#[0-9a-fA-F]{3,6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))/i)?.[1]
  if (styleColor) return styleColor
  const bgAttrColor = rowHtml.match(/\bbgcolor\s*=\s*["'](#[0-9a-fA-F]{3,6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))["']/i)?.[1]
  return bgAttrColor || null
}

function appendBackgroundToCellOpenTag(cellOpenTag: string, color: string): string {
  const hasStyle = /\bstyle\s*=\s*["'][^"']*["']/i.test(cellOpenTag)
  if (!hasStyle) {
    return cellOpenTag.replace(/>$/, ` style="background-color:${color};">`)
  }
  return cellOpenTag.replace(/\bstyle\s*=\s*(["'])([^"']*)\1/i, (_m, quote: string, style: string) => {
    const nextStyle = /background(?:-color)?\s*:/.test(style)
      ? style.replace(/background(?:-color)?\s*:\s*#[0-9a-fA-F]{3,6}/gi, `background-color:${color}`)
      : `${style};background-color:${color}`
    return `style=${quote}${nextStyle}${quote}`
  })
}

function applyFxRowBackground(rowHtml: string, color: string): string {
  let next = rowHtml
  next = next.replace(
    /(background(?:-color)?\s*:\s*)(#[0-9a-fA-F]{3,6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))/gi,
    `$1${color}`,
  )
  next = next.replace(
    /(\bbgcolor\s*=\s*["'])(#[0-9a-fA-F]{3,6}|rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\))(["'])/gi,
    `$1${color}$3`,
  )

  const hasAnyBackground = /background(?:-color)?\s*:|bgcolor\s*=/i.test(next)
  if (!hasAnyBackground) {
    next = next.replace(/^<tr\b([^>]*)>/i, (_m, attrs: string) => {
      const hasStyle = /\bstyle\s*=\s*["'][^"']*["']/i.test(attrs)
      if (!hasStyle) return `<tr${attrs} style="background-color:${color};">`
      const replacedAttrs = attrs.replace(/\bstyle\s*=\s*(["'])([^"']*)\1/i, (_m2, q: string, style: string) => {
        const nextStyle = `${style};background-color:${color}`
        return `style=${q}${nextStyle}${q}`
      })
      return `<tr${replacedAttrs}>`
    })
    next = next.replace(/<(td|th)\b[^>]*>/gi, (openTag) => appendBackgroundToCellOpenTag(openTag, color))
  }
  return next
}

function darkenFxRow(rowHtml: string, fallbackHex?: string): string {
  const baseColor = extractBackgroundColor(rowHtml) || fallbackHex
  if (!baseColor) return rowHtml
  return applyFxRowBackground(rowHtml, darkenColor(baseColor, 0.12))
}

export function buildCalculatorTableHtml(values: CalculatorTableValues): string {
  const rows = [
    row("Megtakarítási számla megnevezése", values.accountName),
    row("Megtakarítási számla célja", values.accountGoal),
    row("Megtakarítási havi összeg", values.monthlyPayment),
    row("Megtakarítási éves összeg", values.yearlyPayment),
    row("Tervezett időtartam", values.years),
    row("Teljes befizetés", values.totalContributions),
    row("Hozam stratégia", values.strategy),
    row("Éves nettó hozam", values.annualYield),
    row("Várható hozam", values.totalReturn),
    ...(values.totalTaxCredit?.trim() ? [row("Adójóváírás a tartam alatt összesen", values.totalTaxCredit)] : []),
    row("Megtakarítás számlán várható összeg", values.endBalance),
  ]
  if (values.totalBonus?.trim()) {
    rows.push(row("Bónuszjóváírás tartam alatt összesen", values.totalBonus))
  }
  rows.push(
    `<tr><td style="padding:9px 10px; border:1px solid #9ca3af; text-align:left; font-size:14px; color:#111827; font-weight:700; background:#f3f4f6;">Teljes megtakarítás nettó értéke</td><td style="padding:9px 10px; border:1px solid #9ca3af; text-align:right; font-size:14px; color:#111827; font-weight:700; background:#f3f4f6;">${esc(values.finalNet)}</td></tr>`,
  )
  if (values.endBalanceHufCurrent?.trim()) {
    rows.push(row("Jelen árfolyamon számolva", values.endBalanceHufCurrent))
  }
  if (values.endBalanceEUR500?.trim()) {
    rows.push(row("500 Ft-os Euróval számolva", values.endBalanceEUR500))
  }
  if (values.endBalanceEUR600?.trim()) {
    rows.push(row("600 Ft-os Euróval számolva", values.endBalanceEUR600))
  }
  return `<table cellpadding="0" cellspacing="0" style="width:100%; border-collapse:collapse; margin:12px 0; font-family:Arial, Helvetica, sans-serif;">${rows.join("")}</table>`
}

export function buildCalculatorTableHtmlFromTemplate(
  values: CalculatorTableValues,
  tableTemplateHtml?: string,
  options: CalculatorTableStyleOptions = {},
): string {
  const baseTemplate = String(tableTemplateHtml ?? "").trim()
  if (!baseTemplate || !/<table\b/i.test(baseTemplate)) {
    return buildCalculatorTableHtml(values)
  }
  const tableMatch = /<table\b[\s\S]*?<\/table>/i.exec(baseTemplate)
  if (!tableMatch) return buildCalculatorTableHtml(values)
  const tableHtml = tableMatch[0]

  const templateRows = extractTemplateRows(tableHtml)
  if (templateRows.length === 0) return buildCalculatorTableHtml(values)

  const standardTemplate =
    findTemplateRowByMatchers(templateRows, ["megtakaritasi havi osszeg"]) ??
    findTemplateRowByMatchers(templateRows, ["teljes befizetes"]) ??
    templateRows.find(
      (row) =>
        !isFx500Label(row.normalizedLabel) &&
        !isFx600Label(row.normalizedLabel) &&
        !isCurrentFxLabel(row.normalizedLabel) &&
        !row.normalizedLabel.includes("teljes megtakaritas netto erteke"),
    ) ??
    templateRows[0]
  const finalTemplate =
    templateRows.find((row) => row.normalizedLabel.includes("teljes megtakaritas netto erteke")) ??
    templateRows.find((row) => row.normalizedLabel.includes("megtakaritasi szamlan varhato osszeg")) ??
    standardTemplate
  const fxTemplate =
    templateRows.find((row) => isCurrentFxLabel(row.normalizedLabel) || isFx500Label(row.normalizedLabel) || isFx600Label(row.normalizedLabel)) ??
    finalTemplate ??
    standardTemplate
  const fxFallbackBackground = extractBackgroundColor(fxTemplate?.rowHtml || "") || extractBackgroundColor(finalTemplate?.rowHtml || "")
  const normalizedFxBaseColor = normalizeHexColor(options.fxBaseColor ?? "")
  const fxPalette = normalizedFxBaseColor ? buildFxPalette(normalizedFxBaseColor) : null

  const rows = buildCanonicalRows(values).filter((item) => item.include)
  const renderedRows = rows
    .map((item) => {
      const exact = findTemplateRowByMatchers(templateRows, item.matchers)
      const templateRow =
        item.type === "fx500"
          ? templateRows.find((row) => isFx500Label(row.normalizedLabel)) ?? exact ?? fxTemplate ?? finalTemplate ?? standardTemplate
          : item.type === "fx600"
            ? templateRows.find((row) => isFx600Label(row.normalizedLabel)) ?? exact ?? fxTemplate ?? finalTemplate ?? standardTemplate
            : item.type === "fxCurrent"
              ? templateRows.find((row) => isCurrentFxLabel(row.normalizedLabel)) ?? exact ?? fxTemplate ?? finalTemplate ?? standardTemplate
              : item.type === "final"
                ? exact ?? finalTemplate ?? standardTemplate
                : exact ?? standardTemplate ?? finalTemplate ?? fxTemplate
      if (!templateRow) return ""
      const rowHtml = buildInsertedRowFromReference(templateRow.rowHtml, item.label, item.value)
      if (item.type === "fxCurrent" || item.type === "fx500" || item.type === "fx600") {
        if (fxPalette) {
          const color = item.type === "fxCurrent" ? fxPalette.fxCurrent : item.type === "fx500" ? fxPalette.fx500 : fxPalette.fx600
          return applyFxRowBackground(rowHtml, color)
        }
        return darkenFxRow(rowHtml, fxFallbackBackground || undefined)
      }
      return rowHtml
    })
    .filter(Boolean)

  if (renderedRows.length === 0) return buildCalculatorTableHtml(values)

  const rebuiltTable = replaceTableRows(tableHtml, renderedRows)
  const start = tableMatch.index ?? 0
  const end = start + tableMatch[0].length
  return `${baseTemplate.slice(0, start)}${rebuiltTable}${baseTemplate.slice(end)}`
}

export function buildCalculatorTablePlain(values: CalculatorTableValues): string {
  const lines = [
    `Megtakarítási számla megnevezése: ${values.accountName}`,
    `Megtakarítási számla célja: ${values.accountGoal}`,
    `Megtakarítási havi összeg: ${values.monthlyPayment}`,
    `Megtakarítási éves összeg: ${values.yearlyPayment}`,
    `Tervezett időtartam: ${values.years}`,
    `Teljes befizetés: ${values.totalContributions}`,
    `Hozam stratégia: ${values.strategy}`,
    `Éves nettó hozam: ${values.annualYield}`,
    `Várható hozam: ${values.totalReturn}`,
    ...(values.totalTaxCredit?.trim() ? [`Adójóváírás a tartam alatt összesen: ${values.totalTaxCredit}`] : []),
    `Megtakarítás számlán várható összeg: ${values.endBalance}`,
  ]
  if (values.totalBonus?.trim()) {
    lines.push(`Bónuszjóváírás tartam alatt összesen: ${values.totalBonus}`)
  }
  lines.push(`Teljes megtakarítás nettó értéke: ${values.finalNet}`)
  if (values.endBalanceHufCurrent?.trim()) {
    lines.push(`Jelen árfolyamon számolva: ${values.endBalanceHufCurrent}`)
  }
  if (values.endBalanceEUR500?.trim()) {
    lines.push(`500 Ft-os Euróval számolva: ${values.endBalanceEUR500}`)
  }
  if (values.endBalanceEUR600?.trim()) {
    lines.push(`600 Ft-os Euróval számolva: ${values.endBalanceEUR600}`)
  }
  return lines.join("\n")
}
