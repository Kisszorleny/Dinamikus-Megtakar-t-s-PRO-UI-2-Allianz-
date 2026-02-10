import { NextResponse } from "next/server"

const KSH_URL = "https://www.ksh.hu/stadat_files/ara/en/ara0002.html"

const stripText = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim()

export async function GET() {
  try {
    const response = await fetch(KSH_URL, { next: { revalidate: 60 * 60 * 24 } })
    if (!response.ok) {
      return NextResponse.json({ error: "KSH fetch failed" }, { status: 502 })
    }

    const html = await response.text()
    const rows = Array.from(html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)).map((match) => match[1])

    let totalIndex = -1
    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)).map((m) =>
        stripText(m[1]),
      )
      if (cells.length === 0) continue
      const yearIndex = cells.findIndex((cell) => cell.toLowerCase() === "year")
      const totalIdx = cells.findIndex((cell) => cell.toLowerCase() === "total")
      if (yearIndex !== -1 && totalIdx !== -1) {
        totalIndex = totalIdx
        break
      }
    }

    if (totalIndex === -1) {
      return NextResponse.json({ error: "KSH parse failed" }, { status: 502 })
    }

    let latestYear = 0
    let latestTotal = 0

    for (const row of rows) {
      const cells = Array.from(row.matchAll(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi)).map((m) =>
        stripText(m[1]),
      )
      if (cells.length <= totalIndex) continue
      const year = Number(cells[0])
      if (!Number.isFinite(year) || year < 1900) continue
      const totalRaw = cells[totalIndex].replace(",", ".")
      const totalValue = Number(totalRaw)
      if (!Number.isFinite(totalValue)) continue
      if (year > latestYear) {
        latestYear = year
        latestTotal = totalValue
      }
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
    })
  } catch (error) {
    return NextResponse.json({ error: "KSH fetch error" }, { status: 502 })
  }
}
