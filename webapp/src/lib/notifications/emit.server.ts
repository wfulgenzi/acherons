import "server-only";

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import { adminDb } from "@/db";
import * as schema from "@/db/schema";
import { notifications } from "@/db/schema/notifications";
import {
  type NotificationType,
  parseNotificationContext,
} from "./contract";

/** Admin pool or a transaction from `adminDb.transaction` (both support `.insert`). */
type AdminDbOrTx =
  | typeof adminDb
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

/**
 * Inserts a single `notifications` row for the **recipient** org inbox.
 * Uses the admin connection (bypasses RLS); authorization must be done by the
 * caller before calling. All app code that creates notifications should use
 * this module so `adminDb` is not imported from individual routes.
 */
export async function createInboxNotification(
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
): Promise<void> {
  await insertInboxRow(adminDb, recipientOrgId, type, context);
}

/**
 * Same as {@link createInboxNotification}, but uses a client from
 * `adminDb.transaction(async (tx) => { ... })` so the insert is atomic with
 * other work on that admin transaction.
 */
export async function createInboxNotificationWithClient(
  client: AdminDbOrTx,
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
): Promise<void> {
  await insertInboxRow(client, recipientOrgId, type, context);
}

async function insertInboxRow(
  client: AdminDbOrTx,
  recipientOrgId: string,
  type: NotificationType,
  context: unknown,
) {
  const ctx = parseNotificationContext(type, context);
  await client.insert(notifications).values({
    orgId: recipientOrgId,
    type,
    context: ctx,
  });
}

/**
 * One `request.created` inbox row per invited clinic (single admin transaction).
 */
export async function notifyClinicsRequestCreated(
  requestId: string,
  clinicOrgIds: readonly string[],
): Promise<void> {
  if (clinicOrgIds.length === 0) {
    return;
  }
  await adminDb.transaction(async (tx) => {
    for (const clinicOrgId of clinicOrgIds) {
      await insertInboxRow(tx, clinicOrgId, "request.created", { requestId });
    }
  });
}
