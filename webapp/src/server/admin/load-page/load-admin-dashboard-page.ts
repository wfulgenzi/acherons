import "server-only";

import { loadAdminDashboardOverview } from "@/server/admin/queries/admin-dashboard-queries";

export type AdminDashboardPageData = Awaited<
  ReturnType<typeof loadAdminDashboardOverview>
>;

export async function loadAdminDashboardPageData(): Promise<AdminDashboardPageData> {
  return loadAdminDashboardOverview();
}
