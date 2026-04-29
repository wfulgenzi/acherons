import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/server/bookings/bookings-rls-queries", () => ({
  listBookingsForClinic: vi.fn(),
  listBookingsForDispatcher: vi.fn(),
}));

import {
  listBookingsForClinic,
  listBookingsForDispatcher,
} from "@/server/bookings/bookings-rls-queries";
import {
  loadBookingsPageData,
  mapClinicRowsToItems,
} from "@/server/bookings/load-bookings-page";

describe("mapClinicRowsToItems", () => {
  it("maps repo rows to clinic booking items", () => {
    const start = new Date("2026-01-15T09:00:00.000Z");
    const end = new Date("2026-01-15T10:00:00.000Z");
    const items = mapClinicRowsToItems([
      {
        id: "booking-1",
        confirmedStart: start,
        confirmedEnd: end,
        requestId: "req-1",
        patientAge: 42,
        patientGender: "female",
        caseDescription: "Example",
      },
    ]);
    expect(items).toEqual([
      {
        id: "booking-1",
        requestId: "req-1",
        confirmedStart: start.toISOString(),
        confirmedEnd: end.toISOString(),
        patientAge: 42,
        patientGender: "female",
        caseDescription: "Example",
      },
    ]);
  });
});

describe("loadBookingsPageData", () => {
  const mockedClinic = vi.mocked(listBookingsForClinic);
  const mockedDispatcher = vi.mocked(listBookingsForDispatcher);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns onboarding redirect when membership is missing", async () => {
    const result = await loadBookingsPageData("user-1", {
      getMembership: async () => null,
    });
    expect(result).toEqual({ kind: "redirect", to: "/onboarding" });
    expect(mockedClinic).not.toHaveBeenCalled();
    expect(mockedDispatcher).not.toHaveBeenCalled();
  });

  it("loads clinic bookings when org is a clinic", async () => {
    const start = new Date("2026-02-01T12:00:00.000Z");
    mockedClinic.mockResolvedValueOnce([
      {
        id: "b1",
        confirmedStart: start,
        confirmedEnd: new Date("2026-02-01T13:00:00.000Z"),
        requestId: "r1",
        patientAge: 50,
        patientGender: "male",
        caseDescription: "Clinic case",
      },
    ]);

    const result = await loadBookingsPageData("user-1", {
      getMembership: async () => ({
        orgId: "org-clinic",
        orgType: "clinic",
        orgName: "Test Clinic",
        role: "member",
      }),
    });

    expect(result.kind).toBe("clinic");
    if (result.kind === "clinic") {
      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("b1");
      expect(result.todayIso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
    expect(mockedClinic).toHaveBeenCalledWith(
      { userId: "user-1", orgId: "org-clinic" },
      "org-clinic",
    );
    expect(mockedDispatcher).not.toHaveBeenCalled();
  });

  it("loads dispatcher bookings when org is dispatch", async () => {
    mockedDispatcher.mockResolvedValueOnce([
      {
        id: "b2",
        confirmedStart: new Date("2026-03-01T08:00:00.000Z"),
        confirmedEnd: new Date("2026-03-01T09:00:00.000Z"),
        requestId: "r2",
        patientAge: 33,
        patientGender: "female",
        caseDescription: "Dispatch case",
        clinicName: "Remote Clinic",
      },
    ]);

    const result = await loadBookingsPageData("user-2", {
      getMembership: async () => ({
        orgId: "org-dispatch",
        orgType: "dispatch",
        orgName: "Dispatch Co",
        role: "admin",
      }),
    });

    expect(result.kind).toBe("dispatcher");
    if (result.kind === "dispatcher") {
      expect(result.data).toHaveLength(1);
      expect(result.data[0].clinicName).toBe("Remote Clinic");
    }
    expect(mockedDispatcher).toHaveBeenCalledWith(
      { userId: "user-2", orgId: "org-dispatch" },
      "org-dispatch",
    );
    expect(mockedClinic).not.toHaveBeenCalled();
  });
});
