import "server-only";

import { getMembership } from "@/lib/membership";
import type { MembershipContext } from "@/lib/membership";
import { listAllClinicsForNewRequest } from "@/server/requests/requests-rls-queries";
import type { ClinicItem } from "@/app/(app)/requests/new/NewRequestFlow";

type ClinicOrgRow = Awaited<
  ReturnType<typeof listAllClinicsForNewRequest>
>[number];

export type NewRequestPageResult =
  | { kind: "redirect"; to: "/dashboard" }
  | { kind: "ok"; clinics: ClinicItem[] };

export type NewRequestPageLoaderDeps = {
  getMembership?: (
    userId: string,
  ) => Promise<MembershipContext | null>;
};

export function mapClinicOrgRowsToNewRequestClinics(
  rows: ClinicOrgRow[],
): ClinicItem[] {
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    address: r.address ?? null,
    phone: r.phone ?? null,
    latitude: r.latitude,
    longitude: r.longitude,
    openingHours: r.openingHours ?? null,
  }));
}

/**
 * New request flow is dispatcher-only. Non-dispatch users are sent to the dashboard
 * (same as the previous inline page — not onboarding).
 */
export async function loadNewRequestPageData(
  userId: string,
  deps: NewRequestPageLoaderDeps = {},
): Promise<NewRequestPageResult> {
  const resolveMembership = deps.getMembership ?? getMembership;
  const membership = await resolveMembership(userId);
  if (!membership || membership.orgType !== "dispatch") {
    return { kind: "redirect", to: "/dashboard" };
  }

  const clinicRows = await listAllClinicsForNewRequest({
    userId,
    orgId: membership.orgId,
  });

  return {
    kind: "ok",
    clinics: mapClinicOrgRowsToNewRequestClinics(clinicRows),
  };
}
