import "server-only";

import { eq } from "drizzle-orm";
import type { AdminDb } from "../index";
import { user, memberships, organisations } from "../schema";

/** Admin: users list with optional membership + org (left joins). */
export async function listWithMemberships(tx: AdminDb) {
  return tx
    .select()
    .from(user)
    .leftJoin(memberships, eq(memberships.userId, user.id))
    .leftJoin(organisations, eq(organisations.id, memberships.orgId))
    .orderBy(user.createdAt);
}

export async function findById(tx: AdminDb, id: string) {
  const rows = await tx
    .select()
    .from(user)
    .where(eq(user.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** Single membership row with org for admin user detail (at most one membership). */
export async function findMembershipWithOrgForUser(tx: AdminDb, userId: string) {
  const rows = await tx
    .select()
    .from(memberships)
    .leftJoin(organisations, eq(organisations.id, memberships.orgId))
    .where(eq(memberships.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function deleteById(tx: AdminDb, id: string) {
  await tx.delete(user).where(eq(user.id, id));
}
