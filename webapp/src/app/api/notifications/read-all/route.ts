import { NextRequest, NextResponse } from "next/server";
import {
  isAppApiAuthError,
  requireAppApiAuth,
} from "@/lib/resolve-app-api-auth.server";
import { markAllUnreadNotificationsForOrg } from "@/server/notifications/notifications-rls-queries";

/**
 * Mark every unread notification for the current org as read.
 */
export async function POST(request: NextRequest) {
  const apiAuth = await requireAppApiAuth(request.headers);
  if (isAppApiAuthError(apiAuth)) {
    return apiAuth.error;
  }
  const { userId, membership } = apiAuth;

  const updated = await markAllUnreadNotificationsForOrg({
    userId,
    orgId: membership.orgId,
  });

  return NextResponse.json({ ok: true, updated });
}
