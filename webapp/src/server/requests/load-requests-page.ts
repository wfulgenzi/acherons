import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import {
  listClinicAccessibleRequests,
  listOpenDispatcherRequestsForOrg,
} from "@/server/requests/requests-rls-queries";
import type { ClinicRequestItem } from "@/app/(app)/requests/_clinic/ClinicRequestsView";
import type { RequestRow } from "@/app/(app)/requests/_dispatcher/DispatcherRequestsView";

type ClinicRequestRow = Awaited<
  ReturnType<typeof listClinicAccessibleRequests>
>[number];

type DispatcherRequestRow = Awaited<
  ReturnType<typeof listOpenDispatcherRequestsForOrg>
>[number];

export type RequestsPageResult =
  | { kind: "redirect"; to: "/onboarding" }
  | { kind: "clinic"; items: ClinicRequestItem[] }
  | { kind: "dispatcher"; data: RequestRow[] };

export type RequestsPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
};

export function mapClinicRowsToItems(
  rows: ClinicRequestRow[],
): ClinicRequestItem[] {
  return rows.map((r) => ({
    id: r.id,
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    postcode: r.postcode,
    createdAt: r.createdAt.toISOString(),
    creatorName: r.creatorName,
    creatorEmail: r.creatorEmail,
    proposalStatus: r.proposalStatus ?? null,
  }));
}

export function mapDispatcherRowsToRequestRows(
  rows: DispatcherRequestRow[],
): RequestRow[] {
  return rows.map((r) => ({
    id: r.id,
    shortId: r.id.slice(0, 4).toUpperCase(),
    patientAge: r.patientAge,
    patientGender: r.patientGender,
    caseDescription: r.caseDescription,
    postcode: r.postcode,
    creatorLabel: r.creatorName || r.creatorEmail || "",
    createdAt: r.createdAt.toISOString(),
    clinicsContacted: r.clinicsContacted,
    proposalCount: r.proposalCount,
  }));
}

export async function loadRequestsPageData(
  userId: string,
  deps: RequestsPageLoaderDeps = {},
): Promise<RequestsPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership) {
    return { kind: "redirect", to: "/onboarding" };
  }

  if (membership.orgType === "clinic") {
    const rows = await listClinicAccessibleRequests({
      userId,
      orgId: membership.orgId,
    }, membership.orgId);
    return {
      kind: "clinic",
      items: mapClinicRowsToItems(rows),
    };
  }

  const rows = await listOpenDispatcherRequestsForOrg({
    userId,
    orgId: membership.orgId,
  });
  return {
    kind: "dispatcher",
    data: mapDispatcherRowsToRequestRows(rows),
  };
}
