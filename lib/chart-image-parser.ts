import type { ParsedChartSeries } from "@/lib/chart-series"

const DEFAULT_MIN_PERCENT = -80
const DEFAULT_MAX_PERCENT = 360
const DEFAULT_YEARS = 6
const CHART_LEFT_RATIO = 0.03
const CHART_RIGHT_RATIO = 0.92
const CHART_TOP_RATIO = 0.06
const CHART_BOTTOM_RATIO = 0.94
const MAX_VERTICAL_JUMP_PX = 22

type PercentLabel = {
  value: number
  y: number
}

type OcrWord = {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

function toIsoDate(d: Date): string {
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function parseDateToken(text: string): Date | null {
  const m = text.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})\.?$/)
  if (!m) return null
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return Number.isNaN(date.getTime()) ? null : date
}

function parsePercentToken(text: string): number | null {
  const normalized = text.replace(/\s/g, "").replace(",", ".")
  const m = normalized.match(/(-?\d+(?:\.\d+)?)%/)
  if (!m) return null
  const value = Number(m[1])
  return Number.isFinite(value) ? value : null
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const rf = r / 255
  const gf = g / 255
  const bf = b / 255
  const cMax = Math.max(rf, gf, bf)
  const cMin = Math.min(rf, gf, bf)
  const delta = cMax - cMin

  let h = 0
  if (delta !== 0) {
    if (cMax === rf) h = 60 * (((gf - bf) / delta) % 6)
    else if (cMax === gf) h = 60 * ((bf - rf) / delta + 2)
    else h = 60 * ((rf - gf) / delta + 4)
  }
  if (h < 0) h += 360

  const s = cMax === 0 ? 0 : delta / cMax
  const v = cMax
  return [h, s, v]
}

function isPurpleLinePixel(r: number, g: number, b: number): boolean {
  const [h, s, v] = rgbToHsv(r, g, b)
  return h >= 255 && h <= 330 && s >= 0.28 && v >= 0.2 && r > g
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) return (sorted[mid - 1] + sorted[mid]) / 2
  return sorted[mid]
}

function interpolateMissing(values: Array<number | null>): number[] {
  const result = [...values]
  let lastKnownIndex = -1
  for (let i = 0; i < result.length; i++) {
    if (result[i] === null) continue
    if (lastKnownIndex === -1) {
      for (let j = 0; j < i; j++) result[j] = result[i]
    } else if (i - lastKnownIndex > 1) {
      const start = result[lastKnownIndex] as number
      const end = result[i] as number
      const gap = i - lastKnownIndex
      for (let j = 1; j < gap; j++) result[lastKnownIndex + j] = start + ((end - start) * j) / gap
    }
    lastKnownIndex = i
  }
  if (lastKnownIndex === -1) return new Array(result.length).fill(0)
  const tailValue = result[lastKnownIndex] as number
  for (let i = lastKnownIndex + 1; i < result.length; i++) result[i] = tailValue
  return result.map((v) => (v === null ? tailValue : v))
}

function closestTo(ys: number[], target: number): number {
  let best = ys[0]
  let bestDist = Math.abs(ys[0] - target)
  for (let i = 1; i < ys.length; i++) {
    const dist = Math.abs(ys[i] - target)
    if (dist < bestDist) {
      best = ys[i]
      bestDist = dist
    }
  }
  return best
}

function fitLinear(labels: PercentLabel[]): { slope: number; intercept: number } | null {
  if (labels.length < 2) return null
  let sumX = 0
  let sumY = 0
  let sumXY = 0
  let sumX2 = 0
  for (const label of labels) {
    sumX += label.y
    sumY += label.value
    sumXY += label.y * label.value
    sumX2 += label.y * label.y
  }
  const n = labels.length
  const denom = n * sumX2 - sumX * sumX
  if (Math.abs(denom) < 1e-6) return null
  const slope = (n * sumXY - sumX * sumY) / denom
  const intercept = (sumY - slope * sumX) / n
  return { slope, intercept }
}

function inferDateRange(text: string): { startDate: string; endDate: string; parsed: boolean } {
  const tokens = text.match(/\d{4}[./-]\d{1,2}[./-]\d{1,2}\.?/g) ?? []
  const dates = tokens.map(parseDateToken).filter((d): d is Date => d !== null).sort((a, b) => a.getTime() - b.getTime())
  if (dates.length >= 2) {
    return { startDate: toIsoDate(dates[0]), endDate: toIsoDate(dates[dates.length - 1]), parsed: true }
  }
  const end = new Date()
  const start = new Date(Date.UTC(end.getUTCFullYear() - DEFAULT_YEARS, end.getUTCMonth(), end.getUTCDate()))
  return { startDate: toIsoDate(start), endDate: toIsoDate(end), parsed: false }
}

function buildSourceHash(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

async function loadImage(file: File): Promise<HTMLImageElement> {
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = new Image()
    img.decoding = "async"
    const done = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("A kép betöltése sikertelen."))
    })
    img.src = objectUrl
    await done
    return img
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

function cropCanvas(source: HTMLCanvasElement, x: number, y: number, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.floor(width))
  canvas.height = Math.max(1, Math.floor(height))
  const ctx = canvas.getContext("2d")
  if (!ctx) return canvas
  ctx.drawImage(source, x, y, width, height, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function runOcr(
  canvas: HTMLCanvasElement,
): Promise<{ text: string; percentWords: OcrWord[]; dateWords: OcrWord[] }> {
  const tesseract = await import("tesseract.js")
  const worker = await tesseract.createWorker("eng")
  try {
    const width = canvas.width
    const height = canvas.height

    const rightAxisCanvas = cropCanvas(
      canvas,
      Math.floor(width * 0.78),
      Math.floor(height * 0.08),
      Math.floor(width * 0.22),
      Math.floor(height * 0.88),
    )
    const headerCanvas = cropCanvas(canvas, 0, 0, Math.floor(width * 0.7), Math.floor(height * 0.22))

    const percentResult = await worker.recognize(rightAxisCanvas)
    const dateResult = await worker.recognize(headerCanvas)

    const percentData = percentResult.data as any
    const dateData = dateResult.data as any

    const percentWords: OcrWord[] = (percentData.words ?? []).map((word: any) => ({
      text: word.text ?? "",
      bbox: {
        x0: word.bbox.x0 + Math.floor(width * 0.78),
        y0: word.bbox.y0 + Math.floor(height * 0.08),
        x1: word.bbox.x1 + Math.floor(width * 0.78),
        y1: word.bbox.y1 + Math.floor(height * 0.08),
      },
    }))
    const dateWords: OcrWord[] = (dateData.words ?? []).map((word: any) => ({
      text: word.text ?? "",
      bbox: word.bbox,
    }))

    const text = [dateData.text ?? "", percentData.text ?? ""].join(" ")
    return { text, percentWords, dateWords }
  } finally {
    await worker.terminate()
  }
}

function resampleDailyPrices(cumulativeByX: number[], startDate: string, endDate: string): Array<{ date: string; price: number }> {
  const start = new Date(`${startDate}T00:00:00Z`)
  const end = new Date(`${endDate}T00:00:00Z`)
  const days = Math.max(2, Math.round((end.getTime() - start.getTime()) / 86400000) + 1)

  const maxIndex = cumulativeByX.length - 1
  const output: Array<{ date: string; price: number }> = []
  for (let day = 0; day < days; day++) {
    const t = days === 1 ? 0 : day / (days - 1)
    const srcPos = t * maxIndex
    const left = Math.floor(srcPos)
    const right = Math.min(maxIndex, left + 1)
    const frac = srcPos - left
    const cumulativePercent = cumulativeByX[left] + (cumulativeByX[right] - cumulativeByX[left]) * frac
    const price = Math.max(0.000001, 1 + cumulativePercent / 100)
    const date = new Date(start.getTime() + day * 86400000)
    output.push({ date: toIsoDate(date), price })
  }
  return output
}

function computeAnnualizedYield(points: Array<{ date: string; price: number }>): number {
  if (points.length < 2) return 0
  const first = points[0]
  const last = points[points.length - 1]
  if (first.price <= 0 || last.price <= 0) return 0
  const firstTime = new Date(`${first.date}T00:00:00Z`).getTime()
  const lastTime = new Date(`${last.date}T00:00:00Z`).getTime()
  const years = Math.max((lastTime - firstTime) / (365 * 86400000), 1 / 365)
  return (Math.pow(last.price / first.price, 1 / years) - 1) * 100
}

export async function parseChartImageToSeries(file: File): Promise<ParsedChartSeries> {
  const image = await loadImage(file)
  const canvas = document.createElement("canvas")
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("A kép feldolgozásához nem érhető el canvas context.")
  ctx.drawImage(image, 0, 0)

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = imageData.data
  const width = canvas.width
  const height = canvas.height

  const scanXStart = Math.floor(width * CHART_LEFT_RATIO)
  const scanXEnd = Math.floor(width * CHART_RIGHT_RATIO)
  const scanYStart = Math.floor(height * CHART_TOP_RATIO)
  const scanYEnd = Math.floor(height * CHART_BOTTOM_RATIO)

  const yCandidatesByColumn: Array<number[]> = new Array(width).fill(0).map(() => [])
  let xMin = scanXEnd
  let xMax = scanXStart
  let detectedColumns = 0

  for (let x = scanXStart; x <= scanXEnd; x++) {
    const ys: number[] = []
    for (let y = scanYStart; y <= scanYEnd; y++) {
      const idx = (y * width + x) * 4
      const r = data[idx]
      const g = data[idx + 1]
      const b = data[idx + 2]
      if (isPurpleLinePixel(r, g, b)) ys.push(y)
    }
    if (ys.length > 0) {
      yCandidatesByColumn[x] = ys
      xMin = Math.min(xMin, x)
      xMax = Math.max(xMax, x)
      detectedColumns++
    }
  }

  if (detectedColumns < Math.max(50, Math.floor(width * 0.1))) {
    throw new Error("A görbe nem felismerhető megbízhatóan a képen.")
  }

  const yByColumn: Array<number | null> = []
  let prevY: number | null = null
  let trackedColumns = 0
  for (let x = xMin; x <= xMax; x++) {
    const ys = yCandidatesByColumn[x]
    if (!ys || ys.length === 0) {
      yByColumn.push(null)
      continue
    }
    let selectedY = median(ys)
    if (prevY !== null) {
      const closest = closestTo(ys, prevY)
      if (Math.abs(closest - prevY) <= MAX_VERTICAL_JUMP_PX) selectedY = closest
    }
    prevY = selectedY
    yByColumn.push(selectedY)
    trackedColumns++
  }

  const interpolatedY = interpolateMissing(yByColumn)
  const { text, percentWords, dateWords } = await runOcr(canvas)

  const labels: PercentLabel[] = []
  for (const word of percentWords) {
    const parsed = parsePercentToken(word.text)
    if (parsed === null) continue
    if (parsed < -100 || parsed > 420) continue
    const y = (word.bbox.y0 + word.bbox.y1) / 2
    labels.push({ value: parsed, y })
  }

  const tickLabels = labels.filter((label) => Math.abs(label.value / 20 - Math.round(label.value / 20)) < 0.12)
  const linear = fitLinear(tickLabels)
  const fallbackMin = tickLabels.length > 0 ? Math.min(...tickLabels.map((l) => l.value)) : DEFAULT_MIN_PERCENT
  const fallbackMax = tickLabels.length > 0 ? Math.max(...tickLabels.map((l) => l.value)) : DEFAULT_MAX_PERCENT
  const valueRange = Math.max(1, fallbackMax - fallbackMin)

  const cumulativeByX = interpolatedY.map((y) => {
    if (linear) return linear.slope * y + linear.intercept
    const normalized = 1 - y / Math.max(1, height - 1)
    return fallbackMin + normalized * valueRange
  })

  const dateText = dateWords.map((w) => w.text).join(" ")
  const dateRange = inferDateRange(dateText || text)
  const points = resampleDailyPrices(cumulativeByX, dateRange.startDate, dateRange.endDate)
  const derivedAnnualYieldPercent = computeAnnualizedYield(points)
  const coverage = trackedColumns / Math.max(1, xMax - xMin + 1)
  const confidence = Math.max(
    0,
    Math.min(1, 0.6 * Math.min(1, coverage) + 0.3 * Math.min(1, tickLabels.length / 6) + 0.1 * (dateRange.parsed ? 1 : 0)),
  )

  const diagnostics: string[] = []
  if (!dateRange.parsed) diagnostics.push("A dátumtartomány OCR-rel nem volt egyértelmű, becsült időablakot használtunk.")
  if (tickLabels.length < 2) diagnostics.push("A jobb oldali százalék tengely címkéi részben felismerhetők.")
  if (coverage < 0.55) diagnostics.push("A görbe lefedettsége alacsony, ezért bizonytalanabb az idősor.")

  return {
    source: "image-upload",
    sourceImageHash: buildSourceHash(file),
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    confidence,
    derivedAnnualYieldPercent,
    points,
    diagnostics,
  }
}
