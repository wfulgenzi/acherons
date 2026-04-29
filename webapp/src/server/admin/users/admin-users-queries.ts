/**
 * Admin user list/detail pages and admin-only user mutations.
 */
import { adminDb, asAdminDb } from "@/db";
import { adminOrgsRepo, adminUsersRepo } from "@/db/repositories";

const adb = asAdminDb(adminDb);

export async function loadAdminUsersListPage() {
  return adminUsersRepo.listWithMemberships(adb);
}

export async function loadAdminUserDetailPage(userId: string) {
  const [u, membershipRow, allOrgs] = await Promise.all([
    adminUsersRepo.findById(adb, userId),
    adminUsersRepo.findMembershipWithOrgForUser(adb, userId),
    adminOrgsRepo.findAllSummary(adb),
  ]);
  return { u, membershipRow, allOrgs };
}

/** Used by DELETE /api/users/:id — caller enforces auth + self-delete guard. */
export async function adminDeleteUserById(userId: string) {
  const u = await adminUsersRepo.findById(adb, userId);
  if (!u) {
    return { ok: false as const, reason: "not_found" as const };
  }
  await adminUsersRepo.deleteById(adb, userId);
  return { ok: true as const };
}
