/**
 * Extension API: RLS scoped by `userId` only (no org).
 */
import { withRLS } from "@/db/rls";
import type { webPushSubscriptionKeys } from "@/lib/web-push/subscription-types";
import {
  assertActiveExtensionClientForUser,
  upsertWebPushSubscriptionForClient,
} from "@/lib/web-push/upsert-subscription.server";

export async function upsertExtensionPushSubscription(
  userId: string,
  options: {
    clientId: string;
    endpoint: string;
    keys: webPushSubscriptionKeys;
  },
) {
  return withRLS({ userId }, async (tx) => {
    await assertActiveExtensionClientForUser(tx, { clientId: options.clientId });
    return upsertWebPushSubscriptionForClient(tx, {
      userId,
      clientId: options.clientId,
      endpoint: options.endpoint,
      keys: options.keys,
    });
  });
}
