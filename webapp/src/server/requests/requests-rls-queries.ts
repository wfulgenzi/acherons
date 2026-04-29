/**
 * All `withRLS` + repository compositions for the requests domain.
 * No `server-only` — integration tests import this module.
 */
import { withRLS } from "@/db/rls";
import type { NewRequest } from "@/db/repositories/requests";
import { orgsRepo, proposalsRepo, requestsRepo, rcaRepo } from "@/db/repositories";
import type { OrgRlsContext } from "@/server/rls-context";

/** @deprecated Use {@link OrgRlsContext} — kept for existing imports. */
export type DispatcherRlsContext = OrgRlsContext;

/**
 * Single request row, or null if RLS / filters exclude it.
 *
 * `dispatcherOrgScope` must match {@link OrgRlsContext.orgId} in production.
 */
export async function fetchDispatcherRequestForOrg(
  ctx: OrgRlsContext,
  requestId: string,
  dispatcherOrgScope: string = ctx.orgId,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    requestsRepo.findByIdForDispatcher(tx, requestId, dispatcherOrgScope),
  );
}

export async function listOpenDispatcherRequestsForOrg(ctx: OrgRlsContext) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    requestsRepo.findOpenByDispatcher(tx, ctx.orgId),
  );
}

export async function listClinicAccessibleRequests(
  ctx: OrgRlsContext,
  clinicOrgId: string,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    requestsRepo.findAccessibleByClinic(tx, clinicOrgId),
  );
}

/** Clinics list for the new-request flow (dispatcher org context). */
export async function listAllClinicsForNewRequest(ctx: OrgRlsContext) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    orgsRepo.findAllClinics(tx),
  );
}

export async function loadDispatcherRequestDetailBundle(
  ctx: OrgRlsContext,
  requestId: string,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) =>
    Promise.all([
      requestsRepo.findByIdForDispatcher(tx, requestId, ctx.orgId),
      rcaRepo.findClinicsOnRequest(tx, requestId),
      proposalsRepo.findByRequestId(tx, requestId),
    ]),
  );
}

/** Edit-request page: request row + all clinics + selected clinic ids (one transaction). */
export async function loadEditRequestPageBundle(ctx: OrgRlsContext, requestId: string) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) =>
    Promise.all([
      requestsRepo.findByIdForDispatcher(tx, requestId, ctx.orgId),
      orgsRepo.findAllClinics(tx),
      rcaRepo.findClinicIdsByRequestId(tx, requestId),
    ]),
  );
}

/** API: create a request and clinic access rows in one RLS transaction. */
export async function createDispatcherRequestWithClinics(
  ctx: OrgRlsContext,
  input: Omit<NewRequest, "dispatcherOrgId"> & { clinicIds: string[] },
) {
  const { clinicIds, ...fields } = input;
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    const req = await requestsRepo.create(tx, {
      ...fields,
      dispatcherOrgId: ctx.orgId,
    });
    await rcaRepo.insertMany(tx, req.id, ctx.orgId, clinicIds);
    return req;
  });
}

/**
 * API: update case description and/or replace clinic list; returns false if
 * the request is missing or not visible to this dispatcher org.
 */
export async function patchDispatcherRequestForOrg(
  ctx: OrgRlsContext,
  requestId: string,
  patch: { caseDescription?: string; clinicIds?: string[] },
): Promise<boolean> {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    const row = await requestsRepo.findByIdForDispatcher(
      tx,
      requestId,
      ctx.orgId,
    );
    if (!row) {
      return false;
    }
    if (patch.caseDescription !== undefined) {
      await requestsRepo.updateCaseDescription(
        tx,
        requestId,
        patch.caseDescription,
      );
    }
    if (patch.clinicIds !== undefined) {
      await rcaRepo.replaceAll(tx, requestId, ctx.orgId, patch.clinicIds);
    }
    return true;
  });
}
