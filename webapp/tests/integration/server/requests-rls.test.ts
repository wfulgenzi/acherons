import { describe, it, expect, beforeEach } from "vitest";
import {
  fetchDispatcherRequestForOrg,
  listOpenDispatcherRequestsForOrg,
} from "@/server/requests/requests-rls-queries";
import {
  seedTwoDispatchersAndRequestInOrgA,
  type DispatcherRlsFixture,
} from "../helpers/dispatcher-rls-seed";
import { resetIntegrationDatabase } from "../helpers/test-db";

describe("requests RLS (integration)", () => {
  let fx: DispatcherRlsFixture;

  beforeEach(async () => {
    await resetIntegrationDatabase();
    fx = await seedTwoDispatchersAndRequestInOrgA();
  });

  it("lets the owning dispatcher org read its request by id", async () => {
    const row = await fetchDispatcherRequestForOrg(
      { userId: fx.userA, orgId: fx.orgA },
      fx.requestId,
    );
    expect(row).not.toBeNull();
    expect(row!.id).toBe(fx.requestId);
    expect(row!.dispatcherOrgId).toBe(fx.orgA);
  });

  it("hides another dispatcher org's request by id (cross-tenant SELECT)", async () => {
    const row = await fetchDispatcherRequestForOrg(
      { userId: fx.userB, orgId: fx.orgB },
      fx.requestId,
      fx.orgA,
    );
    expect(row).toBeNull();
  });

  it("lists open requests for the org context; other org's request is not visible", async () => {
    const forA = await listOpenDispatcherRequestsForOrg({
      userId: fx.userA,
      orgId: fx.orgA,
    });
    const forB = await listOpenDispatcherRequestsForOrg({
      userId: fx.userB,
      orgId: fx.orgB,
    });
    expect(forA.map((r) => r.id)).toContain(fx.requestId);
    expect(forB.some((r) => r.id === fx.requestId)).toBe(false);
  });
});
