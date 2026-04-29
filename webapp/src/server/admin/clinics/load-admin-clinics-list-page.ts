import "server-only";

import type { ClinicRow } from "@/app/admin/clinics/ClinicsTable";
import { loadAdminOrgListWithMemberCounts } from "@/server/admin/orgs/admin-org-queries";

type OrgListBundle = Awaited<
  ReturnType<typeof loadAdminOrgListWithMemberCounts>
>;

export function mapOrgListBundleToClinicRows(bundle: OrgListBundle): ClinicRow[] {
  const countMap = Object.fromEntries(
    bundle.memberCounts.map((r) => [r.orgId, r.count]),
  );
  return bundle.rows.map((r) => ({
    id: r.organisations.id,
    name: r.organisations.name,
    address: r.clinic_profiles?.address ?? null,
    phone: r.clinic_profiles?.phone ?? null,
    specialisations: r.clinic_profiles?.specialisations ?? null,
    memberCount: countMap[r.organisations.id] ?? 0,
    createdAt: r.organisations.createdAt.toISOString(),
  }));
}

export async function loadAdminClinicsListPageData(): Promise<{
  rows: ClinicRow[];
}> {
  const bundle = await loadAdminOrgListWithMemberCounts("clinic");
  return { rows: mapOrgListBundleToClinicRows(bundle) };
}
