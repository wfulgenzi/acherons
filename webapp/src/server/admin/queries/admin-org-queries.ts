/**
 * Admin org list/detail pages (clinics + dispatchers): composed admin queries.
 */
import { adminDb, asAdminDb } from "@/db";
import { adminMembershipsRepo, adminOrgsRepo } from "@/db/repositories";

const adb = asAdminDb(adminDb);

/** List orgs of a type plus member-count rows (same composition as list pages). */
export async function loadAdminOrgListWithMemberCounts(
  type: "clinic" | "dispatch",
) {
  const [rows, memberCounts] = await Promise.all([
    adminOrgsRepo.findAllByType(adb, type),
    adminMembershipsRepo.memberCountsByOrg(adb),
  ]);
  return { rows, memberCounts };
}

/** Single org row + members list (detail pages). */
export async function loadAdminOrgDetailBundle(orgId: string) {
  const [row, memberRows] = await Promise.all([
    adminOrgsRepo.findById(adb, orgId),
    adminMembershipsRepo.findByOrgId(adb, orgId),
  ]);
  return { row, memberRows };
}
