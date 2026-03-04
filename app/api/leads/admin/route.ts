import { NextResponse } from "next/server"
import { z } from "zod"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import { leadUpdateSchema } from "@/lib/leads/schema"
import { deleteLeadById, deleteLeadsBySourceTypes, listLeads, updateLeadById } from "@/lib/leads/repository"

const EDITABLE_LEAD_UPDATE_KEYS = new Set([
  "source",
  "requestType",
  "contactName",
  "contactEmail",
  "contactPhone",
  "birthDate",
  "ageText",
  "callTime",
  "note",
  "subject",
  "costFlag",
  "tax20Flag",
  "netFlag",
  "savingsAmountText",
  "goalText",
  "durationText",
  "deadlineDate",
  "deadlineReason",
  "owner",
  "paidFlag",
  "leadTypeText",
  "clientNumber",
  "helpNeeded",
  "leadsPerDay",
  "dayText",
  "timeText",
  "followupNote",
  "reportText",
  "revisitText",
  "formPayload",
  "calcSnapshot",
  "calcSummary",
])

function assertAdmin(request: Request) {
  const user = getSessionUserFromRequest(request)
  if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
    throw new Error("unauthorized")
  }
}

export async function GET(request: Request) {
  try {
    try {
      assertAdmin(request)
    } catch {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    const url = new URL(request.url)
    const sourceType = url.searchParams.get("sourceType") ?? undefined
    const search = url.searchParams.get("q") ?? undefined
    const limit = Number(url.searchParams.get("limit") ?? "300")

    const leads = await listLeads({ sourceType, search, limit: Number.isFinite(limit) ? limit : 300 })
    return NextResponse.json({ ok: true, leads })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen hiba." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    try {
      assertAdmin(request)
    } catch {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    let payloadRaw: unknown
    try {
      payloadRaw = await request.json()
    } catch {
      return NextResponse.json({ ok: false, message: "Hibás kérés." }, { status: 400 })
    }

    const parsed = leadUpdateSchema.safeParse(payloadRaw)
    if (!parsed.success) {
      return NextResponse.json(
        {
          ok: false,
          message: "Hibás mezők.",
          issues: parsed.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
        },
        { status: 400 },
      )
    }

    const { id, ...rest } = parsed.data
    const safePatch = Object.fromEntries(Object.entries(rest).filter(([key]) => EDITABLE_LEAD_UPDATE_KEYS.has(key)))
    await updateLeadById(id, safePatch)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen hiba." },
      { status: 500 },
    )
  }
}

export async function DELETE(request: Request) {
  try {
    try {
      assertAdmin(request)
    } catch {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    const url = new URL(request.url)
    const deleteId = url.searchParams.get("id")
    if (deleteId) {
      const parsedId = z.string().uuid().safeParse(deleteId)
      if (!parsedId.success) {
        return NextResponse.json({ ok: false, message: "Érvénytelen lead azonosító." }, { status: 400 })
      }
      const result = await deleteLeadById(parsedId.data)
      if (result.count === 0) {
        return NextResponse.json({ ok: false, message: "Lead nem található." }, { status: 404 })
      }
      return NextResponse.json({ ok: true, deleted: result.count, scope: "single" })
    }

    const scope = url.searchParams.get("scope") ?? "imported"

    if (scope === "all") {
      const result = await deleteLeadsBySourceTypes(["landing_form", "manual_import", "sheets", "app_edit"])
      return NextResponse.json({ ok: true, deleted: result.count, scope: "all" })
    }

    const result = await deleteLeadsBySourceTypes(["manual_import", "sheets"])
    return NextResponse.json({ ok: true, deleted: result.count, scope: "imported" })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen hiba." },
      { status: 500 },
    )
  }
}
