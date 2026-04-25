import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { mintRealtimeAccessJwt } from "@/lib/supabase/mint-realtime-jwt";

/**
 * Returns a short-lived Supabase-shaped JWT (HS256 or ES256/RS256) for Realtime/PostgREST
 * with `org_id` for RLS. Call from the client after the user is signed in to
 * `setSession` on the Supabase client (or pass as Realtime `accessToken`).
 */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    return NextResponse.json(
      { error: "No organisation membership" },
      { status: 403 },
    );
  }

  const { token, exp } = await mintRealtimeAccessJwt(
    session.user.id,
    membership.orgId
  );

  return NextResponse.json({ token, expiresAt: exp });
}
