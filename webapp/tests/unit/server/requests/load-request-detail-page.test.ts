import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/requests/requests-rls-queries", () => ({
  loadDispatcherRequestDetailBundle: vi.fn(),
}));

vi.mock("@/db/repositories", () => ({
  requestsRepo: {
    findCreator: vi.fn(),
  },
}));

import { requestsRepo } from "@/db/repositories";
import { loadDispatcherRequestDetailBundle } from "@/server/requests/requests-rls-queries";
import {
  loadRequestDetailPageData,
  mapClinicRowsForRequestDetail,
  mapProposalJoinRowsToProposalItems,
  patientGenderLabel,
  formatRequestDetailCreatedLabel,
} from "@/server/requests/load-request-detail-page";

type DispatcherRequestDetailBundle = Awaited<
  ReturnType<typeof loadDispatcherRequestDetailBundle>
>;

describe("patientGenderLabel", () => {
  it("maps known genders", () => {
    expect(patientGenderLabel("male")).toBe("Male");
    expect(patientGenderLabel("female")).toBe("Female");
    expect(patientGenderLabel("other")).toBe("Other");
  });

  it("returns Unknown for null or unknown", () => {
    expect(patientGenderLabel(null)).toBe("Unknown");
    expect(patientGenderLabel("unknown")).toBe("Unknown");
  });
});

describe("formatRequestDetailCreatedLabel", () => {
  it("includes date and time separated by comma", () => {
    const s = formatRequestDetailCreatedLabel(
      new Date(Date.UTC(2026, 5, 15, 14, 30, 0)),
    );
    expect(s).toContain(",");
    expect(s.length).toBeGreaterThan(5);
  });
});

describe("mapClinicRowsForRequestDetail", () => {
  it("normalizes nullable fields", () => {
    const out = mapClinicRowsForRequestDetail([
      {
        id: "c1",
        name: "Clinic",
        address: null,
        latitude: 1,
        longitude: 2,
        openingHours: null,
      },
    ]);
    expect(out[0]).toEqual({
      id: "c1",
      name: "Clinic",
      address: null,
      latitude: 1,
      longitude: 2,
      openingHours: null,
    });
  });
});

describe("mapProposalJoinRowsToProposalItems", () => {
  it("maps proposal join rows", () => {
    const created = new Date("2026-01-10T12:00:00.000Z");
    const items = mapProposalJoinRowsToProposalItems([
      {
        proposal: {
          id: "p1",
          status: "pending",
          notes: null,
          proposedTimeslots: [],
          createdAt: created,
          requestId: "r1",
          clinicOrgId: "c-org",
          dispatcherOrgId: "d-org",
          createdByUserId: "u1",
        },
        clinicName: "Clinic X",
      } as never,
    ]);
    expect(items[0]).toMatchObject({
      id: "p1",
      clinicName: "Clinic X",
      status: "pending",
      createdAt: created.toISOString(),
    });
  });
});

describe("loadRequestDetailPageData", () => {
  const mockedBundle = vi.mocked(loadDispatcherRequestDetailBundle);
  const mockedCreator = vi.mocked(requestsRepo.findCreator);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("redirects to dashboard when not dispatch", async () => {
    const result = await loadRequestDetailPageData("u1", "rid", {
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
      [null, [], []] as unknown as DispatcherRequestDetailBundle,
    );

    const result = await loadRequestDetailPageData("u1", "missing", {
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
      "missing",
    );
  });

  it("returns ok with derived fields", async () => {
    const createdAt = new Date("2026-03-01T15:00:00.000Z");
    mockedBundle.mockResolvedValueOnce([
      {
        id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        status: "open",
        caseDescription: "Desc",
        postcode: "SW1",
        patientAge: 55,
        patientGender: "male",
        createdAt,
        createdByUserId: "creator-1",
        dispatcherOrgId: "d1",
      } as never,
      [
        {
          id: "clinic-1",
          name: "C",
          address: "Addr",
          latitude: 0,
          longitude: 0,
          openingHours: null,
        },
      ],
      [
        {
          proposal: {
            id: "prop-1",
            status: "pending",
            notes: null,
            proposedTimeslots: [],
            createdAt: new Date("2026-03-02T10:00:00.000Z"),
            requestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            clinicOrgId: "c1",
            dispatcherOrgId: "d1",
            createdByUserId: "u2",
          },
          clinicName: "Clinic Z",
        } as never,
      ],
    ]);
    mockedCreator.mockResolvedValueOnce({ name: "Alex", email: "" });

    const result = await loadRequestDetailPageData("u1", "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", {
      getMembership: async () => ({
        orgId: "d1",
        orgType: "dispatch",
        orgName: "D",
        role: "member",
      }),
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.shortId).toBe("AAAAAAAA");
      expect(result.creatorLabel).toBe("Alex");
      expect(result.genderLabel).toBe("Male");
      expect(result.pendingCount).toBe(1);
      expect(result.clinics).toHaveLength(1);
      expect(result.proposalItems).toHaveLength(1);
      expect(result.req.caseDescription).toBe("Desc");
    }
    expect(mockedCreator).toHaveBeenCalledWith(
      expect.anything(),
      "creator-1",
    );
  });

  it("uses injected findCreator", async () => {
    const createdAt = new Date("2026-03-01T15:00:00.000Z");
    mockedBundle.mockResolvedValueOnce([
      {
        id: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        status: "confirmed",
        caseDescription: "X",
        postcode: "N1",
        patientAge: null,
        patientGender: "unknown",
        createdAt,
        createdByUserId: "u9",
        dispatcherOrgId: "d1",
      } as never,
      [],
      [],
    ]);

    const findCreator = vi.fn().mockResolvedValue({ name: null, email: "e@e.com" });

    const result = await loadRequestDetailPageData("u1", "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb", {
      getMembership: async () => ({
        orgId: "d1",
        orgType: "dispatch",
        orgName: "D",
        role: "member",
      }),
      findCreator,
    });

    expect(result.kind).toBe("ok");
    if (result.kind === "ok") {
      expect(result.creatorLabel).toBe("e@e.com");
    }
    expect(findCreator).toHaveBeenCalledWith("u9");
    expect(mockedCreator).not.toHaveBeenCalled();
  });
});
