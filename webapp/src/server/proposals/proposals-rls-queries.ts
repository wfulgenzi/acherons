/**
 * `withRLS` + proposals repositories for server loaders, API routes, and tests.
 */
import { withRLS } from "@/db/rls";
import type { ProposedTimeslots } from "@/db/schema";
import { bookingsRepo, proposalsRepo, requestsRepo, rcaRepo } from "@/db/repositories";
import type { OrgRlsContext } from "@/server/rls-context";

export type CreateClinicProposalResult =
  | { error: string; status: number }
  | { id: string; requestId: string; dispatcherOrgId: string };

export type DispatcherProposalActionResult =
  | { error: string; status: number }
  | {
      outcome: "refused";
      clinicOrgId: string;
      requestId: string;
      proposalId: string;
    }
  | {
      outcome: "accepted";
      clinicOrgId: string;
      requestId: string;
      bookingId: string;
    };

export async function listProposalsForClinic(ctx: OrgRlsContext, clinicOrgId: string) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    proposalsRepo.findByClinic(tx, clinicOrgId),
  );
}

export async function listProposalsForDispatcher(
  ctx: OrgRlsContext,
  dispatcherOrgId: string,
) {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, (tx) =>
    proposalsRepo.findByDispatcher(tx, dispatcherOrgId),
  );
}

/** API: clinic submits a proposal for an open request they can access. */
export async function createClinicProposalForRequest(
  ctx: OrgRlsContext,
  input: {
    requestId: string;
    proposedTimeslots: ProposedTimeslots;
    notes: string | null;
    createdByUserId: string;
  },
): Promise<CreateClinicProposalResult> {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    const req = await requestsRepo.findOpenById(tx, input.requestId);
    if (!req) {
      return { error: "Request not found or not open.", status: 404 };
    }

    const access = await rcaRepo.findByRequestAndClinic(
      tx,
      input.requestId,
      ctx.orgId,
    );
    if (!access) {
      return { error: "Forbidden", status: 403 };
    }

    const existing = await proposalsRepo.findByRequestAndClinic(
      tx,
      input.requestId,
      ctx.orgId,
    );
    if (existing) {
      return {
        error: "You have already submitted a proposal for this request.",
        status: 409,
      };
    }

    const proposal = await proposalsRepo.create(tx, {
      requestId: input.requestId,
      clinicOrgId: ctx.orgId,
      dispatcherOrgId: req.dispatcherOrgId,
      createdByUserId: input.createdByUserId,
      proposedTimeslots: input.proposedTimeslots,
      notes: input.notes,
    });

    return {
      id: proposal.id,
      requestId: proposal.requestId,
      dispatcherOrgId: proposal.dispatcherOrgId,
    };
  });
}

/** API: dispatcher accepts or refuses a pending proposal (booking on accept). */
export async function executeDispatcherProposalAction(
  ctx: OrgRlsContext,
  proposalId: string,
  action: "accept" | "refuse",
): Promise<DispatcherProposalActionResult> {
  return withRLS({ userId: ctx.userId, orgId: ctx.orgId }, async (tx) => {
    const proposal = await proposalsRepo.findById(tx, proposalId);
    if (!proposal) {
      return { error: "Proposal not found.", status: 404 };
    }

    if (proposal.dispatcherOrgId !== ctx.orgId) {
      return { error: "Forbidden", status: 403 };
    }

    if (proposal.status !== "pending") {
      return { error: "Proposal is no longer pending.", status: 409 };
    }

    if (action === "refuse") {
      await proposalsRepo.refuse(tx, proposalId);
      return {
        outcome: "refused",
        clinicOrgId: proposal.clinicOrgId,
        requestId: proposal.requestId,
        proposalId: proposal.id,
      };
    }

    const slots = proposal.proposedTimeslots;
    if (!slots || slots.length === 0) {
      return { error: "No timeslots on this proposal.", status: 400 };
    }

    const firstSlot = slots[0];
    const booking = await bookingsRepo.create(tx, {
      requestId: proposal.requestId,
      proposalId: proposal.id,
      dispatcherOrgId: proposal.dispatcherOrgId,
      clinicOrgId: proposal.clinicOrgId,
      confirmedStart: new Date(firstSlot.start),
      confirmedEnd: new Date(firstSlot.end),
    });
    await proposalsRepo.accept(tx, proposalId);
    await requestsRepo.confirm(tx, proposal.requestId);

    return {
      outcome: "accepted",
      clinicOrgId: proposal.clinicOrgId,
      requestId: proposal.requestId,
      bookingId: booking.id,
    };
  });
}
