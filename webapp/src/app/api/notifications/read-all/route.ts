import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { getMembership } from "@/lib/membership";
import { withRLS } from "@/db/rls";
import { notificationsRepo } from "@/db/repositories";

/**
 * Mark every unread notification for the current org as read.
 */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const membership = await getMembership(session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await withRLS(
    { userId: session.user.id, orgId: membership.orgId },
    (tx) => notificationsRepo.markAllUnreadForOrg(tx, membership.orgId),
  );

  return NextResponse.json({ ok: true, updated });
}
