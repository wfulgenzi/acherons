/**
 * Admin inbox inserts (`notifications` table). Used by {@link createInboxNotification}
 * in `lib/notifications/emit.server.ts`.
 */
import type { AdminDbOrTx } from "@/db/repositories/admin-notifications";
import type { NotificationType } from "@/lib/notifications/contract";
import { adminNotificationsRepo } from "@/db/repositories";

export type { AdminDbOrTx };

export async function insertInboxNotificationRowAdmin(
  client: AdminDbOrTx,
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
) {
  return adminNotificationsRepo.insertInboxNotificationRow(
    client,
    recipientOrgId,
    type,
    context,
  );
}
