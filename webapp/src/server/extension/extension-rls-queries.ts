/**
 * Extension API: RLS scoped by `userId` only (no org).
 */
import { withRLS } from "@/db/rls";
import type { WebPushSubscriptionKeys } from "@acherons/contracts";
import {
  assertActiveExtensionClientForUser,
  upsertWebPushSubscriptionForClient,
} from "@/lib/web-push/upsert-subscription.server";

export async function upsertExtensionPushSubscription(
  userId: string,
  options: {
    clientId: string;
    endpoint: string;
    keys: WebPushSubscriptionKeys;
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
