import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-org-queries", () => ({
  loadAdminOrgDetailBundle: vi.fn(),
}));

import { loadAdminOrgDetailBundle } from "@/server/admin/orgs/admin-org-queries";
import { loadAdminDispatcherDetailPageData } from "@/server/admin/dispatchers/load-admin-dispatcher-detail-page";

describe("loadAdminDispatcherDetailPageData", () => {
  const mocked = vi.mocked(loadAdminOrgDetailBundle);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when org is not dispatch", async () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      row: {
        organisations: {
          id: "c1",
          name: "Clinic",
          type: "clinic",
          createdAt: created,
          updatedAt: created,
        },
        clinic_profiles: null,
      },
      memberRows: [],
    });
    await expect(loadAdminDispatcherDetailPageData("c1")).resolves.toEqual({
      kind: "not_found",
    });
  });

  it("maps dispatcher org and members", async () => {
    const created = new Date("2026-03-01T00:00:00.000Z");
    const joined = new Date("2026-03-02T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      row: {
        organisations: {
          id: "d1",
          name: "Dispatch Org",
          type: "dispatch",
          createdAt: created,
          updatedAt: created,
        },
        clinic_profiles: null,
      },
      memberRows: [
        {
          userId: "u9",
          name: "",
          email: "e@x.com",
          role: "admin" as const,
          joinedAt: joined,
        },
      ],
    });

    await expect(loadAdminDispatcherDetailPageData("d1")).resolves.toEqual({
      kind: "ok",
      orgName: "Dispatch Org",
      orgCreatedAt: created,
      members: [
        {
          userId: "u9",
          name: "",
          email: "e@x.com",
          role: "admin",
          joinedAt: joined.toISOString(),
        },
      ],
    });
  });
});
