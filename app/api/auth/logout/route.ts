import { NextResponse } from "next/server"
import { LEAD_ACCESS_COOKIE_NAME } from "@/lib/auth-session"

export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: "auth_session",
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  })
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
