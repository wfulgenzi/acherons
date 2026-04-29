import "server-only";

import { adminDb, asAdminDb } from "@/db";
import { fanOutWebPushForOrg as fanOutImpl } from "@/db/repositories/admin-web-push";
import type { WebPushFanOutPayload } from "@/lib/web-push/types";

export type { WebPushFanOutPayload } from "@/lib/web-push/types";

/**
 * Sends one encrypted Web Push per subscription for users whose membership matches `orgId`.
 * Delegates to the admin web-push repository using the admin pool.
 */
export async function fanOutWebPushForOrg(
  orgId: string,
  payload: WebPushFanOutPayload,
): Promise<void> {
  return fanOutImpl(asAdminDb(adminDb), orgId, payload);
}
