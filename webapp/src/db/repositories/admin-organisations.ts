import "server-only";

import { eq } from "drizzle-orm";
import type { AdminDb } from "../index";
import { organisations, clinicProfiles } from "../schema";
import type { ClinicProfileUpdates } from "./organisations";

/**
 * Organisation mutations and listings that use the **admin** pool (RLS bypass).
 * Do not import these from user-facing RLS code paths — caller must enforce auth.
 */

/** List all orgs with their clinic profiles, ordered by name. */
export async function findAll(tx: AdminDb) {
  return tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .orderBy(organisations.name);
}

/** Fetch a single org with its clinic profile. */
export async function findById(tx: AdminDb, id: string) {
  const rows = await tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .where(eq(organisations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** List all orgs of a specific type, ordered by name. */
export async function findAllByType(tx: AdminDb, type: "dispatch" | "clinic") {
  return tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .where(eq(organisations.type, type))
    .orderBy(organisations.name);
}

/** Admin: list all orgs without profiles (lightweight). */
export async function findAllSummary(tx: AdminDb) {
  return tx
    .select({
      id: organisations.id,
      name: organisations.name,
      type: organisations.type,
    })
    .from(organisations)
    .orderBy(organisations.name);
}

export async function create(
  tx: AdminDb,
  name: string,
  type: "dispatch" | "clinic",
) {
  const [org] = await tx
    .insert(organisations)
    .values({ name, type })
    .returning();
  return org;
}

export async function update(
  tx: AdminDb,
  id: string,
  data: { name?: string; type?: "dispatch" | "clinic" },
) {
  const [org] = await tx
    .update(organisations)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(organisations.id, id))
    .returning();
  return org;
}

export async function deleteById(tx: AdminDb, id: string) {
  await tx.delete(organisations).where(eq(organisations.id, id));
}

/** Insert or update a clinic profile depending on whether one already exists. */
export async function upsertClinicProfile(
  tx: AdminDb,
  orgId: string,
  existing: boolean,
  data: ClinicProfileUpdates,
) {
  const values = { ...data, updatedAt: new Date() };
  if (existing) {
    const [profile] = await tx
      .update(clinicProfiles)
      .set(values)
      .where(eq(clinicProfiles.orgId, orgId))
      .returning();
    return profile;
  }
  const [profile] = await tx
    .insert(clinicProfiles)
    .values({ orgId, ...values })
    .returning();
  return profile;
}

export async function deleteClinicProfile(tx: AdminDb, orgId: string) {
  await tx.delete(clinicProfiles).where(eq(clinicProfiles.orgId, orgId));
}
