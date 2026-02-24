import { NextResponse } from "next/server"
import { encodeSessionToken, getConfiguredCredentials } from "@/lib/auth-session"

type LoginPayload = {
  username?: string
  code?: string
  password?: string
}

export async function POST(request: Request) {
  let payload: LoginPayload = {}

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Hibás kérés." }, { status: 400 })
  }

  const credentials = getConfiguredCredentials()
  if (credentials.length === 0) {
    return NextResponse.json(
      {
        message:
          "A belépés nincs konfigurálva. Állítsd be a LOGIN_USER_1..9 és LOGIN_PASSWORD_1..9 értékeket.",
      },
      { status: 500 },
    )
  }

  const providedCode = payload.password ?? payload.code
  const matchedCredential = credentials.find(
    (credential) =>
      payload.username === credential.username &&
      providedCode === credential.code,
  )
  if (!matchedCredential) {
    return NextResponse.json({ message: "Hibás felhasználónév vagy kód." }, { status: 401 })
  }

  const token = encodeSessionToken(matchedCredential.username, matchedCredential.code)
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: "auth_session",
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  })

  return response
}
