import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/admin/queries/admin-org-queries", () => ({
  loadAdminOrgDetailBundle: vi.fn(),
}));

import { loadAdminOrgDetailBundle } from "@/server/admin/queries/admin-org-queries";
import { loadAdminClinicDetailPageData } from "@/server/admin/load-page/load-admin-clinic-detail-page";

type OrgDetailBundle = Awaited<ReturnType<typeof loadAdminOrgDetailBundle>>;

describe("loadAdminClinicDetailPageData", () => {
  const mocked = vi.mocked(loadAdminOrgDetailBundle);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns not_found when org is missing", async () => {
    mocked.mockResolvedValueOnce({
      row: null,
      memberRows: [],
    } as unknown as OrgDetailBundle);
    await expect(loadAdminClinicDetailPageData("missing")).resolves.toEqual({
      kind: "not_found",
    });
  });

  it("returns not_found when org is not a clinic", async () => {
    const created = new Date("2026-01-01T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      row: {
        organisations: {
          id: "o1",
          name: "Disp",
          type: "dispatch",
          createdAt: created,
          updatedAt: created,
        },
        clinic_profiles: null,
      },
      memberRows: [],
    });
    await expect(loadAdminClinicDetailPageData("o1")).resolves.toEqual({
      kind: "not_found",
    });
  });

  it("maps clinic org, profile, and members", async () => {
    const created = new Date("2026-06-01T12:00:00.000Z");
    const joined = new Date("2026-06-02T00:00:00.000Z");
    mocked.mockResolvedValueOnce({
      row: {
        organisations: {
          id: "c1",
          name: "Clinic X",
          type: "clinic",
          createdAt: created,
          updatedAt: created,
        },
        clinic_profiles: {
          orgId: "c1",
          address: "Addr",
          latitude: null,
          longitude: null,
          phone: "111",
          website: "https://w.example",
          mapsUrl: "https://maps.example",
          specialisations: ["x"],
          openingHours: null,
          createdAt: created,
          updatedAt: created,
        },
      },
      memberRows: [
        {
          userId: "u1",
          name: "Sam",
          email: "s@x.com",
          role: "member" as const,
          joinedAt: joined,
        },
      ],
    });

    await expect(loadAdminClinicDetailPageData("c1")).resolves.toEqual({
      kind: "ok",
      orgName: "Clinic X",
      orgCreatedAt: created,
      profile: {
        address: "Addr",
        phone: "111",
        website: "https://w.example",
        mapsUrl: "https://maps.example",
        specialisations: ["x"],
      },
      members: [
        {
          userId: "u1",
          name: "Sam",
          email: "s@x.com",
          role: "member",
          joinedAt: joined.toISOString(),
        },
      ],
    });
  });
});
