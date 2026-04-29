import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import { loadEditRequestPageBundle } from "@/server/requests/requests-rls-queries";
import type { EditClinicItem } from "@/app/(app)/requests/[id]/edit/EditRequestFlow";

type ClinicOrgRow = Awaited<
  ReturnType<typeof loadEditRequestPageBundle>
>[1][number];

export type EditRequestPageResult =
  | { kind: "redirect"; to: string }
  | { kind: "notFound" }
  | {
      kind: "ok";
      requestId: string;
      initialDescription: string;
      initialSelectedClinicIds: string[];
      postcode: string;
      clinics: EditClinicItem[];
    };

export type EditRequestPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
};

export function mapClinicOrgRowsToEditClinicItems(
  rows: ClinicOrgRow[],
): EditClinicItem[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    phone: r.phone ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    openingHours: r.openingHours ?? null,
  }));
}

export async function loadEditRequestPageData(
  userId: string,
  requestId: string,
  deps: EditRequestPageLoaderDeps = {},
): Promise<EditRequestPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership || membership.orgType !== "dispatch") {
    return { kind: "redirect", to: "/dashboard" };
  }

  const [req, allClinicRows, selectedClinicIds] = await loadEditRequestPageBundle(
    { userId, orgId: membership.orgId },
    requestId,
  );

  if (!req) {
    return { kind: "notFound" };
  }
  if (req.status !== "open") {
    return { kind: "redirect", to: `/requests/${requestId}` };
  }

  return {
    kind: "ok",
    requestId,
    initialDescription: req.caseDescription,
    initialSelectedClinicIds: selectedClinicIds,
    postcode: req.postcode,
    clinics: mapClinicOrgRowsToEditClinicItems(allClinicRows),
  };
}
