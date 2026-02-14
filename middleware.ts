import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const PUBLIC_ROUTES = ["/auth/login", "/auth/error", "/auth/blocked"]

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user
  const path = nextUrl.pathname

  const isPublicRoute = PUBLIC_ROUTES.some((r) => path.startsWith(r))
  const isApiAuth = path.startsWith("/api/auth")

  // Always allow NextAuth API routes through
  if (isApiAuth) return NextResponse.next()

  // Redirect unauthenticated users to login
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", nextUrl))
  }

  // Redirect authenticated users away from auth pages
  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl))
  }

  // Onboarding gate: if user has no profile or onboarding not complete
  if (isLoggedIn && session.user) {
    const { profileId, onboardingCompleto } = session.user
    const needsOnboarding = !profileId || !onboardingCompleto

    if (needsOnboarding && path !== "/onboarding") {
      return NextResponse.redirect(new URL("/onboarding", nextUrl))
    }

    if (!needsOnboarding && path === "/onboarding") {
      return NextResponse.redirect(new URL("/", nextUrl))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
