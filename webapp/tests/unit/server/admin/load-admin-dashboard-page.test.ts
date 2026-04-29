import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-dashboard-queries", () => ({
  loadAdminDashboardOverview: vi.fn(),
}));

import { loadAdminDashboardOverview } from "@/server/admin/dashboard/admin-dashboard-queries";
import { loadAdminDashboardPageData } from "@/server/admin/dashboard/load-admin-dashboard-page";

describe("loadAdminDashboardPageData", () => {
  const mocked = vi.mocked(loadAdminDashboardOverview);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns overview counts from the admin query module", async () => {
    mocked.mockResolvedValueOnce({
      userCount: 4,
      clinicCount: 2,
      dispatcherCount: 1,
    });

    await expect(loadAdminDashboardPageData()).resolves.toEqual({
      userCount: 4,
      clinicCount: 2,
      dispatcherCount: 1,
    });
    expect(mocked).toHaveBeenCalledTimes(1);
  });
});
