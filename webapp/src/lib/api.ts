import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "./auth";

export type ApiError = { error: NextResponse };
export type ApiAdmin = {
  session: Awaited<ReturnType<typeof auth.api.getSession>>;
};

/**
 * Resolves to an error response if the request has no valid session,
 * or if the session user is not an admin. Otherwise returns the session.
 */
export async function requireAdmin(): Promise<ApiError | ApiAdmin> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  if (!session.user.isAdmin) {
    return {
      error: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { session };
}

export function isApiError(result: ApiError | ApiAdmin): result is ApiError {
  return "error" in result;
}
