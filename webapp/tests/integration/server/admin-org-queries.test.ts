import { describe, it, expect, beforeEach } from "vitest";
import { adminDb } from "@/db";
import { organisations } from "@/db/schema";
import {
  loadAdminOrgDetailBundle,
  loadAdminOrgListWithMemberCounts,
} from "@/server/admin/queries/admin-org-queries";
import { resetIntegrationDatabase } from "../helpers/test-db";

describe("admin org queries", () => {
  beforeEach(async () => {
    await resetIntegrationDatabase();
  });

  it("loadAdminOrgListWithMemberCounts matches seeded clinic", async () => {
    await adminDb.insert(organisations).values({
      name: "Integration Clinic",
      type: "clinic",
    });

    const { rows, memberCounts } =
      await loadAdminOrgListWithMemberCounts("clinic");

    expect(rows).toHaveLength(1);
    expect(rows[0].organisations.name).toBe("Integration Clinic");
    expect(
      memberCounts.filter((m) => m.orgId === rows[0].organisations.id),
    ).toHaveLength(0);
  });

  it("loadAdminOrgDetailBundle returns org and empty members", async () => {
    const [inserted] = await adminDb
      .insert(organisations)
      .values({ name: "Detail Org", type: "dispatch" })
      .returning({ id: organisations.id });

    const { row, memberRows } = await loadAdminOrgDetailBundle(inserted.id);

    expect(row?.organisations.name).toBe("Detail Org");
    expect(memberRows).toEqual([]);
  });
});
