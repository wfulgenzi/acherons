import { and, desc, eq, isNull } from "drizzle-orm";
import type { RLSDb } from "../rls";
import { notifications } from "../schema/notifications";

export async function findRecentForOrg(
  tx: RLSDb,
  orgId: string,
  limit: number,
) {
  return tx
    .select({
      id: notifications.id,
      orgId: notifications.orgId,
      type: notifications.type,
      context: notifications.context,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.orgId, orgId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Mark one notification as read, scoped to `orgId` (RLS + row filter).
 */
export async function markReadByIdForOrg(
  tx: RLSDb,
  notificationId: string,
  orgId: string,
) {
  return tx
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.orgId, orgId),
      ),
    )
    .returning({ id: notifications.id, readAt: notifications.readAt });
}

/**
 * Mark every unread notification for the org as read.
 * @returns how many rows were updated (`UPDATE … RETURNING` count)
 */
export async function markAllUnreadForOrg(
  tx: RLSDb,
  orgId: string,
): Promise<number> {
  const rows = await tx
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.orgId, orgId), isNull(notifications.readAt)),
    )
    .returning({ id: notifications.id });
  return rows.length;
}
