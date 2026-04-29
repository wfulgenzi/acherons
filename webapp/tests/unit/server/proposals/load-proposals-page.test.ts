import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/proposals/proposals-rls-queries", () => ({
  listProposalsForClinic: vi.fn(),
  listProposalsForDispatcher: vi.fn(),
}));

import {
  listProposalsForClinic,
  listProposalsForDispatcher,
} from "@/server/proposals/proposals-rls-queries";
import {
  loadProposalsPageData,
  mapClinicRowsToProposalRows,
} from "@/server/proposals/load-proposals-page";

describe("mapClinicRowsToProposalRows", () => {
  it("maps first timeslot and request fields", () => {
    const created = new Date("2026-05-10T11:00:00.000Z");
    const rows = mapClinicRowsToProposalRows([
      {
        id: "p1",
        status: "pending",
        proposedTimeslots: [{ start: "2026-05-12T09:00:00.000Z", end: "2026-05-12T10:00:00.000Z" }],
        createdAt: created,
        requestId: "req-uuid-here-0000",
        patientAge: 55,
        patientGender: "male",
        caseDescription: "Text",
      },
    ]);
    expect(rows[0]).toMatchObject({
      id: "p1",
      requestShortId: "REQ-",
      status: "pending",
      patientAge: 55,
      proposedStart: "2026-05-12T09:00:00.000Z",
      proposedEnd: "2026-05-12T10:00:00.000Z",
      submittedAt: created.toISOString(),
    });
  });
});

describe("loadProposalsPageData", () => {
  const mockedClinic = vi.mocked(listProposalsForClinic);
  const mockedDispatcher = vi.mocked(listProposalsForDispatcher);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboarding redirect when membership is missing", async () => {
    const result = await loadProposalsPageData("user-1", {
      getMembership: async () => null,
    });
    expect(result).toEqual({ kind: "redirect", to: "/onboarding" });
    expect(mockedClinic).not.toHaveBeenCalled();
    expect(mockedDispatcher).not.toHaveBeenCalled();
  });

  it("loads clinic proposals when org is a clinic", async () => {
    const created = new Date("2026-06-01T10:00:00.000Z");
    mockedClinic.mockResolvedValueOnce([
      {
        id: "prop-1",
        status: "pending",
        proposedTimeslots: [],
        createdAt: created,
        requestId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        patientAge: 60,
        patientGender: "female",
        caseDescription: "X",
      },
    ]);

    const result = await loadProposalsPageData("user-1", {
      getMembership: async () => ({
        orgId: "org-c",
        orgType: "clinic",
        orgName: "Clinic",
        role: "member",
      }),
    });

    expect(result.kind).toBe("clinic");
    if (result.kind === "clinic") {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].requestShortId).toBe("AAAA");
    }
    expect(mockedClinic).toHaveBeenCalledWith(
      { userId: "user-1", orgId: "org-c" },
      "org-c",
    );
    expect(mockedDispatcher).not.toHaveBeenCalled();
  });

  it("loads dispatcher proposals when org is dispatch", async () => {
    const created = new Date("2026-06-02T12:00:00.000Z");
    mockedDispatcher.mockResolvedValueOnce([
      {
        id: "prop-2",
        status: "accepted",
        proposedTimeslots: [],
        createdAt: created,
        requestId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        patientAge: 40,
        patientGender: "male",
        caseDescription: "Y",
        clinicName: "Clinic Z",
      },
    ]);

    const result = await loadProposalsPageData("user-2", {
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
      expect(result.data[0].clinicName).toBe("Clinic Z");
      expect(result.data[0].requestShortId).toBe("BBBB");
    }
    expect(mockedDispatcher).toHaveBeenCalledWith(
      { userId: "user-2", orgId: "org-d" },
      "org-d",
    );
    expect(mockedClinic).not.toHaveBeenCalled();
  });
});
