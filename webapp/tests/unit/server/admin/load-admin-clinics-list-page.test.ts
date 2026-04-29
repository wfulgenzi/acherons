import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-org-queries", () => ({
  loadAdminOrgListWithMemberCounts: vi.fn(),
}));

import { loadAdminOrgListWithMemberCounts } from "@/server/admin/queries/admin-org-queries";
import {
  loadAdminClinicsListPageData,
  mapOrgListBundleToClinicRows,
} from "@/server/admin/load-page/load-admin-clinics-list-page";

describe("mapOrgListBundleToClinicRows", () => {
  it("merges member counts and maps clinic list fields", () => {
    const created = new Date("2026-01-10T00:00:00.000Z");
    const rows = mapOrgListBundleToClinicRows({
      rows: [
        {
          organisations: {
            id: "org-1",
            name: "Clinic A",
            type: "clinic",
            createdAt: created,
            updatedAt: created,
          },
          clinic_profiles: {
            orgId: "org-1",
            address: "1 Main St",
            latitude: null,
            longitude: null,
            phone: "555",
            website: null,
            mapsUrl: null,
            specialisations: ["a", "b"],
            openingHours: null,
            createdAt: created,
            updatedAt: created,
          },
        },
      ],
      memberCounts: [{ orgId: "org-1", count: 3 }],
    });

    expect(rows).toEqual([
      {
        id: "org-1",
        name: "Clinic A",
        address: "1 Main St",
        phone: "555",
        specialisations: ["a", "b"],
        memberCount: 3,
        createdAt: created.toISOString(),
      },
    ]);
  });
});

describe("loadAdminClinicsListPageData", () => {
  const mocked = vi.mocked(loadAdminOrgListWithMemberCounts);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads clinic org type and maps rows", async () => {
    const created = new Date("2026-02-01T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      rows: [
        {
          organisations: {
            id: "o1",
            name: "C",
            type: "clinic",
            createdAt: created,
            updatedAt: created,
          },
          clinic_profiles: null,
        },
      ],
      memberCounts: [],
    });

    await expect(loadAdminClinicsListPageData()).resolves.toEqual({
      rows: [
        {
          id: "o1",
          name: "C",
          address: null,
          phone: null,
          specialisations: null,
          memberCount: 0,
          createdAt: created.toISOString(),
        },
      ],
    });
    expect(mocked).toHaveBeenCalledWith("clinic");
  });
});
