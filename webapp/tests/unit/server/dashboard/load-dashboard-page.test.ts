import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/dashboard/dashboard-rls-queries", () => ({
  loadClinicDashboardBundle: vi.fn(),
  loadDispatcherDashboardBundle: vi.fn(),
}));

import {
  loadClinicDashboardBundle,
  loadDispatcherDashboardBundle,
} from "@/server/dashboard/dashboard-rls-queries";
import {
  loadDashboardPageData,
  getDashboardGreeting,
  buildClinicDashboardHeaderTitle,
} from "@/server/dashboard/load-dashboard-page";

describe("getDashboardGreeting", () => {
  it("returns morning before noon", () => {
    expect(getDashboardGreeting(11)).toBe("Good morning");
  });

  it("returns afternoon before 17:00", () => {
    expect(getDashboardGreeting(14)).toBe("Good afternoon");
  });

  it("returns evening from 17:00", () => {
    expect(getDashboardGreeting(18)).toBe("Good evening");
  });
});

describe("buildClinicDashboardHeaderTitle", () => {
  it("appends first name when present", () => {
    expect(
      buildClinicDashboardHeaderTitle("Good morning", "Sam"),
    ).toBe("Good morning, Sam");
  });

  it("omits name when null", () => {
    expect(buildClinicDashboardHeaderTitle("Good evening", null)).toBe(
      "Good evening",
    );
  });
});

describe("loadDashboardPageData", () => {
  const mockedClinicBundle = vi.mocked(loadClinicDashboardBundle);
  const mockedDispatcherBundle = vi.mocked(loadDispatcherDashboardBundle);

  const fixedNow = new Date("2026-06-15T14:30:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to onboarding when membership is missing", async () => {
    const result = await loadDashboardPageData("u1", "Alex Name", {
      getMembership: async () => null,
    });
    expect(result).toEqual({ kind: "redirect", to: "/onboarding" });
    expect(mockedClinicBundle).not.toHaveBeenCalled();
    expect(mockedDispatcherBundle).not.toHaveBeenCalled();
  });

  it("loads clinic dashboard data", async () => {
    const created = new Date("2026-06-10T10:00:00.000Z");
    const bookingBase = {
      booking: {
        id: "b1",
        confirmedStart: new Date("2026-06-16T09:00:00.000Z"),
        confirmedEnd: new Date("2026-06-16T10:00:00.000Z"),
      },
      request: {
        patientAge: 40,
        patientGender: "male" as const,
        caseDescription: "Case",
      },
    } as never;

    mockedClinicBundle.mockResolvedValueOnce([
      [
        {
          id: "r1",
          patientAge: 30,
          patientGender: "female",
          caseDescription: "R",
          postcode: "E1",
          createdAt: created,
          creatorName: "A",
          creatorEmail: "a@a.com",
          proposalStatus: "pending" as const,
        },
      ],
      [bookingBase],
      [bookingBase],
      3,
      [
        {
          proposal: {
            id: "p1",
            status: "pending" as const,
            createdAt: new Date("2026-06-11T12:00:00.000Z"),
          },
          request: {
            patientAge: 50,
            patientGender: "female" as const,
          },
        } as never,
      ],
    ]);

    const result = await loadDashboardPageData("u1", "Pat Smith", {
      getMembership: async () => ({
        orgId: "c-org",
        orgType: "clinic",
        orgName: "Clinic",
        role: "member",
      }),
      now: fixedNow,
    });

    expect(result.kind).toBe("clinic");
    if (result.kind === "clinic") {
      expect(result.data.headerTitle).toContain("Good afternoon");
      expect(result.data.headerTitle).toContain("Pat");
      expect(result.data.statCards.newRequestsCount).toBe(1);
      expect(result.data.newRequestsItems).toHaveLength(1);
      expect(result.data.recentActivityItems).toHaveLength(1);
    }
    expect(mockedClinicBundle).toHaveBeenCalledWith(
      { userId: "u1", orgId: "c-org" },
      expect.objectContaining({
        todayStart: expect.any(Date),
        todayEnd: expect.any(Date),
      }),
    );
    expect(mockedDispatcherBundle).not.toHaveBeenCalled();
  });

  it("loads dispatcher dashboard data", async () => {
    const created = new Date("2026-06-12T08:00:00.000Z");
    mockedDispatcherBundle.mockResolvedValueOnce([
      [
        {
          id: "o1",
          patientAge: 20,
          patientGender: "other" as const,
          caseDescription: "D",
          postcode: "N1",
          createdAt: created,
          creatorName: "X",
          creatorEmail: "x@x.com",
          clinicsContacted: 1,
          proposalCount: 0,
        },
      ],
      [
        {
          proposal: {
            id: "pp1",
            proposedTimeslots: [{ start: "2026-07-01T10:00:00.000Z", end: "2026-07-01T11:00:00.000Z" }],
            createdAt: new Date("2026-06-14T10:00:00.000Z"),
            patientAge: 25,
            patientGender: "male" as const,
            caseDescription: "PC",
          },
          request: { patientAge: 25, patientGender: "male" as const, caseDescription: "PC" },
          clinicName: "Clinic A",
        } as never,
      ],
      2,
      5,
    ]);

    const result = await loadDashboardPageData("u2", null, {
      getMembership: async () => ({
        orgId: "d-org",
        orgType: "dispatch",
        orgName: "Dispatch",
        role: "admin",
      }),
      now: fixedNow,
    });

    expect(result.kind).toBe("dispatcher");
    if (result.kind === "dispatcher") {
      expect(result.data.statCards.openRequestsCount).toBe(1);
      expect(result.data.statCards.newProposalsCount).toBe(1);
      expect(result.data.proposalItems).toHaveLength(1);
      expect(result.data.proposalItems[0].clinicName).toBe("Clinic A");
      expect(result.data.openRequestItems).toHaveLength(1);
    }
    expect(mockedDispatcherBundle).toHaveBeenCalledWith(
      { userId: "u2", orgId: "d-org" },
      expect.objectContaining({
        todayStart: expect.any(Date),
        todayEnd: expect.any(Date),
        now: fixedNow,
      }),
    );
    expect(mockedClinicBundle).not.toHaveBeenCalled();
  });
});
