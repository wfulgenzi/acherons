import { NextRequest, NextResponse } from "next/server";
import { withRLS } from "@/db/rls";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { notificationsRepo } from "@/db/repositories";

/**
 * Mark every unread notification for the current org as read.
 */
export async function POST(request: NextRequest) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;

  const updated = await withRLS(
    { userId, orgId: membership.orgId },
    (tx) => notificationsRepo.markAllUnreadForOrg(tx, membership.orgId),
  );

  return NextResponse.json({ ok: true, updated });
}
