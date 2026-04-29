import { findRecentNotificationsForOrg } from "@/server/notifications/notifications-rls-queries";
import type { NotificationListItem } from "./notification-list";

const DEFAULT_LIMIT = 10;

function readAtToIsoString(
  v: string | Date | null | undefined,
): string | null {
  if (v == null) {
    return null;
  }
  if (v instanceof Date) {
    return v.toISOString();
  }
  if (typeof v === "string") {
    return v;
  }
  return null;
}

/**
 * Server-only: recent notifications for the org inbox, RLS-scoped (same as the app user).
 * Called from the (app) layout for initial list hydration.
 */
export async function loadInitialNotifications(
  userId: string,
  orgId: string,
  limit = DEFAULT_LIMIT,
): Promise<NotificationListItem[]> {
  const rows = await findRecentNotificationsForOrg(
    { userId, orgId },
    limit,
  );
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    context: (r.context ?? {}) as Record<string, unknown>,
    readAt: readAtToIsoString(r.readAt as string | Date | null | undefined),
    createdAt: r.createdAt.toISOString(),
  }));
}
