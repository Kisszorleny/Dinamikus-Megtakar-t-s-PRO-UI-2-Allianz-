import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-session"
import { deleteCustomPreset, updateCustomPreset } from "@/lib/custom-presets/repository"
import type { CustomPresetUpdatePayload } from "@/lib/custom-presets/types"

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const { id } = await context.params
  let payload: CustomPresetUpdatePayload
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Hibás kérés." }, { status: 400 })
  }

  try {
    const preset = await updateCustomPreset(session, id, payload)
    return NextResponse.json({ preset })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Mentési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const session = getSessionUser(request)
  if (!session) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const { id } = await context.params
  try {
    await deleteCustomPreset(session, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Törlési hiba."
    return NextResponse.json({ message }, { status: 400 })
  }
}
