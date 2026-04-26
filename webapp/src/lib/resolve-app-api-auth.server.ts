import "server-only";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyExtensionAccessJwt } from "@/lib/extension-auth/verify-access-jwt";
import {
  getMembershipForRequest,
  type MembershipContext,
} from "@/lib/membership";

export type AppApiAuthContext = {
  userId: string;
  membership: MembershipContext;
  /** `session` = Better Auth cookie; `extension` = extension access JWT */
  source: "session" | "extension";
  /** Populated for `source === "extension"` (per-install line / family) */
  extensionClientId: string | undefined;
};

export type AppApiAuthError = { error: NextResponse };
export type AppApiAuthResult = AppApiAuthContext | AppApiAuthError;

/**
 * For Route Handlers: authenticates via **session cookie** (default web app) or
 * **`Authorization: Bearer` + extension access JWT** (Chrome extension). When
 * a Bearer is present, it is verified first; invalid tokens yield 401 without
 * falling back to the session.
 *
 * Then loads the caller's org membership. Missing membership → 403 JSON.
 */
export async function requireAppApiAuth(
  requestHeaders: Headers,
): Promise<AppApiAuthResult> {
  const authz = requestHeaders.get("authorization");
  let userId: string;
  let source: "session" | "extension";
  let extensionClientId: string | undefined;

  if (authz?.toLowerCase().startsWith("bearer ")) {
    const raw = authz.slice("bearer ".length).trim();
    if (!raw) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    try {
      const { userId: sub, clientId } = await verifyExtensionAccessJwt(raw);
      userId = sub;
      source = "extension";
      extensionClientId = clientId;
    } catch {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
  } else {
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session) {
      return {
        error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
      };
    }
    userId = session.user.id;
    source = "session";
    extensionClientId = undefined;
  }

  const membership = await getMembershipForRequest(userId);
  if (!membership) {
    return {
      error: NextResponse.json(
        { error: "Organisation membership required" },
        { status: 403 },
      ),
    };
  }

  return {
    userId,
    membership,
    source,
    extensionClientId,
  };
}

export function isAppApiAuthError(
  result: AppApiAuthResult,
): result is AppApiAuthError {
  return "error" in result;
}
