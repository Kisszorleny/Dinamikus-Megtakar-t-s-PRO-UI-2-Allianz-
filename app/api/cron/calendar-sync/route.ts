import { NextResponse } from "next/server"
import { getCalendarAutoSyncEnabled } from "@/lib/leads/repository"

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret) {
      const auth = request.headers.get("authorization") ?? ""
      if (auth !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
      }
    }

    const enabled = await getCalendarAutoSyncEnabled()
    if (!enabled) {
      return NextResponse.json({ ok: true, skipped: true, reason: "auto-sync disabled" })
    }

    const syncUrl = new URL("/api/leads/sync/calendar", request.url)
    const syncRes = await fetch(syncUrl, {
      method: "POST",
      headers: { "x-internal-sync": "1" },
    })
    const result = (await syncRes.json().catch(() => ({}))) as Record<string, unknown>
    if (!syncRes.ok || !result?.ok) {
      throw new Error(typeof result?.message === "string" ? result.message : "Naptár sync hiba.")
    }
    return NextResponse.json({ ok: true, skipped: false, result })
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : "Ismeretlen cron sync hiba." },
      { status: 500 },
    )
  }
}
