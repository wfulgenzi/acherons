import "server-only";

import type { DispatcherRow } from "@/app/admin/dispatchers/DispatchersTable";
import { loadAdminOrgListWithMemberCounts } from "@/server/admin/orgs/admin-org-queries";

type OrgListBundle = Awaited<
  ReturnType<typeof loadAdminOrgListWithMemberCounts>
>;

export function mapOrgListBundleToDispatcherRows(
  bundle: OrgListBundle,
): DispatcherRow[] {
  const countMap = Object.fromEntries(
    bundle.memberCounts.map((r) => [r.orgId, r.count]),
  );
  return bundle.rows.map((r) => ({
    id: r.organisations.id,
    name: r.organisations.name,
    memberCount: countMap[r.organisations.id] ?? 0,
    createdAt: r.organisations.createdAt.toISOString(),
  }));
}

export async function loadAdminDispatchersListPageData(): Promise<{
  rows: DispatcherRow[];
}> {
  const bundle = await loadAdminOrgListWithMemberCounts("dispatch");
  return { rows: mapOrgListBundleToDispatcherRows(bundle) };
}
