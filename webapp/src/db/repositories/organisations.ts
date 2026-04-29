import { eq } from "drizzle-orm";
import type { RLSDb } from "../rls";
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

/** List all clinic orgs with their profiles — used for the request creation flow (RLS). */
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
