import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/requests/requests-rls-queries", () => ({
  listAllClinicsForNewRequest: vi.fn(),
}));

import { listAllClinicsForNewRequest } from "@/server/requests/requests-rls-queries";
import {
  loadNewRequestPageData,
  mapClinicOrgRowsToNewRequestClinics,
} from "@/server/requests/load-new-request-page";

describe("mapClinicOrgRowsToNewRequestClinics", () => {
  it("maps org rows to clinic items", () => {
    const items = mapClinicOrgRowsToNewRequestClinics([
      {
        id: "c1",
        name: "Clinic",
        address: "1 St",
        phone: "0",
        latitude: 1,
        longitude: 2,
        openingHours: null,
      },
    ]);
    expect(items[0]).toEqual({
      id: "c1",
      name: "Clinic",
      address: "1 St",
      phone: "0",
      latitude: 1,
      longitude: 2,
      openingHours: null,
    });
  });
});

describe("loadNewRequestPageData", () => {
  const mockedListClinics = vi.mocked(listAllClinicsForNewRequest);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to dashboard when not a dispatcher", async () => {
    expect(
      await loadNewRequestPageData("u1", {
        getMembership: async () => ({
          orgId: "o1",
          orgType: "clinic",
          orgName: "X",
          role: "member",
        }),
      }),
    ).toEqual({ kind: "redirect", to: "/dashboard" });
    expect(mockedListClinics).not.toHaveBeenCalled();
  });

  it("redirects to dashboard when membership is missing", async () => {
    expect(
      await loadNewRequestPageData("u1", {
        getMembership: async () => null,
      }),
    ).toEqual({ kind: "redirect", to: "/dashboard" });
  });

  it("loads clinics for dispatch org", async () => {
    mockedListClinics.mockResolvedValueOnce([
      {
        id: "c1",
        name: "A",
        address: null,
        phone: null,
        latitude: null,
        longitude: null,
        openingHours: null,
      },
    ]);

    const result = await loadNewRequestPageData("u1", {
      getMembership: async () => ({
        orgId: "disp",
        orgType: "dispatch",
        orgName: "D",
        role: "admin",
      }),
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.clinics).toHaveLength(1);
      expect(result.clinics[0].name).toBe("A");
    }
    expect(mockedListClinics).toHaveBeenCalledWith({
      userId: "u1",
      orgId: "disp",
    });
  });
});
