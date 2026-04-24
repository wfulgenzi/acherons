import { eq, and } from "drizzle-orm";
import type { Tx } from "../rls";
import { requestClinicAccess, organisations, clinicProfiles } from "../schema";

/** Check if a specific clinic has been granted access to a request. */
export async function findByRequestAndClinic(
  tx: Tx,
  requestId: string,
  clinicOrgId: string
) {
  const rows = await tx
    .select()
    .from(requestClinicAccess)
    .where(
      and(
        eq(requestClinicAccess.requestId, requestId),
        eq(requestClinicAccess.clinicOrgId, clinicOrgId)
      )
    )
    .limit(1);
  return rows[0] ?? null;
}

/** Get all clinic IDs that have access to a request. */
export async function findClinicIdsByRequestId(tx: Tx, requestId: string) {
  const rows = await tx
    .select({ clinicOrgId: requestClinicAccess.clinicOrgId })
    .from(requestClinicAccess)
    .where(eq(requestClinicAccess.requestId, requestId));
  return rows.map((r) => r.clinicOrgId);
}

/** Get clinics on a request with their profile info (for the request detail page). */
export async function findClinicsOnRequest(tx: Tx, requestId: string) {
  return tx
    .select({
      id: organisations.id,
      name: organisations.name,
      address: clinicProfiles.address,
      latitude: clinicProfiles.latitude,
      longitude: clinicProfiles.longitude,
      openingHours: clinicProfiles.openingHours,
    })
    .from(requestClinicAccess)
    .innerJoin(organisations, eq(organisations.id, requestClinicAccess.clinicOrgId))
    .leftJoin(clinicProfiles, eq(clinicProfiles.orgId, organisations.id))
    .where(eq(requestClinicAccess.requestId, requestId));
}

/** Insert access rows for multiple clinics on a request. */
export async function insertMany(tx: Tx, requestId: string, clinicOrgIds: string[]) {
  if (clinicOrgIds.length === 0) return;
  await tx.insert(requestClinicAccess).values(
    clinicOrgIds.map((clinicOrgId) => ({ requestId, clinicOrgId }))
  );
}

/** Replace the entire clinic access list for a request atomically. */
export async function replaceAll(tx: Tx, requestId: string, clinicOrgIds: string[]) {
  await tx.delete(requestClinicAccess).where(eq(requestClinicAccess.requestId, requestId));
  if (clinicOrgIds.length > 0) {
    await tx.insert(requestClinicAccess).values(
      clinicOrgIds.map((clinicOrgId) => ({ requestId, clinicOrgId }))
    );
  }
}
