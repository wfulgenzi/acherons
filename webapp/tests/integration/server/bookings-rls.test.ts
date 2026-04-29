import { describe, it, expect, beforeEach } from "vitest";
import {
  listBookingsForClinic,
  listBookingsForDispatcher,
} from "@/server/bookings/bookings-rls-queries";
import {
  seedBookingProposalGraph,
  type BookingProposalFixture,
} from "../helpers/booking-proposal-rls-seed";
import { resetIntegrationDatabase } from "../helpers/test-db";

describe("bookings RLS (integration)", () => {
  let fx: BookingProposalFixture;

  beforeEach(async () => {
    await resetIntegrationDatabase();
    fx = await seedBookingProposalGraph();
  });

  it("lists bookings only for the clinic org in context", async () => {
    const forClinic1 = await listBookingsForClinic(
      { userId: fx.userClinic1, orgId: fx.clinic1Id },
      fx.clinic1Id,
    );
    const forClinic2 = await listBookingsForClinic(
      { userId: fx.userClinic2, orgId: fx.clinic2Id },
      fx.clinic2Id,
    );
    expect(forClinic1.some((b) => b.id === fx.bookingId)).toBe(true);
    expect(forClinic2.some((b) => b.id === fx.bookingId)).toBe(false);
  });

  it("lists bookings for the dispatcher org that owns the request", async () => {
    const rows = await listBookingsForDispatcher(
      { userId: fx.userDispatch, orgId: fx.dispatchOrgId },
      fx.dispatchOrgId,
    );
    expect(rows.some((b) => b.id === fx.bookingId)).toBe(true);
  });
});
