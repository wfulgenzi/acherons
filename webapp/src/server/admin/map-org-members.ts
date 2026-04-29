import type { OrgMemberRow } from "@/components/OrgMembersTable";

/** Shape returned by {@link adminMembershipsRepo.findByOrgId} rows. */
export type AdminOrgMemberRow = {
  userId: string;
  name: string | null;
  email: string;
  role: "member" | "admin";
  joinedAt: Date;
};

export function mapMembershipRowsToOrgMemberRows(
  memberRows: AdminOrgMemberRow[],
): OrgMemberRow[] {
  return memberRows.map((m) => ({
    userId: m.userId,
    name: m.name,
    email: m.email,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
  }));
}
