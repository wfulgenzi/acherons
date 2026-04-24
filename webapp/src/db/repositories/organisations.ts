import { eq } from "drizzle-orm";
import type { Tx, RLSDb } from "../rls";
import { organisations, clinicProfiles } from "../schema";
import type { OpeningHours } from "../schema";

export type OrgWithProfile = {
  id: string;
  name: string;
  type: "dispatch" | "clinic";
  createdAt: Date;
  updatedAt: Date;
  clinicProfile: {
    address: string | null;
    latitude: number | null;
    longitude: number | null;
    phone: string | null;
    website: string | null;
    mapsUrl: string | null;
    specialisations: string[] | null;
    openingHours: OpeningHours | null;
  } | null;
};

export type ClinicProfileUpdates = {
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  phone?: string | null;
  website?: string | null;
  mapsUrl?: string | null;
  specialisations?: string[] | null;
  openingHours?: OpeningHours | null;
};

/** Format a raw org + profile row into the standard response shape. */
export function formatOrg(
  org: typeof organisations.$inferSelect,
  profile: typeof clinicProfiles.$inferSelect | null,
): OrgWithProfile {
  return {
    id: org.id,
    name: org.name,
    type: org.type,
    createdAt: org.createdAt,
    updatedAt: org.updatedAt,
    clinicProfile: profile
      ? {
          address: profile.address,
          latitude: profile.latitude,
          longitude: profile.longitude,
          phone: profile.phone,
          website: profile.website,
          mapsUrl: profile.mapsUrl,
          specialisations: profile.specialisations,
          openingHours: profile.openingHours,
        }
      : null,
  };
}

/** List all orgs with their clinic profiles, ordered by name. */
export async function findAll(tx: Tx) {
  return tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .orderBy(organisations.name);
}

/** Fetch a single org with its clinic profile. */
export async function findById(tx: Tx, id: string) {
  const rows = await tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .where(eq(organisations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

/** List all orgs of a specific type, ordered by name. */
export async function findAllByType(tx: Tx, type: "dispatch" | "clinic") {
  return tx
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .where(eq(organisations.type, type))
    .orderBy(organisations.name);
}

/** List all clinic orgs with their profiles — used for the request creation flow. */
export async function findAllClinics(tx: RLSDb) {
  return tx
    .select({
      id: organisations.id,
      name: organisations.name,
      address: clinicProfiles.address,
      phone: clinicProfiles.phone,
      latitude: clinicProfiles.latitude,
      longitude: clinicProfiles.longitude,
      openingHours: clinicProfiles.openingHours,
    })
    .from(organisations)
    .innerJoin(clinicProfiles, eq(clinicProfiles.orgId, organisations.id))
    .where(eq(organisations.type, "clinic"))
    .orderBy(organisations.name);
}

/** Admin: list all orgs without profiles (lightweight). */
export async function findAllSummary(tx: Tx) {
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
  tx: Tx,
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
  tx: Tx,
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

export async function deleteById(tx: Tx, id: string) {
  await tx.delete(organisations).where(eq(organisations.id, id));
}

/** Insert or update a clinic profile depending on whether one already exists. */
export async function upsertClinicProfile(
  tx: Tx,
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
  } else {
    const [profile] = await tx
      .insert(clinicProfiles)
      .values({ orgId, ...values })
      .returning();
    return profile;
  }
}

export async function deleteClinicProfile(tx: Tx, orgId: string) {
  await tx.delete(clinicProfiles).where(eq(clinicProfiles.orgId, orgId));
}
