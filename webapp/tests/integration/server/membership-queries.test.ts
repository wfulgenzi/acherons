import { describe, it, expect, beforeEach } from "vitest";
import { adminDb } from "@/db";
import { memberships, organisations, user } from "@/db/schema";
import { fetchMembershipRowWithOrgForUser } from "@/server/membership/membership-queries";
import { resetIntegrationDatabase } from "../helpers/test-db";

const ORG_ID = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const MEMBERSHIP_USER_ID = "integration_membership_user";
const ORPHAN_USER_ID = "integration_membership_orphan";

describe("membership queries (integration)", () => {
  beforeEach(async () => {
    await resetIntegrationDatabase();
    const now = new Date();
    await adminDb.insert(organisations).values({
      id: ORG_ID,
      name: "Integration Membership Org",
      type: "clinic",
      createdAt: now,
      updatedAt: now,
    });

    await adminDb.insert(user).values([
      {
        id: MEMBERSHIP_USER_ID,
        name: "Member User",
        email: "member-integration@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: ORPHAN_USER_ID,
        name: "No Org User",
        email: "orphan-integration@example.test",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      },
    ]);

    await adminDb.insert(memberships).values({
      userId: MEMBERSHIP_USER_ID,
      orgId: ORG_ID,
      role: "admin",
    });
  });

  it("fetchMembershipRowWithOrgForUser returns membership + org for the session user", async () => {
    const row = await fetchMembershipRowWithOrgForUser(MEMBERSHIP_USER_ID);
    expect(row).not.toBeNull();
    expect(row!.memberships.userId).toBe(MEMBERSHIP_USER_ID);
    expect(row!.memberships.orgId).toBe(ORG_ID);
    expect(row!.organisations.name).toBe("Integration Membership Org");
  });

  it("fetchMembershipRowWithOrgForUser returns null when user has no membership", async () => {
    const row = await fetchMembershipRowWithOrgForUser(ORPHAN_USER_ID);
    expect(row).toBeNull();
  });
});
