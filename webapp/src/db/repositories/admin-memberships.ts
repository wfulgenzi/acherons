import "server-only";

import { eq, count } from "drizzle-orm";
import type { AdminDb } from "../index";
import { memberships, organisations, user } from "../schema";

/** Admin: list all members of an org with their user info. */
export async function findByOrgId(tx: AdminDb, orgId: string) {
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
export async function memberCountsByOrg(tx: AdminDb) {
  return tx
    .select({ orgId: memberships.orgId, count: count() })
    .from(memberships)
    .groupBy(memberships.orgId);
}

/** Admin: upsert a user's membership (create or move to a new org). */
export async function upsertForUser(
  tx: AdminDb,
  userId: string,
  orgId: string,
  role: "member" | "admin",
) {
  const existing = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (existing[0]) {
    await tx
      .update(memberships)
      .set({ orgId, role })
      .where(eq(memberships.userId, userId));
  } else {
    await tx.insert(memberships).values({ userId, orgId, role });
  }
}

/** Admin: remove a user from their org. Returns false if no membership existed. */
export async function deleteByUserId(
  tx: AdminDb,
  userId: string,
): Promise<boolean> {
  const existing = await tx
    .select({ id: memberships.id })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1);

  if (!existing[0]) {
    return false;
  }

  await tx.delete(memberships).where(eq(memberships.userId, userId));
  return true;
}
