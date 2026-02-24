import { NextResponse, type NextRequest } from "next/server"
import { getConfiguredCredentials, validateSessionToken } from "@/lib/auth-session"

const PUBLIC_PATHS = ["/login", "/api/auth/login", "/api/auth/logout"]
const PUBLIC_FILE = /\.(.*)$/

function hasValidSession(request: NextRequest) {
  const token = request.cookies.get("auth_session")?.value
  if (!token) return false

  const credentials = getConfiguredCredentials()
  if (credentials.length === 0) return false

  return Boolean(validateSessionToken(token, credentials))
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/_next") || pathname.startsWith("/static") || PUBLIC_FILE.test(pathname)) {
    return NextResponse.next()
  }

  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (pathname === "/login" && hasValidSession(request)) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (hasValidSession(request)) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ message: "Nincs jogosultság." }, { status: 401 })
  }

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("from", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
