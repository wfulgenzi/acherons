import { describe, it, expect, beforeEach } from "vitest";
import {
  loadClinicDashboardBundle,
  loadDispatcherDashboardBundle,
} from "@/server/dashboard/dashboard-rls-queries";
import {
  seedBookingProposalGraph,
  type BookingProposalFixture,
} from "../helpers/booking-proposal-rls-seed";
import {
  seedTwoDispatchersAndRequestInOrgA,
  type DispatcherRlsFixture,
} from "../helpers/dispatcher-rls-seed";
import { resetIntegrationDatabase } from "../helpers/test-db";

function clinicDashboardWindows(now: Date) {
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86_400_000);
  const daysToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const weekStart = new Date(todayStart.getTime() - daysToMonday * 86_400_000);
  const weekEnd = new Date(weekStart.getTime() + 7 * 86_400_000);
  const fourteenDaysAgo = new Date(todayStart.getTime() - 14 * 86_400_000);
  return { todayStart, todayEnd, weekStart, weekEnd, fourteenDaysAgo };
}

describe("dashboard RLS bundles (integration)", () => {
  describe("dispatcher dashboard bundle", () => {
    let fx: DispatcherRlsFixture;

    beforeEach(async () => {
      await resetIntegrationDatabase();
      fx = await seedTwoDispatchersAndRequestInOrgA();
    });

    it("returns open requests only for the dispatcher org in session", async () => {
      const now = new Date("2030-01-15T12:00:00.000Z");
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayEnd = new Date(todayStart.getTime() + 86_400_000);

      const [forA] = await loadDispatcherDashboardBundle(
        { userId: fx.userA, orgId: fx.orgA },
        { todayStart, todayEnd, now },
      );
      const [forB] = await loadDispatcherDashboardBundle(
        { userId: fx.userB, orgId: fx.orgB },
        { todayStart, todayEnd, now },
      );

      expect(forA.some((r) => r.id === fx.requestId)).toBe(true);
      expect(forB.some((r) => r.id === fx.requestId)).toBe(false);
    });
  });

  describe("clinic dashboard bundle", () => {
    let fx: BookingProposalFixture;

    beforeEach(async () => {
      await resetIntegrationDatabase();
      fx = await seedBookingProposalGraph();
    });

    it("includes accessible requests for the clinic with RCA", async () => {
      const now = new Date("2030-06-20T12:00:00.000Z");
      const [openRequests] = await loadClinicDashboardBundle(
        { userId: fx.userClinic1, orgId: fx.clinic1Id },
        clinicDashboardWindows(now),
      );
      expect(openRequests.some((r) => r.id === fx.requestId)).toBe(true);
    });

    it("excludes requests for a clinic without access", async () => {
      const now = new Date("2030-06-20T12:00:00.000Z");
      const [openRequests] = await loadClinicDashboardBundle(
        { userId: fx.userClinic2, orgId: fx.clinic2Id },
        clinicDashboardWindows(now),
      );
      expect(openRequests.some((r) => r.id === fx.requestId)).toBe(false);
    });
  });
});
