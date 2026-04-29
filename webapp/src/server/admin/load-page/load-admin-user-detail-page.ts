import "server-only";

import type {
  CurrentMembership,
  OrgOption,
} from "@/app/admin/users/[id]/MembershipManager";
import { loadAdminUserDetailPage } from "@/server/admin/queries/admin-users-queries";

export type LoadAdminUserDetailResult =
  | { kind: "not_found" }
  | {
      kind: "ok";
      user: {
        id: string;
        name: string | null;
        email: string;
        isAdmin: boolean;
        createdAt: Date;
      };
      membership: CurrentMembership | null;
      orgOptions: OrgOption[];
    };

function toMembership(
  membershipRow: Awaited<ReturnType<typeof loadAdminUserDetailPage>>["membershipRow"],
): CurrentMembership | null {
  if (!membershipRow?.organisations) {
    return null;
  }
  return {
    orgId: membershipRow.organisations.id,
    orgName: membershipRow.organisations.name,
    orgType: membershipRow.organisations.type,
    role: membershipRow.memberships.role,
  };
}

function toOrgOptions(
  allOrgs: Awaited<ReturnType<typeof loadAdminUserDetailPage>>["allOrgs"],
): OrgOption[] {
  return allOrgs.map((o) => ({
    id: o.id,
    name: o.name,
    type: o.type,
  }));
}

export async function loadAdminUserDetailPageData(
  userId: string,
): Promise<LoadAdminUserDetailResult> {
  const { u, membershipRow, allOrgs } = await loadAdminUserDetailPage(userId);

  if (!u) {
    return { kind: "not_found" };
  }

  return {
    kind: "ok",
    user: {
      id: u.id,
      name: u.name,
      email: u.email,
      isAdmin: u.isAdmin ?? false,
      createdAt: u.createdAt,
    },
    membership: toMembership(membershipRow),
    orgOptions: toOrgOptions(allOrgs),
  };
}
