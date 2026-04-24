import { sql } from "drizzle-orm";
import { db } from "./index";

// Tx is the base db connection type. Bootstrap queries (loading the current
// user's membership before RLS context exists) and admin operations accept Tx.
export type Tx = typeof db;

// RLSDb is a branded wrapper around Tx that can only be obtained by calling
// withRLS. Repository functions that access tenant-scoped tables declare their
// first argument as RLSDb, making it a compile-time error to call them with a
// plain db — the only way to satisfy the type is to go through withRLS.
declare const rlsBrand: unique symbol;
export type RLSDb = typeof db & { readonly [rlsBrand]: true };

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
  fn: (tx: RLSDb) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${ctx.userId}, true)`);
    await tx.execute(sql`SELECT set_config('app.org_id', ${ctx.orgId}, true)`);
    return fn(tx as unknown as RLSDb);
  });
}

/**
 * Wraps a bootstrap query in a transaction with only app.user_id set.
 * This allows app_user to read its own RLS-protected rows (e.g. memberships)
 * before the full RLS context (orgId) is known, without needing a superuser
 * connection.
 */
export async function withUserContext<T>(
  userId: string,
  fn: (tx: Tx) => Promise<T>
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`SELECT set_config('app.user_id', ${userId}, true)`);
    return fn(tx as unknown as Tx);
  });
}
