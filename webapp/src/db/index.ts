import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// In development, Next.js hot-reloads modules on every change, which would
// create a new postgres client (and connection pool) on each reload and
// quickly exhaust Supabase's connection limit. Storing the client on
// globalThis ensures it is reused across reloads in dev.
const globalForDb = globalThis as unknown as {
  pgClient: postgres.Sql;
  pgAdminClient: postgres.Sql;
};

const client = globalForDb.pgClient ?? postgres(process.env.DATABASE_URL!);
const adminClient =
  globalForDb.pgAdminClient ?? postgres(process.env.DATABASE_ADMIN_URL!);

if (process.env.NODE_ENV !== "production") {
  globalForDb.pgClient = client;
  globalForDb.pgAdminClient = adminClient;
}

// app_user connection — subject to RLS. Use inside withRLS() only.
export const db = drizzle(client, { schema });

// superuser connection — bypasses RLS. Use for admin routes and bootstrap
// queries (e.g. loading a user's membership before orgId is known).
export const adminDb = drizzle(adminClient, { schema });

/**
 * Branded handle for the admin connection (mirrors the `RLSDb` pattern in
 * `rls.ts`). Repository functions that bypass RLS should take `AdminDb` as
 * their first argument so they cannot be called with `db` / `withRLS` by
 * accident. Callers pass `adminDb` (satisfies the brand structurally) or
 * `tx as AdminDb` inside `adminDb.transaction`.
 */
declare const adminBrand: unique symbol;
export type AdminDb = typeof adminDb & { readonly [adminBrand]: true };

/** Pass {@link adminDb} (or an admin transaction handle) into repos expecting {@link AdminDb}. */
export function asAdminDb(connection: typeof adminDb): AdminDb {
  return connection as AdminDb;
}
