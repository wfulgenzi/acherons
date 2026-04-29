import "server-only";

import type { OrgMemberRow } from "@/components/OrgMembersTable";
import { loadAdminOrgDetailBundle } from "@/server/admin/queries/admin-org-queries";
import { mapMembershipRowsToOrgMemberRows } from "@/server/admin/map-org-members";

export type LoadAdminDispatcherDetailResult =
  | { kind: "not_found" }
  | {
      kind: "ok";
      orgName: string;
      orgCreatedAt: Date;
      members: OrgMemberRow[];
    };

export async function loadAdminDispatcherDetailPageData(
  orgId: string,
): Promise<LoadAdminDispatcherDetailResult> {
  const { row, memberRows } = await loadAdminOrgDetailBundle(orgId);

  if (!row || row.organisations.type !== "dispatch") {
    return { kind: "not_found" };
  }

  const org = row.organisations;

  return {
    kind: "ok",
    orgName: org.name,
    orgCreatedAt: org.createdAt,
    members: mapMembershipRowsToOrgMemberRows(memberRows),
  };
}
