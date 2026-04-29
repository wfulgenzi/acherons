import "server-only";

import { db } from "@/db";
import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import { requestsRepo } from "@/db/repositories";
import { loadDispatcherRequestDetailBundle } from "@/server/requests/requests-rls-queries";
import type { ProposalItem } from "@/app/(app)/requests/[id]/ProposalsList";
import type { OpeningHours } from "@/db/schema";

export type ClinicOnRequest = {
  id: string;
  name: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  openingHours: OpeningHours | null;
};

type DispatcherRequestDetailBundle = Awaited<
  ReturnType<typeof loadDispatcherRequestDetailBundle>
>;

type ClinicOnRequestRow = DispatcherRequestDetailBundle[1][number];
type ProposalJoinRow = DispatcherRequestDetailBundle[2][number];
type DispatcherRequestRow = NonNullable<DispatcherRequestDetailBundle[0]>;

export type RequestDetailPageResult =
  | { kind: "redirect"; to: "/dashboard" }
  | { kind: "notFound" }
  | {
      kind: "ok";
      requestId: string;
      req: DispatcherRequestRow;
      clinics: ClinicOnRequest[];
      proposalItems: ProposalItem[];
      pendingCount: number;
      shortId: string;
      creatorLabel: string;
      createdLabel: string;
      genderLabel: string;
    };

export type RequestDetailPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
  /** Override for tests; production uses `requestsRepo.findCreator(db, …)`. */
  findCreator?: (
    createdByUserId: string,
  ) => Promise<{ name: string | null; email: string | null } | null>;
};

export function mapClinicRowsForRequestDetail(
  rows: ClinicOnRequestRow[],
): ClinicOnRequest[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    openingHours: r.openingHours ?? null,
  }));
}

export function mapProposalJoinRowsToProposalItems(
  rows: ProposalJoinRow[],
): ProposalItem[] {
  return rows.map((r) => ({
    id: r.proposal.id,
    clinicName: r.clinicName,
    status: r.proposal.status,
    notes: r.proposal.notes,
    proposedTimeslots: r.proposal.proposedTimeslots,
    createdAt: r.proposal.createdAt.toISOString(),
  }));
}

export function formatRequestDetailCreatedLabel(createdAt: Date): string {
  return (
    createdAt.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    }) +
    ", " +
    createdAt.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    })
  );
}

export function patientGenderLabel(
  patientGender: DispatcherRequestRow["patientGender"],
): string {
  if (patientGender === "male") {
    return "Male";
  }
  if (patientGender === "female") {
    return "Female";
  }
  if (patientGender === "other") {
    return "Other";
  }
  return "Unknown";
}

export async function loadRequestDetailPageData(
  userId: string,
  requestId: string,
  deps: RequestDetailPageLoaderDeps = {},
): Promise<RequestDetailPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership || membership.orgType !== "dispatch") {
    return { kind: "redirect", to: "/dashboard" };
  }

  const [req, clinicRows, proposalRows] = await loadDispatcherRequestDetailBundle(
    { userId, orgId: membership.orgId },
    requestId,
  );

  if (!req) {
    return { kind: "notFound" };
  }

  const resolveCreator =
    deps.findCreator ??
    ((createdByUserId: string) =>
      requestsRepo.findCreator(db, createdByUserId));

  const creator = await resolveCreator(req.createdByUserId);

  const clinics = mapClinicRowsForRequestDetail(clinicRows);
  const proposalItems = mapProposalJoinRowsToProposalItems(proposalRows);
  const pendingCount = proposalItems.filter((p) => p.status === "pending").length;
  const shortId = req.id.slice(0, 8).toUpperCase();
  const creatorLabel = creator?.name || creator?.email || "Unknown";
  const createdLabel = formatRequestDetailCreatedLabel(req.createdAt);
  const genderLabel = patientGenderLabel(req.patientGender);

  return {
    kind: "ok",
    requestId,
    req,
    clinics,
    proposalItems,
    pendingCount,
    shortId,
    creatorLabel,
    createdLabel,
    genderLabel,
  };
}
