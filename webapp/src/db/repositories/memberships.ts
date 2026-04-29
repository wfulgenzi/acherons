import { eq } from "drizzle-orm";
import type { Tx } from "../rls";
import { memberships, organisations } from "../schema";

/** Bootstrap query: load the calling user's full membership + org row. Runs on db directly (pre-RLS). */
export async function findByUserIdWithOrg(tx: Tx, userId: string) {
  const rows = await tx
    .select()
    .from(memberships)
    .innerJoin(organisations, eq(memberships.orgId, organisations.id))
    .where(eq(memberships.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
