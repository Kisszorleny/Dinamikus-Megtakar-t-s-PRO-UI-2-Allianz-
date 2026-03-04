import { NextResponse } from "next/server"
import {
  encodeSessionToken,
  getLeadAccessCredential,
  getSessionUserFromRequest,
  hasLeadAccessFromRequest,
  LEAD_ACCESS_COOKIE_NAME,
} from "@/lib/auth-session"

type LeadAccessPayload = {
  code?: string
  password?: string
}

export async function GET(request: Request) {
  const user = getSessionUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
  }

  return NextResponse.json({ ok: true, unlocked: hasLeadAccessFromRequest(request) })
}

export async function POST(request: Request) {
  const user = getSessionUserFromRequest(request)
  if (!user) {
    return NextResponse.json({ ok: false, message: "Nincs jogosultság." }, { status: 401 })
  }

  let payload: LeadAccessPayload = {}
  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ ok: false, message: "Hibas keres." }, { status: 400 })
  }

  const providedCode = (payload.password ?? payload.code ?? "").trim()
  if (!providedCode) {
    return NextResponse.json({ ok: false, message: "A kod megadasa kotelezo." }, { status: 400 })
  }

  const leadCredential = getLeadAccessCredential()
  if (!leadCredential) {
    return NextResponse.json(
      { ok: false, message: "A lead feloldo kod nincs beallitva (LOGIN_USER_9 + LOGIN_PASSWORD_9)." },
      { status: 500 },
    )
  }

  if (providedCode !== leadCredential.code) {
    return NextResponse.json({ ok: false, message: "Hibas lead kod." }, { status: 401 })
  }

  const leadToken = encodeSessionToken(leadCredential.username, leadCredential.code)
  const response = NextResponse.json({ ok: true, unlocked: true })
  response.cookies.set({
    name: LEAD_ACCESS_COOKIE_NAME,
    value: leadToken,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  })
  return response
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: LEAD_ACCESS_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
  return response
}
