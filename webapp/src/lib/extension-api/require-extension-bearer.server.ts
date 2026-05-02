import "server-only";

import { NextResponse } from "next/server";
import { verifyExtensionAccessJwt } from "@/lib/extension-auth/verify-access-jwt";

export type ExtensionBearerAuthOk = {
  userId: string;
  extensionClientId: string;
};

export type ExtensionBearerAuthResult =
  | ExtensionBearerAuthOk
  | { error: NextResponse };

/**
 * Validates **`Authorization: Bearer` + extension access JWT** only (no session fallback).
 * Use for routes intended solely for the Chrome extension.
 */
export async function requireExtensionBearerAuth(
  requestHeaders: Headers,
): Promise<ExtensionBearerAuthResult> {
  const authz = requestHeaders.get("authorization");
  if (!authz?.toLowerCase().startsWith("bearer ")) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const raw = authz.slice("bearer ".length).trim();
  if (!raw) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  try {
    const { userId, clientId } = await verifyExtensionAccessJwt(raw);
    return { userId, extensionClientId: clientId };
  } catch {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
}

export function isExtensionBearerAuthError(
  result: ExtensionBearerAuthResult,
): result is { error: NextResponse } {
  return "error" in result;
}
