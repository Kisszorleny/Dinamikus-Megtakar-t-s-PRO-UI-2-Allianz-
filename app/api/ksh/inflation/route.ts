import { NextResponse } from "next/server"

const KSH_URL = "https://www.ksh.hu/stadat_files/ara/en/ara0002.html"

type MonthlyInflationPoint = {
  year: number
  month: number
  inflationPercent: number
}

const stripText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

const normalizeHeaderCell = (value: string) =>
  stripText(value)
    .toLowerCase()
    .replace(/\./g, "")
    .replace(/[^a-z0-9]/g, "")

const parseNumberCell = (value: string): number | null => {
  const cleaned = stripText(value).replace(",", ".")
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

const monthByHeader: Record<string, number> = {
  jan: 1,
  january: 1,
  i: 1,
  feb: 2,
  february: 2,
  ii: 2,
  mar: 3,
  march: 3,
  iii: 3,
  apr: 4,
  april: 4,
  iv: 4,
  may: 5,
  v: 5,
  jun: 6,
  june: 6,
  vi: 6,
  jul: 7,
  july: 7,
  vii: 7,
  aug: 8,
  august: 8,
  viii: 8,
  sep: 9,
  sept: 9,
  september: 9,
  ix: 9,
  oct: 10,
  october: 10,
  x: 10,
  nov: 11,
  november: 11,
  xi: 11,
  dec: 12,
  december: 12,
  xii: 12,
}

export async function GET() {
  try {
    const response = await fetch(KSH_URL, { next: { revalidate: 60 * 60 * 24 } })
    if (!response.ok) {
      return NextResponse.json({ error: "KSH fetch failed" }, { status: 502 })
    }

    const html = await response.text()
    const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1])

    let totalIndex = -1
    const monthColumnIndexes = new Map<number, number>()
    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)).map((m) =>
        stripText(m[1]),
      )
      if (cells.length === 0) continue
      const yearIndex = cells.findIndex((cell) => cell.toLowerCase() === "year")
      const totalIdx = cells.findIndex((cell) => cell.toLowerCase() === "total")
      if (yearIndex !== -1 && totalIdx !== -1) {
        totalIndex = totalIdx
        cells.forEach((cell, idx) => {
          if (idx === yearIndex || idx === totalIdx) return
          const month = monthByHeader[normalizeHeaderCell(cell)]
          if (month) monthColumnIndexes.set(month, idx)
        })
        break
      }
    }

    if (totalIndex === -1) {
      return NextResponse.json({ error: "KSH parse failed" }, { status: 502 })
    }

    let latestYear = 0
    let latestTotal = 0
    const monthlySeries: MonthlyInflationPoint[] = []

    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)).map((m) =>
        stripText(m[1]),
      )
      if (cells.length <= totalIndex) continue
      const year = Number(cells[0])
      if (!Number.isFinite(year) || year < 1900) continue
      const totalValue = parseNumberCell(cells[totalIndex])
      if (!Number.isFinite(totalValue)) continue
      if (year > latestYear) {
        latestYear = year
        latestTotal = totalValue
      }

      monthColumnIndexes.forEach((columnIndex, month) => {
        if (columnIndex >= cells.length) return
        const monthValue = parseNumberCell(cells[columnIndex])
        if (!Number.isFinite(monthValue) || monthValue <= 0) return
        monthlySeries.push({
          year,
          month,
          // This table uses CPI index values (100 = no inflation for the period).
          inflationPercent: Number((monthValue - 100).toFixed(3)),
        })
      })
    }

    if (!latestYear || !latestTotal) {
      return NextResponse.json({ error: "KSH data missing" }, { status: 502 })
    }

    const inflationPercent = Number((latestTotal - 100).toFixed(1))
    return NextResponse.json({
      source: "KSH",
      year: latestYear,
      totalIndex: latestTotal,
      inflationPercent,
      monthlySeries: monthlySeries.sort((a, b) => (a.year - b.year) || (a.month - b.month)),
    })
  } catch (error) {
    return NextResponse.json({ error: "KSH fetch error" }, { status: 502 })
  }
}
