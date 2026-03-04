import { NextResponse } from "next/server"
import { getSessionUserFromRequest, hasLeadAccessFromRequest } from "@/lib/auth-session"
import { getCalendarAutoSyncEnabled, setCalendarAutoSyncEnabled } from "@/lib/leads/repository"

export async function GET(request: Request) {
  try {
    const user = getSessionUserFromRequest(request)
    if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }
    const enabled = await getCalendarAutoSyncEnabled()
    return NextResponse.json({ ok: true, enabled })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen auto-sync hiba." },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getSessionUserFromRequest(request)
    if (!user?.isAdmin || !hasLeadAccessFromRequest(request)) {
      return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
    }
    const body = (await request.json().catch(() => ({}))) as { enabled?: unknown }
    if (typeof body.enabled !== "boolean") {
      return NextResponse.json({ ok: false, message: "Hiányzó vagy hibás 'enabled' érték." }, { status: 400 })
    }
    await setCalendarAutoSyncEnabled(body.enabled)
    return NextResponse.json({ ok: true, enabled: body.enabled })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen auto-sync mentési hiba." },
      { status: 500 },
    )
  }
}
