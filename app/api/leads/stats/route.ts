import { NextResponse } from "next/server"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import { getLeadMonthsWithData, getLeadStatsSummary } from "@/lib/leads/repository"

const SOURCE_TYPE_VALUES = ["landing_form", "manual_import", "sheets", "app_edit"] as const

export async function GET(request: Request) {
  try {
    const user = getSessionUserFromRequest(request)
    if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }

    const url = new URL(request.url)
    const month = url.searchParams.get("month")?.trim()
    if (month && !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ ok: false, message: "Hibas month parameter. Varhato formatum: YYYY-MM." }, { status: 400 })
    }
    const sourceType = url.searchParams.get("sourceType")?.trim()
    if (sourceType && !SOURCE_TYPE_VALUES.includes(sourceType as (typeof SOURCE_TYPE_VALUES)[number])) {
      return NextResponse.json(
        { ok: false, message: "Hibas sourceType parameter. Ervenyes: landing_form, manual_import, sheets, app_edit." },
        { status: 400 },
      )
    }

    const resolvedSourceType = sourceType ? (sourceType as (typeof SOURCE_TYPE_VALUES)[number]) : undefined
    const [stats, monthsWithData] = await Promise.all([
      getLeadStatsSummary({
        monthKey: month || undefined,
        sourceType: resolvedSourceType,
      }),
      getLeadMonthsWithData({ sourceType: resolvedSourceType }),
    ])
    return NextResponse.json({ ok: true, stats, monthsWithData })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen hiba." },
      { status: 500 },
    )
  }
}
