import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const EXTENSION_ORIGIN_PREFIX = "chrome-extension://";

/**
 * Browsers CORS `fetch` from the MV3 extension to our API. Preflight and
 * responses get `Access-Control-Allow-Origin` (extension origin, dev-friendly).
 * Tighten to a single `chrome-extension://<id>` in production if you prefer.
 */
function withExtensionApiCors(
  request: NextRequest,
): NextResponse | null {
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return null;
  }
  const origin = request.headers.get("origin");
  if (!origin?.startsWith(EXTENSION_ORIGIN_PREFIX)) {
    return null;
  }
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods":
          "GET, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        Vary: "Origin",
      },
    });
  }
  const res = NextResponse.next();
  res.headers.set("Access-Control-Allow-Origin", origin);
  res.headers.set("Vary", "Origin");
  return res;
}

// Routes that require a valid session
const protectedRoutes = ["/dashboard", "/onboarding"];
// Routes that additionally require isAdmin (checked in the layout — middleware
// only verifies session existence since isAdmin requires a DB lookup)
const adminRoutes = ["/admin"];
// Routes only accessible when NOT logged in
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
  const extCors = withExtensionApiCors(request);
  if (extCors) {
    return extCors;
  }

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

  // Redirect authenticated users away from login/signup, unless they are
  // completing a return path (e.g. extension handoff after /login).
  if (isAuthRoute && isLoggedIn) {
    const callbackUrl = request.nextUrl.searchParams.get("callbackUrl");
    if (
      callbackUrl &&
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith("//")
    ) {
      return NextResponse.redirect(new URL(callbackUrl, request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Include /api (but not _next) so CORS for chrome-extension fetches is applied
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
