/**
 * Admin dashboard: composed queries on {@link asAdminDb}.
 * No `server-only` — integration tests may import this module.
 */
import { adminDb, asAdminDb } from "@/db";
import { adminDashboardRepo } from "@/db/repositories";

const adb = asAdminDb(adminDb);

export async function loadAdminDashboardOverview() {
  return adminDashboardRepo.getOverviewCounts(adb);
}
