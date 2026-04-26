import { NextResponse, type NextRequest } from "next/server";
import * as v from "valibot";
import { rotateRefreshToken } from "@/lib/extension-auth/grants.server";
import { ExtensionAuthError } from "@/lib/extension-auth/errors";

export const dynamic = "force-dynamic";

const BodySchema = v.object({
  refreshToken: v.pipe(
    v.string(),
    v.minLength(1, "refreshToken is required"),
  ),
});

/**
 * Rotates refresh + issues a new access JWT. No session cookie; bearer refresh only.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = v.safeParse(BodySchema, body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body.", issues: v.flatten(parsed.issues) },
      { status: 400 },
    );
  }
  try {
    const {
      accessToken,
      accessExpiresAtSec: expiresAt,
      refreshToken,
      clientId,
    } = await rotateRefreshToken(parsed.output.refreshToken);
    return NextResponse.json({
      accessToken,
      refreshToken,
      clientId,
      expiresAt,
    });
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
