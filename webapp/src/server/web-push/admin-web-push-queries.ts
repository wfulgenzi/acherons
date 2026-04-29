/**
 * Admin pool: fan-out Web Push to all subscriptions for an org.
 */
import { adminDb, asAdminDb } from "@/db";
import { fanOutWebPushForOrg as fanOutImpl } from "@/db/repositories/admin-web-push";
import type { WebPushFanOutPayload } from "@/lib/web-push/types";

const adb = asAdminDb(adminDb);

export async function fanOutWebPushForOrg(
  orgId: string,
  payload: WebPushFanOutPayload,
): Promise<void> {
  return fanOutImpl(adb, orgId, payload);
}
