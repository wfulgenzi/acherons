import { describe, it, expect, beforeEach } from "vitest";
import {
  listProposalsForClinic,
  listProposalsForDispatcher,
} from "@/server/proposals/proposals-rls-queries";
import {
  seedBookingProposalGraph,
  type BookingProposalFixture,
} from "../helpers/booking-proposal-rls-seed";
import { resetIntegrationDatabase } from "../helpers/test-db";

describe("proposals RLS (integration)", () => {
  let fx: BookingProposalFixture;

  beforeEach(async () => {
    await resetIntegrationDatabase();
    fx = await seedBookingProposalGraph();
  });

  it("lists proposals for the owning clinic; other clinic sees none", async () => {
    const clinic1Rows = await listProposalsForClinic(
      { userId: fx.userClinic1, orgId: fx.clinic1Id },
      fx.clinic1Id,
    );
    const clinic2Rows = await listProposalsForClinic(
      { userId: fx.userClinic2, orgId: fx.clinic2Id },
      fx.clinic2Id,
    );
    expect(clinic1Rows.some((p) => p.id === fx.proposalId)).toBe(true);
    expect(clinic2Rows.some((p) => p.id === fx.proposalId)).toBe(false);
  });

  it("dispatcher sees proposals for their org", async () => {
    const rows = await listProposalsForDispatcher(
      { userId: fx.userDispatch, orgId: fx.dispatchOrgId },
      fx.dispatchOrgId,
    );
    expect(rows.some((p) => p.id === fx.proposalId)).toBe(true);
  });
});
