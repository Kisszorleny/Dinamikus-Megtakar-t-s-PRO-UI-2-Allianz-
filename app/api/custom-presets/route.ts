import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-session"
import { createCustomPreset, listCustomPresets } from "@/lib/custom-presets/repository"
import type { CustomPresetCreatePayload } from "@/lib/custom-presets/types"

export async function GET(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const scopeParam = request.nextUrl.searchParams.get("productScope")
  const productScope = scopeParam === null ? undefined : scopeParam === "" ? null : scopeParam
  const presets = await listCustomPresets(session, productScope)
  return NextResponse.json({ presets })
}

export async function POST(request: NextRequest) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  let payload: CustomPresetCreatePayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Hibás kérés." }, { status: 400 })
  }

  try {
    const preset = await createCustomPreset(session, payload)
    return NextResponse.json({ preset })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
