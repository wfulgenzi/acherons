import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-org-queries", () => ({
  loadAdminOrgListWithMemberCounts: vi.fn(),
}));

import { loadAdminOrgListWithMemberCounts } from "@/server/admin/orgs/admin-org-queries";
import {
  loadAdminDispatchersListPageData,
  mapOrgListBundleToDispatcherRows,
} from "@/server/admin/dispatchers/load-admin-dispatchers-list-page";

describe("mapOrgListBundleToDispatcherRows", () => {
  it("merges member counts for dispatcher rows", () => {
    const created = new Date("2026-04-01T00:00:00.000Z");
    expect(
      mapOrgListBundleToDispatcherRows({
        rows: [
          {
            organisations: {
              id: "d1",
              name: "Dispatch Co",
              type: "dispatch",
              createdAt: created,
              updatedAt: created,
            },
            clinic_profiles: null,
          },
        ],
        memberCounts: [{ orgId: "d1", count: 5 }],
      }),
    ).toEqual([
      {
        id: "d1",
        name: "Dispatch Co",
        memberCount: 5,
        createdAt: created.toISOString(),
      },
    ]);
  });
});

describe("loadAdminDispatchersListPageData", () => {
  const mocked = vi.mocked(loadAdminOrgListWithMemberCounts);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads dispatch org type", async () => {
    const created = new Date("2026-02-01T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      rows: [
        {
          organisations: {
            id: "x",
            name: "D",
            type: "dispatch",
            createdAt: created,
            updatedAt: created,
          },
          clinic_profiles: null,
        },
      ],
      memberCounts: [],
    });

    await expect(loadAdminDispatchersListPageData()).resolves.toEqual({
      rows: [
        {
          id: "x",
          name: "D",
          memberCount: 0,
          createdAt: created.toISOString(),
        },
      ],
    });
    expect(mocked).toHaveBeenCalledWith("dispatch");
  });
});
