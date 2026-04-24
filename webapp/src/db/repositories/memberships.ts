import { eq, count } from "drizzle-orm";
import type { Tx } from "../rls";
import { memberships, organisations, user } from "../schema";

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

/** Admin: list all members of an org with their user info. */
export async function findByOrgId(tx: Tx, orgId: string) {
  return tx
    .select({
      userId: memberships.userId,
      role: memberships.role,
      name: user.name,
      email: user.email,
      joinedAt: memberships.createdAt,
    })
    .from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(eq(memberships.orgId, orgId))
    .orderBy(memberships.createdAt);
}

/** Admin: member count per org (for list pages). */
export async function memberCountsByOrg(tx: Tx) {
  return tx
    .select({ orgId: memberships.orgId, count: count() })
    .from(memberships)
    .groupBy(memberships.orgId);
}

/** Admin: upsert a user's membership (create or move to a new org). */
export async function upsertForUser(
  tx: Tx,
  userId: string,
  orgId: string,
  role: "member" | "admin"
) {
  const existing = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (existing[0]) {
    await tx.update(memberships).set({ orgId, role }).where(eq(memberships.userId, userId));
  } else {
    await tx.insert(memberships).values({ userId, orgId, role });
  }
}

/** Admin: remove a user from their org. Returns false if no membership existed. */
export async function deleteByUserId(tx: Tx, userId: string): Promise<boolean> {
  const existing = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (!existing[0]) return false;

  await tx.delete(memberships).where(eq(memberships.userId, userId));
  return true;
}
