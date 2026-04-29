import "server-only";

import type { OrgMemberRow } from "@/components/OrgMembersTable";
import { loadAdminOrgDetailBundle } from "@/server/admin/queries/admin-org-queries";
import { mapMembershipRowsToOrgMemberRows } from "@/server/admin/map-org-members";

export type LoadAdminClinicDetailResult =
  | { kind: "not_found" }
  | {
      kind: "ok";
      orgName: string;
      orgCreatedAt: Date;
      profile: {
        address: string | null;
        phone: string | null;
        website: string | null;
        mapsUrl: string | null;
        specialisations: string[] | null;
      } | null;
      members: OrgMemberRow[];
    };

export async function loadAdminClinicDetailPageData(
  orgId: string,
): Promise<LoadAdminClinicDetailResult> {
  const { row, memberRows } = await loadAdminOrgDetailBundle(orgId);

  if (!row || row.organisations.type !== "clinic") {
    return { kind: "not_found" };
  }

  const { organisations: org, clinic_profiles: profile } = row;

  return {
    kind: "ok",
    orgName: org.name,
    orgCreatedAt: org.createdAt,
    profile: profile
      ? {
          address: profile.address,
          phone: profile.phone,
          website: profile.website,
          mapsUrl: profile.mapsUrl,
          specialisations: profile.specialisations,
        }
      : null,
    members: mapMembershipRowsToOrgMemberRows(memberRows),
  };
}
