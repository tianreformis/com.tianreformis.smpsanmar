import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ req })
  const path = req.nextUrl.pathname

  // Redirect to dashboard if already logged in and trying to access login
  if (path === "/login" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // Redirect to login if not logged in and trying to access dashboard
  if (path.startsWith("/dashboard") && !token) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"]
}
