import "server-only";

import { count, eq } from "drizzle-orm";
import type { AdminDb } from "../index";
import { user, organisations } from "../schema";

export async function getOverviewCounts(tx: AdminDb) {
  const [
    [{ total: userCount }],
    [{ total: clinicCount }],
    [{ total: dispatcherCount }],
  ] = await Promise.all([
    tx.select({ total: count() }).from(user),
    tx
      .select({ total: count() })
      .from(organisations)
      .where(eq(organisations.type, "clinic")),
    tx
      .select({ total: count() })
      .from(organisations)
      .where(eq(organisations.type, "dispatch")),
  ]);

  return {
    userCount,
    clinicCount,
    dispatcherCount,
  };
}
