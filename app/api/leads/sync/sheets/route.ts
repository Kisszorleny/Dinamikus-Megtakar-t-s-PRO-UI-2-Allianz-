import { NextResponse } from "next/server"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import { fetchLeadSheetRows } from "@/lib/integrations/google/sheets/client"
import { deleteSheetsLeadsMissingRowIds, listLeads, upsertSheetsLeadsByRowId } from "@/lib/leads/repository"
import { mapRowObjectToManualLead } from "@/lib/leads/manual-sheet-mapper"

export async function POST(request: Request) {
  try {
    const user = getSessionUserFromRequest(request)
    if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    let mode: "pull" | "push" | "both" = "both"
    try {
      const json = await request.json()
      if (json?.mode === "pull" || json?.mode === "push" || json?.mode === "both") {
        mode = json.mode
      }
    } catch {
      // keep default
    }

    let pulled = 0
    let pushed = 0
    let created = 0
    let updated = 0
    let unchanged = 0
    let deleted = 0
    let deleteSafetySkipped = false
    let deleteCandidateCount = 0
    let deleteTotalManaged = 0
    let pushSkipped = false

    if (mode === "pull" || mode === "both") {
      const rows = await fetchLeadSheetRows()
      const mapped = rows
        .map((row, index) => mapRowObjectToManualLead(row, index))
        .filter((lead): lead is NonNullable<typeof lead> => Boolean(lead))
      const result = await upsertSheetsLeadsByRowId(mapped)
      pulled = result.count
      created = result.created
      updated = result.updated
      unchanged = Math.max(0, result.count - result.created - result.updated)

      const activeRowIds = mapped
        .map((lead) => lead.sheetRowId?.trim())
        .filter((rowId): rowId is string => Boolean(rowId))
      if (mapped.length > 0) {
        const deletedResult = await deleteSheetsLeadsMissingRowIds(activeRowIds)
        deleted = deletedResult.deleted
        deleteSafetySkipped = deletedResult.skippedSafety
        deleteCandidateCount = deletedResult.candidateCount
        deleteTotalManaged = deletedResult.totalManagedCount
      }
    }

    if (mode === "push" || mode === "both") {
      // Safety guard:
      // This project's Google Sheet is managed by a custom Apps Script with fixed column indexes.
      // Rewriting headers/content from here can desync that structure, so app-side push is intentionally skipped.
      await listLeads({ limit: 1, sourceType: "manual_import" })
      pushed = 0
      pushSkipped = true
    }

    return NextResponse.json({
      ok: true,
      mode,
      pulled,
      pushed,
      created,
      updated,
      unchanged,
      deleted,
      deleteSafetySkipped,
      deleteCandidateCount,
      deleteTotalManaged,
      pushSkipped,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Ismeretlen sheets sync hiba."
    return NextResponse.json({ ok: false, message }, { status: 500 })
  }
}
