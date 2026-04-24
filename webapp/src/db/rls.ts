import { sql } from "drizzle-orm";
import { db } from "./index";

// Tx is either the db singleton or a Drizzle transaction object.
// All repository functions accept this type so they work transparently
// with both direct db calls and calls inside a withRLS transaction.
export type Tx = typeof db;

type RLSContext = {
  userId: string;
  orgId: string;
};

/**
 * Wraps a database operation in a transaction with RLS session variables set.
 * All queries run inside `fn` are subject to the RLS policies on the database.
 *
 * Uses set_config(..., true) so the settings are transaction-local and never
 * leak across pooled connections.
 */
export async function withRLS<T>(
  ctx: RLSContext,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return fn(tx as unknown as Tx);
  });
}
