import { NextResponse } from "next/server"

type LoginPayload = {
  username?: string
  code?: string
}

function getExpectedCredentials() {
  const username =
    process.env.LOGIN_USER ?? (process.env.NODE_ENV !== "production" ? "admin" : "")
  const code =
    process.env.LOGIN_CODE ?? (process.env.NODE_ENV !== "production" ? "1234" : "")

  if (!username || !code) {
    return null
  }

  return { username, code }
}

export async function POST(request: Request) {
  let payload: LoginPayload = {}

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ message: "Hibás kérés." }, { status: 400 })
  }

  const credentials = getExpectedCredentials()
  if (!credentials) {
    return NextResponse.json(
      { message: "A belépés nincs konfigurálva. Állítsd be a LOGIN_USER és LOGIN_CODE értékeit." },
      { status: 500 },
    )
  }

  if (
    payload.username !== credentials.username ||
    payload.code !== credentials.code
  ) {
    return NextResponse.json({ message: "Hibás felhasználónév vagy kód." }, { status: 401 })
  }

  const token = Buffer.from(`${credentials.username}:${credentials.code}`, "utf8").toString("base64")
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
