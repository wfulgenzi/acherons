import "server-only";

import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { AdminDb } from "../index";
import * as schema from "../schema";
import { notifications } from "../schema/notifications";
import type { NotificationType } from "@/lib/notifications/contract";
import { parseNotificationContext } from "@/lib/notifications/contract";

/** Admin pool or an `adminDb.transaction` callback client. */
export type AdminDbOrTx =
  | AdminDb
  | PgTransaction<
      PostgresJsQueryResultHKT,
      typeof schema,
      ExtractTablesWithRelations<typeof schema>
    >;

export async function insertInboxNotificationRow(
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
