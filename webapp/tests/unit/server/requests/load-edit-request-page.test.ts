import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/requests/requests-rls-queries", () => ({
  loadEditRequestPageBundle: vi.fn(),
}));

import { loadEditRequestPageBundle } from "@/server/requests/requests-rls-queries";
import { loadEditRequestPageData } from "@/server/requests/load-edit-request-page";

type EditRequestPageBundle = Awaited<
  ReturnType<typeof loadEditRequestPageBundle>
>;

describe("loadEditRequestPageData", () => {
  const mockedBundle = vi.mocked(loadEditRequestPageBundle);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to dashboard when not dispatch", async () => {
    const result = await loadEditRequestPageData("u1", "req-1", {
      getMembership: async () => ({
        orgId: "o1",
        orgType: "clinic",
        orgName: "C",
        role: "member",
      }),
    });
    expect(result).toEqual({ kind: "redirect", to: "/dashboard" });
    expect(mockedBundle).not.toHaveBeenCalled();
  });

  it("returns notFound when request is missing", async () => {
    mockedBundle.mockResolvedValueOnce(
      [null, [], []] as unknown as EditRequestPageBundle,
    );

    const result = await loadEditRequestPageData("u1", "missing-id", {
      getMembership: async () => ({
        orgId: "d1",
        orgType: "dispatch",
        orgName: "D",
        role: "member",
      }),
    });

    expect(result).toEqual({ kind: "notFound" });
    expect(mockedBundle).toHaveBeenCalledWith(
      { userId: "u1", orgId: "d1" },
      "missing-id",
    );
  });

  it("redirects to request detail when status is not open", async () => {
    mockedBundle.mockResolvedValueOnce([
      {
        id: "rid",
        caseDescription: "x",
        postcode: "N1",
        status: "confirmed",
        patientAge: 40,
        patientGender: "male",
        createdAt: new Date(),
        createdByUserId: "u",
        dispatcherOrgId: "d1",
      } as never,
      [],
      [],
    ]);

    const result = await loadEditRequestPageData("u1", "rid", {
      getMembership: async () => ({
        orgId: "d1",
        orgType: "dispatch",
        orgName: "D",
        role: "member",
      }),
    });

    expect(result).toEqual({ kind: "redirect", to: "/requests/rid" });
  });

  it("returns ok payload for open request", async () => {
    mockedBundle.mockResolvedValueOnce([
      {
        id: "rid",
        caseDescription: "Case text",
        postcode: "E1",
        status: "open",
        patientAge: 30,
        patientGender: "female",
        createdAt: new Date(),
        createdByUserId: "u",
        dispatcherOrgId: "d1",
      } as never,
      [
        {
          id: "c1",
          name: "Clinic",
          address: "St",
          phone: "1",
          latitude: 0,
          longitude: 0,
          openingHours: null,
        },
      ],
      ["c1"],
    ]);

    const result = await loadEditRequestPageData("u1", "rid", {
      getMembership: async () => ({
        orgId: "d1",
        orgType: "dispatch",
        orgName: "D",
        role: "member",
      }),
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.initialDescription).toBe("Case text");
      expect(result.postcode).toBe("E1");
      expect(result.initialSelectedClinicIds).toEqual(["c1"]);
      expect(result.clinics).toHaveLength(1);
      expect(result.requestId).toBe("rid");
    }
  });
});
