import { eq, and, desc } from "drizzle-orm";
import type { Tx } from "../rls";
import { proposals, requests, organisations } from "../schema";
import type { ProposedTimeslots } from "../schema";

export type NewProposal = {
  requestId: string;
  clinicOrgId: string;
  dispatcherOrgId: string;
  createdByUserId: string;
  proposedTimeslots: ProposedTimeslots;
  notes: string | null;
};

/** Clinic: list all proposals submitted by this clinic, with request info. */
export async function findByClinic(tx: Tx, clinicOrgId: string) {
  return tx
    .select({
      id: proposals.id,
      status: proposals.status,
      proposedTimeslots: proposals.proposedTimeslots,
      createdAt: proposals.createdAt,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
    })
    .from(proposals)
    .innerJoin(requests, eq(requests.id, proposals.requestId))
    .where(eq(proposals.clinicOrgId, clinicOrgId))
    .orderBy(desc(proposals.createdAt));
}

/** Dispatcher: list all proposals for their requests, with clinic name + request info. */
export async function findByDispatcher(tx: Tx, dispatcherOrgId: string) {
  const clinicOrg = organisations;
  return tx
    .select({
      id: proposals.id,
      status: proposals.status,
      proposedTimeslots: proposals.proposedTimeslots,
      createdAt: proposals.createdAt,
      requestId: requests.id,
      patientAge: requests.patientAge,
      patientGender: requests.patientGender,
      caseDescription: requests.caseDescription,
      clinicName: clinicOrg.name,
    })
    .from(proposals)
    .innerJoin(requests, eq(requests.id, proposals.requestId))
    .innerJoin(clinicOrg, eq(clinicOrg.id, proposals.clinicOrgId))
    .where(eq(proposals.dispatcherOrgId, dispatcherOrgId))
    .orderBy(desc(proposals.createdAt));
}

/** Dispatcher dashboard: pending proposals needing review, with clinic + request info. */
export async function findPendingByDispatcher(tx: Tx, dispatcherOrgId: string, limitN = 6) {
  return tx
    .select({
      proposal: proposals,
      request: requests,
      clinicName: organisations.name,
    })
    .from(proposals)
    .innerJoin(requests, eq(requests.id, proposals.requestId))
    .innerJoin(organisations, eq(organisations.id, proposals.clinicOrgId))
    .where(and(eq(proposals.dispatcherOrgId, dispatcherOrgId), eq(proposals.status, "pending")))
    .orderBy(desc(proposals.createdAt))
    .limit(limitN);
}

/** Dispatcher detail page: proposals on a specific request with clinic name. */
export async function findByRequestId(tx: Tx, requestId: string) {
  return tx
    .select({
      proposal: proposals,
      clinicName: organisations.name,
    })
    .from(proposals)
    .innerJoin(organisations, eq(organisations.id, proposals.clinicOrgId))
    .where(eq(proposals.requestId, requestId))
    .orderBy(proposals.createdAt);
}

/** Clinic: recent proposals with request info (for clinic dashboard). */
export async function findRecentByClinic(tx: Tx, clinicOrgId: string, limitN = 5) {
  return tx
    .select({ proposal: proposals, request: requests })
    .from(proposals)
    .innerJoin(requests, eq(requests.id, proposals.requestId))
    .where(eq(proposals.clinicOrgId, clinicOrgId))
    .orderBy(desc(proposals.createdAt))
    .limit(limitN);
}

/** Check if a clinic already has a proposal for a request (dedup guard). */
export async function findByRequestAndClinic(
  tx: Tx,
  requestId: string,
  clinicOrgId: string
) {
  const rows = await tx
    .select({ id: proposals.id })
    .from(proposals)
    .where(and(eq(proposals.requestId, requestId), eq(proposals.clinicOrgId, clinicOrgId)))
    .limit(1);
  return rows[0] ?? null;
}

/** Fetch a single proposal by id. */
export async function findById(tx: Tx, id: string) {
  const rows = await tx.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function create(tx: Tx, data: NewProposal) {
  const [row] = await tx
    .insert(proposals)
    .values({ ...data, status: "pending" })
    .returning();
  return row;
}

export async function refuse(tx: Tx, id: string) {
  await tx
    .update(proposals)
    .set({ status: "rejected", updatedAt: new Date() })
    .where(eq(proposals.id, id));
}

export async function accept(tx: Tx, id: string) {
  await tx
    .update(proposals)
    .set({ status: "accepted", updatedAt: new Date() })
    .where(eq(proposals.id, id));
}
