import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/requests/requests-rls-queries", () => ({
  listOpenDispatcherRequestsForOrg: vi.fn(),
  listClinicAccessibleRequests: vi.fn(),
}));

import {
  listOpenDispatcherRequestsForOrg,
  listClinicAccessibleRequests,
} from "@/server/requests/requests-rls-queries";
import {
  loadRequestsPageData,
  mapClinicRowsToItems,
} from "@/server/requests/load-requests-page";

describe("mapClinicRowsToItems", () => {
  it("maps repo rows to clinic request items", () => {
    const created = new Date("2026-04-01T12:00:00.000Z");
    const items = mapClinicRowsToItems([
      {
        id: "req-1",
        patientAge: 40,
        patientGender: "male",
        caseDescription: "Case",
        postcode: "SW1A 1AA",
        createdAt: created,
        creatorName: "A",
        creatorEmail: "a@x.com",
        proposalStatus: "pending",
      },
    ]);
    expect(items).toEqual([
      {
        id: "req-1",
        patientAge: 40,
        patientGender: "male",
        caseDescription: "Case",
        postcode: "SW1A 1AA",
        createdAt: created.toISOString(),
        creatorName: "A",
        creatorEmail: "a@x.com",
        proposalStatus: "pending",
      },
    ]);
  });
});

describe("loadRequestsPageData", () => {
  const mockedClinic = vi.mocked(listClinicAccessibleRequests);
  const mockedListOpenDispatcher = vi.mocked(listOpenDispatcherRequestsForOrg);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboarding redirect when membership is missing", async () => {
    const result = await loadRequestsPageData("user-1", {
      getMembership: async () => null,
    });
    expect(result).toEqual({ kind: "redirect", to: "/onboarding" });
    expect(mockedClinic).not.toHaveBeenCalled();
    expect(mockedListOpenDispatcher).not.toHaveBeenCalled();
  });

  it("loads clinic requests when org is a clinic", async () => {
    const created = new Date("2026-01-01T10:00:00.000Z");
    mockedClinic.mockResolvedValueOnce([
      {
        id: "r1",
        patientAge: 30,
        patientGender: "female",
        caseDescription: "C",
        postcode: "E1",
        createdAt: created,
        creatorName: "N",
        creatorEmail: "e@e.com",
        proposalStatus: null,
      },
    ]);

    const result = await loadRequestsPageData("user-1", {
      getMembership: async () => ({
        orgId: "org-c",
        orgType: "clinic",
        orgName: "Clinic",
        role: "member",
      }),
    });

    expect(result.kind).toBe("clinic");
    if (result.kind === "clinic") {
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("r1");
    }
    expect(mockedClinic).toHaveBeenCalledWith(
      { userId: "user-1", orgId: "org-c" },
      "org-c",
    );
    expect(mockedListOpenDispatcher).not.toHaveBeenCalled();
  });

  it("loads dispatcher open requests when org is dispatch", async () => {
    const created = new Date("2026-02-01T08:00:00.000Z");
    mockedListOpenDispatcher.mockResolvedValueOnce([
      {
        id: "abcdef12-0000-0000-0000-000000000000",
        patientAge: 25,
        patientGender: "other",
        caseDescription: "D",
        postcode: "N1",
        createdAt: created,
        creatorName: "",
        creatorEmail: "d@d.com",
        clinicsContacted: 2,
        proposalCount: 1,
      },
    ]);

    const result = await loadRequestsPageData("user-2", {
      getMembership: async () => ({
        orgId: "org-d",
        orgType: "dispatch",
        orgName: "Dispatch",
        role: "admin",
      }),
    });

    expect(result.kind).toBe("dispatcher");
    if (result.kind === "dispatcher") {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].shortId).toBe("ABCD");
    }
    expect(mockedListOpenDispatcher).toHaveBeenCalledWith({
      userId: "user-2",
      orgId: "org-d",
    });
    expect(mockedClinic).not.toHaveBeenCalled();
  });
});
