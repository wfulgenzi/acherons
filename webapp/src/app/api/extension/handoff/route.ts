import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createHandoff } from "@/lib/extension-auth/grants.server";
import { ExtensionAuthError } from "@/lib/extension-auth/errors";

export const dynamic = "force-dynamic";

/**
 * Create a one-time handoff code for the signed-in user (web session).
 * The extension (or a tab flow) later exchanges it for access + refresh tokens.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { code, expiresInSec } = await createHandoff(session.user.id);
    return NextResponse.json({ code, expiresIn: expiresInSec });
  } catch (e) {
    if (e instanceof ExtensionAuthError) {
      return NextResponse.json(
        { error: e.message, code: e.errorCode },
        { status: e.status },
      );
    }
    throw e;
  }
}
