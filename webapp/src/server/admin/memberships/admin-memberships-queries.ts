/**
 * Admin membership assignments (API).
 */
import { adminDb, asAdminDb } from "@/db";
import {
  adminMembershipsRepo,
  adminOrgsRepo,
  adminUsersRepo,
} from "@/db/repositories";

const adb = asAdminDb(adminDb);

export async function adminAssignUserToOrg(
  userId: string,
  orgId: string,
  role: "member" | "admin",
) {
  const targetUser = await adminUsersRepo.findById(adb, userId);
  if (!targetUser) {
    return { ok: false as const, reason: "user_not_found" as const };
  }

  const org = await adminOrgsRepo.findById(adb, orgId);
  if (!org) {
    return { ok: false as const, reason: "org_not_found" as const };
  }

  await adminMembershipsRepo.upsertForUser(adb, userId, orgId, role);
  return { ok: true as const };
}

export async function adminRemoveUserMembership(userId: string) {
  const deleted = await adminMembershipsRepo.deleteByUserId(adb, userId);
  if (!deleted) {
    return { ok: false as const, reason: "no_membership" as const };
  }
  return { ok: true as const };
}
