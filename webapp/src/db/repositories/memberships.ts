import { eq } from "drizzle-orm";
import type { Tx } from "../rls";
import { memberships, organisations } from "../schema";

/** Bootstrap query: load the calling user's orgId + orgType. Runs on db directly (pre-RLS). */
export async function findByUserId(tx: Tx, userId: string) {
  const rows = await tx
    .select({ orgId: memberships.orgId, orgType: organisations.type })
    .from(memberships)
    .innerJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

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
