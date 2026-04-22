import { eq } from "drizzle-orm";
import { db } from "@/db";
import { organisations, clinicProfiles } from "@/db/schema";

export function formatOrg(
  org: typeof organisations.$inferSelect,
  profile: typeof clinicProfiles.$inferSelect | null
) {
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

export async function findOrg(id: string) {
  const rows = await db
    .select()
    .from(organisations)
    .leftJoin(clinicProfiles, eq(organisations.id, clinicProfiles.orgId))
    .where(eq(organisations.id, id))
    .limit(1);
  return rows[0] ?? null;
}
