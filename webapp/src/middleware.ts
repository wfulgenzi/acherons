import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require a valid session
const protectedRoutes = ["/dashboard", "/onboarding"];
// Routes that additionally require isAdmin (checked in the layout — middleware
// only verifies session existence since isAdmin requires a DB lookup)
const adminRoutes = ["/admin"];
// Routes only accessible when NOT logged in
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const sessionToken =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isLoggedIn = !!sessionToken;
  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Redirect unauthenticated users to /login
  if ((isProtectedRoute || isAdminRoute) && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
