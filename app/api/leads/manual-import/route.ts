import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import { mapRowObjectToManualLead } from "@/lib/leads/manual-sheet-mapper"
import { upsertManualLeads } from "@/lib/leads/repository"

function parseCsvWithHungarianHeaders(raw: string) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
  if (lines.length < 2) return []

  const headers = lines[0].split(";").map((header) => header.trim())
  return lines.slice(1).map((line, index) => {
    const values = line.split(";")
    const row: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      row[header] = values[i]?.trim() ?? ""
    })
    row._sheetRowId = String(index + 2)
    return row
  })
}

function parseSpreadsheet(buffer: ArrayBuffer, fileName: string) {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return parseCsvWithHungarianHeaders(Buffer.from(buffer).toString("utf8"))
  }

  const workbook = XLSX.read(buffer, { type: "array" })
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" })
  return rows.map((row, idx) => ({ ...row, _sheetRowId: String(idx + 2) }))
}

export async function POST(request: Request) {
  try {
    const user = getSessionUserFromRequest(request)
    if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file")
    const previewOnly = String(formData.get("previewOnly") ?? "true") === "true"
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, message: "Hiányzó file." }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const rows = parseSpreadsheet(buffer, file.name)
  const mapped = rows
    .map((row, index) => mapRowObjectToManualLead(row, index))
    .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead))

    if (previewOnly) {
      return NextResponse.json({
        ok: true,
        previewOnly: true,
        totalRows: mapped.length,
        sample: mapped.slice(0, 20),
      })
    }

    const result = await upsertManualLeads(mapped)
    return NextResponse.json({
      ok: true,
      previewOnly: false,
      imported: result.count,
    })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen import hiba." },
      { status: 500 },
    )
  }
}
