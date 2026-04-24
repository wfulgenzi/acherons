import { eq, and, desc, sql } from "drizzle-orm";
import type { Tx } from "../rls";
import { requests, requestClinicAccess, proposals, user } from "../schema";

export type NewRequest = {
  dispatcherOrgId: string;
  createdByUserId: string;
  patientGender: "male" | "female" | "other" | "unknown";
  patientAge: number;
  postcode: string;
  caseDescription: string;
};

/** Dispatcher: list open requests for their org with clinic + proposal counts. */
export async function findOpenByDispatcher(tx: Tx, dispatcherOrgId: string) {
  return tx
    .select({
      id: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      postcode: requests.postcode,
      createdAt: requests.createdAt,
      creatorName: user.name,
      creatorEmail: user.email,
      clinicsContacted: sql<number>`(
        SELECT COUNT(*) FROM request_clinic_access
        WHERE request_clinic_access.request_id = ${requests.id}
      )`.mapWith(Number),
      proposalCount: sql<number>`(
        SELECT COUNT(*) FROM proposals
        WHERE proposals.request_id = ${requests.id}
      )`.mapWith(Number),
    })
    .from(requests)
    .leftJoin(user, eq(user.id, requests.createdByUserId))
    .where(and(eq(requests.dispatcherOrgId, dispatcherOrgId), eq(requests.status, "open")))
    .orderBy(desc(requests.createdAt));
}

/** Clinic: list open requests the clinic has been granted access to, with proposal status. */
export async function findAccessibleByClinic(tx: Tx, clinicOrgId: string) {
  return tx
    .select({
      id: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      postcode: requests.postcode,
      createdAt: requests.createdAt,
      creatorName: user.name,
      creatorEmail: user.email,
      proposalStatus: proposals.status,
    })
    .from(requests)
    .innerJoin(
      requestClinicAccess,
      and(
        eq(requestClinicAccess.requestId, requests.id),
        eq(requestClinicAccess.clinicOrgId, clinicOrgId)
      )
    )
    .leftJoin(
      proposals,
      and(
        eq(proposals.requestId, requests.id),
        eq(proposals.clinicOrgId, clinicOrgId)
      )
    )
    .leftJoin(user, eq(user.id, requests.createdByUserId))
    .where(eq(requests.status, "open"))
    .orderBy(requests.createdAt);
}

/** Dispatcher: fetch a single request, scoped to their org. */
export async function findByIdForDispatcher(
  tx: Tx,
  id: string,
  dispatcherOrgId: string
) {
  const rows = await tx
    .select()
    .from(requests)
    .where(and(eq(requests.id, id), eq(requests.dispatcherOrgId, dispatcherOrgId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Fetch a request by id (for validation in clinic API routes). */
export async function findOpenById(tx: Tx, id: string) {
  const rows = await tx
    .select()
    .from(requests)
    .where(and(eq(requests.id, id), eq(requests.status, "open")))
    .limit(1);
  return rows[0] ?? null;
}

/** Fetch creator info for a request. */
export async function findCreator(tx: Tx, createdByUserId: string) {
  const rows = await tx
    .select({ name: user.name, email: user.email })
    .from(user)
    .where(eq(user.id, createdByUserId))
    .limit(1);
  return rows[0] ?? null;
}

export async function create(tx: Tx, data: NewRequest) {
  const [row] = await tx.insert(requests).values({ ...data, status: "open" }).returning();
  return row;
}

export async function updateCaseDescription(tx: Tx, id: string, caseDescription: string) {
  await tx.update(requests).set({ caseDescription, updatedAt: new Date() }).where(eq(requests.id, id));
}

export async function confirm(tx: Tx, id: string) {
  await tx.update(requests).set({ status: "confirmed", updatedAt: new Date() }).where(eq(requests.id, id));
}
