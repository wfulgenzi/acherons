import "server-only";

import { and, eq, isNull, sql } from "drizzle-orm";
import { extensionClient, webPushSubscription } from "@/db/schema/extension";
import type { RLSDb } from "@/db/rls";
import type { webPushSubscriptionKeys } from "./subscription-types";

/**
 * Idempotent: same `endpoint` always upserts; updates `user_id` / `client_id` / `keys` / timestamps.
 * Call inside `withRLS({ userId })` (no `orgId`); RLS enforces the row belongs to the session user
 * and `client_id` is an active, owned extension client.
 */
export async function upsertWebPushSubscriptionForClient(
  tx: RLSDb,
  options: {
    userId: string;
    clientId: string;
    endpoint: string;
    keys: webPushSubscriptionKeys;
  },
): Promise<{ id: string }> {
  const { userId, clientId, endpoint, keys } = options;

  const [row] = await tx
    .insert(webPushSubscription)
    .values({
      userId,
      clientId,
      endpoint,
      keys,
    })
    .onConflictDoUpdate({
      target: webPushSubscription.endpoint,
      set: {
        userId,
        clientId,
        keys,
        updatedAt: sql`now()`,
        failureCount: 0,
      },
    })
    .returning({ id: webPushSubscription.id });

  if (!row) {
    throw new Error("web_push upsert: no row returned");
  }
  return { id: row.id };
}

/** Ensures the client exists, is not revoked, and is visible under RLS for this user. */
export async function assertActiveExtensionClientForUser(
  tx: RLSDb,
  options: { clientId: string },
): Promise<void> {
  const { clientId } = options;

  const [row] = await tx
    .select({ id: extensionClient.id })
    .from(extensionClient)
    .where(and(eq(extensionClient.id, clientId), isNull(extensionClient.revokedAt)))
    .limit(1);

  if (!row) {
    throw new WebPushClientForbiddenError();
  }
}

export class WebPushClientForbiddenError extends Error {
  constructor() {
    super("Invalid or revoked extension client for this user.");
    this.name = "WebPushClientForbiddenError";
  }
}
