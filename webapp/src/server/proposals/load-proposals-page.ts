import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import {
  listProposalsForClinic,
  listProposalsForDispatcher,
} from "@/server/proposals/proposals-rls-queries";
import type { ProposalRow } from "@/app/(app)/proposals/_clinic/ClinicProposalsView";
import type { DispatcherProposalRow } from "@/app/(app)/proposals/_dispatcher/DispatcherProposalsView";
import type { ProposedTimeslots } from "@/db/schema";

type ClinicProposalRow = Awaited<
  ReturnType<typeof listProposalsForClinic>
>[number];

type DispatcherProposalRowDb = Awaited<
  ReturnType<typeof listProposalsForDispatcher>
>[number];

export type ProposalsPageResult =
  | { kind: "redirect"; to: "/onboarding" }
  | { kind: "clinic"; data: ProposalRow[] }
  | { kind: "dispatcher"; data: DispatcherProposalRow[] };

export type ProposalsPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
};

function firstTimeslotBounds(slots: ProposedTimeslots | null) {
  const first = slots?.[0] ?? null;
  return {
    proposedStart: first?.start ?? null,
    proposedEnd: first?.end ?? null,
  };
}

export function mapClinicRowsToProposalRows(
  rows: ClinicProposalRow[],
): ProposalRow[] {
  return rows.map((r) => {
    const slots = r.proposedTimeslots as ProposedTimeslots | null;
    const { proposedStart, proposedEnd } = firstTimeslotBounds(slots);
    return {
      id: r.id,
      requestShortId: r.requestId.slice(0, 4).toUpperCase(),
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      caseDescription: r.caseDescription,
      proposedStart,
      proposedEnd,
      status: r.status,
      submittedAt: r.createdAt.toISOString(),
    };
  });
}

export function mapDispatcherRowsToProposalRows(
  rows: DispatcherProposalRowDb[],
): DispatcherProposalRow[] {
  return rows.map((r) => {
    const slots = r.proposedTimeslots as ProposedTimeslots | null;
    const { proposedStart, proposedEnd } = firstTimeslotBounds(slots);
    return {
      id: r.id,
      requestId: r.requestId,
      requestShortId: r.requestId.slice(0, 4).toUpperCase(),
      patientAge: r.patientAge,
      patientGender: r.patientGender,
      caseDescription: r.caseDescription,
      clinicName: r.clinicName,
      proposedStart,
      proposedEnd,
      status: r.status,
      submittedAt: r.createdAt.toISOString(),
    };
  });
}

export async function loadProposalsPageData(
  userId: string,
  deps: ProposalsPageLoaderDeps = {},
): Promise<ProposalsPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership) {
    return { kind: "redirect", to: "/onboarding" };
  }

  if (membership.orgType === "clinic") {
    const rows = await listProposalsForClinic(
      { userId, orgId: membership.orgId },
      membership.orgId,
    );
    return {
      kind: "clinic",
      data: mapClinicRowsToProposalRows(rows),
    };
  }

  const rows = await listProposalsForDispatcher(
    { userId, orgId: membership.orgId },
    membership.orgId,
  );
  return {
    kind: "dispatcher",
    data: mapDispatcherRowsToProposalRows(rows),
  };
}
