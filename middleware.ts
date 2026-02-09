import { NextResponse, type NextRequest } from "next/server"

const PUBLIC_PATHS = ["/login", "/api/auth/login"]
const PUBLIC_FILE = /\.(.*)$/

function getExpectedToken() {
  const user =
    process.env.LOGIN_USER ?? (process.env.NODE_ENV !== "production" ? "admin" : "")
  const code =
    process.env.LOGIN_CODE ?? (process.env.NODE_ENV !== "production" ? "1234" : "")

  if (!user || !code) {
    return null
  }

  return btoa(`${user}:${code}`)
}

function hasValidSession(request: NextRequest) {
  const token = request.cookies.get("auth_session")?.value
  const expected = getExpectedToken()
  return Boolean(token && expected && token === expected)
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

  const loginUrl = new URL("/login", request.url)
  loginUrl.searchParams.set("from", pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
